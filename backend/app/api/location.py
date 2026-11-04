from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.core.firebase import get_db
from app.core.demo_store import (
    demo_safe_zones,
    demo_locations,
    demo_alerts,
    demo_patients
)
from app.location.geofence import check_geofence, format_alert_message
from datetime import datetime, timezone
import uuid

router = APIRouter(tags=['location'])

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class LocationSubmitRequest(BaseModel):
    patient_id: str
    lat: float
    lng: float
    accuracy: Optional[float] = 5.0
    speed: Optional[float] = 0.0
    timestamp_device: Optional[str] = None

class SafeZoneCreate(BaseModel):
    patient_id: str
    name: str
    lat: float
    lng: float
    radius_meters: Optional[float] = 200.0
    type: Optional[str] = Field("home", description="home/hospital/park/other")

class SafeZoneUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_meters: Optional[float] = None
    type: Optional[str] = None

# ─── Location Tracking Endpoints ─────────────────────────────────────────────

@router.post('/location/submit')
async def submit_location(req: LocationSubmitRequest):
    """
    Submit GPS location coordinate.
    Saves to 'patient_locations', checks against active safe zones,
    and automatically triggers an emergency alert if geofence is violated.
    """
    print(f"📍 GPS submit for {req.patient_id}: ({req.lat}, {req.lng})")
    now_iso = datetime.now(timezone.utc).isoformat()
    db = get_db()

    # 1. Retrieve patient's safe zones
    safe_zones = []
    if db:
        try:
            docs = db.collection('safe_zones').where('patient_id', '==', req.patient_id).stream()
            safe_zones = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"⚠️ Error querying safe zones from Firestore: {e}")

    if not safe_zones:
        safe_zones = [z for z in demo_safe_zones.values() if z.get('patient_id') == req.patient_id]

    # 2. Check geofence
    geofence_result = check_geofence(req.lat, req.lng, safe_zones)
    is_safe = geofence_result.get("is_safe", True)

    # 3. If violation detected, create emergency alert
    if not is_safe and geofence_result.get("violations"):
        violation = geofence_result["violations"][0]
        patient_name = "Patient"
        if db:
            try:
                p_doc = db.collection('patients').document(req.patient_id).get()
                if p_doc.exists:
                    patient_name = p_doc.to_dict().get('name', 'Patient')
            except Exception:
                pass
        if patient_name == "Patient" and req.patient_id in demo_patients:
            patient_name = demo_patients[req.patient_id].get('name', 'Patient')

        alert_msg = format_alert_message(
            patient_name=patient_name,
            lat=req.lat,
            lng=req.lng,
            violation=violation,
            timestamp=now_iso
        )

        alert_id = str(uuid.uuid4())
        alert_doc = {
            'id': alert_id,
            'patient_id': req.patient_id,
            'type': 'geofence_violation',
            'title': f"Boundary Alert: {patient_name} outside {violation.get('zone_name')}",
            'message': alert_msg,
            'severity': 'critical',
            'status': 'unread',
            'acknowledged': False,
            'lat': req.lat,
            'lng': req.lng,
            'created_at': now_iso,
            'acknowledged_at': None
        }

        print(f"🚨 Geofence violation detected! Creating alert {alert_id}")
        if db:
            try:
                db.collection('emergency_alerts').document(alert_id).set(alert_doc)
            except Exception as e:
                print(f"⚠️ Firestore create alert warning: {e}")
                demo_alerts[alert_id] = alert_doc
        else:
            demo_alerts[alert_id] = alert_doc

    # 4. Save location record
    loc_id = str(uuid.uuid4())
    loc_data = {
        'id': loc_id,
        'patient_id': req.patient_id,
        'lat': req.lat,
        'lng': req.lng,
        'latitude': req.lat,
        'longitude': req.lng,
        'accuracy': req.accuracy,
        'speed': req.speed,
        'timestamp_device': req.timestamp_device,
        'timestamp': req.timestamp_device or now_iso,
        'created_at': now_iso,
        'is_safe': is_safe
    }

    if db:
        try:
            db.collection('patient_locations').document(loc_id).set(loc_data)
        except Exception as e:
            print(f"⚠️ Firestore save location warning: {e}")
            demo_locations.append(loc_data)
    else:
        demo_locations.append(loc_data)

    return {
        'saved': True,
        'location': loc_data,
        'geofence_result': geofence_result
    }

@router.get('/location/latest')
async def get_latest_location(patient_id: str = Query(..., description="Patient ID")):
    """Get the latest recorded GPS location for a patient"""
    print(f"📍 Fetching latest location for patient: {patient_id}")
    db = get_db()
    if db:
        try:
            docs = list(
                db.collection('patient_locations')
                .where('patient_id', '==', patient_id)
                .order_by('created_at', direction='DESCENDING')
                .limit(1)
                .stream()
            )
            if docs:
                return {'id': docs[0].id, **docs[0].to_dict()}
        except Exception as e:
            print(f"⚠️ Firestore latest location query warning: {e}")

    # Fallback to demo_locations
    patient_locs = [
        loc for loc in demo_locations
        if loc.get('patient_id') == patient_id
    ]
    if patient_locs:
        return patient_locs[-1]

    # Return default coordinate if none found
    return {
        "id": "loc-default",
        "patient_id": patient_id,
        "lat": 37.7749,
        "lng": -122.4194,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "accuracy": 10.0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_safe": True,
        "is_default": True
    }

