// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: solicitudes de empleados.
import { useEffect, type ReactNode } from 'react'
import { Calendar, FileText, User, WalletCards, X } from 'lucide-react'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import type { SolicitudDTO, SolicitudEstado, SolicitudTipo } from '../../services/requests'

const EXTRA_FIELD_LABELS: Record<string, string> = {
  nombreCompleto: 'Nombre completo',
  emailCorporativo: 'Email corporativo',
  sector: 'Sector',
  sucursal: 'Sucursal',
  puntoPartida: 'Punto de partida',
  cantidadPersonas: 'Cantidad de personas',
  acompanantes: 'Acompañantes',
  horarioSalida: 'Horario de salida',
  horarioRegreso: 'Horario de regreso',
  tipoViaje: 'Tipo de viaje',
  tipoVehiculo: 'Tipo de vehículo',
  kilometrajeEstimado: 'Kilometraje estimado',
  equipajeEstimado: 'Equipaje estimado',
  centroCostos: 'Centro de costos',
  conductor: 'Conductor',
  habitaciones: 'Habitaciones',
  tipoHabitacion: 'Tipo de habitación',
  huespedes: 'Huéspedes',
  distribucion: 'Distribución',
  personasPorHabitacion: 'Personas por habitación',
  requisitosEspeciales: 'Requisitos especiales',
  observaciones: 'Observaciones',
  vehiculo_id: 'Vehículo asignado',
  nombre: 'Nombre completo',
  email: 'Email corporativo',
  area: 'Área / Sector',
  motivo_solicitud: 'Motivo de la solicitud',
  destino: 'Destino',
  motivo_viaje: 'Motivo del viaje',
  personas_viajan: 'Personas que viajan',
  medio_transporte: 'Medio de transporte',
  fecha_inicio: 'Fecha inicio',
  fecha_finalizacion: 'Fecha finalización',
  monto_total: 'Monto total',
  destino_viaticos: 'Destino de los viáticos',
  monto_solicitar: 'Monto a solicitar',
  updated_at: 'Última actualización',
}

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

