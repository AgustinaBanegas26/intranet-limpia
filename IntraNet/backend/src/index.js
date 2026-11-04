// API REST de la intranet: monta Express, aplica seguridad global y coordina
// autenticación propia, servicios Supabase y endpoints de cada módulo. Los
// servicios en src/services encapsulan consultas; el frontend consume estas rutas.
require('dotenv').config()

const { validateEnv } = require('./config/validateEnv')
validateEnv({ exitOnError: true })

const supabase = require('./config/supabase')

const express = require('express')

const app = express()

app.set('trust proxy', 1)

const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const bcrypt = require('bcrypt')
// Importar middlewares, servicios y utilidades
const { createCorsMiddleware } = require('./middleware/cors')
const { authenticateToken, requirePasswordChanged, signToken } = require('./middleware/auth')
const { canListEmployees, canManageEmployees, canViewEmployeePersonalData, canPublishNovedades, canManageSolicitudes, canCreateSolicitud, canManageAusencias, canCreateAusencia, canManageCatalog, canManageSugerencias, isAdmin } = require('./utils/roles')
const {
  getUserByEmail,
  getAuthLock,
  recordFailedLogin,
  clearAuthLock,
  isLocked,
} = require('./fakeDb/users')
const { appendActivityLog } = require('./fakeDb/activityLogs')
const {
  getProfileByUserId,
  updateProfile,
} = require('./fakeDb/profiles')
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  removeEmployee,
  updateEmployeePassword,
  verifyEmployeePassword,
  getMustChangePassword,
} = require('./services/empleados.service')
const {
  requestRecovery,
  verifyRecoveryCode,
  resetPassword,
  RECOVERY_MESSAGE,
} = require('./services/passwordRecovery.service')
const {
  getAllNovedades,
  getMisNovedades,
  toggleLike,
  createNovedad,
  voteEncuesta,
  deactivateNovedad,
  updateNovedad,
} = require('./services/novedades.service')
const { getCelebraciones } = require('./services/celebraciones.service')
const {
  getNotificacionesForEmpleado,
  markNotificacionLeida,
  markAllNotificacionesLeidas,
  deleteNotificacion,
  deleteAllNotificaciones,
} = require('./services/notificaciones.service')
const {
  listSolicitudes,
  getSolicitudById,
  createSolicitudes,
  resolveSolicitud,
  removeSolicitud,
} = require('./services/solicitudes.service')
const { listCalendarEvents } = require('./services/calendario.service')
const {
  listRendiciones,
  getRendicionById,
  getRendicionByViaticoId,
  updateRendicion,
  upsertGasto,
  removeGasto,
  sendRendicion,
  resolveRendicion,
  syncEligibleRendiciones,
} = require('./services/rendiciones.service')
const {
  listAdelantos,
  createAdelanto,
  resolveAdelanto,
  removeAdelanto,
} = require('./services/adelantos.service')
const {
  listTechnicalSupplyRequests,
  createTechnicalSupplyRequest,
  updateTechnicalSupplyRequest,
  upsertTechnicalSupplyFichaForEmployee,
  resolveTechnicalSupplyRequest,
} = require('./services/technicalSupplies.service')
const { listAusencias, createAusencia, resolveAusencia, removeAusencia, updateAusencia } = require('./services/ausencias.service')
const {
  getSaldo,
  listVacacionesSolicitudes,
  createVacacionSolicitud,
  updateVacacionSolicitud,
  removeVacacionSolicitud,
} = require('./services/vacaciones.service')
const { listSectores, createSector, updateSector, removeSector } = require('./services/sectores.service')
const {
  listBeneficios,
  createBeneficio,
  updateBeneficio,
  removeBeneficio,
} = require('./services/beneficios.service')
const {
  listEventos,
  createEvento,
  updateEvento,
  removeEvento,
  toggleEventoRsvp,
} = require('./services/eventos.service')
const {
  listPoliticas,
  createPolitica,
  updatePolitica,
  removePolitica,
  markPoliticaLeida,
} = require('./services/politicas.service')
const {
  listSugerencias,
  createSugerencia,
  voteSugerencia,
  updateSugerenciaEstado,
  removeSugerencia,
} = require('./services/sugerencias.service')
const {
  listManuales,
  createManual,
  updateManual,
  removeManual,
} = require('./services/manuales.service')
const {
  listSlides,
  createSlide,
  updateSlide,
  removeSlide,
} = require('./services/slider.service')
const {
  listContactos,
  listMensajes,
  createMensaje,
  markMensajeLeido,
  removeMensaje,
} = require('./services/mensajes.service')

app.use(helmet())
app.use(createCorsMiddleware())
app.use(express.json({ limit: '10mb' }))

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

app.get('/health', async (_req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'
  let supabaseOk = false

  try {
    if (supabase && typeof supabase.from === 'function') {
      const { error } = await supabase.from('empleados').select('id').limit(1)
      supabaseOk = !error
    }
  } catch {
    supabaseOk = false
  }

  const ready = Boolean(process.env.JWT_SECRET) && supabaseOk
  const statusCode = isProduction && !ready ? 503 : 200

  res.status(statusCode).json({
    ok: ready,
    ready,
    env: process.env.NODE_ENV || 'development',
    supabase: supabaseOk,
    timestamp: new Date().toISOString(),
  })
})

app.get('/empleados', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canListEmployees(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const includeInactive = req.query.includeInactive === 'true' || req.query.inactivos === 'true'
    const empleados = await getAllEmployees({ includePhoto: isAdmin(req.user.role), includeInactive })
    return res.json({ data: empleados })
  } catch (err) {
    console.error('[backend] GET /empleados error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_empleados', message: err?.message || String(err) })
  }
})

// GET /empleados/:id/perfil — datos personales completos (solo admin)
app.get('/empleados/:id/perfil', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canViewEmployeePersonalData(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'Solo administración puede ver datos personales.' })
  }

  const employeeId = req.params.id
  const profile = await getProfileByUserId(employeeId)

  if (!profile) {
    return res.status(404).json({ error: 'profile_not_found' })
  }

  return res.json({ data: profile })
})

