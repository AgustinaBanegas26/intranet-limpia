import { motion } from 'framer-motion'
import { getInitials } from '../../context/AuthContext'
import type { Profile } from '../../services/api'
import type { User } from '../../context/AuthContext'

type WelcomeStripProps = {
  user: User
  profile: Profile | null
  loading?: boolean
}

export function WelcomeStrip({ user, profile, loading }: WelcomeStripProps) {
  const displayName = profile?.nombreCompleto || user.name
  const firstName = displayName.trim().split(/\s+/)[0] || displayName
  const area = profile?.sector || null
  const cargo = (profile as (Profile & { cargo?: string }) | null)?.cargo || null
  const sucursal = profile?.sucursal || null
  const foto = profile?.foto || user.foto || null
  const initials = getInitials(displayName)

  const meta = [cargo, area, sucursal].filter(Boolean).join(' · ')

  return (
    <motion.header
      className="welcome-strip"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.22)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#fff',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {foto ? (
            <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, opacity: 0.82 }}>
            Bienvenido
          </p>
          <p className="welcome-name">
            {loading ? '…' : firstName}
          </p>
          {meta && (
            <p className="welcome-sub">{meta}</p>
          )}
        </div>
      </div>
    </motion.header>
  )
}
