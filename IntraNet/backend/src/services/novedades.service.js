// Servicio del backend: concentra reglas de negocio y acceso a datos para este dominio; las rutas HTTP delegan aquí las operaciones. Tema específico: novedades.service.
const supabase = require('../config/supabase')
const { notifyNovedadPublished } = require('./notificaciones.service')
const {
  parseSucursalesDestino,
  parseDestinosFromRow,
  isVisibleForEmpleado,
  getEmpleadoSucursal,
} = require('../utils/sucursalTargeting')

const ADMIN_DESTACADO_DIAS_DEFAULT = 7

const NOVEDADES_SELECT = `
  id, titulo, contenido, imagen_url, archivo_url, archivo_nombre,
  encuesta_pregunta, encuesta_opciones, destacado_admin_hasta, sucursales_destino,
  publicado_por, created_at, importante, activo,
  empleados:publicado_por (nombre, apellido, foto_url, sucursal, area)
`

const NOVEDADES_SELECT_NO_SUCURSAL = `
  id, titulo, contenido, imagen_url, archivo_url, archivo_nombre,
  encuesta_pregunta, encuesta_opciones, destacado_admin_hasta,
  publicado_por, created_at, importante, activo,
  empleados:publicado_por (nombre, apellido, foto_url, sucursal, area)
`

const NOVEDADES_SELECT_BASE = `
  id, titulo, contenido, imagen_url, publicado_por, created_at, importante, activo,
  empleados:publicado_por (nombre, apellido, foto_url, sucursal, area)
`

