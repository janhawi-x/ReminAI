from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.firebase import get_db
from app.core.demo_store import demo_alerts, demo_family, demo_memories, demo_patients, demo_routines
from app.core.local_store import _connect, row_dict
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix='/patients', tags=['patients'])


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Verify JWT token and return current user."""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Authentication required')
    token = authorization.removeprefix('Bearer ').strip()
    with _connect() as conn:
        user = row_dict(conn.execute(
            'SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.token = ?',
            (token,)
        ).fetchone())
    if not user:
        raise HTTPException(401, 'Session is invalid or expired')
    return user


def verify_patient_access(patient_id: str, current_user: dict) -> None:
    """Verify user has access to this patient."""
    if current_user['patient_id'] != patient_id:
        raise HTTPException(403, 'Access denied: You do not have permission to access this patient')


class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    stage_of_dementia: Optional[str] = None
    primary_caregiver_id: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_notes: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None


class PatientUpdate(PatientCreate):
    name: Optional[str] = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _record(document):
    return {'id': document.id, **document.to_dict()}


@router.get('')
def list_patients(limit: int = 50, current_user: dict = Depends(get_current_user)):
    # Only return patients this user has access to
    patient_id = current_user['patient_id']
    
    # Check Firestore first
    db = get_db()
    if db:
        try:
            records = [_record(doc) for doc in db.collection('patients').where('id', '==', patient_id).limit(limit).stream()]
            if records:
                return records
        except Exception as error:
            print(f'Firestore list patients warning: {error}')
    
    # Fallback to SQLite
    with _connect() as conn:
        patient = row_dict(conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone())
    
    return [patient] if patient else []


@router.get('/{patient_id}')
def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    verify_patient_access(patient_id, current_user)
    
    # Check Firestore first
    db = get_db()
    if db:
        try:
            document = db.collection('patients').document(patient_id).get()
            if document.exists:
                return _record(document)
        except Exception as error:
            print(f'Firestore get patient warning: {error}')
    
    # Fallback to SQLite (where auth.py creates patients)
    with _connect() as conn:
        patient = row_dict(conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone())
    
    if patient:
        return patient
    
    raise HTTPException(404, 'Patient not found')


@router.post('', status_code=201)
def create_patient(data: PatientCreate):
    record = {'id': f'PAT-{uuid.uuid4().hex[:8].upper()}', **data.model_dump(), 'created_at': _now(), 'updated_at': _now()}
    db = get_db()
    if db:
        try:
            db.collection('patients').document(record['id']).set(record)
            return record
        except Exception as error:
            print(f'Firestore create patient warning: {error}')
    demo_patients[record['id']] = record
    return record


@router.put('/{patient_id}')
def update_patient(patient_id: str, data: PatientUpdate, current_user: dict = Depends(get_current_user)):
    verify_patient_access(patient_id, current_user)
    
    update = {key: value for key, value in data.model_dump().items() if value is not None}
    if not update:
        return get_patient(patient_id, current_user)
    update['updated_at'] = _now()
    
    # Try Firestore first
    db = get_db()
    if db:
        try:
            reference = db.collection('patients').document(patient_id)
            if reference.get().exists:
                reference.update(update)
                return _record(reference.get())
        except Exception as error:
            print(f'Firestore update patient warning: {error}')
    
    # Fallback to SQLite
    with _connect() as conn:
        patient = row_dict(conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone())
        if patient:
            # Build UPDATE SQL dynamically
            set_clause = ', '.join([f'{key} = ?' for key in update.keys()])
            values = list(update.values()) + [patient_id]
            conn.execute(f'UPDATE patients SET {set_clause} WHERE id = ?', values)
            updated_patient = row_dict(conn.execute('SELECT * FROM patients WHERE id = ?', (patient_id,)).fetchone())
            return updated_patient
    
    raise HTTPException(404, 'Patient not found')


@router.get('/{patient_id}/stats')
def patient_stats(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Dashboard counters for a patient, backed by Firestore when available."""
    verify_patient_access(patient_id, current_user)
    
    collections = {
        'memoriesCount': 'memories',
        'familyCount': 'family_members',
        'todayEventsCount': 'daily_routines',
        'activeAlertsCount': 'alerts',
    }
    db = get_db()
    stats = {}
    for field, collection in collections.items():
        try:
            if db:
                docs = db.collection(collection).where('patient_id', '==', patient_id).stream()
                records = [doc.to_dict() for doc in docs]
                if field == 'activeAlertsCount':
                    stats[field] = sum(not item.get('acknowledged', False) for item in records)
                else:
                    stats[field] = len(records)
            else:
                stats[field] = 0
        except Exception as error:
            print(f'Patient stats warning for {collection}: {error}')
            stats[field] = 0
    return stats


@router.get('/{patient_id}/caregivers')
def caregivers(patient_id: str, current_user: dict = Depends(get_current_user)):
    verify_patient_access(patient_id, current_user)
    # Query SQLite for caregivers linked to this patient
    with _connect() as conn:
        rows = conn.execute('''
            SELECT users.id, users.name, users.email, patient_links.relationship
            FROM patient_links
            JOIN users ON patient_links.user_id = users.id
            WHERE patient_links.patient_id = ? AND users.role = 'caregiver'
        ''', (patient_id,)).fetchall()
    return [dict(row) for row in rows]
