const { randomUUID } = require('crypto')
const supabase = require('../config/supabase')
const { notifyAdminsNewSolicitud, notifyEmpleadoSolicitudResuelta } = require('./notificaciones.service')
const { sendSolicitudNotification } = require('./emailService')
const { syncEligibleRendiciones, listRendicionSolicitudes, getRendicionById, resolveRendicion, mapRendicionToSolicitud } = require('./rendiciones.service')

const VALID_TIPOS = ['viaticos', 'hotel', 'auto', 'anticipo', 'rendicion_viaticos']
const VALID_ESTADOS = ['pendiente', 'en_revision', 'aprobada', 'rechazada']

const EMPLEADO_SELECT = 'id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo'

const TABLE_BY_TIPO = {
  viaticos: 'viaticos',
  anticipo: 'viaticos',
  hotel: 'reservas_hotel',
  auto: 'reservas_vehiculos',
}

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
  }
}

// Gestiona la operacion extractDatosExtra.
function extractDatosExtra(motivo, rowExtra) {
  if (rowExtra && typeof rowExtra === 'object' && Object.keys(rowExtra).length) {
    return rowExtra
  }
  const match = String(motivo || '').match(/\[datos_extra\]([\s\S]*?)\[\/datos_extra\]/)
  if (!match) return {}
  try {
    return JSON.parse(match[1])
  } catch {
    return {}
  }
}

// Gestiona la operacion stripDatosExtra.
function stripDatosExtra(motivo) {
  return String(motivo || '').replace(/\n?\[datos_extra\][\s\S]*?\[\/datos_extra\]/g, '').trim()
}

// Crea el registro o elemento correspondiente.
function appendDatosExtra(motivo, datosExtra) {
  const base = stripDatosExtra(motivo)
  if (!datosExtra || !Object.keys(datosExtra).length) return base
  return `${base}\n\n[datos_extra]${JSON.stringify(datosExtra)}[/datos_extra]`.trim()
}

// Gestiona la operacion extractGrupoId.
function extractGrupoId(motivo) {
  const match = String(motivo || '').match(/\[grupo:([^\]]+)\]/)
  return match ? match[1] : null
}

// Gestiona la operacion stripGrupoPrefix.
function stripGrupoPrefix(motivo) {
  return String(motivo || '').replace(/^\[grupo:[^\]]+\]\s*/, '').trim()
}

// Gestiona la operacion extractAdminComment.
function extractAdminComment(motivo) {
  const matches = [...String(motivo || '').matchAll(/\[Admin\]:\s*([^\n]+)/g)]
  return matches.length ? matches[matches.length - 1][1].trim() : null
}

// Gestiona la operacion stripAdminComments.
function stripAdminComments(motivo) {
  return String(motivo || '')
    .replace(/\n\n\[Admin\]:[^\n]*/g, '')
    .trim()
}

// Gestiona la operacion detectAnticipo.
function detectAnticipo(motivo) {
  return String(motivo || '').startsWith('[anticipo]')
}

// Procesa los elementos de la coleccion.
function mapViatico(row) {
  // Nuevo esquema Viaticos directo a columnas
  return {
    id: `viaticos:${row.id}`,
    empleado_id: row.empleado_id,
    tipo: 'viaticos',
    estado: row.estado,
    fecha_desde: row.fecha_inicio || row.fecha_necesaria,
    fecha_hasta: row.fecha_finalizacion,
    destino: row.destino_viaje,
    descripcion: row.motivo_viaje || row.motivo,
    monto_estimado: row.monto_total != null ? Number(row.monto_total) : (row.monto_estimado != null ? Number(row.monto_estimado) : null),
    justificacion: row.motivo_solicitud || row.justificacion,
    comentario_admin: row.motivo_rechazo || extractAdminComment(row.observaciones) || null,
    grupo_id: null,
    datos_extra: {
      nombre: row.nombre_completo || row.nombre,
      email: row.correo || row.email,
      area: row.area,
      motivo_solicitud: row.motivo_solicitud,
      destino: row.destino_viaje,
      motivo_viaje: row.motivo_viaje,
      personas_viajan: row.personas_viajan,
      medio_transporte: row.medio_transporte,
      fecha_inicio: row.fecha_necesaria || row.fecha_inicio,
      fecha_finalizacion: row.fecha_finalizacion,
      monto_total: row.monto_total,
      destino_viaticos: row.destino_viaticos,
      monto_solicitar: row.monto_solicitar,
      updated_at: row.updated_at
    },
    created_at: row.created_at,
    solicitante: mapEmpleado(row.empleados) || {
      id: row.empleado_id,
      nombre: row.nombre_completo || row.nombre,
      email: row.correo || row.email,
      area: row.area,
      sucursal: null,
      cargo: null,
      legajo: null
    },
  }
}

