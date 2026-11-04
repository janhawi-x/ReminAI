import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  X,
  Volume2,
  Calendar,
  MapPin,
  Users,
  Heart,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const CATEGORIES = [
  'All',
  'Family',
  'Travel',
  'Childhood',
  'Special',
  'Music',
  'Friends',
]

// Sample memories to populate gracefully when database has no records yet
const SAMPLE_MEMORIES = [
  {
    id: 'mem-1',
    title: 'Summer Trip to Cannon Beach',
    category: 'Travel',
    date: 'July 1984',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    description: 'We rented a small cedar cabin by the ocean with Eleanor and the kids. The sunsets were vibrant golden orange and we built a giant sandcastle together.',
    people: ['Eleanor Vance', 'Sarah Miller', 'David Miller'],
    location: 'Cannon Beach, Oregon',
  },
  {
    id: 'mem-2',
    title: 'Sarah’s Graduation Day',
    category: 'Family',
    date: 'June 2008',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    description: 'Sarah graduated with honors in literature. We were all crying tears of joy in the courtyard when she threw her cap into the blue sky.',
    people: ['Sarah Miller', 'David Miller'],
    location: 'University Hall',
  },
  {
    id: 'mem-3',
    title: 'Childhood Apple Orchard',
    category: 'Childhood',
    date: 'October 1956',
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
    description: 'Climbing the old honeycrisp apple tree in grandmother\'s backyard. We would carry wooden baskets filled to the brim with sweet apples for homemade pie.',
    people: ['Grandmother Rose', 'Eleanor Vance'],
    location: 'Grandmother\'s Farm',
  },
  {
    id: 'mem-4',
    title: '50th Wedding Anniversary Gala',
    category: 'Special',
    date: 'September 2018',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    description: 'Surrounded by all 3 generations of our family dancing to Frank Sinatra under string lights in the pavilion.',
    people: ['Whole Family', 'Sarah Miller', 'David Miller', 'Leo Miller'],
    location: 'Rosewood Pavilion',
  },
  {
    id: 'mem-5',
    title: 'Leo Playing his First Guitar Recital',
    category: 'Music',
    date: 'December 2015',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    description: 'Grandson Leo played "Here Comes The Sun" at his winter school recital and looked right at you with the biggest smile.',
    people: ['Leo Miller'],
    location: 'Auditorium Hall',
  },
  {
    id: 'mem-6',
    title: 'Sunday Morning Coffee with Arthur',
    category: 'Friends',
    date: 'August 1995',
    imageUrl: 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=800&auto=format&fit=crop&q=80',
    description: 'Sitting on the porch sharing warm brew, talking about gardening, and listening to the birds sing.',
    people: ['Arthur Pendelton'],
    location: 'Front Porch',
  },
]

