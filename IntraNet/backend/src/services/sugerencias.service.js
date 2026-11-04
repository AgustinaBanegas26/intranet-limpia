const supabase = require('../config/supabase')

const ESTADO_MAP = {
  review: 'en_revision',
  approved: 'aprobada',
  implemented: 'implementada',
  rejected: 'rechazada',
  pendiente: 'pendiente',
  en_revision: 'en_revision',
  aprobada: 'aprobada',
  implementada: 'implementada',
  rechazada: 'rechazada',
}

const ESTADO_UI = {
  pendiente: 'review',
  en_revision: 'review',
  aprobada: 'approved',
  implementada: 'implemented',
  rechazada: 'rejected',
}

// Procesa los elementos de la coleccion.
function mapSugerencia(row, { votos = 0, votado = false, autor = null } = {}) {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    estado: ESTADO_UI[row.estado] || row.estado || 'review',
    votos,
    votado,
    autor,
    fecha: row.created_at,
    empleado_id: row.empleado_id,
  }
}

// Obtiene los datos necesarios.
async function listSugerencias(empleadoId, { isAdmin = false } = {}) {
  let query = supabase.from('sugerencias').select('*').order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.or(`estado.in.(aprobada,implementada),empleado_id.eq.${Number(empleadoId)}`)
  }

  const { data, error } = await query

  const rows = data || []
  const empIds = [...new Set(rows.map((r) => r.empleado_id).filter(Boolean))]
  let empleadosMap = new Map()

  if (empIds.length > 0) {
    const { data: emps, error: empErr } = await supabase
      .from('empleados')
      .select('id, nombre, apellido')
      .in('id', empIds)
    if (empErr) throw empErr
    empleadosMap = new Map((emps || []).map((e) => [e.id, e]))
  }

  const ids = rows.map((r) => r.id)
  let votosBySug = new Map()
  let votedSet = new Set()

  if (ids.length > 0) {
    const { data: votos, error: votosErr } = await supabase
      .from('sugerencias_votos')
      .select('sugerencia_id, empleado_id')
      .in('sugerencia_id', ids)

    if (votosErr) throw votosErr

    // Recorre los elementos de la coleccion.
    for (const v of votos || []) {
      votosBySug.set(v.sugerencia_id, (votosBySug.get(v.sugerencia_id) || 0) + 1)
      if (empleadoId && Number(v.empleado_id) === Number(empleadoId)) {
        votedSet.add(v.sugerencia_id)
      }
    }
  }

  return rows.map((row) => {
    const emp = empleadosMap.get(row.empleado_id)
    const nombre = emp ? `${emp.nombre || ''} ${emp.apellido || ''}`.trim() : null
    return mapSugerencia(row, {
      votos: votosBySug.get(row.id) || 0,
      votado: votedSet.has(row.id),
      autor: nombre || 'Empleado',
    })
  })
}

// Crea el registro o elemento correspondiente.
async function createSugerencia(empleadoId, body) {
  const descripcion = String(body.descripcion || body.text || '').trim()
  const tituloRaw = String(body.titulo || '').trim()
  const titulo = tituloRaw || descripcion.slice(0, 80) || 'Sugerencia'
  if (!descripcion) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('sugerencias')
    .insert({
      empleado_id: empleadoId,
      titulo,
      descripcion,
      categoria: body.categoria || body.category || 'General',
      estado: 'pendiente',
    })
    .select('*')
    .single()

  if (error) throw error
  return mapSugerencia(data, { votos: 0, votado: false, autor: 'Vos' })
}

// Gestiona la operacion voteSugerencia.
async function voteSugerencia(sugerenciaId, empleadoId) {
  const { data: sugerencia, error: sugErr } = await supabase
    .from('sugerencias')
    .select('estado')
    .eq('id', sugerenciaId)
    .maybeSingle()

  if (sugErr) throw sugErr
  if (!sugerencia) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!['aprobada', 'implementada'].includes(sugerencia.estado)) {
    const err = new Error('cannot_vote')
    err.code = 'cannot_vote'
    throw err
  }

  const { data: existing, error: findErr } = await supabase
    .from('sugerencias_votos')
    .select('sugerencia_id')
    .eq('sugerencia_id', sugerenciaId)
    .eq('empleado_id', empleadoId)
    .maybeSingle()

  if (findErr) throw findErr

  if (existing) {
    const { error } = await supabase
      .from('sugerencias_votos')
      .delete()
      .eq('sugerencia_id', sugerenciaId)
      .eq('empleado_id', empleadoId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('sugerencias_votos')
      .insert({ sugerencia_id: sugerenciaId, empleado_id: empleadoId })
    if (error) throw error
  }

  const { count, error: countErr } = await supabase
    .from('sugerencias_votos')
    .select('*', { count: 'exact', head: true })
    .eq('sugerencia_id', sugerenciaId)

  if (countErr) throw countErr
  return { votos: count || 0, votado: !existing }
}

// Elimina el elemento indicado.
async function removeSugerencia(id) {
  const { data: existing, error: findErr } = await supabase
    .from('sugerencias')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) throw findErr
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const { error: votesErr } = await supabase
    .from('sugerencias_votos')
    .delete()
    .eq('sugerencia_id', id)
  if (votesErr) throw votesErr

  const { error } = await supabase.from('sugerencias').delete().eq('id', id)
  if (error) throw error

  return { success: true }
}

// Actualiza los datos correspondientes.
async function updateSugerenciaEstado(id, estadoInput) {
  const estado = ESTADO_MAP[estadoInput] || estadoInput
  const valid = ['pendiente', 'en_revision', 'aprobada', 'implementada', 'rechazada']
  if (!valid.includes(estado)) {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const { data, error } = await supabase
    .from('sugerencias')
    .update({ estado })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapSugerencia(data)
}

module.exports = {
  listSugerencias,
  createSugerencia,
  voteSugerencia,
  updateSugerenciaEstado,
  removeSugerencia,
}
