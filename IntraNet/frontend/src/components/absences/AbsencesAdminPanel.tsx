import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  UserMinus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  MessageSquare,
  Filter,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router'
import { AbsenceDetailModal } from './AbsenceDetailModal'
import { PremiumCard } from '../ui/ProductUI'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ModalBackdrop } from '../ui/ModalBackdrop'
import { absencesService, type AusenciaDTO } from '../../services/absences'

export const absenceStatusConfig = {
  aprobada: { label: 'Aprobada', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
  pendiente: { label: 'Pendiente', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  rechazada: { label: 'Rechazada', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
} as const

// Gestiona la operacion fmtDate.
function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Gestiona la operacion fmtPeriod.
function fmtPeriod(absence: AusenciaDTO) {
  if (absence.hora_desde && absence.hora_hasta) {
    return `${fmtDate(absence.fecha_desde)} · ${absence.hora_desde} → ${absence.hora_hasta}`
  }
  return `${fmtDate(absence.fecha_desde)} → ${fmtDate(absence.fecha_hasta)}`
}

type FilterEstado = 'todos' | 'pendiente' | 'aprobada' | 'rechazada'

interface AbsencesAdminPanelProps {
  embedded?: boolean
  defaultEstado?: FilterEstado
  showLink?: boolean
  onPendingChange?: (count: number) => void
}

// Gestiona la operacion AbsencesAdminPanel.
export function AbsencesAdminPanel({
  embedded = false,
  defaultEstado = 'pendiente',
  showLink = false,
  onPendingChange,
}: AbsencesAdminPanelProps) {
  const [filterEstado, setFilterEstado] = useState<FilterEstado>(defaultEstado)
  const [filterArea, setFilterArea] = useState('')
  const [filterSucursal, setFilterSucursal] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEmpleado, setFilterEmpleado] = useState('')
  const [items, setItems] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [approveId, setApproveId] = useState<number | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [detailAbsence, setDetailAbsence] = useState<AusenciaDTO | null>(null)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, pendingRes] = await Promise.all([
        absencesService.getAll({
          estado: filterEstado === 'todos' ? undefined : filterEstado,
        }),
        onPendingChange
          ? absencesService.getAll('pendiente')
          : Promise.resolve(null),
      ])
      setItems(res.data || [])
      if (onPendingChange && pendingRes) {
        onPendingChange((pendingRes.data || []).length)
      }
    } catch {
      setError('No se pudieron cargar las ausencias.')
      setItems([])
      onPendingChange?.(0)
    } finally {
      setLoading(false)
    }
  }, [filterEstado, onPendingChange])

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

  const areas = useMemo(
    () => [...new Set(items.map((i) => i.solicitante?.area).filter(Boolean))].sort() as string[],
    [items],
  )
  const sucursales = useMemo(
    () => [...new Set(items.map((i) => i.solicitante?.sucursal).filter(Boolean))].sort() as string[],
    [items],
  )
  const tipos = useMemo(
    () => [...new Set(items.map((i) => i.tipo).filter(Boolean))].sort() as string[],
    [items],
  )

  const filtered = useMemo(() => {
    let rows = items
    if (filterArea) rows = rows.filter((i) => i.solicitante?.area === filterArea)
    if (filterSucursal) rows = rows.filter((i) => i.solicitante?.sucursal === filterSucursal)
    if (filterTipo) rows = rows.filter((i) => i.tipo === filterTipo)
    if (filterEmpleado.trim()) {
      const q = filterEmpleado.trim().toLowerCase()
      rows = rows.filter((i) => String(i.solicitante?.nombre || '').toLowerCase().includes(q))
    }
    return rows
  }, [items, filterArea, filterSucursal, filterTipo, filterEmpleado])

  const summary = useMemo(() => ({
    total: filtered.length,
    pendientes: filtered.filter((a) => a.estado === 'pendiente').length,
    aprobadas: filtered.filter((a) => a.estado === 'aprobada').length,
    rechazadas: filtered.filter((a) => a.estado === 'rechazada').length,
  }), [filtered])

  // Gestiona la accion correspondiente.
  const handleApprove = async () => {
    if (approveId == null) return
    setActionId(approveId)
    try {
      await absencesService.approve(approveId, approveComment)
      setApproveId(null)
      setApproveComment('')
      await load()
    } catch {
      setError('No se pudo aprobar la ausencia.')
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleReject = async () => {
    if (rejectId == null) return
    setActionId(rejectId)
    try {
      await absencesService.reject(rejectId, rejectComment)
      setRejectId(null)
      setRejectComment('')
      await load()
    } catch {
      setError('No se pudo rechazar la ausencia.')
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setDeleteBusy(true)
    setError('')
    try {
      await absencesService.remove(id)
      setDeleteId(null)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'cannot_delete_resolved') {
        setError('Solo se pueden eliminar solicitudes pendientes.')
      } else {
        setError('No se pudo eliminar la solicitud.')
      }
    } finally {
      setDeleteBusy(false)
    }
  }

  const cardAction = showLink ? (
    <Link to="/ausencias" className="card-inline-link">
      Ver página completa →
    </Link>
  ) : undefined

  return (
    <>
      {!embedded && (
        <div className="metric-grid">
          {[
            { label: 'Total', value: summary.total },
            { label: 'Pendientes', value: summary.pendientes, color: 'var(--warning)' },
            { label: 'Aprobadas', value: summary.aprobadas, color: 'var(--success)' },
            { label: 'Rechazadas', value: summary.rechazadas, color: 'var(--danger)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="metric-card">
              <p className="metric-label">{label}</p>
              <p className="metric-value" style={color ? { color } : undefined}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <PremiumCard
        title={embedded ? 'Solicitudes de ausencias y llegadas tardes' : 'Bandeja de ausencias y llegadas tardes'}
        eyebrow={embedded ? 'Gestión' : undefined}
        icon={embedded ? UserMinus : Filter}
        action={cardAction}
      >
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>
        )}

        <div className="chip-row chip-row--scroll" style={{ marginBottom: 14 }}>
          {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${filterEstado === s ? 'active' : ''}`}
              onClick={() => setFilterEstado(s)}
            >
              {s === 'todos' ? 'Todos' : absenceStatusConfig[s].label}
            </button>
          ))}
        </div>

        <div className="absence-filters">
          <div className="form-field">
            <label className="form-label">Sector</label>
            <select className="form-input" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
              <option value="">Todos</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Sucursal</label>
            <select className="form-input" value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)}>
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Tipo de solicitud</label>
            <select className="form-input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="">Todos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Empleado</label>
            <input
              type="search"
              className="form-input"
              value={filterEmpleado}
              onChange={(e) => setFilterEmpleado(e.target.value)}
              placeholder="Buscar por nombre…"
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 24, color: 'var(--muted-foreground)' }}>
            <Loader2 size={18} className="spin" />
            Cargando solicitudes…
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '24px 0', color: 'var(--muted-foreground)', textAlign: 'center' }}>
            No hay solicitudes con los filtros seleccionados.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table--stack">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((abs) => {
                  const cfg = absenceStatusConfig[abs.estado] || absenceStatusConfig.pendiente
                  const pending = abs.estado === 'pendiente'
                  const busy = actionId === abs.id
                  return (
                    <tr key={abs.id}>
                      <td data-label="Empleado">
                        <div style={{ fontWeight: 600 }}>{abs.solicitante?.nombre || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {[abs.solicitante?.area, abs.solicitante?.sucursal].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td data-label="Tipo">
                        <span className={abs.hora_desde ? 'absence-type-badge absence-type-badge--late' : 'absence-type-badge'}>{abs.tipo}</span>
                      </td>
                      <td data-label="Período">{fmtPeriod(abs)}</td>
                      <td data-label="Motivo" style={{ maxWidth: 200, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{abs.motivo || '—'}</td>
                      <td data-label="Estado">
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td data-label="Acciones" className="data-table__cell--actions">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setDetailAbsence(abs)}
                          >
                            <Eye size={14} />
                            Ver detalle
                          </button>
                          {pending ? (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary-fill"
                                disabled={busy}
                                onClick={() => { setApproveId(abs.id); setApproveComment('') }}
                              >
                                {busy ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                disabled={busy}
                                onClick={() => { setRejectId(abs.id); setRejectComment('') }}
                              >
                                <XCircle size={14} />
                                Rechazar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                style={{ color: 'var(--danger)' }}
                                disabled={deleteBusy}
                                onClick={() => setDeleteId(abs.id)}
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Resuelta</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>

      <AbsenceDetailModal
        absence={detailAbsence}
        onClose={() => setDetailAbsence(null)}
        statusConfig={absenceStatusConfig}
      />

      {approveId != null && (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          onClick={() => setApproveId(null)}
        >
          <div className="card" style={{ width: 'min(440px, 100%)', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Aprobar ausencia</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Podés agregar un comentario para el empleado. Se enviará una notificación automática.
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
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setApproveId(null)}>Cancelar</button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleApprove} disabled={actionId != null}>
                {actionId != null ? <Loader2 size={16} className="spin" /> : 'Confirmar aprobación'}
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
          <div className="card" style={{ width: 'min(440px, 100%)', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Rechazar ausencia</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Opcionalmente indicá el motivo para que el empleado lo vea en Mis solicitudes.
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
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setRejectId(null)}>Cancelar</button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleReject} disabled={actionId != null}>
                {actionId != null ? <Loader2 size={16} className="spin" /> : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar solicitud de ausencia?"
        description="Se eliminará permanentemente esta solicitud pendiente de la base de datos."
        confirmLabel="Eliminar"
        loading={deleteBusy}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </>
  )
}
