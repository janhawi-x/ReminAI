# ReminAI - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- Git (optional)

---

## Step 1: Backend Setup (2 minutes)

### Install Python Dependencies
```powershell
cd c:\ReminAI\backend
pip install -r requirements.txt
```

### Configure Environment
The Groq API key is already configured in `.env`:
```
GROQ_API_KEY=your-groq-api-key
```

### Start Backend
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend running at: **http://localhost:8000**  
📚 API Docs at: **http://localhost:8000/docs**

---

## Step 2: Frontend Setup (1 minute)

### Install Dependencies (if not already done)
```powershell
cd c:\ReminAI\frontend
npm install
```

### Start Frontend
```powershell
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## Step 3: Explore the Dashboard

### Login
1. Open **http://localhost:5173** in your browser
2. Click **Login** (top right)
3. Use any email/password (demo mode)
4. Select **Caregiver** role

### View the Map
1. Navigate to **Location Tracking** in the sidebar
2. Interactive map should load showing:
   - Patient location marker (purple with pulse)
   - Safe zone indicators (teal badges)
   - Map controls (zoom, compass, scale)

### Test Features
- ✅ Zoom in/out
- ✅ Pan/drag the map
- ✅ Click "Locate Patient" button
- ✅ Hover over patient marker for info
- ✅ Create a new safe zone
- ✅ View location history

---

## 🎯 Key Features to Try

### 1. AI Voice Companion
- Go to **Patient > Companion** page
- Click microphone, say "Who is Sarah?"
- AI responds using Groq LLM + TTS

### 2. Memory Bank
- Go to **Caregiver > Memories**
- Upload photos with descriptions
- View in digital memory book

### 3. Family Management
- Go to **Caregiver > Family**
- Add family members with photos
- AI remembers relationships

### 4. Daily Routines
- Go to **Caregiver > Routines**
- Create medication/meal reminders
- Mark as completed

### 5. GPS Tracking
- Go to **Caregiver > Location**
- View patient location on map
- Configure safe zone geofences
- Receive alerts on boundary violations

---

## 🔧 Troubleshooting

### Backend won't start?
- Check Python version: `python --version` (need 3.10+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is free: `netstat -ano | findstr :8000`

### Frontend won't start?
- Check Node version: `node --version` (need 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules; npm install`
- Check port 5173 is free: `netstat -ano | findstr :5173`

### Map tiles not loading?
- Check internet connection (OpenFreeMap requires internet)
- Map will show fallback UI with coordinates if tiles fail
- Demo coordinates: New Delhi (28.6139°N, 77.2090°E)

### Face recognition not working?
- Install cmake: `pip install cmake`
- Install dlib: `pip install dlib`
- Install face_recognition: `pip install face-recognition`
- See backend README for detailed instructions

---

## 📁 Project Structure

```
ReminAI/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── core/         # Config, Firebase, demo data
│   │   ├── ai/           # RAG, LLM logic
│   │   ├── speech/       # TTS service
│   │   ├── vision/       # Face recognition
│   │   └── location/     # Geofencing logic
│   ├── .env              # Environment config (API keys)
│   └── requirements.txt  # Python dependencies
│
└── frontend/             # React + Vite frontend
    ├── src/
    │   ├── pages/        # Patient & caregiver pages
    │   ├── components/   # Reusable UI components
    │   ├── services/     # API client (axios)
    │   └── context/      # Auth & state management
    ├── .env              # Frontend config
    └── package.json      # Node dependencies
```

---

## 🔑 Environment Variables

### Backend (`.env`)
```bash
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3
TTS_VOICE=en-US-JennyNeural
```

### Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:8000
VITE_MAP_STYLE=https://tiles.openfreemap.org/styles/liberty
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TailwindCSS |
| **Backend** | Python 3.10 + FastAPI |
| **AI/LLM** | Groq API (Llama 3.3 70B) |
| **Speech** | Groq Whisper + edge-tts |
| **Face Recognition** | face_recognition (dlib) + OpenCV |
| **Maps** | MapLibre GL JS + OpenFreeMap |
| **Database** | Firebase Firestore (or demo in-memory store) |
| **Auth** | Firebase Authentication |

---

## 📚 Additional Documentation

- **Full Implementation Plan**: `implementation-plan.md`
- **Map Integration Details**: `OPENFREE_MAP_INTEGRATION.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`
- **API Documentation**: http://localhost:8000/docs (when backend running)

---

## 🆘 Need Help?

### Check API Status
```powershell
curl http://localhost:8000/health
```

### Test Location API
```powershell
curl "http://localhost:8000/api/location/latest?patient_id=patient-1"
```

### Test Safe Zones API
```powershell
curl "http://localhost:8000/api/safe-zones?patient_id=patient-1"
```

### View Logs
- Backend logs appear in terminal where uvicorn is running
- Frontend logs in browser console (F12)

---

## 🎯 What's Next?

1. **Explore the Dashboard** - Try all caregiver features
2. **Test Patient Interface** - Switch to patient role
3. **Configure Firebase** - For persistent data storage
4. **Build Android App** - For real GPS tracking
5. **Add More Memories** - Populate with real patient data
6. **Customize UI** - Match your branding
7. **Deploy to Production** - Host on cloud platform

---

**Happy Caregiving with ReminAI! 🧠💜**

Built with ❤️ using AI assistance
