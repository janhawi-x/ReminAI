from fastapi import APIRouter, HTTPException, Query, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.core.firebase import get_db
from app.core.demo_store import demo_routines
from app.core.local_store import _connect, row_dict
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix='/routine', tags=['routine'])


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

class RoutineCreate(BaseModel):
    patient_id: str
    title: str
    time: str = Field(..., description="Time of routine, e.g. 08:30 AM or 14:00")
    type: Optional[str] = Field("activity", description="meal/medication/appointment/visit/activity")
    category: Optional[str] = None  # alias for type
    description: Optional[str] = ""
    repeat: Optional[str] = Field("daily", description="none/daily/weekly")
    reminder_minutes: Optional[int] = 15
    dosage: Optional[str] = ""
    notes: Optional[str] = ""

class RoutineUpdate(BaseModel):
    title: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    repeat: Optional[str] = None
    reminder_minutes: Optional[int] = None
    dosage: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None

class CompleteRequest(BaseModel):
    completed: Optional[bool] = True
    completed_at: Optional[str] = None

@router.get('')
async def get_routines(
    patient_id: str = Query(..., description="Patient ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get all daily routines for a patient"""
    verify_patient_access(patient_id, current_user)
    print(f"📅 Fetching routines for patient: {patient_id}")
    
    db = get_db()
    if not db:
        print("ℹ️ Firestore not configured")
        return []

    try:
        docs = db.collection('daily_routines').where('patient_id', '==', patient_id).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        print(f"✅ Found {len(results)} routines in Firestore")
        # Sort by time string
        return sorted(results, key=lambda x: str(x.get('time', '')))
    except Exception as e:
        print(f"⚠️ Error fetching routines from Firestore: {e}")
        return []

@router.get('/{item_id}')
async def get_routine(item_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific routine item by ID"""
    print(f"🔍 Fetching routine: {item_id}")
    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')

    try:
        doc = db.collection('daily_routines').document(item_id).get()
        if doc.exists:
            routine_data = {'id': doc.id, **doc.to_dict()}
            verify_patient_access(routine_data['patient_id'], current_user)
            return routine_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error fetching routine from Firestore: {e}")

    raise HTTPException(status_code=404, detail="Routine item not found")

@router.post('', status_code=201)
async def create_routine(data: RoutineCreate, current_user: dict = Depends(get_current_user)):
    """Create a new daily routine item"""
    verify_patient_access(data.patient_id, current_user)
    item_id = str(uuid.uuid4())
    print(f"➕ Creating routine '{data.title}' ({data.time}) with ID: {item_id}")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    routine_type = data.type or data.category or "activity"

    routine_data = {
        'id': item_id,
        'patient_id': data.patient_id,
        'title': data.title,
        'time': data.time,
        'type': routine_type,
        'category': routine_type,
        'description': data.description or "",
        'repeat': data.repeat or "daily",
        'reminder_minutes': data.reminder_minutes if data.reminder_minutes is not None else 15,
        'dosage': data.dosage or "",
        'notes': data.notes or "",
        'completed': False,
        'completed_at': None,
        'created_at': now_iso,
        'updated_at': now_iso
    }

    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        db.collection('daily_routines').document(item_id).set(routine_data)
        print(f"✅ Routine {item_id} saved to Firestore")
        return routine_data
    except Exception as e:
        print(f"⚠️ Firestore create routine error: {e}")
        raise HTTPException(500, 'Failed to create routine')

@router.put('/{item_id}')
async def update_routine(item_id: str, data: RoutineUpdate, current_user: dict = Depends(get_current_user)):
    """Update a daily routine item"""
    print(f"✏️ Updating routine: {item_id}")
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Sync type and category if either provided
    if 'type' in update_dict and 'category' not in update_dict:
        update_dict['category'] = update_dict['type']
    elif 'category' in update_dict and 'type' not in update_dict:
        update_dict['type'] = update_dict['category']

    if not update_dict:
        return {'status': 'no_changes', 'id': item_id}

    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc_ref = db.collection('daily_routines').document(item_id)
        doc = doc_ref.get()
        if doc.exists:
            routine_data = doc.to_dict()
            verify_patient_access(routine_data['patient_id'], current_user)
            doc_ref.update(update_dict)
            updated = doc_ref.get().to_dict()
            return {'id': item_id, **updated}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore update routine error: {e}")
        raise HTTPException(500, 'Failed to update routine')

    raise HTTPException(status_code=404, detail="Routine item not found")

@router.delete('/{item_id}')
async def delete_routine(item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a routine item"""
    print(f"🗑️ Deleting routine: {item_id}")
    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc = db.collection('daily_routines').document(item_id).get()
        if doc.exists:
            routine_data = doc.to_dict()
            verify_patient_access(routine_data['patient_id'], current_user)
            db.collection('daily_routines').document(item_id).delete()
            print(f"✅ Routine {item_id} deleted from Firestore")
            return {'status': 'deleted', 'id': item_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore delete routine error: {e}")
        raise HTTPException(500, 'Failed to delete routine')

    raise HTTPException(status_code=404, detail="Routine item not found")

@router.post('/{item_id}/complete')
async def complete_routine(item_id: str, body: Optional[CompleteRequest] = None, current_user: dict = Depends(get_current_user)):
    """Mark a routine item as completed (or toggle completed status)"""
    is_completed = body.completed if body and body.completed is not None else True
    now_iso = (body.completed_at if body and body.completed_at else None) or datetime.now(timezone.utc).isoformat()
    completed_at = now_iso if is_completed else None

    print(f"✅ Marking routine {item_id} as completed={is_completed}")

    update_data = {
        'completed': is_completed,
        'completed_at': completed_at,
        'updated_at': now_iso
    }

    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc_ref = db.collection('daily_routines').document(item_id)
        doc = doc_ref.get()
        if doc.exists:
            routine_data = doc.to_dict()
            verify_patient_access(routine_data['patient_id'], current_user)
            doc_ref.update(update_data)
            updated = doc_ref.get().to_dict()
            return {'id': item_id, **updated}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore complete routine error: {e}")
        raise HTTPException(500, 'Failed to complete routine')

    raise HTTPException(status_code=404, detail="Routine item not found")