// Procesa los elementos de la coleccion.
function mapHotel(row) {
  return {
    id: `hotel:${row.id}`,
    empleado_id: row.empleado_id,
    tipo: 'hotel',
    estado: row.estado,
    fecha_desde: row.fecha_desde,
    fecha_hasta: row.fecha_hasta,
    destino: row.ciudad,
    descripcion: stripAdminComments(stripDatosExtra(stripGrupoPrefix(row.motivo))),
    monto_estimado: null,
    justificacion: null,
    comentario_admin: extractAdminComment(row.motivo),
    grupo_id: extractGrupoId(row.motivo),
    datos_extra: extractDatosExtra(row.motivo, row.datos_extra),
    created_at: row.created_at,
    solicitante: mapEmpleado(row.empleados),
  }
}

// Procesa los elementos de la coleccion.
function mapAuto(row) {
  const datosExtra = extractDatosExtra(row.motivo, row.datos_extra)
  return {
    id: `auto:${row.id}`,
    empleado_id: row.empleado_id,
    tipo: 'auto',
    estado: row.estado,
    fecha_desde: row.fecha_desde,
    fecha_hasta: row.fecha_hasta,
    destino: row.destino,
    descripcion: stripAdminComments(stripDatosExtra(stripGrupoPrefix(row.motivo))),
    monto_estimado: null,
    justificacion: null,
    comentario_admin: extractAdminComment(row.motivo),
    grupo_id: extractGrupoId(row.motivo),
    datos_extra: { vehiculo_id: row.vehiculo_id || null, ...datosExtra },
    created_at: row.created_at,
    solicitante: mapEmpleado(row.empleados),
  }
}

// Prepara el valor para su uso.
function parseCompositeId(raw) {
  const s = String(raw || '')
  const idx = s.indexOf(':')
  if (idx === -1) return null

  const tipo = s.slice(0, idx)
  const id = Number(s.slice(idx + 1))
  if (!VALID_TIPOS.includes(tipo) || !Number.isFinite(id)) return null

  if (tipo === 'rendicion_viaticos') {
    return { tipo, id, table: 'viaticos_rendiciones' }
  }

  return { tipo, id, table: TABLE_BY_TIPO[tipo] }
}

// Prepara el valor para su uso.
function normalizeTipo(raw) {
  const tipo = String(raw || '').trim().toLowerCase()
  if (!VALID_TIPOS.includes(tipo)) {
    const err = new Error('invalid_tipo')
    err.code = 'invalid_tipo'
    throw err
  }
  return tipo
}

// Construye el valor o recurso necesario.
function buildMotivo(tipo, descripcion, justificacion, grupoId) {
  const parts = []
  if (grupoId) parts.push(`[grupo:${grupoId}]`)
  if (tipo === 'anticipo') parts.push('[anticipo]')
  parts.push(String(descripcion || '').trim())
  if (justificacion) parts.push(`\n\nJustificación: ${justificacion}`)
  return parts.join(' ').trim()
}

