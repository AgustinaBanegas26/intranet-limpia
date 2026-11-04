import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Car,
  CheckCircle,
  ChevronRight,
  Hotel,
  Loader2,
  Route,
  Users,
  WalletCards,
  Trash2,
} from 'lucide-react'
import { PageHero, PremiumCard } from '../../components/ui/ProductUI'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { getProfile } from '../../services/api'
import { requestsService, type CreateSolicitudPayload, type SolicitudDTO } from '../../services/requests'
import { useLocation } from 'react-router'

type Step = 'detalles' | 'confirmacion'

type FormData = {
  nombreCompleto: string
  emailCorporativo: string
  sector: string
  sucursal: string
  tipoReserva: 'auto' | 'hotel' | 'ambos' | 'viaticos'
  puntoPartida: string
  destino: string
  cantidadPersonas: string
  acompanantes: string
  fechaIda: string
  fechaRegreso: string
  horarioSalida: string
  horarioRegreso: string
  motivo: string
  tipoViaje: string
  tipoVehiculo: string
  kilometrajeEstimado: string
  equipajeEstimado: string
  centroCostos: string
  conductor: 'yo' | 'solicito'
  montoEstimado: string
  hotelCiudad: string
  hotelCheckIn: string
  hotelCheckOut: string
  hotelHabitaciones: string
  hotelTipoHabitacion: string
  hotelHuespedes: string
  hotelDistribucion: string
  hotelPersonasPorHabitacion: string
  hotelRequisitos: string
  hotelObservaciones: string
}

const initialForm: FormData = {
  nombreCompleto: '',
  emailCorporativo: '',
  sector: '',
  sucursal: '',
  puntoPartida: '',
  destino: '',
  cantidadPersonas: '1',
  acompanantes: '',
  fechaIda: '',
  fechaRegreso: '',
  horarioSalida: '',
  horarioRegreso: '',
  motivo: '',
  tipoViaje: 'Ida y vuelta',
  tipoVehiculo: 'Auto',
  kilometrajeEstimado: '',
  equipajeEstimado: '',
  centroCostos: '',
  conductor: 'yo',
  montoEstimado: '',
  tipoReserva: 'auto',
  hotelCiudad: '',
  hotelCheckIn: '',
  hotelCheckOut: '',
  hotelHabitaciones: '',
  hotelTipoHabitacion: 'Single',
  hotelHuespedes: '',
  hotelDistribucion: '',
  hotelPersonasPorHabitacion: '',
  hotelRequisitos: '',
  hotelObservaciones: '',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const PAGE_HERO_BY_PATH: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/solicitar': {
    eyebrow: 'Auto y hotel',
    title: 'Solicitud de vehículo',
    description: 'Completá el viaje, conductor, pasajeros y hotel opcional antes de enviar la solicitud.',
  },
  '/reservas': {
    eyebrow: 'Reservas',
    title: 'Reserva de alojamiento',
    description: 'Solicitá hotel para tu viaje o estadía corporativa.',
  },
  '/viaticos': {
    eyebrow: 'Viáticos',
    title: 'Solicitud de viáticos',
    description: 'Completá el formulario de viáticos para solicitar vehículo, hotel o ambos según tu viaje.',
  },
}

