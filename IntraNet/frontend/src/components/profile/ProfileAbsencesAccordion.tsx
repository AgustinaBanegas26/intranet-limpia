// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: contenido desplegable reutilizable.
import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { Accordion } from '../ui/Accordion'
import { PremiumCard } from '../ui/ProductUI'
import { absencesService, type AusenciaDTO } from '../../services/absences'

const statusConfig = {
  aprobada: { label: 'Aprobada', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
  pendiente: { label: 'Pendiente', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  rechazada: { label: 'Rechazada', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
} as const

// Gestiona la operacion fmtDate.
function fmtDate(d: string) {
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Gestiona la operacion ProfileAbsencesAccordion.
export function ProfileAbsencesAccordion() {
  const [items, setItems] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    absencesService
      .getAll()
      .then((res) => { if (active) setItems(res.data || []) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <PremiumCard title="Mis inasistencias" eyebrow="Historial" icon={Clock}>
      <Accordion
        embedded
        title="Ver registro de ausencias"
        count={items.length > 0 ? items.length : undefined}
      >
        {loading ? (
          <div className="skeleton-stack">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ) : items.length === 0 ? (
          <p className="bc-accordion__empty">No tenés ausencias registradas.</p>
        ) : (
          <div className="profile-absences-list">
            {items.map((item) => {
              const cfg = statusConfig[item.estado] ?? statusConfig.pendiente
              const Icon = cfg.icon
              const fecha = item.fecha_hasta && item.fecha_hasta !== item.fecha_desde
                ? `${fmtDate(item.fecha_desde)} – ${fmtDate(item.fecha_hasta)}`
                : fmtDate(item.fecha_desde)

              return (
                <article key={item.id} className="profile-absence-row">
                  <div className="profile-absence-row__main">
                    <time>{fecha}</time>
                    <p>{item.motivo || item.tipo || 'Sin motivo'}</p>
                  </div>
                  <span
                    className="profile-absence-row__status"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </Accordion>
    </PremiumCard>
  )
}
