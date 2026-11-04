import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Utensils,
  Pill,
  Calendar as CalendarIcon,
  Users,
  Activity,
  Volume2,
  Sparkles,
  Heart,
  Check,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

// Fallback routine activities for today
const SAMPLE_ROUTINE = [
  {
    id: 'rout-1',
    time: '8:30 AM',
    title: 'Warm Breakfast & Tea',
    type: 'meal',
    description: 'Scrambled eggs, whole wheat toast, and warm chamomile tea prepared fresh.',
    completed: true,
  },
  {
    id: 'rout-2',
    time: '9:15 AM',
    title: 'Morning Heart & Vitamin Medicine',
    type: 'medication',
    description: 'Take 1 blue blood pressure tablet and 1 multivitamin capsule with a glass of water.',
    completed: true,
  },
  {
    id: 'rout-3',
    time: '11:00 AM',
    title: 'Gentle Garden Stroll',
    type: 'activity',
    description: '15-minute relaxing walk in the backyard garden smelling the roses and fresh air.',
    completed: false,
  },
  {
    id: 'rout-4',
    time: '12:30 PM',
    title: 'Nutritious Lunch',
    type: 'meal',
    description: 'Warm chicken vegetable soup, crackers, and sliced fresh pears.',
    completed: false,
  },
  {
    id: 'rout-5',
    time: '2:30 PM',
    title: 'Phone Call with Sarah',
    type: 'family',
    description: 'Your daughter Sarah will call to share stories and say hello.',
    completed: false,
  },
  {
    id: 'rout-6',
    time: '4:00 PM',
    title: 'Dr. Jenkins Checkup Follow-up',
    type: 'appointment',
    description: 'Virtual wellness check-in with your friendly neighborhood physician.',
    completed: false,
  },
  {
    id: 'rout-7',
    time: '8:00 PM',
    title: 'Evening Medicine & Calming Story',
    type: 'medication',
    description: 'Evening cholesterol pill with warm milk and a soothing audio bedtime story.',
    completed: false,
  },
]

// Visual mapping for categories
const CATEGORY_CONFIG = {
  meal: {
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#14B8A6',
    badgeClass: 'badge-teal',
    label: 'Meal Time',
    Icon: Utensils,
  },
  medication: {
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#EF4444',
    badgeClass: 'badge-red',
    label: 'Medication',
    Icon: Pill,
  },
  appointment: {
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#3B82F6',
    badgeClass: 'badge-blue',
    label: 'Appointment',
    Icon: CalendarIcon,
  },
  family: {
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#8B5CF6',
    badgeClass: 'badge-purple',
    label: 'Family Time',
    Icon: Users,
  },
  activity: {
    color: '#059669',
    bg: '#ECFDF5',
    border: '#10B981',
    badgeClass: 'badge-green',
    label: 'Activity',
    Icon: Activity,
  },
}

