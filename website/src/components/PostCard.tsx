import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { likePost, unlikePost } from '../api/posts'
import type { FeedPost } from '../types'
import { formatDate } from '../utils/formatDate'
import Avatar from './Avatar'

interface Props {
  post: FeedPost
}

export default function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(post.is_liked)
  const [count, setCount] = useState(post.like_count)

  const toggleLike = useMutation({
    mutationFn: () => (liked ? unlikePost(post.id) : likePost(post.id)),
    onMutate: () => {
      const wasLiked = liked
      setLiked(!wasLiked)
      setCount(c => (wasLiked ? c - 1 : c + 1))
    },
    onError: () => {
      setLiked(post.is_liked)
      setCount(post.like_count)
    },
  })

  const sortedMedia = [...(post.media ?? [])].sort((a, b) => a.position - b.position)
  const firstImage = sortedMedia[0]

  return (
    <article style={{ marginBottom: '3.5rem' }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' }}>
        <Link to={`/users/${post.author_username}`}>
          <Avatar username={post.author_username} pictureUrl={post.author_picture_url} size={26} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            to={`/users/${post.author_username}`}
            style={{
              fontSize: '0.78rem',
              fontWeight: '500',
              color: 'var(--color-text)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {post.author_display_name || post.author_username}
          </Link>
          <span style={{ margin: '0 0.35rem', color: 'var(--color-muted)', fontSize: '0.7rem' }}>·</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {post.city}, {post.country}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.66rem',
            color: 'var(--color-muted)',
            fontFamily: "'DM Sans', sans-serif",
            flexShrink: 0,
          }}
        >
          {formatDate(post.created_at)}
        </span>
      </div>

      {/* Image */}
      {firstImage && (
        <Link to={`/posts/${post.id}`} style={{ display: 'block', position: 'relative' }}>
          <img
            src={firstImage.url}
            alt={`${post.city}, ${post.country}`}
            style={{
              width: '100%',
              maxHeight: '72vh',
              objectFit: 'cover',
              display: 'block',
              background: 'var(--color-border)',
            }}
            loading="lazy"
          />
          {sortedMedia.length > 1 && (
            <span
              style={{
                position: 'absolute',
                top: '0.6rem',
                right: '0.6rem',
                background: 'rgba(0,0,0,0.45)',
                color: '#fff',
                fontSize: '0.62rem',
                padding: '0.18rem 0.45rem',
                borderRadius: '2px',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.06em',
              }}
            >
              1/{sortedMedia.length}
            </span>
          )}
        </Link>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
        <button
          onClick={() => toggleLike.mutate()}
          disabled={toggleLike.isPending}
          aria-label={liked ? 'Unlike' : 'Like'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: liked ? 'var(--color-text)' : 'var(--color-muted)',
            transition: 'color 0.15s ease',
            flexShrink: 0,
          }}
        >
          <Heart
            size={15}
            strokeWidth={1.5}
            style={{ fill: liked ? 'var(--color-text)' : 'transparent', transition: 'fill 0.15s ease' }}
          />
          <span style={{ fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif" }}>{count}</span>
        </button>

        {post.description && (
          <p
            style={{
              flex: 1,
              margin: 0,
              fontSize: '0.78rem',
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
      </div>
    </article>
  )
}