app.post('/empleados', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const payload = req.body || {}
  const requiredFields = ['nombre', 'apellido', 'email_corporativo']
  const missingFields = requiredFields.filter((field) => !payload[field])

  if (missingFields.length > 0) {
    return res.status(400).json({ error: 'missing_fields', missingFields })
  }

  try {
    const empleado = await createEmployee(payload)
    return res.status(201).json({ data: empleado })
  } catch (err) {
    console.error('[backend] POST /empleados error:', err)
    return res.status(500).json({ error: 'failed_to_create_empleado', message: err?.message || String(err) })
  }
})

app.put('/empleados/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const empleado = await updateEmployee(req.params.id, req.body || {})
    return res.json({ data: empleado })
  } catch (err) {
    if (err?.code === 'not_found') {
      return res.status(404).json({ error: 'not_found' })
    }
    console.error('[backend] PUT /empleados/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_empleado', message: err?.message || String(err) })
  }
})

app.delete('/empleados/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  if (String(req.user.sub) === String(req.params.id)) {
    return res.status(400).json({ error: 'cannot_delete_self' })
  }

  try {
    const result = await removeEmployee(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') {
      return res.status(404).json({ error: 'not_found' })
    }
    if (err?.code === 'invalid_id') {
      return res.status(400).json({ error: 'invalid_id' })
    }
    console.error('[backend] DELETE /empleados/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_empleado', message: err?.message || String(err) })
  }
})

// GET /sectores
app.get('/sectores', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true'
    const data = await listSectores({ includeInactive })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /sectores error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_sectores', message: err?.message || String(err) })
  }
})

app.post('/sectores', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createSector(req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'duplicate_name') return res.status(409).json({ error: 'duplicate_name' })
    console.error('[backend] POST /sectores error:', err)
    return res.status(500).json({ error: 'failed_to_create_sector', message: err?.message || String(err) })
  }
})

app.put('/sectores/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateSector(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /sectores/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_sector', message: err?.message || String(err) })
  }
})

app.delete('/sectores/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageEmployees(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeSector(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /sectores/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_sector', message: err?.message || String(err) })
  }
})

// POST /auth/login { email, password }
// Valida credenciales bcrypt guardadas en empleados y emite un JWT propio del portal.
app.post('/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!email || !password) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  const lock = getAuthLock(email)
  if (isLocked(lock)) {
    return res.status(423).json({
      error: 'auth_locked',
      retryAt: lock.lockedUntil,
    })
  }

  let user = null
  try {
    user = await getUserByEmail(email)
  } catch (error) {
    console.error('[backend] /auth/login user lookup failed:', error)
    return res.status(503).json({ error: 'service_unavailable', message: 'No se pudo contactar con el servicio de autenticación.' })
  }

  const passwordHash = user?.passwordHash || ''
  const ok = user ? await bcrypt.compare(password, passwordHash) : false

  if (!user || !ok) {
    recordFailedLogin(email)
    appendActivityLog({
      action: 'login_failed',
      actorId: null,
      entityType: 'sessions',
      entityId: null,
      metadata: { email },
    })
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  if (!user.activo) {
    recordFailedLogin(email)
    appendActivityLog({
      action: 'login_failed_inactive',
      actorId: user.id,
      entityType: 'sessions',
      entityId: user.id,
      metadata: { email },
    })
    return res.status(403).json({ error: 'account_inactive', message: 'Tu cuenta está inactiva. Contactá a RRHH.' })
  }

  clearAuthLock(email)

  const mustChangePassword = Boolean(user.mustChangePassword)

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    mustChangePassword,
    credentialVersion: user.credentialVersion,
  })

  appendActivityLog({
    action: 'login',
    actorId: user.id,
    entityType: 'sessions',
    entityId: user.id,
    metadata: { mustChangePassword },
  })

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword,
      isPublisher: Boolean(user.isPublisher),
      workMode: user.workMode,
      foto: user.foto || null,
    },
  })
})

// Endpoints públicos de recuperación: responden de forma genérica al correo,
// mientras que el código y la identidad se validan exclusivamente en backend.
const recoveryRequestLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'recovery_rate_limited' },
})
const recoveryVerifyLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'recovery_rate_limited' },
})

// POST /auth/password-recovery/request { email }
// Valida el formato, registra el límite por correo e IP y envía un código si
// existe una cuenta activa. La respuesta nunca confirma la existencia del correo.
app.post('/auth/password-recovery/request', recoveryRequestLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid_email' })
  }

  try {
    await requestRecovery(email, req.ip)
    return res.status(202).json({ ok: true, message: RECOVERY_MESSAGE })
  } catch (error) {
    // No se imprime email, código, token, datos del empleado ni credenciales SMTP.
    console.error('[auth-recovery] No se pudo procesar la solicitud:', error?.code || 'internal_error')
    // Se conserva el mismo estado y texto para cuentas existentes y desconocidas.
    return res.status(202).json({ ok: true, message: RECOVERY_MESSAGE })
  }
})

// POST /auth/password-recovery/verify { email, code }
// Comprueba código, vencimiento y contador de intentos; la transacción SQL
// bloquea la fila para que verificaciones concurrentes no eludan el máximo.
app.post('/auth/password-recovery/verify', recoveryVerifyLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const code = String(req.body?.code || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9]{64}$/.test(code)) {
    return res.status(400).json({ error: 'invalid_recovery_code' })
  }

  try {
    const valid = await verifyRecoveryCode(email, code)
    if (!valid) return res.status(400).json({ error: 'invalid_or_expired_recovery_code' })
    return res.json({ ok: true })
  } catch (error) {
    console.error('[auth-recovery] No se pudo verificar el código:', error?.code || 'internal_error')
    return res.status(503).json({ error: 'recovery_temporarily_unavailable' })
  }
})

// POST /auth/password-recovery/reset { email, code, password }
// Reutiliza bcrypt y sólo confirma el cambio cuando la función SQL consume el
// código vigente y actualiza la fila de empleados dentro de la misma transacción.
app.post('/auth/password-recovery/reset', recoveryVerifyLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const code = String(req.body?.code || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9]{64}$/.test(code)) {
    return res.status(400).json({ error: 'invalid_recovery_code' })
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'invalid_password', message: 'La contraseña debe tener entre 8 y 72 bytes.' })
  }

  try {
    const updated = await resetPassword(email, code, password)
    if (!updated) return res.status(400).json({ error: 'invalid_or_expired_recovery_code' })
    return res.json({ ok: true, message: 'La contraseña se actualizó. Iniciá sesión con la nueva contraseña.' })
  } catch (error) {
    console.error('[auth-recovery] No se pudo actualizar la contraseña:', error?.code || 'internal_error')
    return res.status(503).json({ error: 'recovery_temporarily_unavailable' })
  }
})

