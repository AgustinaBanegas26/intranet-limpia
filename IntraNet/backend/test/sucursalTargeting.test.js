const test = require('node:test')
const assert = require('node:assert/strict')

const {
  ALL_SUCURSALES,
  isVisibleForEmpleado,
} = require('../src/utils/sucursalTargeting')

test('las publicaciones para todas las sedes son visibles para cualquier empleado', () => {
  assert.equal(isVisibleForEmpleado(ALL_SUCURSALES, 'Mar del Plata'), true)
  assert.equal(isVisibleForEmpleado(ALL_SUCURSALES, 'Buenos Aires'), true)
  assert.equal(isVisibleForEmpleado(ALL_SUCURSALES, null), true)
})

test('las publicaciones por sede conservan su audiencia específica', () => {
  assert.equal(isVisibleForEmpleado(['Mar del Plata'], 'Mar del Plata'), true)
  assert.equal(isVisibleForEmpleado(['Mar del Plata'], 'Buenos Aires'), false)
  assert.equal(isVisibleForEmpleado(['Mar del Plata'], null), false)
})
