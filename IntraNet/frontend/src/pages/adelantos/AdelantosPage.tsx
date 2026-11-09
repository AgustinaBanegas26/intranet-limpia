// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: solicitudes de adelantos.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Loader2, Trash2, WalletCards, XCircle } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { getProfile } from '../../services/api'
import { adelantosService, type AdelantoDTO, type AdelantoEstado } from '../../services/adelantos'

const statusConfig: Record<AdelantoEstado, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  aprobada: { label: 'Aprobada', color: 'var(--success)', bg: 'var(--success-bg)' },
  rechazada: { label: 'Rechazada', color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

// Gestiona la operacion money.
function money(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value)
}

// Prepara el valor para su uso.
function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type FormState = {
  nombre: string
  apellido: string
  email: string
  empresa: string
  monto: string
}

const initialForm: FormState = { nombre: '', apellido: '', email: '', empresa: '', monto: '' }

// Gestiona la operacion EmployeeView.
function EmployeeView() {
  const { token, user } = useAuth()
  const [form, setForm] = useState<FormState>(initialForm)
  const [items, setItems] = useState<AdelantoDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await adelantosService.getAll()
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    getProfile(token)
      .then((profile) => {
        if (cancelled) return
        const fullName = (profile.nombreCompleto || user.name || '').trim()
        const [nombre, ...apellidoParts] = fullName.split(/\s+/)
        setForm((prev) => ({
          ...prev,
          nombre: nombre || prev.nombre || user.name || '',
          apellido: apellidoParts.join(' ') || prev.apellido || '',
          email: (profile.emailEmpresa || profile.emailPersonal || prev.email || user.email || '').trim(),
          empresa: prev.empresa || '',
        }))
      })
      .catch(() => {
        setForm((prev) => ({
          ...prev,
          nombre: user.name || prev.nombre,
          apellido: '',
          email: prev.email || user.email || '',
          empresa: prev.empresa || '',
        }))
      })
    return () => { cancelled = true }
  }, [token, user.id, user.name])

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    const monto = Number(form.monto)
    const empresa = form.empresa.trim()
    const email = form.email.trim()

    if (!empresa || !Number.isFinite(monto) || monto <= 0) {
      setError('Completá un monto válido y la empresa.')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresá un email corporativo o personal válido.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await adelantosService.create({ monto, empresa })
      setSuccess(true)
      setForm(initialForm)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'missing_fields' ? 'Completá todos los datos obligatorios.' : 'No se pudo enviar el adelanto.')
    } finally {
      setSubmitting(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setLoading(true)
    try {
      await adelantosService.remove(id)
      setDeleteId(null)
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'cannot_delete_resolved' ? 'Solo se pueden eliminar adelantos pendientes.' : 'No se pudo eliminar el adelanto.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page-root">
        <section className="request-success">
          <CheckCircle size={42} />
          <h2>Solicitud enviada</h2>
          <p>Tu adelanto fue registrado correctamente y quedó pendiente de revisión.</p>
          <div className="status-track">
            <span className="active">Pendiente</span>
            <span>En revisión</span>
            <span>Aprobada</span>
            <span>Rechazada</span>
          </div>
          <button type="button" className="btn btn-md btn-primary-fill" onClick={() => { setSuccess(false); setError('') }}>
            Nueva solicitud
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="page-root">
      <PageHero eyebrow="Recursos humanos" title="Adelantos" description="Solicitá un anticipo con la información del empleado y la empresa. Los datos personales se completan automáticamente." />

      <div className="request-form-grid">
        <PremiumCard title="Solicitar adelanto" eyebrow="Formulario" icon={WalletCards}>
          <div className="grid-2">
            <label className="form-field">
              <span className="form-label">Nombre</span>
              <input className="form-input" value={form.nombre} readOnly />
            </label>
            <label className="form-field">
              <span className="form-label">Apellido</span>
              <input className="form-input" value={form.apellido} readOnly />
            </label>
            <label className="form-field request-wide">
              <span className="form-label">Email corporativo o personal</span>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="nombre@empresa.com o tuemail@gmail.com"
              />
            </label>
            <label className="form-field request-wide">
              <span className="form-label">Empresa</span>
              <input
                className="form-input"
                value={form.empresa}
                onChange={(e) => setForm((prev) => ({ ...prev, empresa: e.target.value }))}
                placeholder="Ingresá la empresa"
              />
            </label>
            <label className="form-field request-wide">
              <span className="form-label">Monto solicitado</span>
              <input className="form-input" type="number" min="1" step="0.01" value={form.monto} onChange={(e) => setForm((prev) => ({ ...prev, monto: e.target.value }))} placeholder="15000" />
            </label>
          </div>
          {error && <p className="form-feedback" style={{ marginTop: 12 }}>{error}</p>}
          <div className="request-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </PremiumCard>

        <PremiumCard title="Mis adelantos" eyebrow="Historial" icon={WalletCards}>
          {loadingList ? (
            <p className="muted-copy">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="muted-copy">Todavía no enviás adelantos.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((item) => {
                const cfg = statusConfig[item.estado] || statusConfig.pendiente
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 14, background: 'var(--muted)' }}>
                    <div>
                      <strong>{item.empresa}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 4 }}>
                        {money(item.monto)} · {formatDate(item.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                      {item.estado === 'pendiente' && (
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDeleteId(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PremiumCard>
      </div>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar adelanto?"
        description="Se eliminará permanentemente esta solicitud pendiente de adelanto."
        confirmLabel="Eliminar"
        loading={loading}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </div>
  )
}

// Gestiona la operacion AdminView.
function AdminView() {
  const [items, setItems] = useState<AdelantoDTO[]>([])
  const [filter, setFilter] = useState<'todos' | AdelantoEstado>('todos')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adelantosService.getAll({ estado: filter === 'todos' ? 'todos' : filter })
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  // Gestiona la operacion approve.
  const approve = async (id: number) => {
    setActionId(id)
    try {
      await adelantosService.approve(id, approveComment)
      setApproveComment('')
      await load()
    } catch {
      setError('No se pudo aprobar el adelanto.')
    } finally {
      setActionId(null)
    }
  }

  // Gestiona la operacion reject.
  const reject = async (id: number) => {
    setActionId(id)
    try {
      await adelantosService.reject(id, rejectComment)
      setRejectComment('')
      await load()
    } catch {
      setError('No se pudo rechazar el adelanto.')
    } finally {
      setActionId(null)
    }
  }

  const summary = useMemo(() => ({
    total: items.length,
    pendientes: items.filter((i) => i.estado === 'pendiente').length,
    aprobadas: items.filter((i) => i.estado === 'aprobada').length,
    rechazadas: items.filter((i) => i.estado === 'rechazada').length,
  }), [items])

  return (
    <div className="page-root admin-page">
      <PageHero eyebrow="Administración" title="Adelantos" description="Revisá las solicitudes de adelanto, aprobá o rechazá según el estado del empleado y la empresa." />

      <div className="request-controls" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div className="form-field">
          <label className="form-label">Filtrar</label>
          <select className="form-input" value={filter} onChange={(e) => setFilter(e.target.value as 'todos' | AdelantoEstado)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      <motion.div className="metric-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="metric-card"><p className="metric-label">Total</p><p className="metric-value">{summary.total}</p></div>
        <div className="metric-card"><p className="metric-label">Pendientes</p><p className="metric-value" style={{ color: 'var(--warning)' }}>{summary.pendientes}</p></div>
        <div className="metric-card"><p className="metric-label">Aprobadas</p><p className="metric-value" style={{ color: 'var(--success)' }}>{summary.aprobadas}</p></div>
        <div className="metric-card"><p className="metric-label">Rechazadas</p><p className="metric-value" style={{ color: 'var(--danger)' }}>{summary.rechazadas}</p></div>
      </motion.div>

      <PremiumCard title="Solicitudes recibidas" icon={WalletCards}>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
        {loading ? (
          <p className="muted-copy">Cargando solicitudes…</p>
        ) : items.length === 0 ? (
          <p className="muted-copy">No hay solicitudes de adelanto.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item) => {
              const cfg = statusConfig[item.estado] || statusConfig.pendiente
              return (
                <div key={item.id} style={{ padding: 16, borderRadius: 16, background: 'var(--muted)', display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <strong>{item.solicitante?.nombre || 'Empleado'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{item.empresa} · {formatDate(item.created_at)}</div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid-2">
                    <div><small className="form-label">Monto solicitado</small><div>{money(item.monto)}</div></div>
                    <div><small className="form-label">Empleado</small><div>{item.solicitante?.nombre || '—'}</div></div>
                    <div><small className="form-label">Empresa</small><div>{item.empresa || '—'}</div></div>
                    <div><small className="form-label">Fecha</small><div>{formatDate(item.created_at)}</div></div>
                  </div>
                  {item.estado === 'pendiente' && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <label className="form-field">
                        <span className="form-label">Comentario</span>
                        <textarea className="form-input" rows={2} value={approveComment} onChange={(e) => setApproveComment(e.target.value)} placeholder="Comentario para la resolución" />
                      </label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => reject(item.id)} disabled={actionId === item.id}>
                          {actionId === item.id ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                          Rechazar
                        </button>
                        <button type="button" className="btn btn-sm btn-primary-fill" onClick={() => approve(item.id)} disabled={actionId === item.id}>
                          {actionId === item.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                          Aprobar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PremiumCard>
    </div>
  )
}

// Gestiona la operacion AdelantosPage.
export function AdelantosPage() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminView /> : <EmployeeView />
}
