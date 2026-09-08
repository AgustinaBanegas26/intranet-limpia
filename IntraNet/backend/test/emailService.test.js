const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getCajaDestinatarioParaAdelanto,
  getDestinatarios,
  getDestinatariosPorEtapa,
  getDestinatariosParaEtapa,
  buildEmailHtml,
} = require('../src/services/emailService')

const CAJA_BRASIL = process.env.EMAIL_CAJA_BRASIL || 'cajabrasil@gruponucleo.com.ar'
const CAJA_MDP = process.env.EMAIL_CAJA_MDP || process.env.EMAIL_CAJA || 'cajamdp@gruponucleo.com.ar'
const RRHH = process.env.EMAIL_RRHH || 'rrhh@gruponucleo.com.ar'
const TESORERIA = process.env.EMAIL_TESORERIA || 'tesoreria@gruponucleo.com.ar'
const PROVEEDORES = process.env.EMAIL_PROVEEDORES || 'proveedores@gruponucleo.com.ar'

test('enruta adelantos de acuerdo con la sucursal real del solicitante', () => {
  const cases = [
    ['CABA', CAJA_BRASIL],
    ['Buenos Aires', CAJA_BRASIL],
    ['CABA · Buenos Aires', CAJA_BRASIL],
    ['Mar del Plata', CAJA_MDP],
    ['CORRIENTES', CAJA_MDP],
    ['Mar del Plata · Buenos Aires', CAJA_MDP],
    ['  mAr DeL pLaTa · buenos aires  ', CAJA_MDP],
  ]

  for (const [sucursal, expected] of cases) {
    assert.equal(getCajaDestinatarioParaAdelanto(sucursal), expected, sucursal)
  }
})

test('solo los adelantos agregan un destinatario de Caja por sucursal', () => {
  const solicitud = { solicitante: { sucursal: 'Buenos Aires' } }
  const destinatariosAdelanto = getDestinatarios('adelanto', solicitud)
  const destinatariosAusencia = getDestinatarios('ausencias', solicitud)

  assert.ok(destinatariosAdelanto.includes(CAJA_BRASIL))
  assert.deepEqual(destinatariosAdelanto, [RRHH, TESORERIA, CAJA_BRASIL])
  assert.ok(!destinatariosAusencia.includes(CAJA_BRASIL))
  assert.deepEqual(destinatariosAusencia, getDestinatarios('ausencias'))
})

test('ausencias, llegadas tarde y vacaciones se notifican sólo a RRHH', async () => {
  for (const tipo of ['ausencias', 'vacaciones', 'llegada_tarde']) {
    assert.deepEqual(getDestinatarios(tipo), [RRHH], tipo)
    assert.deepEqual(await getDestinatariosParaEtapa(tipo, {}, 'creada'), [RRHH], tipo)
    assert.deepEqual(await getDestinatariosParaEtapa(tipo, {}, 'aprobada'), [RRHH], tipo)
  }
})

test('Proveedores recibe únicamente reservas de auto u hotel aprobadas', async () => {
  assert.deepEqual(await getDestinatariosParaEtapa('auto', {}, 'aprobada'), [PROVEEDORES])
  assert.deepEqual(await getDestinatariosParaEtapa('hotel', {}, 'aprobada'), [PROVEEDORES])
  assert.notDeepEqual(getDestinatarios('auto'), [PROVEEDORES])
  assert.notDeepEqual(getDestinatarios('hotel'), [PROVEEDORES])
})

test('viáticos y rendiciones se notifican solo a RRHH y Tesorería', () => {
  const solicitud = { solicitante: { sucursal: 'Mar del Plata' } }

  assert.deepEqual(getDestinatarios('viaticos', solicitud), [RRHH, TESORERIA])
  assert.deepEqual(getDestinatarios('rendicion_viaticos', solicitud), [RRHH, TESORERIA])
})

test('los administradores reciben al crear y los demás únicamente al aprobar', () => {
  const rolesPorEmail = new Map([
    ['admin@gruponucleo.com.ar', 'admin'],
    ['rocio@gruponucleo.com.ar', 'empleado'],
    ['caja@gruponucleo.com.ar', 'rrhh'],
  ])
  const destinatarios = [...rolesPorEmail.keys(), 'solicitante@gruponucleo.com.ar']

  assert.deepEqual(getDestinatariosPorEtapa({
    destinatarios,
    emailSolicitante: 'solicitante@gruponucleo.com.ar',
    rolesPorEmail,
    etapa: 'creada',
  }), ['admin@gruponucleo.com.ar'])

  assert.deepEqual(getDestinatariosPorEtapa({
    destinatarios,
    emailSolicitante: 'solicitante@gruponucleo.com.ar',
    rolesPorEmail,
    etapa: 'aprobada',
  }), ['rocio@gruponucleo.com.ar', 'caja@gruponucleo.com.ar'])
})

test('el correo de viáticos muestra el monto solicitado', () => {
  const html = buildEmailHtml({
    tipo: 'viaticos',
    monto_estimado: 125000,
  })

  assert.match(html, /Monto solicitado:<\/strong> \$\s?125\.000,00/)
})

test('el correo de otros tipos no muestra un monto de viáticos', () => {
  const html = buildEmailHtml({
    tipo: 'hotel',
    monto_estimado: 125000,
  })

  assert.doesNotMatch(html, /Monto solicitado:/)
})
