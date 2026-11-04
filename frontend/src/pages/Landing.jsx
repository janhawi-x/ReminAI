import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain,
  Heart,
  Mic,
  Users,
  BookOpen,
  Calendar,
  MapPin,
  Bell,
  Shield,
  Star,
  ChevronRight,
  Menu,
  X,
  Play,
  Volume2,
  Camera
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Current copyright year constant (avoids calling impure Date in render for React Compiler)
const CURRENT_YEAR = 2026

const VOICE_DEMO_SAMPLES = [
  {
    title: 'Morning Briefing',
    speaker: 'ReminAI Voice',
    text: '“Good morning Eleanor! Today is Tuesday, sunny and 72 degrees. Your daughter Sarah called—she is bringing your favorite peach cobbler at 2:00 PM.”',
  },
  {
    title: 'Memory Recall',
    speaker: 'ReminAI Voice',
    text: '“Here is a photo from Lake Tahoe with your granddaughter Chloe. You were teaching her how to skip stones across the water. Remember how she laughed?”',
  },
  {
    title: 'Evening Comfort',
    speaker: 'ReminAI Voice',
    text: '“You are safe at home, Eleanor. Everything is calm and peaceful. Would you like to listen to your favorite melody, Moon River?”',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { currentUser, userProfile, loading: authLoading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isPlayingDemo, setIsPlayingDemo] = useState(false)
  const [activeSampleIndex, setActiveSampleIndex] = useState(0)

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      const destination = userProfile.role === 'patient' 
        ? '/patient/home' 
        : '/caregiver/dashboard'
      navigate(destination, { replace: true })
    }
  }, [currentUser, userProfile, authLoading, navigate])

  // Track scroll position for sticky navigation glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-close mobile drawer when window resizes to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Interactive Voice Demo cycle timer
  useEffect(() => {
    let interval = null
    if (isPlayingDemo) {
      interval = setInterval(() => {
        setActiveSampleIndex((prev) => (prev + 1) % VOICE_DEMO_SAMPLES.length)
      }, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlayingDemo])

  const toggleVoiceDemo = () => {
    setIsPlayingDemo((prev) => !prev)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAF9',
        color: '#1E1B4B',
        overflowX: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ─── 1. NAVIGATION BAR ─────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          transition: 'all 0.3s ease',
          background: scrolled
            ? 'rgba(15, 10, 46, 0.90)'
            : 'rgba(15, 10, 46, 0.70)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.35)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8B7CF6 0%, #14B8A6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(139, 124, 246, 0.45)',
                flexShrink: 0,
              }}
            >
              <Brain size={26} color="#FFFFFF" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                }}
              >
                Memory <span style={{ color: '#A78BFA' }}>Guardian</span>
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#5EEAD4',
                }}
              >
                ReminAI Companion
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 32,
            }}
            className="md:flex"
          >
            <a
              href="#features"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 15,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5EEAD4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 15,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5EEAD4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              How It Works
            </a>
            <a
              href="#preview"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 15,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5EEAD4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              Patient View
            </a>
            <a
              href="#safety"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 15,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5EEAD4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              Safety
            </a>
            <a
              href="#family"
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 15,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5EEAD4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
            >
              Family
            </a>
          </nav>

          {/* Desktop CTA Action Buttons */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 14,
            }}
            className="md:flex"
          >
            <Link
              to="/login"
              style={{
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 18px',
                borderRadius: 10,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 12,
                boxShadow: '0 4px 18px rgba(139, 124, 246, 0.45)',
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 10,
              padding: 8,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              background: 'rgba(15, 10, 46, 0.98)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
            className="md:hidden animate-fade-in"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              How It Works
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              Patient View
            </a>
            <a
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              Safety
            </a>
            <a
              href="#family"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              Family Stories
            </a>
            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 76px)',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0F0A2E 0%, #1E1B4B 40%, #312E81 70%, #4C1D95 100%)',
          color: '#FFFFFF',
          padding: '80px 24px',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Glow Orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 124, 246, 0.28) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-10%',
            width: '45vw',
            height: '45vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(70px)',
          }}
        />

        {/* Ambient Grid Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            opacity: 0.65,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            position: 'relative',
            zIndex: 10,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 56,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Headlines & Actions */}
            <div>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(139, 124, 246, 0.22)',
                  border: '1px solid rgba(167, 139, 250, 0.35)',
                  marginBottom: 24,
                }}
                className="animate-fade-in"
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#5EEAD4',
                    boxShadow: '0 0 10px #5EEAD4',
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#E0E7FF',
                    letterSpacing: '0.02em',
                  }}
                >
                  AI-Powered Memory Companion
                </span>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)',
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: '-0.025em',
                  marginBottom: 24,
                }}
              >
                <span style={{ color: '#FFFFFF', display: 'block' }}>
                  Memories Connect Us.
                </span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #DDD6FE 0%, #A78BFA 45%, #5EEAD4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'block',
                  }}
                >
                  Care Protects Us.
                </span>
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                  color: 'rgba(243, 244, 246, 0.88)',
                  lineHeight: 1.65,
                  maxWidth: 580,
                  marginBottom: 36,
                }}
              >
                AI-powered memory companion for dementia care. Bridging cognitive gaps with familiar voice dialog, face recognition, and 24/7 intelligent safety tracking for total peace of mind.
              </p>

              {/* Two CTA Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'center',
                  marginBottom: 36,
                }}
              >
                <button
                  onClick={() => navigate('/register')}
                  className="btn btn-primary"
                  style={{
                    padding: '16px 32px',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 8px 28px rgba(139, 124, 246, 0.45)',
                  }}
                >
                  Start as Caregiver
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('preview')
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                    else navigate('/patient')
                  }}
                  className="btn btn-secondary"
                  style={{
                    padding: '15px 30px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(8px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                    e.currentTarget.style.borderColor = '#A78BFA'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Patient View
                </button>
              </div>

              {/* Interactive Audio Voice Preview Trigger */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  maxWidth: 520,
                  marginBottom: 32,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <button
                  onClick={toggleVoiceDemo}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isPlayingDemo
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : 'linear-gradient(135deg, #8B7CF6, #6D28D9)',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(139, 124, 246, 0.4)',
                    flexShrink: 0,
                  }}
                  aria-label={isPlayingDemo ? 'Pause Voice Sample' : 'Play Voice Sample'}
                >
                  {isPlayingDemo ? <Volume2 size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5EEAD4' }}>
                      {VOICE_DEMO_SAMPLES[activeSampleIndex].title}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {isPlayingDemo ? 'Speaking with Groq AI…' : 'Click to hear Groq AI Companion'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.9)',
                      margin: '4px 0 0',
                      lineHeight: 1.4,
                      fontStyle: 'italic',
                    }}
                  >
                    {VOICE_DEMO_SAMPLES[activeSampleIndex].text}
                  </p>
                </div>
              </div>

              {/* Trust Indicators Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} color="#5EEAD4" />
                  <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)' }}>
                    HIPAA Privacy Compliant
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={16} color="#F472B6" />
                  <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)' }}>
                    Endorsed by Care Specialists
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Animated Brain/Heart & Floating Stat Cards */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 460,
              }}
            >
              {/* Concentric Glow Rings */}
              <div
                style={{
                  position: 'absolute',
                  width: 380,
                  height: 380,
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(167, 139, 250, 0.25)',
                  animation: 'spin-slow 28s linear infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  boxShadow: '0 0 50px rgba(139, 124, 246, 0.25)',
                }}
              />

              {/* Central Floating Brain / Heart Animated Graphic */}
              <div
                className="animate-float"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(139, 124, 246, 0.45) 0%, rgba(20, 184, 166, 0.35) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow:
                    '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(167, 139, 250, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Intertwined Brain & Heart Icons */}
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <Brain
                    size={84}
                    color="#C4B5FD"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      filter: 'drop-shadow(0 0 16px rgba(196, 181, 253, 0.8))',
                    }}
                  />
                  <Heart
                    size={42}
                    color="#F43F5E"
                    fill="#F43F5E"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      filter: 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))',
                      animation: 'breathe 2.4s ease-in-out infinite',
                    }}
                  />
                </div>

                {/* Animated Voice Soundwave Bars */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 14,
                    height: 24,
                  }}
                >
                  {[16, 24, 12, 28, 18, 26, 14, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3.5,
                        height: isPlayingDemo ? h * 1.1 : h * 0.7,
                        background: '#5EEAD4',
                        borderRadius: 3,
                        boxShadow: '0 0 6px #5EEAD4',
                        animation: `waveform ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Stat Card 1: Top Right */}
              <div
                className="animate-float"
                style={{
                  position: 'absolute',
                  top: 15,
                  right: -10,
                  background: 'rgba(30, 27, 75, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  zIndex: 3,
                  animationDelay: '0.4s',
                  maxWidth: 240,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(139, 124, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={22} color="#A78BFA" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                    500+ Memories
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Preserved Forever
                  </div>
                </div>
              </div>

              {/* Floating Stat Card 2: Bottom Left */}
              <div
                className="animate-float"
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: -15,
                  background: 'rgba(30, 27, 75, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  zIndex: 3,
                  animationDelay: '1.2s',
                  maxWidth: 240,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(20, 184, 166, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={22} color="#5EEAD4" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                    24/7 Safety
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Live GPS Geofencing
                  </div>
                </div>
              </div>

              {/* Floating Stat Card 3: Bottom Right */}
              <div
                className="animate-float"
                style={{
                  position: 'absolute',
                  bottom: -15,
                  right: 20,
                  background: 'rgba(30, 27, 75, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  zIndex: 3,
                  animationDelay: '2s',
                  maxWidth: 250,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(244, 63, 94, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mic size={22} color="#F472B6" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                    AI-Powered Companion
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Groq Ultra-Fast Voice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. FEATURES SECTION (White Background) ────────────────── */}
      <section
        id="features"
        style={{
          padding: '110px 24px',
          background: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 64px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6D28D9',
                background: '#F5F3FF',
                padding: '6px 16px',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              Intelligent Care Ecosystem
            </span>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                color: '#1E1B4B',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Everything Your Family Needs
            </h2>
            <p
              style={{
                fontSize: 17,
                color: '#6B7280',
                lineHeight: 1.6,
              }}
            >
              Engineered with geriatric clinicians to restore comfort, safeguard independence, and reduce emotional burden for dementia caregivers.
            </p>
          </div>

          {/* 6-Grid Feature Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 32,
            }}
          >
            {/* Feature 1: AI Voice Companion */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.15) 0%, rgba(109, 40, 217, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Mic size={28} color="#6D28D9" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6D28D9',
                  background: '#F5F3FF',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                Groq-Powered
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                AI Voice Companion
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                Sub-second conversational intelligence powered by Groq and Edge-TTS. Responds with boundless patience to repetitive questions, tells comforting stories, and soothes sunset agitation.
              </p>
            </div>

            {/* Feature 2: Family Recognition */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Users size={28} color="#0D9488" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#0D9488',
                  background: '#F0FDFA',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                Face ID
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Family Recognition
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                Gentle on-device facial recognition reminds your loved one of visiting relatives, grandchildren, and nurses. Displays names, warm memories, and prevents confusion before it begins.
              </p>
            </div>

            {/* Feature 3: Memory Bank */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(29, 78, 216, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <BookOpen size={28} color="#2563EB" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#2563EB',
                  background: '#EFF6FF',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                Digital Memories
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Memory Bank
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                A digital photo and audio scrapbook preserving lifelong milestones. Family members can remotely upload photos, voice recordings, and favorite songs that anchor meaningful recollection.
              </p>
            </div>

            {/* Feature 4: Daily Routine */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Calendar size={28} color="#D97706" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#D97706',
                  background: '#FFFBEB',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                Reminders
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Daily Routine
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                Gentle spoken cues for medication, hydration, meals, and appointments. Eliminates clock confusion with large clear time indicators and reassuring schedule briefings.
              </p>
            </div>

            {/* Feature 5: Safety Tracking */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <MapPin size={28} color="#059669" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                GPS Geofencing
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Safety Tracking
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                Real-time satellite & street mapping with precision geofenced safe zones around home or care centers. Instant notifications trigger if your loved one wanders outside safe boundaries.
              </p>
            </div>

            {/* Feature 6: Emergency Alerts */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 20,
                border: '1px solid #E5E4F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Bell size={28} color="#DC2626" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#DC2626',
                  background: '#FEF2F2',
                  padding: '3px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                Instant Notifications
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Emergency Alerts
              </h3>
              <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.65 }}>
                One-touch patient SOS with automatic live location broadcasting to all family caregivers. Multichannel alerts ensure no urgent notification is ever overlooked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS SECTION (Soft Purple #F5F3FF) ──────────── */}
      <section
        id="how-it-works"
        style={{
          padding: '110px 24px',
          background: '#F5F3FF',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 64px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6D28D9',
                background: '#EDE9FE',
                padding: '6px 16px',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              Simple 3-Step Process
            </span>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                color: '#1E1B4B',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              How It Works
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', lineHeight: 1.6 }}>
              Getting started with Memory Guardian is effortless for caregivers and intuitive for seniors.
            </p>
          </div>

          {/* 3-Step Process Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 36,
              position: 'relative',
            }}
          >
            {/* Step 1: Setup */}
            <div
              className="card"
              style={{
                padding: 40,
                borderRadius: 24,
                background: '#FFFFFF',
                border: '1.5px solid #E9D5FF',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Step Number Watermark */}
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 72,
                  fontWeight: 900,
                  color: 'rgba(139, 124, 246, 0.12)',
                  position: 'absolute',
                  top: 16,
                  right: 24,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                01
              </div>

              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #8B7CF6 0%, #6D28D9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 28,
                  boxShadow: '0 6px 18px rgba(139, 124, 246, 0.35)',
                }}
              >
                1
              </div>

              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Step 1: Setup
              </h3>
              <p
                style={{
                  color: '#4B5563',
                  fontSize: 15,
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}
              >
                Create profiles, upload family memories, and set customized safe zones on the map. Caregivers can add voice notes and designate emergency contacts in minutes.
              </p>

              {/* Step Illustration */}
              <div
                style={{
                  marginTop: 'auto',
                  background: '#F8F7FF',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid #EDE9FE',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#C4B5FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={16} color="#4C1D95" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>
                      Eleanor's Vault Profile
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      14 Photos & 3 Safe Zones Defined
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    height: 6,
                    background: '#E5E4F0',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #8B7CF6, #14B8A6)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Connect */}
            <div
              className="card"
              style={{
                padding: 40,
                borderRadius: 24,
                background: '#FFFFFF',
                border: '1.5px solid #CCFBF1',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Step Number Watermark */}
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 72,
                  fontWeight: 900,
                  color: 'rgba(20, 184, 166, 0.12)',
                  position: 'absolute',
                  top: 16,
                  right: 24,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                02
              </div>

              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 28,
                  boxShadow: '0 6px 18px rgba(20, 184, 166, 0.35)',
                }}
              >
                2
              </div>

              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Step 2: Connect
              </h3>
              <p
                style={{
                  color: '#4B5563',
                  fontSize: 15,
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}
              >
                Patient interacts via voice, views memories, and receives gentle audio reassurance. Large buttons and automated face recognition make daily use natural and joyful.
              </p>

              {/* Step Illustration */}
              <div
                style={{
                  marginTop: 'auto',
                  background: '#F0FDFA',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid #CCFBF1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#14B8A6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Volume2 size={13} color="#FFFFFF" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>
                    ReminAI Companion:
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#134E4A', fontStyle: 'italic', margin: 0 }}>
                  "Hello Eleanor, Sarah called! She'll visit this afternoon at 2 PM."
                </p>
              </div>
            </div>

            {/* Step 3: Protect */}
            <div
              className="card"
              style={{
                padding: 40,
                borderRadius: 24,
                background: '#FFFFFF',
                border: '1.5px solid #DBEAFE',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Step Number Watermark */}
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 72,
                  fontWeight: 900,
                  color: 'rgba(59, 130, 246, 0.12)',
                  position: 'absolute',
                  top: 16,
                  right: 24,
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                03
              </div>

              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 28,
                  boxShadow: '0 6px 18px rgba(59, 130, 246, 0.35)',
                }}
              >
                3
              </div>

              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1E1B4B',
                  marginBottom: 12,
                }}
              >
                Step 3: Protect
              </h3>
              <p
                style={{
                  color: '#4B5563',
                  fontSize: 15,
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}
              >
                Caregivers monitor safety in real-time. Continuous GPS geofencing and battery telemetry alert you immediately if your loved one leaves their designated zone.
              </p>

              {/* Step Illustration */}
              <div
                style={{
                  marginTop: 'auto',
                  background: '#EFF6FF',
                  borderRadius: 14,
                  padding: 18,
                  border: '1px solid #BFDBFE',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 8px #10B981',
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A' }}>
                      Status: Safe Inside Home
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>
                    Live GPS Radar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. PATIENT INTERFACE PREVIEW (White Background) ───────── */}
      <section
        id="preview"
        style={{
          padding: '110px 24px',
          background: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 56,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Ergonomics & Philosophy */}
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#0D9488',
                  background: '#F0FDFA',
                  padding: '6px 16px',
                  borderRadius: 999,
                  marginBottom: 16,
                }}
              >
                Designed for Simplicity
              </span>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                  fontWeight: 800,
                  color: '#1E1B4B',
                  lineHeight: 1.2,
                  marginBottom: 20,
                }}
              >
                Designed for Dignity. Built for Simplicity.
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: '#4B5563',
                  lineHeight: 1.65,
                  marginBottom: 28,
                }}
              >
                Traditional touchscreens and confusing app menus frustrate seniors facing cognitive decline. Memory Guardian eliminates disorientation with an ultra-accessible, tactile big-button interface.
              </p>

              {/* Bullet Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <strong style={{ color: '#1E1B4B', fontSize: 16 }}>
                      High-Contrast Large Buttons
                    </strong>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: '2px 0 0' }}>
                      Oversized tactile touch zones accommodating tremors and declining visual acuity.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <strong style={{ color: '#1E1B4B', fontSize: 16 }}>
                      Voice-First AI Interaction
                    </strong>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: '2px 0 0' }}>
                      Just speak normally—no wake phrases, technical menus, or confusing logins required.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <strong style={{ color: '#1E1B4B', fontSize: 16 }}>
                      Instant One-Tap Family SOS
                    </strong>
                    <p style={{ color: '#6B7280', fontSize: 14, margin: '2px 0 0' }}>
                      Immediate direct phone and emergency notification with live location beaconing.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/patient"
                className="btn btn-teal btn-lg"
                style={{
                  borderRadius: 14,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                Experience Patient Mode
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* Right Column: Mock Patient Interface Mockup */}
            <div>
              <div
                style={{
                  background: '#1E1B4B',
                  padding: 16,
                  borderRadius: 32,
                  boxShadow: '0 24px 60px rgba(30, 27, 75, 0.28)',
                  border: '6px solid #2E2A63',
                }}
              >
                {/* Tablet Screen Content */}
                <div
                  style={{
                    background: '#F8F7FF',
                    borderRadius: 22,
                    padding: 24,
                    overflow: 'hidden',
                  }}
                >
                  {/* Tablet Top Status Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '2px solid #E5E4F0',
                      paddingBottom: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 22,
                          fontWeight: 800,
                          color: '#1E1B4B',
                        }}
                      >
                        10:30 AM
                      </div>
                      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>
                        Tuesday, October 14
                      </div>
                    </div>
                    <div
                      style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10B981',
                        }}
                      />
                      Sunny 72°F • Home
                    </div>
                  </div>

                  {/* Greeting Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #8B7CF6 0%, #6D28D9 100%)',
                      borderRadius: 16,
                      padding: '16px 20px',
                      color: '#FFFFFF',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>Good morning, Eleanor!</div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>
                        Sarah will visit today at 2:00 PM
                      </div>
                    </div>
                    <Heart size={26} color="#FDA4AF" fill="#FDA4AF" />
                  </div>

                  {/* 4 Big Patient Buttons */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 16,
                    }}
                  >
                    {/* Big Button 1 */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #8B7CF6 0%, #7C3AED 100%)',
                        borderRadius: 20,
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(139, 124, 246, 0.35)',
                      }}
                    >
                      <Mic size={36} color="#FFFFFF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Talk to Companion
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        Ask any question
                      </div>
                    </div>

                    {/* Big Button 2 */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                        borderRadius: 20,
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(20, 184, 166, 0.35)',
                      }}
                    >
                      <Camera size={36} color="#FFFFFF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Family Photos
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        Memories & Stories
                      </div>
                    </div>

                    {/* Big Button 3 */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        borderRadius: 20,
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)',
                      }}
                    >
                      <Calendar size={36} color="#FFFFFF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Today's Plan
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        Medication & Lunch
                      </div>
                    </div>

                    {/* Big Button 4: Emergency SOS */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        borderRadius: 20,
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)',
                      }}
                    >
                      <Bell size={36} color="#FFFFFF" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        Call Sarah (SOS)
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        One-touch help
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. SAFETY SECTION (Dark Background #1E1B4B) ──────────── */}
      <section
        id="safety"
        style={{
          padding: '110px 24px',
          background: '#1E1B4B',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 56,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Safety Tracking Narrative */}
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5EEAD4',
                  background: 'rgba(20, 184, 166, 0.2)',
                  border: '1px solid rgba(94, 234, 212, 0.3)',
                  padding: '6px 16px',
                  borderRadius: 999,
                  marginBottom: 16,
                }}
              >
                24/7 Geofence Shield
              </span>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  marginBottom: 20,
                }}
              >
                Never Worry About Wandering Again
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.65,
                  marginBottom: 32,
                }}
              >
                Wandering is the single greatest anxiety for dementia families. Memory Guardian pairs OpenFreeMap satellite precision with intelligent perimeter geofencing to protect loved ones around the clock.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(94, 234, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={22} color="#5EEAD4" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      Customizable Safe Zones
                    </h4>
                    <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0' }}>
                      Draw safe zones around home, neighborhood parks, or care homes in two clicks.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={22} color="#F87171" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      Instant Perimeter Breach Alerts
                    </h4>
                    <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0' }}>
                      If boundary is crossed, all caregivers receive instant push notifications and phone alerts with live coordinates.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(139, 124, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Shield size={22} color="#C4B5FD" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      Live Battery & Motion Telemetry
                    </h4>
                    <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0 0' }}>
                      Monitor patient device battery level, network connection, and walking pace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Simulated Map & Mock Alert Notification Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Map Visualization Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #130F3A 0%, #1B174F 100%)',
                  borderRadius: 24,
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  height: 340,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* Street Grid Graphic Lines */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Safe Zone Geofence Circle */}
                <div
                  style={{
                    position: 'absolute',
                    width: 210,
                    height: 210,
                    borderRadius: '50%',
                    background: 'rgba(20, 184, 166, 0.14)',
                    border: '2px dashed #14B8A6',
                    boxShadow: '0 0 35px rgba(20, 184, 166, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#5EEAD4',
                      background: 'rgba(15, 10, 46, 0.7)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Home Safe Zone (500m)
                  </span>

                  {/* Pulsing GPS Pin Center */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(94, 234, 212, 0.4)',
                        animation: 'pulse-glow 2s infinite',
                      }}
                    />
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '3px solid #FFFFFF',
                        boxShadow: '0 0 12px #10B981',
                        zIndex: 2,
                      }}
                    />
                  </div>
                </div>

                {/* Map Floating Status Tag */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    background: 'rgba(15, 10, 46, 0.85)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#5EEAD4',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 6px #10B981',
                    }}
                  />
                  OpenFreeMap GPS Live • Accuracy ± 3m
                </div>
              </div>

              {/* Mock Alert Notification Card */}
              <div
                style={{
                  background: 'rgba(30, 27, 75, 0.95)',
                  border: '1.5px solid rgba(139, 124, 246, 0.4)',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={24} color="#EF4444" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                      Safe Zone Check
                    </span>
                    <span style={{ fontSize: 11, color: '#5EEAD4', fontWeight: 600 }}>
                      Just Now
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0' }}>
                    Eleanor is safe inside <strong>Home Zone</strong>. Device battery is at 92%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIAL / TRUST SECTION (White Background) ─────── */}
      <section
        id="family"
        style={{
          padding: '110px 24px',
          background: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 64px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6D28D9',
                background: '#F5F3FF',
                padding: '6px 16px',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              Real Caregiver Experiences
            </span>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                color: '#1E1B4B',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Trusted by Families. Loved by Patients.
            </h2>
            <p style={{ fontSize: 17, color: '#6B7280', lineHeight: 1.6 }}>
              Real stories from sons, daughters, and healthcare specialists who regained peaceful nights and joyful connections.
            </p>
          </div>

          {/* 3 Testimonial Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 32,
            }}
          >
            {/* Review 1 */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 22,
                background: '#FFFFFF',
                border: '1px solid #E5E4F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* 5 Stars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: '#374151',
                    fontStyle: 'italic',
                    marginBottom: 24,
                  }}
                >
                  "When Mom started wandering into the neighborhood at 5 AM, our family was terrified. Memory Guardian’s geofencing gave us our sleep back. And she genuinely loves chatting with the voice companion when she feels sunset anxiety."
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#8B7CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  SJ
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>
                    Sarah Jenkins
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    Caregiver for Mother (Age 81) • Austin, TX
                  </div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 22,
                background: '#FFFFFF',
                border: '1px solid #E5E4F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* 5 Stars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: '#374151',
                    fontStyle: 'italic',
                    marginBottom: 24,
                  }}
                >
                  "As a geriatric neurologist, I recommend ReminAI to families experiencing early to moderate Alzheimer's. The cognitive anchoring through personalized photo albums and repetitive audio reassurance significantly reduces panic."
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#14B8A6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  MV
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>
                    Dr. Marcus Vance, MD
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    Neurology & Memory Care Consultant • Boston, MA
                  </div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 22,
                background: '#FFFFFF',
                border: '1px solid #E5E4F0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* 5 Stars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: '#374151',
                    fontStyle: 'italic',
                    marginBottom: 24,
                  }}
                >
                  "The face recognition is astonishing. Dad used to feel embarrassed when his grandkids visited because he couldn’t recall their names. Now the tablet softly reminds him 'Here is Chloe!' and seeing his eyes light up makes everything worth it."
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  DR
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>
                    David & Elena Rossi
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    Caring for Father (Age 84) • Chicago, IL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. CTA SECTION (Gradient Purple-Teal) ─────────────────── */}
      <section
        id="cta"
        style={{
          padding: '100px 24px',
          background: '#FAFAF9',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #0D9488 100%)',
              borderRadius: 32,
              padding: '64px 36px',
              textAlign: 'center',
              color: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(109, 40, 217, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background Radial Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-20%',
                width: '60vw',
                height: '60vw',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5EEAD4',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 16px',
                  borderRadius: 999,
                  marginBottom: 20,
                }}
              >
                Start Safeguarding Today
              </span>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  marginBottom: 20,
                  color: '#FFFFFF',
                }}
              >
                Start Protecting Your Loved One Today
              </h2>
              <p
                style={{
                  fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.6,
                  marginBottom: 36,
                }}
              >
                Join thousands of caregivers giving their loved ones the comfort of cherished memories and the reliable protection of 24/7 intelligent safety monitoring.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <Link
                  to="/register"
                  className="btn btn-teal btn-xl"
                  style={{
                    padding: '16px 36px',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 14,
                    boxShadow: '0 8px 24px rgba(20, 184, 166, 0.45)',
                  }}
                >
                  Create Free Account
                  <ChevronRight size={18} />
                </Link>

                <a
                  href="#preview"
                  className="btn btn-secondary btn-xl"
                  style={{
                    padding: '15px 32px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Explore Demo
                </a>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  marginTop: 28,
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.8)',
                  flexWrap: 'wrap',
                }}
              >
                <span>✓ 14-Day Free Trial</span>
                <span>✓ Setup in 3 Minutes</span>
                <span>✓ Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER ─────────────────────────────────────────────── */}
      <footer
        id="footer"
        style={{
          background: '#0F0A2E',
          color: '#FFFFFF',
          padding: '80px 24px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 48,
              marginBottom: 56,
            }}
          >
            {/* Col 1: Brand & Mission */}
            <div style={{ maxWidth: 320 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #8B7CF6 0%, #14B8A6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Brain size={22} color="#FFFFFF" />
                </div>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#FFFFFF',
                  }}
                >
                  Memory <span style={{ color: '#A78BFA' }}>Guardian</span>
                </span>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Intelligent memory stimulation and proactive wandering protection designed with love for dementia patients and caregivers.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5EEAD4' }}>
                <Shield size={16} />
                <span>HIPAA-Ready & Encrypted</span>
              </div>
            </div>

            {/* Col 2: Platform Features */}
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: 20,
                }}
              >
                Platform
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li>
                  <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    AI Voice Companion (Groq)
                  </a>
                </li>
                <li>
                  <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Facial Recognition ID
                  </a>
                </li>
                <li>
                  <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Digital Memory Vault
                  </a>
                </li>
                <li>
                  <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Daily Routine & Meds
                  </a>
                </li>
                <li>
                  <a href="#safety" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    GPS Geofence Tracking
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: 20,
                }}
              >
                Caregiver Resources
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li>
                  <a href="#how-it-works" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Caregiver Starter Guide
                  </a>
                </li>
                <li>
                  <a href="#safety" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Managing Sundowning Anxiety
                  </a>
                </li>
                <li>
                  <a href="#family" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Family Stories & Tips
                  </a>
                </li>
                <li>
                  <Link to="/contact" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Care Support Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Security */}
            <div>
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: 20,
                }}
              >
                Legal & Privacy
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li>
                  <Link to="/privacy" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/biometrics" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Biometric Data Security
                  </Link>
                </li>
                <li>
                  <Link to="/contact" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: 14 }}>
                    Contact & Inquiries
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Medical Disclaimer */}
          <div
            style={{
              paddingTop: 32,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <div>
                © {CURRENT_YEAR} Memory Guardian (ReminAI). All rights reserved.
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <Link to="/privacy" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
                  Privacy
                </Link>
                <Link to="/terms" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
                  Terms
                </Link>
                <Link to="/contact" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
                  Contact
                </Link>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.6, margin: 0 }}>
              Medical Disclaimer: Memory Guardian (ReminAI) is an assistive digital companion designed to aid memory stimulation and caregiver monitoring. It is not an FDA-approved medical diagnostic tool or a replacement for emergency 911 dispatch.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
