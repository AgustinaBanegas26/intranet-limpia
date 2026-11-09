// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: BirthdayBadge.
interface BirthdayBadgeProps {
  variant: 'today' | 'upcoming'
}

// Gestiona la operacion BirthdayBadge.
export function BirthdayBadge({ variant }: BirthdayBadgeProps) {
  const isToday = variant === 'today'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 99,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: isToday ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)',
        color: isToday ? '#dc2626' : 'var(--muted-foreground)',
        border: `1px solid ${isToday ? 'rgba(220,38,38,0.3)' : 'rgba(220,38,38,0.12)'}`,
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}
    >
      {isToday ? '🎉 Feliz Cumple' : '🎂 Próximamente'}
    </div>
  )
}
