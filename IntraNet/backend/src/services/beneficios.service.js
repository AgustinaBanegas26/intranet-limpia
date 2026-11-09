//este archivo se encarga de manejar los beneficios de empleados en la base de datos,
// y permite listar, crear, actualizar y eliminar beneficios.
const supabase = require('../config/supabase')

// Procesa los elementos de la coleccion.
function mapBeneficio(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    imagen_url: row.imagen_url,
    enlace_url: row.enlace_url || null,
    activo: row.activo !== false,
    created_at: row.created_at,
  }
}

// Obtiene los datos necesarios.
async function listBeneficios({ includeInactive = false } = {}) {
  let query = supabase.from('beneficios').select('*').order('created_at', { ascending: false })
  if (!includeInactive) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapBeneficio)
}

// Crea el registro o elemento correspondiente.
async function createBeneficio(body) {
  const nombre = String(body.nombre || body.title || '').trim()
  if (!nombre) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('beneficios')
    .insert({
      nombre,
      descripcion: String(body.descripcion || body.description || '').trim() || null,
      imagen_url: body.imagen_url || null,
      enlace_url: body.enlace_url || null,
      activo: body.activo !== false,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapBeneficio(data)
}

// Actualiza los datos correspondientes.
async function updateBeneficio(id, body) {
  const patch = {}
  if (body.nombre != null || body.title != null) patch.nombre = String(body.nombre || body.title).trim()
  if (body.descripcion != null || body.description != null) {
    patch.descripcion = String(body.descripcion || body.description || '').trim() || null
  }
  if (body.imagen_url !== undefined) patch.imagen_url = body.imagen_url
  if (body.enlace_url !== undefined) patch.enlace_url = body.enlace_url || null
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)

  const { data, error } = await supabase.from('beneficios').update(patch).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapBeneficio(data)
}

// Elimina el elemento indicado.
async function removeBeneficio(id) {
  const { data, error } = await supabase.from('beneficios').delete().eq('id', id).select('id').maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

module.exports = {
  listBeneficios,
  createBeneficio,
  updateBeneficio,
  removeBeneficio,
}
