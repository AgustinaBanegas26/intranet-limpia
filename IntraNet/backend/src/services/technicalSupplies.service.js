const supabase = require('../config/supabase')
const { notifyAdminsNewSolicitud, notifyEmpleadoSolicitudResuelta } = require('./notificaciones.service')
const { sendSolicitudNotification } = require('./emailService')

const VALID_REQUEST_STATUSES = ['pendiente', 'aprobada', 'rechazada']
const EMPLEADO_SELECT = 'id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo'

// Prepara el valor para su uso.
function normalizeId(id) {
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('invalid_id')
    err.code = 'invalid_id'
    throw err
  }
  return n
}

// Procesa los elementos de la coleccion.
function mapEmployee(emp) {
  if (!emp) return null
  return {
    id: emp.id,
    nombre: `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
    email: emp.email_corporativo || null,
    area: emp.area || null,
    sucursal: emp.sucursal || null,
    cargo: emp.cargo || null,
    legajo: emp.legajo || null,
  }
}

// Procesa los elementos de la coleccion.
function mapRequest(row) {
  const status = row.status || 'pendiente'
  return {
    id: row.id,
    empleado_id: row.empleado_id,
    email: row.email,
    comment: row.comment,
    amount: Number(row.amount),
    status,
    approved: status === 'aprobada',
    admin_comment: row.admin_comment || null,
    resolved_by: row.resolved_by || null,
    resolved_at: row.resolved_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    solicitante: mapEmployee(row.empleados),
  }
}

// Obtiene los datos necesarios.
async function fetchEmployeesMap(ids) {
  if (!ids.length) return new Map()
  const { data, error } = await supabase.from('empleados').select(EMPLEADO_SELECT).in('id', ids)
  if (error) throw error
  const map = new Map()
  // Recorre los elementos de la coleccion.
  for (const emp of data || []) map.set(emp.id, emp)
  return map
}

// Obtiene los datos necesarios.
async function getEmployeeById(id) {
  const empleadoId = normalizeId(id)
  const { data, error } = await supabase
    .from('empleados')
    .select(EMPLEADO_SELECT)
    .eq('id', empleadoId)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('employee_not_found')
    err.code = 'employee_not_found'
    throw err
  }
  return data
}

// Prepara el valor para su uso.
function parseAmount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

// Obtiene los datos necesarios.
async function listTechnicalSupplyRequests({ empleadoId = null, status = null } = {}) {
  let query = supabase.from('technical_supply_requests').select('*').order('created_at', { ascending: false })
  if (empleadoId) query = query.eq('empleado_id', empleadoId)
  if (status && status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const employees = await fetchEmployeesMap([...new Set(rows.map((row) => row.empleado_id))])
  return rows.map((row) => mapRequest({ ...row, empleados: employees.get(row.empleado_id) || null }))
}

// Crea el registro o elemento correspondiente.
async function createTechnicalSupplyRequest(empleadoId, payload) {
  const employee = await getEmployeeById(empleadoId)
  const comment = String(payload?.comment || payload?.comentario || '').trim()
  const amount = parseAmount(payload?.amount ?? payload?.monto)
  const email = String(employee.email_corporativo || payload?.email || '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !comment || amount == null) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('technical_supply_requests')
    .insert({
      empleado_id: normalizeId(empleadoId),
      email,
      comment,
      amount,
      status: 'pendiente',
    })
    .select('*')
    .single()

  if (error) throw error

  const mapped = mapRequest({ ...data, empleados: employee })
  try {
    await notifyAdminsNewSolicitud({
      solicitante: mapped.solicitante?.nombre || 'Un empleado',
      tipo: 'insumos Técnicos',
      descripcion: comment,
      count: 1,
    })
  } catch (err) {
    console.error('[technicalSupplies.service] Error al notificar admins:', err)
  }

  try {
    await sendSolicitudNotification({
      ...mapped,
      empleado: mapped.solicitante?.nombre || 'Un empleado',
      tipo: 'insumos Técnicos',
      fecha: mapped.created_at || new Date().toISOString(),
      descripcion: mapped.comment || 'Sin descripcion',
      estado: mapped.status || 'Pendiente',
      id: mapped.id,
    })
  } catch (err) {
    console.error('[technicalSupplies.service] Error al enviar correo:', err?.stack || err)
  }

  return mapped
}

// Actualiza los datos correspondientes.
async function updateTechnicalSupplyRequest(id, payload) {
  const requestId = normalizeId(id)
  const comment = String(payload?.comment || payload?.comentario || '').trim()
  const amount = parseAmount(payload?.amount ?? payload?.monto)
  const email = String(payload?.email || '').trim().toLowerCase()

  if (!comment || amount == null) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const patch = {
    comment,
    amount,
    updated_at: new Date().toISOString(),
  }
  if (email) patch.email = email

  const { data, error } = await supabase
    .from('technical_supply_requests')
    .update(patch)
    .eq('id', requestId)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const employees = await fetchEmployeesMap([data.empleado_id])
  return mapRequest({ ...data, empleados: employees.get(data.empleado_id) || null })
}

// Gestiona la operacion upsertTechnicalSupplyFichaForEmployee.
async function upsertTechnicalSupplyFichaForEmployee(empleadoId, payload) {
  const employee = await getEmployeeById(empleadoId)
  const comment = String(payload?.comment || payload?.comentario || '').trim()
  const amount = parseAmount(payload?.amount ?? payload?.monto)
  const email = String(payload?.email || employee.email_corporativo || '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !comment || amount == null) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data: existing, error: existingError } = await supabase
    .from('technical_supply_requests')
    .select('id')
    .eq('empleado_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError

  const row = {
    empleado_id: employee.id,
    email,
    comment,
    amount,
    updated_at: new Date().toISOString(),
  }

  const query = existing?.id
    ? supabase
      .from('technical_supply_requests')
      .update(row)
      .eq('id', existing.id)
    : supabase
      .from('technical_supply_requests')
      .insert({ ...row, status: 'pendiente' })

  const { data, error } = await query.select('*').single()
  if (error) throw error

  return mapRequest({ ...data, empleados: employee })
}

// Gestiona la operacion resolveTechnicalSupplyRequest.
async function resolveTechnicalSupplyRequest(id, { status, adminComment, resolvedBy }) {
  const requestId = normalizeId(id)
  if (!VALID_REQUEST_STATUSES.includes(status) || status === 'pendiente') {
    const err = new Error('invalid_status')
    err.code = 'invalid_status'
    throw err
  }

  const { data, error } = await supabase
    .from('technical_supply_requests')
    .update({
      status,
      admin_comment: adminComment || null,
      resolved_by: resolvedBy || null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const employees = await fetchEmployeesMap([data.empleado_id])
  const mapped = mapRequest({ ...data, empleados: employees.get(data.empleado_id) || null })
  try {
    await notifyEmpleadoSolicitudResuelta({
      empleadoId: data.empleado_id,
      tipo: 'insumos Técnicos',
      estado: status,
      comentario: adminComment,
      descripcion: mapped.comment,
    })
  } catch (err) {
    console.error('[technicalSupplies.service] Error al notificar empleado:', err)
  }
  return mapped
}

module.exports = {
  VALID_REQUEST_STATUSES,
  listTechnicalSupplyRequests,
  createTechnicalSupplyRequest,
  updateTechnicalSupplyRequest,
  upsertTechnicalSupplyFichaForEmployee,
  resolveTechnicalSupplyRequest,
}
