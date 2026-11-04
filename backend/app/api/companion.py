from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.services.groq_service import transcribe_audio, generate_companion_response
from app.speech.tts import text_to_speech, TTS_OUTPUT_DIR
from app.ai.rag import retrieve_relevant_memories
from app.core.firebase import get_db
from app.core.demo_store import demo_conversations
from datetime import datetime
import uuid
import os

router = APIRouter(prefix='/companion', tags=['companion'])

class TextChatRequest(BaseModel):
    patient_id: str
    message: str
    patient_name: Optional[str] = "friend"

@router.post('/chat')
async def chat(
    audio: UploadFile = File(...),
    patient_id: str = Form(...),
    patient_name: str = Form(default='friend'),
    background_tasks: BackgroundTasks = None
):
    """Process audio, transcribe, generate AI response, return TTS audio"""
    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) < 100:
            raise HTTPException(400, 'Audio file too small')
        
        # Step 1: Transcribe using Groq Whisper
        transcription = transcribe_audio(audio_bytes, audio.filename or 'audio.webm')
        if not transcription.strip():
            return {
                'transcription': '',
                'response': 'I did not catch that. Could you please speak again?',
                'audio_url': None
            }
        
        # Step 2: Retrieve memories for RAG
        memory_context = retrieve_relevant_memories(patient_id, transcription)
        
        # Step 3: Generate response with Groq LLM
        ai_response = generate_companion_response(
            user_message=transcription,
            memory_context=memory_context,
            patient_name=patient_name
        )
        
        # Step 4: TTS synthesis
        audio_path, audio_filename = text_to_speech(ai_response)
        audio_url = f'/api/companion/audio/{audio_filename}'
        
        # Step 5: Save conversation to Firestore or demo store
        conv_record = {
            'id': str(uuid.uuid4()),
            'patient_id': patient_id,
            'user_message': transcription,
            'ai_response': ai_response,
            'audio_url': audio_url,
            'timestamp': datetime.utcnow().isoformat()
        }

        db = get_db()
        if db:
            try:
                db.collection('conversations').add(conv_record)
            except Exception as e:
                print(f"Firestore conv save warning: {e}")
                demo_conversations.insert(0, conv_record)
        else:
            demo_conversations.insert(0, conv_record)
        
        return {
            'transcription': transcription,
            'response': ai_response,
            'audio_url': audio_url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f'Companion error: {str(e)}')

@router.post('/text-chat')
async def text_chat(req: TextChatRequest):
    """Direct text chat with AI companion (supports text mode and fallback)"""
    try:
        if not req.message.strip():
            raise HTTPException(400, 'Message cannot be empty')
        
        memory_context = retrieve_relevant_memories(req.patient_id, req.message)
        ai_response = generate_companion_response(
            user_message=req.message,
            memory_context=memory_context,
            patient_name=req.patient_name
        )
        
        audio_path, audio_filename = text_to_speech(ai_response)
        audio_url = f'/api/companion/audio/{audio_filename}'
        
        conv_record = {
            'id': str(uuid.uuid4()),
            'patient_id': req.patient_id,
            'user_message': req.message,
            'ai_response': ai_response,
            'audio_url': audio_url,
            'timestamp': datetime.utcnow().isoformat()
        }

        db = get_db()
        if db:
            try:
                db.collection('conversations').add(conv_record)
            except Exception:
                demo_conversations.insert(0, conv_record)
        else:
            demo_conversations.insert(0, conv_record)

        return {
            'transcription': req.message,
            'response': ai_response,
            'audio_url': audio_url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f'Text chat error: {str(e)}')

@router.get('/audio/{filename}')
async def get_audio(filename: str):
    """Serve synthesized TTS audio files"""
    # Safe path validation
    safe_filename = os.path.basename(filename)
    path = os.path.join(TTS_OUTPUT_DIR, safe_filename)
    if not os.path.exists(path):
        raise HTTPException(404, 'Audio file not found')
    return FileResponse(path, media_type='audio/mpeg')

@router.get('/history/{patient_id}')
async def get_history(patient_id: str):
    """Retrieve conversation history for patient"""
    db = get_db()
    if not db:
        return [c for c in demo_conversations if c.get('patient_id') == patient_id]
    
    try:
        docs = db.collection('conversations').where('patient_id', '==', patient_id).order_by('timestamp', direction='DESCENDING').limit(20).stream()
        results = [doc.to_dict() for doc in docs]
        return results if results else [c for c in demo_conversations if c.get('patient_id') == patient_id]
    except Exception as e:
        print(f"Firestore history query warning: {e}")
        return [c for c in demo_conversations if c.get('patient_id') == patient_id]