// Construye el valor o recurso necesario.
function buildInsertRow(empleadoId, payload, grupoId = null) {
  const tipo = normalizeTipo(payload.tipo)

  if (tipo === 'viaticos') {
    if (!payload.fecha_necesaria) {
      console.error('[solicitudes.service] Falta fecha_necesaria en payload de Viaticos:', payload)
      const err = new Error('missing_fields')
      err.code = 'missing_fields'
      throw err
    }

    // Nuevo esquema Viaticos mapeando a las columnas fisicas creadas en Supabase
    return {
      table: 'viaticos',
      tipo,
      row: {
        empleado_id: empleadoId,
        fecha_necesaria: payload.fecha_necesaria, // <- NOT NULL en DB
        motivo: payload.motivo_viaje || payload.motivo_solicitud || 'Viáticos', // <- Probablemente NOT NULL
        monto: payload.monto_total || payload.monto_solicitar || 0, // <- Probablemente NOT NULL
        correo: payload.email || null,
        nombre_completo: payload.nombre || null,
        area: payload.area || null,
        motivo_solicitud: payload.motivo_solicitud || null,
        destino_viaje: payload.destino || null,
        motivo_viaje: payload.motivo_viaje || null,
        personas_viajan: payload.personas_viajan || null,
        medio_transporte: payload.medio_transporte || null,
        fecha_inicio: payload.fecha_necesaria || null, // Se guardaba aca antes
        fecha_finalizacion: payload.fecha_finalizacion || null,
        monto_total: payload.monto_total || null,
        destino_viaticos: payload.destino_viaticos || null,
        monto_solicitar: payload.monto_solicitar || null,
        estado: 'Pendiente',
        updated_at: new Date().toISOString()
      }
    }
  }

  const descripcion = String(payload.descripcion || payload.description || '').trim()
  const fechaDesde = payload.fecha_desde || payload.startDate || null
  const fechaHasta = payload.fecha_hasta || payload.endDate || null
  const destino = String(payload.destino || payload.destination || '').trim()
  const justificacion = String(payload.justificacion || payload.justification || '').trim()

  if (!descripcion && !destino) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const motivo = buildMotivo(tipo, descripcion || destino, justificacion, grupoId)
  const datosExtra = payload.datos_extra && typeof payload.datos_extra === 'object' ? payload.datos_extra : null
  const motivoWithExtra = appendDatosExtra(motivo, datosExtra)

  if (tipo === 'hotel') {
    return {
      table: 'reservas_hotel',
      tipo,
      row: {
        empleado_id: empleadoId,
        ciudad: destino || descripcion,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        motivo: motivoWithExtra,
        estado: 'pendiente',
        ...(datosExtra ? { datos_extra: datosExtra } : {}),
      },
    }
  }

  if (tipo === 'auto') {
    return {
      table: 'reservas_vehiculos',
      tipo,
      row: {
        empleado_id: empleadoId,
        vehiculo_id: null,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        destino: destino || descripcion,
        motivo: motivoWithExtra,
        estado: 'pendiente',
        ...(datosExtra ? { datos_extra: datosExtra } : {}),
      },
    }
  }

  const monto = payload.monto_estimado != null
    ? Number(payload.monto_estimado)
    : payload.amount != null && payload.amount !== ''
      ? Number(payload.amount)
      : null

  return {
    table: 'viaticos',
    tipo,
    row: {
      empleado_id: empleadoId,
      destino: destino || null,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      monto_estimado: monto,
      justificacion: justificacion || null,
      motivo: motivoWithExtra,
      estado: 'pendiente',
      ...(datosExtra ? { datos_extra: datosExtra } : {}),
    },
  }
}

// Obtiene los datos necesarios.
async function fetchEmpleadosMap(ids) {
  if (!ids.length) return new Map()

  const { data, error } = await supabase
    .from('empleados')
    .select(EMPLEADO_SELECT)
    .in('id', ids)

  if (error) throw error

  const map = new Map()
  // Recorre los elementos de la coleccion.
  for (const emp of data || []) {
    map.set(emp.id, emp)
  }
  return map
}