// Comprueba los datos o la condicion indicada.
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Comprueba los datos o la condicion indicada.
function validate(form: FormData) {
  const errors: Partial<Record<keyof FormData, string>> = {}
  const needsAuto = form.tipoReserva === 'auto' || form.tipoReserva === 'ambos'
  const needsHotel = form.tipoReserva === 'hotel' || form.tipoReserva === 'ambos'
  const needsViaticos = form.tipoReserva === 'viaticos'

  if (!form.nombreCompleto.trim()) errors.nombreCompleto = 'Campo requerido.'
  if (!form.emailCorporativo.trim() || !isEmail(form.emailCorporativo)) errors.emailCorporativo = 'Email válido requerido.'
  if (!form.sector.trim()) errors.sector = 'Campo requerido.'
  if (!form.sucursal.trim()) errors.sucursal = 'Campo requerido.'

  if (needsViaticos) {
    if (!form.destino.trim()) errors.destino = 'Destino obligatorio.'
    if (!form.fechaIda) errors.fechaIda = 'La fecha es obligatoria.'
    if (!form.montoEstimado.trim() || Number(form.montoEstimado) <= 0) errors.montoEstimado = 'Monto estimado válido requerido.'
    if (!form.motivo.trim()) errors.motivo = 'Motivo obligatorio.'
  }

  if (needsAuto) {
    if (!form.puntoPartida.trim()) errors.puntoPartida = 'Campo requerido.'
    if (!form.destino.trim()) errors.destino = 'Campo requerido.'
    if (form.puntoPartida.trim().toLowerCase() === form.destino.trim().toLowerCase()) errors.destino = 'Debe ser distinto al origen.'
    if (!form.fechaIda) errors.fechaIda = 'Campo requerido.'
    if (!form.horarioSalida) errors.horarioSalida = 'Campo requerido.'
    if (form.fechaRegreso && form.fechaIda && form.fechaRegreso < form.fechaIda) errors.fechaRegreso = 'Debe ser posterior a la ida.'
    if (!form.motivo.trim()) errors.motivo = 'Motivo obligatorio.'
    if (!form.cantidadPersonas || Number(form.cantidadPersonas) < 1) errors.cantidadPersonas = 'Mínimo 1 persona.'
  }

  if (needsHotel) {
    if (!form.hotelCiudad.trim()) errors.hotelCiudad = 'El destino es obligatorio.'
    if (!form.hotelCheckIn) errors.hotelCheckIn = 'La fecha de entrada es obligatoria.'
    if (!form.hotelCheckOut) errors.hotelCheckOut = 'La fecha de salida es obligatoria.'
    if (form.hotelCheckIn && form.hotelCheckOut && form.hotelCheckOut < form.hotelCheckIn) {
      errors.hotelCheckOut = 'Debe ser posterior a la fecha de entrada.'
    }
    if (!form.hotelHuespedes || Number(form.hotelHuespedes) < 1) {
      errors.hotelHuespedes = 'La cantidad de personas es obligatoria (mínimo 1).'
    }
    if (!form.hotelHabitaciones || Number(form.hotelHabitaciones) < 1) errors.hotelHabitaciones = 'Campo requerido.'
    if (!form.hotelDistribucion.trim()) errors.hotelDistribucion = 'Distribución obligatoria.'
    if (!form.hotelPersonasPorHabitacion.trim()) errors.hotelPersonasPorHabitacion = 'Detalle obligatorio.'
  }

  return errors
}

// Construye el valor o recurso necesario.
function buildPayload(form: FormData): CreateSolicitudPayload[] {
  const needsAuto = form.tipoReserva === 'auto' || form.tipoReserva === 'ambos'
  const needsHotel = form.tipoReserva === 'hotel' || form.tipoReserva === 'ambos'
  const needsViaticos = form.tipoReserva === 'viaticos'

  const items: CreateSolicitudPayload[] = []

  if (needsViaticos) {
    items.push({
      tipo: 'viaticos',
      fecha_desde: form.fechaIda,
      fecha_hasta: form.fechaRegreso || form.fechaIda,
      destino: form.destino,
      descripcion: form.motivo,
      monto_estimado: Number(form.montoEstimado) || undefined,
      justificacion: form.motivo,
      datos_extra: {
        nombreCompleto: form.nombreCompleto,
        emailCorporativo: form.emailCorporativo,
        sector: form.sector,
        sucursal: form.sucursal,
      },
    })
  }

  if (needsAuto) {
    items.push({
      tipo: 'auto',
      fecha_desde: form.fechaIda,
      fecha_hasta: form.fechaRegreso || form.fechaIda,
      destino: form.destino,
      descripcion: form.motivo,
      justificacion: form.motivo,
      datos_extra: {
        nombreCompleto: form.nombreCompleto,
        emailCorporativo: form.emailCorporativo,
        sector: form.sector,
        sucursal: form.sucursal,
        puntoPartida: form.puntoPartida,
        cantidadPersonas: Number(form.cantidadPersonas),
        acompanantes: form.acompanantes,
        horarioSalida: form.horarioSalida,
        horarioRegreso: form.horarioRegreso,
        tipoViaje: form.tipoViaje,
        tipoVehiculo: form.tipoVehiculo,
        kilometrajeEstimado: form.kilometrajeEstimado,
        equipajeEstimado: form.equipajeEstimado,
        centroCostos: form.centroCostos,
        conductor: form.conductor,
      },
    })
  }

  if (needsHotel) {
    items.push({
      tipo: 'hotel',
      fecha_desde: form.hotelCheckIn,
      fecha_hasta: form.hotelCheckOut,
      destino: form.hotelCiudad,
      descripcion: needsAuto
        ? `Hotel vinculado a viaje ${form.puntoPartida} - ${form.destino}`
        : `Reserva de hotel en ${form.hotelCiudad}`,
      datos_extra: {
        nombreCompleto: form.nombreCompleto,
        emailCorporativo: form.emailCorporativo,
        sector: form.sector,
        sucursal: form.sucursal,
        habitaciones: Number(form.hotelHabitaciones),
        tipoHabitacion: form.hotelTipoHabitacion,
        huespedes: Number(form.hotelHuespedes),
        distribucion: form.hotelDistribucion,
        personasPorHabitacion: form.hotelPersonasPorHabitacion,
        requisitosEspeciales: form.hotelRequisitos,
        observaciones: form.hotelObservaciones,
        centroCostos: form.centroCostos,
      },
    })
  }

  return items
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

// Calcula el resultado correspondiente.
function SummaryItem({ label, value }: { label: string; value?: string | number | boolean }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value ? String(value) : 'No informado'}</strong>
    </div>
  )
}

