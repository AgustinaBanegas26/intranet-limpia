import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, PlusCircle, CheckCircle, Clock, XCircle, Umbrella, Loader2, Pencil, Trash2 } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { vacationsService, type VacacionesSaldo } from '../../services/vacations'
import type { AusenciaDTO } from '../../services/absences'

type VacStatus = 'aprobada' | 'pendiente' | 'rechazada'

const statusConfig: Record<VacStatus, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  aprobada: { label: 'Aprobada', icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
  pendiente: { label: 'Pendiente', icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  rechazada: { label: 'Rechazada', icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
}

// Gestiona la operacion fmtDate.
function fmtDate(d: string) {
  return new Date(d.includes('T') ? d : `${d}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Gestiona la operacion VacationsPage.
export function VacationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ startDate: '', endDate: '', comment: '' })
  const [saldo, setSaldo] = useState<VacacionesSaldo | null>(null)
  const [vacations, setVacations] = useState<AusenciaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [saldoRes, vacRes] = await Promise.all([vacationsService.getSaldo(), vacationsService.getSolicitudes()])
      setSaldo(saldoRes.data)
      setVacations(vacRes.data || [])
    } catch {
      setSaldo(null)
      setVacations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const diasDisponibles = saldo?.dias_disponibles ?? 0
  const diasUsados = saldo?.dias_usados ?? 0
  const diasTotal = saldo?.dias_asignados ?? 14
  const pct = diasTotal > 0 ? Math.round((diasUsados / diasTotal) * 100) : 0

  // Limpia el estado o los datos correspondientes.
  const resetForm = () => {
    setForm({ startDate: '', endDate: '', comment: '' })
    setEditId(null)
    setShowForm(false)
  }

  // Comprueba los datos o la condicion indicada.
  const validateForm = () => {
    if (!form.startDate) {
      setError('Debe seleccionar una fecha de inicio.')
      return false
    }
    if (!form.endDate) {
      setError('Debe seleccionar una fecha de fin.')
      return false
    }
    if (form.endDate < form.startDate) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return false
    }
    setError('')
    return true
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      if (editId != null) {
        await vacationsService.update(editId, {
          fecha_desde: form.startDate,
          fecha_hasta: form.endDate,
          comment: form.comment,
        })
        setSuccess('Solicitud actualizada correctamente.')
      } else {
        await vacationsService.create({
          fecha_desde: form.startDate,
          fecha_hasta: form.endDate,
          comment: form.comment,
        })
        setSuccess('Solicitud enviada correctamente.')
      }
      resetForm()
      await load()
    } catch (err) {
      setError('No se pudo guardar la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleEdit = (vac: AusenciaDTO) => {
    if (vac.estado !== 'pendiente') return
    setEditId(Number(vac.id))
    setForm({
      startDate: String(vac.fecha_desde).slice(0, 10),
      endDate: String(vac.fecha_hasta || vac.fecha_desde).slice(0, 10),
      comment: vac.motivo || '',
    })
    setShowForm(true)
    setError('')
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number) => {
    setSubmitting(true)
    setError('')
    try {
      await vacationsService.remove(id)
      setDeleteId(null)
      setSuccess('Solicitud eliminada correctamente.')
      await load()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(code === 'cannot_delete_resolved' ? 'Solo se pueden eliminar solicitudes pendientes.' : 'No se pudo eliminar la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-root">
      <PageHero eyebrow="Recursos Humanos" title="Vacaciones" description="solicitá días de vacaciones." />

      {success && <div className="auth-success" style={{ marginBottom: 12 }}>{success}</div>}

      <PremiumCard title={editId != null ? 'Editar solicitud' : 'Solicitar vacaciones'} icon={PlusCircle}>
        <button type="button" className={`btn btn-md ${showForm ? 'btn-ghost' : 'btn-primary-fill'}`} onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}>
          <Plane size={15} />
          {showForm ? 'Cancelar' : 'Nueva solicitud'}
        </button>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <div className="grid-2">
              <div className="form-field">
                <label className="form-label">Fecha inicio</label>
                <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Fecha fin</label>
                <input type="date" className="form-input" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Comentario (opcional)</label>
              <textarea className="form-input" rows={2} value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={handleSubmit}>
              {submitting ? <Loader2 size={16} className="spin" /> : editId != null ? 'Guardar cambios' : 'Enviar solicitud'}
            </button>
          </motion.div>
        )}
      </PremiumCard>

      <PremiumCard title="Historial de solicitudes" icon={Plane}>
        {loading ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Cargando…</p>
        ) : vacations.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Sin solicitudes registradas.</p>
        ) : (
          <div className="admin-list">
            {vacations.map((vac) => {
              const st = (vac.estado in statusConfig ? vac.estado : 'pendiente') as VacStatus
              const { label, icon: Icon, color, bg } = statusConfig[st]
              const pending = vac.estado === 'pendiente'
              return (
                <div key={vac.id} className="admin-list-row">
                  <div className="admin-list-row__thumb" style={{ background: bg, color }}>
                    <Icon size={16} />
                  </div>
                  <div className="admin-list-row__body">
                    <strong>{fmtDate(vac.fecha_desde)} — {fmtDate(vac.fecha_hasta || vac.fecha_desde)}</strong>
                    <span>{vac.dias ?? '—'} días · {vac.motivo}</span>
                    <em>{label}</em>
                  </div>
                  {pending && (
                    <div className="admin-list-row__actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => handleEdit(vac)}>
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(Number(vac.id))}>
                        <Trash2 size={14} />
                        Eliminar
                      </button>
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
        title="¿Eliminar solicitud?"
        description="Se eliminará permanentemente esta solicitud de vacaciones pendiente."
        confirmLabel="Eliminar"
        loading={submitting}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) await handleDelete(deleteId) }}
      />
    </div>
  )
}
