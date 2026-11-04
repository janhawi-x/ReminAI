from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, Dict, Any
from app.core.firebase import get_db
from app.core.demo_store import demo_family
from app.vision.face_recognition_service import (
    encode_face,
    save_face_embedding,
    recognize_face,
    delete_patient_embeddings,
    load_patient_embeddings,
    FACE_RECOGNITION_AVAILABLE
)

router = APIRouter(prefix='/faces', tags=['faces'])

@router.post('/register')
async def register_face(
    patient_id: str = Form(...),
    family_member_id: str = Form(...),
    name: str = Form(default=""),
    relationship: str = Form(default=""),
    file: Optional[UploadFile] = File(default=None),
    image: Optional[UploadFile] = File(default=None)
):
    """
    Register a family member's face embedding.
    Accepts multipart image under 'file' or 'image'.
    """
    upload = file or image
    if not upload:
        raise HTTPException(status_code=400, detail="An image file is required ('file' or 'image').")

    print(f"👤 Registering face for patient {patient_id}, family_member {family_member_id} ({name})")
    image_bytes = await upload.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image file is too small or empty.")

    encoding = encode_face(image_bytes)

    if encoding is None:
        if FACE_RECOGNITION_AVAILABLE:
            raise HTTPException(
                status_code=400,
                detail="No face could be detected in the provided image. Please use a well-lit, frontal portrait."
            )
        else:
            # Fallback mock embedding when face_recognition / dlib is not installed
            print("⚠️ Face recognition library not available. Storing mock embedding for demo purposes.")
            encoding = [0.05] * 128

    metadata = {
        "name": name,
        "relationship": relationship,
        "filename": upload.filename or "face.jpg"
    }

    embedding_id = save_face_embedding(
        patient_id=patient_id,
        family_member_id=family_member_id,
        encoding=encoding,
        metadata=metadata
    )

    print(f"✅ Face embedding saved with ID: {embedding_id}")
    return {
        "embedding_id": embedding_id,
        "message": f"Face registered successfully for {name or 'family member'}",
        "patient_id": patient_id,
        "family_member_id": family_member_id
    }

@router.post('/recognize')
async def recognize_face_endpoint(
    patient_id: str = Form(...),
    file: Optional[UploadFile] = File(default=None),
    image: Optional[UploadFile] = File(default=None)
):
    """
    Recognize a face from an uploaded photo against registered family members.
    Returns recognition status, matched family member details, and companion TTS text.
    """
    upload = file or image
    if not upload:
        raise HTTPException(status_code=400, detail="An image file is required ('file' or 'image').")

    print(f"🔍 Face recognition requested for patient: {patient_id}")
    image_bytes = await upload.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image file is too small or empty.")

    result = recognize_face(patient_id=patient_id, image_bytes=image_bytes)

    if not result.get("recognized"):
        # Check if we should provide a graceful fallback in demo mode if no face_recognition library
        if not FACE_RECOGNITION_AVAILABLE:
            print("ℹ️ face_recognition unavailable, checking demo fallback")
            # If demo family exists for patient, return first member as demo recognition
            p_members = [m for m in demo_family.values() if m.get("patient_id") == patient_id]
            if p_members:
                sample = p_members[0]
                tts_text = f"This is {sample.get('name')}, your {sample.get('relationship')}."
                if sample.get('notes'):
                    tts_text += f" {sample.get('notes')}"
                return {
                    "recognized": True,
                    "family_member_id": sample.get("id"),
                    "name": sample.get("name"),
                    "relationship": sample.get("relationship"),
                    "description": sample.get("notes") or sample.get("description", ""),
                    "confidence": 94.5,
                    "tts_text": tts_text,
                    "demo_fallback": True
                }

        return {
            "recognized": False,
            "family_member_id": None,
            "name": None,
            "relationship": None,
            "description": None,
            "confidence": result.get("confidence", 0),
            "tts_text": "I could not recognize this person. Please check with your caregiver.",
            "error": result.get("error", "Person not recognized.")
        }

    family_member_id = result.get("family_member_id")
    metadata = result.get("metadata", {})
    confidence = result.get("confidence", 0)

    # Fetch family member details from Firestore or demo store
    name = metadata.get("name", "")
    relationship = metadata.get("relationship", "")
    description = ""
    photo_url = ""

    db = get_db()
    if db and family_member_id:
        try:
            doc = db.collection("family_members").document(family_member_id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                name = data.get("name") or name
                relationship = data.get("relationship") or relationship
                description = data.get("description") or data.get("notes") or ""
                photo_url = data.get("photo_url") or ""
        except Exception as e:
            print(f"⚠️ Error fetching family member details: {e}")

    if not description and family_member_id in demo_family:
        data = demo_family[family_member_id]
        name = data.get("name") or name
        relationship = data.get("relationship") or relationship
        description = data.get("description") or data.get("notes") or ""
        photo_url = data.get("photo_url") or ""

    # Generate companion text-to-speech prompt
    if name and relationship:
        tts_text = f"This is {name}, your {relationship}."
    elif name:
        tts_text = f"This is {name}."
    else:
        tts_text = "This is a member of your family."

    if description:
        tts_text += f" {description}"

    print(f"✅ Recognized: {name} ({relationship}) with {confidence}% confidence")
    return {
        "recognized": True,
        "family_member_id": family_member_id,
        "name": name,
        "relationship": relationship,
        "description": description,
        "photo_url": photo_url,
        "confidence": confidence,
        "tts_text": tts_text
    }

@router.delete('/{patient_id}/{family_member_id}')
async def delete_face_embeddings(patient_id: str, family_member_id: str):
    """Delete all registered face embeddings for a patient's family member"""
    print(f"🗑️ Deleting face embeddings for patient {patient_id}, member {family_member_id}")
    count = delete_patient_embeddings(patient_id=patient_id, family_member_id=family_member_id)
    return {
        "deleted": True,
        "count": count,
        "patient_id": patient_id,
        "family_member_id": family_member_id
    }

@router.get('/{patient_id}')
async def get_patient_faces(patient_id: str):
    """List all registered face embeddings for a patient"""
    embeddings = load_patient_embeddings(patient_id)
    return [
        {
            "id": emb.get("id"),
            "patient_id": emb.get("patient_id"),
            "family_member_id": emb.get("family_member_id"),
            "metadata": emb.get("metadata", {})
        }
        for emb in embeddings
    ]
