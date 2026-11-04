import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, AuthContext } from './context/AuthContext'
import { LoadingPage } from './components/ui/index.jsx'

// ─── Lazy Loaded Page Components ──────────────────────────────────────────────
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// Patient Pages
const PatientHome = lazy(() => import('./pages/patient/PatientHome'))
const PatientCompanion = lazy(() => import('./pages/patient/PatientCompanion'))
const PatientFamily = lazy(() => import('./pages/patient/PatientFamily'))
const PatientMemories = lazy(() => import('./pages/patient/PatientMemories'))
const PatientMemoryBook = lazy(() => import('./pages/patient/PatientMemoryBook'))
const PatientRoutine = lazy(() => import('./pages/patient/PatientRoutine'))
const PatientMusic = lazy(() => import('./pages/patient/PatientMusic'))

// Caregiver Pages
const CaregiverDashboard = lazy(() => import('./pages/caregiver/CaregiverDashboard'))
const CaregiverPatient = lazy(() => import('./pages/caregiver/CaregiverPatient'))
const CaregiverMemories = lazy(() => import('./pages/caregiver/CaregiverMemories'))
const CaregiverFamily = lazy(() => import('./pages/caregiver/CaregiverFamily'))
const CaregiverRoutines = lazy(() => import('./pages/caregiver/CaregiverRoutines'))
const CaregiverLocation = lazy(() => import('./pages/caregiver/CaregiverLocation'))
const CaregiverAlerts = lazy(() => import('./pages/caregiver/CaregiverAlerts'))
const CaregiverSettings = lazy(() => import('./pages/caregiver/CaregiverSettings'))

// ─── Protected Route Component ────────────────────────────────────────────────
export function ProtectedRoute({ children, role }) {
  const { currentUser, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingPage message="Verifying authentication…" />
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If a role requirement is specified, verify that the active user matches
  if (role && userProfile?.role && userProfile.role !== role) {
    if (userProfile.role === 'patient') {
      return <Navigate to="/patient/home" replace />
    }
    if (userProfile.role === 'caregiver') {
      return <Navigate to="/caregiver/dashboard" replace />
    }
  }

  return children
}

// ─── App Routes Definition ───────────────────────────────────────────────────
export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
          <LoadingPage message="Loading Memory Guardian…" />
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Protected Routes */}
        <Route
          path="/patient/home"
          element={
            <ProtectedRoute role="patient">
              <PatientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/companion"
          element={
            <ProtectedRoute role="patient">
              <PatientCompanion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/family"
          element={
            <ProtectedRoute role="patient">
              <PatientFamily />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/memories"
          element={
            <ProtectedRoute role="patient">
              <PatientMemories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/memory-book"
          element={
            <ProtectedRoute role="patient">
              <PatientMemoryBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/routine"
          element={
            <ProtectedRoute role="patient">
              <PatientRoutine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/music"
          element={
            <ProtectedRoute role="patient">
              <PatientMusic />
            </ProtectedRoute>
          }
        />

        {/* Caregiver Protected Routes */}
        <Route
          path="/caregiver/dashboard"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/patient"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/memories"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverMemories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/family"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverFamily />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/routines"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverRoutines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/location"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/alerts"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverAlerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caregiver/settings"
          element={
            <ProtectedRoute role="caregiver">
              <CaregiverSettings />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

// ─── Main Application with Providers ──────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
export { AuthContext }
