//este archivo se encarga de manejar las sucursales de empleados en la base de datos,
// y permite determinar la sucursal de un empleado y si una publicacion es visible para el empleado segun su sucursal.
const SUCURSAL_MDP = 'Mar del Plata'
const SUCURSAL_CABA = 'Buenos Aires'
const ALL_SUCURSALES = [SUCURSAL_MDP, SUCURSAL_CABA]

// Prepara el valor para su uso.
function normalizeEmpleadoSucursal(raw) {
  const v = String(raw || '').trim().toLowerCase()
  if (!v) return null
  if (v.includes('mar del plata') || v === 'mdp') return SUCURSAL_MDP
  if (v.includes('buenos aires') || v.includes('caba') || v === 'ba') return SUCURSAL_CABA
  return null
}

// Prepara el valor para su uso.
function parseSucursalesDestino(body) {
  const raw = body?.sucursales_destino ?? body?.sucursalesDestino
  if (!raw) return [...ALL_SUCURSALES]

  if (!Array.isArray(raw)) return [...ALL_SUCURSALES]

  const result = []
  // Recorre los elementos de la coleccion.
  for (const item of raw) {
    const normalized = normalizeEmpleadoSucursal(item)
    if (normalized) result.push(normalized)
  }

  return [...new Set(result)]
}

// Prepara el valor para su uso.
function parseDestinosArray(raw) {
  if (!raw) return null

  let values = raw
  if (typeof raw === 'string') {
    try {
      values = JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (!Array.isArray(values) || values.length === 0) return null
  const normalized = values.map((item) => normalizeEmpleadoSucursal(item)).filter(Boolean)
  return normalized.length > 0 ? normalized : null
}

// Prepara el valor para su uso.
function parseDestinosFromRow(row) {
  return parseDestinosArray(row?.sucursales_destino)
}

// Comprueba los datos o la condicion indicada.
function isVisibleForEmpleado(sucursalesDestino, empleadoSucursal, bypassFilter = false) {
  if (bypassFilter) return true
  if (!sucursalesDestino || sucursalesDestino.length === 0) return true
  // Una publicación dirigida a todas las sedes es corporativa: debe poder verla
  // cualquier empleado, incluso si su sucursal todavía no fue cargada o usa un
  // valor distinto de los normalizados arriba.
  if (ALL_SUCURSALES.every((sucursal) => sucursalesDestino.includes(sucursal))) return true
  if (!empleadoSucursal) return false
  return sucursalesDestino.includes(empleadoSucursal)
}

// Obtiene los datos necesarios.
async function getEmpleadoSucursal(supabase, empleadoId) {
  if (!supabase || empleadoId == null) return null
  const { data, error } = await supabase
    .from('empleados')
    .select('sucursal')
    .eq('id', empleadoId)
    .maybeSingle()
  if (error) throw error
  return normalizeEmpleadoSucursal(data?.sucursal)
}

module.exports = {
  SUCURSAL_MDP,
  SUCURSAL_CABA,
  ALL_SUCURSALES,
  normalizeEmpleadoSucursal,
  parseSucursalesDestino,
  parseDestinosArray,
  parseDestinosFromRow,
  isVisibleForEmpleado,
  getEmpleadoSucursal,
}
