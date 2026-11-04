import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserMinus, Clock, CheckCircle, XCircle, Loader2, Eye, Trash2, Pencil } from 'lucide-react'
import { MetricCard, PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModalBackdrop } from '../../components/ui/ModalBackdrop'
import { AbsenceDetailModal } from '../../components/absences/AbsenceDetailModal'
import { AbsenceRequestForm } from '../../components/absences/AbsenceRequestForm'
import { LateArrivalForm } from '../../components/absences/LateArrivalForm'
import { useAuth } from '../../context/AuthContext'
import { absencesService, type AusenciaDTO } from '../../services/absences'

const statusConfig = {
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

// Gestiona la operacion fmtSchedule.
function fmtSchedule(absence: AusenciaDTO) {
  if (absence.hora_desde && absence.hora_hasta) return `${fmtDate(absence.fecha_desde)} · ${absence.hora_desde} → ${absence.hora_hasta}`
  return `${fmtDate(absence.fecha_desde)} — ${fmtDate(absence.fecha_hasta)} · ${absence.dias ?? '—'} días`
}

// Gestiona la operacion absenceDeleteErrorMessage.
function absenceDeleteErrorMessage(code: string) {
  if (code === 'cannot_delete_resolved') return 'Solo se pueden eliminar solicitudes pendientes.'
  if (code === 'forbidden') return 'No tenés permisos para eliminar esta solicitud.'
  return 'No se pudo eliminar la solicitud.'
}

// Gestiona la operacion AbsencesEmployeeView.
function AbsencesEmployeeView() {
  const [activeTab, setActiveTab] = useState<'ausencias' | 'llegadas-tarde'>('ausencias')
  const [items, setItems] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ tipo: 'Enfermedad', fecha_desde: '', fecha_hasta: '', motivo: '' })
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await absencesService.getAll()
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

  const pendientes = items.filter((a) => a.estado === 'pendiente').length

  // Gestiona la accion correspondiente.
  const handleEdit = (abs: AusenciaDTO) => {
    if (abs.estado !== 'pendiente') return
    setEditId(Number(abs.id))
    setEditForm({
      tipo: abs.tipo || 'Enfermedad',
      fecha_desde: String(abs.fecha_desde).slice(0, 10),
      fecha_hasta: String(abs.fecha_hasta || abs.fecha_desde).slice(0, 10),
      motivo: abs.motivo || '',
    })
    setEditError('')
  }

  // Gestiona la accion correspondiente.
  const handleSaveEdit = async () => {
    if (editId == null) return
    if (!editForm.fecha_desde || !editForm.fecha_hasta || !editForm.motivo.trim()) {
      setEditError('Completá las fechas y el motivo.')
      return
    }
    if (editForm.fecha_hasta < editForm.fecha_desde) {
      setEditError('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    setEditBusy(true)
    setEditError('')
    try {
      await absencesService.update(editId, {
        tipo: editForm.tipo,
        fecha_desde: editForm.fecha_desde,
        fecha_hasta: editForm.fecha_hasta,
        motivo: editForm.motivo.trim(),
      })
      setEditId(null)
      await load()
    } catch {
      setEditError('No se pudo actualizar la solicitud.')
    } finally {
      setEditBusy(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await absencesService.remove(id)
      setDeleteId(null)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setDeleteError(absenceDeleteErrorMessage(code))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Recursos Humanos"
        title="Ausencias y llegadas tardes"
        description="Solicitá y consultá tus licencias, ausencias y llegadas tardes (no incluye vacaciones)."
      />

      <div className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Mis solicitudes</p>
          <p className="metric-value">{items.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pendientes</p>
          <p className="metric-value" style={{ color: 'var(--warning)' }}>{pendientes}</p>
        </div>
      </div>

      <div className="chip-row chip-row--scroll" style={{ marginBottom: 18 }} role="tablist" aria-label="Tipo de solicitud">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ausencias'}
          className={`chip ${activeTab === 'ausencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('ausencias')}
        >
          Ausencias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'llegadas-tarde'}
          className={`chip ${activeTab === 'llegadas-tarde' ? 'active' : ''}`}
          onClick={() => setActiveTab('llegadas-tarde')}
        >
          Llegadas tarde
        </button>
      </div>

      <div role="tabpanel" hidden={activeTab !== 'ausencias'}>
        <PremiumCard title="Solicitar ausencia" icon={UserMinus}>
          <AbsenceRequestForm onSuccess={load} />
        </PremiumCard>
      </div>

      <div role="tabpanel" hidden={activeTab !== 'llegadas-tarde'}>
        <PremiumCard title="Informar llegada tarde" icon={Clock}>
          <LateArrivalForm onSuccess={load} />
        </PremiumCard>
      </div>

      <PremiumCard title="Mis ausencias" icon={UserMinus}>
        {(deleteError || editError) && (
          <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{deleteError || editError}</p>
        )}
        {loading ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Cargando…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Sin solicitudes registradas.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((abs) => {
              const cfg = statusConfig[abs.estado] || statusConfig.pendiente
              const Icon = cfg.icon
              const pending = abs.estado === 'pendiente'
              const editing = editId === abs.id
              return (
                <div key={abs.id} style={{ padding: 14, borderRadius: 14, background: 'var(--muted)' }}>
                  {editing ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div className="form-field">
                        <label className="form-label">Tipo</label>
                        <select className="form-input" value={editForm.tipo} onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}>
                          {['Enfermedad', 'Trámite personal', 'Licencia médica', 'Asuntos personales', 'Otro'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid-2">
                        <div className="form-field">
                          <label className="form-label">Desde</label>
                          <input type="date" className="form-input" value={editForm.fecha_desde} onChange={(e) => setEditForm((p) => ({ ...p, fecha_desde: e.target.value }))} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Hasta</label>
                          <input type="date" className="form-input" value={editForm.fecha_hasta} min={editForm.fecha_desde || undefined} onChange={(e) => setEditForm((p) => ({ ...p, fecha_hasta: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Motivo</label>
                        <textarea className="form-input" rows={2} value={editForm.motivo} onChange={(e) => setEditForm((p) => ({ ...p, motivo: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
                        <button type="button" className="btn btn-sm btn-primary-fill" disabled={editBusy} onClick={handleSaveEdit}>
                          {editBusy ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>{abs.tipo}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {fmtSchedule(abs)}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>{abs.motivo}</p>
                      {pending && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => handleEdit(abs)}>
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => setDeleteId(abs.id)}
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, height: 'fit-content' }}>
                      <Icon size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {cfg.label}
                    </span>
                  </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PremiumCard>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar solicitud de ausencia?"
        description="Se eliminará permanentemente esta solicitud pendiente de la base de datos."
        confirmLabel="Eliminar"
        loading={deleteBusy}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </div>
  )
}

// Gestiona la operacion AbsencesAdminView.
function AbsencesAdminView() {
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente')
  const [items, setItems] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [approveId, setApproveId] = useState<number | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [detailAbsence, setDetailAbsence] = useState<AusenciaDTO | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await absencesService.getAll(filter === 'todos' ? undefined : filter)
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  // Gestiona la accion correspondiente.
  const handleApprove = async () => {
    if (approveId == null) return
    setActionId(approveId)
    try {
      await absencesService.approve(approveId, approveComment)
      setApproveId(null)
      setApproveComment('')
      setDetailAbsence(null)
      await load()
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
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await absencesService.remove(id)
      setDeleteId(null)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setDeleteError(absenceDeleteErrorMessage(code))
    } finally {
      setDeleteBusy(false)
    }
  }

  const pendientes = items.filter((a) => a.estado === 'pendiente').length
  const aprobadas = items.filter((a) => a.estado === 'aprobada').length
  const rechazadas = items.filter((a) => a.estado === 'rechazada').length

  return (
    <div className="page-root admin-page">
      <PageHero
        eyebrow="Administración"
        title="Gestión de ausencias y llegadas tardes"
        description="Revisá, aprobá o rechazá las solicitudes del equipo. Incluye ausencias, llegadas tardes, estado, fechas, empleado, sector y observaciones."
      />

      <motion.div className="metric-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <MetricCard label="Total" value={loading ? '…' : items.length} detail="Solicitudes" icon={UserMinus} />
        <MetricCard label="Pendientes" value={loading ? '…' : pendientes} detail="Por resolver" icon={Clock} />
        <MetricCard label="Aprobadas" value={loading ? '…' : aprobadas} detail="Resueltas" icon={CheckCircle} />
        <MetricCard label="Rechazadas" value={loading ? '…' : rechazadas} detail="Resueltas" icon={XCircle} />
      </motion.div>

      <PremiumCard title="Solicitudes recibidas" icon={UserMinus}>
        {deleteError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 12 }}>{deleteError}</p>}
        <div className="chip-row chip-row--scroll" style={{ marginBottom: 14 }}>
          {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((s) => (
            <button key={s} type="button" className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'todos' ? 'Todos' : statusConfig[s].label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Cargando…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>No hay solicitudes en este filtro.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table--stack">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Sector</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Observaciones</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((abs) => {
                  const cfg = statusConfig[abs.estado] || statusConfig.pendiente
                  const pending = abs.estado === 'pendiente'
                  return (
                    <tr key={abs.id}>
                      <td data-label="Empleado">
                        <div style={{ fontWeight: 600 }}>{abs.solicitante?.nombre || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {abs.solicitante?.sucursal || '—'}
                        </div>
                      </td>
                      <td data-label="Sector">{abs.solicitante?.area || '—'}</td>
                      <td data-label="Tipo">
                        <span className={abs.hora_desde ? 'absence-type-badge absence-type-badge--late' : 'absence-type-badge'}>{abs.tipo}</span>
                      </td>
                      <td data-label="Período">{fmtSchedule(abs)}</td>
                      <td data-label="Observaciones" style={{ maxWidth: 200, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{abs.motivo}</td>
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
                              <button type="button" className="btn btn-sm btn-primary-fill" disabled={actionId === abs.id} onClick={() => { setApproveId(abs.id); setApproveComment('') }}>
                                Aprobar
                              </button>
                              <button type="button" className="btn btn-sm btn-ghost" disabled={actionId === abs.id} onClick={() => { setRejectId(abs.id); setRejectComment('') }}>
                                Rechazar
                              </button>
                              <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} disabled={deleteBusy} onClick={() => setDeleteId(abs.id)}>
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
        statusConfig={statusConfig}
        onApprove={detailAbsence?.estado === 'pendiente' ? () => { setApproveId(detailAbsence.id); setApproveComment('') } : undefined}
        onReject={detailAbsence?.estado === 'pendiente' ? () => { setRejectId(detailAbsence.id); setRejectComment(''); setDetailAbsence(null) } : undefined}
        actionBusy={actionId === detailAbsence?.id}
      />

      {approveId != null && (
        <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setApproveId(null)}>
          <div className="card" style={{ width: 'min(440px, 100%)', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Aprobar solicitud</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Podés dejar un comentario para la persona. Se guardará junto con la resolución.
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
              <button type="button" className="btn btn-md btn-ghost" disabled={actionId != null} onClick={() => setApproveId(null)}>Cancelar</button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleApprove} disabled={actionId != null}>
                {actionId != null ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                Confirmar aprobación
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {rejectId != null && (
        <ModalBackdrop role="dialog" aria-modal="true" onClick={() => setRejectId(null)}>
          <div className="card" style={{ width: 'min(440px, 100%)', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="card-title">Rechazar ausencia</h3>
            <textarea className="form-input" rows={3} value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Motivo (opcional)" style={{ margin: '12px 0 16px' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-md btn-ghost" onClick={() => setRejectId(null)}>Cancelar</button>
              <button type="button" className="btn btn-md btn-primary-fill" onClick={handleReject}>Confirmar</button>
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
    </div>
  )
}

// Gestiona la operacion AbsencesPage.
export function AbsencesPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AbsencesAdminView /> : <AbsencesEmployeeView />
}