// GET /profile - Get logged-in user profile
app.get('/profile', authenticateToken, requirePasswordChanged, async (req, res) => {
  const userId = req.user.sub
  const profile = await getProfileByUserId(userId)

  if (!profile) {
    return res.status(404).json({ error: 'profile_not_found' })
  }

  return res.json(profile)
})

// PUT /profile - Update logged-in user profile
app.put('/profile', authenticateToken, requirePasswordChanged, async (req, res) => {
  const userId = req.user.sub
  try {
    const updatedProfile = await updateProfile(userId, req.body)

    if (!updatedProfile) {
      return res.status(404).json({ error: 'profile_not_found' })
    }

    return res.json(updatedProfile)
  } catch (err) {
    if (err?.code === 'foto_too_large') {
      return res.status(413).json({
        error: 'foto_too_large',
        message: 'La imagen es demasiado grande. Probá con una foto más chica.',
      })
    }
    if (err?.code === 'invalid_email') {
      return res.status(400).json({
        error: 'invalid_email',
        message: 'El email ingresado no es válido.',
      })
    }
    console.error('[backend] PUT /profile error:', err)
    return res.status(500).json({
      error: err?.code || 'profile_update_failed',
      message: err?.message || 'No se pudo actualizar el perfil.',
    })
  }
})

// GET /novedades - Corporate news feed
app.get('/novedades', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await getAllNovedades(req.user.sub, {
      bypassFilter: canPublishNovedades(req.user.role),
    })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /novedades error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_novedades', message: err?.message || String(err) })
  }
})

// POST /novedades - Publish news (admin / director)
app.post('/novedades', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canPublishNovedades(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const titulo = String(req.body?.titulo || '').trim()
  const contenido = String(req.body?.contenido || '').trim()

  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'missing_fields', missingFields: ['titulo', 'contenido'] })
  }

  try {
    const data = await createNovedad(req.body, req.user.sub)
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'invalid_sucursales_destino') {
      return res.status(400).json({ error: 'invalid_sucursales_destino' })
    }
    if (err?.code === 'sucursales_destino_column_missing') {
      return res.status(503).json({ error: 'sucursales_destino_column_missing' })
    }
    console.error('[backend] POST /novedades error:', err)
    return res.status(500).json({ error: 'failed_to_create_novedad', message: err?.message || String(err) })
  }
})

// GET /novedades/mias - Author's recent posts (compact admin strip)
app.get('/novedades/mias', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canPublishNovedades(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const data = await getMisNovedades(req.user.sub)
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /novedades/mias error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_mis_novedades', message: err?.message || String(err) })
  }
})

// POST /novedades/:id/encuesta/vote - Vote on poll
app.post('/novedades/:id/encuesta/vote', authenticateToken, requirePasswordChanged, async (req, res) => {
  const opcionId = String(req.body?.opcionId || req.body?.opcion_id || '').trim()
  if (!opcionId) {
    return res.status(400).json({ error: 'missing_option' })
  }

  try {
    const encuesta = await voteEncuesta(req.params.id, opcionId, req.user.sub)
    return res.json({ encuesta })
  } catch (err) {
    if (err?.code === 'novedad_not_found') return res.status(404).json({ error: 'novedad_not_found' })
    if (err?.code === 'no_poll') return res.status(400).json({ error: 'no_poll' })
    if (err?.code === 'invalid_option') return res.status(400).json({ error: 'invalid_option' })
    console.error('[backend] POST /novedades/:id/encuesta/vote error:', err)
    return res.status(500).json({ error: 'failed_to_vote', message: err?.message || String(err) })
  }
})

// PUT /novedades/:id - Update (admin or author)
app.put('/novedades/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canPublishNovedades(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const updated = await updateNovedad(req.params.id, req.body, req.user.sub, isAdmin(req.user.role))
    return res.json(updated)
  } catch (err) {
    if (err?.code === 'novedad_not_found') return res.status(404).json({ error: 'novedad_not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] PUT /novedades/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_novedad', message: err?.message || String(err) })
  }
})

// DELETE /novedades/:id - Hard delete (admin) or soft delete (author)
app.delete('/novedades/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canPublishNovedades(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const result = await deactivateNovedad(req.params.id, req.user.sub, isAdmin(req.user.role))
    return res.json(result)
  } catch (err) {
    if (err?.code === 'novedad_not_found') return res.status(404).json({ error: 'novedad_not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    console.error('[backend] DELETE /novedades/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_novedad', message: err?.message || String(err) })
  }
})

// POST /novedades/:id/like - Toggle like
app.post('/novedades/:id/like', authenticateToken, requirePasswordChanged, async (req, res) => {
  const novedadId = req.params.id

  try {
    const result = await toggleLike(novedadId, req.user.sub)
    return res.json(result)
  } catch (err) {
    console.error('[backend] POST /novedades/:id/like error:', err)
    return res.status(500).json({ error: 'failed_to_toggle_like', message: err?.message || String(err) })
  }
})

// GET /notificaciones - Employee notifications
app.get('/notificaciones', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await getNotificacionesForEmpleado(req.user.sub)
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /notificaciones error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_notificaciones', message: err?.message || String(err) })
  }
})

// PUT /notificaciones/leer-todas - Mark all notifications as read
app.put('/notificaciones/leer-todas', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await markAllNotificacionesLeidas(req.user.sub)
    return res.json(result)
  } catch (err) {
    console.error('[backend] PUT /notificaciones/leer-todas error:', err)
    return res.status(500).json({ error: 'failed_to_mark_all_read', message: err?.message || String(err) })
  }
})

// PUT /notificaciones/:id/leer - Mark notification as read
app.put('/notificaciones/:id/leer', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await markNotificacionLeida(req.params.id, req.user.sub)
    return res.json(result)
  } catch (err) {
    console.error('[backend] PUT /notificaciones/:id/leer error:', err)
    return res.status(500).json({ error: 'failed_to_mark_read', message: err?.message || String(err) })
  }
})

