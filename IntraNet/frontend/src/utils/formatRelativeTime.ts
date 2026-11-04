// Prepara el valor para su uso.
export function formatRelativeTime(isoOrLabel?: string | null): string {
  if (!isoOrLabel) return ''

  const parsed = Date.parse(isoOrLabel)
  if (Number.isNaN(parsed)) return isoOrLabel

  const diffMs = Date.now() - parsed
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  }).format(new Date(parsed))
}