// Procesa los elementos de la coleccion.
function mapAuthorMeta(empleado) {
  if (!empleado) {
    return {
      autor: 'Administración',
      autorFoto: null,
      autorSucursal: null,
      autorSector: null,
    }
  }
  return {
    autor: `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || 'Administración',
    autorFoto: empleado.foto_url || null,
    autorSucursal: empleado.sucursal || null,
    autorSector: empleado.area || null,
  }
}

// Procesa los elementos de la coleccion.
function mapAuthor(empleado) {
  return mapAuthorMeta(empleado).autor
}

// Prepara el valor para su uso.
function parseOpciones(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Procesa los elementos de la coleccion.
function mapArchivo(row) {
  if (!row.archivo_url) return null
  return {
    url: row.archivo_url,
    nombre: row.archivo_nombre || 'Archivo adjunto',
    tipo: 'application/octet-stream',
  }
}

// Construye el valor o recurso necesario.
function buildEncuestaFromRow(row, voteCounts = {}, miVoto = null) {
  const pregunta = row.encuesta_pregunta
  const opcionesRaw = parseOpciones(row.encuesta_opciones)

  if (!pregunta || opcionesRaw.length === 0) return null

  const opciones = opcionesRaw.map((op) => {
    const id = String(op.id ?? op.texto ?? '')
    return {
      id,
      texto: op.texto || '',
      votos: voteCounts[id] || 0,
    }
  })

  const totalVotos = opciones.reduce((sum, op) => sum + op.votos, 0)

  return {
    pregunta,
    opciones,
    totalVotos,
    miVoto,
  }
}

// Procesa los elementos de la coleccion.
function mapNovedad(row, likeCount = 0, liked = false, encuesta = null) {
  const author = mapAuthorMeta(row.empleados)
  return {
    id: row.id,
    titulo: row.titulo,
    contenido: row.contenido,
    autor: author.autor,
    autorFoto: author.autorFoto,
    autorSucursal: author.autorSucursal,
    autorSector: author.autorSector,
    publicadoPor: row.publicado_por,
    importante: Boolean(row.importante),
    fecha: row.created_at,
    likes: likeCount,
    liked,
    imagenes: row.imagen_url ? [row.imagen_url] : [],
    archivo: mapArchivo(row),
    encuesta,
    destacadoAdminHasta: row.destacado_admin_hasta || null,
    sucursalesDestino: parseDestinosFromRow(row),
  }
}

// Obtiene los datos necesarios.
async function getEmpleadoSucursalNorm(empleadoId) {
  return getEmpleadoSucursal(supabase, empleadoId)
}

// Construye el valor o recurso necesario.
function buildDestacadoHasta(dias = ADMIN_DESTACADO_DIAS_DEFAULT) {
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + dias)
  return hasta.toISOString()
}

// Construye el valor o recurso necesario.
function buildEncuestaOpciones(encuesta) {
  if (!encuesta?.pregunta || !Array.isArray(encuesta.opciones)) return null

  const opciones = encuesta.opciones
    .map((texto, index) => ({
      id: String(index + 1),
      texto: String(texto || '').trim(),
    }))
    .filter((op) => op.texto.length > 0)

  if (opciones.length < 2) return null

  return {
    pregunta: String(encuesta.pregunta).trim(),
    opciones,
  }
}

// Obtiene los datos necesarios.
async function fetchNovedadesRows() {
  const extended = await supabase
    .from('novedades')
    .select(NOVEDADES_SELECT)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (!extended.error) return extended.data || []

  const msg = String(extended.error.message || '')
  if (msg.includes('archivo_url') || msg.includes('encuesta') || msg.includes('destacado') || msg.includes('sucursales_destino')) {
    const base = await supabase
      .from('novedades')
      .select(NOVEDADES_SELECT_BASE)
      .eq('activo', true)
      .order('created_at', { ascending: false })

    if (base.error) throw base.error
    return base.data || []
  }

  throw extended.error
}

// Obtiene los datos necesarios.
async function loadEncuestaVotes(novedadIds, empleadoId) {
  const result = { counts: {}, miVotos: {} }
  if (!novedadIds.length) return result

  const { data, error } = await supabase
    .from('novedades_encuesta_votos')
    .select('novedad_id, empleado_id, opcion_id')
    .in('novedad_id', novedadIds)

  if (error) {
    if (String(error.message || '').includes('novedades_encuesta_votos')) {
      return result
    }
    throw error
  }

  // Recorre los elementos de la coleccion.
  for (const vote of data || []) {
    const nid = String(vote.novedad_id)
    const oid = String(vote.opcion_id)
    if (!result.counts[nid]) result.counts[nid] = {}
    result.counts[nid][oid] = (result.counts[nid][oid] || 0) + 1
    if (empleadoId != null && String(vote.empleado_id) === String(empleadoId)) {
      result.miVotos[nid] = oid
    }
  }

  return result
}

// Obtiene los datos necesarios.
async function getAllNovedades(empleadoId, options = {}) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const bypassFilter = Boolean(options.bypassFilter)
  const empleadoSucursal = bypassFilter ? null : await getEmpleadoSucursalNorm(empleadoId)

  const rows = (await fetchNovedadesRows()).filter((row) =>
    isVisibleForEmpleado(parseDestinosFromRow(row), empleadoSucursal, bypassFilter),
  )
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)

  const [{ data: likes, error: likesError }, encuestaVotes] = await Promise.all([
    supabase.from('novedades_likes').select('novedad_id, empleado_id').in('novedad_id', ids),
    loadEncuestaVotes(ids, empleadoId),
  ])

  if (likesError) {
    console.error('[novedades.service] SUPABASE ERROR likes:', likesError)
    throw likesError
  }

  const countByNovedad = {}
  const likedSet = new Set()

  // Recorre los elementos de la coleccion.
  for (const like of likes || []) {
    countByNovedad[like.novedad_id] = (countByNovedad[like.novedad_id] || 0) + 1
    if (empleadoId != null && String(like.empleado_id) === String(empleadoId)) {
      likedSet.add(String(like.novedad_id))
    }
  }

  return rows.map((row) => {
    const nid = String(row.id)
    const encuesta = buildEncuestaFromRow(
      row,
      encuestaVotes.counts[nid] || {},
      encuestaVotes.miVotos[nid] || null,
    )
    return mapNovedad(
      row,
      countByNovedad[row.id] || 0,
      likedSet.has(nid),
      encuesta,
    )
  })
}

// Obtiene los datos necesarios.
async function getMisNovedades(publicadoPor) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  let rows
  const extended = await supabase
    .from('novedades')
    .select(NOVEDADES_SELECT)
    .eq('activo', true)
    .eq('publicado_por', publicadoPor)
    .order('created_at', { ascending: false })
    .limit(20)

  if (extended.error) {
    const base = await supabase
      .from('novedades')
      .select(NOVEDADES_SELECT_BASE)
      .eq('activo', true)
      .eq('publicado_por', publicadoPor)
      .order('created_at', { ascending: false })
      .limit(20)

    if (base.error) throw base.error
    rows = base.data || []
  } else {
    rows = extended.data || []
  }

  const now = Date.now()
  const cutoff = now - ADMIN_DESTACADO_DIAS_DEFAULT * 24 * 60 * 60 * 1000

  return rows
    .filter((row) => {
      if (row.destacado_admin_hasta) {
        const ts = Date.parse(row.destacado_admin_hasta)
        return !Number.isNaN(ts) && ts >= now
      }
      const created = Date.parse(row.created_at)
      return !Number.isNaN(created) && created >= cutoff
    })
    .slice(0, 8)
    .map((row) => mapNovedad(row, 0, false, buildEncuestaFromRow(row)))
}

// Alterna el estado correspondiente.
async function toggleLike(novedadId, empleadoId) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const { data: existing, error: findError } = await supabase
    .from('novedades_likes')
    .select('novedad_id, empleado_id')
    .eq('novedad_id', novedadId)
    .eq('empleado_id', empleadoId)
    .maybeSingle()

  if (findError) throw findError

  if (existing) {
    const { error: deleteError } = await supabase
      .from('novedades_likes')
      .delete()
      .eq('novedad_id', novedadId)
      .eq('empleado_id', empleadoId)
    if (deleteError) throw deleteError
  } else {
    const { error: insertError } = await supabase
      .from('novedades_likes')
      .insert({ novedad_id: novedadId, empleado_id: empleadoId })
    if (insertError) throw insertError
  }

  const { count, error: countError } = await supabase
    .from('novedades_likes')
    .select('*', { count: 'exact', head: true })
    .eq('novedad_id', novedadId)

  if (countError) throw countError

  return { likes: count || 0, liked: !existing }
}

// Crea el registro o elemento correspondiente.
async function createNovedad(payload, publicadoPor) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const encuestaData = buildEncuestaOpciones(payload.encuesta)
  const diasDestacado = Number(payload.destacado_admin_dias ?? payload.destacadoAdminDias)
  const dias = Number.isFinite(diasDestacado) && diasDestacado > 0
    ? Math.min(diasDestacado, 30)
    : ADMIN_DESTACADO_DIAS_DEFAULT

  const sucursalesDestino = parseSucursalesDestino(payload)
  if (sucursalesDestino.length === 0) {
    const err = new Error('invalid_sucursales_destino')
    err.code = 'invalid_sucursales_destino'
    throw err
  }

  const insertPayload = {
    titulo: payload.titulo,
    contenido: payload.contenido,
    imagen_url: payload.imagen_url || payload.imagenUrl || null,
    archivo_url: payload.archivo_url || payload.archivoUrl || null,
    archivo_nombre: payload.archivo_nombre || payload.archivoNombre || null,
    encuesta_pregunta: encuestaData?.pregunta || null,
    encuesta_opciones: encuestaData?.opciones || null,
    destacado_admin_hasta: buildDestacadoHasta(dias),
    sucursales_destino: sucursalesDestino,
    importante: Boolean(payload.importante),
    activo: true,
    publicado_por: publicadoPor,
  }

  let { data, error } = await supabase
    .from('novedades')
    .insert(insertPayload)
    .select(NOVEDADES_SELECT)
    .single()

  if (error?.message && (error.message.includes('archivo_url') || error.message.includes('encuesta') || error.message.includes('destacado'))) {
    const { titulo, contenido, imagen_url, importante, activo, publicado_por } = insertPayload
    const retry = await supabase
      .from('novedades')
      .insert({ titulo, contenido, imagen_url, importante, activo, publicado_por })
      .select(NOVEDADES_SELECT_BASE)
      .single()
    data = retry.data
    error = retry.error
  } else if (error?.message && error.message.includes('sucursales_destino')) {
    const err = new Error('sucursales_destino_column_missing')
    err.code = 'sucursales_destino_column_missing'
    throw err
  }

  if (error) {
    console.error('[novedades.service] SUPABASE ERROR createNovedad:', error)
    throw error
  }

  notifyNovedadPublished({
    titulo: data.titulo,
    contenido: data.contenido,
    publicadoPor,
    sucursalesDestino,
  }).catch(() => {})

  return mapNovedad(data, 0, false, buildEncuestaFromRow(data))
}

// Gestiona la operacion voteEncuesta.
async function voteEncuesta(novedadId, opcionId, empleadoId) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const { data: row, error } = await supabase
    .from('novedades')
    .select('id, encuesta_pregunta, encuesta_opciones, activo')
    .eq('id', novedadId)
    .maybeSingle()

  if (error) throw error
  if (!row || row.activo === false) {
    const err = new Error('novedad_not_found')
    err.code = 'novedad_not_found'
    throw err
  }

  const opciones = parseOpciones(row.encuesta_opciones)
  if (!row.encuesta_pregunta || opciones.length === 0) {
    const err = new Error('no_poll')
    err.code = 'no_poll'
    throw err
  }

  const valid = opciones.some((op) => String(op.id) === String(opcionId))
  if (!valid) {
    const err = new Error('invalid_option')
    err.code = 'invalid_option'
    throw err
  }

  const { data: existing } = await supabase
    .from('novedades_encuesta_votos')
    .select('id, opcion_id')
    .eq('novedad_id', novedadId)
    .eq('empleado_id', empleadoId)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await supabase
      .from('novedades_encuesta_votos')
      .update({ opcion_id: String(opcionId) })
      .eq('id', existing.id)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('novedades_encuesta_votos')
      .insert({
        novedad_id: novedadId,
        empleado_id: empleadoId,
        opcion_id: String(opcionId),
      })
    if (insertError) throw insertError
  }

  const encuestaVotes = await loadEncuestaVotes([novedadId], empleadoId)
  const nid = String(novedadId)
  return buildEncuestaFromRow(row, encuestaVotes.counts[nid] || {}, encuestaVotes.miVotos[nid] || null)
}

// Obtiene los datos necesarios.
async function loadLikeMeta(ids, empleadoId) {
  const { data: likes, error } = await supabase
    .from('novedades_likes')
    .select('novedad_id, empleado_id')
    .in('novedad_id', ids)

  if (error) throw error

  const meta = {}
  // Recorre los elementos de la coleccion.
  for (const like of likes || []) {
    const nid = String(like.novedad_id)
    if (!meta[nid]) meta[nid] = { count: 0, liked: false }
    meta[nid].count += 1
    if (empleadoId != null && String(like.empleado_id) === String(empleadoId)) {
      meta[nid].liked = true
    }
  }
  return meta
}

// Actualiza los datos correspondientes.
async function updateNovedad(novedadId, payload, empleadoId, isAdminUser) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const { data: row, error: findError } = await supabase
    .from('novedades')
    .select('id, publicado_por')
    .eq('id', novedadId)
    .maybeSingle()

  if (findError) throw findError
  if (!row) {
    const err = new Error('novedad_not_found')
    err.code = 'novedad_not_found'
    throw err
  }

  if (!isAdminUser && String(row.publicado_por) !== String(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  const patch = {}
  if (payload.titulo != null) patch.titulo = String(payload.titulo).trim()
  if (payload.contenido != null) patch.contenido = String(payload.contenido).trim()
  if (payload.importante !== undefined) patch.importante = Boolean(payload.importante)
  if (payload.imagen_url !== undefined || payload.imagenUrl !== undefined) {
    patch.imagen_url = payload.imagen_url ?? payload.imagenUrl ?? null
  }

  if (payload.sucursales_destino != null || payload.sucursalesDestino != null) {
    const destinos = parseSucursalesDestino(payload)
    if (destinos.length > 0) patch.sucursales_destino = destinos
  }

  if (Object.keys(patch).length === 0) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('novedades')
    .update(patch)
    .eq('id', novedadId)
    .select(NOVEDADES_SELECT)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('novedad_not_found')
    err.code = 'novedad_not_found'
    throw err
  }

  const encuestaVotes = await loadEncuestaVotes([novedadId], empleadoId)
  const nid = String(novedadId)
  const encuesta = buildEncuestaFromRow(
    data,
    encuestaVotes.counts[nid] || {},
    encuestaVotes.miVotos[nid] || null,
  )
  const likesMeta = await loadLikeMeta([novedadId], empleadoId)
  const likeMeta = likesMeta[nid] || { count: 0, liked: false }

  return mapNovedad(data, likeMeta.count, likeMeta.liked, encuesta)
}

// Elimina el elemento indicado.
async function deleteNovedadRelations(novedadId) {
  // Gestiona la operacion safeDelete.
  const safeDelete = async (table, column, value) => {
    const { error } = await supabase.from(table).delete().eq(column, value)
    if (!error) return
    const msg = String(error.message || '')
    if (msg.includes('does not exist') || error.code === '42P01') return
    throw error
  }

  await safeDelete('novedades_likes', 'novedad_id', novedadId)
  await safeDelete('novedades_encuesta_votos', 'novedad_id', novedadId)
  await safeDelete('novedades_comentarios', 'novedad_id', novedadId)
}

// Elimina el elemento indicado.
async function deactivateNovedad(novedadId, publicadoPor, isAdmin) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  const { data: row, error: findError } = await supabase
    .from('novedades')
    .select('id, publicado_por')
    .eq('id', novedadId)
    .maybeSingle()

  if (findError) throw findError
  if (!row) {
    const err = new Error('novedad_not_found')
    err.code = 'novedad_not_found'
    throw err
  }

  if (!isAdmin && String(row.publicado_por) !== String(publicadoPor)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  if (isAdmin) {
    await deleteNovedadRelations(novedadId)
    const { data, error } = await supabase
      .from('novedades')
      .delete()
      .eq('id', novedadId)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) {
      const err = new Error('novedad_not_found')
      err.code = 'novedad_not_found'
      throw err
    }
    return { success: true }
  }

  const { error } = await supabase.from('novedades').update({ activo: false }).eq('id', novedadId)
  if (error) throw error

  return { success: true }
}

module.exports = {
  getAllNovedades,
  getMisNovedades,
  toggleLike,
  createNovedad,
  voteEncuesta,
  deactivateNovedad,
  updateNovedad,
  ADMIN_DESTACADO_DIAS_DEFAULT,
}
