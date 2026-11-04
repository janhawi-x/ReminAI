from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import secrets
import uuid

from app.core.local_store import _connect, _now, hash_password, initialize, patient_id, row_dict, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str = Field(min_length=6, max_length=256)
    role: str
    patient_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


def _profile(user):
    return {'uid': user['id'], 'email': user['email'], 'name': user['name'], 'role': user['role'], 'patientId': user['patient_id']}


def _session(user):
    token = secrets.token_urlsafe(32)
    with _connect() as conn:
        conn.execute('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', (token, user['id'], _now()))
    return {'token': token, 'user': _profile(user)}


@router.post('/register', status_code=201)
def register(request: RegisterRequest):
    initialize()
    role = request.role.lower().strip()
    if role not in {'patient', 'caregiver'}:
        raise HTTPException(400, 'Role must be patient or caregiver')
    with _connect() as conn:
        if conn.execute('SELECT 1 FROM users WHERE email = ?', (str(request.email).lower(),)).fetchone():
            raise HTTPException(409, 'An account with this email already exists')
        linked_id = request.patient_id.strip().upper() if request.patient_id else None
        if role == 'patient':
            linked_id = patient_id()
            now = _now()
            conn.execute('INSERT INTO patients (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', (linked_id, request.name.strip(), now, now))
        elif not linked_id:
            raise HTTPException(400, 'A Patient ID is required for a caregiver account')
        elif not conn.execute('SELECT 1 FROM patients WHERE id = ?', (linked_id,)).fetchone():
            raise HTTPException(404, 'Patient ID was not found')
        user = {'id': str(uuid.uuid4()), 'email': str(request.email).lower(), 'password_hash': hash_password(request.password), 'name': request.name.strip(), 'role': role, 'patient_id': linked_id, 'created_at': _now()}
        conn.execute('INSERT INTO users VALUES (:id, :email, :password_hash, :name, :role, :patient_id, :created_at)', user)
        conn.execute('INSERT OR REPLACE INTO patient_links VALUES (?, ?, ?, ?)', (linked_id, user['id'], role, _now()))
        if role == 'caregiver':
            conn.execute('UPDATE patients SET primary_caregiver_id = ?, updated_at = ? WHERE id = ?', (user['id'], _now(), linked_id))
    return _session(user)


@router.post('/login')
def login(request: LoginRequest):
    initialize()
    with _connect() as conn:
        user = row_dict(conn.execute('SELECT * FROM users WHERE email = ?', (str(request.email).lower(),)).fetchone())
    if not user or not verify_password(request.password, user['password_hash']):
        raise HTTPException(401, 'Invalid email or password')
    return _session(user)


@router.get('/me')
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Authentication required')
    with _connect() as conn:
        user = row_dict(conn.execute('SELECT users.* FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.token = ?', (authorization.removeprefix('Bearer ').strip(),)).fetchone())
    if not user:
        raise HTTPException(401, 'Session is invalid or expired')
    return _profile(user)
