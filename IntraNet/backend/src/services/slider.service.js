const { randomUUID } = require('crypto')
const path = require('path')
const supabase = require('../config/supabase')
const { readJsonFile, writeJsonFile } = require('../fakeDb/jsonStore')

const LEGACY_JSON = path.join(__dirname, '..', 'data', 'home_slider.json')
const META_JSON = path.join(__dirname, '..', 'data', 'home_slider_meta.json')

function mapSlide(row) {
  let titulo = String(row.titulo || '').trim()
  if (row.mostrar_titulo === false && titulo === 'Slide') titulo = ''
  const subtitulo = row.subtitulo || null
  const hasCopy = !!(titulo || String(subtitulo || '').trim())
  const mostrarTitulo = row.mostrar_titulo !== false && hasCopy

  return {
    id: row.id,
    titulo,
    subtitulo,
    imagen_url: row.imagen_url,
    enlace: row.enlace || null,
    orden: Number.isFinite(row.orden) ? row.orden : 0,
    activo: row.activo !== false,
    mostrar_titulo: mostrarTitulo,
    created_at: row.created_at,
    updated_at: row.updated_at || null,
  }
}

function sortSlides(items) {
  return [...items].sort((a, b) => {
    const order = (a.orden ?? 0) - (b.orden ?? 0)
    if (order !== 0) return order
    return String(b.created_at || '').localeCompare(String(a.created_at || ''))
  })
}

async function importLegacySlidesIfEmpty() {
  if (!supabase || typeof supabase.from !== 'function') return

  const meta = readJsonFile(META_JSON, { legacyImported: false })
  if (meta.legacyImported) return

  const { count, error: countError } = await supabase
    .from('home_slider')
    .select('id', { count: 'exact', head: true })

  if (countError) return

  if ((count ?? 0) > 0) {
    writeJsonFile(META_JSON, { legacyImported: true })
    return
  }

  const legacy = readJsonFile(LEGACY_JSON, { version: 0, items: [] })
  const items = Array.isArray(legacy?.items) ? legacy.items : []
  if (items.length === 0) {
    writeJsonFile(META_JSON, { legacyImported: true })
    return
  }

  const rows = items.map((item) => ({
    id: item.id || randomUUID(),
    titulo: item.titulo,
    subtitulo: item.subtitulo || null,
    imagen_url: item.imagen_url,
    enlace: item.enlace || null,
    orden: item.orden != null ? Number(item.orden) : 0,
    activo: item.activo !== false,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
  }))

  const { error } = await supabase.from('home_slider').insert(rows)
  writeJsonFile(META_JSON, { legacyImported: true })
  if (error) {
    console.error('[slider.service] Legacy import failed:', error.message)
  } else {
    console.info(`[slider.service] Imported ${rows.length} slide(s) from legacy JSON.`)
  }
}

async function listSlides({ includeInactive = false } = {}) {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client not initialized')
  }

  await importLegacySlidesIfEmpty()

  let query = supabase.from('home_slider').select('*')
  if (!includeInactive) query = query.eq('activo', true)
  query = query.order('orden', { ascending: true }).order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return sortSlides(data || []).map(mapSlide)
}

async function createSlide(body) {
  const imagenUrl = String(body.imagen_url || body.imagenUrl || '').trim()
  const titulo = String(body.titulo || '').trim()
  const mostrarTitulo = (body.mostrar_titulo !== false && body.mostrarTitulo !== false) && !!titulo

  if (!imagenUrl) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const now = new Date().toISOString()
  const payload = {
    titulo: titulo || '',
    subtitulo: String(body.subtitulo || '').trim() || null,
    imagen_url: imagenUrl,
    enlace: String(body.enlace || '').trim() || null,
    orden: body.orden != null ? Number(body.orden) : 0,
    activo: body.activo !== false,
    mostrar_titulo: mostrarTitulo,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase.from('home_slider').insert(payload).select('*').single()
  if (error) {
    if (String(error.message || '').includes('mostrar_titulo')) {
      delete payload.mostrar_titulo
      const retry = await supabase.from('home_slider').insert(payload).select('*').single()
      if (retry.error) throw retry.error
      return mapSlide(retry.data)
    }
    throw error
  }
  return mapSlide(data)
}

async function updateSlide(id, body) {
  const patch = { updated_at: new Date().toISOString() }
  if (body.titulo != null) patch.titulo = String(body.titulo).trim()
  if (body.subtitulo !== undefined) patch.subtitulo = String(body.subtitulo || '').trim() || null
  if (body.imagen_url != null || body.imagenUrl != null) {
    patch.imagen_url = String(body.imagen_url || body.imagenUrl || '').trim()
  }
  if (body.enlace !== undefined) patch.enlace = String(body.enlace || '').trim() || null
  if (body.orden != null) patch.orden = Number(body.orden)
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)
  if (body.mostrar_titulo !== undefined || body.mostrarTitulo !== undefined) {
    patch.mostrar_titulo = body.mostrar_titulo !== false && body.mostrarTitulo !== false
  }

  if (patch.mostrar_titulo === undefined) {
    const tituloValue = patch.titulo != null ? String(patch.titulo).trim() : null
    if (tituloValue !== null && !tituloValue) {
      patch.mostrar_titulo = false
    }
  } else if (patch.mostrar_titulo) {
    const tituloValue = patch.titulo != null
      ? String(patch.titulo).trim()
      : String(body.titulo || '').trim()
    if (!tituloValue) patch.mostrar_titulo = false
  }
  if (patch.imagen_url === '') {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  let { data, error } = await supabase
    .from('home_slider')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error && String(error.message || '').includes('mostrar_titulo')) {
    const { mostrar_titulo: _omit, ...patchWithoutFlag } = patch
    const retry = await supabase
      .from('home_slider')
      .update(patchWithoutFlag)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    data = retry.data
    error = retry.error
  }

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return mapSlide(data)
}

async function removeSlide(id) {
  const { data, error } = await supabase.from('home_slider').delete().eq('id', id).select('id').maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

module.exports = {
  listSlides,
  createSlide,
  updateSlide,
  removeSlide,
}
