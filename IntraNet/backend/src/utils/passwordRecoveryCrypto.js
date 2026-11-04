// Primitivas criptográficas sin acceso a red ni base de datos. El servicio de
// recuperación las comparte para producir y comparar códigos y seudónimos.
const crypto = require('node:crypto')

// Genera 256 bits aleatorios para que adivinar un código no sea práctico.
function generateRecoveryCode() {
  return crypto.randomBytes(32).toString('hex')
}

// Reduce el código a un SHA-256 no reversible que puede persistirse en PostgreSQL.
function hashRecoveryValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

// Seudonimiza correo e IP con un secreto propio del servidor para rate limit.
function hashRateLimitValue(value) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('recovery_secret_unavailable')
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex')
}

module.exports = { generateRecoveryCode, hashRecoveryValue, hashRateLimitValue }
