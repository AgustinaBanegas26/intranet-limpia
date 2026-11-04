import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Loader2, Users } from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { useAuth } from '../../context/AuthContext'
import { getProfile } from '../../services/api'
import { requestsService, type CreateSolicitudPayload, type SolicitudDTO } from '../../services/requests'
import { RendicionesPanel } from '../../components/requests/RendicionesPanel'

type FormData = {
  nombre: string
  email: string
  area: string
  motivo_solicitud: string
  destino: string
  motivo_viaje: string
  personas_viajan: string
  medio_transporte: string
  fecha_necesaria: string
  fecha_finalizacion: string
  monto_total: string
}

const initialForm: FormData = {
  nombre: '',
  email: '',
  area: '',
  motivo_solicitud: 'Viaje',
  destino: '',
  motivo_viaje: '',
  personas_viajan: '',
  medio_transporte: '',
  fecha_necesaria: '',
  fecha_finalizacion: '',
  monto_total: '',
}

// Comprueba los datos o la condicion indicada.
function validate(form: FormData) {
  const errors: Partial<Record<keyof FormData, string>> = {}

  if (!form.motivo_solicitud) errors.motivo_solicitud = 'Requerido.'
  if (!form.destino.trim()) errors.destino = 'Requerido.'
  if (!form.fecha_necesaria) errors.fecha_necesaria = 'Requerida.'
  if (!form.fecha_finalizacion) errors.fecha_finalizacion = 'Requerida.'
  if (!form.monto_total.trim()) errors.monto_total = 'Requerido.'

  return errors
}

// Construye el valor o recurso necesario.
function buildPayload(form: FormData): CreateSolicitudPayload {
  const monto = Number(form.monto_total) || 0
  return {
    tipo: 'viaticos',
    nombre: form.nombre,
    email: form.email,
    area: form.area,
    motivo_solicitud: form.motivo_solicitud,
    destino: form.destino,
    motivo_viaje: form.motivo_viaje,
    personas_viajan: form.personas_viajan,
    medio_transporte: form.medio_transporte,
    fecha_necesaria: form.fecha_necesaria,
    fecha_finalizacion: form.fecha_finalizacion,
    monto_total: monto,
    destino_viaticos: form.destino,
    monto_solicitar: monto,
  }
}

