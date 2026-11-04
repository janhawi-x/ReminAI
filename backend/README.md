# Memory Guardian (ReminAI) - FastAPI Backend

AI Companion & Safety Guardian backend service for dementia care. Powered by **Groq Llama 3.3 70B**, **Whisper Large v3**, **Edge-TTS**, **Face Recognition / OpenCV**, **Geofencing & Safety Tracking**, and **Firebase Firestore / Storage**.

---

## Features

- **Warm AI Companion**: Context-grounded conversational agent tailored for Alzheimer's & dementia patients using Groq's high-speed Llama 3.3-70B.
- **Speech-to-Speech Flow**: Ultra-fast voice processing with Groq Whisper audio transcription and Microsoft Edge-TTS vocal synthesis.
- **RAG Memory Retrieval**: Dynamic retrieval of personal memories, family profiles, and daily routines to ground companion conversations without hallucinations.
- **Face Recognition**: Detects and recognizes family members from photos/video frames to reassure patients of who is visiting.
- **Geofencing & Wander Prevention**: Real-time geodesic boundary calculation with automatic breach alert generation.
- **Daily Routine & Medication Schedule**: Complete schedule management with completion toggling and reminders.
- **Audio Memories & Family Voice Notes**: Upload, store, transcribe, and playback voice messages from loved ones.
- **Full Demo Fallback**: Works completely offline or in demo mode without requiring Firebase credentials.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI entrypoint, CORS, static routes
│   ├── core/
│   │   ├── config.py                    # Pydantic Settings
│   │   ├── firebase.py                  # Firebase Admin SDK init & demo fallback
│   │   └── demo_store.py                # In-memory mock store for demo testing
│   ├── services/
│   │   └── groq_service.py              # Groq Whisper transcription & Llama 3.3 LLM
│   ├── speech/
│   │   └── tts.py                       # Edge-TTS voice synthesis
│   ├── vision/
│   │   └── face_recognition_service.py # Face encoding, storage & matching
│   ├── location/
│   │   └── geofence.py                  # Geodesic geofence & safety alert formatter
│   ├── ai/
│   │   └── rag.py                       # Context retrieval from patient memories
│   └── api/
│       ├── auth.py                      # Auth & demo token login
│       ├── patients.py                  # Patient profiles CRUD
│       ├── memories.py                  # Personal memory book & photos
│       ├── family.py                    # Family member directory
│       ├── companion.py                 # Voice & text companion endpoints
│       ├── faces.py                     # Face registration & recognition
│       ├── routine.py                   # Daily routines & medication
│       ├── location.py                  # GPS updates & geofence tracking
│       ├── alerts.py                    # Safety alerts & acknowledgement
│       └── audio.py                     # Audio memories & family notes
├── tts_output/                          # Synthesized MP3 audio files
├── uploads/                             # Uploaded memories, photos & audio
├── face_embeddings/                     # Stored face vectors
├── requirements.txt                     # Python dependencies
├── .env                                 # Environment variables (configured)
├── .env.example                         # Environment template
└── README.md                            # Documentation
```

---

## Installation & Setup

### 1. Requirements

- Python 3.10+ (Tested on Python 3.13)
- Windows / macOS / Linux

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` or edit the existing `.env` file:

```ini
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
TTS_VOICE=en-US-JennyNeural
```

*(Note: If `serviceAccountKey.json` is not provided, the server automatically operates in Demo Mode with persistent in-memory data for Eleanor Vance & family).*

---

## Running the Server

Start the development server with auto-reload:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Or run directly:

```bash
python app/main.py
```

### Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## API Endpoints Overview

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Health** | `/` | GET | Root status check |
| **Health** | `/health` | GET | Health verification |
| **Auth** | `/api/auth/verify-token` | POST | Verify Firebase ID token |
| **Auth** | `/api/auth/login-demo` | POST | Instant demo login for caregiver/patient |
| **Auth** | `/api/auth/me` | GET | Current user profile |
| **Companion** | `/api/companion/chat` | POST | Voice input -> Whisper -> LLM -> Edge-TTS |
| **Companion** | `/api/companion/text-chat` | POST | Text input -> LLM -> Edge-TTS |
| **Companion** | `/api/companion/audio/{filename}` | GET | Stream synthesized TTS MP3 |
| **Companion** | `/api/companion/history/{patient_id}`| GET | Conversation history |
| **Memories** | `/api/memories` | GET | List memories by patient and category |
| **Memories** | `/api/memories` | POST | Create memory with image upload |
| **Memories** | `/api/memories/{memory_id}` | PUT/DELETE | Update or delete memory |
| **Family** | `/api/family` | GET | List family members for patient |
| **Family** | `/api/family` | POST | Create family member with photo |
| **Family** | `/api/family/{member_id}` | PUT/DELETE | Update or delete family member |
| **Faces** | `/api/faces/register` | POST | Register face embedding for family member |
| **Faces** | `/api/faces/recognize` | POST | Recognize person from photo |
| **Faces** | `/api/faces/patient/{patient_id}`| GET | List registered face embeddings |
| **Routine** | `/api/routine` | GET | Get daily routine schedule |
| **Routine** | `/api/routine` | POST | Create routine item |
| **Routine** | `/api/routine/{item_id}/toggle` | PATCH | Toggle routine completion |
| **Location** | `/api/location` | POST | Record GPS & trigger geofence alerts |
| **Location** | `/api/location/latest/{patient_id}`| GET | Latest known coordinates |
| **Location** | `/api/location/history/{patient_id}`| GET | GPS location trail |
| **Location** | `/api/location/safe-zones/{patient_id}` | GET | List safe zones |
| **Location** | `/api/location/safe-zones` | POST | Create safe zone perimeter |
| **Alerts** | `/api/alerts` | GET | List safety alerts |
| **Alerts** | `/api/alerts/{alert_id}/acknowledge` | PATCH | Acknowledge alert |
| **Audio** | `/api/audio` | GET | List audio memories |
| **Audio** | `/api/audio` | POST | Upload voice note & auto-transcribe |
| **Audio** | `/api/audio/file/{filename}` | GET | Stream audio memory file |
