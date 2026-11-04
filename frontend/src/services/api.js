import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create configured Axios client
export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
})

// Request Interceptor: Attach JWT / Firebase Auth Token from localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle errors gracefully
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Token may have expired.')
    }
    return Promise.reject(error)
  }
)

// Central API Service Object
export const api = {
  // ─── Memories ─────────────────────────────────────────────────────────────
  memories: {
    getAll: (patientId) =>
      client.get('/api/memories', { params: { patient_id: patientId } }),
    create: (data) => {
      const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      return client.post('/api/memories', data, { headers })
    },
    update: (id, data) => {
      const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      return client.put(`/api/memories/${id}`, data, { headers })
    },
    delete: (id) =>
      client.delete(`/api/memories/${id}`),
    search: (patientId, query) =>
      client.get('/api/memories/search', { params: { patient_id: patientId, q: query } }),
  },

  // ─── Family ───────────────────────────────────────────────────────────────
  family: {
    getAll: (patientId) =>
      client.get('/api/family', { params: { patient_id: patientId } }),
    create: (data) => {
      const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      return client.post('/api/family', data, { headers })
    },
    update: (id, data) => {
      const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      return client.put(`/api/family/${id}`, data, { headers })
    },
    delete: (id) =>
      client.delete(`/api/family/${id}`),
  },

  // ─── Routine ──────────────────────────────────────────────────────────────
  routine: {
    getAll: (patientId) =>
      client.get('/api/routine', { params: { patient_id: patientId } }),
    create: (data) =>
      client.post('/api/routine', data),
    update: (id, data) =>
      client.put(`/api/routine/${id}`, data),
    delete: (id) =>
      client.delete(`/api/routine/${id}`),
    complete: (id) =>
      client.post(`/api/routine/${id}/complete`),
  },

  // ─── AI Companion ─────────────────────────────────────────────────────────
  companion: {
    sendAudio: (audioBlob, patientId) => {
      let formData
      if (audioBlob instanceof FormData) {
        formData = audioBlob
      } else {
        formData = new FormData()
        if (audioBlob) {
          formData.append('audio', audioBlob, 'voice.webm')
        }
      }
      if (patientId && !formData.has('patient_id')) {
        formData.append('patient_id', patientId)
      }
      return client.post('/api/companion/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    getHistory: (patientId) =>
      client.get(`/api/companion/history/${patientId}`),
  },

  // ─── Face Recognition ────────────────────────────────────────────────────
  faces: {
    register: (patientId, familyMemberId, imageFile) => {
      let formData
      if (imageFile instanceof FormData) {
        formData = imageFile
      } else {
        formData = new FormData()
        if (patientId) formData.append('patient_id', patientId)
        if (familyMemberId) formData.append('family_member_id', familyMemberId)
        if (imageFile) formData.append('image', imageFile)
      }
      return client.post('/api/faces/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    recognize: (patientId, imageFile) => {
      let formData
      if (imageFile instanceof FormData) {
        formData = imageFile
      } else {
        formData = new FormData()
        if (patientId) formData.append('patient_id', patientId)
        if (imageFile) formData.append('image', imageFile)
      }
      return client.post('/api/faces/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  // ─── Location ─────────────────────────────────────────────────────────────
  location: {
    submit: (patientId, lat, lng, accuracy = 0) =>
      client.post('/api/location/submit', {
        patient_id: patientId,
        latitude: lat,
        longitude: lng,
        accuracy,
      }),
    getLatest: (patientId) =>
      client.get('/api/location/latest', { params: { patient_id: patientId } }),
    getHistory: (patientId) =>
      client.get('/api/location/history', { params: { patient_id: patientId } }),
  },

  // ─── Safe Zones ───────────────────────────────────────────────────────────
  safeZones: {
    getAll: (patientId) =>
      client.get('/api/safe-zones', { params: { patient_id: patientId } }),
    create: (data) =>
      client.post('/api/safe-zones', data),
    update: (id, data) =>
      client.put(`/api/safe-zones/${id}`, data),
    delete: (id) =>
      client.delete(`/api/safe-zones/${id}`),
  },

  // ─── Alerts ───────────────────────────────────────────────────────────────
  alerts: {
    getAll: (patientId) =>
      client.get('/api/alerts', { params: { patient_id: patientId } }),
    acknowledge: (id) =>
      client.patch(`/api/alerts/${id}/acknowledge`),
  },

  // ─── Patients ─────────────────────────────────────────────────────────────
  patients: {
    get: (patientId) =>
      client.get(`/api/patients/${patientId}`),
    create: (data) =>
      client.post('/api/patients', data),
    update: (patientId, data) =>
      client.put(`/api/patients/${patientId}`, data),
  },

  // ─── Audio & Music ────────────────────────────────────────────────────────
  audio: {
    getAll: (patientId) =>
      client.get('/api/audio', { params: { patient_id: patientId } }),
    upload: (data) => {
      const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      return client.post('/api/audio', data, { headers })
    },
  },
}

// ─── Helper Functions ────────────────────────────────────────────────────

/**
 * Format timestamp to human-readable relative time
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

/**
 * Format timestamp for display in history table
 */
const formatHistoryTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/**
 * Format coordinates to readable address (placeholder - real implementation would use reverse geocoding)
 */
const formatAddress = (lat, lng) => {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'Location unavailable'
  return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
}

// ─── Convenience Methods (Wrappers) ──────────────────────────────────────
// These are shorthand helpers that call the methods above and extract .data

api.getLatestLocation = async (patientId) => {
  const response = await api.location.getLatest(patientId)
  const data = response.data
  
  // Transform backend format to UI format
  return {
    ...data,
    lastSeen: formatRelativeTime(data.created_at || data.timestamp),
    address: formatAddress(data.lat || data.latitude, data.lng || data.longitude),
    accuracy: data.accuracy ? `±${data.accuracy.toFixed(1)} meters ${data.accuracy < 10 ? '(High)' : data.accuracy < 50 ? '(Medium)' : '(Low)'}` : 'N/A',
    status: data.is_safe ? 'Active GPS' : 'Alert',
    currentSafeZoneName: data.is_safe ? 'Home Sanctuary' : 'Unknown',
  }
}

api.getSafeZones = async (patientId) => {
  const response = await api.safeZones.getAll(patientId)
  const zones = response.data
  
  // Transform backend format to UI format
  return zones.map(zone => ({
    ...zone,
    radius: zone.radius_meters || zone.radius || 200,
    address: zone.address || formatAddress(zone.lat, zone.lng),
    category: zone.type || zone.category || 'home',
    alertOnExit: zone.alert_on_exit !== false, // Default to true
    alertOnEnter: zone.alert_on_enter || false,
  }))
}

api.getLocationHistory = async (patientId) => {
  const response = await api.location.getHistory(patientId)
  const history = response.data || []
  
  // Transform backend format to UI history table format
  return history.map(loc => ({
    id: loc.id,
    time: formatHistoryTime(loc.created_at || loc.timestamp),
    location: formatAddress(loc.lat || loc.latitude, loc.lng || loc.longitude),
    eventType: loc.is_safe ? 'Position Update' : 'Geofence Alert Advisory',
    accuracy: `±${(loc.accuracy || 5).toFixed(1)}m`,
  }))
}

api.createSafeZone = async (data) => {
  // Transform UI format to backend format
  const backendData = {
    patient_id: data.patientId,
    name: data.name,
    lat: data.lat,
    lng: data.lng,
    radius_meters: data.radius,
    type: data.category,
  }
  
  const response = await api.safeZones.create(backendData)
  const zone = response.data
  
  // Transform response back to UI format
  return {
    ...zone,
    radius: zone.radius_meters || zone.radius || 200,
    address: data.address || formatAddress(zone.lat, zone.lng),
    category: zone.type || zone.category || 'home',
    alertOnExit: data.alertOnExit !== false,
    alertOnEnter: data.alertOnEnter || false,
  }
}

api.deleteSafeZone = async (id) => {
  const response = await api.safeZones.delete(id)
  return response.data
}

// ─── Page-facing convenience methods ───────────────────────────────────────
// Keep page components independent of Axios response objects and translate their
// camelCase form state to the field names used by the FastAPI service.
api.getDashboardStats = async (patientId) =>
  (await client.get(`/api/patients/${patientId}/stats`)).data

api.getMemories = async (patientId) => (await api.memories.getAll(patientId)).data
api.createMemory = async ({ patientId, associatedFamily, thumbnail, ...memory }) => {
  const body = new FormData()
  body.append('patient_id', patientId)
  body.append('title', memory.title || '')
  body.append('description', memory.description || '')
  body.append('category', memory.category || 'General')
  body.append('date', memory.date || '')
  body.append('location', memory.location || '')
  body.append('associated_members', JSON.stringify(associatedFamily || []))
  return (await api.memories.create(body)).data
}
api.updateMemory = async (id, data) => (await api.memories.update(id, data)).data
api.deleteMemory = async (id) => (await api.memories.delete(id)).data

api.getFamilyMembers = async (patientId) => (await api.family.getAll(patientId)).data
api.createFamilyMember = async ({ patientId, ...member }) => {
  const body = new FormData()
  body.append('patient_id', patientId)
  body.append('name', member.name || '')
  body.append('relationship', member.relationship || '')
  body.append('description', member.description || '')
  body.append('phone', member.phone || '')
  body.append('email', member.email || '')
  return (await api.family.create(body)).data
}
api.updateFamilyMember = async (id, data) => (await api.family.update(id, data)).data
api.deleteFamilyMember = async (id) => (await api.family.delete(id)).data
api.registerFace = async (data) => (await client.post('/api/faces/register', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})).data

api.getRoutines = async (patientId) => (await api.routine.getAll(patientId)).data
api.createRoutine = async ({ patientId, ...routine }) =>
  (await api.routine.create({ ...routine, patient_id: patientId })).data
api.updateRoutine = async (id, data) => (await api.routine.update(id, data)).data
api.deleteRoutine = async (id) => (await api.routine.delete(id)).data

api.getAlerts = async (patientId) => (await api.alerts.getAll(patientId)).data
api.acknowledgeAlert = async (id, acknowledgedBy) =>
  (await client.patch(`/api/alerts/${id}/acknowledge`, { acknowledged_by: acknowledgedBy })).data

api.updatePatient = async (id, data) =>
  (await api.patients.update(id, {
    name: data.name,
    age: data.age ? Number(data.age) : null,
    medical_notes: data.medicalNotes,
    emergency_contact: data.emergencyContact,
    address: data.address,
    photo_url: data.avatar,
  })).data

export default api
