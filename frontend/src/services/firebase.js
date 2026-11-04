import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'reminai-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'reminai-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'reminai-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO12345',
}

// Placeholder values are kept for demo builds. Do not call Firebase Auth with
// them: Firebase rejects those requests before the application's demo fallback
// can take over.
export const firebaseIsConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your-firebase-api-key'
)

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize Services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Initialize Messaging (supported only in browser contexts with Service Worker)
let messaging = null
if (typeof window !== 'undefined') {
  try {
    isSupported()
      .then((supported) => {
        if (supported) {
          messaging = getMessaging(app)
        }
      })
      .catch((err) => {
        console.warn('Firebase Messaging not supported in this environment:', err?.message)
      })
  } catch (err) {
    console.warn('Firebase Messaging initialization error:', err?.message)
  }
}

export { app, auth, db, storage, messaging }
export default app
