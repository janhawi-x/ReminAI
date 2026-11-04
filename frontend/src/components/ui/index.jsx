import React from 'react'

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--color-lavender)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(139,124,246,0.2)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin-slow 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Loading Page ─────────────────────────────────────────────────────────────
export function LoadingPage({ message = 'Loading…' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface)',
      gap: 16,
    }}>
      <Spinner size={40} />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>{message}</p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 32px',
      gap: 16,
      textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'rgba(139,124,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <Icon size={36} color="var(--color-lavender)" />
        </div>
      )}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 320 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, maxWidth = 540 }) {
  if (!isOpen) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card animate-fade-in"
        style={{
          width: '100%', maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28,
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon-sm"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={420}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
export function AlertBanner({ type = 'info', children, onClose }) {
  const types = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
    purple: 'alert-purple',
  }
  return (
    <div className={`alert-banner ${types[type]}`} style={{ position: 'relative' }}>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: 16 }}
        >✕</button>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'purple' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ src, name = '', size = 40, style = {} }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#8B7CF6', '#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#10B981']
  const colorIndex = name.charCodeAt(0) % colors.length || 0
  
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: colors[colorIndex],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white',
      fontSize: size * 0.35,
      fontWeight: 700,
      flexShrink: 0,
      ...style
    }}>
      {initials || '?'}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, color = 'var(--color-lavender)', bgColor = 'rgba(139,124,246,0.1)', trend }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)' }}>{value}</p>
          {trend && <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>{trend}</p>}
        </div>
        <div style={{
          width: 48, height: 48,
          borderRadius: 12,
          background: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function FormField({ label, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label className="input-label">
          {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, description, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{title}</h2>
        {description && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── File Upload Area ─────────────────────────────────────────────────────────
export function FileUploadArea({ onFile, accept = 'image/*', label = 'Click to upload or drag & drop', multiple = false }) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef(null)
  
  const handleDrop = e => {
    e.preventDefault()
    setDragging(false)
    const files = multiple ? [...e.dataTransfer.files] : [e.dataTransfer.files[0]]
    if (files[0]) onFile(multiple ? files : files[0])
  }
  
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-lavender)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(139,124,246,0.05)' : 'white',
        transition: 'all 0.2s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => {
          const files = multiple ? [...e.target.files] : e.target.files[0]
          if (files) onFile(files)
        }}
      />
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Supports images, videos, audio files</p>
    </div>
  )
}
