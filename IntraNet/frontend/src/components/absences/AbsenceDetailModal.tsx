import { useEffect, type ReactNode } from 'react'
import { Calendar, FileText, User, X, Paperclip } from 'lucide-react'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import type { AusenciaDTO } from '../../services/absences'

type AusenciaEstado = AusenciaDTO['estado']

// Gestiona la operacion fmtDate.
function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Gestiona la operacion fmtDateTime.
function fmtDateTime(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Gestiona la operacion extractAdminComment.
function extractAdminComment(motivo?: string | null): string | null {
  if (!motivo) return null
  const matches = [...motivo.matchAll(/\[Admin\]:\s*([^\n]+)/g)]
  return matches.length ? matches[matches.length - 1][1].trim() : null
}

// Gestiona la operacion stripAdminComments.
function stripAdminComments(motivo?: string | null): string {
  if (!motivo) return ''
  return motivo.replace(/\n\n\[Admin\]:[^\n]*/g, '').trim()
}

// Gestiona la operacion DetailItem.
function DetailItem({ label, value }: { label: string; value?: string | null }) {
  const filled = value != null && value.trim() !== '' && value !== '—'
  return (
    <div className="request-detail-item">
      <span>{label}</span>
      <strong>{filled ? value : 'Sin informar'}</strong>
    </div>
  )
}

// Gestiona la operacion DetailSection.
function DetailSection({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: ReactNode }) {
  return (
    <section className="request-detail-section">
      <div className="request-detail-section__head">
        <Icon size={16} aria-hidden="true" />
        <h4>{title}</h4>
      </div>
      <div className="request-detail-grid">{children}</div>
    </section>
  )
}

interface AbsenceDetailModalProps {
  absence: AusenciaDTO | null
  onClose: () => void
  statusConfig: Record<AusenciaEstado, { label: string; color: string; bg: string }>
  onApprove?: () => void
  onReject?: () => void
  actionBusy?: boolean
}

// Gestiona la operacion AbsenceDetailModal.
export function AbsenceDetailModal({ absence, onClose, statusConfig, onApprove, onReject, actionBusy }: AbsenceDetailModalProps) {
  useEffect(() => {
    if (!absence) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [absence, onClose])

  if (!absence) return null

  const status = statusConfig[absence.estado]
  const adminComment = extractAdminComment(absence.motivo)
  const motivoLimpio = stripAdminComments(absence.motivo)

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby="absence-detail-title"
      onClick={onClose}
    >
      <div className="profile-modal request-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="page-kicker">Solicitud completa</p>
            <h3 id="absence-detail-title">{absence.tipo}</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="request-detail-status" style={{ background: status.bg, color: status.color }}>
          {status.label}
        </div>

        <DetailSection title="Empleado" icon={User}>
          <DetailItem label="Nombre" value={absence.solicitante?.nombre ?? null} />
          <DetailItem label="Email" value={absence.solicitante?.email ?? null} />
          <DetailItem label="Área" value={absence.solicitante?.area ?? null} />
          <DetailItem label="Sucursal" value={absence.solicitante?.sucursal ?? null} />
          <DetailItem label="Cargo" value={absence.solicitante?.cargo ?? null} />
          <DetailItem label="Legajo" value={absence.solicitante?.legajo ?? null} />
        </DetailSection>

        <DetailSection title="Detalle de la solicitud" icon={Calendar}>
          <DetailItem label="Tipo" value={absence.tipo} />
          <DetailItem label="Fecha desde" value={fmtDate(absence.fecha_desde)} />
          <DetailItem label="Fecha hasta" value={fmtDate(absence.fecha_hasta)} />
          {absence.hora_desde && <DetailItem label="Desde qué hora" value={absence.hora_desde} />}
          {absence.hora_hasta && <DetailItem label="Hasta qué hora" value={absence.hora_hasta} />}
          {!absence.hora_desde && <DetailItem label="Días solicitados" value={absence.dias != null ? String(absence.dias) : null} />}
          <DetailItem label="Enviada el" value={fmtDateTime(absence.created_at)} />
          <DetailItem label="ID" value={String(absence.id)} />
        </DetailSection>

        {motivoLimpio && (
          <section className="request-detail-section">
            <div className="request-detail-section__head">
              <FileText size={16} aria-hidden="true" />
              <h4>Motivo</h4>
            </div>
            <p className="request-detail-text">{motivoLimpio}</p>
          </section>
        )}

        {adminComment && (
          <section className="request-detail-section">
            <div className="request-detail-section__head">
              <FileText size={16} aria-hidden="true" />
              <h4>Resolución administrativa</h4>
            </div>
            <p className="request-detail-text">{adminComment}</p>
          </section>
        )}

        {absence.archivo_url && (
          <section className="request-detail-section">
            <div className="request-detail-section__head">
              <Paperclip size={16} aria-hidden="true" />
              <h4>Archivo adjunto</h4>
            </div>
            <a
              href={absence.archivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost"
              style={{ borderRadius: 10 }}
            >
              {absence.archivo_nombre || 'Ver archivo adjunto'}
            </a>
          </section>
        )}

        <div className="modal-actions">
          {onApprove && (
            <button type="button" className="btn btn-md btn-primary-fill" disabled={actionBusy} onClick={onApprove}>
              Aprobar
            </button>
          )}
          {onReject && (
            <button type="button" className="btn btn-md btn-ghost" disabled={actionBusy} onClick={onReject}>
              Rechazar
            </button>
          )}
          <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}
