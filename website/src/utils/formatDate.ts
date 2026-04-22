export function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  if (s < 60) return 'just now'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}h`
  if (d < 7) return `${d}d`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
