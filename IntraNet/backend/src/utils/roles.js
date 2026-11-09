//este archivo se encarga de manejar los roles de empleados en la base de datos,
// y permite determinar los permisos y privilegios de cada rol en la aplicacion.
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

// Devuelve true únicamente para el rol administrador; se usa en decisiones de gestión global.
function isAdmin(role) {
  return role === 'admin'
}

// true únicamente para RR. HH.; permite distinguir sus permisos funcionales.
function isRRHH(role) {
  return role === 'rrhh'
}

// true únicamente para director; permite aplicar reglas propias de ese perfil.
function isDirector(role) {
  return role === 'director'
}

// La consulta general de empleados está reservada al rol administrador.
function canListEmployees(role) {
  return isAdmin(role)
}

// El alta, edición y baja de empleados requieren rol administrador.
function canManageEmployees(role) {
  return isAdmin(role)
}

// La publicación de novedades queda limitada a administración.
function canPublishNovedades(role) {
  return isAdmin(role)
}

// La revisión y resolución de solicitudes requiere rol administrador.
function canManageSolicitudes(role) {
  return isAdmin(role)
}

// Un administrador no crea solicitudes personales; los demás perfiles sí.
function canCreateSolicitud(role) {
  return !isAdmin(role)
}

// La revisión administrativa de ausencias requiere rol administrador.
function canManageAusencias(role) {
  return isAdmin(role)
}

// Un administrador no solicita ausencias personales; los demás perfiles sí.
function canCreateAusencia(role) {
  return !isAdmin(role)
}

// La administración de catálogos está reservada a administradores.
function canManageCatalog(role) {
  return isAdmin(role)
}

// La gestión de sugerencias (por ejemplo, cambios de estado) requiere admin.
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
