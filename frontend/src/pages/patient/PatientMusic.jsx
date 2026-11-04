import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Pause,
  Music,
  Mic,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Waves,
  CloudRain,
  Trees,
  RotateCcw,
  Headphones,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const CATEGORIES = [
  'All',
  'Favourite Music',
  'Family Messages',
  'Memories',
  'Sounds',
]

// Sample rich audio collection for the patient
const SAMPLE_AUDIO_TRACKS = [
  {
    id: 'aud-1',
    title: 'Moon River & Gentle Strings',
    category: 'Favourite Music',
    uploader: 'Your Youth Favorites',
    duration: '3:15',
    audioUrl: '',
    soundType: 'melody',
  },
  {
    id: 'aud-2',
    title: 'Good Morning from Grandson Leo',
    category: 'Family Messages',
    uploader: 'Leo Miller (Grandson)',
    duration: '0:45',
    audioUrl: '',
    messageText: 'Good morning Grandpa! I hope you have a sunny day today. I will visit this weekend with my guitar!',
    soundType: 'voice',
  },
  {
    id: 'aud-3',
    title: 'Sarah’s Sunday Voicemail',
    category: 'Family Messages',
    uploader: 'Sarah Miller (Daughter)',
    duration: '1:10',
    audioUrl: '',
    messageText: 'Hi Dad! Just checking in. The garden roses you planted look so beautiful today. I love you so much!',
    soundType: 'voice',
  },
  {
    id: 'aud-4',
    title: 'What a Wonderful World',
    category: 'Favourite Music',
    uploader: 'Louis Armstrong Classic',
    duration: '2:40',
    audioUrl: '',
    soundType: 'melody',
  },
  {
    id: 'aud-5',
    title: 'Pacific Ocean Gentle Waves',
    category: 'Sounds',
    uploader: 'Calming Nature Sounds',
    duration: '10:00',
    audioUrl: '',
    soundType: 'ocean',
  },
  {
    id: 'aud-6',
    title: 'Morning Songbirds in the Pines',
    category: 'Sounds',
    uploader: 'Calming Nature Sounds',
    duration: '8:30',
    audioUrl: '',
    soundType: 'birds',
  },
  {
    id: 'aud-7',
    title: 'Summer Vacation at Cannon Beach Story',
    category: 'Memories',
    uploader: 'Narrated by Memory Guardian',
    duration: '2:15',
    audioUrl: '',
    messageText: 'Remember the golden sunset at Cannon Beach in 1984? We had warm clam chowder and laughter filled the small cabin.',
    soundType: 'story',
  },
  {
    id: 'aud-8',
    title: 'Soft Rain on the Window',
    category: 'Sounds',
    uploader: 'Calming Nature Sounds',
    duration: '12:00',
    audioUrl: '',
    soundType: 'rain',
  },
]