// DELETE /notificaciones/todas - Delete all notifications for current user
app.delete('/notificaciones/todas', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await deleteAllNotificaciones(req.user.sub)
    return res.json(result)
  } catch (err) {
    console.error('[backend] DELETE /notificaciones/todas error:', err)
    return res.status(500).json({ error: 'failed_to_delete_all', message: err?.message || String(err) })
  }
})

// DELETE /notificaciones/:id - Delete one notification
app.delete('/notificaciones/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await deleteNotificacion(req.params.id, req.user.sub)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /notificaciones/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete', message: err?.message || String(err) })
  }
})

// GET /solicitudes — admin: todas; empleado: solo las propias
app.get('/solicitudes', authenticateToken, requirePasswordChanged, async (req, res) => {
  const estado = req.query.estado ? String(req.query.estado) : null

  try {
    const empleadoId = canManageSolicitudes(req.user.role) ? null : req.user.sub
    const isAdmin = canManageSolicitudes(req.user.role)
    const data = await listSolicitudes({ empleadoId, estado, isAdmin })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /solicitudes error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_solicitudes', message: err?.message || String(err) })
  }
})

// GET /calendario/solicitudes — vista consolidada, exclusivamente administrativa.
app.get('/calendario/solicitudes', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const data = await listCalendarEvents()
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /calendario/solicitudes error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_calendar', message: err?.message || String(err) })
  }
})

// GET /solicitudes/:id — admin puede ver cualquier solicitud; empleado solo la suya
app.get('/solicitudes/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const isAdminUser = canManageSolicitudes(req.user.role)
    const data = await getSolicitudById(req.params.id, {
      empleadoId: isAdminUser ? null : req.user.sub,
      isAdmin: isAdminUser,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    console.error('[backend] GET /solicitudes/:id error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_solicitud', message: err?.message || String(err) })
  }
})

// POST /solicitudes — solo empleados (no admin)
app.post('/solicitudes', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateSolicitud(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'La administración no envía solicitudes desde este formulario.' })
  }

  try {
    const data = await createSolicitudes(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (err?.code === 'invalid_tipo') {
      return res.status(400).json({ error: 'invalid_tipo' })
    }
    console.error('[backend] POST /solicitudes error:', err)
    return res.status(500).json({ error: 'failed_to_create_solicitud', message: err?.message || String(err) })
  }
})

// POST /viaticos — solo empleados, crea fila en la tabla viaticos directamente
app.post('/viaticos', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateSolicitud(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'La administración no envía solicitudes desde este formulario.' })
  }

  try {
    const body = { ...(req.body || {}), tipo: 'viaticos' }
    const data = await createSolicitudes(req.user.sub, body)
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (err?.code === 'invalid_tipo') {
      return res.status(400).json({ error: 'invalid_tipo' })
    }
    console.error('[backend] POST /viaticos error:', err)
    return res.status(500).json({ error: 'failed_to_create_viaticos', message: err?.message || String(err) })
  }
})

// PUT /solicitudes/:id/approve — solo admin
app.put('/solicitudes/:id/approve', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const comentario = String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null
    const data = await resolveSolicitud(req.params.id, {
      estado: 'aprobada',
      comentario_admin: comentario,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'already_resolved') {
      return res.status(409).json({
        error: 'already_resolved',
        message: 'La solicitud ya fue resuelta y no puede modificarse.',
      })
    }
    console.error('[backend] PUT /solicitudes/:id/approve error:', err)
    return res.status(500).json({ error: 'failed_to_approve', message: err?.message || String(err) })
  }
})

// PUT /solicitudes/:id/reject — solo admin
app.put('/solicitudes/:id/reject', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const comentario = String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null
    const data = await resolveSolicitud(req.params.id, {
      estado: 'rechazada',
      comentario_admin: comentario,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'already_resolved') {
      return res.status(409).json({
        error: 'already_resolved',
        message: 'La solicitud ya fue resuelta y no puede modificarse.',
      })
    }
    console.error('[backend] PUT /solicitudes/:id/reject error:', err)
    return res.status(500).json({ error: 'failed_to_reject', message: err?.message || String(err) })
  }
})

// DELETE /solicitudes/:id
app.delete('/solicitudes/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const result = await removeSolicitud(req.params.id, {
      empleadoId: req.user.sub,
      isAdmin: isAdminUser,
    })
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_delete_resolved') return res.status(400).json({ error: 'cannot_delete_resolved' })
    console.error('[backend] DELETE /solicitudes/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_solicitud', message: err?.message || String(err) })
  }
})

// GET /rendiciones — admin: todas; empleado: solo las propias
app.get('/rendiciones', authenticateToken, requirePasswordChanged, async (req, res) => {
  const estado = req.query.estado ? String(req.query.estado) : null
  const viaticoId = req.query.viaticoId ? Number(req.query.viaticoId) : null

  if (req.query.viaticoId && !Number.isFinite(viaticoId)) {
    return res.status(400).json({ error: 'invalid_viatico_id' })
  }

  try {
    const isAdminUser = canManageSolicitudes(req.user.role)
    const empleadoId = isAdminUser ? null : req.user.sub
    const data = await listRendiciones({ empleadoId, estado, viaticoId, isAdmin: isAdminUser })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /rendiciones error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_rendiciones', message: err?.message || String(err) })
  }
})

async function handleRendicionesSync(_req, res) {
  try {
    const data = await syncEligibleRendiciones()
    return res.json({ data, count: Array.isArray(data) ? data.length : 0 })
  } catch (err) {
    console.error('[backend] GET /rendiciones/sync error:', err)
    return res.status(500).json({ error: 'failed_to_sync_rendiciones', message: err?.message || String(err) })
  }
}

app.get('/rendiciones/sync', authenticateToken, requirePasswordChanged, handleRendicionesSync)
app.get('/api/rendiciones/sync', authenticateToken, requirePasswordChanged, handleRendicionesSync)

app.get('/rendiciones/viatico/:viaticoId', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const isAdminUser = canManageSolicitudes(req.user.role)
    const viaticoId = Number(req.params.viaticoId)
    if (!Number.isFinite(viaticoId)) return res.status(400).json({ error: 'invalid_viatico_id' })
    const data = await getRendicionByViaticoId(viaticoId, {
      empleadoId: isAdminUser ? null : req.user.sub,
      isAdmin: isAdminUser,
    })
    if (!data) return res.status(404).json({ error: 'not_ready' })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    console.error('[backend] GET /rendiciones/viatico/:viaticoId error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_rendicion', message: err?.message || String(err) })
  }
})

