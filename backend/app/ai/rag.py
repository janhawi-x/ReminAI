from typing import List, Dict, Optional
from app.core.firebase import get_db
from datetime import datetime, timezone


def retrieve_relevant_memories(
    patient_id: str,
    query: str = "",
    limit: int = 15,
) -> str:
    """
    Build a rich memory context string from Firestore for RAG.
    Returns a formatted string ready to inject into the LLM prompt.
    """
    db = get_db()
    if db is None:
        return "Memory database is not connected. No personal information is available."

    context_parts: List[str] = []

    try:
        # ── Patient profile ─────────────────────────────────────────────────
        patient_doc = db.collection("patients").document(patient_id).get()
        if patient_doc.exists:
            p = patient_doc.to_dict()
            context_parts.append(
                f"Patient: {p.get('name', 'the patient')}, "
                f"Preferred name: {p.get('preferredName', '')}, "
                f"Age: {p.get('age', 'unknown')}"
            )

        # ── Family members ──────────────────────────────────────────────────
        family_stream = (
            db.collection("family_members")
            .where("patient_id", "==", patient_id)
            .limit(20)
            .stream()
        )
        family_lines = []
        for doc in family_stream:
            d = doc.to_dict()
            line = (
                f"  - {d.get('name', 'Unknown')} "
                f"({d.get('relationship', 'family member')})"
            )
            if d.get("description"):
                line += f": {d.get('description')}"
            family_lines.append(line)
        if family_lines:
            context_parts.append("Family members:\n" + "\n".join(family_lines))

        # ── Personal memories ───────────────────────────────────────────────
        mem_stream = (
            db.collection("memories")
            .where("patient_id", "==", patient_id)
            .limit(limit)
            .stream()
        )
        mem_lines = []
        for doc in mem_stream:
            d = doc.to_dict()
            mem_line = (
                f"  - [{d.get('category', 'memory')}] "
                f"{d.get('title', 'Untitled')}"
            )
            if d.get("description"):
                mem_line += f": {d.get('description')}"
            if d.get("date"):
                mem_line += f" (Date: {d.get('date')})"
            if d.get("location"):
                mem_line += f" (Place: {d.get('location')})"
            mem_lines.append(mem_line)
        if mem_lines:
            context_parts.append("Personal memories and experiences:\n" + "\n".join(mem_lines))

        # ── Today's routine ─────────────────────────────────────────────────
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        routine_stream = (
            db.collection("daily_routines")
            .where("patient_id", "==", patient_id)
            .stream()
        )
        today_events = []
        for doc in routine_stream:
            d = doc.to_dict()
            event_str = f"  - {d.get('time', '')} {d.get('title', '')}"
            if d.get("description"):
                event_str += f" ({d.get('description')})"
            today_events.append(event_str)
        if today_events:
            context_parts.append(
                f"Today's schedule ({today}):\n" + "\n".join(today_events)
            )

        if not context_parts:
            return (
                "No personal memories or family information has been added yet. "
                "The caregiver can add memories through the Memory Guardian dashboard."
            )

        return "\n\n".join(context_parts)

    except Exception as e:
        return f"Memory retrieval encountered an issue: {str(e)}"
