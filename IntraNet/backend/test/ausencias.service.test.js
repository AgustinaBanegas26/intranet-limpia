const test = require('node:test')
const assert = require('node:assert/strict')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const {
  assertValidTimeRange,
  isLlegadaTardeTipo,
} = require('../src/services/ausencias.service')

test('reconoce llegada tarde sin importar espacios, guiones o mayúsculas', () => {
  assert.equal(isLlegadaTardeTipo('llegada_tarde'), true)
  assert.equal(isLlegadaTardeTipo('Llegada tarde'), true)
  assert.equal(isLlegadaTardeTipo('LLEGADA-TARDE'), true)
  assert.equal(isLlegadaTardeTipo('Enfermedad'), false)
})

test('valida que el horario de una llegada tarde sea posterior', () => {
  assert.deepEqual(assertValidTimeRange('08:00', '09:15'), {
    horaDesde: '08:00',
    horaHasta: '09:15',
  })

  assert.throws(
    () => assertValidTimeRange('09:00', '09:00'),
    { code: 'invalid_time_range' },
  )
  assert.throws(
    () => assertValidTimeRange('09:00', 'invalida'),
    { code: 'invalid_time' },
  )
})
