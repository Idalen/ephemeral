import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-muted)',
  fontFamily: "'DM Sans', sans-serif",
  marginBottom: '0.35rem',
}

const baseInput: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid var(--color-border)',
  borderRadius: '3px',
  background: 'transparent',
  color: 'var(--color-text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
}

const errorStyle: React.CSSProperties = {
  marginTop: '0.3rem',
  fontSize: '0.7rem',
  color: '#c0392b',
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{ ...baseInput, borderColor: error ? '#c0392b' : 'var(--color-border)', ...style }}
        {...props}
      />
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, style, ...props }: TextareaProps) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <textarea
        style={{
          ...baseInput,
          resize: 'vertical',
          minHeight: '80px',
          borderColor: error ? '#c0392b' : 'var(--color-border)',
          ...style,
        }}
        {...props}
      />
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  )
}
