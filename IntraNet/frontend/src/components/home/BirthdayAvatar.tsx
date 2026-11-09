// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: BirthdayAvatar.
import { useState } from 'react'
import { getInitials } from '../../utils/getInitials'

interface BirthdayAvatarProps {
  foto?: string | null
  nombreCompleto: string
  isToday?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  compact?: boolean
}

const SIZE_CLASS = {
  xs: 'bc-avatar-wrap--xs',
  sm: 'bc-avatar-wrap--sm',
  md: 'bc-avatar-wrap--md',
  lg: 'bc-avatar-wrap--lg',
} as const

// Gestiona la operacion BirthdayAvatar.
export function BirthdayAvatar({
  foto,
  nombreCompleto,
  isToday = false,
  size = 'lg',
  className,
  compact = false,
}: BirthdayAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(nombreCompleto)
  const showPhoto = Boolean(foto && !imgError)

  return (
    <div className={`bc-avatar-wrap ${SIZE_CLASS[size]}${className ? ` ${className}` : ''}`}>
      {!compact && (
        <div
          className={isToday ? 'bc-avatar-glow bc-glow-today' : 'bc-avatar-glow'}
          aria-hidden="true"
        />
      )}
      {showPhoto ? (
        <img
          src={foto!}
          alt={nombreCompleto}
          loading="lazy"
          onError={() => setImgError(true)}
          className="bc-avatar"
        />
      ) : (
        <div className="bc-avatar bc-avatar--initials" aria-hidden="true">
          {initials}
        </div>
      )}
    </div>
  )
}
