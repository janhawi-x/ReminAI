import firebase_admin
from firebase_admin import credentials, firestore, storage
from pathlib import Path

from app.core.config import settings

_initialized = False
_db = None
_bucket = None


def init_firebase():
    global _initialized, _db, _bucket
    if _initialized:
        return

    try:
        key_path = Path(settings.firebase_service_account_key).expanduser()
        if key_path.is_file():
            cred = credentials.Certificate(str(key_path))
            options = {}
            if settings.firebase_storage_bucket:
                options["storageBucket"] = settings.firebase_storage_bucket

            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred, options)

            _db = firestore.client()
            # Storage is optional. A Firestore connection should remain usable
            # when Storage has not been enabled for a Firebase project yet.
            if settings.firebase_storage_bucket:
                try:
                    _bucket = storage.bucket()
                except Exception as storage_error:
                    print(f"Firebase Storage unavailable: {storage_error}")
            print("Firebase Firestore initialized with service account")
        else:
            print("Firebase service-account file not found. Running in DEMO mode.")
            # Avoid creating a Firestore client with application-default
            # credentials: it blocks startup while attempting remote auth.
            # API routes transparently use the in-memory demo store instead.
            _db = None

        _initialized = True

    except Exception as e:
        print(f"Firebase init warning: {e}")
        _initialized = True


def get_db():
    return _db


def get_bucket():
    return _bucket
