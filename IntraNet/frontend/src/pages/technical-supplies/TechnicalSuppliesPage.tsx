import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle, ChevronDown, Eye, FileText, Filter, ListChecks, Loader2, Pencil, Search, User, Users, Wrench, X } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ModalBackdrop } from '../../components/ui/ModalBackdrop'
import { TechnicalSupplyRequestCard, TechnicalSupplyStatusBadge } from '../../components/technical-supplies/TechnicalSupplyRequestCard'
import { useAuth } from '../../context/AuthContext'
import {
  technicalSuppliesService,
  type TechnicalSupplyRequestDTO,
} from '../../services/technicalSupplies'
import { employeesService, type EmpleadoDTO } from '../../services/employees'

type RequestFilter = 'pendiente' | 'aprobada' | 'rechazada' | 'todos'
type TechnicalSupplyFichaRow = {
  empleado: EmpleadoDTO
  ficha: TechnicalSupplyRequestDTO | null
}

function EmployeeView() {
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [amount, setAmount] = useState('')
  const [items, setItems] = useState<TechnicalSupplyRequestDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await technicalSuppliesService.getRequests()
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    const parsedAmount = Number(amount)
    if (!comment.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Completa la solicitud y un monto estimado mayor a 0.')
      return
    }
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      setError('No se encontro un email valido en tu sesion.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await technicalSuppliesService.createRequest({ comment: comment.trim(), amount: parsedAmount })
      setComment('')
      setAmount('')
      setSuccess('Solicitud enviada correctamente. Sera revisada por el area correspondiente.')
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'missing_fields' ? 'Completa todos los datos obligatorios.' : 'No se pudo enviar la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Servicios"
        title="Insumos Técnicos"
        description="Solicita herramientas o elementos tecnologicos necesarios para trabajar."
      />

      <div className="technical-supplies-layout">
        <PremiumCard title="Enviar solicitud" eyebrow="Formulario" icon={Wrench}>
          <div style={{ display: 'grid', gap: 14 }}>
            <label className="form-field">
              <span className="form-label">Email del empleado</span>
              <input className="form-input" type="email" value={user.email || ''} readOnly />
            </label>

            <label className="form-field">
              <span className="form-label">Comentario / solicitud</span>
              <textarea
                className="form-input"
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Indica que herramienta o insumo tecnico necesitas y para que lo vas a utilizar."
                style={{ resize: 'vertical', minHeight: 138 }}
              />
            </label>

            <div className="technical-supplies-submit-row">
              <label className="form-field" style={{ minWidth: 0 }}>
                <span className="form-label">Monto estimado</span>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ingresa el valor aproximado"
                />
              </label>
              <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={submit} style={{ minHeight: 44 }}>
                {submitting ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>

          {error && <p className="form-feedback" style={{ marginTop: 12 }}>{error}</p>}
          {success && <p style={{ color: 'var(--success)', fontWeight: 700, marginTop: 12 }}>{success}</p>}
        </PremiumCard>

        <PremiumCard title="Mis solicitudes" eyebrow="Historial" icon={Wrench}>
          {loading ? (
            <p className="muted-copy">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="muted-copy">Todavia no enviaste solicitudes de insumos Técnicos.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((item) => <TechnicalSupplyRequestCard key={item.id} request={item} />)}
            </div>
          )}
        </PremiumCard>
      </div>
    </div>
  )
}

function money(value?: number | null) {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name?: string | null) {
  const parts = String(name || 'Empleado').trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'E'
}

function getEmployeeName(employee?: EmpleadoDTO | null) {
  return `${employee?.nombre || ''} ${employee?.apellido || ''}`.trim() || 'Empleado'
}

