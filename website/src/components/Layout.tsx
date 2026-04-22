import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Moon, Sun, Plus, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const { isDark, toggleDark } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh' }}>
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
            padding: '0 2.5rem',
            height: '52px',
          }}
        >
          <Link
            to="/feed"
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
          </Link>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <AppNavLink to="/feed" label="Feed" />
            {user && <AppNavLink to={`/users/${user.username}`} label={`@${user.username}`} />}
            {user?.is_admin && <AppNavLink to="/admin" label="Admin" />}

            <NavIconLink to="/new" label="New post">
              <Plus size={15} strokeWidth={1.5} />
            </NavIconLink>

            <NavIconButton onClick={toggleDark} label={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
            </NavIconButton>

            <NavIconButton onClick={handleLogout} label="Sign out">
              <LogOut size={14} strokeWidth={1.5} />
            </NavIconButton>
          </div>
        </nav>
      </header>

      <main style={{ paddingTop: '52px' }}>
        <Outlet />
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AppNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        fontSize: '0.68rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: isActive ? '500' : '400',
        transition: 'color 0.2s ease',
      })}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={e => {
        if (!e.currentTarget.getAttribute('aria-current')) {
          e.currentTarget.style.color = 'var(--color-muted)'
        }
      }}
    >
      {label}
    </NavLink>
  )
}

function NavIconLink({
  to,
  label,
  children,
}: {
  to: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      style={{ display: 'flex', alignItems: 'center', color: 'var(--color-muted)', transition: 'color 0.2s ease', padding: '3px' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
    >
      {children}
    </Link>
  )
}

function NavIconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        color: hovered ? 'var(--color-text)' : 'var(--color-muted)',
        transition: 'color 0.2s ease',
        padding: '3px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}
