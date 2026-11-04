import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  X,
  Heart,
  Calendar,
  Users,
  Sparkles,
  Maximize2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const ALBUMS = [
  'My Family',
  'My Childhood',
  'My Friends',
  'My Travels',
  'Festivals',
  'Special Occasions',
]

// Sample photos for digital memory book
const SAMPLE_BOOK_PHOTOS = {
  'My Family': [
    {
      id: 'fam-1',
      title: 'Thanksgiving Gathering',
      caption: 'Everyone seated around the dining table smiling before cutting the roast turkey.',
      year: '2021',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
      people: 'Sarah, David, Leo & Eleanor',
    },
    {
      id: 'fam-2',
      title: 'Grandson Leo’s Birthday',
      caption: 'Blowing out 10 candles on the chocolate fudge cake with your daughter Sarah holding the camera.',
      year: '2016',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
      people: 'Leo & Sarah',
    },
    {
      id: 'fam-3',
      title: 'David and Charlie the Dog',
      caption: 'David playing fetch in the front yard on a bright sunny Saturday afternoon.',
      year: '2023',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      people: 'David Miller',
    },
  ],
  'My Childhood': [
    {
      id: 'child-1',
      title: 'The Treehouse at Sunset',
      caption: 'The wooden fort your father built in the big oak tree by the creek.',
      year: '1954',
      imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
      people: 'Sister Eleanor & Childhood Friends',
    },
    {
      id: 'child-2',
      title: 'First Bicycle with Bell',
      caption: 'A red Schwinn bicycle with chrome fenders and a white basket on your 8th birthday.',
      year: '1957',
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
      people: 'Young Eleanor & Parents',
    },
  ],
  'My Friends': [
    {
      id: 'friend-1',
      title: 'Book Club Tea Party',
      caption: 'Laughter, jasmine tea, and homemade scones on the sunporch with Clara and Betty.',
      year: '2012',
      imageUrl: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=800&auto=format&fit=crop&q=80',
      people: 'Clara, Betty & Friends',
    },
    {
      id: 'friend-2',
      title: 'Bowling League Champions',
      caption: 'Holding the bronze bowling trophy together at Sunset Lanes.',
      year: '1989',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      people: 'Neighborhood Team',
    },
  ],
  'My Travels': [
    {
      id: 'trav-1',
      title: 'Lighthouse on the Coast',
      caption: 'Walking the salty wooden boardwalk smelling cedar and ocean breezes at Cape Disappointment.',
      year: '1984',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      people: 'Family Vacation',
    },
    {
      id: 'trav-2',
      title: 'Grand Canyon Sunrise',
      caption: 'Watching the pink and violet morning light sweep across the vast red rock canyon.',
      year: '1992',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
      people: 'Family Road Trip',
    },
  ],
  'Festivals': [
    {
      id: 'fest-1',
      title: 'Christmas Eve by the Fireplace',
      caption: 'Roasting chestnuts and hanging pine wreaths with Christmas carols playing on the radio.',
      year: '2019',
      imageUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&auto=format&fit=crop&q=80',
      people: 'The Whole Family',
    },
    {
      id: 'fest-2',
      title: 'Fourth of July Fireworks',
      caption: 'Watching sparkling red and silver fireworks over the town lake from lawn chairs.',
      year: '2005',
      imageUrl: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800&auto=format&fit=crop&q=80',
      people: 'Eleanor, Sarah & Leo',
    },
  ],
  'Special Occasions': [
    {
      id: 'spec-1',
      title: 'Golden Wedding Anniversary',
      caption: 'Cutting the tiered cream cake with 50 golden ribbons surrounded by our dearest friends.',
      year: '2018',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      people: 'Family and Friends',
    },
    {
      id: 'spec-2',
      title: 'Retirement Celebration',
      caption: 'A heartfelt toast celebrating 35 years of teaching and mentorship at the community hall.',
      year: '2010',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
      people: 'Colleagues & Loved Ones',
    },
  ],
}

