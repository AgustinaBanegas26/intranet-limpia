import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import {
  WalletCards,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  MessageSquare,
  Eye,
  Trash2,
} from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModalBackdrop } from '../../components/ui/ModalBackdrop'
import { RequestDetailModal } from '../../components/requests/RequestDetailModal'
import {
  requestsService,
  type SolicitudDTO,
  type SolicitudEstado,
  type SolicitudTipo,
} from '../../services/requests'

type FilterEstado = SolicitudEstado | 'todos'

const typeLabels: Record<SolicitudTipo, string> = {
  viaticos: 'Viáticos',
  rendicion_viaticos: 'Rendición de Viáticos',
  hotel: 'Hotel',
  auto: 'Auto',
  anticipo: 'Anticipo',
  adelanto: 'Adelanto',
}

const statusConfig: Record<
  SolicitudEstado,
  { label: string; icon: typeof CheckCircle; color: string; bg: string }
> = {
  aprobada: { label: 'Aprobada', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
  pendiente: { label: 'Pendiente', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  en_revision: { label: 'En revisión', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  rechazada: { label: 'Rechazada', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
  Aprobado: { label: 'Aprobado', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
  Pendiente: { label: 'Pendiente', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  Rechazado: { label: 'Rechazado', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

// Gestiona la operacion fmtDate.
function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Gestiona la operacion fmtMoney.
function fmtMoney(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

interface RequestsManagementPageProps {
  showOnlyType?: SolicitudTipo
  pageTitle?: string
  pageDescription?: string
}

// envia la solicitud correspondiente.
export function RequestsManagementPage({ showOnlyType, pageTitle, pageDescription }: RequestsManagementPageProps) {
  const [filter, setFilter] = useState<FilterEstado>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc'>('created_desc')
  const [page, setPage] = useState(1)
  const [requests, setRequests] = useState<SolicitudDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [detailRequest, setDetailRequest] = useState<SolicitudDTO | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await requestsService.getAll()
      setRequests(res.data || [])
    } catch {
      setError('No se pudieron cargar las solicitudes.')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filter, searchTerm, areaFilter, sortBy, showOnlyType])

  const baseRequests = showOnlyType ? requests.filter((r) => r.tipo === showOnlyType) : requests
  const areaOptions = Array.from(new Set(baseRequests.map((r) => r.solicitante?.area).filter(Boolean) as string[]))
  const searchLower = searchTerm.trim().toLowerCase()

  const filtered = baseRequests
    .filter((r) => {
      if (filter === 'todos') return true
      if (filter === 'pendiente') return r.estado === 'pendiente' || r.estado === 'Pendiente'
      if (filter === 'aprobada') return r.estado === 'aprobada' || r.estado === 'Aprobado'
      if (filter === 'rechazada') return r.estado === 'rechazada' || r.estado === 'Rechazado'
      return r.estado === filter
    })
    .filter((r) => (areaFilter ? (r.solicitante?.area || '').toLowerCase() === areaFilter.toLowerCase() : true))
    .filter((r) => {
      if (!searchLower) return true
      const values = [
        r.solicitante?.nombre,
        r.solicitante?.area,
        r.solicitante?.sucursal,
        r.destino,
        r.descripcion,
        r.justificacion,
        r.comentario_admin,
      ]
      return values.some((value) => value?.toLowerCase().includes(searchLower))
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at ?? '').getTime() || 0
      const bTime = new Date(b.created_at ?? '').getTime() || 0
      return sortBy === 'created_desc' ? bTime - aTime : aTime - bTime
    })

  const pageSize = 12
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedRequests = filtered.slice((page - 1) * pageSize, page * pageSize)

  const summary = {
    total: baseRequests.length,
    pendientes: baseRequests.filter((r) => r.estado === 'pendiente' || r.estado === 'en_revision' || r.estado === 'Pendiente').length,
    aprobadas: baseRequests.filter((r) => r.estado === 'aprobada' || r.estado === 'Aprobado').length,
    rechazadas: baseRequests.filter((r) => r.estado === 'rechazada' || r.estado === 'Rechazado').length,
  }

  // Gestiona la accion correspondiente.
  const handleApprove = async () => {
    if (approveId == null) return
    setActionId(approveId)
    try {
      await requestsService.approve(approveId, approveComment)
      setApproveId(null)
      setApproveComment('')
      await load()
    } catch {
      setError('No se pudo aprobar la solicitud.')
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleReject = async () => {
    if (rejectId == null) return
    setActionId(rejectId)
    try {
      await requestsService.reject(rejectId, rejectComment)
      setRejectId(null)
      setRejectComment('')
      await load()
    } catch {
      setError('No se pudo rechazar la solicitud.')
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async () => {
    if (deleteId == null) return
    setActionId(deleteId)
    try {
      await requestsService.remove(deleteId)
      setDeleteId(null)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'cannot_delete_resolved' ? 'Solo se pueden eliminar solicitudes pendientes.' : 'No se pudo eliminar la solicitud.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="page-root admin-page">
      <PageHero
        eyebrow="Administración"
        title={pageTitle ?? (showOnlyType ? `Solicitudes de ${typeLabels[showOnlyType]}` : 'Solicitudes')}
        description={pageDescription ?? 'Revisá y resolvé las solicitudes de viáticos, hotel, auto y anticipos de los empleados.'}
      />

      <div className="request-controls" style={{ marginBottom: 14, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="form-field" style={{ minWidth: 0 }}>
          <label className="form-label">Buscar</label>
          <input
            type="search"
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por solicitante, destino, descripción…"
          />
        </div>
        <div className="form-field" style={{ minWidth: 0 }}>
          <label className="form-label">Sector</label>
          <select className="form-input" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
            <option value="">Todos</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="form-field" style={{ minWidth: 0 }}>
          <label className="form-label">Ordenar por</label>
          <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'created_desc' | 'created_asc')}>
            <option value="created_desc">Más recientes</option>
            <option value="created_asc">Más antiguas</option>
          </select>
        </div>
      </div>

      <motion.div
        className="metric-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {[
          { label: 'Total', value: summary.total, icon: WalletCards },
          { label: 'Pendientes', value: summary.pendientes, icon: Clock, color: 'var(--warning)' },
          { label: 'Aprobadas', value: summary.aprobadas, icon: CheckCircle, color: 'var(--success)' },
          { label: 'Rechazadas', value: summary.rechazadas, icon: XCircle, color: 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="metric-card">
            <p className="metric-label">{label}</p>
            <p className="metric-value" style={color ? { color } : undefined}>{value}</p>
          </div>
        ))}
      </motion.div>

      <PremiumCard title="Bandeja de solicitudes" icon={Filter}>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>
        )}

        <div className="chip-row chip-row--scroll" style={{ marginBottom: 14 }}>
          {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'todos' ? 'Todos' : statusConfig[s].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 24, color: 'var(--muted-foreground)' }}>
            <Loader2 size={18} className="spin" />
            Cargando solicitudes…
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '24px 0', color: 'var(--muted-foreground)', textAlign: 'center' }}>
            No hay solicitudes{filter !== 'todos' ? ` en estado "${statusConfig[filter as SolicitudEstado]?.label}"` : ''}.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12, color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              <span>{`Mostrando ${pagedRequests.length} de ${filtered.length} resultados`}</span>
              <span>{`Página ${page} de ${pageCount}`}</span>
            </div>
            <div className="table-wrap">
              <table className="data-table data-table--stack">
              <thead>
                <tr>
                  <th>Solicitante</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.map((req) => {
                  const cfg = statusConfig[req.estado]
                  const Icon = cfg?.icon || Clock
                  const pending = req.estado === 'pendiente' || req.estado === 'en_revision' || req.estado === 'Pendiente'
                  const busy = actionId === req.id

                  return (
                    <tr key={req.id}>
                      <td data-label="Solicitante">
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {req.solicitante?.nombre || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {[req.solicitante?.area, req.solicitante?.sucursal].filter(Boolean).join(' · ') || '—'}
                        </div>
                        {req.solicitante?.id && (
                          <Link
                            to="/empleados"
                            style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}
                          >
                            Ver empleados
                          </Link>
                        )}
                      </td>
                      <td data-label="Tipo">
                        <span style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          {typeLabels[req.tipo]}
                        </span>
                      </td>
                      <td data-label="Descripción" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.descripcion || req.destino || '—'}
                        </span>
                        {req.grupo_id && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Grupo vinculado</span>
                        )}
                      </td>
                      <td data-label="Monto" style={{ fontWeight: 700 }}>{fmtMoney(req.monto_estimado)}</td>
                      <td data-label="Fechas" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                        {fmtDate(req.fecha_desde)}
                        {req.fecha_hasta ? ` → ${fmtDate(req.fecha_hasta)}` : ''}
                      </td>
                      <td data-label="Estado">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg?.bg || 'var(--warning-bg)', color: cfg?.color || 'var(--warning)', padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          <Icon size={11} />
                          {cfg?.label || req.estado}
                        </span>
                      </td>
                      <td data-label="Acciones" className="data-table__cell--actions">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setDetailRequest(req)}
                          >
                            <Eye size={14} />
                            Ver solicitud completa
                          </button>
                          {pending ? (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary-fill"
                                disabled={busy}
                                onClick={() => {
                                  setApproveId(req.id)
                                  setApproveComment('')
                                }}
                              >
                                {busy ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                disabled={busy}
                                onClick={() => {
                                  setRejectId(req.id)
                                  setRejectComment('')
                                }}
                              >
                                <XCircle size={14} />
                                {req.tipo === 'rendicion_viaticos' ? 'Devolver' : 'Rechazar'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                              {req.comentario_admin || 'Resuelta'}
                            </span>
                          )}
                          {req.tipo !== 'rendicion_viaticos' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--danger)' }}
                            disabled={busy}
                            onClick={() => setDeleteId(req.id)}
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
              {filtered.length} solicitud{filtered.length === 1 ? '' : 'es'} filtrada{filtered.length === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
        )}
      </PremiumCard>

      <RequestDetailModal
        request={detailRequest}
        onClose={() => setDetailRequest(null)}
        typeLabels={typeLabels}
        statusConfig={statusConfig}
      />

      {approveId != null && (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          onClick={() => setApproveId(null)}
        >
          <div
            className="card"
            style={{ width: 'min(440px, 100%)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Aprobar solicitud</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Podés agregar un comentario para el empleado. Quedará guardado en el historial y se enviará una notificación.
            </p>
            <textarea
              className="form-input"
              rows={3}
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="Comentario de aprobación (opcional)…"
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setApproveId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleApprove} disabled={actionId != null}>
                {actionId != null ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                Confirmar aprobación
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {rejectId != null && (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          onClick={() => setRejectId(null)}
        >
          <div
            className="card"
            style={{ width: 'min(440px, 100%)', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Rechazar solicitud</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Opcionalmente indicá el motivo para que el empleado lo vea en su historial.
            </p>
            <textarea
              className="form-input"
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Motivo del rechazo…"
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setRejectId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleReject} disabled={actionId != null}>
                {actionId != null ? <Loader2 size={16} className="spin" /> : <XCircle size={16} />}
                Confirmar rechazo
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar solicitud?"
        description="Se eliminará permanentemente de la base de datos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={actionId != null}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
