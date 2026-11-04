// Pruebas unitarias de las primitivas que protegen los códigos de recuperación.
// No conectan a Supabase ni envían correo; los escenarios integrados se prueban
// después de aplicar la migración y configurar SMTP en un entorno de prueba.
const test = require('node:test')
const assert = require('node:assert/strict')
const {
  generateRecoveryCode,
  hashRecoveryValue,
  hashRateLimitValue,
} = require('../src/utils/passwordRecoveryCrypto')

test('el código de recuperación contiene 256 bits aleatorios en hexadecimal', () => {
  const first = generateRecoveryCode()
  const second = generateRecoveryCode()

  assert.match(first, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
})

test('el hash del código es estable y no almacena el valor original', () => {
  const code = generateRecoveryCode()
  const digest = hashRecoveryValue(code)

  assert.match(digest, /^[a-f0-9]{64}$/)
  assert.equal(digest, hashRecoveryValue(code))
  assert.notEqual(digest, code)
})

test('los identificadores de límite requieren secreto y son deterministas', () => {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-only-recovery-secret-that-is-not-used-outside-tests'
  try {
    const emailHash = hashRateLimitValue('email:empleada@empresa.test')
    assert.match(emailHash, /^[a-f0-9]{64}$/)
    assert.equal(emailHash, hashRateLimitValue('email:empleada@empresa.test'))
    assert.notEqual(emailHash, hashRateLimitValue('ip:127.0.0.1'))
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  }
})
