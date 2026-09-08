const supabase = require('../config/supabase')
const { readEntity, writeEntity, updateEntity } = require('../fakeDb/entityStore')
//hola
const FALLBACK_SECTORES = [
  'Administración',
  'Administrativo',
  'Auditoría y Stock',
  'Caja',
  'Compras',
  'Compras FOB',
  'Corporativo',
  'Créditos y Cobranzas',
  'Gerencia',
  'Logística',
  'Logística (Referente)',
  'Maestranza',
  'Marketplace',
  'PM',
  'Producción',
  'RMA',
  'RR. HH.',
  'Seguridad',
  'Ventas',
  'Ventas (Referente)',
  'Ventas Canal',
  'Ventas Retail',
]
//holaa
let useJsonStore = null

function hasSupabaseClient() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}

function isSectoresTableMissing(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  const code = String(error.code || '')
  return (
    msg.includes('sectores') ||
    msg.includes('does not exist') ||
    code === '42P01' ||
    (msg.includes('relation') && msg.includes('not exist'))
  )
}

function mapSector(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: row.activo !== false,
    created_at: row.created_at,
  }
}

function seedJsonStoreIfEmpty() {
  const store = readEntity('sectores')
  if (store.items.length > 0) return store

  const seeded = {
    version: 1,
    items: FALLBACK_SECTORES.map((nombre, i) => ({
      id: i + 1,
      nombre,
      activo: true,
      created_at: new Date().toISOString(),
    })),
  }
  writeEntity('sectores', seeded)
  return seeded
}

function listSectoresJson({ includeInactive = false } = {}) {
  const store = seedJsonStoreIfEmpty()
  let items = store.items.map(mapSector)
  if (!includeInactive) items = items.filter((s) => s.activo !== false)
  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function createSectorJson(body) {
  const nombre = String(body.nombre || '').trim()
  if (!nombre) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  let created = null
  updateEntity('sectores', (store) => {
    const current = store.items.length > 0 ? store : seedJsonStoreIfEmpty()
    const exists = current.items.some(
      (s) => s.activo !== false && String(s.nombre).toLowerCase() === nombre.toLowerCase(),
    )
    if (exists) {
      const err = new Error('duplicate_name')
      err.code = 'duplicate_name'
      throw err
    }
    const nextId = current.items.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1
    created = mapSector({
      id: nextId,
      nombre,
      activo: true,
      created_at: new Date().toISOString(),
    })
    return { ...current, items: [...current.items, created] }
  })
  return created
}

function updateSectorJson(id, body) {
  const sectorId = Number(id)
  let updated = null
  updateEntity('sectores', (store) => {
    const current = store.items.length > 0 ? store : seedJsonStoreIfEmpty()
    const idx = current.items.findIndex((s) => Number(s.id) === sectorId)
    if (idx < 0) {
      const err = new Error('not_found')
      err.code = 'not_found'
      throw err
    }
    const patch = { ...current.items[idx] }
    if (body.nombre != null) patch.nombre = String(body.nombre).trim()
    if (body.activo !== undefined) patch.activo = Boolean(body.activo)
    const items = [...current.items]
    items[idx] = patch
    updated = mapSector(patch)
    return { ...current, items }
  })
  return updated
}

function removeSectorJson(id) {
  const sectorId = Number(id)
  updateEntity('sectores', (store) => {
    const current = store.items.length > 0 ? store : seedJsonStoreIfEmpty()
    const idx = current.items.findIndex((s) => Number(s.id) === sectorId)
    if (idx < 0) {
      const err = new Error('not_found')
      err.code = 'not_found'
      throw err
    }
    const items = current.items.filter((s) => Number(s.id) !== sectorId)
    return { ...current, items }
  })
  return { success: true }
}

async function resolveStorageMode() {
  if (useJsonStore != null) return useJsonStore
  if (!hasSupabaseClient()) {
    useJsonStore = true
    return useJsonStore
  }
  const { error } = await supabase.from('sectores').select('id').limit(1)
  if (error && isSectoresTableMissing(error)) {
    useJsonStore = true
    return useJsonStore
  }
  if (error) throw error
  useJsonStore = false
  return useJsonStore
}

async function listSectores({ includeInactive = false } = {}) {
  if (await resolveStorageMode()) {
    return listSectoresJson({ includeInactive })
  }

  let query = supabase.from('sectores').select('*').order('nombre', { ascending: true })
  if (!includeInactive) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapSector)
}

async function createSector(body) {
  const nombre = String(body.nombre || '').trim()
  if (!nombre) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  if (await resolveStorageMode()) {
    return createSectorJson(body)
  }

  const { data, error } = await supabase
    .from('sectores')
    .insert({ nombre, activo: true })
    .select('*')
    .single()

  if (error) {
    if (String(error.message || '').includes('unique') || error.code === '23505') {
      const err = new Error('duplicate_name')
      err.code = 'duplicate_name'
      throw err
    }
    throw error
  }
  return mapSector(data)
}

async function updateSector(id, body) {
  if (await resolveStorageMode()) {
    return updateSectorJson(id, body)
  }

  const patch = {}
  if (body.nombre != null) patch.nombre = String(body.nombre).trim()
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)

  const { data, error } = await supabase
    .from('sectores')
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
  return mapSector(data)
}

async function removeSector(id) {
  if (await resolveStorageMode()) {
    removeSectorJson(id)
    return { success: true }
  }

  const { data: sector, error: findErr } = await supabase
    .from('sectores')
    .select('id, nombre')
    .eq('id', id)
    .maybeSingle()

  if (findErr) throw findErr
  if (!sector) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const { data, error } = await supabase.from('sectores').delete().eq('id', id).select('id').maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

module.exports = {
  listSectores,
  createSector,
  updateSector,
  removeSector,
  FALLBACK_SECTORES,
}
