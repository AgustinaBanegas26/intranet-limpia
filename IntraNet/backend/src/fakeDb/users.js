const { readEntity, updateEntity } = require('./entityStore')
const { buscarEmpleadoPorEmail } = require('../services/empleados.service')
const { resolveRole } = require('../utils/roles')

const AUTH_LOCKS_ENTITY = 'auth_locks'
const isVercel = process.env.VERCEL === '1'

function normalizeEmail(email) {
  const raw = String(email || '').trim().toLowerCase()
  if (raw.endsWith('@gruponucleo.com')) return `${raw}.ar`
  return raw
}

async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)

  try {
    const empleado = await buscarEmpleadoPorEmail(normalizedEmail)

    if (!empleado) {
      return null
    }

    const name = `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim()
    const role = resolveRole(empleado)

    return {
      id: empleado.id,
      name: name || empleado.nombreCompleto || '',
      email: empleado.email_corporativo,
      role,
      activo: empleado.activo !== false,
      isPublisher: role === 'admin',
      workMode: empleado.workMode || empleado.work_mode || 'office',
      mustChangePassword: Boolean(empleado.mustChangePassword || empleado.must_change_password || false),
      passwordHash: empleado.passwordHash || empleado.password_hash || '',
      foto: empleado.foto_url || null,
    }
  } catch (error) {
    console.error('[users] getUserByEmail failed:', error)
    return null
  }

  /*
  const empleado = await buscarEmpleadoPorEmail(normalizedEmail)

  if (!empleado) {
    return null
  }

  */
}

function getAuthLock(email) {
  if (isVercel) return null

  const current = readEntity(AUTH_LOCKS_ENTITY)
  const key = normalizeEmail(email)
  const row = current.items.find((r) => r.email === key) || null
  return row
}

function recordFailedLogin(email) {
  if (isVercel) {
    return null
  }

  const now = Date.now()
  const key = normalizeEmail(email)
  const LOCK_THRESHOLD = 5
  const LOCK_WINDOW_MS = 15 * 60 * 1000

  const next = updateEntity(AUTH_LOCKS_ENTITY, (current) => {
    const idx = current.items.findIndex((r) => r.email === key)
    const row = idx === -1 ? null : current.items[idx]
    const prevFailed = Number(row?.failedCount || 0)
    const failedCount = prevFailed + 1
    const lockedUntil =
      failedCount >= LOCK_THRESHOLD ? new Date(now + LOCK_WINDOW_MS).toISOString() : row?.lockedUntil || null

    const nextRow = {
      email: key,
      failedCount,
      lockedUntil,
      updatedAt: new Date().toISOString(),
    }

    const nextItems = current.items.slice()
    if (idx === -1) nextItems.push(nextRow)
    else nextItems[idx] = nextRow

    return { version: current.version + 1, items: nextItems }
  })

  return getAuthLock(key) || (next.items.find((r) => r.email === key) || null)
}

function clearAuthLock(email) {
  if (isVercel) {
    return
  }

  const key = normalizeEmail(email)
  updateEntity(AUTH_LOCKS_ENTITY, (current) => {
    const idx = current.items.findIndex((r) => r.email === key)
    if (idx === -1) return current
    const nextItems = current.items.slice()
    nextItems[idx] = {
      email: key,
      failedCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    }
    return { version: current.version + 1, items: nextItems }
  })
}

function isLocked(lockRow) {
  if (!lockRow?.lockedUntil) return false
  const until = Date.parse(lockRow.lockedUntil)
  if (!Number.isFinite(until)) return false
  return until > Date.now()
}

module.exports = {
  getUserByEmail,
  getAuthLock,
  recordFailedLogin,
  clearAuthLock,
  isLocked,
}
