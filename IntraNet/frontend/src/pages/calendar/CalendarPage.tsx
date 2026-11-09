// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: calendario y solicitudes asociadas.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Loader2, MapPin, X } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ModalBackdrop } from '../../components/ui/ModalBackdrop'
import { calendarRequestTypes, type CalendarRequestType } from '../../config/calendarRequestTypes'
import { calendarService, type CalendarEvent } from '../../services/calendar'
import './calendar.css'

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const maxVisibleEvents = 4

// Prepara el valor para su uso.
function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`)
}

// Gestiona la operacion dateKey.
function dateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Comprueba los datos o la condicion indicada.
function isInEvent(date: Date, event: CalendarEvent) {
  const current = dateKey(date)
  return current >= event.fecha_desde.slice(0, 10) && current <= event.fecha_hasta.slice(0, 10)
}

// Prepara el valor para su uso.
function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(parseDate(value))
}

// Gestiona la operacion eventLabel.
function eventLabel(event: CalendarEvent) {
  return `${event.empleado} — ${calendarRequestTypes[event.tipo].label}`
}

// Gestiona la operacion EventButton.
function EventButton({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const color = calendarRequestTypes[event.tipo]
  return (
    <button
      type="button"
      className="request-calendar__event"
      style={{ background: color.background, borderColor: color.border, color: color.color }}
      title={eventLabel(event)}
      onClick={onClick}
    >
      {eventLabel(event)}
    </button>
  )
}

// Gestiona la operacion CalendarPage.
export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedTypes, setSelectedTypes] = useState<CalendarRequestType[]>(Object.keys(calendarRequestTypes) as CalendarRequestType[])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const [moreDay, setMoreDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null)

  useEffect(() => {
    let active = true
    calendarService.getEvents()
      .then((response) => { if (active) setEvents(response.data || []) })
      .catch(() => { if (active) setError('No se pudieron cargar las solicitudes aprobadas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredEvents = useMemo(
    () => events.filter((event) => selectedTypes.includes(event.tipo)),
    [events, selectedTypes],
  )

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - offset)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [month])

  const monthTitle = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(month)
  const todayKey = dateKey(new Date())

  // Alterna el estado correspondiente.
  const toggleType = (type: CalendarRequestType) => {
    setSelectedTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type])
  }

  return (
    <div className="page-root admin-page">
      <PageHero
        eyebrow="Administración"
        title="Calendario"
        description="Consultá las solicitudes aprobadas por fecha. Usá los filtros para ver solo los tipos que necesitás."
      />

      <PremiumCard title="Solicitudes aprobadas" icon={CalendarDays}>
        <div className="request-calendar__toolbar">
          <div className="request-calendar__navigation" aria-label="Navegación mensual">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} aria-label="Mes anterior"><ChevronLeft size={17} /></button>
            <h2>{monthTitle}</h2>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} aria-label="Mes siguiente"><ChevronRight size={17} /></button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hoy</button>
          </div>
          <div className="request-calendar__filters" aria-label="Filtrar solicitudes por tipo">
            <span><Filter size={14} /> Ver:</span>
            {(Object.keys(calendarRequestTypes) as CalendarRequestType[]).map((type) => {
              const config = calendarRequestTypes[type]
              return <button key={type} type="button" className={`request-calendar__filter ${selectedTypes.includes(type) ? 'is-selected' : ''}`} onClick={() => toggleType(type)} style={{ '--filter-bg': config.background, '--filter-border': config.border, '--filter-color': config.color } as CSSProperties}>{config.label}</button>
            })}
          </div>
        </div>

        <div className="request-calendar__legend" aria-label="Referencia de colores">
          {(Object.keys(calendarRequestTypes) as CalendarRequestType[]).map((type) => <span key={type}><i style={{ background: calendarRequestTypes[type].background, borderColor: calendarRequestTypes[type].border }} />{calendarRequestTypes[type].label}</span>)}
        </div>

        {error && <p className="request-calendar__error">{error}</p>}
        {loading ? <div className="request-calendar__loading"><Loader2 className="spin" size={19} /> Cargando calendario…</div> : (
          <div className="request-calendar__scroll">
            <div className="request-calendar__grid">
              {weekDays.map((day) => <div key={day} className="request-calendar__weekday">{day}</div>)}
              {days.map((date) => {
                const cellEvents = filteredEvents.filter((event) => isInEvent(date, event))
                const visible = cellEvents.slice(0, maxVisibleEvents)
                const remaining = cellEvents.slice(maxVisibleEvents)
                const currentMonth = date.getMonth() === month.getMonth()
                return <div key={dateKey(date)} className={`request-calendar__day ${currentMonth ? '' : 'is-outside'} ${dateKey(date) === todayKey ? 'is-today' : ''}`}>
                  <span className="request-calendar__date">{date.getDate()}</span>
                  <div className="request-calendar__events">
                    {visible.map((event) => <EventButton key={event.id} event={event} onClick={() => setDetail(event)} />)}
                    {remaining.length > 0 && <button type="button" className="request-calendar__more" onClick={() => setMoreDay({ date, events: remaining })}>+{remaining.length} más</button>}
                  </div>
                </div>
              })}
            </div>
          </div>
        )}
      </PremiumCard>

      {moreDay && <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setMoreDay(null)}>
        <div className="request-calendar__modal" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="request-calendar__close" onClick={() => setMoreDay(null)} aria-label="Cerrar"><X size={18} /></button>
          <p className="request-calendar__modal-eyebrow">Solicitudes restantes</p><h3>{formatDate(dateKey(moreDay.date))}</h3>
          <div className="request-calendar__modal-list">{moreDay.events.map((event) => <EventButton key={event.id} event={event} onClick={() => { setMoreDay(null); setDetail(event) }} />)}</div>
        </div>
      </ModalBackdrop>}

      {detail && <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
        <div className="request-calendar__modal" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="request-calendar__close" onClick={() => setDetail(null)} aria-label="Cerrar"><X size={18} /></button>
          <p className="request-calendar__modal-eyebrow">Solicitud aprobada</p><h3>{detail.empleado}</h3>
          <span className="request-calendar__type" style={{ background: calendarRequestTypes[detail.tipo].background, color: calendarRequestTypes[detail.tipo].color }}>{calendarRequestTypes[detail.tipo].label}</span>
          <dl className="request-calendar__detail-list">
            <div><dt>Fechas</dt><dd>{formatDate(detail.fecha_desde)}{detail.fecha_hasta !== detail.fecha_desde ? ` — ${formatDate(detail.fecha_hasta)}` : ''}</dd></div>
            {detail.destino && <div><dt><MapPin size={14} /> Destino</dt><dd>{detail.destino}</dd></div>}
            {detail.descripcion && <div><dt>Descripción</dt><dd>{detail.descripcion}</dd></div>}
            {detail.justificacion && <div><dt>Justificación</dt><dd>{detail.justificacion}</dd></div>}
            {detail.comentario_admin && <div><dt>Comentario administrativo</dt><dd>{detail.comentario_admin}</dd></div>}
          </dl>
        </div>
      </ModalBackdrop>}
    </div>
  )
}
