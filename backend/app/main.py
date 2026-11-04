from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.firebase import init_firebase
from app.speech.tts import TTS_OUTPUT_DIR

# Import all routers
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.memories import router as memories_router
from app.api.family import router as family_router
from app.api.companion import router as companion_router
from app.api.faces import router as faces_router
from app.api.routine import router as routine_router
from app.api.location import router as location_router
from app.api.alerts import router as alerts_router
from app.api.audio import router as audio_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all required directories exist
    os.makedirs(TTS_OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "memories")), exist_ok=True)
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "family")), exist_ok=True)
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "audio")), exist_ok=True)
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "face_embeddings")), exist_ok=True)
    
    # Initialize Firebase
    init_firebase()
    yield

app = FastAPI(
    title='Memory Guardian API',
    description='Backend API for ReminAI Memory Guardian - AI Companion & Safety Guardian for Dementia Care',
    version='1.0.0',
    lifespan=lifespan
)

# CORS middleware for development
_cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
if not _cors_origins:
    _cors_origins = [settings.frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mount static file directories
os.makedirs(TTS_OUTPUT_DIR, exist_ok=True)
app.mount('/tts_output', StaticFiles(directory=TTS_OUTPUT_DIR), name='tts_output')

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=uploads_dir), name='uploads')

# Include all API routers under /api prefix
api_routers = [
    auth_router,
    patients_router,
    memories_router,
    family_router,
    companion_router,
    faces_router,
    routine_router,
    location_router,
    alerts_router,
    audio_router,
]

for router in api_routers:
    app.include_router(router, prefix='/api')

@app.get('/')
async def root():
    return {
        'status': 'Memory Guardian API running',
        'version': '1.0.0',
        'docs_url': '/docs',
        'openapi_url': '/openapi.json'
    }

@app.get('/health')
async def health():
    return {'status': 'healthy', 'service': 'Memory Guardian API'}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
