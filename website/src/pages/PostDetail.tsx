import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Heart, Trash2, MapPin } from 'lucide-react'
import { getPost, deletePost, likePost, unlikePost } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatDate'
import Avatar from '../components/Avatar'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [imgIndex, setImgIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeInit, setLikeInit] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await getPost(id!)
      return res.data
    },
    enabled: !!id,
  })

  // Sync local like state once post loads (only on first load)
  if (post && !likeInit) {
    setLikeInit(true)
    setLikeCount(0) // GET /posts/:id doesn't return like_count
  }

  const toggleLike = useMutation({
    mutationFn: () => (liked ? unlikePost(id!) : likePost(id!)),
    onMutate: () => {
      const wasLiked = liked
      setLiked(!wasLiked)
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1))
    },
    onError: () => {
      setLiked(liked)
      setLikeCount(likeCount)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(id!),
    onSuccess: () => {
      toast.success('Post deleted.')
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-posts'] })
      navigate(-1)
    },
    onError: () => toast.error('Could not delete post.'),
  })

  if (isLoading) return <DetailSkeleton />

  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--color-muted)' }}>
        Post not found.
      </div>
    )
  }

  const sortedMedia = [...post.media].sort((a, b) => a.position - b.position)
  const currentImg = sortedMedia[imgIndex]
  const isOwn = user?.id === post.user_id

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: sortedMedia.length > 0 ? '1fr 320px' : '1fr',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Image viewer */}
        {currentImg && (
          <div style={{ position: 'relative' }}>
            <img
              src={currentImg.url}
              alt={`${post.city}, ${post.country}`}
              style={{
                width: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block',
                background: 'var(--color-border)',
              }}
            />
            {sortedMedia.length > 1 && (
              <>
                <NavArrow
                  direction="left"
                  onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                  disabled={imgIndex === 0}
                />
                <NavArrow
                  direction="right"
                  onClick={() => setImgIndex((i) => Math.min(sortedMedia.length - 1, i + 1))}
                  disabled={imgIndex === sortedMedia.length - 1}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '0.6rem',
                    right: '0.6rem',
                    background: 'rgba(0,0,0,0.45)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    padding: '0.18rem 0.45rem',
                    borderRadius: '2px',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {imgIndex + 1}/{sortedMedia.length}
                </span>
              </>
            )}
          </div>
        )}

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.25rem' }}>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link to={`/users/${post.user_id}`}>
              <Avatar username={post.user_id} size={30} />
            </Link>
            <div>
              <Link
                to={`/users/${post.user_id}`}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: '500',
                  color: 'var(--color-text)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {post.user_id}
              </Link>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.68rem',
                  color: 'var(--color-muted)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={13} strokeWidth={1.5} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text)',
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
              }}
            >
              {post.city}, {post.country}
            </span>
          </div>

          {/* GPS */}
          {post.latitude != null && post.longitude != null && (
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--color-muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}
            </p>
          )}

          {/* Description */}
          {post.description && (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {post.description}
            </p>
          )}

          {/* Like */}
          <button
            onClick={() => toggleLike.mutate()}
            disabled={toggleLike.isPending}
            aria-label={liked ? 'Unlike' : 'Like'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: liked ? 'var(--color-text)' : 'var(--color-muted)',
              transition: 'color 0.15s ease',
              alignSelf: 'flex-start',
            }}
          >
            <Heart
              size={16}
              strokeWidth={1.5}
              style={{ fill: liked ? 'var(--color-text)' : 'transparent', transition: 'fill 0.15s ease' }}
            />
            <span style={{ fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
              {liked ? 'Liked' : 'Like'}
              {likeCount > 0 && ` · ${likeCount}`}
            </span>
          </button>

          {/* Delete (own post only) */}
          {isOwn && (
            <button
              onClick={() => {
                if (confirm('Delete this post?')) deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--color-muted)',
                fontSize: '0.72rem',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.15s ease',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
            >
              <Trash2 size={13} strokeWidth={1.5} />
              Delete post
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'absolute',
        top: '50%',
        [direction]: '0.5rem',
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.35)',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 0.75,
        transition: 'opacity 0.15s ease',
      }}
    >
      {direction === 'left' ? (
        <ChevronLeft size={16} strokeWidth={1.5} />
      ) : (
        <ChevronRight size={16} strokeWidth={1.5} />
      )}
    </button>
  )
}

function DetailSkeleton() {
  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '2.5rem',
      }}
    >
      <div
        style={{
          height: '500px',
          background: 'var(--color-border)',
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[200, 120, 300, 80].map((w, i) => (
          <div
            key={i}
            style={{
              height: '0.75rem',
              width: `${w}px`,
              background: 'var(--color-border)',
              borderRadius: '3px',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  )
}
