const supabase = require('../config/supabase')
const { notifyAdminsNewAusencia, notifyEmpleadoAusenciaResuelta } = require('./notificaciones.service')
const { sendSolicitudNotification } = require('./emailService')

const VALID_ESTADOS = ['pendiente', 'aprobada', 'rechazada']
const EMPLEADO_SELECT = 'id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo, foto_url'
const TIPO_LLEGADA_TARDE = 'llegada_tarde'

// Procesa los elementos de la coleccion.
function mapEmpleado(emp) {
  if (!emp) return null
  return {
    id: emp.id,
    nombre: `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
    email: emp.email_corporativo || null,
    area: emp.area || null,
    sucursal: emp.sucursal || null,
    cargo: emp.cargo || null,
    legajo: emp.legajo || null,
    foto: emp.foto_url || null,
  }
}

// Gestiona la operacion diffDays.
function diffDays(desde, hasta) {
  if (!desde || !hasta) return 1
  const a = new Date(`${desde}T00:00:00`)
  const b = new Date(`${hasta}T00:00:00`)
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

// Prepara el valor para su uso.
function normalizeDateInput(value) {
  if (value == null || value === '') return null
  const s = String(value).trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  if (d.toISOString().slice(0, 10) !== s) return null
  return s
}

// Gestiona la operacion assertValidDateRange.
function assertValidDateRange(fechaDesde, fechaHasta) {
  const desde = normalizeDateInput(fechaDesde)
  const hasta = normalizeDateInput(fechaHasta)

  if (!desde || !hasta) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  if (hasta < desde) {
    const err = new Error('invalid_date_range')
    err.code = 'invalid_date_range'
    throw err
  }

  return { fechaDesde: desde, fechaHasta: hasta }
}

// Comprueba los datos o la condicion indicada.
function isLlegadaTardeTipo(tipo) {
  const normalized = String(tipo || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
  return normalized === TIPO_LLEGADA_TARDE
}

// Obtiene los datos necesarios.
function getArgentinaTodayIso() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

// Prepara el valor para su uso.
function normalizeTimeInput(value) {
  const time = String(value || '').trim()
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  return time
}

// Gestiona la operacion assertValidTimeRange.
function assertValidTimeRange(horaDesde, horaHasta) {
  const desde = normalizeTimeInput(horaDesde)
  const hasta = normalizeTimeInput(horaHasta)
  if (!desde || !hasta) {
    const err = new Error('invalid_time')
    err.code = 'invalid_time'
    throw err
  }
  if (hasta <= desde) {
    const err = new Error('invalid_time_range')
    err.code = 'invalid_time_range'
    throw err
  }
  return { horaDesde: desde, horaHasta: hasta }
}

// Procesa los elementos de la coleccion.
function mapAusencia(row) {
  return {
    id: row.id,
    empleado_id: row.empleado_id,
    tipo: isLlegadaTardeTipo(row.tipo) ? 'Llegada tarde' : row.tipo || '—',
    fecha_desde: row.fecha_desde,
    fecha_hasta: row.fecha_hasta || row.fecha_desde || null,
    hora_desde: row.hora_desde ? String(row.hora_desde).slice(0, 5) : null,
    hora_hasta: row.hora_hasta ? String(row.hora_hasta).slice(0, 5) : null,
    motivo: row.motivo || '',
    estado: row.estado || 'pendiente',
    aprobada: Boolean(row.aprobada),
    dias: diffDays(row.fecha_desde, row.fecha_hasta || row.fecha_desde),
    created_at: row.created_at,
    archivo_url: row.archivo_url || null,
    archivo_nombre: row.archivo_nombre || null,
    solicitante: mapEmpleado(row.empleados),
  }
}

// Comprueba los datos o la condicion indicada.
function isVigenteAusencia(row, todayIso) {
  if (row.estado !== 'aprobada') return false
  const desde = String(row.fecha_desde || '').slice(0, 10)
  const hasta = String(row.fecha_hasta || row.fecha_desde || '').slice(0, 10)
  return desde <= todayIso && hasta >= todayIso
}

// Comprueba los datos o la condicion indicada.
function isVacacionTipo(tipo) {
  return String(tipo || '').toLowerCase().includes('vacacion')
}

// Obtiene los datos necesarios.
async function fetchEmpleadosMap(ids) {
  if (!ids.length) return new Map()
  const extended = await supabase.from('empleados').select(EMPLEADO_SELECT).in('id', ids)
  if (!extended.error) {
    const map = new Map()
    // Recorre los elementos de la coleccion.
    for (const emp of extended.data || []) map.set(emp.id, emp)
    return map
  }

  const msg = String(extended.error.message || '')
  if (msg.includes('foto_url')) {
    const base = await supabase
      .from('empleados')
      .select('id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo')
      .in('id', ids)
    if (base.error) throw base.error
    const map = new Map()
    // Recorre los elementos de la coleccion.
    for (const emp of base.data || []) map.set(emp.id, emp)
    return map
  }

  throw extended.error
}

// Obtiene los datos necesarios.
async function listAusencias({
  empleadoId = null,
  estado = null,
  tipo = null,
  area = null,
  sucursal = null,
  empleadoQuery = null,
  vigente = false,
  excludeVacaciones = false,
} = {}) {
  let query = supabase.from('ausencias').select('*').order('created_at', { ascending: false })
  if (empleadoId) query = query.eq('empleado_id', empleadoId)
  if (estado && estado !== 'todos') query = query.eq('estado', estado)
  if (tipo) query = query.ilike('tipo', `%${tipo}%`)

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const empMap = await fetchEmpleadosMap([...new Set(rows.map((r) => r.empleado_id))])
  const todayIso = new Date().toISOString().slice(0, 10)
  let results = rows.map((row) => mapAusencia({ ...row, empleados: empMap.get(row.empleado_id) || null }))

  if (excludeVacaciones) {
    results = results.filter((row) => !isVacacionTipo(row.tipo))
  }
  if (area) {
    results = results.filter((row) => String(row.solicitante?.area || '') === area)
  }
  if (sucursal) {
    results = results.filter((row) => String(row.solicitante?.sucursal || '') === sucursal)
  }
  if (empleadoQuery) {
    const q = String(empleadoQuery).trim().toLowerCase()
    results = results.filter((row) => String(row.solicitante?.nombre || '').toLowerCase().includes(q))
  }
  if (vigente) {
    results = results.filter((row) => isVigenteAusencia(row, todayIso))
  }

  return results
}

// Crea el registro o elemento correspondiente.
async function createAusencia(empleadoId, body) {
  const tipo = String(body.tipo || '').trim()
  const motivo = String(body.motivo || body.reason || '').trim()

  if (!tipo || !motivo) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const esLlegadaTarde = isLlegadaTardeTipo(tipo)
  const { fechaDesde, fechaHasta } = esLlegadaTarde
    ? { fechaDesde: getArgentinaTodayIso(), fechaHasta: getArgentinaTodayIso() }
    : assertValidDateRange(
      body.fecha_desde || body.fecha_inicio || body.startDate,
      body.fecha_hasta || body.fecha_fin || body.endDate,
    )
  const horario = esLlegadaTarde
    ? assertValidTimeRange(body.hora_desde, body.hora_hasta)
    : { horaDesde: null, horaHasta: null }

  const { data, error } = await supabase
    .from('ausencias')
    .insert({
      empleado_id: empleadoId,
      tipo,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      motivo,
      hora_desde: horario.horaDesde,
      hora_hasta: horario.horaHasta,
      estado: 'pendiente',
      aprobada: false,
    })
    .select('*')
    .single()

  if (error) throw error

  const empMap = await fetchEmpleadosMap([empleadoId])
  const mapped = mapAusencia({ ...data, empleados: empMap.get(empleadoId) || null })

  try {
    await notifyAdminsNewAusencia({
      solicitante: mapped.solicitante?.nombre || 'Un empleado',
      tipo: mapped.tipo,
      motivo: mapped.motivo,
    })
  } catch (error) {
    console.error('[ausencias.service] Error al notificar admins internos:', error)
  }

  try {
    const categoriaSolicitud = isVacacionTipo(mapped.tipo) ? 'vacaciones' : 'ausencias'
    const descripcion = esLlegadaTarde
      ? `Llegada tarde registrada. Horario: ${mapped.hora_desde} a ${mapped.hora_hasta}. Motivo: ${mapped.motivo}`
      : mapped.motivo || 'Sin observaciones'
    await sendSolicitudNotification({
      ...mapped,
      empleado: mapped.solicitante?.nombre || 'Un empleado',
      tipo: categoriaSolicitud,
      fecha: mapped.fecha_desde || mapped.created_at || new Date().toISOString(),
      descripcion,
      estado: mapped.estado || 'Pendiente',
      id: mapped.id,
    })
  } catch (error) {
    console.error('[ausencias.service] Error al enviar correo de solicitud:', error?.stack || error)
  }

  return mapped
}

// Gestiona la operacion applyVacacionesSaldoOnApprove.
async function applyVacacionesSaldoOnApprove(ausenciaRow) {
  if (!String(ausenciaRow.tipo || '').toLowerCase().includes('vacacion')) return

  const dias = diffDays(ausenciaRow.fecha_desde, ausenciaRow.fecha_hasta)
  const anio = new Date().getFullYear()
  const { data: existing } = await supabase
    .from('vacaciones_saldo')
    .select('dias_asignados, dias_usados')
    .eq('empleado_id', ausenciaRow.empleado_id)
    .eq('anio', anio)
    .maybeSingle()

  const asignados = Number(existing?.dias_asignados ?? 14)
  const usados = Number(existing?.dias_usados ?? 0) + dias

  if (existing) {
    await supabase
      .from('vacaciones_saldo')
      .update({ dias_usados: usados })
      .eq('empleado_id', ausenciaRow.empleado_id)
      .eq('anio', anio)
  } else {
    await supabase.from('vacaciones_saldo').insert({
      empleado_id: ausenciaRow.empleado_id,
      anio,
      dias_asignados: asignados,
      dias_usados: usados,
    })
  }
}

// Gestiona la operacion resolveAusencia.
async function resolveAusencia(id, { estado, comentario, resueltoPor }) {
  if (!VALID_ESTADOS.includes(estado) || estado === 'pendiente') {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const { data: existing, error: fetchError } = await supabase
    .from('ausencias')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  let motivo = String(existing.motivo || '')
  if (comentario) motivo = `${motivo}\n\n[Admin]: ${comentario}`.trim()

  const { data, error } = await supabase
    .from('ausencias')
    .update({
      estado,
      aprobada: estado === 'aprobada',
      motivo,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (estado === 'aprobada') {
    await applyVacacionesSaldoOnApprove(data)
  }

  const empMap = await fetchEmpleadosMap([data.empleado_id])
  const mapped = mapAusencia({ ...data, empleados: empMap.get(data.empleado_id) || null })

  await notifyEmpleadoAusenciaResuelta({
    empleadoId: data.empleado_id,
    tipo: data.tipo,
    estado,
    comentario,
    motivo: data.motivo,
    solicitante: mapped.solicitante?.nombre || 'Un empleado',
  })

  if (estado === 'aprobada') {
    try {
      await sendSolicitudNotification({
        ...mapped,
        empleado: mapped.solicitante?.nombre || 'Un empleado',
        tipo: isVacacionTipo(mapped.tipo) ? 'vacaciones' : 'ausencias',
        fecha: mapped.fecha_desde || mapped.created_at || new Date().toISOString(),
        descripcion: mapped.motivo || 'Sin observaciones',
        estado: 'aprobada',
        etapa: 'aprobada',
        id: mapped.id,
      })
    } catch (emailErr) {
      console.error('[ausencias.service] Error al enviar correo de aprobación:', emailErr?.stack || emailErr)
    }
  }

  return mapped
}

// Elimina el elemento indicado.
async function removeAusencia(id, { empleadoId = null, isAdmin = false } = {}) {
  const { data: existing, error: fetchError } = await supabase
    .from('ausencias')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!isAdmin && Number(existing.empleado_id) !== Number(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  if (existing.estado !== 'pendiente') {
    const err = new Error('cannot_delete_resolved')
    err.code = 'cannot_delete_resolved'
    throw err
  }

  const { error } = await supabase.from('ausencias').delete().eq('id', id)
  if (error) throw error

  return { success: true }
}

// Actualiza los datos correspondientes.
async function updateAusencia(id, empleadoId, body, { isAdmin = false } = {}) {
  const { data: existing, error: fetchError } = await supabase
    .from('ausencias')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!isAdmin && Number(existing.empleado_id) !== Number(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  if (existing.estado !== 'pendiente') {
    const err = new Error('cannot_edit_resolved')
    err.code = 'cannot_edit_resolved'
    throw err
  }

  const patch = {}
  if (body.fecha_desde != null || body.fecha_hasta != null) {
    const { fechaDesde, fechaHasta } = assertValidDateRange(
      body.fecha_desde != null ? body.fecha_desde : existing.fecha_desde,
      body.fecha_hasta != null ? body.fecha_hasta : existing.fecha_hasta,
    )
    patch.fecha_desde = fechaDesde
    patch.fecha_hasta = fechaHasta
  }
  if (body.motivo != null || body.comment != null) {
    patch.motivo = String(body.motivo || body.comment || '').trim()
  }

  const { data, error } = await supabase
    .from('ausencias')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const empMap = await fetchEmpleadosMap([data.empleado_id])
  return mapAusencia({ ...data, empleados: empMap.get(data.empleado_id) || null })
}

module.exports = {
  listAusencias,
  createAusencia,
  resolveAusencia,
  removeAusencia,
  updateAusencia,
  assertValidDateRange,
  assertValidTimeRange,
  isLlegadaTardeTipo,
  getArgentinaTodayIso,
}
