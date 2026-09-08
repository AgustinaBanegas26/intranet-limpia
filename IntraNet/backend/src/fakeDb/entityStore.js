const path = require('path')
const { readJsonFile, writeJsonFile } = require('./jsonStore')

const dataRoot = path.join(__dirname, '..', 'data')

function getEntityFilePath(entityName) {
  return path.join(dataRoot, `${entityName}.json`)
}

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

function writeEntity(entityName, data) {
  const filePath = getEntityFilePath(entityName)
  writeJsonFile(filePath, data)
}

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
