import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mic,
  Users,
  BookOpen,
  Calendar,
  Music,
  Phone,
  PhoneCall,
  Heart,
  Clock,
  AlertCircle,
  X,
  Volume2,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function PatientHome() {
  const { userProfile, userName, patientId } = useAuth()
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState({
    name: 'Primary Caregiver',
    phone: '+1 (555) 019-2834',
    relationship: 'Family Caregiver',
  })
  const [loadingContact, setLoadingContact] = useState(false)

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch emergency contact from patient profile
  useEffect(() => {
    let isMounted = true
    async function loadPatientData() {
      if (!patientId) return
      try {
        setLoadingContact(true)
        const patientData = await api.patients.get(patientId)
        if (isMounted && patientData) {
          if (patientData.emergencyContact || patientData.primaryCaregiverPhone) {
            setEmergencyContact({
              name: patientData.emergencyContactName || patientData.caregiverName || 'Caregiver',
              phone: patientData.emergencyContact || patientData.primaryCaregiverPhone || '+1 (555) 019-2834',
              relationship: patientData.emergencyRelationship || 'Primary Caregiver',
            })
          }
        }
      } catch (err) {
        console.warn('Could not load specific emergency contact, using fallback:', err.message)
      } finally {
        if (isMounted) setLoadingContact(false)
      }
    }
    loadPatientData()
    return () => { isMounted = false }
  }, [patientId])

  // Time of day greeting
  const hour = currentTime.getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon'
  } else if (hour >= 17) {
    greeting = 'Good Evening'
  }

  const patientDisplayName =
    userProfile?.preferredName ||
    userProfile?.name?.split(' ')[0] ||
    userName?.split(' ')[0] ||
    'Friend'

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F0A2E 0%, #1E1B4B 40%, #312E81 70%, #4C1D95 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Top Bar: Time, Date & Gentle Greeting ─────────────────────── */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
          paddingTop: '8px',
          paddingBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '8px 20px',
            borderRadius: '999px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Clock size={20} color="#C4B5FD" />
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#F3E8FF', letterSpacing: '0.5px' }}>
            {formattedTime} &bull; {formattedDate}
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            marginTop: '8px',
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            letterSpacing: '-0.5px',
          }}
        >
          {greeting}, {patientDisplayName}!
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#E9D5FF',
            maxWidth: '650px',
            margin: '0 auto',
          }}
        >
          Memory Guardian is here with you today. What would you like to do?
        </p>
      </header>

      {/* ─── Main 6 Large Patient Buttons (2x3 Grid) ──────────────────── */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '12px 0',
        }}
      >
        {/* a) Talk to Memory Guardian */}
        <Link
          to="/patient/companion"
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
            border: '2px solid rgba(165, 180, 252, 0.4)',
            boxShadow: '0 12px 30px rgba(99, 102, 241, 0.35)',
            textDecoration: 'none',
          }}
          aria-label="Talk to Memory Guardian Voice Companion"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            }}
          >
            <Mic size={48} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              Talk to Me
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#E0E7FF', marginTop: '4px', fontWeight: 500 }}>
              Speak with Memory Guardian
            </span>
          </div>
        </Link>

        {/* b) My Family */}
        <Link
          to="/patient/family"
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #0D9488 0%, #047857 100%)',
            border: '2px solid rgba(94, 234, 212, 0.4)',
            boxShadow: '0 12px 30px rgba(13, 148, 136, 0.35)',
            textDecoration: 'none',
          }}
          aria-label="View My Family members"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
            }}
          >
            <Users size={48} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              My Family
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#CCFBF1', marginTop: '4px', fontWeight: 500 }}>
              Photos & Loved Ones
            </span>
          </div>
        </Link>

        {/* c) My Memories */}
        <Link
          to="/patient/memories"
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            border: '2px solid rgba(196, 181, 253, 0.4)',
            boxShadow: '0 12px 30px rgba(139, 92, 246, 0.35)',
            textDecoration: 'none',
          }}
          aria-label="View My Memories and stories"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
            }}
          >
            <BookOpen size={48} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              My Memories
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#EDE9FE', marginTop: '4px', fontWeight: 500 }}>
              Photo Albums & Life Stories
            </span>
          </div>
        </Link>

        {/* d) My Daily Routine */}
        <Link
          to="/patient/routine"
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            border: '2px solid rgba(147, 197, 253, 0.4)',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)',
            textDecoration: 'none',
          }}
          aria-label="Check Today's Daily Routine and Medicine"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
            }}
          >
            <Calendar size={48} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              My Daily Routine
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#DBEAFE', marginTop: '4px', fontWeight: 500 }}>
              Today's Schedule & Medicine
            </span>
          </div>
        </Link>

        {/* e) My Music */}
        <Link
          to="/patient/music"
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #E11D48 0%, #9F1239 100%)',
            border: '2px solid rgba(253, 164, 175, 0.4)',
            boxShadow: '0 12px 30px rgba(225, 29, 72, 0.35)',
            textDecoration: 'none',
          }}
          aria-label="Listen to My Music and Voice Messages"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
            }}
          >
            <Music size={48} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              My Music & Sounds
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#FFE4E6', marginTop: '4px', fontWeight: 500 }}>
              Favourite Songs & Voice Notes
            </span>
          </div>
        </Link>

        {/* f) Emergency Help */}
        <button
          type="button"
          onClick={() => setShowEmergency(true)}
          className="patient-btn animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            border: '2px solid rgba(252, 165, 165, 0.5)',
            boxShadow: '0 12px 32px rgba(220, 38, 38, 0.45)',
          }}
          aria-label="Emergency Help - Call Caregiver"
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(255, 255, 255, 0.4)',
              animation: 'breathe 2s ease-in-out infinite',
            }}
          >
            <PhoneCall size={48} color="#FFFFFF" strokeWidth={2.6} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
              Emergency Help
            </span>
            <span style={{ display: 'block', fontSize: '15px', color: '#FEE2E2', marginTop: '4px', fontWeight: 600 }}>
              Call Caregiver Immediately
            </span>
          </div>
        </button>
      </main>

      {/* ─── Subtle Bottom Reassurance Bar ─────────────────────────────── */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '14px',
          color: '#C4B5FD',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={18} color="#F472B6" />
          <span>You are safe at home with Memory Guardian</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link
            to="/patient/book"
            style={{ color: '#E9D5FF', textDecoration: 'underline', fontSize: '14px' }}
          >
            Open Memory Photo Book
          </Link>
        </div>
      </footer>

      {/* ─── Emergency Modal ───────────────────────────────────────────── */}
      {showEmergency && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 10, 46, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1E1B4B',
              borderRadius: '32px',
              maxWidth: '540px',
              width: '100%',
              padding: '36px 28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              textAlign: 'center',
              border: '4px solid #EF4444',
            }}
          >
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <ShieldAlert size={52} color="#DC2626" strokeWidth={2.4} />
            </div>

            <h2
              id="emergency-modal-title"
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: '#991B1B',
                marginBottom: '8px',
              }}
            >
              Emergency Assistance
            </h2>

            <p style={{ fontSize: '18px', color: '#4B5563', marginBottom: '24px', lineHeight: 1.5 }}>
              Stay calm. Everything is going to be alright. Tap below to call your primary caregiver right now.
            </p>

            {/* Caregiver Contact Card */}
            <div
              style={{
                background: '#F8F7FF',
                border: '2px solid #E5E4F0',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '28px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {emergencyContact.relationship}
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E1B4B', margin: '4px 0' }}>
                    {emergencyContact.name}
                  </h3>
                  <p style={{ fontSize: '18px', color: '#374151', fontWeight: 600 }}>
                    {emergencyContact.phone}
                  </p>
                </div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={28} color="#FFFFFF" />
                </div>
              </div>
            </div>

            {/* Large Call Button */}
            <a
              href={`tel:${emergencyContact.phone}`}
              className="btn btn-xl btn-danger"
              style={{
                display: 'flex',
                width: '100%',
                fontSize: '22px',
                fontWeight: 800,
                padding: '20px',
                borderRadius: '20px',
                textDecoration: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
              }}
            >
              <PhoneCall size={28} />
              CALL {emergencyContact.name.toUpperCase()}
            </a>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowEmergency(false)}
              className="btn btn-secondary btn-lg"
              style={{
                width: '100%',
                fontSize: '18px',
                borderRadius: '16px',
                padding: '14px',
                color: '#4B5563',
              }}
            >
              I am okay, close this
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
