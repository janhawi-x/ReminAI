"""Small SQLite persistence layer used when Firebase is not configured."""
import hashlib
import hmac
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[2] / "reminai.db"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize() -> None:
    with _connect() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
          name TEXT NOT NULL, role TEXT NOT NULL, patient_id TEXT, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER, stage_of_dementia TEXT,
          primary_caregiver_id TEXT, emergency_contact TEXT, medical_notes TEXT,
          address TEXT, photo_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS patient_links (
          patient_id TEXT NOT NULL, user_id TEXT NOT NULL, relationship TEXT NOT NULL,
          created_at TEXT NOT NULL, PRIMARY KEY (patient_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL
        );
        """)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, saved: str) -> bool:
    salt_hex, digest_hex = saved.split("$", 1)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 310_000)
    return hmac.compare_digest(actual.hex(), digest_hex)


def patient_id() -> str:
    return f"PAT-{secrets.token_hex(4).upper()}"


def row_dict(row):
    return dict(row) if row else None

