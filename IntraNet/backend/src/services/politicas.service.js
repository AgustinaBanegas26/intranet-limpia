const supabase = require('../config/supabase')

// Procesa los elementos de la coleccion.
function mapPolitica(row, leida = false) {
  return {
    id: row.id,
    titulo: row.titulo,
    categoria: row.categoria,
    archivo_url: row.archivo_url,
    version: row.version,
    activo: row.activo !== false,
    obligatoria: Boolean(row.obligatoria),
    created_at: row.created_at,
    updated_at: row.updated_at,
    leida,
  }
}

// Obtiene los datos necesarios.
async function listPoliticas({ empleadoId = null, includeInactive = false } = {}) {
  let query = supabase.from('politicas').select('*').order('created_at', { ascending: false })
  if (!includeInactive) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw error

  let leidasSet = new Set()
  if (empleadoId) {
    const { data: lecturas } = await supabase
      .from('politicas_lecturas')
      .select('politica_id')
      .eq('empleado_id', empleadoId)
    leidasSet = new Set((lecturas || []).map((r) => r.politica_id))
  }

  return (data || []).map((row) => mapPolitica(row, leidasSet.has(row.id)))
}

// Crea el registro o elemento correspondiente.
async function createPolitica(body) {
  const titulo = String(body.titulo || body.title || '').trim()
  if (!titulo) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('politicas')
    .insert({
      titulo,
      categoria: body.categoria || body.category || 'general',
      archivo_url: body.archivo_url || body.url || null,
      version: body.version || '1.0',
      activo: body.activo !== false,
      obligatoria: Boolean(body.obligatoria),
    })
    .select('*')
    .single()

  if (error) throw error
  return mapPolitica(data)
}

// Actualiza los datos correspondientes.
async function updatePolitica(id, body) {
  const patch = {}
  if (body.titulo != null || body.title != null) patch.titulo = String(body.titulo || body.title).trim()
  if (body.categoria != null || body.category != null) patch.categoria = body.categoria || body.category
  if (body.archivo_url !== undefined || body.url !== undefined) patch.archivo_url = body.archivo_url || body.url || null
  if (body.version !== undefined) patch.version = body.version
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)
  if (body.obligatoria !== undefined) patch.obligatoria = Boolean(body.obligatoria)

  const { data, error } = await supabase.from('politicas').update(patch).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapPolitica(data)
}

// Elimina el elemento indicado.
async function removePolitica(id) {
  const { data: existing, error: findErr } = await supabase
    .from('politicas')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) throw findErr
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const { error: lecturasErr } = await supabase.from('politicas_lecturas').delete().eq('politica_id', id)
  if (lecturasErr) throw lecturasErr

  const { data, error } = await supabase.from('politicas').delete().eq('id', id).select('id').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

// Gestiona la operacion markPoliticaLeida.
async function markPoliticaLeida(politicaId, empleadoId) {
  const { error } = await supabase.from('politicas_lecturas').upsert(
    { politica_id: politicaId, empleado_id: empleadoId },
    { onConflict: 'politica_id,empleado_id' },
  )
  if (error) throw error
  return { success: true }
}

module.exports = {
  listPoliticas,
  createPolitica,
  updatePolitica,
  removePolitica,
  markPoliticaLeida,
}
