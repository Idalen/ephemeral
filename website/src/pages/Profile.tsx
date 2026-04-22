import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getMe, getUser, getUserPosts, follow, unfollow, updateMe } from '../api/users'
import { uploadMedia } from '../api/media'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Modal from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'
import type { UserProfile, UpdateProfileRequest } from '../types'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const isOwn = currentUser?.username === username

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => (isOwn ? getMe() : getUser(username!)).then((r) => r.data),
    enabled: !!username,
  })

  const { data: postsData } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => getUserPosts(username!).then((r) => r.data),
    enabled: !!username,
  })

  const followMutation = useMutation({
    mutationFn: () => (profile?.is_following ? unfollow(username!) : follow(username!)),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['user', username] })
      const prev = qc.getQueryData<UserProfile>(['user', username])
      if (prev) {
        qc.setQueryData<UserProfile>(['user', username], {
          ...prev,
          is_following: !prev.is_following,
          follower_count: prev.is_following
            ? prev.follower_count - 1
            : prev.follower_count + 1,
        })
      }
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['user', username], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['user', username] }),
  })

  if (isLoading) return <ProfileSkeleton />
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--color-muted)' }}>
        User not found.
      </div>
    )
  }

  return (
    <div>
      {/* Banner */}
      <div
        style={{
          height: '220px',
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {profile.background_picture_url && (
          <img
            src={profile.background_picture_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Avatar + actions row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '-36px',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              borderRadius: '50%',
              border: '3px solid var(--color-bg)',
              transition: 'border-color 0.4s ease',
            }}
          >
            <Avatar
              username={profile.username}
              pictureUrl={profile.profile_picture_url}
              size={72}
            />
          </div>

          {isOwn ? (
            <ActionButton onClick={() => setEditOpen(true)}>Edit profile</ActionButton>
          ) : (
            <ActionButton
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              active={!!profile.is_following}
            >
              {profile.is_following ? 'Following' : 'Follow'}
            </ActionButton>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1
            style={{
              margin: '0 0 0.1rem',
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: '400',
              fontSize: '1.5rem',
              letterSpacing: '-0.01em',
              color: 'var(--color-text)',
            }}
          >
            {profile.display_name || profile.username}
          </h1>
          {profile.display_name && (
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.75rem',
                color: 'var(--color-muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              @{profile.username}
            </p>
          )}
          {profile.bio && (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.55,
                maxWidth: '420px',
              }}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '2.5rem',
            paddingTop: '1.25rem',
            paddingBottom: '2.25rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Stat value={profile.post_count} label="posts" />
          <Stat value={profile.follower_count} label="followers" />
          <Stat value={profile.following_count} label="following" />
        </div>

        {/* Post grid */}
        {postsData && (postsData.posts ?? []).length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '3px',
            }}
          >
            {(postsData.posts ?? []).map((post) => {
              const img = [...(post.media ?? [])].sort((a, b) => a.position - b.position)[0]
              return (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  style={{
                    display: 'block',
                    aspectRatio: '1',
                    overflow: 'hidden',
                    background: 'var(--color-border)',
                  }}
                >
                  {img && (
                    <img
                      src={img.url}
                      alt={`${post.city}, ${post.country}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              No posts yet
            </p>
          </div>
        )}

        <div style={{ height: '3rem' }} />
      </div>

      {isOwn && profile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={() => qc.invalidateQueries({ queryKey: ['user', username] })}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.3rem',
          fontWeight: '400',
          color: 'var(--color-text)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          fontFamily: "'DM Sans', sans-serif",
          marginTop: '0.2rem',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function ActionButton({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.45rem 1.1rem',
        fontSize: '0.68rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontFamily: "'DM Sans', sans-serif",
        border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
        background: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-inv)' : 'var(--color-text)',
        borderRadius: '3px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </button>
  )
}

function ProfileSkeleton() {
  return (
    <div>
      <div
        style={{ height: '220px', background: 'var(--color-border)', animation: 'pulse 1.6s ease-in-out infinite' }}
      />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ marginTop: '-36px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-border)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ height: '1.5rem', width: '180px', background: 'var(--color-border)', borderRadius: '3px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '0.8rem', width: '280px', background: 'var(--color-border)', borderRadius: '3px', animation: 'pulse 1.6s ease-in-out infinite' }} />
        </div>
      </div>
    </div>
  )
}

// ── Edit profile modal ────────────────────────────────────────────────────────

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  profile: UserProfile
  onSaved: () => void
}

function EditProfileModal({ open, onClose, profile, onSaved }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(profile.profile_picture_url)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState(profile.background_picture_url)
  const [saving, setSaving] = useState(false)

  function handleImageChange(
    file: File,
    setFile: (f: File) => void,
    setPreview: (u: string) => void,
  ) {
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const update: UpdateProfileRequest = { display_name: displayName, bio }

      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const res = await uploadMedia(fd)
        update.profile_picture_url = res.data.url
      }
      if (bannerFile) {
        const fd = new FormData()
        fd.append('file', bannerFile)
        const res = await uploadMedia(fd)
        update.background_picture_url = res.data.url
      }

      await updateMe(update)
      toast.success('Profile updated.')
      onSaved()
      onClose()
    } catch {
      toast.error('Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner */}
        <div>
          <label style={labelStyle}>Banner</label>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            <div
              style={{
                height: '100px',
                background: bannerPreview ? undefined : 'var(--color-border)',
                overflow: 'hidden',
                borderRadius: '3px',
                border: '1px solid var(--color-border)',
              }}
            >
              {bannerPreview && (
                <img
                  src={bannerPreview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImageChange(f, setBannerFile, (u) => setBannerPreview(u))
              }}
            />
          </label>
        </div>

        {/* Avatar */}
        <div>
          <label style={labelStyle}>Profile picture</label>
          <label style={{ display: 'inline-block', cursor: 'pointer' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--color-border)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: 'var(--color-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {profile.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImageChange(f, setAvatarFile, (u) => setAvatarPreview(u))
              }}
            />
          </label>
        </div>

        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={64}
        />

        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          style={{ minHeight: '70px' }}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          style={submitButtonStyle(saving)}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-muted)',
  fontFamily: "'DM Sans', sans-serif",
  marginBottom: '0.35rem',
}

function submitButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.7rem',
    background: 'var(--color-text)',
    color: 'var(--color-inv)',
    border: 'none',
    borderRadius: '3px',
    fontSize: '0.68rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontFamily: "'DM Sans', sans-serif",
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.2s ease',
  }
}
