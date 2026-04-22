import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  maxWidth?: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, maxWidth = '480px', children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'fade-up 0.22s ease both',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.1rem 1.4rem',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: '500',
              }}
            >
              {title}
            </span>
            <button
              onClick={onClose}
              style={{ color: 'var(--color-muted)', fontSize: '1.2rem', lineHeight: 1, transition: 'color 0.15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '1.4rem' }}>{children}</div>
      </div>
    </div>
  )
}
