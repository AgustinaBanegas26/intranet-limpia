// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: tarjeta visual reutilizable.
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { CelebracionPersona } from '../../services/celebraciones'
import { BirthdayAvatar } from './BirthdayAvatar'
import { BirthdayUpcomingAccordion } from './BirthdayUpcomingAccordion'

interface BirthdayCardProps {
  person: CelebracionPersona
  isToday?: boolean
  isUpcoming?: boolean
  variant?: 'featured' | 'carousel'
  upcomingPersons?: CelebracionPersona[]
  showAccordion?: boolean
  className?: string
  style?: React.CSSProperties
}

const CONFETTI = [
  { left: '6%', top: '12%', rotate: -22, delay: 0, w: 3, h: 10 },
  { left: '88%', top: '10%', rotate: 28, delay: 0.5, w: 4, h: 4 },
  { left: '10%', top: '78%', rotate: 18, delay: 0.3, w: 3, h: 9 },
  { left: '92%', top: '72%', rotate: -35, delay: 0.9, w: 4, h: 4 },
]

const STARS = [
  { left: '18%', top: '20%', delay: 0, sz: 6 },
  { left: '80%', top: '55%', delay: 0.8, sz: 5 },
  { left: '72%', top: '18%', delay: 0.4, sz: 5 },
]

