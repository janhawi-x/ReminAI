import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain,
  Heart,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('caregiver') // 'caregiver' | 'patient'
  const [patientId, setPatientId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, currentUser, userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      const destination = userProfile.role === 'patient' 
        ? '/patient/home' 
        : '/caregiver/dashboard'
      navigate(destination, { replace: true })
    }
  }, [currentUser, userProfile, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please choose a password.')
      return
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }
    if (role === 'caregiver' && !patientId.trim()) {
      setError('Enter the Patient ID supplied when the patient account was created.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await register(email, password, role, fullName, patientId.trim() || null)
      const userRole = res?.profile?.role || role

      // Redirect according to chosen role
      if (userRole === 'patient') {
        navigate('/patient/home', { replace: true })
      } else {
        navigate('/caregiver/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Registration error:', err)
      let msg = 'Failed to create account. Please try again.'
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.'
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use at least 6 characters.'
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.'
      } else if (err.message) {
        msg = err.message
      }
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 py-10"
      style={{
        background: 'linear-gradient(135deg, #0F0A2E 0%, #1E1B4B 40%, #312E81 70%, #4C1D95 100%)',
      }}
    >
      <div className="w-full max-w-lg animate-fade-in">
        {/* Glass Card Container */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), 0 0 40px rgba(139, 124, 246, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
          className="p-8 sm:p-10"
        >
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center relative mb-3">
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #8B7CF6 0%, #6D28D9 100%)',
                  boxShadow: '0 8px 20px rgba(109, 40, 217, 0.4)',
                }}
                className="flex items-center justify-center text-white"
              >
                <Brain size={32} strokeWidth={2.2} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  background: '#14B8A6',
                  borderRadius: '50%',
                  padding: '5px',
                  border: '2px solid white',
                }}
                className="text-white flex items-center justify-center"
              >
                <Heart size={12} fill="white" />
              </div>
            </div>

            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '26px',
                fontWeight: 800,
                color: '#1E1B4B',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Create Your Account
            </h1>
            <p style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
              Join Memory Guardian for intelligent care & cognitive assistance
            </p>
          </div>

          {/* Error Message Display */}
          {error && (
            <div
              className="mb-6 p-3.5 rounded-xl flex items-start gap-3 animate-fade-in"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                I am joining as:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Caregiver Option */}
                <div
                  onClick={() => setRole('caregiver')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    role === 'caregiver'
                      ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                      <Shield size={17} />
                      <span>Caregiver / Family</span>
                    </div>
                    {role === 'caregiver' && (
                      <CheckCircle2 size={16} className="text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Monitor safety, routines, and safe zones
                  </p>
                </div>

                {/* Patient Option */}
                <div
                  onClick={() => setRole('patient')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    role === 'patient'
                      ? 'border-teal-600 bg-teal-50/70 shadow-sm'
                      : 'border-gray-200 hover:border-teal-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                      <HeartHandshake size={17} />
                      <span>Patient</span>
                    </div>
                    {role === 'patient' && (
                      <CheckCircle2 size={16} className="text-teal-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Friendly companion, memory book & daily reminders
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Connor"
                  autoComplete="name"
                  className="input pl-10"
                  style={{ height: '44px', fontSize: '14px' }}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="input pl-10"
                  style={{ height: '44px', fontSize: '14px' }}
                  required
                />
              </div>
            </div>

            {/* Patient ID Field for Caregivers */}
            {role === 'caregiver' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Link Patient ID
                  </label>
                </div>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-1A2B3C4D"
                  className="input"
                  style={{ height: '44px', fontSize: '14px' }}
                  required
                />
              </div>
            )}

            {/* Password & Confirm Password in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 chars"
                    autoComplete="new-password"
                    className="input pl-9 pr-9"
                    style={{ height: '44px', fontSize: '13px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="input pl-9 pr-9"
                    style={{ height: '44px', fontSize: '13px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full mt-3"
              style={{
                height: '48px',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin-slow 0.8s linear infinite',
                    }}
                  />
                  <span>Creating Account…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Complete Registration</span>
                  <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          {/* Login Navigation Link */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-purple-700 hover:text-purple-900 hover:underline transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
