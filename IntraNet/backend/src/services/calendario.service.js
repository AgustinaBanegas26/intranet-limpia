const { listSolicitudes } = require('./solicitudes.service')
const { listAusencias } = require('./ausencias.service')
const { listAdelantos } = require('./adelantos.service')

const CALENDAR_TIPOS = new Set(['viaticos', 'hotel', 'auto', 'rendicion_viaticos'])

// Comprueba los datos o la condicion indicada.
function isApproved(estado) {
  return String(estado || '').trim().toLowerCase() === 'aprobada'
    || String(estado || '').trim().toLowerCase() === 'aprobado'
}

/**
 * Convierte las solicitudes que ya administra la aplicación en eventos de
 * calendario. No persiste nada: las tablas de cada solicitud siguen siendo la
 * fuente de verdad.
 */
async function listCalendarEvents() {
  const [solicitudes, ausencias, adelantos] = await Promise.all([
    listSolicitudes({ estado: 'aprobada', isAdmin: true }),
    listAusencias({ estado: 'aprobada' }),
    listAdelantos({ estado: 'aprobada' }),
  ])

  const requestEvents = solicitudes
    .filter((item) => CALENDAR_TIPOS.has(item.tipo) && isApproved(item.estado) && item.fecha_desde)
    .map((item) => ({
      id: item.id,
      tipo: item.tipo,
      estado: 'aprobada',
      fecha_desde: item.fecha_desde,
      fecha_hasta: item.fecha_hasta || item.fecha_desde,
      empleado: item.solicitante?.nombre || 'Empleado',
      destino: item.destino || null,
      descripcion: item.descripcion || null,
      justificacion: item.justificacion || null,
      comentario_admin: item.comentario_admin || null,
      datos_extra: item.datos_extra || {},
    }))

  // Las vacaciones son ausencias con tipo "Vacaciones"; se consultan una sola
  // vez desde ausencias para no duplicar los mismos períodos.
  const absenceEvents = ausencias
    .filter((item) => isApproved(item.estado) && item.fecha_desde)
    .map((item) => {
      const isVacation = String(item.tipo || '').toLowerCase().includes('vacacion')
      return {
        id: `ausencia:${item.id}`,
        tipo: isVacation ? 'vacaciones' : 'ausencias',
        estado: 'aprobada',
        fecha_desde: item.fecha_desde,
        fecha_hasta: item.fecha_hasta || item.fecha_desde,
        empleado: item.solicitante?.nombre || 'Empleado',
        destino: null,
        descripcion: item.motivo || null,
        justificacion: null,
        comentario_admin: null,
        datos_extra: { tipo_ausencia: item.tipo || null },
      }
    })

  // Adelantos no tienen período: se ubican como evento de un día en la fecha
  // real de resolución, que existe al estar aprobados.
  const advanceEvents = adelantos
    .filter((item) => isApproved(item.estado) && item.fecha_resolucion)
    .map((item) => ({
      id: `adelanto:${item.id}`,
      tipo: 'adelantos',
      estado: 'aprobada',
      fecha_desde: item.fecha_resolucion,
      fecha_hasta: item.fecha_resolucion,
      empleado: item.solicitante?.nombre || 'Empleado',
      destino: item.empresa || null,
      descripcion: `Adelanto de ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(item.monto || 0))}`,
      justificacion: null,
      comentario_admin: item.comentario_admin || null,
      datos_extra: { monto: Number(item.monto || 0), empresa: item.empresa || null },
    }))

  return [...requestEvents, ...absenceEvents, ...advanceEvents]
}

module.exports = { listCalendarEvents }
