//este archivo se encarga de manejar el almacenamiento de entidades en archivos JSON,
// y permite leer, escribir y actualizar los datos de las entidades.
const path = require('path')
const { readJsonFile, writeJsonFile } = require('./jsonStore')

const dataRoot = path.join(__dirname, '..', 'data')

// Obtiene los datos necesarios.
function getEntityFilePath(entityName) {
  return path.join(dataRoot, `${entityName}.json`)
}

// Obtiene los datos necesarios.
function readEntity(entityName) {
  const filePath = getEntityFilePath(entityName)
  const initial = { version: 0, items: [] }
  const data = readJsonFile(filePath, initial)
  if (data && typeof data.version === 'number' && Array.isArray(data.items)) {
    return data
  }
  if (Array.isArray(data)) {
    const migrated = { version: 0, items: data }
    writeJsonFile(filePath, migrated)
    return migrated
  }
  return initial
}

// Gestiona la operacion writeEntity.
function writeEntity(entityName, data) {
  const filePath = getEntityFilePath(entityName)
  writeJsonFile(filePath, data)
}

// Actualiza los datos correspondientes.
function updateEntity(entityName, updater) {
  const current = readEntity(entityName)
  const next = updater(current)
  writeEntity(entityName, next)
  return next
}

module.exports = {
  readEntity,
  writeEntity,
  updateEntity,
}
