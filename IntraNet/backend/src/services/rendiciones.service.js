// Servicio del backend: concentra reglas de negocio y acceso a datos para este dominio; las rutas HTTP delegan aquí las operaciones. Tema específico: rendiciones de gastos.
const supabase = require('../config/supabase')
const {
  notifyEmpleadoRendicionHabilitada,
  notifyAdminsNewSolicitud,
  notifyEmpleadoSolicitudResuelta,
} = require('./notificaciones.service')
const { sendSolicitudNotification } = require('./emailService')

const VALID_ESTADOS = ['pendiente', 'enviada', 'devuelta', 'aprobada']
const VALID_MEDIOS_PAGO = ['efectivo', 'tarjeta', 'comprobante']
const EMPLEADO_SELECT = 'id, nombre, apellido, email_corporativo, area, sucursal, cargo, legajo'

// Gestiona la operacion resolveTodayArg.
function resolveTodayArg() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// Prepara el valor para su uso.
function normalizeDateInput(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const parsed = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10) === raw ? raw : null
}

// Prepara el valor para su uso.
function parseAmount(value) {
  if (value == null || value === '') return null
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(amount * 100) / 100
}

// Procesa los elementos de la coleccion.
function mapEmpleado(emp) {
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
function mapViatico(row) {
  const solicitante = mapEmpleado(row.empleados)
  return {
    id: row.id,
    empleado_id: row.empleado_id,
    estado: row.estado,
    fecha_inicio: row.fecha_inicio || row.fecha_necesaria || row.fecha_desde || null,
    fecha_finalizacion: row.fecha_finalizacion || row.fecha_hasta || null,
    destino: row.destino_viaje || row.destino || row.destino_viaticos || null,
    motivo_viaje: row.motivo_viaje || row.motivo || null,
    motivo_solicitud: row.motivo_solicitud || null,
    monto_total: Number(row.monto_total ?? row.monto_solicitar ?? row.monto_estimado ?? row.monto ?? 0),
    nombre_completo: row.nombre_completo || row.nombre || solicitante?.nombre || null,
    correo: row.correo || row.email || solicitante?.email || null,
    area: row.area || solicitante?.area || null,
    solicitante,
  }
}

// Procesa los elementos de la coleccion.
function mapGasto(row) {
  return {
    id: row.id,
    rendicion_id: row.rendicion_id,
    fecha: row.fecha,
    concepto: row.concepto,
    observacion: row.observacion || null,
    medio_pago: row.medio_pago,
    importe: Number(row.importe),
    comprobante_url: row.comprobante_url || null,
    comprobante_nombre: row.comprobante_nombre || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// Procesa los elementos de la coleccion.
function mapRendicion(row, gastos = [], viatico = null) {
  const totalGastos = Number(row.total_gastos ?? gastos.reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0) ?? 0)
  const totalEfectivo = Number(row.total_efectivo ?? gastos.filter((gasto) => gasto.medio_pago === 'efectivo').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0) ?? 0)
  const totalTarjeta = Number(row.total_tarjeta ?? gastos.filter((gasto) => gasto.medio_pago === 'tarjeta').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0) ?? 0)
  const totalComprobantes = Number(row.total_comprobantes ?? gastos.filter((gasto) => gasto.medio_pago === 'comprobante').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0) ?? 0)

  return {
    id: row.id,
    viatico_id: row.viatico_id,
    empleado_id: row.empleado_id,
    estado: row.estado,
    fecha_rendicion: row.fecha_rendicion,
    fecha_habilitacion: row.fecha_habilitacion,
    fecha_envio: row.fecha_envio,
    fecha_aprobacion: row.fecha_aprobacion,
    fecha_devolucion: row.fecha_devolucion,
    enviado_por: row.enviado_por,
    aprobado_por: row.aprobado_por,
    devuelto_por: row.devuelto_por,
    motivo_devolucion: row.motivo_devolucion || null,
    observaciones: row.observaciones || null,
    monto_solicitado: Number(row.monto_solicitado ?? viatico?.monto_total ?? 0),
    total_gastos: totalGastos,
    total_efectivo: totalEfectivo,
    total_tarjeta: totalTarjeta,
    total_comprobantes: totalComprobantes,
    diferencia: Number(row.diferencia ?? Number(row.monto_solicitado ?? viatico?.monto_total ?? 0) - totalGastos),
    habilitada_notificada_at: row.habilitada_notificada_at || null,
    enviada_notificada_at: row.enviada_notificada_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    viatico: viatico || null,
    gastos,
  }
}

