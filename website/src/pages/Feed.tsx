import { useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '../api/feed'
import PostCard from '../components/PostCard'

export default function Feed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) =>
        getFeed({ cursor: pageParam as string | undefined, limit: 20 }),
      getNextPageParam: (last) => (last.data.has_more ? last.data.next_cursor : undefined),
      initialPageParam: undefined as string | undefined,
    })

  const observer = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return
      observer.current?.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage()
      })
      if (node) observer.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  )

  const posts = data?.pages.flatMap((p) => p.data.posts ?? []) ?? []

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {isLoading && <FeedSkeleton />}

      {isError && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '0.78rem',
            paddingTop: '4rem',
          }}
        >
          Could not load feed. Try refreshing.
        </p>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
          <p
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
            }}
          >
            Nothing here yet
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.75rem' }}>
            Follow some accounts to see their posts here.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={loadMoreRef} style={{ height: '1px' }} />

      {isFetchingNextPage && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '1.5rem 0',
          }}
        >
          Loading…
        </p>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: '2.5rem 0',
          }}
        >
          All caught up
        </p>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.7rem' }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--color-border)',
                animation: 'pulse 1.6s ease-in-out infinite',
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div
                style={{
                  height: '0.65rem',
                  width: '110px',
                  background: 'var(--color-border)',
                  borderRadius: '2px',
                  animation: 'pulse 1.6s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: '0.6rem',
                  width: '70px',
                  background: 'var(--color-border)',
                  borderRadius: '2px',
                  animation: 'pulse 1.6s ease-in-out infinite',
                }}
              />
            </div>
          </div>
          <div
            style={{
              height: '340px',
              background: 'var(--color-border)',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </>
  )
}
