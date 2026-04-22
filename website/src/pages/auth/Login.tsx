import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { authLogin } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

interface LoginForm {
  username: string
  password: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid var(--color-border)',
  borderRadius: '3px',
  background: 'transparent',
  color: 'var(--color-text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>()

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true })
  }, [isAuthenticated, navigate])

  async function onSubmit(data: LoginForm) {
    try {
      const res = await authLogin(data)
      login(res.data.token, res.data.user)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('root', { message: 'Account pending approval or disabled.' })
      } else {
        setError('root', { message: 'Invalid username or password.' })
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '340px', animation: 'fade-up 1s ease both' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <Link
            to="/"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: '300',
              fontSize: '1.5rem',
              color: 'var(--color-text)',
              display: 'block',
              marginBottom: '0.75rem',
            }}
          >
            ephemeral
          </Link>
          <p
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
              margin: 0,
            }}
          >
            Sign in
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <input
              {...register('username', { required: 'Username is required' })}
              placeholder="Username"
              autoComplete="username"
              style={{ ...inputStyle, borderColor: errors.username ? '#c0392b' : 'var(--color-border)' }}
            />
            {errors.username && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: '#c0392b' }}>
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...register('password', { required: 'Password is required' })}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              style={{ ...inputStyle, borderColor: errors.password ? '#c0392b' : 'var(--color-border)' }}
            />
            {errors.password && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: '#c0392b' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#c0392b', textAlign: 'center' }}>
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'var(--color-text)',
              color: 'var(--color-inv)',
              border: 'none',
              borderRadius: '3px',
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'opacity 0.2s ease',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              color: 'var(--color-muted)',
              margin: '0.25rem 0 0',
            }}
          >
            Don't have an account?{' '}
            <Link to="/join" style={{ color: 'var(--color-text)', textDecoration: 'underline' }}>
              Request access
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