// Obtiene los datos necesarios.
async function fetchEmpleadosMap(ids) {
  if (!ids.length) return new Map()

  const { data, error } = await supabase
    .from('empleados')
    .select(EMPLEADO_SELECT)
    .in('id', ids)

  if (error) throw error

  const map = new Map()
  // Recorre los elementos de la coleccion.
  for (const emp of data || []) {
    map.set(emp.id, emp)
  }
  return map
}

// Obtiene los datos necesarios.
async function fetchViaticoById(viaticoId) {
  const { data, error } = await supabase
    .from('viaticos')
    .select('*')
    .eq('id', viaticoId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const empMap = await fetchEmpleadosMap([data.empleado_id])
  return mapViatico({ ...data, empleados: empMap.get(data.empleado_id) || null })
}

// Comprueba los datos o la condicion indicada.
function isViaticoAprobado(viatico) {
  const estado = String(viatico?.estado || '').trim().toLowerCase()
  return estado === 'aprobada' || estado === 'aprobado' || estado === 'approved'
}

// Gestiona la operacion resolveMontoAprobado.
function resolveMontoAprobado(viatico) {
  return Number(viatico?.monto_total ?? viatico?.monto_solicitar ?? viatico?.monto ?? 0)
}

// Comprueba los datos o la condicion indicada.
function isViaticoFinalizado(viatico, todayIso = resolveTodayArg()) {
  const fechaFin = normalizeDateInput(viatico?.fecha_finalizacion || viatico?.fecha_hasta || viatico?.fecha_inicio || viatico?.fecha_necesaria)
  if (!fechaFin) return false
  return fechaFin <= todayIso
}

// Procesa los elementos de la coleccion.
function mapRendicionToSolicitud(rendicion, viatico = null, gastos = []) {
  const v = viatico || rendicion?.viatico || null
  const g = gastos.length ? gastos : (rendicion?.gastos || [])
  const rendicionEstado = String(rendicion?.estado || '').trim().toLowerCase()

  let solicitudEstado = 'pendiente'
  if (rendicionEstado === 'aprobada') solicitudEstado = 'aprobada'
  else if (rendicionEstado === 'enviada') solicitudEstado = 'pendiente'

  const solicitante = v?.solicitante || (v ? {
    id: v.empleado_id,
    nombre: v.nombre_completo || '',
    email: v.correo || null,
    area: v.area || null,
    sucursal: null,
    cargo: null,
    legajo: null,
  } : null)

  return {
    id: `rendicion_viaticos:${rendicion.id}`,
    empleado_id: rendicion.empleado_id,
    tipo: 'rendicion_viaticos',
    estado: solicitudEstado,
    fecha_desde: v?.fecha_inicio || null,
    fecha_hasta: v?.fecha_finalizacion || null,
    destino: v?.destino || null,
    descripcion: v?.destino ? `Rendición de viáticos — ${v.destino}` : 'Rendición de viáticos',
    monto_estimado: Number(rendicion.total_gastos ?? 0),
    justificacion: rendicion.observaciones || null,
    comentario_admin: rendicion.motivo_devolucion || null,
    grupo_id: null,
    datos_extra: {
      rendicion_id: rendicion.id,
      viatico_id: rendicion.viatico_id,
      rendicion_estado: rendicion.estado,
      monto_solicitado: Number(rendicion.monto_solicitado ?? 0),
      monto_aprobado: Number(rendicion.monto_solicitado ?? 0),
      total_gastos: Number(rendicion.total_gastos ?? 0),
      diferencia: Number(rendicion.diferencia ?? 0),
      total_efectivo: Number(rendicion.total_efectivo ?? 0),
      total_tarjeta: Number(rendicion.total_tarjeta ?? 0),
      total_comprobantes: Number(rendicion.total_comprobantes ?? 0),
      observaciones: rendicion.observaciones || null,
      fecha_envio: rendicion.fecha_envio || null,
      viatico: v ? {
        id: v.id,
        destino: v.destino,
        fecha_inicio: v.fecha_inicio,
        fecha_finalizacion: v.fecha_finalizacion,
        motivo_viaje: v.motivo_viaje,
        monto_total: v.monto_total,
      } : null,
      gastos: g,
    },
    created_at: rendicion.fecha_envio || rendicion.created_at,
    solicitante,
  }
}

// Obtiene los datos necesarios.
async function listRendicionSolicitudes({ estado = null } = {}) {
  let query = supabase
    .from('viaticos_rendiciones')
    .select('*')
    .order('updated_at', { ascending: false })

  if (estado === 'pendiente') {
    query = query.eq('estado', 'enviada')
  } else if (estado === 'aprobada') {
    query = query.eq('estado', 'aprobada')
  } else if (estado === 'rechazada') {
    return []
  } else {
    query = query.in('estado', ['enviada', 'aprobada'])
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const viaticos = await Promise.all(rows.map((row) => fetchViaticoById(row.viatico_id)))
  const gastosMap = await fetchGastosByRendicionIds(rows.map((row) => row.id))

  return rows.map((row, index) => {
    const viatico = viaticos[index]
    const gastos = gastosMap.get(row.id) || []
    const rendicion = mapRendicion(row, gastos, viatico)
    return mapRendicionToSolicitud(rendicion, viatico, gastos)
  })
}

// Obtiene los datos necesarios.
async function fetchExistingRendicionByViaticoId(viaticoId) {
  const { data, error } = await supabase
    .from('viaticos_rendiciones')
    .select('*')
    .eq('viatico_id', viaticoId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

// Obtiene los datos necesarios.
async function fetchGastosByRendicionIds(ids) {
  if (!ids.length) return new Map()

  const { data, error } = await supabase
    .from('viaticos_rendiciones_gastos')
    .select('*')
    .in('rendicion_id', ids)
    .order('fecha', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const map = new Map()
  // Recorre los elementos de la coleccion.
  for (const gasto of data || []) {
    const current = map.get(gasto.rendicion_id) || []
    current.push(mapGasto(gasto))
    map.set(gasto.rendicion_id, current)
  }
  return map
}

// Gestiona la operacion refreshRendicionTotals.
async function refreshRendicionTotals(rendicionId) {
  const { data: rendicion, error: rendicionError } = await supabase
    .from('viaticos_rendiciones')
    .select('*')
    .eq('id', rendicionId)
    .maybeSingle()

  if (rendicionError) throw rendicionError
  if (!rendicion) return null

  const { data: gastos, error: gastosError } = await supabase
    .from('viaticos_rendiciones_gastos')
    .select('medio_pago, importe')
    .eq('rendicion_id', rendicionId)

  if (gastosError) throw gastosError

  const list = gastos || []
  const totalGastos = list.reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0)
  const totalEfectivo = list.filter((gasto) => gasto.medio_pago === 'efectivo').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0)
  const totalTarjeta = list.filter((gasto) => gasto.medio_pago === 'tarjeta').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0)
  const totalComprobantes = list.filter((gasto) => gasto.medio_pago === 'comprobante').reduce((sum, gasto) => sum + Number(gasto.importe || 0), 0)
  const montoAprobado = Number(rendicion.monto_solicitado || 0)

  const { data, error } = await supabase
    .from('viaticos_rendiciones')
    .update({
      total_gastos: totalGastos,
      total_efectivo: totalEfectivo,
      total_tarjeta: totalTarjeta,
      total_comprobantes: totalComprobantes,
      diferencia: montoAprobado - totalGastos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rendicionId)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data || rendicion
}

// Gestiona la operacion ensureRendicionForViatico.
async function ensureRendicionForViatico(viatico, { todayIso = resolveTodayArg(), notify = true } = {}) {
  if (!viatico) return null

  const existing = await fetchExistingRendicionByViaticoId(viatico.id)
  if (existing) {
    const montoAprobado = resolveMontoAprobado(viatico)
    if (montoAprobado > 0 && Number(existing.monto_solicitado || 0) !== montoAprobado) {
      const totalGastos = Number(existing.total_gastos || 0)
      await supabase
        .from('viaticos_rendiciones')
        .update({
          monto_solicitado: montoAprobado,
          diferencia: montoAprobado - totalGastos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      existing.monto_solicitado = montoAprobado
      existing.diferencia = montoAprobado - totalGastos
    }
    if (notify && !existing.habilitada_notificada_at && isViaticoAprobado(viatico) && isViaticoFinalizado(viatico, todayIso)) {
      try {
        await notifyEmpleadoRendicionHabilitada({
          empleadoId: viatico.empleado_id,
          destino: viatico.destino,
          viaticoId: viatico.id,
        })
      } catch (notifyError) {
        console.error('[rendiciones.service] notifyEmpleadoRendicionHabilitada(existing):', notifyError)
      }
    }
    const gastosMap = await fetchGastosByRendicionIds([existing.id])
    const gastos = gastosMap.get(existing.id) || []
    return mapRendicion(existing, gastos, viatico)
  }

  if (!isViaticoAprobado(viatico) || !isViaticoFinalizado(viatico, todayIso)) {
    return null
  }

  const montoAprobado = resolveMontoAprobado(viatico)
  const { data, error } = await supabase
    .from('viaticos_rendiciones')
    .insert({
      viatico_id: viatico.id,
      empleado_id: viatico.empleado_id,
      estado: 'pendiente',
      fecha_rendicion: todayIso,
      fecha_habilitacion: new Date().toISOString(),
      monto_solicitado: montoAprobado,
      total_gastos: 0,
      total_efectivo: 0,
      total_tarjeta: 0,
      total_comprobantes: 0,
      diferencia: montoAprobado,
    })
    .select('*')
    .maybeSingle()

  if (error) {
    if (String(error.message || '').toLowerCase().includes('unique')) {
      const retry = await fetchExistingRendicionByViaticoId(viatico.id)
      if (!retry) throw error
      const gastosMap = await fetchGastosByRendicionIds([retry.id])
      const gastos = gastosMap.get(retry.id) || []
      return mapRendicion(retry, gastos, viatico)
    }
    throw error
  }

  if (notify) {
    try {
      await notifyEmpleadoRendicionHabilitada({
        empleadoId: viatico.empleado_id,
        destino: viatico.destino,
        viaticoId: viatico.id,
      })
    } catch (notifyError) {
      console.error('[rendiciones.service] notifyEmpleadoRendicionHabilitada:', notifyError)
    }
  }

  const gastos = []
  return mapRendicion(data, gastos, viatico)
}

// Gestiona la operacion syncEligibleRendiciones.
async function syncEligibleRendiciones({ viaticoId = null, empleadoId = null } = {}) {
  let query = supabase
    .from('viaticos')
    .select('*')

  if (viaticoId != null) {
    query = query.eq('id', viaticoId)
  }
  if (empleadoId != null) {
    query = query.eq('empleado_id', empleadoId)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const employeeIds = [...new Set(rows.map((row) => row.empleado_id))]
  const employees = await fetchEmpleadosMap(employeeIds)
  const todayIso = resolveTodayArg()
  const eligible = []

  // Recorre los elementos de la coleccion.
  for (const row of rows) {
    const viatico = mapViatico({ ...row, empleados: employees.get(row.empleado_id) || null })
    if (isViaticoAprobado(viatico) && isViaticoFinalizado(viatico, todayIso)) {
      eligible.push(viatico)
    }
  }

  const created = []
  // Recorre los elementos de la coleccion.
  for (const viatico of eligible) {
    const rendicion = await ensureRendicionForViatico(viatico, { todayIso, notify: true })
    if (rendicion) created.push(rendicion)
  }

  return created
}

// Obtiene los datos necesarios.
async function listRendiciones({ empleadoId = null, estado = null, viaticoId = null, isAdmin = false } = {}) {
  await syncEligibleRendiciones({ viaticoId, empleadoId: isAdmin ? null : empleadoId })

  let query = supabase.from('viaticos_rendiciones').select('*').order('created_at', { ascending: false })
  if (!isAdmin && empleadoId != null) query = query.eq('empleado_id', Number(empleadoId))
  if (estado && estado !== 'todos') query = query.eq('estado', estado)
  if (viaticoId != null) query = query.eq('viatico_id', viaticoId)

  const { data, error } = await query
  if (error) throw error

  const rendiciones = data || []
  const viaticos = await Promise.all(rendiciones.map((row) => fetchViaticoById(row.viatico_id)))
  const gastosMap = await fetchGastosByRendicionIds(rendiciones.map((row) => row.id))
  const employeeIds = [...new Set(rendiciones.map((row) => row.empleado_id))]
  const employees = await fetchEmpleadosMap(employeeIds)

  return rendiciones.map((row, index) => {
    const viatico = viaticos[index]
    const gastos = gastosMap.get(row.id) || []
    return mapRendicion({ ...row, empleados: employees.get(row.empleado_id) || null }, gastos, viatico)
  })
}

// Obtiene los datos necesarios.
async function getRendicionById(id, { empleadoId = null, isAdmin = false } = {}) {
  await syncEligibleRendiciones()

  const { data: rendicion, error } = await supabase
    .from('viaticos_rendiciones')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!rendicion) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!isAdmin && Number(rendicion.empleado_id) !== Number(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  const viatico = await fetchViaticoById(rendicion.viatico_id)
  const gastosMap = await fetchGastosByRendicionIds([rendicion.id])
  const gastos = gastosMap.get(rendicion.id) || []
  return mapRendicion(rendicion, gastos, viatico)
}

// Obtiene los datos necesarios.
async function getRendicionByViaticoId(viaticoId, { empleadoId = null, isAdmin = false } = {}) {
  await syncEligibleRendiciones({ viaticoId })

  const viatico = await fetchViaticoById(viaticoId)
  if (!viatico) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (!isAdmin && Number(viatico.empleado_id) !== Number(empleadoId)) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  const existing = await fetchExistingRendicionByViaticoId(viaticoId)
  if (!existing) return null

  const gastosMap = await fetchGastosByRendicionIds([existing.id])
  return mapRendicion(existing, gastosMap.get(existing.id) || [], viatico)
}

// Gestiona la operacion assertEditableState.
function assertEditableState(rendicion) {
  const estado = String(rendicion?.estado || '').toLowerCase()
  if (!['pendiente', 'devuelta'].includes(estado)) {
    const err = new Error('cannot_edit_resolved')
    err.code = 'cannot_edit_resolved'
    throw err
  }
}

// Actualiza los datos correspondientes.
async function updateRendicion(id, empleadoId, body, { isAdmin = false } = {}) {
  const rendicion = await getRendicionById(id, { empleadoId, isAdmin })
  assertEditableState(rendicion)

  const observaciones = body?.observaciones != null ? String(body.observaciones).trim() : rendicion.observaciones

  const { data, error } = await supabase
    .from('viaticos_rendiciones')
    .update({
      observaciones: observaciones || null,
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

  return getRendicionById(id, { empleadoId, isAdmin })
}

// Obtiene los datos necesarios.
async function listGastosByRendicion(id) {
  const { data, error } = await supabase
    .from('viaticos_rendiciones_gastos')
    .select('*')
    .eq('rendicion_id', id)
    .order('fecha', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(mapGasto)
}

// Comprueba los datos o la condicion indicada.
function validateGastoFechaEnPeriodo(viatico, fecha) {
  const inicio = normalizeDateInput(viatico?.fecha_inicio || viatico?.fecha_necesaria)
  const fin = normalizeDateInput(viatico?.fecha_finalizacion || viatico?.fecha_hasta)
  if (!inicio || !fin || !fecha) return false
  return fecha >= inicio && fecha <= fin
}

// Gestiona la operacion upsertGasto.
async function upsertGasto(rendicionId, gastoId, body, { empleadoId = null, isAdmin = false } = {}) {
  const rendicion = await getRendicionById(rendicionId, { empleadoId, isAdmin })
  assertEditableState(rendicion)

  const fecha = normalizeDateInput(body?.fecha)
  const concepto = String(body?.concepto || '').trim()
  const observacion = String(body?.observacion || '').trim()
  const medioPago = String(body?.medio_pago || '').trim().toLowerCase()
  const importe = parseAmount(body?.importe)
  const comprobanteUrl = body?.comprobante_url ? String(body.comprobante_url).trim() : null
  const comprobanteNombre = body?.comprobante_nombre ? String(body.comprobante_nombre).trim() : null

  if (!fecha || !concepto || !VALID_MEDIOS_PAGO.includes(medioPago) || importe == null) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  const viatico = rendicion.viatico || (await fetchViaticoById(rendicion.viatico_id))
  if (!validateGastoFechaEnPeriodo(viatico, fecha)) {
    const err = new Error('invalid_gasto_fecha')
    err.code = 'invalid_gasto_fecha'
    throw err
  }

  if (medioPago === 'comprobante' && !comprobanteUrl) {
    const err = new Error('missing_comprobante')
    err.code = 'missing_comprobante'
    throw err
  }

  const payload = {
    rendicion_id: rendicionId,
    fecha,
    concepto,
    observacion: observacion || null,
    medio_pago: medioPago,
    importe,
    comprobante_url: comprobanteUrl,
    comprobante_nombre: comprobanteNombre,
    updated_at: new Date().toISOString(),
  }

  let result
  if (gastoId) {
    const { data, error } = await supabase
      .from('viaticos_rendiciones_gastos')
      .update(payload)
      .eq('id', gastoId)
      .eq('rendicion_id', rendicionId)
      .select('*')
      .maybeSingle()

    if (error) throw error
    result = data
  } else {
    const { data, error } = await supabase
      .from('viaticos_rendiciones_gastos')
      .insert(payload)
      .select('*')
      .maybeSingle()

    if (error) throw error
    result = data
  }

  if (!result) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  await refreshRendicionTotals(rendicionId)
  return getRendicionById(rendicionId, { empleadoId, isAdmin })
}

// Elimina el elemento indicado.
async function removeGasto(rendicionId, gastoId, { empleadoId = null, isAdmin = false } = {}) {
  const rendicion = await getRendicionById(rendicionId, { empleadoId, isAdmin })
  assertEditableState(rendicion)

  const { error } = await supabase
    .from('viaticos_rendiciones_gastos')
    .delete()
    .eq('id', gastoId)
    .eq('rendicion_id', rendicionId)

  if (error) throw error

  await refreshRendicionTotals(rendicionId)
  return { success: true }
}

// envia la solicitud correspondiente.
async function sendRendicion(id, empleadoId, body = {}, { isAdmin = false } = {}) {
  const rendicion = await getRendicionById(id, { empleadoId, isAdmin })
  assertEditableState(rendicion)

  const gastos = await listGastosByRendicion(id)
  if (!gastos.length) {
    const err = new Error('missing_gastos')
    err.code = 'missing_gastos'
    throw err
  }

  const observaciones = body?.observaciones != null ? String(body.observaciones).trim() : rendicion.observaciones
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('viaticos_rendiciones')
    .update({
      estado: 'enviada',
      observaciones: observaciones || null,
      fecha_envio: now,
      enviado_por: empleadoId,
      updated_at: now,
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

  await refreshRendicionTotals(id)
  const refreshed = await getRendicionById(id, { empleadoId, isAdmin })
  const viatico = refreshed?.viatico || (await fetchViaticoById(data.viatico_id))
  const gastosList = refreshed?.gastos || gastos
  const solicitud = mapRendicionToSolicitud(refreshed || mapRendicion(data, gastosList, viatico), viatico, gastosList)

  try {
    await notifyAdminsNewSolicitud({
      solicitante: viatico?.nombre_completo || viatico?.solicitante?.nombre || 'Un empleado',
      tipo: 'rendicion_viaticos',
      descripcion: solicitud.descripcion || viatico?.destino || 'Rendición de viáticos',
    })
  } catch (notifyError) {
    console.error('[rendiciones.service] notifyAdminsNewSolicitud:', notifyError)
  }

  try {
    await sendSolicitudNotification({
      ...solicitud,
      empleado: viatico?.nombre_completo || viatico?.solicitante?.nombre || 'Un empleado',
      estado: 'pendiente',
      fecha: solicitud.created_at,
    })
  } catch (emailError) {
    console.error('[rendiciones.service] Error al enviar correo de rendición:', emailError?.stack || emailError)
  }

  return refreshed || mapRendicion(data, gastosList, viatico)
}

// Gestiona la operacion resolveRendicion.
async function resolveRendicion(id, { estado, comentario, resueltoPor }) {
  const normalized = String(estado || '').trim().toLowerCase()
  if (!['aprobada', 'devuelta'].includes(normalized)) {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const { data: existing, error: fetchError } = await supabase
    .from('viaticos_rendiciones')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  if (String(existing.estado || '').trim().toLowerCase() !== 'enviada') {
    const err = new Error('invalid_estado')
    err.code = 'invalid_estado'
    throw err
  }

  const now = new Date().toISOString()
  const patch = {
    estado: normalized,
    updated_at: now,
  }

  if (normalized === 'aprobada') {
    patch.fecha_aprobacion = now
    patch.aprobado_por = resueltoPor || null
  }

  if (normalized === 'devuelta') {
    patch.fecha_devolucion = now
    patch.devuelto_por = resueltoPor || null
    patch.motivo_devolucion = comentario || null
  }

  const { data, error } = await supabase
    .from('viaticos_rendiciones')
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

  const viatico = await fetchViaticoById(data.viatico_id)
  const gastosMap = await fetchGastosByRendicionIds([id])
  const gastosResolved = gastosMap.get(id) || []

  try {
    await notifyEmpleadoSolicitudResuelta({
      empleadoId: data.empleado_id,
      tipo: 'rendicion_viaticos',
      estado: normalized === 'aprobada' ? 'aprobada' : 'rechazada',
      comentario,
      descripcion: viatico?.destino || null,
    })
  } catch (notifyError) {
    console.error('[rendiciones.service] notifyEmpleadoSolicitudResuelta:', notifyError)
  }

  if (normalized === 'aprobada') {
    try {
      const solicitud = mapRendicionToSolicitud(mapRendicion(data, gastosResolved, viatico), viatico, gastosResolved)
      await sendSolicitudNotification({
        ...solicitud,
        empleado: viatico?.nombre_completo || viatico?.solicitante?.nombre || 'Un empleado',
        estado: 'aprobada',
        etapa: 'aprobada',
        fecha: solicitud.created_at,
      })
    } catch (emailError) {
      console.error('[rendiciones.service] Error al enviar correo de aprobación:', emailError?.stack || emailError)
    }
  }

  return mapRendicion(data, gastosResolved, viatico)
}

module.exports = {
  VALID_ESTADOS,
  VALID_MEDIOS_PAGO,
  resolveTodayArg,
  syncEligibleRendiciones,
  listRendiciones,
  listRendicionSolicitudes,
  mapRendicionToSolicitud,
  getRendicionById,
  getRendicionByViaticoId,
  ensureRendicionForViatico,
  updateRendicion,
  upsertGasto,
  removeGasto,
  sendRendicion,
  resolveRendicion,
  refreshRendicionTotals,
}
