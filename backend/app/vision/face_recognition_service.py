import cv2
import numpy as np
import os
import json
import uuid
from typing import Optional, Dict, List, Tuple

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition library not available. Face features will use fallback detection.")

EMBEDDINGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "face_embeddings"))
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

# OpenCV Haar cascade fallback for face detection
_face_cascade = None
def _get_cascade():
    global _face_cascade
    if _face_cascade is None:
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            _face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            _face_cascade = None
    return _face_cascade

def _bytes_to_rgb(image_bytes: bytes) -> Optional[np.ndarray]:
    """Convert raw image bytes to an RGB numpy array."""
    if not image_bytes:
        return None
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return None
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

def encode_face(image_bytes: bytes) -> Optional[List[float]]:
    """Extract face encoding from image bytes (128-d vector). Returns None if no face found."""
    if not image_bytes:
        return None

    if FACE_RECOGNITION_AVAILABLE:
        try:
            rgb = _bytes_to_rgb(image_bytes)
            if rgb is not None:
                encodings = face_recognition.face_encodings(rgb)
                if encodings:
                    return encodings[0].tolist()
        except Exception as e:
            print(f"face_recognition encoding error: {e}")

    # Fallback face detection using OpenCV Haar Cascade + histogram descriptor
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            cascade = _get_cascade()
            if cascade is not None:
                faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
                if len(faces) > 0:
                    x, y, w, h = faces[0]
                    face_crop = cv2.resize(gray[y:y+h, x:x+w], (64, 64))
                    hist = cv2.calcHist([face_crop], [0], None, [128], [0, 256])
                    hist = cv2.normalize(hist, hist).flatten()
                    return hist.tolist()
    except Exception as e:
        print(f"OpenCV fallback face encoding error: {e}")

    return None

def save_face_embedding(
    patient_id: str,
    family_member_id: str,
    encoding: List[float],
    metadata: Dict
) -> str:
    """Save face encoding to disk and return embedding ID."""
    embedding_id = str(uuid.uuid4())
    record = {
        "id": embedding_id,
        "patient_id": patient_id,
        "family_member_id": family_member_id,
        "encoding": encoding,
        "metadata": metadata
    }
    filename = f"{patient_id}_{family_member_id}_{embedding_id}.json"
    path = os.path.join(EMBEDDINGS_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    return embedding_id

def load_patient_embeddings(patient_id: str) -> List[Dict]:
    """Load all face embeddings for a patient's family."""
    embeddings = []
    if not os.path.exists(EMBEDDINGS_DIR):
        return embeddings

    prefix = f"{patient_id}_"
    for filename in os.listdir(EMBEDDINGS_DIR):
        if filename.startswith(prefix) and filename.endswith(".json"):
            try:
                with open(os.path.join(EMBEDDINGS_DIR, filename), "r", encoding="utf-8") as f:
                    embeddings.append(json.load(f))
            except Exception as e:
                print(f"Error loading embedding {filename}: {e}")
    return embeddings

def delete_face_embedding(embedding_id: str) -> bool:
    """Delete a face embedding file by its ID."""
    if not os.path.exists(EMBEDDINGS_DIR):
        return False
    for filename in os.listdir(EMBEDDINGS_DIR):
        if embedding_id in filename and filename.endswith(".json"):
            try:
                os.remove(os.path.join(EMBEDDINGS_DIR, filename))
                return True
            except Exception:
                pass
    return False

def delete_patient_embeddings(patient_id: str, family_member_id: str = None) -> int:
    """Remove face embeddings for a patient or specific family member."""
    count = 0
    if not os.path.exists(EMBEDDINGS_DIR):
        return 0

    prefix = f"{patient_id}_"
    for filename in os.listdir(EMBEDDINGS_DIR):
        if filename.startswith(prefix) and filename.endswith(".json"):
            if family_member_id and f"_{family_member_id}_" not in filename:
                continue
            try:
                os.remove(os.path.join(EMBEDDINGS_DIR, filename))
                count += 1
            except Exception:
                pass
    return count

def recognize_face(
    patient_id: str,
    image_bytes: bytes,
    tolerance: float = 0.6
) -> Dict:
    """Compare a query image against all registered family embeddings for a patient."""
    query_encoding = encode_face(image_bytes)
    if not query_encoding:
        return {
            "recognized": False,
            "error": "No face detected in the provided image.",
            "confidence": 0
        }

    known = load_patient_embeddings(patient_id)
    if not known:
        return {
            "recognized": False,
            "error": "No family members registered for this patient.",
            "confidence": 0
        }

    best_match = None
    best_distance = float("inf")
    query_arr = np.array(query_encoding, dtype=np.float32)

    for emb in known:
        known_arr = np.array(emb.get("encoding", []), dtype=np.float32)
        if len(known_arr) == 0:
            continue

        if FACE_RECOGNITION_AVAILABLE and len(known_arr) == 128 and len(query_arr) == 128:
            distance = face_recognition.face_distance([known_arr], query_arr)[0]
        else:
            # Cosine distance fallback
            norm_q = np.linalg.norm(query_arr)
            norm_k = np.linalg.norm(known_arr)
            if norm_q > 0 and norm_k > 0:
                sim = np.dot(query_arr, known_arr) / (norm_q * norm_k)
                distance = float(max(0.0, 1.0 - sim))
            else:
                distance = 1.0

        if distance < best_distance:
            best_distance = distance
            best_match = emb

    if best_distance <= tolerance and best_match:
        confidence = round(max(0.0, min(100.0, (1.0 - best_distance) * 100)), 1)
        return {
            "recognized": True,
            "family_member_id": best_match.get("family_member_id", ""),
            "confidence": confidence,
            "distance": float(best_distance),
            "metadata": best_match.get("metadata", {})
        }

    return {
        "recognized": False,
        "confidence": 0,
        "error": "Person not recognized. Confidence too low."
    }