// Obtiene los datos necesarios.
async function listFromTable(table, tipo, empleadoId, estado) {
  let query = supabase.from(table).select('*').order('created_at', { ascending: false })

  if (empleadoId) query = query.eq('empleado_id', empleadoId)
  if (estado && estado !== 'todos') {
    if (estado === 'pendiente') {
      query = query.in('estado', ['pendiente', 'Pendiente'])
    } else if (estado === 'aprobada') {
      query = query.in('estado', ['aprobada', 'Aprobado'])
    } else if (estado === 'rechazada') {
      query = query.in('estado', ['rechazada', 'Rechazado'])
    } else {
      query = query.eq('estado', estado)
    }
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const empMap = await fetchEmpleadosMap([...new Set(rows.map((r) => r.empleado_id))])

  return rows.map((row) => {
    const withEmp = { ...row, empleados: empMap.get(row.empleado_id) || null }
    if (table === 'viaticos') return mapViatico(withEmp)
    if (table === 'reservas_hotel') return mapHotel(withEmp)
    return mapAuto(withEmp)
  })
}

// Obtiene los datos necesarios.
async function listSolicitudes({ empleadoId = null, estado = null, isAdmin = false } = {}) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const [viaticos, hoteles, autos] = await Promise.all([
    listFromTable('viaticos', 'viaticos', empleadoId, estado),
    listFromTable('reservas_hotel', 'hotel', empleadoId, estado),
    listFromTable('reservas_vehiculos', 'auto', empleadoId, estado),
  ])

  const rendiciones = isAdmin || empleadoId == null
    ? await listRendicionSolicitudes({ estado })
    : []

  return [...viaticos, ...hoteles, ...autos, ...rendiciones].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

// Obtiene los datos necesarios.
async function getSolicitudById(compositeId, { empleadoId = null, isAdmin = false } = {}) {
  const parsed = parseCompositeId(compositeId)
  if (!parsed) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (parsed.tipo === 'rendicion_viaticos') {
    const rendicion = await getRendicionById(parsed.id, { empleadoId, isAdmin })
    return mapRendicionToSolicitud(rendicion, rendicion.viatico, rendicion.gastos || [])
  }

  const { data: existing, error: fetchError } = await supabase
    .from(parsed.table)
    .select('*')
    .eq('id', parsed.id)
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

  const empMap = await fetchEmpleadosMap([existing.empleado_id])
  const withEmp = { ...existing, empleados: empMap.get(existing.empleado_id) || null }

  if (parsed.table === 'viaticos') return mapViatico(withEmp)
  if (parsed.table === 'reservas_hotel') return mapHotel(withEmp)
  return mapAuto(withEmp)
}

// Gestiona la operacion notifySolicitudCreada.
async function notifySolicitudCreada(solicitud) {
  try {
    await sendSolicitudNotification({
      ...solicitud,
      empleado: solicitud?.solicitante?.nombre || 'Un empleado',
      estado: solicitud?.estado || 'Pendiente',
      fecha: solicitud?.fecha_desde || solicitud?.created_at || new Date().toISOString(),
      descripcion: solicitud?.descripcion || solicitud?.destino || solicitud?.justificacion || 'Sin descripción',
      id: solicitud?.id,
    })
  } catch (error) {
    console.error('[solicitudes.service] Error al enviar correo de solicitud:', error?.stack || error)
  }
}

// Crea el registro o elemento correspondiente.
async function createSolicitudes(empleadoId, body) {
  console.log('[solicitudes.service] createSolicitudes payload recibido:', JSON.stringify(body, null, 2))

  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const items = Array.isArray(body?.items) ? body.items : [body]
  if (items.length === 0) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const grupoId = items.length > 1 ? randomUUID() : null
  const created = []

  // Recorre los elementos de la coleccion.
  for (const item of items) {
    const built = buildInsertRow(empleadoId, item, grupoId)
    const { data, error } = await supabase
      .from(built.table)
      .insert(built.row)
      .select('*')
      .single()

    if (error && String(error.message || '').includes('datos_extra')) {
      const { datos_extra, ...rowWithoutExtra } = built.row
      const { data: retryData, error: retryError } = await supabase
        .from(built.table)
        .insert(rowWithoutExtra)
        .select('*')
        .single()
      if (retryError) {
        console.error('[solicitudes.service] create:', retryError)
        throw retryError
      }
      const empMap = await fetchEmpleadosMap([empleadoId])
      const withEmp = { ...retryData, empleados: empMap.get(empleadoId) || null }
      const mappedItem = built.table === 'viaticos'
        ? mapViatico(withEmp)
        : built.table === 'reservas_hotel'
          ? mapHotel(withEmp)
          : mapAuto(withEmp)
      created.push(mappedItem)
      await notifySolicitudCreada(mappedItem)
      continue
    }

    if (error) {
      console.error('[solicitudes.service] create:', error)
      throw error
    }

    const empMap = await fetchEmpleadosMap([empleadoId])
    const withEmp = { ...data, empleados: empMap.get(empleadoId) || null }

    const mappedItem = built.table === 'viaticos'
      ? mapViatico(withEmp)
      : built.table === 'reservas_hotel'
        ? mapHotel(withEmp)
        : mapAuto(withEmp)

    created.push(mappedItem)
    await notifySolicitudCreada(mappedItem)
  }

  const first = created[0]
  if (first) {
    await notifyAdminsNewSolicitud({
      solicitante: first.solicitante?.nombre || 'Un empleado',
      tipo: created.length > 1 ? 'varias' : first.tipo,
      descripcion: first.descripcion || first.destino || 'Nueva solicitud',
      count: created.length,
    })
  }

  return created
}

// Gestiona la operacion resolveSolicitud.
async function resolveSolicitud(compositeId, { estado, comentario_admin, resueltoPor }) {
  if (!VALID_ESTADOS.includes(estado) || estado === 'pendiente') {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const parsed = parseCompositeId(compositeId)
  if (!parsed) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (parsed.tipo === 'rendicion_viaticos') {
    const rendicionEstado = estado === 'aprobada' ? 'aprobada' : 'devuelta'
    const rendicion = await resolveRendicion(parsed.id, {
      estado: rendicionEstado,
      comentario: comentario_admin,
      resueltoPor,
    })
    return mapRendicionToSolicitud(rendicion, rendicion.viatico, rendicion.gastos || [])
  }

  const { data: existing, error: fetchError } = await supabase
    .from(parsed.table)
    .select('*')
    .eq('id', parsed.id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (existing.estado !== 'pendiente' && existing.estado !== 'Pendiente') {
    const err = new Error('solicitud_already_resolved')
    err.code = 'already_resolved'
    throw err
  }

  let motivo = String(existing.motivo || '')
  let updateData = { estado, motivo }

  // Check if it's the new viaticos schema (by checking if nombre_completo exists)
  if (existing.nombre_completo || existing.correo) {
    const nuevoEstado = estado === 'aprobada' ? 'Aprobado' : estado === 'rechazada' ? 'Rechazado' : 'Pendiente'
    updateData = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    }
    if (nuevoEstado === 'Rechazado' && comentario_admin) {
      updateData.motivo_rechazo = comentario_admin
    }
  } else {
    if (comentario_admin) {
      updateData.motivo = `${motivo}\n\n[Admin]: ${comentario_admin}`.trim()
    } else if (estado === 'aprobada') {
      updateData.motivo = `${motivo}\n\n[Admin]: Solicitud aprobada.`.trim()
    } else if (estado === 'rechazada') {
      updateData.motivo = `${motivo}\n\n[Admin]: Solicitud rechazada.`.trim()
    }
  }

  const { data, error } = await supabase
    .from(parsed.table)
    .update(updateData)
    .eq('id', parsed.id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[solicitudes.service] resolve:', error)
    throw error
  }

  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const empMap = await fetchEmpleadosMap([data.empleado_id])
  const withEmp = { ...data, empleados: empMap.get(data.empleado_id) || null }

  let mapped
  if (parsed.table === 'viaticos') mapped = mapViatico(withEmp)
  else if (parsed.table === 'reservas_hotel') mapped = mapHotel(withEmp)
  else mapped = mapAuto(withEmp)

  await notifyEmpleadoSolicitudResuelta({
    empleadoId: data.empleado_id,
    tipo: parsed.tipo,
    estado,
    comentario: comentario_admin,
    descripcion: mapped.descripcion || mapped.destino || null,
  })

  if (estado === 'aprobada') {
    await notifySolicitudCreada({
      ...mapped,
      estado: 'aprobada',
      etapa: 'aprobada',
    })
  }

  if (parsed.table === 'viaticos' && estado === 'aprobada') {
    try {
      await syncEligibleRendiciones({ viaticoId: parsed.id })
    } catch (syncError) {
      console.error('[solicitudes.service] sync rendicion on approve:', syncError)
    }
  }

  return mapped
}

// Elimina el elemento indicado.
async function removeSolicitud(compositeId, { empleadoId = null, isAdmin = false } = {}) {
  const parsed = parseCompositeId(compositeId)
  if (!parsed) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (parsed.tipo === 'rendicion_viaticos') {
    const err = new Error('cannot_delete_resolved')
    err.code = 'cannot_delete_resolved'
    throw err
  }

  const { data: existing, error: fetchError } = await supabase
    .from(parsed.table)
    .select('*')
    .eq('id', parsed.id)
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

  if (!isAdmin && existing.estado !== 'pendiente' && existing.estado !== 'en_revision' && existing.estado !== 'Pendiente') {
    const err = new Error('cannot_delete_resolved')
    err.code = 'cannot_delete_resolved'
    throw err
  }

  const { error } = await supabase.from(parsed.table).delete().eq('id', parsed.id)
  if (error) throw error

  return { success: true }
}

module.exports = {
  VALID_TIPOS,
  listSolicitudes,
  getSolicitudById,
  createSolicitudes,
  resolveSolicitud,
  removeSolicitud,
}