export default function PatientMemoryBook() {
  const { patientId } = useAuth()
  const navigate = useNavigate()

  // State
  const [activeAlbum, setActiveAlbum] = useState('My Family')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null) // index in current album

  // TTS read caption
  const speakCaption = useCallback((photo) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const text = `${photo.title}. Year ${photo.year || ''}. ${photo.caption} ${
      photo.people ? 'With ' + photo.people + '.' : ''
    }`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }, [])

  // Load photos for active album
  const loadAlbumPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const targetId = patientId
      if (!targetId) {
        console.warn('No patient ID available')
        return
      }
      const data = await api.memories.getAll(targetId, activeAlbum)
      if (Array.isArray(data) && data.length > 0) {
        setPhotos(data)
      } else {
        setPhotos(SAMPLE_BOOK_PHOTOS[activeAlbum] || [])
      }
    } catch (err) {
      console.warn('API error loading album, using sample photos:', err.message)
      setPhotos(SAMPLE_BOOK_PHOTOS[activeAlbum] || [])
    } finally {
      setLoading(false)
    }
  }, [patientId, activeAlbum])

  useEffect(() => {
    loadAlbumPhotos()
  }, [loadAlbumPhotos])

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
      } else if (e.key === 'Escape') {
        setLightboxIndex(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, photos.length])

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2E1065 0%, #1E1B4B 50%, #0F0A2E 100%)',
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
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 20px',
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
            Digital Photo Album
          </h1>
          <p style={{ fontSize: '16px', color: '#DDD6FE', marginTop: '4px' }}>
            Turn the pages of your life's most precious memories
          </p>
        </div>

        <Link
          to="/patient/memories"
          className="btn btn-lg"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '999px',
            padding: '12px 22px',
            fontSize: '16px',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            textDecoration: 'none',
          }}
        >
          <BookOpen size={20} />
          Memory Stories
        </Link>
      </header>

      {/* ─── Album Tabs Navigation ───────────────────────────────────── */}
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 24px',
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          padding: '8px 4px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {ALBUMS.map((albumName) => {
          const isActive = activeAlbum === albumName
          return (
            <button
              key={albumName}
              type="button"
              onClick={() => {
                setActiveAlbum(albumName)
                setLightboxIndex(null)
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                fontSize: '17px',
                fontWeight: 700,
                border: isActive ? '3px solid #FDE047' : '1.5px solid rgba(255,255,255,0.25)',
                background: isActive
                  ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                boxShadow: isActive ? '0 8px 24px rgba(124, 58, 237, 0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {albumName}
            </button>
          )
        })}
      </div>

      {/* ─── Book Container (Simulated Warm Album Page) ───────────────── */}
      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          flex: 1,
        }}
      >
        <div
          className="book-page animate-fade-in"
          style={{
            background: '#FFFDF9',
            borderRadius: '32px',
            padding: '36px 32px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0,0,0,0.03)',
            border: '8px solid #F3EDE2',
            color: '#1E1B4B',
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Album Title inside Book */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '20px',
              borderBottom: '2px solid #EADBCE',
              marginBottom: '28px',
            }}
          >
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Album Chapter
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E1B4B', margin: '4px 0 0' }}>
                {activeAlbum}
              </h2>
            </div>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#78716C',
                background: '#F5F0E8',
                padding: '8px 16px',
                borderRadius: '999px',
              }}
            >
              {photos.length} Photographs
            </span>
          </div>

          {/* Photo Grid */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ background: '#F5F0E8', borderRadius: '20px', padding: '16px' }}>
                  <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '16px' }} />
                  <div className="skeleton" style={{ width: '60%', height: '20px', marginTop: '12px' }} />
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#78716C' }}>
              <BookOpen size={54} color="#D6D3D1" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 700 }}>No photos in this album yet</h3>
              <p style={{ fontSize: '16px' }}>Ask your caregiver to add photos to this album.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '28px',
              }}
            >
              {photos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  onClick={() => setLightboxIndex(idx)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '16px 16px 20px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
                    border: '1px solid #EADBCE',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      height: '220px',
                      marginBottom: '14px',
                      background: '#F5F0E8',
                    }}
                  >
                    <img
                      src={photo.imageUrl || photo.image_url}
                      alt={photo.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        padding: '8px',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Maximize2 size={16} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 6px' }}>
                    {photo.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#57534E',
                      lineHeight: 1.4,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {photo.caption}
                  </p>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>
                      {photo.year || 'Precious moment'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        speakCaption(photo)
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#7C3AED', padding: '6px' }}
                      aria-label="Listen to caption"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── Lightbox Modal (Click to View Fullsize + Nav) ────────────── */}
      {currentPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 10, 46, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '54px',
              height: '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF',
            }}
            aria-label="Close Lightbox"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
            }}
            style={{
              position: 'absolute',
              left: '20px',
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.25)',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            aria-label="Previous Photo"
          >
            <ChevronLeft size={42} />
          </button>

          {/* Lightbox Card */}
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: '32px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ maxHeight: '55vh', overflow: 'hidden', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={currentPhoto.imageUrl || currentPhoto.image_url}
                alt={currentPhoto.title}
                style={{
                  width: '100%',
                  maxHeight: '55vh',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div style={{ padding: '28px', color: '#1E1B4B' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#7C3AED',
                    background: '#F3E8FF',
                    padding: '6px 16px',
                    borderRadius: '999px',
                  }}
                >
                  {currentPhoto.year || activeAlbum}
                </span>

                <button
                  type="button"
                  onClick={() => speakCaption(currentPhoto)}
                  className="btn btn-primary btn-lg"
                  style={{ borderRadius: '999px', gap: '8px' }}
                >
                  <Volume2 size={20} /> Read Aloud
                </button>
              </div>

              <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 10px' }}>
                {currentPhoto.title}
              </h2>

              <p style={{ fontSize: '20px', color: '#374151', lineHeight: 1.6, margin: '0 0 16px' }}>
                {currentPhoto.caption}
              </p>

              {currentPhoto.people && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '16px' }}>
                  <Users size={20} color="#7C3AED" />
                  <span style={{ fontWeight: 600 }}>People: {currentPhoto.people}</span>
                </div>
              )}

              {/* Photo position indicator */}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '15px', color: '#9CA3AF' }}>
                Photo {lightboxIndex + 1} of {photos.length}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
            }}
            style={{
              position: 'absolute',
              right: '20px',
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.25)',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            aria-label="Next Photo"
          >
            <ChevronRight size={42} />
          </button>
        </div>
      )}
    </div>
  )
}
