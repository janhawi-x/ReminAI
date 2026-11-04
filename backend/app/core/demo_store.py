"""
In-memory store for local testing when Firebase Firestore is not configured.
Provides empty data structures that can be populated by users through the API.

All demo/sample data has been removed. New users start with empty accounts.
"""
from datetime import datetime
import uuid
from typing import Dict, List, Optional, Any

# Empty data stores - users must create their own data
demo_patients: Dict[str, Dict[str, Any]] = {}

demo_family: Dict[str, Dict[str, Any]] = {}

demo_memories: Dict[str, Dict[str, Any]] = {}

demo_routines: Dict[str, Dict[str, Any]] = {}

demo_safe_zones: Dict[str, Dict[str, Any]] = {}

demo_locations: List[Dict[str, Any]] = []

demo_alerts: Dict[str, Dict[str, Any]] = {}

demo_audio_memories: Dict[str, Dict[str, Any]] = {}

demo_conversations: List[Dict[str, Any]] = []
