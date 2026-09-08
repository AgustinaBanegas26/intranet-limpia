import { CheckCircle, Clock, Edit3, Loader2 } from 'lucide-react'
import type { TechnicalSupplyRequestDTO, TechnicalSupplyStatus } from '../../services/technicalSupplies'

const statusConfig: Record<TechnicalSupplyStatus, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  aprobada: { label: 'Aprobada', color: 'var(--success)', bg: 'var(--success-bg)' },
  rechazada: { label: 'Rechazada', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

function money(value?: number | null) {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TechnicalSupplyStatusBadge({ status }: { status: TechnicalSupplyStatus }) {
  const cfg = statusConfig[status] || statusConfig.pendiente
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
      {cfg.label}
    </span>
  )
}

export function TechnicalSupplyRequestCard({
  request,
  busy,
  admin = false,
  onApprove,
  onEdit,
}: {
  request: TechnicalSupplyRequestDTO
  busy?: boolean
  admin?: boolean
  onApprove?: () => void
  onEdit?: () => void
}) {
  const pending = request.status === 'pendiente'

  if (admin) {
    return (
      <article style={{ padding: 18, borderRadius: 16, background: 'var(--muted)', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p className="page-kicker" style={{ marginBottom: 4 }}>Insumo tecnico</p>
            <strong>{request.solicitante?.nombre || 'Empleado'}</strong>
          </div>
          <TechnicalSupplyStatusBadge status={request.status} />
        </div>

        <div className="grid-2">
          <div>
            <small className="form-label">Empleado / ID cliente</small>
            <div>{request.empleado_id}</div>
          </div>
          <div>
            <small className="form-label">Gmail</small>
            <div style={{ overflowWrap: 'anywhere' }}>{request.email || request.solicitante?.email || '-'}</div>
          </div>
          <div className="request-wide">
            <small className="form-label">Comentario</small>
            <div style={{ whiteSpace: 'pre-wrap' }}>{request.comment}</div>
          </div>
          <div>
            <small className="form-label">Monto</small>
            <div style={{ fontWeight: 800 }}>{money(request.amount)}</div>
          </div>
          <div>
            <small className="form-label">Aprobado</small>
            <div>{request.status === 'aprobada' ? 'Si' : 'No'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)', fontSize: '0.82rem' }}>
            <Clock size={14} />
            {formatDate(request.created_at)}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={onEdit}>
              <Edit3 size={14} />
              Editar
            </button>
            {pending && (
              <button type="button" className="btn btn-sm btn-primary-fill" disabled={busy} onClick={onApprove}>
                {busy ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                Aprobar
              </button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article style={{ padding: 14, borderRadius: 16, background: 'var(--muted)', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <strong>{money(request.amount)}</strong>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 3 }}>
            {formatDate(request.created_at)}
          </div>
        </div>
        <TechnicalSupplyStatusBadge status={request.status} />
      </div>
      <p style={{ margin: 0, color: 'var(--muted-foreground)', whiteSpace: 'pre-wrap' }}>{request.comment}</p>
    </article>
  )
}
