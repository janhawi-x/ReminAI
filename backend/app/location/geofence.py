from geopy.distance import geodesic
from typing import Dict, List, Optional
from datetime import datetime, timezone


def check_geofence(
    patient_lat: float,
    patient_lng: float,
    safe_zones: List[Dict],
) -> Dict:
    """
    Check whether the patient is inside ANY configured safe zone.
    Returns a dict with is_safe boolean and violation details.
    """
    if not safe_zones:
        return {
            "is_safe": True,
            "violations": [],
            "note": "No safe zones configured.",
            "checked_at": _now_iso(),
        }

    patient_pos = (patient_lat, patient_lng)
    violations = []
    inside_any = False

    for zone in safe_zones:
        center = (zone["lat"], zone["lng"])
        distance_m = geodesic(patient_pos, center).meters
        is_inside = distance_m <= zone.get("radius_meters", 200)

        if is_inside:
            inside_any = True
        else:
            violations.append({
                "zone_id": zone.get("id", ""),
                "zone_name": zone.get("name", "Safe Zone"),
                "distance_from_center": round(distance_m, 1),
                "radius_meters": zone.get("radius_meters", 200),
                "excess_meters": round(distance_m - zone.get("radius_meters", 200), 1),
            })

    # If inside at least one safe zone, patient is safe
    is_safe = inside_any if safe_zones else True

    return {
        "is_safe": is_safe,
        "violations": [] if is_safe else violations,
        "checked_at": _now_iso(),
    }


def format_alert_message(
    patient_name: str,
    lat: float,
    lng: float,
    violation: Dict,
    timestamp: str,
) -> str:
    """Format a human-readable safety alert message."""
    return (
        f"MEMORY GUARDIAN – SAFETY ALERT\n\n"
        f"Patient {patient_name} has moved outside the designated safe zone.\n\n"
        f"Zone: {violation['zone_name']}\n"
        f"Distance from boundary: {violation['excess_meters']}m beyond "
        f"the {violation['radius_meters']}m safe radius\n"
        f"Last known coordinates: {lat:.6f}, {lng:.6f}\n"
        f"Time detected: {timestamp}\n\n"
        f"Please check the patient's location immediately and contact emergency "
        f"services if the patient cannot be reached."
    )


def calculate_distance(
    lat1: float, lng1: float,
    lat2: float, lng2: float,
) -> float:
    """Return geodesic distance in metres between two coordinates."""
    return geodesic((lat1, lng1), (lat2, lng2)).meters


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
