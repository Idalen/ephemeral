interface Props {
  width?: string | number
  height?: string | number
  radius?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({ width = '100%', height = '1rem', radius = '3px', style }: Props) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--color-border)',
        animation: 'pulse 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  )
}
