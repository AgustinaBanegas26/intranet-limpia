const supabase = require('../config/supabase')

function mapManual(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    archivo_url: row.archivo_url,
    version: row.version,
    paginas: row.paginas,
    activo: row.activo !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function listManuales({ includeInactive = false } = {}) {
  let query = supabase.from('manuales').select('*').order('titulo', { ascending: true })
  if (!includeInactive) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapManual)
}

async function createManual(body) {
  const titulo = String(body.titulo || body.title || '').trim()
  if (!titulo) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('manuales')
    .insert({
      titulo,
      descripcion: String(body.descripcion || body.description || '').trim() || null,
      categoria: body.categoria || body.category || 'general',
      archivo_url: body.archivo_url || body.url || null,
      version: body.version || '1.0',
      paginas: body.paginas != null ? Number(body.paginas) : null,
      activo: body.activo !== false,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapManual(data)
}

async function updateManual(id, body) {
  const patch = { updated_at: new Date().toISOString() }
  if (body.titulo != null || body.title != null) patch.titulo = String(body.titulo || body.title).trim()
  if (body.descripcion != null || body.description != null) {
    patch.descripcion = String(body.descripcion || body.description).trim() || null
  }
  if (body.categoria != null || body.category != null) patch.categoria = body.categoria || body.category
  if (body.archivo_url !== undefined || body.url !== undefined) patch.archivo_url = body.archivo_url || body.url || null
  if (body.version !== undefined) patch.version = body.version
  if (body.paginas !== undefined) patch.paginas = body.paginas != null ? Number(body.paginas) : null
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)

  const { data, error } = await supabase.from('manuales').update(patch).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapManual(data)
}

async function removeManual(id) {
  const { data, error } = await supabase.from('manuales').delete().eq('id', id).select('id').maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

module.exports = {
  listManuales,
  createManual,
  updateManual,
  removeManual,
}
