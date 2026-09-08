const supabase = require('../config/supabase')
const { notifyAdminsNewSolicitud, notifyEmpleadoAdelantoResuelta } = require('./notificaciones.service')
const { sendSolicitudNotification } = require('./emailService')

const VALID_ESTADOS = ['pendiente', 'aprobada', 'rechazada']
const EMPLEADO_SELECT = 'id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo, foto_url'

function mapEmpleado(emp) {
  if (!emp) return null
  return {
    id: emp.id,
    nombre: `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
    nombre_solo: emp.nombre || null,
    apellido: emp.apellido || null,
    email: emp.email_corporativo || null,
    area: emp.area || null,
    sucursal: emp.sucursal || null,
    cargo: emp.cargo || null,
    legajo: emp.legajo || null,
    foto: emp.foto_url || null,
  }
}

function mapAdelanto(row) {
  return {
    id: row.id,
    empleado_id: row.empleado_id,
    monto: Number(row.monto),
    empresa: row.empresa || '',
    estado: row.estado || 'pendiente',
    comentario_admin: row.comentario_admin || null,
    resuelto_por: row.resuelto_por || null,
    fecha_resolucion: row.fecha_resolucion || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    solicitante: mapEmpleado(row.empleados),
  }
}

async function fetchEmpleadosMap(ids) {
  if (!ids.length) return new Map()
  const extended = await supabase.from('empleados').select(EMPLEADO_SELECT).in('id', ids)
  if (!extended.error) {
    const map = new Map()
    for (const emp of extended.data || []) map.set(emp.id, emp)
    return map
  }

  const msg = String(extended.error.message || '')
  if (msg.includes('foto_url')) {
    const base = await supabase
      .from('empleados')
      .select('id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo')
      .in('id', ids)
    if (base.error) throw base.error
    const map = new Map()
    for (const emp of base.data || []) map.set(emp.id, emp)
    return map
  }

  throw extended.error
}

function parseMonto(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

async function listAdelantos({ empleadoId = null, estado = null, empleadoQuery = null } = {}) {
  let query = supabase.from('adelantos').select('*').order('created_at', { ascending: false })
  if (empleadoId) query = query.eq('empleado_id', empleadoId)
  if (estado && estado !== 'todos') query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const empMap = await fetchEmpleadosMap([...new Set(rows.map((r) => r.empleado_id))])
  let results = rows.map((row) => mapAdelanto({ ...row, empleados: empMap.get(row.empleado_id) || null }))

  if (empleadoQuery) {
    const q = String(empleadoQuery).trim().toLowerCase()
    results = results.filter((row) => String(row.solicitante?.nombre || '').toLowerCase().includes(q))
  }

  return results
}

async function createAdelanto(empleadoId, body) {
  const monto = parseMonto(body.monto ?? body.monto_solicitado)
  const empresa = String(body.empresa || '').trim()

  if (monto == null || !empresa) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const { data, error } = await supabase
    .from('adelantos')
    .insert({
      empleado_id: empleadoId,
      monto,
      empresa,
      estado: 'pendiente',
    })
    .select('*')
    .single()

  if (error) throw error

  const empMap = await fetchEmpleadosMap([empleadoId])
  const mapped = mapAdelanto({ ...data, empleados: empMap.get(empleadoId) || null })

  try {
    await notifyAdminsNewSolicitud({
      solicitante: mapped.solicitante?.nombre || 'Un empleado',
      tipo: 'adelanto',
      descripcion: `Adelanto de $${mapped.monto} — ${mapped.empresa}`,
      count: 1,
    })
  } catch (notifyErr) {
    console.error('[adelantos.service] Error al notificar admins:', notifyErr)
  }

  try {
    await sendSolicitudNotification({
      ...mapped,
      empleado: mapped.solicitante?.nombre || 'Un empleado',
      tipo: 'adelanto',
      fecha: mapped.created_at || new Date().toISOString(),
      descripcion: `Adelanto de $${mapped.monto} — ${mapped.empresa}`,
      estado: mapped.estado || 'Pendiente',
      id: mapped.id,
    })
  } catch (emailErr) {
    console.error('[adelantos.service] Error al enviar correo:', emailErr?.stack || emailErr)
  }

  return mapped
}

async function resolveAdelanto(id, { estado, comentario, resueltoPor }) {
  if (!VALID_ESTADOS.includes(estado) || estado === 'pendiente') {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const { data: existing, error: fetchError } = await supabase
    .from('adelantos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const { data, error } = await supabase
    .from('adelantos')
    .update({
      estado,
      comentario_admin: comentario || null,
      resuelto_por: resueltoPor || null,
      fecha_resolucion: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const empMap = await fetchEmpleadosMap([data.empleado_id])
  const mapped = mapAdelanto({ ...data, empleados: empMap.get(data.empleado_id) || null })

  await notifyEmpleadoAdelantoResuelta({
    empleadoId: data.empleado_id,
    estado,
    comentario,
    monto: mapped.monto,
    empresa: mapped.empresa,
    solicitante: mapped.solicitante?.nombre || 'Un empleado',
  })

  if (estado === 'aprobada') {
    try {
      await sendSolicitudNotification({
        ...mapped,
        empleado: mapped.solicitante?.nombre || 'Un empleado',
        tipo: 'adelanto',
        fecha: mapped.created_at || new Date().toISOString(),
        descripcion: `Adelanto de $${mapped.monto} — ${mapped.empresa}`,
        estado: 'aprobada',
        etapa: 'aprobada',
        id: mapped.id,
      })
    } catch (emailErr) {
      console.error('[adelantos.service] Error al enviar correo de aprobación:', emailErr?.stack || emailErr)
    }
  }

  return mapped
}

async function removeAdelanto(id, { empleadoId = null, isAdmin = false } = {}) {
  const { data: existing, error: fetchError } = await supabase
    .from('adelantos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!isAdmin && Number(existing.empleado_id) !== Number(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  if (!isAdmin && existing.estado !== 'pendiente') {
    const err = new Error('cannot_delete_resolved')
    err.code = 'cannot_delete_resolved'
    throw err
  }

  const { error } = await supabase.from('adelantos').delete().eq('id', id)
  if (error) throw error

  return { success: true }
}

module.exports = {
  listAdelantos,
  createAdelanto,
  resolveAdelanto,
  removeAdelanto,
}
