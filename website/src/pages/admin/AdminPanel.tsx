import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X, ShieldCheck, ShieldOff } from 'lucide-react'
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  grantTrust,
  revokeTrust,
  getPendingPosts,
  approvePost,
  rejectPost,
} from '../../api/admin'
import { formatDate } from '../../utils/formatDate'
import type { User, Post } from '../../types'

type Tab = 'users' | 'posts'

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: '300',
          fontStyle: 'italic',
          fontSize: '1.6rem',
          color: 'var(--color-text)',
          margin: '0 0 2rem',
        }}
      >
        Admin
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem',
        }}
      >
        {(['users', 'posts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              paddingBottom: '0.6rem',
              fontSize: '0.68rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: "'DM Sans', sans-serif",
              color: tab === t ? 'var(--color-text)' : 'var(--color-muted)',
              borderBottom: tab === t ? '1px solid var(--color-text)' : '1px solid transparent',
              marginBottom: '-1px',
              transition: 'color 0.2s ease',
              fontWeight: tab === t ? '500' : '400',
            }}
          >
            {t === 'users' ? 'Pending users' : 'Pending posts'}
          </button>
        ))}
      </div>

      {tab === 'users' ? <PendingUsers /> : <PendingPosts />}
    </div>
  )
}

// ── Pending users ─────────────────────────────────────────────────────────────

function PendingUsers() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', 'pending'],
    queryFn: () => getPendingUsers({ limit: 50 }).then((r) => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      toast.success('User approved.')
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] })
    },
    onError: () => toast.error('Action failed.'),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: () => {
      toast.success('User rejected.')
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] })
    },
    onError: () => toast.error('Action failed.'),
  })

  const trustMutation = useMutation({
    mutationFn: ({ id, trusted }: { id: string; trusted: boolean }) =>
      trusted ? revokeTrust(id) : grantTrust(id),
    onSuccess: () => {
      toast.success('Trust updated.')
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] })
    },
    onError: () => toast.error('Action failed.'),
  })

  if (isLoading) return <TableSkeleton rows={4} />

  const users = data?.users ?? []

  if (users.length === 0)
    return <EmptyState label="No pending registrations" />

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Username', 'Registered', 'Actions'].map((h) => (
            <Th key={h}>{h}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((u: User) => (
          <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Td>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: 'var(--color-text)' }}>
                @{u.username}
              </span>
            </Td>
            <Td>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {formatDate(u.created_at)}
              </span>
            </Td>
            <Td>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AdminAction
                  onClick={() => approveMutation.mutate(u.id)}
                  disabled={approveMutation.isPending}
                  title="Approve"
                  color="#2e7d32"
                >
                  <Check size={13} strokeWidth={2} />
                </AdminAction>
                <AdminAction
                  onClick={() => rejectMutation.mutate(u.id)}
                  disabled={rejectMutation.isPending}
                  title="Reject"
                  color="#c0392b"
                >
                  <X size={13} strokeWidth={2} />
                </AdminAction>
                <AdminAction
                  onClick={() => trustMutation.mutate({ id: u.id, trusted: u.is_trusted })}
                  disabled={trustMutation.isPending}
                  title={u.is_trusted ? 'Revoke trust' : 'Grant trust'}
                  color={u.is_trusted ? 'var(--color-text)' : 'var(--color-muted)'}
                >
                  {u.is_trusted ? (
                    <ShieldCheck size={13} strokeWidth={1.5} />
                  ) : (
                    <ShieldOff size={13} strokeWidth={1.5} />
                  )}
                </AdminAction>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Pending posts ─────────────────────────────────────────────────────────────

function PendingPosts() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: () => getPendingPosts({ limit: 50 }).then((r) => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: approvePost,
    onSuccess: () => {
      toast.success('Post approved.')
      qc.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
    onError: () => toast.error('Action failed.'),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectPost,
    onSuccess: () => {
      toast.success('Post rejected.')
      qc.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] })
    },
    onError: () => toast.error('Action failed.'),
  })

  if (isLoading) return <TableSkeleton rows={4} />

  const posts = data?.posts ?? []

  if (posts.length === 0) return <EmptyState label="No pending posts" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {posts.map((post: Post) => {
        const thumb = [...post.media].sort((a, b) => a.position - b.position)[0]
        return (
          <div
            key={post.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr auto',
              gap: '1rem',
              alignItems: 'center',
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 72,
                height: 72,
                background: 'var(--color-border)',
                overflow: 'hidden',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            >
              {thumb && (
                <img
                  src={thumb.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: '0 0 0.2rem',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  color: 'var(--color-text)',
                }}
              >
                {post.city}, {post.country}
              </p>
              {post.description && (
                <p
                  style={{
                    margin: '0 0 0.2rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {post.description}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--color-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {formatDate(post.created_at)}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <AdminAction
                onClick={() => approveMutation.mutate(post.id)}
                disabled={approveMutation.isPending}
                title="Approve"
                color="#2e7d32"
              >
                <Check size={13} strokeWidth={2} />
              </AdminAction>
              <AdminAction
                onClick={() => rejectMutation.mutate(post.id)}
                disabled={rejectMutation.isPending}
                title="Reject"
                color="#c0392b"
              >
                <X size={13} strokeWidth={2} />
              </AdminAction>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0 0 0.75rem',
        fontSize: '0.62rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: '400',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.85rem 0' }}>{children}</td>
}

function AdminAction({
  onClick,
  disabled,
  title,
  color,
  children,
}: {
  onClick: () => void
  disabled: boolean
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'transparent',
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      {children}
    </button>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <p
      style={{
        textAlign: 'center',
        padding: '3rem 0',
        fontSize: '0.68rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </p>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '2.5rem',
            background: 'var(--color-border)',
            borderRadius: '3px',
            animation: 'pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}
