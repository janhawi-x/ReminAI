from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Header, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.firebase import get_db, get_bucket
from app.core.demo_store import demo_family
from app.core.local_store import _connect, row_dict
from datetime import datetime, timezone
import uuid
import os
import aiofiles

router = APIRouter(prefix='/family', tags=['family'])


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

LOCAL_FAMILY_PHOTO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "family"))
os.makedirs(LOCAL_FAMILY_PHOTO_DIR, exist_ok=True)

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    key_memories: Optional[str] = None
    is_emergency_contact: Optional[bool] = None

@router.get('')
async def get_family_members(
    patient_id: str = Query(..., description="The patient ID"),
    current_user: dict = Depends(get_current_user)
):
    """Get all family members for a patient"""
    verify_patient_access(patient_id, current_user)
    print(f"👨‍👩‍👦 Fetching family members for patient_id: {patient_id}")
    
    db = get_db()
    if not db:
        print("ℹ️ Firestore not configured")
        return []

    try:
        docs = db.collection('family_members').where('patient_id', '==', patient_id).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        print(f"✅ Found {len(results)} family members in Firestore")
        return results
    except Exception as e:
        print(f"⚠️ Firestore get_family warning: {e}")
        return []

@router.get('/{member_id}')
async def get_family_member(member_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific family member by ID"""
    print(f"🔍 Fetching family member: {member_id}")
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not configured')

    try:
        doc = db.collection('family_members').document(member_id).get()
        if doc.exists:
            member_data = {'id': doc.id, **doc.to_dict()}
            # Verify user has access to this patient
            verify_patient_access(member_data['patient_id'], current_user)
            return member_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore get_family_member warning: {e}")

    raise HTTPException(status_code=404, detail='Family member not found')

@router.post('', status_code=201)
async def create_family_member(
    patient_id: str = Form(...),
    name: str = Form(...),
    relationship: str = Form(...),
    description: Optional[str] = Form(default=None),
    notes: Optional[str] = Form(default=None),
    phone: Optional[str] = Form(default=None),
    phone_number: Optional[str] = Form(default=None),
    email: Optional[str] = Form(default=''),
    photo_url: Optional[str] = Form(default=''),
    key_memories: Optional[str] = Form(default=''),
    is_emergency_contact: Optional[bool] = Form(default=False),
    photo: Optional[UploadFile] = File(default=None),
    current_user: dict = Depends(get_current_user)
):
    """Create a new family member with optional photo upload (multipart/form-data)"""
    verify_patient_access(patient_id, current_user)
    print(f"➕ Creating family member '{name}' for patient: {patient_id}")
    db = get_db()
    member_id = str(uuid.uuid4())
    final_photo_url = photo_url or ""

    if photo:
        content = await photo.read()
        bucket = get_bucket()
        if bucket:
            try:
                blob = bucket.blob(f'family/{patient_id}/{member_id}/{photo.filename}')
                blob.upload_from_string(content, content_type=photo.content_type)
                blob.make_public()
                final_photo_url = blob.public_url
                print(f"✅ Uploaded photo to Firebase Storage: {final_photo_url}")
            except Exception as e:
                print(f"⚠️ Firebase storage upload warning: {e}")
        
        if not final_photo_url:
            try:
                ext = os.path.splitext(photo.filename or '')[1] or '.jpg'
                local_name = f'{member_id}{ext}'
                local_path = os.path.join(LOCAL_FAMILY_PHOTO_DIR, local_name)
                async with aiofiles.open(local_path, 'wb') as f:
                    await f.write(content)
                final_photo_url = f'/uploads/family/{local_name}'
                print(f"✅ Saved photo locally: {final_photo_url}")
            except Exception as e:
                print(f"⚠️ Local photo save warning: {e}")

    final_desc = description if description is not None else (notes or "")
    final_phone = phone if phone is not None else (phone_number or "")

    member_data = {
        'id': member_id,
        'patient_id': patient_id,
        'name': name,
        'relationship': relationship,
        'description': final_desc,
        'notes': final_desc,
        'phone': final_phone,
        'phone_number': final_phone,
        'email': email or "",
        'photo_url': final_photo_url,
        'key_memories': key_memories or "",
        'is_emergency_contact': bool(is_emergency_contact),
        'created_at': datetime.now(timezone.utc).isoformat()
    }

    if db:
        try:
            db.collection('family_members').document(member_id).set(member_data)
            print(f"✅ Family member {member_id} saved to Firestore")
            return member_data
        except Exception as e:
            print(f"⚠️ Firestore create_family_member error: {e}")
            raise HTTPException(status_code=500, detail='Failed to create family member')
    else:
        raise HTTPException(status_code=503, detail='Database not configured')

@router.put('/{member_id}')
async def update_family_member(member_id: str, data: FamilyMemberUpdate, current_user: dict = Depends(get_current_user)):
    """Update family member details"""
    print(f"✏️ Updating family member: {member_id}")
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Sync phone and phone_number if either provided
    if 'phone' in update_dict and 'phone_number' not in update_dict:
        update_dict['phone_number'] = update_dict['phone']
    elif 'phone_number' in update_dict and 'phone' not in update_dict:
        update_dict['phone'] = update_dict['phone_number']

    # Sync description and notes if either provided
    if 'description' in update_dict and 'notes' not in update_dict:
        update_dict['notes'] = update_dict['description']
    elif 'notes' in update_dict and 'description' not in update_dict:
        update_dict['description'] = update_dict['notes']

    if not update_dict:
        return {'status': 'no_changes', 'id': member_id}

    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not configured')
    
    try:
        doc_ref = db.collection('family_members').document(member_id)
        doc = doc_ref.get()
        if doc.exists:
            member_data = doc.to_dict()
            # Verify user has access to this patient
            verify_patient_access(member_data['patient_id'], current_user)
            doc_ref.update(update_dict)
            updated = doc_ref.get().to_dict()
            return {'id': member_id, **updated}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore update_family error: {e}")
        raise HTTPException(status_code=500, detail='Failed to update family member')

    raise HTTPException(status_code=404, detail='Family member not found')

@router.delete('/{member_id}')
async def delete_family_member(member_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a family member"""
    print(f"🗑️ Deleting family member: {member_id}")
    db = get_db()
    if not db:
        raise HTTPException(status_code=503, detail='Database not configured')
    
    try:
        # First verify access
        doc = db.collection('family_members').document(member_id).get()
        if doc.exists:
            member_data = doc.to_dict()
            verify_patient_access(member_data['patient_id'], current_user)
            db.collection('family_members').document(member_id).delete()
            print(f"✅ Family member {member_id} deleted from Firestore")
            return {'status': 'deleted', 'id': member_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore delete_family error: {e}")
        raise HTTPException(status_code=500, detail='Failed to delete family member')

    raise HTTPException(status_code=404, detail='Family member not found')
