from groq import Groq
from app.core.config import settings
from typing import List, Dict, Optional
import os
import tempfile

client = Groq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are Memory Guardian, a warm, patient, and caring AI companion for someone living with dementia.

Your personality:
- Always kind, gentle, patient, and deeply reassuring
- Never test the person's memory or make them feel bad for forgetting
- Never invent or fabricate personal information about people, places, or events
- Use simple, clear, friendly language — like talking to a dear friend
- Keep responses SHORT and comforting (2-4 sentences maximum)
- Always acknowledge what the person said with warmth

Important rules:
- ONLY discuss information explicitly provided in the memory context below
- If something is not in the context, say gently: "I don't have that information yet"
- Never diagnose medical conditions or give medical advice
- If someone seems confused or distressed, respond with warmth and suggest calling a family member
- Never make up family names, places, dates, or stories
- If asked who you are, say: "I am Memory Guardian, your personal memory companion"
"""


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio using Groq Whisper API."""
    try:
        suffix = os.path.splitext(filename)[-1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model=settings.groq_whisper_model,
                file=(filename, audio_file, "audio/webm"),
                language="en",
            )

        os.unlink(tmp_path)
        return transcription.text.strip()

    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise Exception(f"Transcription failed: {str(e)}")


def generate_companion_response(
    user_message: str,
    memory_context: str,
    patient_name: str = "friend",
    conversation_history: Optional[List[Dict]] = None,
) -> str:
    """Generate personalised AI response using Groq LLM with RAG memory context."""
    try:
        context_block = f"""
Patient's name: {patient_name}

Personal memory context (use ONLY this verified information to answer):
{memory_context if memory_context else "No personal memories have been uploaded yet."}
"""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context_block}
        ]

        if conversation_history:
            # Include last 3 exchanges (6 messages)
            for msg in conversation_history[-6:]:
                messages.append(msg)

        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            max_tokens=200,
            temperature=0.65,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        raise Exception(f"Response generation failed: {str(e)}")


def embed_text(text: str) -> List[float]:
    """
    Placeholder for semantic embedding.
    Groq does not currently provide an embeddings endpoint;
    use sentence-transformers locally or OpenAI embeddings API
    if semantic search is required in future.
    """
    return []