app.get('/rendiciones/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const isAdminUser = canManageSolicitudes(req.user.role)
    const data = await getRendicionById(req.params.id, {
      empleadoId: isAdminUser ? null : req.user.sub,
      isAdmin: isAdminUser,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    console.error('[backend] GET /rendiciones/:id error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_rendicion', message: err?.message || String(err) })
  }
})

app.put('/rendiciones/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const data = await updateRendicion(req.params.id, req.user.sub, req.body || {}, { isAdmin: isAdminUser })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_edit_resolved') return res.status(409).json({ error: 'cannot_edit_resolved' })
    console.error('[backend] PUT /rendiciones/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_rendicion', message: err?.message || String(err) })
  }
})

app.post('/rendiciones/:id/gastos', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const data = await upsertGasto(req.params.id, null, req.body || {}, { empleadoId: req.user.sub, isAdmin: isAdminUser })
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_gasto_fecha') return res.status(400).json({ error: 'invalid_gasto_fecha' })
    if (err?.code === 'missing_comprobante') return res.status(400).json({ error: 'missing_comprobante' })
    if (err?.code === 'cannot_edit_resolved') return res.status(409).json({ error: 'cannot_edit_resolved' })
    console.error('[backend] POST /rendiciones/:id/gastos error:', err)
    return res.status(500).json({ error: 'failed_to_create_gasto', message: err?.message || String(err) })
  }
})

app.put('/rendiciones/:id/gastos/:gastoId', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const data = await upsertGasto(req.params.id, req.params.gastoId, req.body || {}, { empleadoId: req.user.sub, isAdmin: isAdminUser })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_gasto_fecha') return res.status(400).json({ error: 'invalid_gasto_fecha' })
    if (err?.code === 'missing_comprobante') return res.status(400).json({ error: 'missing_comprobante' })
    if (err?.code === 'cannot_edit_resolved') return res.status(409).json({ error: 'cannot_edit_resolved' })
    console.error('[backend] PUT /rendiciones/:id/gastos/:gastoId error:', err)
    return res.status(500).json({ error: 'failed_to_update_gasto', message: err?.message || String(err) })
  }
})

app.delete('/rendiciones/:id/gastos/:gastoId', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const result = await removeGasto(req.params.id, req.params.gastoId, { empleadoId: req.user.sub, isAdmin: isAdminUser })
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_edit_resolved') return res.status(409).json({ error: 'cannot_edit_resolved' })
    console.error('[backend] DELETE /rendiciones/:id/gastos/:gastoId error:', err)
    return res.status(500).json({ error: 'failed_to_delete_gasto', message: err?.message || String(err) })
  }
})

app.put('/rendiciones/:id/enviar', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const data = await sendRendicion(req.params.id, req.user.sub, req.body || {}, { isAdmin: isAdminUser })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'missing_gastos') return res.status(400).json({ error: 'missing_gastos' })
    if (err?.code === 'cannot_edit_resolved') return res.status(409).json({ error: 'cannot_edit_resolved' })
    console.error('[backend] PUT /rendiciones/:id/enviar error:', err)
    return res.status(500).json({ error: 'failed_to_send_rendicion', message: err?.message || String(err) })
  }
})

app.put('/rendiciones/:id/aprobar', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const data = await resolveRendicion(req.params.id, {
      estado: 'aprobada',
      comentario: String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_estado') return res.status(400).json({ error: 'invalid_estado' })
    console.error('[backend] PUT /rendiciones/:id/aprobar error:', err)
    return res.status(500).json({ error: 'failed_to_approve_rendicion', message: err?.message || String(err) })
  }
})

app.put('/rendiciones/:id/devolver', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const data = await resolveRendicion(req.params.id, {
      estado: 'devuelta',
      comentario: String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_estado') return res.status(400).json({ error: 'invalid_estado' })
    console.error('[backend] PUT /rendiciones/:id/devolver error:', err)
    return res.status(500).json({ error: 'failed_to_return_rendicion', message: err?.message || String(err) })
  }
})

app.get('/insumos-tecnicos/solicitudes', authenticateToken, requirePasswordChanged, async (req, res) => {
  const status = req.query.estado ? String(req.query.estado) : req.query.status ? String(req.query.status) : null

  try {
    const empleadoId = canManageSolicitudes(req.user.role) ? null : req.user.sub
    const data = await listTechnicalSupplyRequests({ empleadoId, status })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /insumos-tecnicos/solicitudes error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_technical_supply_requests', message: err?.message || String(err) })
  }
})

app.post('/insumos-tecnicos/solicitudes', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateSolicitud(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'La administracion no envia solicitudes desde este formulario.' })
  }

  try {
    const data = await createTechnicalSupplyRequest(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'employee_not_found') return res.status(404).json({ error: 'employee_not_found' })
    console.error('[backend] POST /insumos-tecnicos/solicitudes error:', err)
    return res.status(500).json({ error: 'failed_to_create_technical_supply_request', message: err?.message || String(err) })
  }
})

app.put('/insumos-tecnicos/solicitudes/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const data = await updateTechnicalSupplyRequest(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] PUT /insumos-tecnicos/solicitudes/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_technical_supply_request', message: err?.message || String(err) })
  }
})

app.put('/insumos-tecnicos/fichas/:empleadoId', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const data = await upsertTechnicalSupplyFichaForEmployee(req.params.empleadoId, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'invalid_id') return res.status(400).json({ error: 'invalid_id' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'employee_not_found') return res.status(404).json({ error: 'employee_not_found' })
    console.error('[backend] PUT /insumos-tecnicos/fichas/:empleadoId error:', err)
    return res.status(500).json({ error: 'failed_to_save_technical_supply_ficha', message: err?.message || String(err) })
  }
})

app.put('/insumos-tecnicos/solicitudes/:id/approve', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const adminComment = String(req.body?.comentario || req.body?.admin_comment || '').trim() || null
    const data = await resolveTechnicalSupplyRequest(req.params.id, {
      status: 'aprobada',
      adminComment,
      resolvedBy: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_status') return res.status(400).json({ error: 'invalid_status' })
    console.error('[backend] PUT /insumos-tecnicos/solicitudes/:id/approve error:', err)
    return res.status(500).json({ error: 'failed_to_approve_technical_supply_request', message: err?.message || String(err) })
  }
})