// Gestiona la operacion fmtMoney.
function fmtMoney(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

// Prepara el valor para su uso.
function formatExtraValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
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

interface RequestDetailModalProps {
  request: SolicitudDTO | null
  onClose: () => void
  typeLabels: Record<SolicitudTipo, string>
  statusConfig: Record<SolicitudEstado, { label: string; color: string; bg: string }>
}

// envia la solicitud correspondiente.
export function RequestDetailModal({ request, onClose, typeLabels, statusConfig }: RequestDetailModalProps) {
  useEffect(() => {
    if (!request) return
    // Gestiona la accion correspondiente.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request, onClose])

  if (!request) return null

  const status = statusConfig[request.estado]
  const extra = request.datos_extra ?? {}
  const isRendicion = request.tipo === 'rendicion_viaticos'
  const rendicionGastos = Array.isArray(extra.gastos) ? extra.gastos as Array<Record<string, unknown>> : []
  const viaticoOriginal = extra.viatico as Record<string, unknown> | undefined
  const extraEntries = Object.entries(extra).filter(([key, v]) => {
    if (isRendicion && ['gastos', 'viatico', 'rendicion_id', 'viatico_id', 'rendicion_estado'].includes(key)) return false
    return v != null && v !== ''
  })

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-detail-title"
      onClick={onClose}
    >
      <div
        className="profile-modal request-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="page-kicker">Solicitud completa</p>
            <h3 id="request-detail-title">{typeLabels[request.tipo]}</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div
          className="request-detail-status"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </div>

        <DetailSection title="Solicitante" icon={User}>
          <DetailItem label="Nombre" value={request.solicitante?.nombre ?? null} />
          <DetailItem label="Email" value={request.solicitante?.email ?? null} />
          <DetailItem label="Área" value={request.solicitante?.area ?? null} />
          <DetailItem label="Sucursal" value={request.solicitante?.sucursal ?? null} />
          <DetailItem label="Cargo" value={request.solicitante?.cargo ?? null} />
          <DetailItem label="Legajo" value={request.solicitante?.legajo ?? null} />
        </DetailSection>

        <DetailSection title="Detalle de la solicitud" icon={FileText}>
          <DetailItem label="Tipo" value={typeLabels[request.tipo]} />
          <DetailItem label="Destino" value={request.destino ?? null} />
          <DetailItem label="Fecha desde" value={fmtDate(request.fecha_desde)} />
          <DetailItem label="Fecha hasta" value={fmtDate(request.fecha_hasta)} />
          {isRendicion ? (
            <>
              <DetailItem label="Monto aprobado" value={fmtMoney(Number(extra.monto_aprobado ?? extra.monto_solicitado ?? 0))} />
              <DetailItem label="Total rendido" value={fmtMoney(Number(extra.total_gastos ?? request.monto_estimado ?? 0))} />
              <DetailItem label="Diferencia" value={fmtMoney(Number(extra.diferencia ?? 0))} />
            </>
          ) : (
            <DetailItem label="Monto estimado" value={fmtMoney(request.monto_estimado)} />
          )}
          <DetailItem label="Enviada el" value={fmtDateTime(request.created_at)} />
          {request.grupo_id && <DetailItem label="Grupo vinculado" value={request.grupo_id} />}
          
          {request.tipo === 'viaticos' && extraEntries.length > 0 && extraEntries.map(([key, value]) => {
            if (key === 'archivo_url' && typeof value === 'string' && value.trim() !== '') {
              return (
                <div key={key} className="request-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span>Archivo adjunto</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <a href={value} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ border: '1px solid var(--border)' }}>Ver archivo</a>
                    <a href={value} download className="btn btn-sm btn-ghost" style={{ border: '1px solid var(--border)' }}>Descargar archivo</a>
                  </div>
                </div>
              )
            }
            if (key === 'updated_at' && typeof value === 'string') {
              return <DetailItem key={key} label={EXTRA_FIELD_LABELS[key] || 'Actualizado'} value={fmtDateTime(value)} />
            }
            return (
              <DetailItem
                key={key}
                label={EXTRA_FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                value={formatExtraValue(value)}
              />
            )
          })}
        </DetailSection>

        {isRendicion && viaticoOriginal && (
          <DetailSection title="Viático original" icon={Calendar}>
            <DetailItem label="ID viático" value={String(extra.viatico_id ?? viaticoOriginal.id ?? '—')} />
            <DetailItem label="Destino" value={String(viaticoOriginal.destino ?? request.destino ?? '—')} />
            <DetailItem label="Fecha inicio" value={fmtDate(String(viaticoOriginal.fecha_inicio ?? request.fecha_desde ?? ''))} />
            <DetailItem label="Fecha finalización" value={fmtDate(String(viaticoOriginal.fecha_finalizacion ?? request.fecha_hasta ?? ''))} />
            <DetailItem label="Motivo del viaje" value={String(viaticoOriginal.motivo_viaje ?? '—')} />
            <DetailItem label="Monto solicitado" value={fmtMoney(Number(extra.monto_solicitado ?? viaticoOriginal.monto_total ?? 0))} />
          </DetailSection>
        )}

        {isRendicion && rendicionGastos.length > 0 && (
          <section className="request-detail-section">
            <div className="request-detail-section__head">
              <WalletCards size={16} aria-hidden="true" />
              <h4>Gastos y comprobantes</h4>
            </div>
            <div className="table-wrap">
              <table className="data-table data-table--stack">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Medio</th>
                    <th>Importe</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {rendicionGastos.map((gasto, index) => (
                    <tr key={String(gasto.id ?? index)}>
                      <td data-label="Fecha">{fmtDate(String(gasto.fecha ?? ''))}</td>
                      <td data-label="Concepto">{String(gasto.concepto ?? '—')}</td>
                      <td data-label="Medio">{String(gasto.medio_pago ?? '—')}</td>
                      <td data-label="Importe">{fmtMoney(Number(gasto.importe ?? 0))}</td>
                      <td data-label="Comprobante">
                        {gasto.comprobante_url ? (
                          <a href={String(gasto.comprobante_url)} target="_blank" rel="noreferrer">Ver</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(request.descripcion || request.justificacion) && (
          <section className="request-detail-section">
            <div className="request-detail-section__head">
              <FileText size={16} aria-hidden="true" />
              <h4>Descripción y motivo</h4>
            </div>
            {request.descripcion && (
              <p className="request-detail-text">{request.descripcion}</p>
            )}
            {request.justificacion && request.justificacion !== request.descripcion && (
              <p className="request-detail-text request-detail-text--muted">
                <strong>Justificación:</strong> {request.justificacion}
              </p>
            )}
          </section>
        )}

        {extraEntries.length > 0 && request.tipo !== 'viaticos' && request.tipo !== 'rendicion_viaticos' && (
          <DetailSection title="Especificaciones adicionales" icon={Calendar}>
            {extraEntries.map(([key, value]) => {
              if (key === 'archivo_url' && typeof value === 'string' && value.trim() !== '') {
                return (
                  <div key={key} className="request-detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span>Archivo adjunto</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <a href={value} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ border: '1px solid var(--border)' }}>Ver archivo</a>
                      <a href={value} download className="btn btn-sm btn-ghost" style={{ border: '1px solid var(--border)' }}>Descargar archivo</a>
                    </div>
                  </div>
                )
              }
              if (key === 'updated_at' && typeof value === 'string') {
                return <DetailItem key={key} label={EXTRA_FIELD_LABELS[key] || 'Actualizado'} value={fmtDateTime(value)} />
              }
              return (
                <DetailItem
                  key={key}
                  label={EXTRA_FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  value={formatExtraValue(value)}
                />
              )
            })}
          </DetailSection>
        )}

        {request.comentario_admin && (
          <DetailSection title="Resolución administrativa" icon={WalletCards}>
            <DetailItem label="Comentario" value={request.comentario_admin} />
          </DetailSection>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}