// Gestiona la operacion FormInput.
function FormInput({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <input
        type={type}
        className={`form-input ${error ? 'invalid' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small className="form-feedback">{error}</small>}
    </label>
  )
}

// Gestiona la operacion ViaticosPage.
export function ViaticosPage() {
  const { token, user } = useAuth()
  const [activeTab, setActiveTab] = useState<'solicitudes' | 'rendiciones'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return tab === 'rendiciones' ? 'rendiciones' : 'solicitudes'
  })
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    nombre: user.name,
    email: user.email || '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudDTO[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfile(token)
      .then((profile) => {
        if (cancelled) return
        setForm((prev) => ({
          ...prev,
          nombre: profile.nombreCompleto || prev.nombre,
          email: profile.emailEmpresa || prev.email,
          area: profile.sector || prev.area,
        }))
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    let cancelled = false
    setLoadingList(true)
    requestsService
      .getAll()
      .then((res) => {
        if (!cancelled) setMisSolicitudes(res.data?.filter(s => s.tipo === 'viaticos' && s.datos_extra?.nombre) || [])
      })
      .catch(() => {
        if (!cancelled) setMisSolicitudes([])
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false)
      })
    return () => { cancelled = true }
  }, [submitted])

  const errors = useMemo(() => validate(form), [form])
  const visibleErrors = showValidation ? errors : {}
  const canSubmit = Object.keys(errors).length === 0
  const isSolicitudesTab = activeTab === 'solicitudes'
  // Actualiza los datos correspondientes.
  const setValue = (key: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Limpia el estado o los datos correspondientes.
  const resetForm = () => {
    setForm({ ...initialForm, nombre: user.name, email: user.email || '' })
    setError('')
    setShowValidation(false)
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    setShowValidation(true)
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await requestsService.createViaticos(buildPayload(form))
      setSubmitted(true)
    } catch (err) {
      console.error('Error al crear solicitud de viáticos:', err)
      setError('No se pudo enviar la solicitud. Intentá de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  if (isSolicitudesTab && submitted) {
    return (
      <div className="page-root">
        <section className="request-success">
          <CheckCircle size={42} />
          <h2>Solicitud enviada</h2>
          <p>Tu solicitud de viáticos fue enviada exitosamente.</p>
          <div className="status-track">
            <span className="active">Pendiente</span>
            <span>En revisión</span>
            <span>Aprobada</span>
            <span>Rechazada</span>
          </div>
          <button
            type="button"
            className="btn btn-md btn-primary-fill"
            onClick={() => {
              setSubmitted(false)
              resetForm()
            }}
          >
            Nueva solicitud
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="page-root request-page">
      <PageHero
        eyebrow="Viáticos"
        title="Viáticos"
        description="Gestioná tus solicitudes y rendiciones de viáticos desde un mismo lugar."
      />

      <div className="chip-row" style={{ marginBottom: 18 }}>
        <button type="button" className={`chip ${activeTab === 'solicitudes' ? 'active' : ''}`} onClick={() => setActiveTab('solicitudes')}>
          Solicitudes
        </button>
        <button type="button" className={`chip ${activeTab === 'rendiciones' ? 'active' : ''}`} onClick={() => setActiveTab('rendiciones')}>
          Mis rendiciones
        </button>
      </div>

      {isSolicitudesTab ? (
      <div className="request-form-grid">
        <PremiumCard title="Datos de la solicitud" eyebrow="Formulario de viáticos" icon={Users}>
          <div className="grid-2">
            <FormInput label="Email corporativo o personal" type="email" value={form.email} onChange={setValue('email')} />
            <FormInput label="Nombre completo (Automático)" value={form.nombre} onChange={() => {}} />
            <FormInput label="Área (Automática)" value={form.area} onChange={() => {}} />
            
            <label className="form-field">
              <span className="form-label">Motivo de la solicitud</span>
              <select
                className={`form-input ${visibleErrors.motivo_solicitud ? 'invalid' : ''}`}
                value={form.motivo_solicitud}
                onChange={(e) => setValue('motivo_solicitud')(e.target.value)}
              >
                <option value="Viaje">Viaje</option>
                <option value="Compra">Compra</option>
                <option value="Otro">Otro</option>
              </select>
              {visibleErrors.motivo_solicitud && <small className="form-feedback">{visibleErrors.motivo_solicitud}</small>}
            </label>

            <FormInput label="Destino" value={form.destino} onChange={setValue('destino')} error={visibleErrors.destino} />
            
            <FormInput label="Fecha inicio (Necesaria)" type="date" value={form.fecha_necesaria} onChange={setValue('fecha_necesaria')} error={visibleErrors.fecha_necesaria} />
            <FormInput label="Fecha finalización" type="date" value={form.fecha_finalizacion} onChange={setValue('fecha_finalizacion')} error={visibleErrors.fecha_finalizacion} />
            
            <FormInput label="Monto total a solicitar" type="number" value={form.monto_total} onChange={setValue('monto_total')} error={visibleErrors.monto_total} />
            
            <label className="form-field">
              <span className="form-label">¿Se necesita medio de transporte?</span>
              <select
                className="form-input"
                value={form.medio_transporte === 'Sí' || form.medio_transporte === 'No' ? form.medio_transporte : ''}
                onChange={(e) => setValue('medio_transporte')(e.target.value)}
              >
                <option value="">Seleccione...</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </label>
          </div>
          
          <label className="form-field request-wide">
            <span className="form-label">Motivo</span>
            <input
              className="form-input"
              value={form.motivo_viaje}
              onChange={(e) => setValue('motivo_viaje')(e.target.value)}
              placeholder="Motivo del viaje o compra"
            />
          </label>
          
          <label className="form-field request-wide">
            <span className="form-label">Observaciones / Comentarios</span>
            <textarea
              className="form-input"
              rows={3}
              value={form.personas_viajan}
              onChange={(e) => setValue('personas_viajan')(e.target.value)}
              placeholder="Información adicional relacionada con el viaje (opcional)"
            />
          </label>

          {error && <p className="form-feedback" style={{ marginTop: 14 }}>{error}</p>}

          <div className="request-actions">
            <button
              type="button"
              className="btn btn-md btn-primary-fill"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </PremiumCard>

        <PremiumCard title="Mis solicitudes" eyebrow="Historial" icon={CheckCircle}>
          {loadingList ? (
            <p className="muted-copy">Cargando...</p>
          ) : misSolicitudes.length === 0 ? (
            <p className="muted-copy">Todavía no enviaste solicitudes de viáticos.</p>
          ) : (
            <div className="request-list">
              {misSolicitudes.map((sol) => (
                <div key={sol.id} className="request-list-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <strong>{sol.tipo === 'viaticos' ? (sol.datos_extra as any)?.motivo_solicitud || 'Viáticos' : sol.tipo}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 4 }}>
                      Fecha: {sol.fecha_desde ? new Date(sol.fecha_desde).toLocaleDateString() : '—'} <br/>
                      Monto: ${sol.monto_estimado || 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <em className={`state-${sol.estado.toLowerCase()}`}>{sol.estado}</em>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
      </div>
      ) : (
        <RendicionesPanel />
      )}
    </div>
  )
}
