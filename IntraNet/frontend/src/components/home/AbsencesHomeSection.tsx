import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserMinus } from 'lucide-react'
import { Link } from 'react-router'
import { Accordion } from '../ui/Accordion'
import { getInitials } from '../../context/AuthContext'
import { absencesService, type AusenciaDTO } from '../../services/absences'

// Gestiona la operacion fmtDate.
function fmtDate(d: string) {
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

// Gestiona la operacion AbsenceHomeRow.
function AbsenceHomeRow({ item }: { item: AusenciaDTO }) {
  const nombre = item.solicitante?.nombre || 'Sin nombre'
  const foto = item.solicitante?.foto
  const initials = getInitials(nombre)
  const area = item.solicitante?.area
  const fecha =
    item.fecha_hasta && item.fecha_hasta !== item.fecha_desde
      ? `${fmtDate(item.fecha_desde)} – ${fmtDate(item.fecha_hasta)}`
      : fmtDate(item.fecha_desde)

  return (
    <article className="absence-home-row">
      <div className="absence-home-row__avatar" aria-hidden="true">
        {foto ? <img src={foto} alt="" /> : <span>{initials}</span>}
      </div>
      <div className="absence-home-row__body">
        <p className="absence-home-row__label">
          <strong>{nombre}</strong> está ausente
        </p>
        <p className="absence-home-row__meta">
          {fecha}
          {area ? ` · ${area}` : ''}
          {item.tipo ? ` · ${item.tipo}` : ''}
        </p>
      </div>
    </article>
  )
}

// Gestiona la operacion AbsencesHomeSection.
export function AbsencesHomeSection() {
  const [items, setItems] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [sector, setSector] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await absencesService.getVigentes()
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onFocus = () => { load() }
    // Gestiona la accion correspondiente.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    const interval = window.setInterval(load, 60_000)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [load])

  const sectors = useMemo(
    () => [...new Set(items.map((i) => i.solicitante?.area).filter(Boolean))].sort() as string[],
    [items],
  )

  const filtered = useMemo(
    () => (sector ? items.filter((i) => i.solicitante?.area === sector) : items),
    [items, sector],
  )

  return (
    <section className="employee-home-section">
      <div className="employee-home-section__head">
        <UserMinus size={16} aria-hidden="true" />
        <span>Ausencias</span>
        <Link to="/ausencias" className="card-inline-link employee-home-section__link">
          Solicitar o consultar mis ausencias →
        </Link>
      </div>

      <div className="bc-card bc-card--accordion-standalone">
        <Accordion
          title="Personas ausentes"
          count={filtered.length > 0 ? filtered.length : undefined}
          defaultOpen={filtered.length > 0}
        >
          <div className="absence-home-filters">
            <label className="form-label" htmlFor="absence-sector-filter">Sector de la empresa</label>
            <select
              id="absence-sector-filter"
              className="form-input"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">Todos los sectores</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="skeleton-stack">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="bc-accordion__empty">
              {sector
                ? 'No hay personas ausentes en este sector.'
                : 'No hay personas ausentes en este momento.'}
            </p>
          ) : (
            <div className="absence-home-list">
              {filtered.map((item) => (
                <AbsenceHomeRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </Accordion>
      </div>
    </section>
  )
}
