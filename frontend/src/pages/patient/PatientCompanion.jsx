import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mic,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  User,
  Bot,
  Image as ImageIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function PatientCompanion() {
  const { userProfile, userName, patientId } = useAuth()
  const navigate = useNavigate()

  // State
  const [status, setStatus] = useState('idle') // 'idle' | 'recording' | 'processing' | 'speaking' | 'error'
  const [statusText, setStatusText] = useState('Tap the microphone to talk to me')
  const [transcription, setTranscription] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [relevantPhoto, setRelevantPhoto] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioPlayerRef = useRef(null)
  const speechUtteranceRef = useRef(null)

  const patientDisplayName =
    userProfile?.preferredName ||
    userProfile?.name?.split(' ')[0] ||
    userName?.split(' ')[0] ||
    'friend'

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.src = ''
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Auto-speak responses using SpeechSynthesis if backend audio isn't provided
  const speakText = useCallback(
    (text) => {
      if (isMuted) return
      if (!('speechSynthesis' in window)) return

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      speechUtteranceRef.current = utterance
      utterance.rate = 0.9 // gentle, slightly slower pace for elderly/dementia patients
      utterance.pitch = 1.05 // warm and friendly
      utterance.lang = 'en-US'

      utterance.onstart = () => {
        setStatus('speaking')
        setStatusText('Memory Guardian is speaking...')
      }
      utterance.onend = () => {
        setStatus('idle')
        setStatusText('Tap the microphone to talk to me')
      }
      utterance.onerror = () => {
        setStatus('idle')
        setStatusText('Tap the microphone to talk to me')
      }

      window.speechSynthesis.speak(utterance)
    },
    [isMuted]
  )

  // Start Voice Recording
  const startRecording = useCallback(async () => {
    setErrorMessage('')
    // Stop any ongoing speech
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    if (audioPlayerRef.current) audioPlayerRef.current.pause()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await handleSendAudio(audioBlob)
      }

      recorder.start()
      setStatus('recording')
      setStatusText('Listening to you... Speak clearly')
    } catch (err) {
      console.error('Microphone error:', err)
      setStatus('error')
      setErrorMessage(
        'Could not access your microphone. Please check your browser permissions.'
      )
      setStatusText('Microphone permission needed')
    }
  }, [patientDisplayName, patientId])

  // Stop Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setStatus('processing')
      setStatusText('Thinking and preparing response...')
    }
  }, [])

  // Toggle Recording Button
  const handleToggleRecord = useCallback(() => {
    if (status === 'recording') {
      stopRecording()
    } else if (status === 'idle' || status === 'error' || status === 'speaking') {
      startRecording()
    }
  }, [status, startRecording, stopRecording])

  // Send Recorded Audio to Companion API
  const handleSendAudio = async (audioBlob) => {
    setStatus('processing')
    setStatusText('Thinking...')

    try {
      const response = await api.companion.sendAudio(
        audioBlob,
        patientId || 'patient-demo-id',
        patientDisplayName
      )

      const userText = response?.transcript || response?.transcription || 'Spoken message'
      const aiText =
        response?.reply ||
        response?.response ||
        response?.message ||
        `Hello ${patientDisplayName}, I am right here with you. How can I brighten your day?`

      setTranscription(userText)
      setAiResponse(aiText)

      // Check for photo attachment in response
      if (response?.photo_url || response?.photo || response?.image_url) {
        setRelevantPhoto({
          url: response.photo_url || response.photo || response.image_url,
          caption: response.photo_caption || response.caption || 'A special memory for you',
        })
      } else {
        setRelevantPhoto(null)
      }

      // Add to conversation history
      setConversationHistory((prev) => [
        ...prev.slice(-4),
        { sender: 'user', text: userText },
        { sender: 'ai', text: aiText },
      ])

      // Play audio response: either from backend base64/url or Web Speech fallback
      if (response?.audio_base64 && audioPlayerRef.current) {
        setStatus('speaking')
        setStatusText('Memory Guardian is speaking...')
        audioPlayerRef.current.src = `data:audio/mp3;base64,${response.audio_base64}`
        audioPlayerRef.current.play().catch(() => speakText(aiText))
      } else if (response?.audio_url && audioPlayerRef.current) {
        setStatus('speaking')
        setStatusText('Memory Guardian is speaking...')
        audioPlayerRef.current.src = response.audio_url
        audioPlayerRef.current.play().catch(() => speakText(aiText))
      } else {
        speakText(aiText)
      }
    } catch (err) {
      console.error('Companion API error:', err)
      setStatus('error')
      setErrorMessage(
        'I had trouble hearing you just now. Would you like to try again?'
      )
      setStatusText('Connection issue, please try again')
    }
  }

  // Handle Quick Topic Prompt for testing / convenience
  const handleQuickPrompt = (promptText) => {
    if (status === 'recording' || status === 'processing') return
    setTranscription(promptText)
    setStatus('processing')
    setStatusText('Thinking...')

    // Simulate friendly instant response or fallback if mic is unavailable
    setTimeout(() => {
      let reply = ''
      let photo = null

      if (promptText.includes('family')) {
        reply = `Your daughter Sarah and grandson Leo love you very much! Sarah called this morning to check on you.`
        photo = {
          url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
          caption: 'Sarah and Leo at Sunday picnic',
        }
      } else if (promptText.includes('routine') || promptText.includes('schedule')) {
        reply = `Today you have afternoon tea at 3:00 PM and your gentle walk in the garden. Everything is going smoothly.`
      } else {
        reply = `I am always here with you, ${patientDisplayName}. You are safe and doing wonderfully today.`
      }

      setAiResponse(reply)
      setRelevantPhoto(photo)
      speakText(reply)
    }, 1200)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #09051C 0%, #150E38 50%, #281654 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* ─── Hidden Audio Player for backend TTS ─────────────────────── */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setStatus('idle')
          setStatusText('Tap the microphone to talk to me')
        }}
        onError={() => {
          if (aiResponse) speakText(aiResponse)
        }}
        style={{ display: 'none' }}
      />

      {/* ─── Top Navigation Bar ───────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          paddingBottom: '12px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => {
              const newMuted = !isMuted
              setIsMuted(newMuted)
              if (newMuted && window.speechSynthesis) window.speechSynthesis.cancel()
            }}
            className="btn btn-ghost"
            style={{
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
            }}
            aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX size={24} color="#F87171" /> : <Volume2 size={24} color="#A7F3D0" />}
          </button>
        </div>
      </header>

      {/* ─── Center Hero: Calming Avatar / Glowing Orb ─────────────────── */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '16px 0',
          textAlign: 'center',
          gap: '24px',
        }}
      >
        {/* Animated Orb Container */}
        <div
          style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer glow rings */}
          <div
            style={{
              position: 'absolute',
              inset: '-16px',
              borderRadius: '50%',
              background:
                status === 'recording'
                  ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0) 70%)'
                  : status === 'speaking'
                  ? 'radial-gradient(circle, rgba(20,184,166,0.45) 0%, rgba(20,184,166,0) 70%)'
                  : status === 'processing'
                  ? 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(168,85,247,0) 70%)'
                  : 'radial-gradient(circle, rgba(139,124,246,0.35) 0%, rgba(139,124,246,0) 70%)',
              animation: status === 'recording' ? 'breathe 1.2s ease-in-out infinite' : 'pulse-glow 2.5s ease-in-out infinite',
            }}
          />

          {/* Main animated orb */}
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background:
                status === 'recording'
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : status === 'speaking'
                  ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
                  : status === 'processing'
                  ? 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4338CA 100%)',
              boxShadow:
                status === 'recording'
                  ? '0 0 35px rgba(239, 68, 68, 0.7)'
                  : status === 'speaking'
                  ? '0 0 35px rgba(20, 184, 166, 0.7)'
                  : '0 0 35px rgba(139, 92, 246, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: status === 'processing' ? 'spin-slow 6s linear infinite' : 'breathe 3s ease-in-out infinite',
              transition: 'all 0.5s ease',
            }}
          >
            {status === 'recording' ? (
              <Mic size={54} color="#FFFFFF" />
            ) : status === 'speaking' ? (
              <Volume2 size={54} color="#FFFFFF" />
            ) : status === 'processing' ? (
              <Sparkles size={54} color="#FFFFFF" />
            ) : (
              <Bot size={54} color="#FFFFFF" />
            )}
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div>
          <h2
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 800,
              color: status === 'recording' ? '#FCA5A5' : status === 'speaking' ? '#99F6E4' : '#FFFFFF',
              letterSpacing: '-0.3px',
              marginBottom: '6px',
            }}
          >
            {statusText}
          </h2>
          <p style={{ fontSize: '16px', color: '#C4B5FD' }}>
            {status === 'recording'
              ? 'Tap the red button when you are finished talking'
              : 'I am always listening and here to help you remember'}
          </p>
        </div>

        {/* ─── Waveform Animation (When Recording) ────────────────────── */}
        {status === 'recording' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '40px',
              padding: '4px 20px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '999px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div className="waveform-bar" style={{ height: '32px', background: '#EF4444', animationDelay: '0.0s' }} />
            <div className="waveform-bar" style={{ height: '24px', background: '#F87171', animationDelay: '0.2s' }} />
            <div className="waveform-bar" style={{ height: '36px', background: '#EF4444', animationDelay: '0.4s' }} />
            <div className="waveform-bar" style={{ height: '20px', background: '#F87171', animationDelay: '0.1s' }} />
            <div className="waveform-bar" style={{ height: '28px', background: '#EF4444', animationDelay: '0.3s' }} />
          </div>
        )}

        {/* ─── Transcription Display (What Patient Said) ──────────────── */}
        {transcription && (
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '16px 20px',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'left',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <User size={18} color="#C4B5FD" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#DDD6FE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                You said:
              </span>
            </div>
            <p style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 500, lineHeight: 1.4 }}>
              "{transcription}"
            </p>
          </div>
        )}

        {/* ─── AI Response Display (Readable, Max 3 Lines) ───────────── */}
        {aiResponse && (
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.3) 100%)',
              borderRadius: '24px',
              padding: '20px 24px',
              border: '2px solid rgba(167, 139, 250, 0.4)',
              textAlign: 'left',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#FDE047" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FDE047', letterSpacing: '0.5px' }}>
                  Memory Guardian
                </span>
              </div>
              <button
                type="button"
                onClick={() => speakText(aiResponse)}
                className="btn btn-ghost btn-sm"
                style={{ color: '#E9D5FF', padding: '4px 8px', fontSize: '13px' }}
                aria-label="Replay response voice"
              >
                <Volume2 size={16} /> Replay
              </button>
            </div>
            <p
              style={{
                fontSize: '20px',
                color: '#FFFFFF',
                fontWeight: 600,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {aiResponse}
            </p>
          </div>
        )}

        {/* ─── Relevant Photo Display Area (If AI returns photo) ──────── */}
        {relevantPhoto && (
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
              color: '#1E1B4B',
            }}
          >
            <img
              src={relevantPhoto.url}
              alt={relevantPhoto.caption || 'Memory Photo'}
              style={{
                width: '100%',
                maxHeight: '260px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div style={{ padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                {relevantPhoto.caption}
              </p>
            </div>
          </div>
        )}

        {/* ─── Error State & Retry ────────────────────────────────────── */}
        {status === 'error' && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid #EF4444',
              borderRadius: '20px',
              padding: '16px 20px',
              maxWidth: '540px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={24} color="#F87171" />
              <span style={{ fontSize: '15px', color: '#FEE2E2', textAlign: 'left' }}>
                {errorMessage || 'Something went wrong. Let us try again.'}
              </span>
            </div>
            <button
              type="button"
              onClick={startRecording}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '999px', flexShrink: 0 }}
            >
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        )}

        {/* ─── Quick Topic Prompts (Touch-Friendly Helpers) ───────────── */}
        <div style={{ width: '100%', maxWidth: '640px', marginTop: '8px' }}>
          <p style={{ fontSize: '14px', color: '#A78BFA', marginBottom: '10px', fontWeight: 600 }}>
            Or tap to ask:
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
            }}
          >
            {[
              'Tell me about my family',
              "What's on my schedule today?",
              'Tell me something uplifting',
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={status === 'recording' || status === 'processing'}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '10px 18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Bottom Big Record Button ─────────────────────────────────── */}
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          paddingTop: '16px',
        }}
      >
        <button
          type="button"
          onClick={handleToggleRecord}
          disabled={status === 'processing'}
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            border: '4px solid #FFFFFF',
            background:
              status === 'recording'
                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            boxShadow:
              status === 'recording'
                ? '0 0 30px rgba(239, 68, 68, 0.8)'
                : '0 8px 30px rgba(99, 102, 241, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: status === 'processing' ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: status === 'processing' ? 0.7 : 1,
            animation: status === 'recording' ? 'breathe 1s ease-in-out infinite' : 'none',
          }}
          aria-label={status === 'recording' ? 'Stop recording voice' : 'Start speaking'}
        >
          {status === 'recording' ? (
            <Square size={38} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Mic size={44} color="#FFFFFF" strokeWidth={2.4} />
          )}
        </button>

        <span style={{ fontSize: '15px', color: '#DDD6FE', fontWeight: 600 }}>
          {status === 'recording' ? 'TAP TO FINISH SPEAKING' : 'TAP MICROPHONE TO TALK'}
        </span>
      </footer>
    </div>
  )
}
