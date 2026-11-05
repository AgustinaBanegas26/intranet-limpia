// Este módulo adapta el modelo real de empleados al formato que consume el login.
// También conserva el bloqueo local de intentos fallidos; index.js lo utiliza para
// validar credenciales con bcrypt y firmar el JWT propio del portal.
const { readEntity, updateEntity } = require("./entityStore");
const { buscarEmpleadoPorEmail } = require("../services/empleados.service");
const { resolveRole } = require("../utils/roles");

const AUTH_LOCKS_ENTITY = "auth_locks";
const isVercel = process.env.VERCEL === "1";

// Normaliza el correo para que login y el contador de intentos comparen igual.
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

// Busca el empleado real por correo y adapta sus columnas a la estructura usada
// por /auth/login; devuelve null si no existe y lanza error ante fallas de datos.
async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const empleado = await buscarEmpleadoPorEmail(normalizedEmail);

  if (!empleado) {
    return null;
  }

  const name = `${empleado.nombre || ""} ${empleado.apellido || ""}`.trim();
  const role = resolveRole(empleado);

  return {
    id: empleado.id,
    name: name || empleado.nombreCompleto || "",
    email: empleado.email_corporativo,
    role,
    activo: empleado.activo !== false,
    isPublisher: role === "admin",
    workMode: empleado.workMode || empleado.work_mode || "office",
    mustChangePassword: Boolean(
      empleado.mustChangePassword || empleado.must_change_password || false,
    ),
    passwordHash: empleado.passwordHash || empleado.password_hash || "",
    credentialVersion: Number(empleado.credential_version || 0),
    foto: empleado.foto_url || null,
  };
}

// Lee del almacenamiento local el estado de bloqueo de un correo.
function getAuthLock(email) {
  if (isVercel) return null;

  const current = readEntity(AUTH_LOCKS_ENTITY);
  const key = normalizeEmail(email);
  const row = current.items.find((r) => r.email === key) || null;
  return row;
}

// Suma un intento fallido y aplica bloqueo temporal al alcanzar el umbral local.
function recordFailedLogin(email) {
  if (isVercel) {
    return null;
  }

  const now = Date.now();
  const key = normalizeEmail(email);
  const LOCK_THRESHOLD = 5;
  const LOCK_WINDOW_MS = 15 * 60 * 1000;

  const next = updateEntity(AUTH_LOCKS_ENTITY, (current) => {
    const idx = current.items.findIndex((r) => r.email === key);
    const row = idx === -1 ? null : current.items[idx];
    const prevFailed = Number(row?.failedCount || 0);
    const failedCount = prevFailed + 1;
    const lockedUntil =
      failedCount >= LOCK_THRESHOLD
        ? new Date(now + LOCK_WINDOW_MS).toISOString()
        : row?.lockedUntil || null;

    const nextRow = {
      email: key,
      failedCount,
      lockedUntil,
      updatedAt: new Date().toISOString(),
    };

    const nextItems = current.items.slice();
    if (idx === -1) nextItems.push(nextRow);
    else nextItems[idx] = nextRow;

    return { version: current.version + 1, items: nextItems };
  });

  return getAuthLock(key) || next.items.find((r) => r.email === key) || null;
}

// Reinicia el contador después de un inicio de sesión correcto.
function clearAuthLock(email) {
  if (isVercel) {
    return;
  }

  const key = normalizeEmail(email);
  updateEntity(AUTH_LOCKS_ENTITY, (current) => {
    const idx = current.items.findIndex((r) => r.email === key);
    if (idx === -1) return current;
    const nextItems = current.items.slice();
    nextItems[idx] = {
      email: key,
      failedCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    };
    return { version: current.version + 1, items: nextItems };
  });
}

// Determina si el bloqueo guardado sigue vigente según la hora actual.
function isLocked(lockRow) {
  if (!lockRow?.lockedUntil) return false;
  const until = Date.parse(lockRow.lockedUntil);
  if (!Number.isFinite(until)) return false;
  return until > Date.now();
}

module.exports = {
  getUserByEmail,
  getAuthLock,
  recordFailedLogin,
  clearAuthLock,
  isLocked,
};