function TechnicalSupplyDetailModal({
  row,
  onClose,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  row: TechnicalSupplyFichaRow | null
  onClose: () => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
  approving: boolean
  rejecting: boolean
}) {
  useEffect(() => {
    if (!row) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [row, onClose])

  if (!row) return null

  const { empleado, ficha } = row

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="profile-modal request-detail-modal" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-head">
          <div>
            <h3 id="technical-supply-detail-title">INSUMOS TÉCNICOS</h3>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Empleado:</span>
            <div style={{ fontWeight: 600 }}>{getEmployeeName(empleado)}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gmail:</span>
            <div style={{ fontWeight: 500 }}>{ficha?.email || empleado.email_corporativo || 'Sin informar'}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solicitud / Comentario:</span>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
              {ficha?.comment ? `"${ficha.comment}"` : 'Sin solicitud'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto:</span>
            <div style={{ fontWeight: 600 }}>{ficha ? money(ficha.amount) : '-'}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estado:</span>
            <div style={{ marginTop: '4px' }}>
               {ficha ? (ficha.approved ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>Aprobada</span> : <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Pendiente</span>) : <span style={{ color: 'var(--text-muted)' }}>Sin solicitud</span>}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-md btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          {ficha && (!ficha.approved && ficha.status !== 'rechazada') && (
            <>
              <button
                type="button"
                className="btn btn-md btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => onReject(ficha.id)}
                disabled={approving || rejecting}
              >
                {rejecting ? <Loader2 size={16} className="spin" /> : 'Rechazar'}
              </button>
              <button
                type="button"
                className="btn btn-md btn-primary-fill"
                onClick={() => onApprove(ficha.id)}
                disabled={approving || rejecting}
              >
                {approving ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                Aprobar
              </button>
            </>
          )}
        </div>
      </div>
    </ModalBackdrop>
  )
}

function EditRequestModal({
  row,
  saving,
  onClose,
  onSave,
}: {
  row: TechnicalSupplyFichaRow | null
  saving: boolean
  onClose: () => void
  onSave: (payload: { email: string; comment: string; amount: number }) => Promise<void>
}) {
  const request = row?.ficha || null
  const empleado = row?.empleado || null
  const [comment, setComment] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setComment(request?.comment || '')
    setAmount(request ? String(request.amount) : '')
    setError('')
  }, [request])

  if (!row || !empleado) return null

  const save = async () => {
    const parsedAmount = Number(amount)
    if (!comment.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Completa observacion y monto con un valor mayor a 0.')
      return
    }
    const currentEmail = request?.email || empleado.email_corporativo || ''
    await onSave({ email: currentEmail, comment: comment.trim(), amount: parsedAmount })
  }

  return (
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <section className="card" style={{ width: 'min(520px, 100%)', padding: 24 }} onClick={(event) => event.stopPropagation()}>
        <div className="card-header">
          <div>
            <h3 className="card-title">EDITAR SOLICITUD</h3>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div className="grid-2">
            <div><small className="form-label">Nombre</small><div style={{ fontWeight: 600 }}>{getEmployeeName(empleado)}</div></div>
            <div><small className="form-label">Legajo</small><div style={{ fontWeight: 600 }}>{empleado.legajo || 'S/N'}</div></div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <small className="form-label">Gmail</small>
            <div style={{ fontWeight: 600 }}>{request?.email || empleado.email_corporativo || 'Sin informar'}</div>
          </div>
          <label className="form-field">
            <span className="form-label">Solicitud / Comentario</span>
            <textarea className="form-input" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <label className="form-field">
            <span className="form-label">Monto</span>
            <input className="form-input" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
        </div>

        {error && <p className="form-feedback" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn btn-md btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="btn btn-md btn-primary-fill" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
            Guardar
          </button>
        </div>
      </section>
    </ModalBackdrop>
  )
}

function AdminView() {
  const { token } = useAuth()
  const [filter, setFilter] = useState<RequestFilter>('pendiente')
  const [requests, setRequests] = useState<TechnicalSupplyRequestDTO[]>([])
  const [employees, setEmployees] = useState<EmpleadoDTO[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [detailRow, setDetailRow] = useState<TechnicalSupplyFichaRow | null>(null)
  const [editRow, setEditRow] = useState<TechnicalSupplyFichaRow | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        technicalSuppliesService.getRequests({ estado: 'todos' }),
        employeesService.getAll(token),
      ])
      setRequests(requestsRes.data || [])
      setEmployees(employeesRes.data || [])
    } catch {
      setRequests([])
      setEmployees([])
      setError('No se pudieron cargar las solicitudes.')
    } finally {
      setLoadingRequests(false)
    }
  }, [token])

  useEffect(() => { loadRequests() }, [loadRequests])

  const filteredRequests = useMemo(() => {
    const latestByEmployee = new Map<number, TechnicalSupplyRequestDTO>()
    for (const request of requests) {
      const current = latestByEmployee.get(request.empleado_id)
      const requestTime = new Date(request.updated_at || request.created_at || '').getTime() || 0
      const currentTime = new Date(current?.updated_at || current?.created_at || '').getTime() || 0
      if (!current || requestTime >= currentTime) latestByEmployee.set(request.empleado_id, request)
    }

    let rows: TechnicalSupplyFichaRow[] = employees.map((empleado) => ({
      empleado,
      ficha: latestByEmployee.get(Number(empleado.id)) || null,
    }))

    if (filter === 'pendiente') {
      rows = rows.filter((row) => row.ficha && row.ficha.approved === false && row.ficha.status !== 'rechazada')
    } else if (filter === 'aprobada') {
      rows = rows.filter((row) => row.ficha?.approved === true)
    } else if (filter === 'rechazada') {
      rows = rows.filter((row) => row.ficha?.status === 'rechazada')
    }

    const q = searchTerm.trim().toLowerCase()
    if (q) {
      rows = rows.filter((row) => {
        const employeeName = getEmployeeName(row.empleado).toLowerCase()
        const employeeEmail = (row.ficha?.email || row.empleado.email_corporativo || '').toLowerCase()
        return employeeName.includes(q) || employeeEmail.includes(q)
      })
    }

    return rows
  }, [employees, filter, requests, searchTerm])

  const approveRequest = async (id: number) => {
    setApproving(true)
    setError('')
    try {
      await technicalSuppliesService.approveRequest(id)
      setNotice('Solicitud aprobada correctamente.')
      await loadRequests()
      setDetailRow(prev => prev && prev.ficha && prev.ficha.id === id ? { ...prev, ficha: { ...prev.ficha, approved: true, status: 'aprobada' } } : prev)
    } catch {
      setError('No se pudo aprobar la solicitud.')
    } finally {
      setApproving(false)
    }
  }

  const rejectRequest = async (id: number) => {
    setRejecting(true)
    setError('')
    try {
      await technicalSuppliesService.rejectRequest(id)
      setNotice('Solicitud rechazada correctamente.')
      await loadRequests()
      setDetailRow(prev => prev && prev.ficha && prev.ficha.id === id ? { ...prev, ficha: { ...prev.ficha, approved: false, status: 'rechazada' } } : prev)
    } catch {
      setError('No se pudo rechazar la solicitud.')
    } finally {
      setRejecting(false)
    }
  }

  const saveEdit = async (payload: { email: string; comment: string; amount: number }) => {
    if (!editRow?.empleado?.id) return
    setSavingEdit(true)
    setError('')
    try {
      await technicalSuppliesService.upsertFicha(editRow.empleado.id, payload)
      setNotice('Solicitud actualizada correctamente.')
      setEditRow(null)
      await loadRequests()
    } catch {
      setError('No se pudo guardar la solicitud.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="page-root admin-page">
      <PageHero
        eyebrow="Administracion"
        title="Insumos Técnicos"
        description="Gestiona las solicitudes de insumos realizadas por los empleados."
      />

      {error && <p className="form-feedback" style={{ marginBottom: 12 }}>{error}</p>}
      {notice && <p style={{ color: 'var(--success)', fontWeight: 700, marginBottom: 12 }}>{notice}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PremiumCard title="Bandeja de solicitudes" icon={Filter}>
          <div className="chip-row chip-row--scroll" style={{ marginBottom: 4, marginTop: 12 }}>
            {(['todos', 'pendiente', 'aprobada', 'rechazada'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`chip ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard title="EMPLEADOS">
          <div style={{ marginBottom: '16px' }}>
            <label className="technical-supplies-search">
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o email..."
              />
            </label>
          </div>

          {loadingRequests ? (
            <p className="muted-copy">Cargando empleados...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="muted-copy">No hay empleados para esta busqueda o filtro.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredRequests.map((row) => {
                const employeeName = getEmployeeName(row.empleado)
                return (
                  <div
                    key={row.empleado.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '15px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {employeeName}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-icon btn-ghost"
                        title="Ver solicitud"
                        onClick={() => setDetailRow(row)}
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon btn-ghost"
                        title="Editar solicitud"
                        onClick={() => setEditRow(row)}
                      >
                        <Pencil size={20} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PremiumCard>
      </div>

      <TechnicalSupplyDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onApprove={approveRequest}
        onReject={rejectRequest}
        approving={approving}
        rejecting={rejecting}
      />

      <EditRequestModal
        row={editRow}
        saving={savingEdit}
        onClose={() => setEditRow(null)}
        onSave={saveEdit}
      />
    </div>
  )
}

export function TechnicalSuppliesPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminView /> : <EmployeeView />
}