// Gestiona la operacion BalloonsDeco.
function BalloonsDeco({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="68"
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="16" cy="18" rx="10" ry="13" stroke="var(--bc-deco-stroke)" strokeWidth="1.4" />
      <path d="M16 31 Q14 36 16 40" stroke="var(--bc-deco-stroke)" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="32" cy="14" rx="11" ry="14" stroke="var(--bc-deco-stroke)" strokeWidth="1.4" />
      <path d="M32 28 Q30 34 32 42" stroke="var(--bc-deco-stroke)" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="49" cy="19" rx="10" ry="13" stroke="var(--bc-deco-stroke)" strokeWidth="1.4" />
      <path d="M49 32 Q47 37 49 42" stroke="var(--bc-deco-stroke)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// Gestiona la operacion CakeSVG.
function CakeSVG() {
  return (
    <svg
      className="bc-card__cake"
      width="58"
      height="58"
      viewBox="0 0 90 90"
      fill="none"
      aria-hidden="true"
    >
      <rect x="24" y="12" width="5" height="16" rx="2.5" stroke="var(--bc-deco-stroke)" strokeWidth="2" fill="none" />
      <rect x="42" y="7" width="6" height="21" rx="3" stroke="var(--bc-deco-stroke)" strokeWidth="2" fill="none" />
      <rect x="61" y="12" width="5" height="16" rx="2.5" stroke="var(--bc-deco-stroke)" strokeWidth="2" fill="none" />
      <ellipse cx="26.5" cy="11" rx="3" ry="4.5" fill="var(--bc-deco-stroke)" opacity="0.85" />
      <ellipse cx="45" cy="6" rx="3.5" ry="5" fill="var(--bc-deco-stroke)" opacity="0.9" />
      <ellipse cx="63.5" cy="11" rx="3" ry="4.5" fill="var(--bc-deco-stroke)" opacity="0.85" />
      <rect x="10" y="40" width="70" height="38" rx="8" stroke="var(--bc-deco-stroke)" strokeWidth="2" fill="rgba(220,38,38,0.05)" />
      <path
        d="M10 40 Q18 32 26 40 Q34 48 42 40 Q50 32 58 40 Q66 48 74 40 Q79 34 80 40"
        stroke="var(--bc-deco-stroke)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="10" y1="59" x2="80" y2="59" stroke="var(--bc-deco-stroke)" strokeWidth="1.2" opacity="0.4" />
      <circle cx="30" cy="52" r="3" stroke="var(--bc-deco-stroke)" strokeWidth="1.5" fill="none" />
      <circle cx="45" cy="52" r="3" stroke="var(--bc-deco-stroke)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="52" r="3" stroke="var(--bc-deco-stroke)" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

// Gestiona la operacion StarDeco.
function StarDeco({ sz }: { sz: number }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M5 0 L5.7 3.9 L10 5 L5.7 6.1 L5 10 L4.3 6.1 L0 5 L4.3 3.9 Z"
        fill="var(--bc-deco-stroke)"
        opacity="0.75"
      />
    </svg>
  )
}

// Obtiene los datos necesarios.
function getKicker(isToday: boolean, isUpcoming: boolean): string {
  if (isToday) return '🎉 Cumpleaños del día'
  if (isUpcoming) return '🎂 Próximamente'
  return '🎂 Hoy festejamos'
}

// Obtiene los datos necesarios.
function getTitle(person: CelebracionPersona, isToday: boolean, isUpcoming: boolean): string {
  const name = person.nombreCompleto
  if (isToday) return `¡Feliz cumple, ${name}!`
  if (isUpcoming) {
    const days = person.diasRestantes
    if (days === 1) return `Mañana cumple años ${name} 🎈`
    if (days != null) return `En ${days} días cumple ${name} ✨`
    return `Próximo cumpleaños de ${name} 🎂`
  }
  return `Hoy celebramos a ${name} 🎂`
}

// Obtiene los datos necesarios.
function getPrimaryMessage(isToday: boolean, isUpcoming: boolean): string {
  if (isToday) return '🎉 ¡Que tengas un día increíble rodeado de buenas personas!'
  if (isUpcoming) return '🎈 ¡Ya falta poco para festejar!'
  return '🎉 ¡A celebrar con alegría!'
}

// Obtiene los datos necesarios.
function getWarmMessage(isToday: boolean, isUpcoming: boolean): string {
  if (isToday) {
    return 'Todo el equipo te desea un excelente cumpleaños. Que este nuevo año venga lleno de éxitos, salud y grandes momentos.'
  }
  if (isUpcoming) {
    return 'Desde todo el equipo te enviamos los mejores deseos para cuando llegue tu día especial.'
  }
  return 'Que este día esté lleno de alegría, buena compañía y momentos inolvidables.'
}

// Obtiene los datos necesarios.
function getCelebrationLine(isToday: boolean, isUpcoming: boolean): string {
  if (isToday) return '🎉 ¡Feliz cumple! 🎂'
  if (isUpcoming) return '🎈 ¡Ya falta poco! ✨'
  return '🎉 ¡A celebrar! 🍰'
}

const RIGHT_DECO_PARTICLES = [
  { top: '18%', right: '28%', size: 3, delay: 0 },
  { top: '42%', right: '12%', size: 4, delay: 0.6 },
  { top: '68%', right: '34%', size: 2, delay: 1.1 },
  { top: '82%', right: '16%', size: 3, delay: 0.3 },
]

const RIGHT_DECO_CONFETTI = [
  { top: '14%', right: '22%', rotate: 24, w: 3, h: 9 },
  { top: '55%', right: '8%', rotate: -18, w: 4, h: 4 },
  { top: '76%', right: '26%', rotate: 32, w: 3, h: 8 },
]

const RIGHT_DECO_STARS = [
  { top: '24%', right: '14%', sz: 7, delay: 0.2 },
  { top: '48%', right: '30%', sz: 5, delay: 0.7 },
  { top: '72%', right: '10%', sz: 6, delay: 1.2 },
]

// Gestiona la operacion StreamersDeco.
function StreamersDeco() {
  return (
    <svg
      className="bc-card__deco-streamers"
      viewBox="0 0 80 120"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 0 Q52 40 38 70 Q28 92 44 120"
        stroke="var(--bc-deco-stroke)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M55 0 Q48 35 58 65 Q64 88 50 120"
        stroke="var(--bc-deco-stroke)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M25 0 Q32 38 22 68 Q14 90 28 120"
        stroke="var(--bc-deco-stroke)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  )
}

// Gestiona la operacion RightPanelDeco.
function RightPanelDeco({ isToday }: { isToday: boolean }) {
  const heroEmoji = isToday ? '🎉' : '🎂'

  return (
    <div className="bc-card__deco-panel" aria-hidden="true">
      <span className="bc-card__deco-hero">{heroEmoji}</span>
      <StreamersDeco />
      {RIGHT_DECO_CONFETTI.map((c, i) => (
        <div
          key={`rc-${i}`}
          className="bc-confetti bc-card__deco-bit"
          style={{
            top: c.top,
            right: c.right,
            width: c.w,
            height: c.h,
            background: 'var(--bc-deco-stroke)',
            borderRadius: c.h > 6 ? 2 : '50%',
            transform: `rotate(${c.rotate}deg)`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {RIGHT_DECO_STARS.map((s, i) => (
        <div
          key={`rs-${i}`}
          className="bc-star bc-card__deco-bit"
          style={{ top: s.top, right: s.right, animationDelay: `${s.delay}s` }}
        >
          <StarDeco sz={s.sz} />
        </div>
      ))}
      {RIGHT_DECO_PARTICLES.map((p, i) => (
        <span
          key={`rp-${i}`}
          className="bc-card__deco-particle"
          style={{
            top: p.top,
            right: p.right,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Gestiona la operacion BirthdayCard.
export function BirthdayCard({
  person,
  isToday = false,
  isUpcoming = false,
  variant = 'featured',
  upcomingPersons = [],
  showAccordion,
  className,
  style,
}: BirthdayCardProps) {
  const area = person.area ?? null
  const ciudad = (person as { ciudad?: string }).ciudad ?? person.sucursal ?? null
  const locationLine = [area, ciudad].filter(Boolean).join(' · ')
  const isCarousel = variant === 'carousel'
  const showUpcomingAccordion = showAccordion ?? (variant === 'featured' && !isCarousel)
  const avatarSize = isCarousel ? 'md' : 'lg'

  const kicker = getKicker(isToday, isUpcoming)
  const title = getTitle(person, isToday, isUpcoming)
  const celebration = getCelebrationLine(isToday, isUpcoming)
  const primaryMessage = getPrimaryMessage(isToday, isUpcoming)
  const warmMessage = getWarmMessage(isToday, isUpcoming)

  return (
    <motion.article
      className={`bc-card${isCarousel ? ' bc-card--carousel' : ''}${className ? ` ${className}` : ''}`}
      initial={{ opacity: 0, y: isCarousel ? 12 : 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={style}
      aria-label={`Cumpleaños de ${person.nombreCompleto}`}
    >
      <BalloonsDeco className="bc-card__deco bc-card__deco--tl" />
      <BalloonsDeco className="bc-card__deco bc-card__deco--br" />

      {!isCarousel &&
        CONFETTI.map((c, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="bc-confetti"
            style={{
              position: 'absolute',
              left: c.left,
              top: c.top,
              width: c.w,
              height: c.h,
              background: 'var(--bc-deco-stroke)',
              borderRadius: c.h > 6 ? 2 : '50%',
              transform: `rotate(${c.rotate}deg)`,
              animationDelay: `${c.delay}s`,
              pointerEvents: 'none',
            }}
          />
        ))}

      {!isCarousel &&
        STARS.map((s, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="bc-star"
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              animationDelay: `${s.delay}s`,
              pointerEvents: 'none',
            }}
          >
            <StarDeco sz={s.sz} />
          </div>
        ))}

      <div className="bc-card__body">
        <div className="bc-card__left">
          <BirthdayAvatar
            foto={person.foto}
            nombreCompleto={person.nombreCompleto}
            isToday={isToday}
            size={avatarSize}
          />
          {!isCarousel && <CakeSVG />}
        </div>

        <div className="bc-card__right">
          <div className="bc-card__content">
            {isCarousel ? (
              <span className="bc-kicker">{kicker}</span>
            ) : (
              <span className="bc-badge">{kicker}</span>
            )}
            <h2 className="bc-title">{title}</h2>

            {locationLine && (
              <p className="bc-location">
                <MapPin size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
                {locationLine}
              </p>
            )}

            {isCarousel ? (
              <span className="bc-celebration">{celebration}</span>
            ) : (
              <>
                <p className="bc-message bc-message--primary">{primaryMessage}</p>
                <p className="bc-message-secondary">{warmMessage}</p>
                <span className="bc-felicidades">✨ Felicidades 🎊</span>
              </>
            )}
          </div>

          {!isCarousel && <RightPanelDeco isToday={isToday} />}
        </div>
      </div>

      {showUpcomingAccordion && (
        <BirthdayUpcomingAccordion persons={upcomingPersons} embedded alwaysShow />
      )}
    </motion.article>
  )
}