export default function PatientMemories() {
  const { patientId } = useAuth()
  const navigate = useNavigate()

  // State
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMemory, setActiveMemory] = useState(null)

  // TTS helper for narration
  const speakMemory = useCallback((memory) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const narration = `${memory.title}. From ${memory.date}. ${memory.description} ${
      memory.location ? 'At ' + memory.location + '.' : ''
    }`
    const utterance = new SpeechSynthesisUtterance(narration)
    utterance.rate = 0.9
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }, [])

  // Load memories from API
  const loadMemories = useCallback(async () => {
    setLoading(true)
    try {
      const targetId = patientId
      if (!targetId) {
        console.warn('No patient ID available')
        return
      }
      const data = await api.memories.getAll(
        targetId,
        selectedCategory === 'All' ? undefined : selectedCategory
      )
      if (Array.isArray(data) && data.length > 0) {
        setMemories(data)
      } else {
        setMemories(SAMPLE_MEMORIES)
      }
    } catch (err) {
      console.warn('Could not load memories from API, falling back to samples:', err.message)
      setMemories(SAMPLE_MEMORIES)
    } finally {
      setLoading(false)
    }
  }, [patientId, selectedCategory])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  // Filter memories by category & search query
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      const matchCat =
        selectedCategory === 'All' ||
        (mem.category && mem.category.toLowerCase() === selectedCategory.toLowerCase())

      const q = searchQuery.trim().toLowerCase()
      if (!q) return matchCat

      const inTitle = mem.title?.toLowerCase().includes(q)
      const inDesc = mem.description?.toLowerCase().includes(q)
      const inDate = mem.date?.toLowerCase().includes(q)
      const inPeople = Array.isArray(mem.people)
        ? mem.people.some((p) => p.toLowerCase().includes(q))
        : false

      return matchCat && (inTitle || inDesc || inDate || inPeople)
    })
  }, [memories, selectedCategory, searchQuery])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4C1D95 0%, #3B0764 50%, #2E1065 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Header & Navigation ─────────────────────────────────────── */}
      <header
        style={{
          maxWidth: '1200px',
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
              My Memories
            </h1>
            <p style={{ fontSize: '16px', color: '#E9D5FF', marginTop: '4px' }}>
              Your cherished moments, travels, and family milestones
            </p>
          </div>

          <Link
            to="/patient/book"
            className="btn btn-lg"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '999px',
              padding: '12px 22px',
              fontSize: '16px',
              fontWeight: 700,
              background: '#8B5CF6',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              textDecoration: 'none',
            }}
          >
            <BookOpen size={20} />
            View Photo Book
          </Link>
        </div>

        {/* ─── Search Bar ────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            maxWidth: '640px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Search
            size={24}
            color="#A78BFA"
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories by name, place, or person..."
            style={{
              width: '100%',
              padding: '16px 48px 16px 54px',
              fontSize: '18px',
              borderRadius: '999px',
              border: '2px solid rgba(196, 181, 253, 0.4)',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              backdropFilter: 'blur(10px)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={20} color="#E9D5FF" />
            </button>
          )}
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
                  padding: '10px 20px',
                  borderRadius: '999px',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: isSelected ? '2px solid #FFFFFF' : '1.5px solid rgba(255,255,255,0.2)',
                  background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#4C1D95' : '#EDE9FE',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </header>

      {/* ─── Masonry Memory Cards Grid ──────────────────────────────── */}
      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          flex: 1,
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="card"
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="skeleton" style={{ width: '100%', height: '220px' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ width: '80%', height: '24px' }} />
                  <div className="skeleton" style={{ width: '40%', height: '16px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMemories.length === 0 ? (
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
            <BookOpen size={64} color="#C4B5FD" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              No memories found
            </h2>
            <p style={{ fontSize: '18px', color: '#E9D5FF' }}>
              Try selecting another category or clearing your search.
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
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                onClick={() => setActiveMemory(mem)}
                className="memory-card animate-fade-in"
                style={{
                  borderRadius: '28px',
                  background: '#FFFFFF',
                  color: '#1E1B4B',
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Photo Display */}
                {mem.imageUrl || mem.image_url ? (
                  <div style={{ position: 'relative', width: '100%', height: '230px', overflow: 'hidden' }}>
                    <img
                      src={mem.imageUrl || mem.image_url}
                      alt={mem.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <span
                      className="badge badge-purple"
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '13px',
                        padding: '6px 14px',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        background: 'rgba(255, 255, 255, 0.95)',
                      }}
                    >
                      {mem.category || 'Memory'}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      height: '160px',
                      background: 'linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen size={48} color="#6D28D9" />
                  </div>
                )}

                {/* Card Text Content */}
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#1E1B4B',
                        marginBottom: '8px',
                        lineHeight: 1.3,
                      }}
                    >
                      {mem.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '15px' }}>
                      <Calendar size={16} color="#8B5CF6" />
                      <span>{mem.date || 'Cherished moment'}</span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '15px',
                      color: '#4B5563',
                      lineHeight: 1.5,
                      marginTop: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {mem.description}
                  </p>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#6D28D9' }}>
                      Tap to view details &rarr;
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        speakMemory(mem)
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ borderRadius: '50%', padding: '8px', color: '#6D28D9' }}
                      aria-label="Listen to memory story"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── Memory Detail Modal ─────────────────────────────────────── */}
      {activeMemory && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 10, 46, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveMemory(null)}
        >
          <div
            className="animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1E1B4B',
              borderRadius: '32px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveMemory(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Close memory details"
            >
              <X size={24} color="#FFFFFF" />
            </button>

            {/* Full Image */}
            {activeMemory.imageUrl || activeMemory.image_url ? (
              <img
                src={activeMemory.imageUrl || activeMemory.image_url}
                alt={activeMemory.title}
                style={{
                  width: '100%',
                  maxHeight: '380px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : null}

            {/* Modal Content */}
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <span
                  className="badge badge-purple"
                  style={{ fontSize: '15px', padding: '6px 16px', fontWeight: 700 }}
                >
                  {activeMemory.category || 'Memory'}
                </span>
                <button
                  type="button"
                  onClick={() => speakMemory(activeMemory)}
                  className="btn btn-primary"
                  style={{ borderRadius: '999px', fontSize: '15px', padding: '8px 18px' }}
                >
                  <Volume2 size={18} /> Read Memory Aloud
                </button>
              </div>

              <h2
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: '#1E1B4B',
                  marginBottom: '10px',
                  lineHeight: 1.25,
                }}
              >
                {activeMemory.title}
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px',
                  color: '#6B7280',
                  fontSize: '16px',
                }}
              >
                {activeMemory.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={18} color="#8B5CF6" />
                    <span style={{ fontWeight: 600 }}>{activeMemory.date}</span>
                  </div>
                )}
                {activeMemory.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={18} color="#EF4444" />
                    <span>{activeMemory.location}</span>
                  </div>
                )}
              </div>

              {/* Memory Story Description */}
              <p
                style={{
                  fontSize: '20px',
                  color: '#374151',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                  background: '#F8F7FF',
                  padding: '20px',
                  borderRadius: '20px',
                  border: '1.5px solid #EDE9FE',
                }}
              >
                {activeMemory.description}
              </p>

              {/* Associated People */}
              {activeMemory.people && activeMemory.people.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Users size={20} color="#6D28D9" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                      People in this memory:
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {activeMemory.people.map((person, idx) => (
                      <span
                        key={idx}
                        className="badge badge-teal"
                        style={{ fontSize: '14px', padding: '6px 14px', fontWeight: 600 }}
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