// Gestiona la operacion NewRequestPage.
export function NewRequestPage({ defaultTipoReserva }: { defaultTipoReserva?: FormData['tipoReserva'] }) {
  const { token, user } = useAuth()
  const { pathname } = useLocation()
  const pageHero = PAGE_HERO_BY_PATH[pathname] ?? PAGE_HERO_BY_PATH['/solicitar']
  const [step, setStep] = useState<Step>('detalles')
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    nombreCompleto: user.name,
    emailCorporativo: user.email || '',
    tipoReserva: defaultTipoReserva ?? 'auto',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudDTO[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [showValidation, setShowValidation] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfile(token)
      .then((profile) => {
        if (cancelled) return
        setForm((prev) => ({
          ...prev,
          nombreCompleto: profile.nombreCompleto || prev.nombreCompleto,
          emailCorporativo: profile.emailEmpresa || prev.emailCorporativo,
          sector: profile.sector || prev.sector,
          sucursal: profile.sucursal || prev.sucursal,
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
        if (!cancelled) setMisSolicitudes(res.data || [])
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
  const canContinue = Object.keys(errors).length === 0
  // Actualiza los datos correspondientes.
  const setValue = (key: keyof FormData) => (value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Limpia el estado o los datos correspondientes.
  const resetForm = () => {
    setForm({ ...initialForm, nombreCompleto: user.name, emailCorporativo: user.email || '' })
    setStep('detalles')
    setError('')
  }

  // Gestiona la accion correspondiente.
  const handleSubmit = async () => {
    setShowValidation(true)
    if (!canContinue) return
    setLoading(true)
    setError('')
    try {
      const items = buildPayload(form)
      await requestsService.create(items.length === 1 ? items[0] : { items })
      setSubmitted(true)
    } catch (err) {
      console.error('Error al crear solicitud:', err)
      setError('No se pudo enviar la solicitud. Intentá de nuevo más tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Gestiona la accion correspondiente.
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await requestsService.remove(deleteId)
      setMisSolicitudes((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
    } catch {
      setError('No se pudo eliminar la solicitud.')
    } finally {
      setDeleting(false)
    }
  }

  if (submitted) {
    return (
      <div className="page-root">
        <section className="request-success">
          <CheckCircle size={42} />
          <h2>Solicitud enviada</h2>
          <p>Tu pedido fue registrado correctamente. Administración revisará la información y te notificará el resultado.</p>
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
        eyebrow={pageHero.eyebrow}
        title={pageHero.title}
        description={pageHero.description}
      />

      <div className="request-stepper" aria-label="Progreso de solicitud">
        <span className={step === 'detalles' ? 'active' : 'done'}>1. Detalles</span>
        <span className={step === 'confirmacion' ? 'active' : ''}>2. Resumen</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22 }}
        >
          {step === 'detalles' && (
            <div className="request-form-grid">
              {form.tipoReserva !== 'viaticos' ? (
                <PremiumCard title="Tipo de solicitud" eyebrow="Seleccioná qué necesitás" icon={Route}>
                  <div className="request-type-grid">
                    {[
                      { id: 'auto' as const, label: 'Solo Auto', detail: 'Vehículo y viaje' },
                      { id: 'hotel' as const, label: 'Solicitar hotel', detail: 'Reserva de alojamiento' },
                      { id: 'ambos' as const, label: 'Solicitar auto y hotel', detail: 'Vehículo y alojamiento' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`request-type-card ${form.tipoReserva === option.id ? 'active' : ''}`}
                        onClick={() => setValue('tipoReserva')(option.id)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </PremiumCard>
              ) : null}

              <PremiumCard title="Solicitante" eyebrow="Datos corporativos" icon={Users}>
                <div className="grid-2">
                  <FormInput label="Nombre completo" value={form.nombreCompleto} onChange={setValue('nombreCompleto')} error={visibleErrors.nombreCompleto} />
                  <FormInput label="Email corporativo o personal" type="email" value={form.emailCorporativo} onChange={setValue('emailCorporativo')} error={visibleErrors.emailCorporativo} />
                  <FormInput label="Sector" value={form.sector} onChange={setValue('sector')} error={visibleErrors.sector} />
                  <FormInput label="Sucursal" value={form.sucursal} onChange={setValue('sucursal')} error={visibleErrors.sucursal} />
                </div>
              </PremiumCard>

              {(form.tipoReserva === 'viaticos') ? (
              <PremiumCard title="Viáticos" eyebrow="Solicitud de viáticos" icon={WalletCards}>
                <div className="grid-2">
                  <FormInput label="Destino" value={form.destino} onChange={setValue('destino')} error={visibleErrors.destino} />
                  <FormInput label="Fecha" type="date" value={form.fechaIda} onChange={setValue('fechaIda')} error={visibleErrors.fechaIda} />
                  <FormInput label="Monto estimado" type="number" value={form.montoEstimado} onChange={setValue('montoEstimado')} error={visibleErrors.montoEstimado} />
                  <FormInput label="Fecha de regreso" type="date" value={form.fechaRegreso} onChange={setValue('fechaRegreso')} />
                </div>
                <label className="form-field request-wide">
                  <span className="form-label">Motivo / justificación</span>
                  <textarea className={`form-input ${visibleErrors.motivo ? 'invalid' : ''}`} rows={4} value={form.motivo} onChange={(e) => setValue('motivo')(e.target.value)} />
                  {visibleErrors.motivo && <small className="form-feedback">{visibleErrors.motivo}</small>}
                </label>
              </PremiumCard>
              ) : (
              <>
                {(form.tipoReserva === 'auto' || form.tipoReserva === 'ambos') && (
                <PremiumCard title="Viaje" eyebrow="Recorrido y motivo" icon={Route}>
                  <div className="grid-2">
                    <FormInput label="Punto de partida" value={form.puntoPartida} onChange={setValue('puntoPartida')} error={visibleErrors.puntoPartida} />
                    <FormInput label="Destino" value={form.destino} onChange={setValue('destino')} error={visibleErrors.destino} />
                    <FormInput label="Fecha de ida" type="date" value={form.fechaIda} onChange={setValue('fechaIda')} error={visibleErrors.fechaIda} />
                    <FormInput label="Fecha de regreso" type="date" value={form.fechaRegreso} onChange={setValue('fechaRegreso')} error={visibleErrors.fechaRegreso} />
                    <FormInput label="Horario de salida" type="time" value={form.horarioSalida} onChange={setValue('horarioSalida')} error={visibleErrors.horarioSalida} />
                    <FormInput label="Horario de regreso" type="time" value={form.horarioRegreso} onChange={setValue('horarioRegreso')} />
                    <label className="form-field">
                      <span className="form-label">Tipo de viaje</span>
                      <select className="form-input" value={form.tipoViaje} onChange={(e) => setValue('tipoViaje')(e.target.value)}>
                        <option>Ida y vuelta</option>
                        <option>Solo ida</option>
                        <option>Multidestino</option>
                      </select>
                    </label>
                  </div>
                  <label className="form-field request-wide">
                    <span className="form-label">Motivo del viaje</span>
                    <textarea className={`form-input ${visibleErrors.motivo ? 'invalid' : ''}`} rows={4} value={form.motivo} onChange={(e) => setValue('motivo')(e.target.value)} />
                    {visibleErrors.motivo && <small className="form-feedback">{visibleErrors.motivo}</small>}
                  </label>
                </PremiumCard>
                )}

                {(form.tipoReserva === 'auto' || form.tipoReserva === 'ambos') && (
                <PremiumCard title="Vehículo y pasajeros" eyebrow="Preferencias" icon={Car}>
                  <div className="grid-2">
                    <FormInput label="Cantidad de personas" type="number" value={form.cantidadPersonas} onChange={setValue('cantidadPersonas')} error={visibleErrors.cantidadPersonas} />
                    <FormInput label="Acompañantes" value={form.acompanantes} onChange={setValue('acompanantes')} placeholder="Nombres separados por coma" />
                  </div>
                </PremiumCard>
                )}

                {(form.tipoReserva === 'hotel' || form.tipoReserva === 'ambos') && (
                <PremiumCard title="Hotel" eyebrow={form.tipoReserva === 'hotel' ? 'Reserva' : 'Alojamiento'} icon={Hotel}>
                  <div className="hotel-section grid-2">
                    <FormInput label="Destino (ciudad)" value={form.hotelCiudad} onChange={setValue('hotelCiudad')} error={visibleErrors.hotelCiudad} />
                    <FormInput label="Cantidad de habitaciones" type="number" value={form.hotelHabitaciones} onChange={setValue('hotelHabitaciones')} error={visibleErrors.hotelHabitaciones} />
                    <FormInput label="Fecha de entrada" type="date" value={form.hotelCheckIn} onChange={setValue('hotelCheckIn')} error={visibleErrors.hotelCheckIn} />
                    <FormInput label="Fecha de salida" type="date" value={form.hotelCheckOut} onChange={setValue('hotelCheckOut')} error={visibleErrors.hotelCheckOut} />
                    <label className="form-field">
                      <span className="form-label">Tipo de habitación</span>
                      <select className="form-input" value={form.hotelTipoHabitacion} onChange={(e) => setValue('hotelTipoHabitacion')(e.target.value)}>
                        <option>Single</option>
                        <option>Doble</option>
                        <option>Triple</option>
                        <option>Suite</option>
                      </select>
                    </label>
                    <FormInput label="Cantidad de personas" type="number" value={form.hotelHuespedes} onChange={setValue('hotelHuespedes')} error={visibleErrors.hotelHuespedes} />
                    <FormInput label="Distribución por habitación" value={form.hotelDistribucion} onChange={setValue('hotelDistribucion')} error={visibleErrors.hotelDistribucion} />
                    <FormInput label="Personas por habitación" value={form.hotelPersonasPorHabitacion} onChange={setValue('hotelPersonasPorHabitacion')} error={visibleErrors.hotelPersonasPorHabitacion} />
                    <FormInput label="Requisitos especiales" value={form.hotelRequisitos} onChange={setValue('hotelRequisitos')} />
                    <FormInput label="Observaciones" value={form.hotelObservaciones} onChange={setValue('hotelObservaciones')} />
                  </div>
                </PremiumCard>
                )}
              </>
              )}

              <div className="request-actions">
                {!canContinue && showValidation && (
                  <span>Completá los campos obligatorios antes de continuar.</span>
                )}
                <button
                  type="button"
                  className="btn btn-md btn-primary-fill"
                  onClick={() => {
                    setShowValidation(true)
                    if (canContinue) setStep('confirmacion')
                  }}
                >
                  Ver resumen
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'confirmacion' && (
            <PremiumCard title="Resumen previo" eyebrow="Confirmación" icon={CheckCircle}>
              <div className="request-summary">
                <SummaryItem label="Solicitante" value={form.nombreCompleto} />
                <SummaryItem label="Email" value={form.emailCorporativo} />
                <SummaryItem label="Sector" value={form.sector} />
                <SummaryItem label="Sucursal" value={form.sucursal} />
                {form.tipoReserva === 'viaticos' ? (
                  <>
                    <SummaryItem label="Tipo" value="Viáticos" />
                    <SummaryItem label="Destino" value={form.destino} />
                    <SummaryItem label="Fechas" value={`${form.fechaIda} - ${form.fechaRegreso || form.fechaIda}`} />
                    <SummaryItem label="Monto estimado" value={form.montoEstimado} />
                    <SummaryItem label="Motivo" value={form.motivo} />
                  </>
                ) : (
                  <>
                    <SummaryItem label="Tipo" value={form.tipoReserva === 'auto' ? 'Solo Auto' : form.tipoReserva === 'hotel' ? 'Solo Hotel' : 'Auto + Hotel'} />
                    {(form.tipoReserva === 'auto' || form.tipoReserva === 'ambos') && (
                      <>
                        <SummaryItem label="Origen" value={form.puntoPartida} />
                        <SummaryItem label="Destino" value={form.destino} />
                        <SummaryItem label="Fechas" value={`${form.fechaIda} - ${form.fechaRegreso || form.fechaIda}`} />
                        <SummaryItem label="Horarios" value={`${form.horarioSalida} - ${form.horarioRegreso || 'sin regreso'}`} />
                        <SummaryItem label="Personas" value={form.cantidadPersonas} />
                        <SummaryItem label="Acompañantes" value={form.acompanantes} />
                        <SummaryItem label="Motivo" value={form.motivo} />
                      </>
                    )}
                    {(form.tipoReserva === 'hotel' || form.tipoReserva === 'ambos') && (
                      <>
                        <SummaryItem label="Hotel" value={`${form.hotelCiudad} · ${form.hotelCheckIn} - ${form.hotelCheckOut}`} />
                        <SummaryItem label="Habitaciones" value={`${form.hotelHabitaciones} ${form.hotelTipoHabitacion}`} />
                        <SummaryItem label="Huéspedes" value={form.hotelHuespedes} />
                        <SummaryItem label="Distribución" value={form.hotelDistribucion} />
                      </>
                    )}
                  </>
                )}
              </div>

              {error && <p className="form-feedback" style={{ marginTop: 14 }}>No se pudo enviar la solicitud. Revisá tu sesión o intentá de nuevo.</p>}

              <div className="modal-actions">
                <button type="button" className="btn btn-md btn-ghost" onClick={() => setStep('detalles')}>
                  <ArrowLeft size={16} />
                  Editar
                </button>
                <button type="button" className="btn btn-md btn-primary-fill" onClick={handleSubmit} disabled={loading || !canContinue}>
                  {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </PremiumCard>
          )}
        </motion.div>
      </AnimatePresence>

      <PremiumCard title="Seguimiento de solicitudes" eyebrow="Estados" icon={CheckCircle}>
        <div className="status-track request-status-track">
          <span className="active">Pendiente</span>
          <span>En revisión</span>
          <span>Aprobada</span>
          <span>Rechazada</span>
        </div>
        {loadingList ? (
          <p className="muted-copy">Cargando...</p>
        ) : misSolicitudes.length === 0 ? (
          <p className="muted-copy">Todavía no enviaste solicitudes.</p>
        ) : (
          <div className="request-list">
            {misSolicitudes.slice(0, 6).map((sol) => (
              <div key={sol.id} className="request-list-row">
                <div>
                  <strong>{sol.tipo === 'auto' ? 'Vehículo' : sol.tipo}</strong>
                  <span>{sol.descripcion || sol.destino || 'Sin descripción'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <em className={`state-${sol.estado}`}>{estadoLabels[sol.estado] || sol.estado}</em>
                  {(sol.estado === 'pendiente' || sol.estado === 'en_revision') && (
                    <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(sol.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>

      <ConfirmDialog
        open={deleteId != null}
        title="¿Eliminar solicitud?"
        description="Se eliminará permanentemente esta solicitud pendiente."
        confirmLabel="Eliminar"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
