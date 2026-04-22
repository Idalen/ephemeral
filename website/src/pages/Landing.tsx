import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Landing() {
  const { isDark, toggleDark } = useTheme()

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GrainOverlay />

      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'border-color 0.4s ease',
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 3rem',
            height: '52px',
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: '400',
              fontSize: '0.95rem',
              letterSpacing: '0.01em',
              color: 'var(--color-text)',
              userSelect: 'none',
            }}
          >
            ephemeral
          </span>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <NavLink to="/project" label="Project" />
            <NavLink to="/join" label="Join" />
            <DarkToggle isDark={isDark} onToggle={toggleDark} />
          </div>
        </nav>
      </header>

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '0 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <img
            src="/logo.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translate(-50%, 50%)',
              width: 'clamp(340px, 46vw, 520px)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 18%, transparent 58%)',
              maskImage: 'linear-gradient(to bottom, black 18%, transparent 58%)',
              pointerEvents: 'none',
              userSelect: 'none',
              animation: 'fade-in 1.4s ease both',
            }}
          />
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: '300',
              fontStyle: 'italic',
              fontSize: 'clamp(72px, 12vw, 180px)',
              letterSpacing: '-0.015em',
              lineHeight: '0.92',
              margin: 0,
              color: 'var(--color-text)',
              animation: 'fade-up 1.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              position: 'relative',
              zIndex: 1,
            }}
          >
            ephemeral
          </h1>
        </div>

        <p
          style={{
            marginTop: '1.75rem',
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '400',
            animation: 'fade-in 1.8s 0.4s ease both',
          }}
        >
          photographs of places — nothing else
        </p>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavLink({ to, label }: { to: string; label: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      style={{
        fontSize: '0.68rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: hovered ? 'var(--color-text)' : 'var(--color-muted)',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: '400',
        transition: 'color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  )
}

function DarkToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? 'var(--color-text)' : 'var(--color-muted)',
        transition: 'color 0.2s ease',
        padding: '4px',
        marginLeft: '0.25rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
    </button>
  )
}

function GrainOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '400px 400px',
        opacity: 0.035,
      }}
    />
  )
}