@router.get('/location/history')
async def get_location_history(
    patient_id: str = Query(..., description="Patient ID"),
    limit: int = Query(50, description="Max points to return")
):
    """Get location history for a patient"""
    print(f"📍 Fetching location history for patient: {patient_id} (limit={limit})")
    db = get_db()
    if db:
        try:
            docs = (
                db.collection('patient_locations')
                .where('patient_id', '==', patient_id)
                .order_by('created_at', direction='DESCENDING')
                .limit(limit)
                .stream()
            )
            results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
            if results:
                return results
        except Exception as e:
            print(f"⚠️ Firestore location history query warning: {e}")

    # Fallback to demo locations
    patient_locs = [
        loc for loc in demo_locations
        if loc.get('patient_id') == patient_id
    ]
    if patient_locs:
        return list(reversed(patient_locs))[:limit]

    return []

# ─── Safe Zones Endpoints ────────────────────────────────────────────────────

@router.post('/safe-zones', status_code=201)
@router.post('/location/safe-zones', status_code=201)
async def create_safe_zone(zone: SafeZoneCreate):
    """Create a new safe zone for geofence monitoring"""
    zone_id = str(uuid.uuid4())
    print(f"🛡️ Creating safe zone '{zone.name}' with ID: {zone_id}")
    now_iso = datetime.now(timezone.utc).isoformat()

    zone_data = {
        'id': zone_id,
        'patient_id': zone.patient_id,
        'name': zone.name,
        'lat': zone.lat,
        'lng': zone.lng,
        'radius_meters': zone.radius_meters or 200.0,
        'type': zone.type or "home",
        'created_at': now_iso,
        'updated_at': now_iso
    }

    db = get_db()
    if db:
        try:
            db.collection('safe_zones').document(zone_id).set(zone_data)
            print(f"✅ Safe zone {zone_id} saved to Firestore")
        except Exception as e:
            print(f"⚠️ Firestore create safe zone warning: {e}")
            demo_safe_zones[zone_id] = zone_data
    else:
        demo_safe_zones[zone_id] = zone_data
        print(f"✅ Safe zone {zone_id} saved to demo store")

    return zone_data

@router.get('/safe-zones')
@router.get('/location/safe-zones')
async def get_safe_zones(patient_id: str = Query(..., description="Patient ID")):
    """Get all safe zones for a patient"""
    print(f"🛡️ Fetching safe zones for patient: {patient_id}")
    db = get_db()
    if not db:
        return [z for z in demo_safe_zones.values() if z.get('patient_id') == patient_id]

    try:
        docs = db.collection('safe_zones').where('patient_id', '==', patient_id).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        if not results:
            return [z for z in demo_safe_zones.values() if z.get('patient_id') == patient_id]
        return results
    except Exception as e:
        print(f"⚠️ Firestore get safe zones warning: {e}")
        return [z for z in demo_safe_zones.values() if z.get('patient_id') == patient_id]

@router.put('/safe-zones/{zone_id}')
@router.put('/location/safe-zones/{zone_id}')
async def update_safe_zone(zone_id: str, data: SafeZoneUpdate):
    """Update an existing safe zone"""
    print(f"✏️ Updating safe zone: {zone_id}")
    update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_dict:
        return {'status': 'no_changes', 'id': zone_id}

    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    db = get_db()
    if db:
        try:
            doc_ref = db.collection('safe_zones').document(zone_id)
            doc = doc_ref.get()
            if doc.exists:
                doc_ref.update(update_dict)
                updated = doc_ref.get().to_dict()
                return {'id': zone_id, **updated}
        except Exception as e:
            print(f"⚠️ Firestore update safe zone warning: {e}")

    if zone_id in demo_safe_zones:
        demo_safe_zones[zone_id].update(update_dict)
        return demo_safe_zones[zone_id]

    raise HTTPException(status_code=404, detail="Safe zone not found")

@router.delete('/safe-zones/{zone_id}')
@router.delete('/location/safe-zones/{zone_id}')
async def delete_safe_zone(zone_id: str):
    """Delete a safe zone"""
    print(f"🗑️ Deleting safe zone: {zone_id}")
    db = get_db()
    if db:
        try:
            db.collection('safe_zones').document(zone_id).delete()
            print(f"✅ Safe zone {zone_id} deleted from Firestore")
        except Exception as e:
            print(f"⚠️ Firestore delete safe zone warning: {e}")

    if zone_id in demo_safe_zones:
        del demo_safe_zones[zone_id]

    return {'status': 'deleted', 'id': zone_id}
