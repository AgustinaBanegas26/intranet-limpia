//este archivo se encarga de manejar los eventos de empleados en la base de datos,
// y permite listar, crear, actualizar, eliminar y gestionar la asistencia a eventos.
const supabase = require('../config/supabase')
const {
  parseSucursalesDestino,
  parseDestinosFromRow,
  isVisibleForEmpleado,
  getEmpleadoSucursal,
} = require('../utils/sucursalTargeting')

// Comprueba los datos o la condicion indicada.
function isEventoActivo(row) {
  if (row.activo === false) return false
  const today = new Date().toISOString().slice(0, 10)
  const fin = String(row.fecha_fin || row.fecha_inicio || '').slice(0, 10)
  return fin >= today
}

// Procesa los elementos de la coleccion.
function mapEvento(row, extra = {}) {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    lugar: row.lugar,
    imagen_url: row.imagen_url || null,
    pdf_url: row.pdf_url || null,
    activo: row.activo !== false,
    creado_por: row.creado_por,
    created_at: row.created_at,
    sucursalesDestino: parseDestinosFromRow(row),
    asistentes: extra.asistentes ?? 0,
    confirmado: Boolean(extra.confirmado),
  }
}

// Obtiene los datos necesarios.
async function getEmpleadoSucursalNorm(empleadoId) {
  return getEmpleadoSucursal(supabase, empleadoId)
}

// Obtiene los datos necesarios.
async function loadAsistenciaMeta(eventoIds, empleadoId) {
  if (!eventoIds.length) return { counts: new Map(), confirmados: new Set() }

  const { data, error } = await supabase
    .from('eventos_asistentes')
    .select('evento_id, empleado_id')
    .in('evento_id', eventoIds)

  if (error) {
    if (String(error.message || '').includes('eventos_asistentes')) {
      return { counts: new Map(), confirmados: new Set() }
    }
    throw error
  }

  const counts = new Map()
  const confirmados = new Set()
  // Recorre los elementos de la coleccion.
  for (const row of data || []) {
    counts.set(row.evento_id, (counts.get(row.evento_id) || 0) + 1)
    if (empleadoId && Number(row.empleado_id) === Number(empleadoId)) {
      confirmados.add(row.evento_id)
    }
  }
  return { counts, confirmados }
}

// Obtiene los datos necesarios.
async function listEventos(empleadoId = null, options = {}) {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('fecha_inicio', { ascending: true })

  if (error) throw error

  const bypassFilter = Boolean(options.bypassFilter)
  const empleadoSucursal = bypassFilter ? null : await getEmpleadoSucursalNorm(empleadoId)

  const rows = (data || []).filter((row) => {
    if (!bypassFilter && !isEventoActivo(row)) return false
    return isVisibleForEmpleado(parseDestinosFromRow(row), empleadoSucursal, bypassFilter)
  })
  const { counts, confirmados } = await loadAsistenciaMeta(rows.map((r) => r.id), empleadoId)

  return rows.map((row) =>
    mapEvento(row, {
      asistentes: counts.get(row.id) || 0,
      confirmado: confirmados.has(row.id),
    }),
  )
}

// Crea el registro o elemento correspondiente.
async function createEvento(body, creadoPor) {
  const titulo = String(body.titulo || body.title || '').trim()
  const fechaInicio = body.fecha_inicio || body.fecha || body.date
  if (!titulo || !fechaInicio) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const sucursalesDestino = parseSucursalesDestino(body)
  if (sucursalesDestino.length === 0) {
    const err = new Error('invalid_sucursales_destino')
    err.code = 'invalid_sucursales_destino'
    throw err
  }

  const insertPayload = {
    titulo,
    descripcion: String(body.descripcion || body.description || '').trim() || null,
    fecha_inicio: fechaInicio,
    fecha_fin: body.fecha_fin || body.fecha_fin || null,
    lugar: body.lugar || body.location || null,
    imagen_url: body.imagen_url || null,
    pdf_url: body.pdf_url || null,
    sucursales_destino: sucursalesDestino,
    creado_por: creadoPor,
  }

  const { data, error } = await supabase
    .from('eventos')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error?.message && error.message.includes('sucursales_destino')) {
    const err = new Error('sucursales_destino_column_missing')
    err.code = 'sucursales_destino_column_missing'
    throw err
  }

  if (error) throw error
  return mapEvento(data, { asistentes: 0, confirmado: false })
}

// Actualiza los datos correspondientes.
async function updateEvento(id, body) {
  const patch = {}
  if (body.titulo != null || body.title != null) patch.titulo = String(body.titulo || body.title).trim()
  if (body.descripcion != null || body.description != null) {
    patch.descripcion = String(body.descripcion || body.description || '').trim() || null
  }
  if (body.fecha_inicio != null || body.fecha != null) patch.fecha_inicio = body.fecha_inicio || body.fecha
  if (body.fecha_fin !== undefined) patch.fecha_fin = body.fecha_fin
  if (body.lugar !== undefined || body.location !== undefined) patch.lugar = body.lugar || body.location || null
  if (body.imagen_url !== undefined) patch.imagen_url = body.imagen_url || null
  if (body.pdf_url !== undefined) patch.pdf_url = body.pdf_url || null
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)

  if (body.sucursales_destino != null || body.sucursalesDestino != null) {
    const destinos = parseSucursalesDestino(body)
    if (destinos.length > 0) patch.sucursales_destino = destinos
  }

  const { data, error } = await supabase.from('eventos').update(patch).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapEvento(data)
}

// Elimina el elemento indicado.
async function removeEvento(id) {
  await supabase.from('eventos_asistentes').delete().eq('evento_id', id)

  const { data, error } = await supabase.from('eventos').delete().eq('id', id).select('id').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

// Alterna el estado correspondiente.
async function toggleEventoRsvp(eventoId, empleadoId) {
  const { data: existing, error: findErr } = await supabase
    .from('eventos_asistentes')
    .select('evento_id')
    .eq('evento_id', eventoId)
    .eq('empleado_id', empleadoId)
    .maybeSingle()

  if (findErr) {
    if (String(findErr.message || '').includes('eventos_asistentes')) {
      const err = new Error('rsvp_unavailable')
      err.code = 'rsvp_unavailable'
      throw err
    }
    throw findErr
  }

  if (existing) {
    const { error } = await supabase
      .from('eventos_asistentes')
      .delete()
      .eq('evento_id', eventoId)
      .eq('empleado_id', empleadoId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('eventos_asistentes')
      .insert({ evento_id: eventoId, empleado_id: empleadoId, confirmado: true })
    if (error) throw error
  }

  const { count, error: countErr } = await supabase
    .from('eventos_asistentes')
    .select('*', { count: 'exact', head: true })
    .eq('evento_id', eventoId)

  if (countErr) throw countErr
  return { confirmado: !existing, asistentes: count || 0 }
}

module.exports = {
  listEventos,
  createEvento,
  updateEvento,
  removeEvento,
  toggleEventoRsvp,
}
