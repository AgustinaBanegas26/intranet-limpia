const fs = require('fs')
const path = require('path')

// Gestiona la operacion ensureDir.
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Obtiene los datos necesarios.
function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_err) {
    return fallback
  }
}

// Gestiona la operacion writeJsonFile.
function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

module.exports = {
  readJsonFile,
  writeJsonFile,
}

