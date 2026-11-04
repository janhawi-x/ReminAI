import asyncio
import edge_tts
import os
import uuid
from app.core.config import settings

TTS_OUTPUT_DIR = "./tts_output"
os.makedirs(TTS_OUTPUT_DIR, exist_ok=True)

# Available voices indexed by language code
VOICE_MAP = {
    "en":        "en-US-JennyNeural",
    "en-female": "en-US-JennyNeural",
    "en-male":   "en-US-GuyNeural",
    "en-uk":     "en-GB-SoniaNeural",
    "hi":        "hi-IN-SwaraNeural",
    "hi-male":   "hi-IN-MadhurNeural",
    "bn":        "bn-IN-BashkarNeural",
    "ta":        "ta-IN-PallaviNeural",
    "te":        "te-IN-MohanNeural",
}


async def _generate_tts(text: str, voice: str) -> tuple[str, str]:
    """Async TTS generation using edge-tts."""
    filename = f"{uuid.uuid4()}.mp3"
    output_path = os.path.join(TTS_OUTPUT_DIR, filename)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    return output_path, filename


def text_to_speech(text: str, voice: str = None, language: str = None) -> tuple[str, str]:
    """
    Convert text to speech audio file.
    Returns (file_path, filename) tuple.
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    # Resolve voice
    if voice:
        selected_voice = voice
    elif language and language in VOICE_MAP:
        selected_voice = VOICE_MAP[language]
    else:
        selected_voice = settings.tts_voice or VOICE_MAP["en"]

    try:
        return asyncio.run(_generate_tts(text.strip(), selected_voice))
    except RuntimeError:
        # If event loop is already running (e.g., inside async context)
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_generate_tts(text.strip(), selected_voice))
        finally:
            loop.close()


def cleanup_old_files(max_files: int = 200):
    """Remove oldest TTS files if directory grows too large."""
    try:
        files = sorted(
            [os.path.join(TTS_OUTPUT_DIR, f) for f in os.listdir(TTS_OUTPUT_DIR)],
            key=os.path.getctime
        )
        while len(files) > max_files:
            os.remove(files.pop(0))
    except Exception:
        pass
