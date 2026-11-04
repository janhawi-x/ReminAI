from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.core.firebase import get_db, get_bucket
from app.core.demo_store import demo_memories
from app.core.local_store import _connect, row_dict
from datetime import datetime
import uuid
import os
import aiofiles

router = APIRouter(prefix='/memories', tags=['memories'])


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

LOCAL_UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "memories"))
os.makedirs(LOCAL_UPLOADS_DIR, exist_ok=True)

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    associated_members: Optional[str] = None
    media_url: Optional[str] = None

@router.get('')
async def get_memories(
    patient_id: str,
    category: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    verify_patient_access(patient_id, current_user)
    db = get_db()
    if not db:
        print("ℹ️ Firestore not configured")
        return []
    
    try:
        query = db.collection('memories').where('patient_id', '==', patient_id)
        if category and category != 'All':
            query = query.where('category', '==', category)
        docs = query.limit(limit).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        print(f"✅ Found {len(results)} memories in Firestore")
        return results
    except Exception as e:
        print(f"⚠️ Firestore get_memories error: {e}")
        return []

@router.get('/{memory_id}')
async def get_memory(memory_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc = db.collection('memories').document(memory_id).get()
        if doc.exists:
            memory_data = {'id': doc.id, **doc.to_dict()}
            verify_patient_access(memory_data['patient_id'], current_user)
            return memory_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore get_memory error: {e}")

    raise HTTPException(404, 'Memory not found')

@router.post('')
async def create_memory(
    patient_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(default=''),
    category: str = Form(default='General'),
    date: str = Form(default=''),
    location: str = Form(default=''),
    associated_members: str = Form(default='[]'),
    uploaded_by: str = Form(default=''),
    media: Optional[UploadFile] = File(default=None),
    current_user: dict = Depends(get_current_user)
):
    verify_patient_access(patient_id, current_user)
    db = get_db()
    memory_id = str(uuid.uuid4())
    media_url = ''
    
    # Try Firebase Storage first, fallback to local static file
    if media and get_bucket():
        try:
            bucket = get_bucket()
            blob = bucket.blob(f'memories/{patient_id}/{memory_id}/{media.filename}')
            content = await media.read()
            blob.upload_from_string(content, content_type=media.content_type)
            blob.make_public()
            media_url = blob.public_url
        except Exception as e:
            print(f'Storage upload warning: {e}')
    elif media:
        try:
            content = await media.read()
            ext = os.path.splitext(media.filename or '')[1] or '.jpg'
            local_filename = f'{memory_id}{ext}'
            local_path = os.path.join(LOCAL_UPLOADS_DIR, local_filename)
            async with aiofiles.open(local_path, 'wb') as out_f:
                await out_f.write(content)
            media_url = f'/uploads/memories/{local_filename}'
        except Exception as e:
            print(f'Local media save warning: {e}')
    
    memory_data = {
        'id': memory_id,
        'patient_id': patient_id,
        'title': title,
        'description': description,
        'category': category,
        'date': date,
        'location': location,
        'associated_members': associated_members,
        'uploaded_by': uploaded_by,
        'media_url': media_url,
        'created_at': datetime.utcnow().isoformat()
    }

    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        db.collection('memories').document(memory_id).set(memory_data)
        print(f"✅ Memory {memory_id} saved to Firestore")
        return {'id': memory_id, **memory_data}
    except Exception as e:
        print(f"⚠️ Firestore create_memory error: {e}")
        raise HTTPException(500, 'Failed to create memory')

@router.put('/{memory_id}')
async def update_memory(memory_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc = db.collection('memories').document(memory_id).get()
        if doc.exists:
            memory_data = doc.to_dict()
            verify_patient_access(memory_data['patient_id'], current_user)
            db.collection('memories').document(memory_id).update(data)
            return {'status': 'updated', 'id': memory_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore update_memory error: {e}")
        raise HTTPException(500, 'Failed to update memory')
    
    raise HTTPException(404, 'Memory not found')

@router.delete('/{memory_id}')
async def delete_memory(memory_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(503, 'Database not configured')
    
    try:
        doc = db.collection('memories').document(memory_id).get()
        if doc.exists:
            memory_data = doc.to_dict()
            verify_patient_access(memory_data['patient_id'], current_user)
            db.collection('memories').document(memory_id).delete()
            print(f"✅ Memory {memory_id} deleted")
            return {'status': 'deleted', 'id': memory_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Firestore delete_memory error: {e}")
        raise HTTPException(500, 'Failed to delete memory')
    
    raise HTTPException(404, 'Memory not found')