app.put('/insumos-tecnicos/solicitudes/:id/reject', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) return res.status(403).json({ error: 'forbidden' })

  try {
    const adminComment = String(req.body?.comentario || req.body?.admin_comment || '').trim() || null
    const data = await resolveTechnicalSupplyRequest(req.params.id, {
      status: 'rechazada',
      adminComment,
      resolvedBy: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_status') return res.status(400).json({ error: 'invalid_status' })
    console.error('[backend] PUT /insumos-tecnicos/solicitudes/:id/reject error:', err)
    return res.status(500).json({ error: 'failed_to_reject_technical_supply_request', message: err?.message || String(err) })
  }
})

// GET /adelantos — admin: todas; empleado: solo las propias
app.get('/adelantos', authenticateToken, requirePasswordChanged, async (req, res) => {
  const estado = req.query.estado ? String(req.query.estado) : null
  const empleadoQuery = req.query.empleado ? String(req.query.empleado) : null

  try {
    const empleadoId = canManageSolicitudes(req.user.role) ? null : req.user.sub
    const data = await listAdelantos({ empleadoId, estado, empleadoQuery })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /adelantos error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_adelantos', message: err?.message || String(err) })
  }
})

// POST /adelantos — solo empleados
app.post('/adelantos', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateSolicitud(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'La administración no envía adelantos desde este formulario.' })
  }

  try {
    const data = await createAdelanto(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /adelantos error:', err)
    return res.status(500).json({ error: 'failed_to_create_adelanto', message: err?.message || String(err) })
  }
})

// PUT /adelantos/:id/approve — solo admin
app.put('/adelantos/:id/approve', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const comentario = String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null
    const data = await resolveAdelanto(req.params.id, {
      estado: 'aprobada',
      comentario,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_estado') return res.status(400).json({ error: 'invalid_estado' })
    console.error('[backend] PUT /adelantos/:id/approve error:', err)
    return res.status(500).json({ error: 'failed_to_approve_adelanto', message: err?.message || String(err) })
  }
})

// PUT /adelantos/:id/reject — solo admin
app.put('/adelantos/:id/reject', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSolicitudes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  try {
    const comentario = String(req.body?.comentario || req.body?.comentario_admin || '').trim() || null
    const data = await resolveAdelanto(req.params.id, {
      estado: 'rechazada',
      comentario,
      resueltoPor: req.user.sub,
    })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_estado') return res.status(400).json({ error: 'invalid_estado' })
    console.error('[backend] PUT /adelantos/:id/reject error:', err)
    return res.status(500).json({ error: 'failed_to_reject_adelanto', message: err?.message || String(err) })
  }
})

// DELETE /adelantos/:id
app.delete('/adelantos/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageSolicitudes(req.user.role)
  try {
    const result = await removeAdelanto(req.params.id, {
      empleadoId: req.user.sub,
      isAdmin: isAdminUser,
    })
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_delete_resolved') return res.status(400).json({ error: 'cannot_delete_resolved' })
    console.error('[backend] DELETE /adelantos/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_adelanto', message: err?.message || String(err) })
  }
})

// GET /ausencias
app.get('/ausencias', authenticateToken, requirePasswordChanged, async (req, res) => {
  const estado = req.query.estado ? String(req.query.estado) : null
  const tipo = req.query.tipo ? String(req.query.tipo) : null
  const area = req.query.area ? String(req.query.area) : null
  const sucursal = req.query.sucursal ? String(req.query.sucursal) : null
  const empleadoQuery = req.query.empleado ? String(req.query.empleado) : null
  const vigente = req.query.vigente === '1' || req.query.vigente === 'true'
  try {
    const isAdminUser = canManageAusencias(req.user.role)
    const empleadoId = isAdminUser ? null : req.user.sub
    const data = await listAusencias({
      empleadoId,
      estado,
      tipo,
      area,
      sucursal,
      empleadoQuery,
      vigente: isAdminUser ? vigente : false,
      excludeVacaciones: !isAdminUser,
    })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /ausencias error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_ausencias', message: err?.message || String(err) })
  }
})

// POST /ausencias — solo empleados
app.post('/ausencias', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateAusencia(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' })
  }
  try {
    const data = await createAusencia(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_date_range') return res.status(400).json({ error: 'invalid_date_range' })
    if (err?.code === 'invalid_time') return res.status(400).json({ error: 'invalid_time' })
    if (err?.code === 'invalid_time_range') return res.status(400).json({ error: 'invalid_time_range' })
    console.error('[backend] POST /ausencias error:', err)
    return res.status(500).json({ error: 'failed_to_create_ausencia', message: err?.message || String(err) })
  }
})

// PUT /ausencias/:id/approve
app.put('/ausencias/:id/approve', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageAusencias(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const comentario = String(req.body?.comentario || '').trim() || null
    const data = await resolveAusencia(req.params.id, { estado: 'aprobada', comentario, resueltoPor: req.user.sub })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /ausencias/:id/approve error:', err)
    return res.status(500).json({ error: 'failed_to_approve', message: err?.message || String(err) })
  }
})

// PUT /ausencias/:id/reject
app.put('/ausencias/:id/reject', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageAusencias(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const comentario = String(req.body?.comentario || '').trim() || null
    const data = await resolveAusencia(req.params.id, { estado: 'rechazada', comentario, resueltoPor: req.user.sub })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /ausencias/:id/reject error:', err)
    return res.status(500).json({ error: 'failed_to_reject', message: err?.message || String(err) })
  }
})

// DELETE /ausencias/:id
app.delete('/ausencias/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageAusencias(req.user.role)
  try {
    const result = await removeAusencia(req.params.id, {
      empleadoId: req.user.sub,
      isAdmin: isAdminUser,
    })
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_delete_resolved') return res.status(400).json({ error: 'cannot_delete_resolved' })
    console.error('[backend] DELETE /ausencias/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_ausencia', message: err?.message || String(err) })
  }
})

// PUT /ausencias/:id — editar solicitud pendiente
app.put('/ausencias/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  const isAdminUser = canManageAusencias(req.user.role)
  try {
    const data = await updateAusencia(req.params.id, req.user.sub, req.body || {}, { isAdmin: isAdminUser })
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    if (err?.code === 'cannot_edit_resolved') return res.status(400).json({ error: 'cannot_edit_resolved' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_date_range') return res.status(400).json({ error: 'invalid_date_range' })
    console.error('[backend] PUT /ausencias/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_ausencia', message: err?.message || String(err) })
  }
})

