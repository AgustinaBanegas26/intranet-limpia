// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: formulario y validación de datos.
import { useMemo, useState } from 'react'
import { Clock3, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { absencesService } from '../../services/absences'

// Gestiona la operacion argentinaToday.
function argentinaToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

// Gestiona la operacion displayDate.
function displayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

type Props = { onSuccess?: () => void }

// Gestiona la operacion LateArrivalForm.
export function LateArrivalForm({ onSuccess }: Props) {
  const { user } = useAuth()
  const date = useMemo(argentinaToday, [])
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const nameParts = String(user.name || '').trim().split(/\s+/)
  const nombre = nameParts[0] || 'Sin informar'
  const apellido = nameParts.slice(1).join(' ') || 'Sin informar'

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    if (!horaDesde || !horaHasta) {
      setError('Completá el horario desde y hasta.')
      return
    }
    if (horaHasta <= horaDesde) {
      setError('La hora hasta debe ser posterior a la hora desde.')
      return
    }
    if (!motivo.trim()) {
      setError('Indicá el motivo de la llegada tarde.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await absencesService.create({
        tipo: 'llegada_tarde',
        hora_desde: horaDesde,
        hora_hasta: horaHasta,
        motivo: motivo.trim(),
      })
      setHoraDesde('')
      setHoraHasta('')
      setMotivo('')
      setSuccess(true)
      onSuccess?.()
    } catch (requestError) {
      const code = requestError instanceof Error ? requestError.message : ''
      if (code === 'invalid_time_range') {
        setError('La hora hasta debe ser posterior a la hora desde.')
      } else {
        setError('No se pudo registrar la llegada tarde. Intentá de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="late-arrival-form">
      <p className="late-arrival-form__description">Registrá una llegada tarde para informar a Recursos Humanos.</p>
      <div className="grid-2">
        <div className="form-field">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={nombre} disabled />
        </div>
        <div className="form-field">
          <label className="form-label">Apellido</label>
          <input className="form-input" value={apellido} disabled />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-field">
          <label className="form-label">Mail</label>
          <input className="form-input" value={user.email || 'Sin informar'} disabled />
        </div>
        <div className="form-field">
          <label className="form-label">Día</label>
          <input className="form-input" value={displayDate(date)} disabled />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-field">
          <label className="form-label">Desde qué hora</label>
          <input type="time" className="form-input" value={horaDesde} onChange={(event) => setHoraDesde(event.target.value)} required />
        </div>
        <div className="form-field">
          <label className="form-label">Hasta qué hora</label>
          <input type="time" className="form-input" value={horaHasta} onChange={(event) => setHoraHasta(event.target.value)} required />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Motivo</label>
        <textarea className="form-input" rows={3} value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ej.: Turno médico" required />
      </div>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">Tu llegada tarde fue registrada correctamente y será revisada por Recursos Humanos.</div>}
      <button type="button" className="btn btn-md btn-primary-fill" disabled={submitting} onClick={handleSubmit}>
        {submitting ? <Loader2 size={16} className="spin" /> : <Clock3 size={16} />}
        Informar llegada tarde
      </button>
    </div>
  )
}