export default function PatientRoutine() {
  const { patientId } = useAuth()
  const navigate = useNavigate()

  // State
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Audio Speech Synthesis for narration
  const speakActivity = useCallback((item) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const text = `At ${item.time}. ${item.title}. ${item.description}. Status: ${
      item.completed ? 'Already completed' : 'Coming up'
    }`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }, [])

  // Load routine from API
  const loadRoutine = useCallback(async () => {
    setLoading(true)
    try {
      const targetId = patientId
      if (!targetId) {
        console.warn('No patient ID available')
        return
      }
      const data = await api.routine.getAll(targetId)
      if (Array.isArray(data) && data.length > 0) {
        setActivities(data)
      } else {
        setActivities(SAMPLE_ROUTINE)
      }
    } catch (err) {
      console.warn('API routine error, using sample schedule:', err.message)
      setActivities(SAMPLE_ROUTINE)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadRoutine()
  }, [loadRoutine])

  // Toggle completion
  const handleToggleComplete = async (item) => {
    const updatedState = !item.completed

    // Optimistic UI update
    setActivities((prev) =>
      prev.map((act) => (act.id === item.id ? { ...act, completed: updatedState } : act))
    )

    // Voice encouragement
    if (updatedState && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const encouragement = `Wonderful job completing ${item.title}!`
      const utt = new SpeechSynthesisUtterance(encouragement)
      utt.rate = 0.95
      window.speechSynthesis.speak(utt)
    }

    try {
      await api.routine.complete(item.id)
    } catch (err) {
      console.warn('Could not sync completion to backend:', err.message)
    }
  }

  // Header date formatting
  const formattedDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
  const formattedFullDate = currentTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const completedCount = activities.filter((a) => a.completed).length
  const totalCount = activities.length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 50%, #0F172A 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Top Header with Back Navigation ─────────────────────────── */}
      <header
        style={{
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="btn btn-secondary btn-lg"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '999px',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="Back to Patient Home"
          >
            <ArrowLeft size={24} />
            Back Home
          </button>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#93C5FD',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Daily Schedule
            </span>
            <h1
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.5px',
                margin: '2px 0 0',
              }}
            >
              Today is {formattedDay}, {formattedFullDate}
            </h1>
          </div>
        </div>

        {/* ─── Gentle Reminder Banner & Progress ──────────────────────── */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '18px 24px',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={26} color="#FFFFFF" />
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Take your time. You are doing wonderfully today.
              </p>
              <p style={{ fontSize: '14px', color: '#BFDBFE', margin: '2px 0 0' }}>
                Every step at your own comfortable pace.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 18px',
              borderRadius: '999px',
            }}
          >
            <Sparkles size={18} color="#FDE047" />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
              {completedCount} of {totalCount} completed
            </span>
          </div>
        </div>
      </header>

      {/* ─── Visual Timeline of Activities ───────────────────────────── */}
      <main
        style={{
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="card"
                style={{
                  padding: '24px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '12px' }} />
                <div className="skeleton" style={{ width: '80%', height: '18px' }} />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div
            className="card animate-fade-in"
            style={{
              padding: '60px 32px',
              borderRadius: '32px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              maxWidth: '600px',
              margin: '40px auto',
            }}
          >
            <Clock size={64} color="#93C5FD" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              No activities scheduled for today
            </h2>
            <p style={{ fontSize: '18px', color: '#DBEAFE' }}>
              Enjoy a peaceful, restful day.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activities.map((item, index) => {
              const cfg = CATEGORY_CONFIG[item.type] || CATEGORY_CONFIG.activity
              const IconComponent = cfg.Icon

              return (
                <div
                  key={item.id || index}
                  className="card animate-fade-in"
                  style={{
                    background: item.completed ? '#F8FAFC' : '#FFFFFF',
                    color: '#1E1B4B',
                    borderRadius: '28px',
                    padding: '24px 28px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                    borderLeft: `10px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    opacity: item.completed ? 0.85 : 1,
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Left: Time & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '20px',
                        background: cfg.bg,
                        border: `2px solid ${cfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={32} color={cfg.color} strokeWidth={2.4} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: cfg.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Clock size={18} />
                          {item.time}
                        </span>
                        <span
                          className={`badge ${cfg.badgeClass}`}
                          style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 700 }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <h2
                        style={{
                          fontSize: '22px',
                          fontWeight: 800,
                          color: '#1E1B4B',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          margin: '4px 0',
                        }}
                      >
                        {item.title}
                      </h2>

                      <p
                        style={{
                          fontSize: '16px',
                          color: '#4B5563',
                          lineHeight: 1.4,
                          margin: 0,
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Audio Narration & Large Completion Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => speakActivity(item)}
                      className="btn btn-ghost"
                      style={{
                        borderRadius: '50%',
                        padding: '12px',
                        color: cfg.color,
                        background: cfg.bg,
                      }}
                      aria-label={`Read aloud ${item.title}`}
                      title="Read aloud"
                    >
                      <Volume2 size={24} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item)}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        border: item.completed ? `3px solid #10B981` : `3px solid #CBD5E1`,
                        background: item.completed ? '#10B981' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: item.completed
                          ? '0 6px 18px rgba(16, 185, 129, 0.4)'
                          : '0 4px 10px rgba(0,0,0,0.05)',
                      }}
                      aria-label={item.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {item.completed ? (
                        <Check size={36} color="#FFFFFF" strokeWidth={3} />
                      ) : (
                        <Circle size={32} color="#94A3B8" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