// GET /vacaciones/saldo
app.get('/vacaciones/saldo', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await getSaldo(req.user.sub)
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /vacaciones/saldo error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_saldo', message: err?.message || String(err) })
  }
})

// GET /vacaciones — solicitudes de vacaciones del empleado
app.get('/vacaciones', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const empleadoId = canManageAusencias(req.user.role) ? null : req.user.sub
    const data = empleadoId
      ? await listVacacionesSolicitudes(empleadoId)
      : await listAusencias({ tipo: 'vacacion' })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /vacaciones error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_vacaciones', message: err?.message || String(err) })
  }
})

// POST /vacaciones — solicitar vacaciones
app.post('/vacaciones', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateAusencia(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createVacacionSolicitud(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_date_range') return res.status(400).json({ error: 'invalid_date_range' })
    if (err?.code === 'insufficient_balance') return res.status(400).json({ error: 'insufficient_balance' })
    console.error('[backend] POST /vacaciones error:', err)
    return res.status(500).json({ error: 'failed_to_create_vacacion', message: err?.message || String(err) })
  }
})

// PUT /vacaciones/:id
app.put('/vacaciones/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateAusencia(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateVacacionSolicitud(req.user.sub, req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'cannot_edit_resolved') return res.status(400).json({ error: 'cannot_edit_resolved' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_date_range') return res.status(400).json({ error: 'invalid_date_range' })
    console.error('[backend] PUT /vacaciones/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_vacacion', message: err?.message || String(err) })
  }
})

// DELETE /vacaciones/:id
app.delete('/vacaciones/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canCreateAusencia(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeVacacionSolicitud(req.user.sub, req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'cannot_delete_resolved') return res.status(400).json({ error: 'cannot_delete_resolved' })
    console.error('[backend] DELETE /vacaciones/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_vacacion', message: err?.message || String(err) })
  }
})

// GET /slider — slides del inicio (activos para todos; incluye ocultos solo para admin)
app.get('/slider', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const includeInactive = canManageCatalog(req.user.role)
    const data = await listSlides({ includeInactive })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /slider error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_slider', message: err?.message || String(err) })
  }
})

app.post('/slider', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createSlide(req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /slider error:', err)
    return res.status(500).json({ error: 'failed_to_create_slide', message: err?.message || String(err) })
  }
})

app.put('/slider/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateSlide(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] PUT /slider/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_slide', message: err?.message || String(err) })
  }
})

app.delete('/slider/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeSlide(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /slider/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_slide', message: err?.message || String(err) })
  }
})

// GET /beneficios
app.get('/beneficios', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await listBeneficios({ includeInactive: false })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /beneficios error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_beneficios', message: err?.message || String(err) })
  }
})

app.post('/beneficios', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createBeneficio(req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /beneficios error:', err)
    return res.status(500).json({ error: 'failed_to_create_beneficio', message: err?.message || String(err) })
  }
})

app.put('/beneficios/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateBeneficio(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /beneficios/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_beneficio', message: err?.message || String(err) })
  }
})

app.delete('/beneficios/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeBeneficio(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /beneficios/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_beneficio', message: err?.message || String(err) })
  }
})

// GET /eventos
app.get('/eventos', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await listEventos(req.user.sub, {
      bypassFilter: canManageCatalog(req.user.role),
    })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /eventos error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_eventos', message: err?.message || String(err) })
  }
})

app.post('/eventos', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createEvento(req.body || {}, req.user.sub)
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_sucursales_destino') {
      return res.status(400).json({ error: 'invalid_sucursales_destino' })
    }
    if (err?.code === 'sucursales_destino_column_missing') {
      return res.status(503).json({ error: 'sucursales_destino_column_missing' })
    }
    console.error('[backend] POST /eventos error:', err)
    return res.status(500).json({ error: 'failed_to_create_evento', message: err?.message || String(err) })
  }
})

app.put('/eventos/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateEvento(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /eventos/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_evento', message: err?.message || String(err) })
  }
})

app.delete('/eventos/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeEvento(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /eventos/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_evento', message: err?.message || String(err) })
  }
})

app.post('/eventos/:id/rsvp', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await toggleEventoRsvp(req.params.id, req.user.sub)
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'rsvp_unavailable') {
      return res.status(503).json({ error: 'rsvp_unavailable', message: 'Ejecutá la migración 005 para habilitar confirmaciones.' })
    }
    console.error('[backend] POST /eventos/:id/rsvp error:', err)
    return res.status(500).json({ error: 'failed_to_rsvp', message: err?.message || String(err) })
  }
})

// GET /politicas
app.get('/politicas', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const includeInactive = canManageCatalog(req.user.role)
    const data = await listPoliticas({ empleadoId: req.user.sub, includeInactive })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /politicas error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_politicas', message: err?.message || String(err) })
  }
})

app.post('/politicas', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createPolitica(req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /politicas error:', err)
    return res.status(500).json({ error: 'failed_to_create_politica', message: err?.message || String(err) })
  }
})

app.put('/politicas/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updatePolitica(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /politicas/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_politica', message: err?.message || String(err) })
  }
})

app.delete('/politicas/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removePolitica(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /politicas/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_politica', message: err?.message || String(err) })
  }
})

app.post('/politicas/:id/leer', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await markPoliticaLeida(req.params.id, req.user.sub)
    return res.json(result)
  } catch (err) {
    console.error('[backend] POST /politicas/:id/leer error:', err)
    return res.status(500).json({ error: 'failed_to_mark_read', message: err?.message || String(err) })
  }
})

// GET /sugerencias
app.get('/sugerencias', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await listSugerencias(req.user.sub, { isAdmin: canManageSugerencias(req.user.role) })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /sugerencias error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_sugerencias', message: err?.message || String(err) })
  }
})

app.post('/sugerencias', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await createSugerencia(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /sugerencias error:', err)
    return res.status(500).json({ error: 'failed_to_create_sugerencia', message: err?.message || String(err) })
  }
})

