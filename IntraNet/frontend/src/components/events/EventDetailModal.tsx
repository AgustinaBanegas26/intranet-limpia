// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: eventos institucionales.
import { useEffect } from 'react'
import { CalendarDays, Clock, FileText, Image as ImageIcon, MapPin, Users, X } from 'lucide-react'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import type { EventoDTO } from '../../services/events'

// Gestiona la operacion fmtDate.
function fmtDate(dateStr: string) {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Gestiona la operacion fmtTime.
function fmtTime(dateStr: string) {
  if (!dateStr.includes('T')) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  event: EventoDTO | null
  onClose: () => void
}

// Gestiona la operacion EventDetailModal.
export function EventDetailModal({ event, onClose }: Props) {
  useEffect(() => {
    if (!event) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, onClose])

  if (!event) return null

  const time = fmtTime(event.fecha_inicio)
  const pdfName = event.pdf_url?.startsWith('data:')
    ? 'documento.pdf'
    : event.pdf_url?.split('/').pop() || 'documento.pdf'

  return (
    <ModalBackdrop role="dialog" aria-modal="true" onClick={onClose}>
      <div className="profile-modal event-detail-modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="page-kicker">Detalle del evento</p>
            <h3>{event.titulo}</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {event.imagen_url && (
          <div className="event-detail-image-wrap">
            <img src={event.imagen_url} alt={event.titulo} className="event-detail-image" />
          </div>
        )}

        {event.descripcion && (
          <p className="event-detail-description">{event.descripcion}</p>
        )}

        <div className="event-detail-meta">
          <span><CalendarDays size={14} /> {fmtDate(event.fecha_inicio)}{time ? ` · ${time}hs` : ''}</span>
          {event.lugar && <span><MapPin size={14} /> {event.lugar}</span>}
          <span><Users size={14} /> {event.asistentes ?? 0} confirmados</span>
          {event.fecha_fin && (
            <span><Clock size={14} /> Fin: {fmtDate(event.fecha_fin)}</span>
          )}
        </div>

        {event.pdf_url && (
          <div className="event-detail-attachment">
            <div className="event-detail-attachment__head">
              <FileText size={16} />
              <span>Archivo adjunto</span>
            </div>
            <a
              href={event.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost event-detail-pdf-link"
              download={event.pdf_url.startsWith('data:') ? pdfName : undefined}
            >
              <FileText size={14} />
              Ver / descargar PDF
            </a>
          </div>
        )}

        {!event.imagen_url && !event.pdf_url && (
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ImageIcon size={14} />
            Sin archivos adjuntos
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </ModalBackdrop>
  )
}
