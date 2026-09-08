const VALID_ROLES = ['empleado', 'rrhh', 'director', 'admin']

/**
 * Resuelve el rol explícito de un empleado.
 * Prioridad: columna `role` en DB → migración desde es_director → empleado.
 */
function resolveRole(empleado) {
  const dbRole = String(empleado?.role || '').trim().toLowerCase()
  if (VALID_ROLES.includes(dbRole)) {
    return dbRole
  }
  if (empleado?.es_director === true) {
    return 'director'
  }
  return 'empleado'
}

function isAdmin(role) {
  return role === 'admin'
}

function isRRHH(role) {
  return role === 'rrhh'
}

function isDirector(role) {
  return role === 'director'
}

function canListEmployees(role) {
  return isAdmin(role)
}

function canManageEmployees(role) {
  return isAdmin(role)
}

function canPublishNovedades(role) {
  return isAdmin(role)
}

function canManageSolicitudes(role) {
  return isAdmin(role)
}

function canCreateSolicitud(role) {
  return !isAdmin(role)
}

function canManageAusencias(role) {
  return isAdmin(role)
}

function canCreateAusencia(role) {
  return !isAdmin(role)
}

function canManageCatalog(role) {
  return isAdmin(role)
}

function canManageSugerencias(role) {
  return isAdmin(role)
}

/** Datos personales completos (DNI, domicilio, foto, etc.) — solo administración (Gisela). */
function canViewEmployeePersonalData(role) {
  return isAdmin(role)
}

module.exports = {
  VALID_ROLES,
  resolveRole,
  isAdmin,
  isRRHH,
  isDirector,
  canListEmployees,
  canManageEmployees,
  canPublishNovedades,
  canManageSolicitudes,
  canCreateSolicitud,
  canManageAusencias,
  canCreateAusencia,
  canManageCatalog,
  canManageSugerencias,
  canViewEmployeePersonalData,
}
