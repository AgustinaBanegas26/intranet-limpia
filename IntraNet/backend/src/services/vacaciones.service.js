//este archivo se encarga de manejar las vacaciones de empleados en la base de datos,
// y permite listar, crear, actualizar y eliminar solicitudes de vacaciones.
const supabase = require('../config/supabase')
const { createAusencia, listAusencias, assertValidDateRange } = require('./ausencias.service')

const DEFAULT_DIAS_ASIGNADOS = 14

// Obtiene el año calendario actual, usado como período predeterminado del saldo.
function currentYear() {
  return new Date().getFullYear()
}

// Cuenta ambos extremos del período; una solicitud de un mismo día consume un día.
function diffDays(desde, hasta) {
  if (!desde || !hasta) return 1
  const a = new Date(`${desde}T00:00:00`)
  const b = new Date(`${hasta}T00:00:00`)
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

// Lee el saldo anual y calcula los días disponibles; si aún no existe fila, aplica el saldo inicial.
async function getSaldo(empleadoId, anio = currentYear()) {
  const { data, error } = await supabase
    .from('vacaciones_saldo')
    .select('empleado_id, anio, dias_asignados, dias_usados')
    .eq('empleado_id', empleadoId)
    .eq('anio', anio)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      empleado_id: empleadoId,
      anio,
      dias_asignados: DEFAULT_DIAS_ASIGNADOS,
      dias_usados: 0,
      dias_disponibles: DEFAULT_DIAS_ASIGNADOS,
    }
  }

  const asignados = Number(data.dias_asignados ?? DEFAULT_DIAS_ASIGNADOS)
  const usados = Number(data.dias_usados ?? 0)
  return {
    empleado_id: empleadoId,
    anio: data.anio,
    dias_asignados: asignados,
    dias_usados: usados,
    dias_disponibles: Math.max(0, asignados - usados),
  }
}

// Reutiliza el listado de ausencias filtrándolo al tipo vacación para mantener una sola fuente de datos.
async function listVacacionesSolicitudes(empleadoId) {
  return listAusencias({ empleadoId, tipo: 'vacacion' })
}

// Normaliza fechas y motivo, calcula la duración y delega la creación al flujo común de ausencias.
async function createVacacionSolicitud(empleadoId, body) {
  const { fechaDesde, fechaHasta } = assertValidDateRange(
    body.fecha_desde || body.startDate,
    body.fecha_hasta || body.endDate,
  )
  const motivo = String(body.motivo || body.comment || 'Solicitud de vacaciones').trim()
  const dias = diffDays(fechaDesde, fechaHasta)

  return createAusencia(empleadoId, {
    tipo: 'Vacaciones',
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    motivo,
  })
}

// Delega la edición al servicio de ausencias, que valida propiedad y rango de fechas.
async function updateVacacionSolicitud(empleadoId, id, body) {
  return require('./ausencias.service').updateAusencia(id, empleadoId, body)
}

// Elimina la solicitud como empleado no administrador para que se aplique la regla de propiedad.
async function removeVacacionSolicitud(empleadoId, id) {
  return require('./ausencias.service').removeAusencia(id, { empleadoId, isAdmin: false })
}

module.exports = {
  getSaldo,
  listVacacionesSolicitudes,
  createVacacionSolicitud,
  updateVacacionSolicitud,
  removeVacacionSolicitud,
}
