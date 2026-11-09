#!/usr/bin/env node
// Script operativo del backend: ejecuta una tarea puntual de diagnóstico, preparación de datos o comprobación. Tema específico: información y gestión de empleados.
/**
 * Prueba de recorrido de un empleado a través de la API (fase inicial).
 * Uso:
 *   SMOKE_BASE_URL=https://api.tu-dominio.com SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke
 * O definir SMOKE_* en backend/.env
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const baseUrl = String(process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/+$/, '')
const email = String(process.env.SMOKE_EMAIL || '').trim().toLowerCase()
const password = String(process.env.SMOKE_PASSWORD || '')
// Rutas protegidas que un empleado de prueba debería poder consultar.
// El script usa fetch de Node.js; no necesita Supertest porque prueba una API ya iniciada.
const employeeRoutes = [
  { name: 'Perfil', method: 'GET', path: '/profile' },
  { name: 'Novedades', method: 'GET', path: '/novedades' },
  { name: 'Eventos', method: 'GET', path: '/eventos' },
  { name: 'Beneficios', method: 'GET', path: '/beneficios' },
  { name: 'Ausencias', method: 'GET', path: '/ausencias' },
  { name: 'Vacaciones saldo', method: 'GET', path: '/vacaciones/saldo' },
  { name: 'Vacaciones solicitudes', method: 'GET', path: '/vacaciones' },
  { name: 'Solicitudes propias', method: 'GET', path: '/solicitudes' },
  { name: 'Políticas', method: 'GET', path: '/politicas' },
  { name: 'Manuales', method: 'GET', path: '/manuales' },
  { name: 'Sugerencias', method: 'GET', path: '/sugerencias' },
  { name: 'Slider', method: 'GET', path: '/slider' },
  { name: 'Notificaciones', method: 'GET', path: '/notificaciones' },
  { name: 'Celebraciones', method: 'GET', path: '/birthdays?days=14' },
]

// Envía HTTP contra la API, adjunta el token si existe y convierte la respuesta JSON.
async function request(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }

  return { status: res.status, ok: res.ok, payload }
}

// Imprime un resultado uniforme para que el recorrido sea fácil de revisar en consola.
function printResult(label, passed, detail = '') {
  const icon = passed ? 'OK' : 'FAIL'
  console.log(`  [${icon}] ${label}${detail ? ` — ${detail}` : ''}`)
}

// Comprueba salud, inicia sesión y recorre las rutas protegidas configuradas arriba.
async function main() {
  console.log(`\n[smoke] Base URL: ${baseUrl}\n`)
  let failed = 0

  try {
    const health = await request('GET', '/health')
    const healthOk = health.ok && health.payload?.ok !== false
    printResult('GET /health', healthOk, `status ${health.status}`)
    if (!healthOk) failed += 1
    if (health.payload?.supabase === false) {
      printResult('Supabase (health)', false, 'not connected')
      failed += 1
    } else if (health.payload?.supabase === true) {
      printResult('Supabase (health)', true)
    }
  } catch (err) {
    printResult('GET /health', false, err.message || 'network error')
    console.error('\n[smoke] Cannot reach API. Is the backend running?\n')
    process.exit(1)
  }

  if (!email || !password) {
    console.error('\n[smoke] Set SMOKE_EMAIL and SMOKE_PASSWORD in .env or environment to test authenticated routes.\n')
    process.exit(failed > 0 ? 1 : 0)
  }

  let token = null

  try {
    const login = await request('POST', '/auth/login', {
      body: { email, password },
    })
    const loginOk = login.ok && login.payload?.token
    printResult('POST /auth/login', loginOk, loginOk ? login.payload.user?.name : login.payload?.error || `status ${login.status}`)
    if (!loginOk) {
      failed += 1
      console.error('\n[smoke] Login failed. Check credentials and employee activo=true in Supabase.\n')
      process.exit(1)
    }
    token = login.payload.token

    if (login.payload.user?.mustChangePassword) {
      printResult('Password change gate', false, 'user must change password before API access')
      failed += 1
      console.error('\n[smoke] Complete password change for this test user, then re-run.\n')
      process.exit(1)
    }
  } catch (err) {
    printResult('POST /auth/login', false, err.message || 'network error')
    process.exit(1)
  }

  console.log('\n[smoke] Employee routes:\n')

  // Ejecuta cada comprobación en orden y acumula los errores para devolver un estado final.
  for (const route of employeeRoutes) {
    try {
      const res = await request(route.method, route.path, { token })
      const passed = res.ok
      const detail = passed
        ? `status ${res.status}`
        : `${res.payload?.error || 'error'} (status ${res.status})`
      printResult(`${route.method} ${route.path}`, passed, detail)
      if (!passed) failed += 1
    } catch (err) {
      printResult(`${route.method} ${route.path}`, false, err.message || 'network error')
      failed += 1
    }
  }

  console.log('')
  if (failed > 0) {
    console.error(`[smoke] ${failed} check(s) failed.\n`)
    process.exit(1)
  }

  console.log('[smoke] All checks passed.\n')
}

main().catch((err) => {
  console.error('[smoke] Unexpected error:', err)
  process.exit(1)
})
