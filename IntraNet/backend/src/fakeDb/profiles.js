//este archivo se encarga de manejar los perfiles de usuario en la base de datos,
// y permite obtener y actualizar los datos de perfil de los usuarios.
const supabase = require('../config/supabase')

/**
 * Campos permitidos para actualización de perfil (whitelist).
 * Cualquier otro campo enviado por el cliente se descarta.
 */
const ALLOWED_DB_COLUMNS = new Set([
  'telefono',
  'email_personal',
  'email_corporativo',
  'direccion',
  'domicilio',
  'estado_civil',
  'hijos',
  'fecha_nacimiento',
  'documento',
  'cuil',
  'foto_url',
  'nombre',
  'apellido',
  'area',
  'sucursal',
  'legajo',
  'fecha_ingreso',
])

/** ~1.5 MB en base64 — suficiente para avatar comprimido en frontend */
const MAX_FOTO_DATA_URL_LENGTH = 1_500_000

const BLOCKED_FIELDS = new Set([
  'password_hash',
  'es_director',
  'role',
  'activo',
  'must_change_password',
  'id',
  'cargo',
  'work_mode',
])

/** Mapeo camelCase (API) → snake_case (Supabase) para campos editables */
const API_TO_DB_MAP = {
  tel: 'telefono',
  celPersonal: 'telefono',
  emailPersonal: 'email_personal',
  emailEmpresa: 'email_corporativo',
  domicilio: 'domicilio',
  direccion: 'direccion',
  estadoCivil: 'estado_civil',
  hijos: 'hijos',
  fechaNac: 'fecha_nacimiento',
  documento: 'documento',
  cuil: 'cuil',
  foto: 'foto_url',
  sector: 'area',
  sucursal: 'sucursal',
  legajo: 'legajo',
  fechaIngreso: 'fecha_ingreso',
}

// Gestiona la operacion splitNombreCompleto.
function splitNombreCompleto(full) {
  const trimmed = String(full || '').trim()
  if (!trimmed) return { nombre: null, apellido: null }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { nombre: parts[0], apellido: '' }
  const apellido = parts.pop()
  return { nombre: parts.join(' '), apellido }
}

// Comprueba los datos o la condicion indicada.
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

/**
 * Fotos: el frontend envía base64 data-URL en `foto`.
 * Se persiste en `foto_url` como texto. Limitaciones:
 * - Tamaño limitado por express.json (10mb) y columna DB.
 * - No hay optimización ni CDN; migración futura a Supabase Storage recomendada.
 * - El adaptador acepta data-URL sin transformación para no romper el flujo actual.
 */

function mapEmpleadoToProfile(data) {
  if (!data) return null
  const fullName = `${data.nombre || ''} ${data.apellido || ''}`.trim()
  return {
    id: data.id,
    name: fullName || data.email_corporativo || '',
    nombreCompleto: fullName,
    fechaNac: data.fecha_nacimiento || null,
    tel: data.telefono || null,
    celPersonal: data.telefono || null,
    emailEmpresa: data.email_corporativo,
    emailPersonal: data.email_personal || null,
    estadoCivil: data.estado_civil || null,
    domicilio: data.domicilio || data.direccion || null,
    documento: data.documento || null,
    hijos: data.hijos != null ? String(data.hijos) : null,
    cuil: data.cuil || null,
    sector: data.area || null,
    cargo: data.cargo || null,
    sucursal: data.sucursal || null,
    legajo: data.legajo || null,
    fechaIngreso: data.fecha_ingreso || null,
    foto: data.foto_url || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Procesa los elementos de la coleccion.
function mapProfilePatchToDb(apiPatch) {
  if (!apiPatch || typeof apiPatch !== 'object') {
    return {}
  }

  const dbPatch = {}

  if ('nombreCompleto' in apiPatch) {
    const { nombre, apellido } = splitNombreCompleto(apiPatch.nombreCompleto)
    if (nombre != null) dbPatch.nombre = nombre
    if (apellido != null) dbPatch.apellido = apellido
  }

  // Recorre los elementos de la coleccion.
  for (const [apiKey, dbKey] of Object.entries(API_TO_DB_MAP)) {
    if (apiKey === 'tel' || apiKey === 'celPersonal') continue
    if (!(apiKey in apiPatch)) continue
    const value = apiPatch[apiKey]
    if (value === undefined) continue

    if (!ALLOWED_DB_COLUMNS.has(dbKey)) continue
    if (BLOCKED_FIELDS.has(dbKey)) continue

    if (dbKey === 'hijos') {
      dbPatch[dbKey] = value === '' || value == null ? null : Number(value)
      continue
    }

    if (dbKey === 'fecha_nacimiento' || dbKey === 'fecha_ingreso') {
      dbPatch[dbKey] = value === '' ? null : value
      continue
    }

    if (dbKey === 'email_personal' || dbKey === 'email_corporativo') {
      const email = value === '' ? null : String(value).trim()
      if (email && !isValidEmail(email)) {
        const err = new Error('invalid_email')
        err.code = 'invalid_email'
        throw err
      }
      dbPatch[dbKey] = email
      continue
    }

    if (dbKey === 'legajo') {
      dbPatch[dbKey] = value === '' || value == null ? null : String(value).trim()
      continue
    }

    if (dbKey === 'foto_url') {
      if (value === '' || value == null) {
        dbPatch[dbKey] = null
      } else if (typeof value === 'string' && value.startsWith('data:')) {
        if (value.length > MAX_FOTO_DATA_URL_LENGTH) {
          const err = new Error('foto_too_large')
          err.code = 'foto_too_large'
          throw err
        }
        dbPatch[dbKey] = value
      } else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        dbPatch[dbKey] = value
      }
      continue
    }

    dbPatch[dbKey] = value === '' ? null : value
  }

  // Teléfono: priorizar celular personal si viene informado
  if ('celPersonal' in apiPatch && String(apiPatch.celPersonal || '').trim()) {
    dbPatch.telefono = String(apiPatch.celPersonal).trim()
  } else if ('tel' in apiPatch) {
    dbPatch.telefono = apiPatch.tel === '' ? null : apiPatch.tel
  }

  // Seguridad: filtrar cualquier clave snake_case directa del cliente
  const safePatch = {}
  // Recorre los elementos de la coleccion.
  for (const [key, value] of Object.entries(dbPatch)) {
    if (ALLOWED_DB_COLUMNS.has(key) && !BLOCKED_FIELDS.has(key)) {
      safePatch[key] = value
    }
  }

  return safePatch
}

// Obtiene los datos necesarios.
async function getProfileByUserId(userId) {
  if (!supabase || typeof supabase.from !== 'function') {
    return null
  }

  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[profiles] SUPABASE ERROR getProfileByUserId:', error)
    return null
  }

  return mapEmpleadoToProfile(data)
}

// Actualiza los datos correspondientes.
async function updateProfile(userId, apiPatch) {
  if (!supabase || typeof supabase.from !== 'function') {
    return null
  }

  const payload = mapProfilePatchToDb(apiPatch)

  if (Object.keys(payload).length === 0) {
    return getProfileByUserId(userId)
  }

  const { data, error } = await supabase
    .from('empleados')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('[profiles] SUPABASE ERROR updateProfile:', error)
    const err = new Error(error.message || 'profile_update_failed')
    err.code = 'profile_update_failed'
    err.details = error
    throw err
  }

  return mapEmpleadoToProfile(data)
}

module.exports = {
  getProfileByUserId,
  updateProfile,
  mapEmpleadoToProfile,
  mapProfilePatchToDb,
}
