from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.core.firebase import get_db
from app.core.demo_store import demo_alerts
from datetime import datetime
import uuid

router = APIRouter(prefix='/alerts', tags=['alerts'])

class AlertCreate(BaseModel):
    patient_id: str
    alert_type: str = "general"
    title: str
    message: str
    severity: str = "medium"  # low, medium, high, critical
    location: Optional[Dict[str, float]] = None

class AcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Caregiver"
    note: Optional[str] = ""

@router.get('')
async def get_alerts(patient_id: str, acknowledged: Optional[bool] = None, limit: int = 50):
    """Get all safety and system alerts for a patient"""
    db = get_db()
    if not db:
        alerts = [a for a in demo_alerts.values() if a.get('patient_id') == patient_id]
        if acknowledged is not None:
            alerts = [a for a in alerts if a.get('acknowledged', False) == acknowledged]
        return sorted(alerts, key=lambda x: x.get('created_at', ''), reverse=True)[:limit]

    try:
        query = db.collection('alerts').where('patient_id', '==', patient_id)
        if acknowledged is not None:
            query = query.where('acknowledged', '==', acknowledged)
        docs = query.order_by('created_at', direction='DESCENDING').limit(limit).stream()
        results = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        if not results:
            alerts = [a for a in demo_alerts.values() if a.get('patient_id') == patient_id]
            if acknowledged is not None:
                alerts = [a for a in alerts if a.get('acknowledged', False) == acknowledged]
            return sorted(alerts, key=lambda x: x.get('created_at', ''), reverse=True)[:limit]
        return results
    except Exception as e:
        print(f"Firestore get_alerts warning: {e}")
        alerts = [a for a in demo_alerts.values() if a.get('patient_id') == patient_id]
        if acknowledged is not None:
            alerts = [a for a in alerts if a.get('acknowledged', False) == acknowledged]
        return sorted(alerts, key=lambda x: x.get('created_at', ''), reverse=True)[:limit]

@router.post('')
async def create_alert(alert: AlertCreate):
    """Create a new alert manually or programmatically"""
    alert_id = str(uuid.uuid4())
    alert_data = {
        'id': alert_id,
        **alert.model_dump(),
        'acknowledged': False,
        'acknowledged_by': None,
        'acknowledged_at': None,
        'created_at': datetime.utcnow().isoformat()
    }

    db = get_db()
    if db:
        try:
            db.collection('alerts').document(alert_id).set(alert_data)
        except Exception:
            demo_alerts[alert_id] = alert_data
    else:
        demo_alerts[alert_id] = alert_data

    return alert_data

@router.patch('/{alert_id}/acknowledge')
async def acknowledge_alert(alert_id: str, body: Optional[AcknowledgeRequest] = None):
    """Acknowledge and mark an alert as resolved/reviewed"""
    ack_by = body.acknowledged_by if body else "Caregiver"
    note = body.note if body else ""
    now_ts = datetime.utcnow().isoformat()

    db = get_db()
    if db:
        try:
            db.collection('alerts').document(alert_id).update({
                'acknowledged': True,
                'acknowledged_by': ack_by,
                'acknowledged_note': note,
                'acknowledged_at': now_ts
            })
            return {'id': alert_id, 'acknowledged': True, 'acknowledged_at': now_ts}
        except Exception:
            pass

    if alert_id in demo_alerts:
        demo_alerts[alert_id].update({
            'acknowledged': True,
            'acknowledged_by': ack_by,
            'acknowledged_note': note,
            'acknowledged_at': now_ts
        })
        return {'id': alert_id, 'acknowledged': True, 'acknowledged_at': now_ts}

    raise HTTPException(404, 'Alert not found')

@router.delete('/{alert_id}')
async def delete_alert(alert_id: str):
    """Delete an alert"""
    db = get_db()
    if db:
        try:
            db.collection('alerts').document(alert_id).delete()
        except Exception:
            pass

    if alert_id in demo_alerts:
        del demo_alerts[alert_id]

    return {'status': 'deleted', 'id': alert_id}
