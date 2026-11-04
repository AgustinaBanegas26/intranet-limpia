import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, PlusCircle } from 'lucide-react'
import { absencesService } from '../../services/absences'

export const TIPOS_AUSENCIA = ['Enfermedad', 'Trámite personal', 'Licencia médica', 'Asuntos personales', 'Otro']

type Props = {
  compact?: boolean
  onSuccess?: () => void
}

const emptyForm = { tipo: 'Enfermedad', fecha_desde: '', fecha_hasta: '', motivo: '' }

// Gestiona la operacion AbsenceRequestForm.
export function AbsenceRequestForm({ compact = false, onSuccess }: Props) {
  const [showForm, setShowForm] = useState(!compact)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    if (!form.fecha_desde) {
      setError('Debe seleccionar una fecha de inicio.')
      return
    }
    if (!form.fecha_hasta) {
      setError('Debe seleccionar una fecha de fin.')
      return
    }
    if (form.fecha_hasta < form.fecha_desde) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }
    if (!form.motivo.trim()) {
      setError('Completá la fecha de inicio y el motivo.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await absencesService.create({
        tipo: form.tipo,
        fecha_desde: form.fecha_desde,
        fecha_hasta: form.fecha_hasta,
        motivo: form.motivo.trim(),
      })
      setForm({ ...emptyForm })
      setSuccess(true)
      if (compact) setShowForm(false)
      onSuccess?.()
    } catch {
      setError('No se pudo enviar la solicitud. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={compact ? 'absence-request-form absence-request-form--compact' : 'absence-request-form'}>
      {compact && (
        <button
          type="button"
          className={`btn btn-md ${showForm ? 'btn-ghost' : 'btn-primary-fill'}`}
          onClick={() => { setShowForm((v) => !v); setError(null); setSuccess(false) }}
        >
          <PlusCircle size={16} />
          {showForm ? 'Cancelar' : 'Nueva solicitud'}
        </button>
      )}

      {(!compact || showForm) && (
        <motion.div
          initial={compact ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          style={{ marginTop: compact ? 12 : 0, display: 'grid', gap: 12 }}
        >
          <div className="form-field">
            <label className="form-label">Tipo</label>
            <select className="form-input" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
              {TIPOS_AUSENCIA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_desde}
                onChange={(e) => setForm((p) => ({ ...p, fecha_desde: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_hasta}
                onChange={(e) => setForm((p) => ({ ...p, fecha_hasta: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Motivo</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.motivo}
              onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Describí brevemente el motivo de la ausencia"
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">Solicitud enviada correctamente.</div>}
          <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={handleSubmit}>
            {submitting ? <Loader2 size={16} className="spin" /> : 'Enviar solicitud'}
          </button>
        </motion.div>
      )}
    </div>
  )
}