app.post('/sugerencias/:id/vote', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await voteSugerencia(req.params.id, req.user.sub)
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'cannot_vote') return res.status(400).json({ error: 'cannot_vote' })
    console.error('[backend] POST /sugerencias/:id/vote error:', err)
    return res.status(500).json({ error: 'failed_to_vote', message: err?.message || String(err) })
  }
})

app.put('/sugerencias/:id/status', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSugerencias(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateSugerenciaEstado(req.params.id, req.body?.estado)
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'invalid_estado') return res.status(400).json({ error: 'invalid_estado' })
    console.error('[backend] PUT /sugerencias/:id/status error:', err)
    return res.status(500).json({ error: 'failed_to_update_status', message: err?.message || String(err) })
  }
})

app.delete('/sugerencias/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageSugerencias(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeSugerencia(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /sugerencias/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_sugerencia', message: err?.message || String(err) })
  }
})

// GET /manuales
app.get('/manuales', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const includeInactive = canManageCatalog(req.user.role)
    const data = await listManuales({ includeInactive })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /manuales error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_manuales', message: err?.message || String(err) })
  }
})

app.post('/manuales', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await createManual(req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    console.error('[backend] POST /manuales error:', err)
    return res.status(500).json({ error: 'failed_to_create_manual', message: err?.message || String(err) })
  }
})

app.put('/manuales/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const data = await updateManual(req.params.id, req.body || {})
    return res.json({ data })
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /manuales/:id error:', err)
    return res.status(500).json({ error: 'failed_to_update_manual', message: err?.message || String(err) })
  }
})

app.delete('/manuales/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  if (!canManageCatalog(req.user.role)) return res.status(403).json({ error: 'forbidden' })
  try {
    const result = await removeManual(req.params.id)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] DELETE /manuales/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_manual', message: err?.message || String(err) })
  }
})

// GET /mensajes
app.get('/mensajes/contactos', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await listContactos(req.user.sub)
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /mensajes/contactos error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_contactos', message: err?.message || String(err) })
  }
})

app.get('/mensajes', authenticateToken, requirePasswordChanged, async (req, res) => {
  const carpeta = String(req.query.carpeta || 'inbox')
  try {
    const data = await listMensajes(req.user.sub, carpeta)
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /mensajes error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_mensajes', message: err?.message || String(err) })
  }
})

app.post('/mensajes', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const data = await createMensaje(req.user.sub, req.body || {})
    return res.status(201).json({ data })
  } catch (err) {
    if (err?.code === 'missing_fields') return res.status(400).json({ error: 'missing_fields' })
    if (err?.code === 'invalid_recipient') return res.status(400).json({ error: 'invalid_recipient' })
    console.error('[backend] POST /mensajes error:', err)
    return res.status(500).json({ error: 'failed_to_create_mensaje', message: err?.message || String(err) })
  }
})

app.put('/mensajes/:id/leer', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await markMensajeLeido(req.params.id, req.user.sub)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    console.error('[backend] PUT /mensajes/:id/leer error:', err)
    return res.status(500).json({ error: 'failed_to_mark_read', message: err?.message || String(err) })
  }
})

app.delete('/mensajes/:id', authenticateToken, requirePasswordChanged, async (req, res) => {
  try {
    const result = await removeMensaje(req.params.id, req.user.sub)
    return res.json(result)
  } catch (err) {
    if (err?.code === 'not_found') return res.status(404).json({ error: 'not_found' })
    if (err?.code === 'forbidden') return res.status(403).json({ error: 'forbidden' })
    console.error('[backend] DELETE /mensajes/:id error:', err)
    return res.status(500).json({ error: 'failed_to_delete_mensaje', message: err?.message || String(err) })
  }
})

// GET /birthdays - Birthdays and work anniversaries
app.get('/birthdays', authenticateToken, requirePasswordChanged, async (req, res) => {
  const upcomingDays = Math.min(Math.max(Number(req.query.days) || 14, 1), 60)

  try {
    const data = await getCelebraciones({ upcomingDays })
    return res.json({ data })
  } catch (err) {
    console.error('[backend] GET /birthdays error:', err)
    return res.status(500).json({ error: 'failed_to_fetch_birthdays', message: err?.message || String(err) })
  }
})

// PUT /auth/change-password - update password and clear first-login flag
app.put('/auth/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.sub
  const password = String(req.body?.password || '')
  const currentPassword = String(req.body?.currentPassword || '')

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'invalid_password', message: 'La contraseña debe tener al menos 8 caracteres.' })
  }

  try {
    const mustChange = await getMustChangePassword(userId)

    if (!mustChange) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'current_password_required', message: 'Debés ingresar tu contraseña actual.' })
      }
      const valid = await verifyEmployeePassword(userId, currentPassword)
      if (!valid) {
        return res.status(401).json({ error: 'invalid_current_password', message: 'La contraseña actual no es correcta.' })
      }
      if (currentPassword === password) {
        return res.status(400).json({ error: 'same_password', message: 'La nueva contraseña debe ser distinta a la actual.' })
      }
    }

    const updated = await updateEmployeePassword(userId, password)
    if (!updated) {
      return res.status(404).json({ error: 'user_not_found' })
    }

    const newToken = signToken({
      sub: req.user.sub,
      role: req.user.role,
      email: req.user.email,
      name: req.user.name,
      mustChangePassword: false,
      credentialVersion: updated.credential_version,
    })

    return res.json({ ok: true, mustChangePassword: false, token: newToken })
  } catch (err) {
    console.error('[backend] PUT /auth/change-password error:', err)
    return res.status(500).json({ error: 'failed_to_change_password', message: err?.message || 'No se pudo actualizar la contraseña.' })
  }
})

// Global error handler
app.use((err, req, res, next) => {
  if (err?.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: 'cors_forbidden', message: err.message })
  }
  console.error('[backend] Unhandled error:', err)
  res.status(500).json({
    error: 'server_error',
    message: err?.message || 'Internal server error',
  })
})

const port = Number(process.env.PORT || 4000)

if (process.env.VERCEL !== '1') {
  app.listen(port, '0.0.0.0', () => {
    const { parseCorsOrigins } = require('./config/validateEnv')
    console.log(`[backend] listening on http://0.0.0.0:${port}`)
    console.log(`[backend] NODE_ENV=${process.env.NODE_ENV || 'development'}`)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[backend] CORS_ORIGINS=${parseCorsOrigins().join(', ')}`)
    }
  })
}

module.exports = app
