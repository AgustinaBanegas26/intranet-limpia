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

// Comprueba los datos o la condicion indicada.
function isAdmin(role) {
  return role === 'admin'
}

// Comprueba los datos o la condicion indicada.
function isRRHH(role) {
  return role === 'rrhh'
}

// Comprueba los datos o la condicion indicada.
function isDirector(role) {
  return role === 'director'
}

// Comprueba los datos o la condicion indicada.
function canListEmployees(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canManageEmployees(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canPublishNovedades(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canManageSolicitudes(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canCreateSolicitud(role) {
  return !isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canManageAusencias(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canCreateAusencia(role) {
  return !isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
function canManageCatalog(role) {
  return isAdmin(role)
}

// Comprueba los datos o la condicion indicada.
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
