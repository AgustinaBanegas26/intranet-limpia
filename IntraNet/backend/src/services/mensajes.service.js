const supabase = require('../config/supabase')

// Procesa los elementos de la coleccion.
function mapEmpleadoNombre(row) {
  if (!row) return '—'
  return `${row.nombre || ''} ${row.apellido || ''}`.trim() || '—'
}

// Procesa los elementos de la coleccion.
function mapMensaje(row, empleadosMap, carpeta) {
  const remitente = empleadosMap.get(row.remitente_id)
  const destinatario = empleadosMap.get(row.destinatario_id)
  return {
    id: row.id,
    remitente_id: row.remitente_id,
    destinatario_id: row.destinatario_id,
    from: mapEmpleadoNombre(remitente),
    to: mapEmpleadoNombre(destinatario),
    subject: row.asunto,
    body: row.cuerpo,
    date: row.created_at,
    read: Boolean(row.leido),
    folder: carpeta,
  }
}

// Obtiene los datos necesarios.
async function listContactos(empleadoId) {
  const { data, error } = await supabase
    .from('empleados')
    .select('id, nombre, apellido, email_corporativo, area, role')
    .eq('activo', true)
    .neq('id', empleadoId)
    .order('nombre', { ascending: true })
    .limit(200)

  if (error) throw error
  return (data || []).map((e) => ({
    id: e.id,
    nombre: mapEmpleadoNombre(e),
    email: e.email_corporativo,
    area: e.area,
    role: e.role,
  }))
}

// Obtiene los datos necesarios.
async function listMensajes(empleadoId, carpeta = 'inbox') {
  const isInbox = carpeta !== 'sent'
  const column = isInbox ? 'destinatario_id' : 'remitente_id'

  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .eq(column, empleadoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const rows = data || []
  const empIds = [...new Set(rows.flatMap((r) => [r.remitente_id, r.destinatario_id]))]
  let empleadosMap = new Map()

  if (empIds.length > 0) {
    const { data: emps, error: empErr } = await supabase
      .from('empleados')
      .select('id, nombre, apellido')
      .in('id', empIds)
    if (empErr) throw empErr
    empleadosMap = new Map((emps || []).map((e) => [e.id, e]))
  }

  return rows.map((row) => mapMensaje(row, empleadosMap, isInbox ? 'inbox' : 'sent'))
}

// Crea el registro o elemento correspondiente.
async function createMensaje(remitenteId, body) {
  const cuerpo = String(body.cuerpo || body.body || '').trim()
  const asunto = String(body.asunto || body.subject || '(Sin asunto)').trim()
  let destinatarioId = body.destinatario_id || body.to_id

  if (!destinatarioId && body.destinatario_email) {
    const { data: emp } = await supabase
      .from('empleados')
      .select('id')
      .eq('email_corporativo', String(body.destinatario_email).trim().toLowerCase())
      .maybeSingle()
    destinatarioId = emp?.id
  }

  if (!destinatarioId || !cuerpo) {
    const err = new Error('missing_fields')
    err.code = 'missing_fields'
    throw err
  }

  if (Number(destinatarioId) === Number(remitenteId)) {
    const err = new Error('invalid_recipient')
    err.code = 'invalid_recipient'
    throw err
  }

  const { data, error } = await supabase
    .from('mensajes')
    .insert({
      remitente_id: remitenteId,
      destinatario_id: destinatarioId,
      asunto,
      cuerpo,
      leido: false,
    })
    .select('*')
    .single()

  if (error) throw error

  const { data: emps } = await supabase
    .from('empleados')
    .select('id, nombre, apellido')
    .in('id', [data.remitente_id, data.destinatario_id])

  const empleadosMap = new Map((emps || []).map((e) => [e.id, e]))
  return mapMensaje(data, empleadosMap, 'sent')
}

// Gestiona la operacion markMensajeLeido.
async function markMensajeLeido(id, empleadoId) {
  const { data, error } = await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('id', id)
    .eq('destinatario_id', empleadoId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }
  return { success: true }
}

// Elimina el elemento indicado.
async function removeMensaje(id, empleadoId) {
  const { data: row, error: findErr } = await supabase
    .from('mensajes')
    .select('id, remitente_id, destinatario_id')
    .eq('id', id)
    .maybeSingle()

  if (findErr) throw findErr
  if (!row) {
    const err = new Error('not_found')
    err.code = 'not_found'
    throw err
  }

  const uid = Number(empleadoId)
  if (Number(row.remitente_id) !== uid && Number(row.destinatario_id) !== uid) {
    const err = new Error('forbidden')
    err.code = 'forbidden'
    throw err
  }

  const { error } = await supabase.from('mensajes').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

module.exports = {
  listContactos,
  listMensajes,
  createMensaje,
  markMensajeLeido,
  removeMensaje,
}