export default function PatientMusic() {
  const { patientId } = useAuth()
  const navigate = useNavigate()

  // State
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recentlyPlayed, setRecentlyPlayed] = useState([])

  // Audio elements & Synthesizer refs
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const synthNodesRef = useRef([])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      stopSynth()
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Web Audio Calming Sound Generator (Harmonic Drone & Waves)
  const stopSynth = () => {
    synthNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop()
        if (node.disconnect) node.disconnect()
      } catch (e) {
        // ignore already stopped
      }
    })
    synthNodesRef.current = []
  }

  const playSynthesizedAmbient = (track) => {
    stopSynth()
    if (window.speechSynthesis) window.speechSynthesis.cancel()

    // For voice messages or stories, use speech synthesis to speak the warm message!
    if (track.soundType === 'voice' || track.soundType === 'story') {
      const message =
        track.messageText ||
        `This is a special recording from ${track.uploader}. You are loved very much.`
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = 0.88
      utterance.pitch = 1.05
      utterance.onend = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
      return
    }

    // For music and nature sounds, generate warm gentle ambient tones via Web Audio API
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime)
      masterGain.connect(ctx.destination)

      // Generate relaxing chord (F major 7 / C chord: 174Hz, 220Hz, 261Hz, 330Hz)
      const freqs =
        track.soundType === 'ocean'
          ? [110, 164.81, 220]
          : track.soundType === 'rain'
          ? [130.81, 196.0, 261.63]
          : [174.61, 220.0, 261.63, 329.63]

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        // Gentle breathing pulsation
        oscGain.gain.setValueAtTime(0.08 / freqs.length, ctx.currentTime)
        const lfo = ctx.createOscillator()
        lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime)
        const lfoGain = ctx.createGain()
        lfoGain.gain.setValueAtTime(0.04, ctx.currentTime)
        lfo.connect(lfoGain)
        lfoGain.connect(oscGain.gain)

        osc.connect(oscGain)
        oscGain.connect(masterGain)

        osc.start()
        lfo.start()
        synthNodesRef.current.push(osc, lfo, oscGain, lfoGain)
      })
      synthNodesRef.current.push(masterGain)
    } catch (err) {
      console.warn('Web Audio synthesis not allowed yet:', err)
    }
  }

  // Load audio tracks from API
  const loadAudio = useCallback(async () => {
    setLoading(true)
    try {
      const targetId = patientId
      if (!targetId) {
        console.warn('No patient ID available')
        return
      }
      const data = await api.audio.getAll(targetId)
      if (Array.isArray(data) && data.length > 0) {
        setTracks(data)
      } else {
        setTracks(SAMPLE_AUDIO_TRACKS)
      }
    } catch (err) {
      console.warn('API audio error, using soothing sample tracks:', err.message)
      setTracks(SAMPLE_AUDIO_TRACKS)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadAudio()
  }, [loadAudio])

  // Play / Pause handler
  const handleTogglePlay = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      // Pause
      if (audioRef.current) audioRef.current.pause()
      stopSynth()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      // Play new or resume
      setCurrentTrack(track)
      setIsPlaying(true)

      // Add to recently played
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id)
        return [track, ...filtered].slice(0, 4)
      })

      if (track.audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = track.audioUrl
          audioRef.current.play().catch(() => playSynthesizedAmbient(track))
        }
      } else {
        playSynthesizedAmbient(track)
      }
    }
  }

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'All') return tracks
    return tracks.filter(
      (t) => t.category && t.category.toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [tracks, selectedCategory])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #881337 0%, #4C0519 50%, #1F020A 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px 100px', // extra padding at bottom for sticky player
        boxSizing: 'border-box',
      }}
    >
      {/* Hidden audio element for files */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      {/* ─── Top Header with Back Navigation ─────────────────────────── */}
      <header
        style={{
          maxWidth: '1100px',
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
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.5px',
                margin: 0,
              }}
            >
              My Music & Messages
            </h1>
            <p style={{ fontSize: '16px', color: '#FECDD3', marginTop: '4px' }}>
              Comforting songs, nature sounds, and voices of your family
            </p>
          </div>
        </div>

        {/* ─── Category Filter Pills ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '8px 4px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '12px 22px',
                  borderRadius: '999px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: isSelected ? '2px solid #FFFFFF' : '1.5px solid rgba(255,255,255,0.2)',
                  background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.12)',
                  color: isSelected ? '#9F1239' : '#FFE4E6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          flex: 1,
        }}
      >
        {/* ─── Recently Played Section ──────────────────────────────── */}
        {recentlyPlayed.length > 0 && selectedCategory === 'All' && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={20} color="#FDE047" />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFE4E6', margin: 0 }}>
                Recently Played
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {recentlyPlayed.map((track) => (
                <div
                  key={'rec-' + track.id}
                  onClick={() => handleTogglePlay(track)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#F43F5E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '2px' }} />
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#FECDD3', margin: '2px 0 0' }}>
                      {track.uploader}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Audio Tracks Grid ──────────────────────────────────────── */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
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
                <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '40%', height: '16px' }} />
              </div>
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
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
            <Music size={64} color="#FDA4AF" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              No audio items in this category
            </h2>
            <p style={{ fontSize: '18px', color: '#FECDD3' }}>
              Select another category to listen to music and messages.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredTracks.map((track) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying

              return (
                <div
                  key={track.id}
                  className="card animate-fade-in"
                  style={{
                    background: '#FFFFFF',
                    color: '#1E1B4B',
                    borderRadius: '28px',
                    padding: '24px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isThisPlaying ? '3px solid #F43F5E' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Category Badge & Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span
                        className="badge badge-red"
                        style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 700 }}
                      >
                        {track.category || 'Audio'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6B7280' }}>
                        <Clock size={16} color="#F43F5E" />
                        <span>{track.duration}</span>
                      </div>
                    </div>

                    {/* Title & Uploader */}
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#1E1B4B',
                        marginBottom: '4px',
                        lineHeight: 1.3,
                      }}
                    >
                      {track.title}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
                      From: <strong>{track.uploader}</strong>
                    </p>

                    {/* Message preview if voice message */}
                    {track.messageText && (
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#6B7280',
                          fontStyle: 'italic',
                          marginTop: '8px',
                          background: '#FFF1F2',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          borderLeft: '4px solid #F43F5E',
                        }}
                      >
                        "{track.messageText}"
                      </p>
                    )}
                  </div>

                  {/* Bottom: Play/Pause button + Animated Bars indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #F3F4F6',
                    }}
                  >
                    {/* Animated playing bars indicator */}
                    {isThisPlaying ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="waveform-bar" style={{ height: '24px', background: '#F43F5E', animationDelay: '0.0s' }} />
                        <div className="waveform-bar" style={{ height: '32px', background: '#E11D48', animationDelay: '0.2s' }} />
                        <div className="waveform-bar" style={{ height: '18px', background: '#F43F5E', animationDelay: '0.4s' }} />
                        <div className="waveform-bar" style={{ height: '28px', background: '#E11D48', animationDelay: '0.1s' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#E11D48', marginLeft: '6px' }}>
                          Playing Now
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>
                        Tap to listen
                      </span>
                    )}

                    {/* Big Play / Pause Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(track)}
                      className="btn btn-danger"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        padding: 0,
                        boxShadow: '0 6px 18px rgba(225, 29, 72, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                    >
                      {isThisPlaying ? (
                        <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
                      ) : (
                        <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '2px' }} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── Sticky Bottom Now Playing Bar ────────────────────────────── */}
      {currentTrack && (
        <aside
          role="region"
          aria-label="Now Playing Audio"
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1E1B4B',
            borderRadius: '28px',
            padding: '16px 24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '2px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#FFE4E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Music size={26} color="#E11D48" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Now Playing
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                {currentTrack.uploader}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleTogglePlay(currentTrack)}
              className="btn btn-danger"
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                padding: 0,
                boxShadow: '0 6px 16px rgba(225, 29, 72, 0.4)',
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '2px' }} />
              )}
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
