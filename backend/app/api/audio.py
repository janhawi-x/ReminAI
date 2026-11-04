from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.firebase import get_db, get_bucket
from app.core.demo_store import demo_audio_memories
from app.services.groq_service import transcribe_audio
from datetime import datetime
import uuid
import os
import aiofiles

router = APIRouter(prefix='/audio', tags=['audio'])

LOCAL_AUDIO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "audio"))
os.makedirs(LOCAL_AUDIO_DIR, exist_ok=True)

@router.get('')
async def get_audio_memories(patient_id: str):
    """Retrieve all audio memories / voice messages for patient"""
    db = get_db()
    if not db:
        return [a for a in demo_audio_memories.values() if a.get('patient_id') == patient_id]

    try:
        docs = db.collection('audio_memories').where('patient_id', '==', patient_id).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        if not results:
            return [a for a in demo_audio_memories.values() if a.get('patient_id') == patient_id]
        return results
    except Exception as e:
        print(f"Firestore get_audio warning: {e}")
        return [a for a in demo_audio_memories.values() if a.get('patient_id') == patient_id]

@router.get('/detail/{audio_id}')
async def get_audio_memory(audio_id: str):
    """Retrieve single audio memory details"""
    db = get_db()
    if not db:
        if audio_id in demo_audio_memories:
            return demo_audio_memories[audio_id]
        raise HTTPException(404, 'Audio memory not found')

    try:
        doc = db.collection('audio_memories').document(audio_id).get()
        if doc.exists:
            return {'id': doc.id, **doc.to_dict()}
    except Exception:
        pass

    if audio_id in demo_audio_memories:
        return demo_audio_memories[audio_id]

    raise HTTPException(404, 'Audio memory not found')

@router.post('')
async def upload_audio_memory(
    patient_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(default=''),
    recorded_by: str = Form(default=''),
    audio_file: UploadFile = File(...)
):
    """Upload and transcribe voice memory / family message"""
    audio_id = str(uuid.uuid4())
    content = await audio_file.read()
    if len(content) < 50:
        raise HTTPException(400, 'Audio file too small or empty')

    # Transcribe with Whisper
    transcription = ""
    try:
        transcription = transcribe_audio(content, audio_file.filename or 'audio.webm')
    except Exception as e:
        print(f"Transcription warning for audio memory: {e}")
        transcription = "Audio memory recorded."

    # Save audio file
    ext = os.path.splitext(audio_file.filename or '')[1] or '.mp3'
    filename = f"{audio_id}{ext}"
    audio_url = f"/api/audio/file/{filename}"

    if get_bucket():
        try:
            bucket = get_bucket()
            blob = bucket.blob(f"audio_memories/{patient_id}/{filename}")
            blob.upload_from_string(content, content_type=audio_file.content_type)
            blob.make_public()
            audio_url = blob.public_url
        except Exception as e:
            print(f"Storage upload warning: {e}")

    # Also save local copy for direct serving
    local_path = os.path.join(LOCAL_AUDIO_DIR, filename)
    async with aiofiles.open(local_path, 'wb') as f:
        await f.write(content)

    record = {
        'id': audio_id,
        'patient_id': patient_id,
        'title': title,
        'description': description,
        'recorded_by': recorded_by,
        'audio_url': audio_url,
        'transcription': transcription,
        'created_at': datetime.utcnow().isoformat()
    }

    db = get_db()
    if db:
        try:
            db.collection('audio_memories').document(audio_id).set(record)
        except Exception:
            demo_audio_memories[audio_id] = record
    else:
        demo_audio_memories[audio_id] = record

    return record

@router.get('/file/{filename}')
async def serve_audio_file(filename: str):
    """Serve uploaded voice notes and audio memories"""
    safe_name = os.path.basename(filename)
    path = os.path.join(LOCAL_AUDIO_DIR, safe_name)
    if not os.path.exists(path):
        raise HTTPException(404, 'Audio file not found')
    return FileResponse(path, media_type='audio/mpeg')

@router.delete('/{audio_id}')
async def delete_audio_memory(audio_id: str):
    """Delete an audio memory"""
    db = get_db()
    if db:
        try:
            db.collection('audio_memories').document(audio_id).delete()
        except Exception:
            pass

    if audio_id in demo_audio_memories:
        del demo_audio_memories[audio_id]

    return {'status': 'deleted', 'id': audio_id}
