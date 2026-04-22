interface Props {
  username: string
  pictureUrl?: string
  size?: number
}

export default function Avatar({ username, pictureUrl, size = 32 }: Props) {
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt={username}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          background: 'var(--color-border)',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        color: 'var(--color-muted)',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: '500',
        flexShrink: 0,
      }}
    >
      {username[0]?.toUpperCase()}
    </div>
  )
}
