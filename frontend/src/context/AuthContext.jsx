import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db, firebaseIsConfigured } from '../services/firebase'
import { client } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadAlertCount, setUnreadAlertCount] = useState(0)

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Check if there is an active local demo session first
    const savedDemoUser = localStorage.getItem('mg_demo_profile')
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser)
        setCurrentUser({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.name,
          getIdToken: async () => localStorage.getItem('mg_token') || 'demo-token',
        })
        setUserProfile(parsed)
        setLoading(false)
        return
      } catch (e) {
        console.warn('Failed to parse saved demo user', e)
        localStorage.removeItem('mg_demo_profile')
      }
    }

    // Local demo mode is the default until valid Firebase configuration is
    // supplied. Skipping the listener prevents invalid placeholder keys from
    // producing Firebase auth errors on the login screen.
    if (!firebaseIsConfigured) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        try {
          const token = await user.getIdToken()
          localStorage.setItem('mg_token', token)
        } catch (tokenErr) {
          console.warn('Error fetching auth token:', tokenErr)
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data())
          } else {
            // Default profile if document hasn't been written yet
            const defaultProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'caregiver',
              patientId: user.uid,
              createdAt: new Date().toISOString(),
            }
            setUserProfile(defaultProfile)
          }
        } catch (firestoreErr) {
          console.warn('Firestore user fetch failed, using fallback profile:', firestoreErr?.message)
          setUserProfile({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'caregiver',
            patientId: user.uid,
          })
        }
      } else {
        // If not in demo mode and no Firebase user
        if (!localStorage.getItem('mg_demo_profile')) {
          setCurrentUser(null)
          setUserProfile(null)
          localStorage.removeItem('mg_token')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Login with Email & Password
  const login = async (email, password) => {
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const { data } = await client.post('/api/auth/login', { email: normalizedEmail, password })
      const profile = data.user
      const user = { uid: profile.uid, email: profile.email, displayName: profile.name, getIdToken: async () => data.token }
      setCurrentUser(user)
      setUserProfile(profile)
      localStorage.setItem('mg_token', data.token)
      localStorage.setItem('mg_demo_profile', JSON.stringify(profile))
      setLoading(false)
      return { user, profile }
    } catch (error) {
      if (error.response?.status && error.response.status !== 404) {
        setLoading(false)
        throw new Error(error.response.data?.detail || 'Unable to sign in')
      }
    }

    if (!firebaseIsConfigured) {
      const fallbackRole = normalizedEmail.includes('patient') ? 'patient' : 'caregiver'
      const fallbackProfile = {
        uid: 'user-' + btoa(normalizedEmail).replace(/=/g, '').slice(0, 12),
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0].replace(/[._]/g, ' '),
        role: fallbackRole,
        patientId: 'patient-1',
        createdAt: new Date().toISOString(),
      }
      const mockUser = {
        uid: fallbackProfile.uid,
        email: fallbackProfile.email,
        displayName: fallbackProfile.name,
        getIdToken: async () => 'mock-token',
      }
      setCurrentUser(mockUser)
      setUserProfile(fallbackProfile)
      localStorage.setItem('mg_token', 'mock-token')
      localStorage.setItem('mg_demo_profile', JSON.stringify(fallbackProfile))
      setLoading(false)
      return { user: mockUser, profile: fallbackProfile }
    }

    // 2. Standard Firebase authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      setCurrentUser(user)

      // Fetch or create token
      const token = await user.getIdToken()
      localStorage.setItem('mg_token', token)
      localStorage.removeItem('mg_demo_profile')

      // Fetch profile from Firestore
      let profile = null
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          profile = userDoc.data()
        } else {
          profile = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'caregiver',
            patientId: user.uid,
            createdAt: new Date().toISOString(),
          }
          await setDoc(doc(db, 'users', user.uid), profile)
        }
      } catch (dbErr) {
        console.warn('Firestore fetch error on login:', dbErr?.message)
        profile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          role: 'caregiver',
          patientId: user.uid,
        }
      }

      setUserProfile(profile)
      setLoading(false)
      return { user, profile }
    } catch (firebaseErr) {
      // 3. Fallback for hackathon testing when API key is a placeholder or network fails
      const isConfigError =
        !firebaseIsConfigured ||
        firebaseErr.code === 'auth/api-key-not-valid' ||
        firebaseErr.code === 'auth/invalid-api-key' ||
        firebaseErr.code === 'auth/configuration-not-found' ||
        firebaseErr.message?.includes('API key')

      if (isConfigError) {
        console.warn('Firebase API key not configured. Logging in via mock fallback session.')
        const fallbackRole = normalizedEmail.includes('patient') ? 'patient' : 'caregiver'
        const fallbackProfile = {
          uid: 'user-' + btoa(normalizedEmail).replace(/=/g, '').slice(0, 12),
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0].replace(/[._]/g, ' '),
          role: fallbackRole,
          patientId: 'patient-1',
          createdAt: new Date().toISOString(),
        }
        const mockUser = {
          uid: fallbackProfile.uid,
          email: fallbackProfile.email,
          displayName: fallbackProfile.name,
          getIdToken: async () => 'mock-token',
        }
        setCurrentUser(mockUser)
        setUserProfile(fallbackProfile)
        localStorage.setItem('mg_token', 'mock-token')
        localStorage.setItem('mg_demo_profile', JSON.stringify(fallbackProfile))
        setLoading(false)
        return { user: mockUser, profile: fallbackProfile }
      }

      setLoading(false)
      throw firebaseErr
    }
  }

  // Register a new user and save profile to Firestore
  const register = async (email, password, role = 'caregiver', name = '', patientId = null) => {
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const { data } = await client.post('/api/auth/register', {
        email: normalizedEmail, password, role, name, patient_id: patientId || null,
      })
      const profile = data.user
      const user = { uid: profile.uid, email: profile.email, displayName: profile.name, getIdToken: async () => data.token }
      setCurrentUser(user)
      setUserProfile(profile)
      localStorage.setItem('mg_token', data.token)
      localStorage.setItem('mg_demo_profile', JSON.stringify(profile))
      setLoading(false)
      return { user, profile }
    } catch (error) {
      if (error.response?.status && error.response.status !== 404) {
        setLoading(false)
        throw new Error(error.response.data?.detail || 'Unable to create account')
      }
    }

    if (!firebaseIsConfigured) {
      const fallbackId = 'user-' + Date.now().toString(36)
      const profileData = {
        uid: fallbackId,
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split('@')[0],
        role,
        patientId: patientId || (role === 'patient' ? fallbackId : 'patient-1'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const mockUser = {
        uid: fallbackId,
        email: normalizedEmail,
        displayName: profileData.name,
        getIdToken: async () => 'mock-token-' + fallbackId,
      }
      setCurrentUser(mockUser)
      setUserProfile(profileData)
      localStorage.setItem('mg_token', 'mock-token-' + fallbackId)
      localStorage.setItem('mg_demo_profile', JSON.stringify(profileData))
      setLoading(false)
      return { user: mockUser, profile: profileData }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      setCurrentUser(user)

      const token = await user.getIdToken()
      localStorage.setItem('mg_token', token)
      localStorage.removeItem('mg_demo_profile')

      const profileData = {
        uid: user.uid,
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split('@')[0],
        role: role,
        patientId: patientId || (role === 'patient' ? user.uid : null),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save user profile document in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), profileData)
      } catch (dbErr) {
        console.warn('Firestore setDoc failed during registration:', dbErr?.message)
      }

      setUserProfile(profileData)
      setLoading(false)
      return { user, profile: profileData }
    } catch (firebaseErr) {
      // Fallback for hackathon testing if Firebase keys are unconfigured
      const isConfigError =
        !firebaseIsConfigured ||
        firebaseErr.code === 'auth/api-key-not-valid' ||
        firebaseErr.code === 'auth/invalid-api-key' ||
        firebaseErr.code === 'auth/configuration-not-found' ||
        firebaseErr.message?.includes('API key')

      if (isConfigError) {
        console.warn('Firebase API key not configured. Registering via mock session.')
        const fallbackId = 'user-' + Date.now().toString(36)
        const profileData = {
          uid: fallbackId,
          email: normalizedEmail,
          name: name.trim() || normalizedEmail.split('@')[0],
          role: role,
          patientId: patientId || (role === 'patient' ? fallbackId : 'patient-1'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const mockUser = {
          uid: fallbackId,
          email: normalizedEmail,
          displayName: profileData.name,
          getIdToken: async () => 'mock-token-' + fallbackId,
        }
        setCurrentUser(mockUser)
        setUserProfile(profileData)
        localStorage.setItem('mg_token', 'mock-token-' + fallbackId)
        localStorage.setItem('mg_demo_profile', JSON.stringify(profileData))
        setLoading(false)
        return { user: mockUser, profile: profileData }
      }

      setLoading(false)
      throw firebaseErr
    }
  }

  // Logout function
  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('Firebase signOut error:', err)
    } finally {
      localStorage.removeItem('mg_token')
      localStorage.removeItem('mg_demo_profile')
      setCurrentUser(null)
      setUserProfile(null)
      setLoading(false)
    }
  }

  // Update user profile in state and Firestore
  const updateUserProfile = async (updates) => {
    if (!currentUser) return
    const updated = { ...userProfile, ...updates, updatedAt: new Date().toISOString() }
    setUserProfile(updated)

    if (localStorage.getItem('mg_demo_profile')) {
      localStorage.setItem('mg_demo_profile', JSON.stringify(updated))
      return updated
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates)
    } catch (e) {
      console.warn('Could not update profile in Firestore:', e)
    }
    return updated
  }

  // The page layer uses these aliases. Keeping them here gives every screen
  // one consistent patient identifier and prevents requests such as
  // `patient_id=undefined` after login.
  const patientId = userProfile?.patientId || (userProfile?.role === 'patient' ? currentUser?.uid : null)
  const patient = userProfile?.patient || (patientId ? {
    id: patientId,
    name: userProfile?.patientName || (userProfile?.role === 'patient' ? userProfile?.name : 'Patient'),
  } : null)
  const updatePatient = (updates) => updateUserProfile({
    patient: { ...patient, ...updates },
  })

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    user: userProfile,
    userName: userProfile?.name || currentUser?.displayName || 'Friend',
    patient,
    patientId,
    updatePatient,
    unreadAlertCount,
    setUnreadAlertCount,
    isCaregiver: userProfile?.role === 'caregiver',
    isPatient: userProfile?.role === 'patient',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
