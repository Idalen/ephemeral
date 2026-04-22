import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { authRegister } from '../../api/auth'

interface JoinForm {
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

export default function Join() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinForm>()

  async function onSubmit(data: JoinForm) {
    try {
      await authRegister(data)
      setSubmitted(true)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('username', { message: 'Username already taken.' })
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' })
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
            Request access
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                lineHeight: 1.8,
              }}
            >
              Your account is pending approval.
              <br />
              You'll be able to sign in once an admin reviews it.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginTop: '1.5rem',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              ← Back home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Minimum 3 characters' },
                  maxLength: { value: 30, message: 'Maximum 30 characters' },
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Letters, digits, _ and - only' },
                })}
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
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
                type="password"
                placeholder="Password"
                autoComplete="new-password"
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
              {isSubmitting ? 'Sending…' : 'Request access'}
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
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-text)', textDecoration: 'underline' }}>
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
