//este archivo se encarga de manejar los registros de actividad del sistema,
// y permite agregar nuevos registros y listar los registros existentes.
const crypto = require('crypto')
const { readEntity, updateEntity } = require('./entityStore')

const ACTIVITY_LOGS_ENTITY = 'activity_logs'
const isVercel = process.env.VERCEL === '1'

// Crea el registro o elemento correspondiente.
function appendActivityLog(log) {
  if (isVercel) {
    return null
  }
// Recorre los elementos de la coleccion.
  return updateEntity(ACTIVITY_LOGS_ENTITY, (current) => {
    const nextLog = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...log,
    }

    return {
      version: current.version + 1,
      items: [nextLog, ...current.items].slice(0, 500),
    }
  })
}

// Obtiene los datos necesarios.
function listActivityLogs() {
  const current = readEntity(ACTIVITY_LOGS_ENTITY)
  return current.items
}

module.exports = {
  appendActivityLog,
  listActivityLogs,
}
