import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { login, currentUser, userProfile, loading: authLoading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || null

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      const destination = userProfile.role === 'patient' 
        ? '/patient/home' 
        : '/caregiver/dashboard'
      navigate(destination, { replace: true })
    }
  }, [currentUser, userProfile, authLoading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    try {
      const { profile } = await login(email, password)
      if (from) { navigate(from, { replace: true }); return }
      navigate(profile?.role === 'patient' ? '/patient/home' : '/caregiver/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A2E 0%, #1E1B4B 50%, #4C1D95 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', width:400, height:400, top:-100, right:-100, borderRadius:'50%', background:'rgba(139,124,246,0.12)', filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, bottom:-80, left:-80, borderRadius:'50%', background:'rgba(20,184,166,0.08)', filter:'blur(60px)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:12, textDecoration:'none' }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#8B7CF6,#6D28D9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(109,40,217,0.4)' }}>
              <Brain size={28} color="white" />
            </div>
          </Link>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:28, color:'white', marginTop:16, marginBottom:6 }}>
            Memory Guardian
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:24, padding:36 }}>
          {/* Demo hint */}
          <div style={{ background:'rgba(139,124,246,0.15)', border:'1px solid rgba(139,124,246,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:24 }}>
            <p style={{ fontSize:12, color:'#A78BFA', fontWeight:600, marginBottom:4 }}>Demo Mode</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>
              Create an account at /register to get started. Firebase must be configured for real authentication.
            </p>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:20 }}>
              <AlertCircle size={16} color="#FCA5A5" />
              <p style={{ fontSize:13, color:'#FCA5A5' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>
                Email Address
              </label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.4)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width:'100%', padding:'12px 14px 12px 42px',
                    background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)',
                    borderRadius:12, color:'white', fontSize:14, outline:'none',
                    boxSizing:'border-box', transition:'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8B7CF6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.4)' }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width:'100%', padding:'12px 46px 12px 42px',
                    background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.15)',
                    borderRadius:12, color:'white', fontSize:14, outline:'none',
                    boxSizing:'border-box', transition:'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8B7CF6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4 }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'14px',
                background: loading ? 'rgba(139,124,246,0.5)' : 'linear-gradient(135deg,#8B7CF6,#6D28D9)',
                color:'white', border:'none', borderRadius:12,
                fontWeight:700, fontSize:16, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow:'0 6px 20px rgba(109,40,217,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                transition:'all 0.2s',
              }}
            >
              {loading ? <><Loader2 size={18} style={{ animation:'spin-slow 0.8s linear infinite' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'rgba(255,255,255,0.5)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#A78BFA', fontWeight:700, textDecoration:'none' }}>
              Create one free
            </Link>
          </p>
        </div>

        <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'rgba(255,255,255,0.3)' }}>
          <Link to="/" style={{ color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
