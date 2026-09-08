const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

const DEFAULT_NEW_EMPLOYEE_PASSWORD =
  process.env.DEFAULT_NEW_EMPLOYEE_PASSWORD || "Empleado123!";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeSucursales(input) {
  if (Array.isArray(input)) {
    const items = input.map((s) => String(s || "").trim()).filter(Boolean);
    return items.length ? items.slice(0, 2).join(" · ") : null;
  }
  const raw = String(input || "").trim();
  return raw || null;
}

function parseSucursalesFromStored(value) {
  if (!value) return [];
  return String(value)
    .split(/[·,|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeEmployeeId(id) {
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error("invalid_id");
    err.code = "invalid_id";
    throw err;
  }
  return n;
}

async function deleteEmployeeRelations(employeeId) {
  const id = employeeId;

  const safeDelete = async (table, column) => {
    const { error } = await supabase.from(table).delete().eq(column, id);
    if (!error) return;
    const msg = String(error.message || "");
    if (msg.includes("does not exist") || error.code === "42P01") return;
    throw error;
  };

  await safeDelete("notificaciones", "empleado_id");
  await safeDelete("novedades_likes", "empleado_id");
  await safeDelete("novedades_encuesta_votos", "empleado_id");
  await safeDelete("ausencias", "empleado_id");
  await safeDelete("vacaciones_saldo", "empleado_id");
  await safeDelete("politicas_lecturas", "empleado_id");
  await safeDelete("eventos_asistentes", "empleado_id");
  await safeDelete("mensajes", "remitente_id");
  await safeDelete("mensajes", "destinatario_id");
  await safeDelete("technical_supply_requests", "empleado_id");
  await safeDelete("viaticos", "empleado_id");
  await safeDelete("reservas_hotel", "empleado_id");
  await safeDelete("reservas_vehiculos", "empleado_id");

  const { data: sugerencias } = await supabase
    .from("sugerencias")
    .select("id")
    .eq("empleado_id", id);
  const sugIds = (sugerencias || []).map((s) => s.id);
  await safeDelete("sugerencias_votos", "empleado_id");
  if (sugIds.length > 0) {
    const { error: votesErr } = await supabase
      .from("sugerencias_votos")
      .delete()
      .in("sugerencia_id", sugIds);
    if (votesErr && !String(votesErr.message || "").includes("does not exist"))
      throw votesErr;
    await safeDelete("sugerencias", "empleado_id");
  }

  const { error: novedadesErr } = await supabase
    .from("novedades")
    .update({ activo: false })
    .eq("publicado_por", id);
  if (
    novedadesErr &&
    !String(novedadesErr.message || "").includes("does not exist")
  )
    throw novedadesErr;

  const { error: eventosErr } = await supabase
    .from("eventos")
    .update({ creado_por: null })
    .eq("creado_por", id);
  if (
    eventosErr &&
    !String(eventosErr.message || "").includes("does not exist")
  )
    throw eventosErr;
}

async function getAllEmployees({
  includePhoto = false,
  includeInactive = false,
} = {}) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  const fields = [
    "id",
    "legajo",
    "nombre",
    "apellido",
    "email_corporativo",
    "cargo",
    "sucursal",
    "area",
    "telefono",
    "fecha_nacimiento",
    "fecha_ingreso",
    "activo",
    "es_director",
    "work_mode",
  ];
  if (includePhoto) {
    fields.push("foto_url");
  }

  try {
    let query = supabase
      .from("empleados")
      .select(fields.join(", "))
      .order("nombre", { ascending: true });

    if (!includeInactive) {
      query = query.eq("activo", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[empleados.service] SUPABASE ERROR:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("[empleados.service] Unexpected error:", err);
    throw err;
  }
}

async function buscarEmpleadoPorEmail(email) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .ilike("email_corporativo", normalizedEmail)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const prefix = normalizedEmail.split("@")[0];
        if (!prefix) return null;

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("empleados")
          .select("*")
          .ilike("email_corporativo", `${prefix}%`)
          .limit(2);

        if (fallbackError) {
          console.error(
            "[empleados.service] SUPABASE ERROR fallback buscarEmpleadoPorEmail:",
            fallbackError,
          );
          throw fallbackError;
        }

        if (fallbackData && fallbackData.length === 1) {
          return fallbackData[0];
        }

        return null;
      }
      console.error(
        "[empleados.service] SUPABASE ERROR buscarEmpleadoPorEmail:",
        error,
      );
      throw error;
    }

    return data;
  } catch (err) {
    console.error(
      "[empleados.service] Unexpected error buscarEmpleadoPorEmail:",
      err,
    );
    throw err;
  }
}

async function createEmployee(employee) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_NEW_EMPLOYEE_PASSWORD, 10);
  const corporativo = normalizeEmail(employee.email_corporativo);

  let authUserId = null;
  try {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: corporativo,
        password: DEFAULT_NEW_EMPLOYEE_PASSWORD,
        email_confirm: true,
      });
    if (authError) {
      console.error(
        "[empleados.service] SUPABASE AUTH ERROR createEmployee:",
        authError,
      );
      throw authError;
    }
    authUserId = authData.user.id;
  } catch (err) {
    console.error("[empleados.service] Failed to create auth user:", err);
    throw err;
  }

  const payload = {
    auth_user_id: authUserId,
    legajo: employee.legajo || null,
    nombre: employee.nombre,
    apellido: employee.apellido,
    email_corporativo: corporativo,
    cargo: employee.cargo || null,
    sucursal: normalizeSucursales(employee.sucursales || employee.sucursal),
    area: employee.area || null,
    telefono: employee.telefono || null,
    fecha_nacimiento: employee.fecha_nacimiento || null,
    fecha_ingreso: employee.fecha_ingreso || null,
    activo: employee.activo !== undefined ? employee.activo : true,
    es_director: employee.es_director || false,
    work_mode: employee.work_mode || "office",
    password_hash: passwordHash,
    must_change_password: true,
  };

  try {
    const { data, error } = await supabase
      .from("empleados")
      .insert(payload)
      .select(
        `id, auth_user_id, legajo, nombre, apellido, email_corporativo, cargo, sucursal, area, telefono, activo, es_director, work_mode`,
      )
      .single();

    if (error) {
      // Revertir la creación en Auth si falla la base de datos
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
      }
      console.error(
        "[empleados.service] SUPABASE ERROR createEmployee:",
        error,
      );
      throw error;
    }

    return data;
  } catch (err) {
    console.error("[empleados.service] Unexpected error createEmployee:", err);
    throw err;
  }
}

async function getMustChangePassword(userId) {
  if (!supabase || typeof supabase.from !== "function") {
    return false;
  }

  const { data, error } = await supabase
    .from("empleados")
    .select("must_change_password")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  return Boolean(data.must_change_password);
}

async function verifyEmployeePassword(userId, plainPassword) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("empleados")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (error || !data?.password_hash) {
    return false;
  }

  return bcrypt.compare(String(plainPassword || ""), data.password_hash);
}

async function updateEmployee(id, employee) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  const patch = {};
  if (employee.legajo !== undefined) patch.legajo = employee.legajo || null;
  if (employee.nombre !== undefined)
    patch.nombre = String(employee.nombre).trim();
  if (employee.apellido !== undefined)
    patch.apellido = String(employee.apellido).trim();
  if (employee.email_corporativo !== undefined) {
    patch.email_corporativo = normalizeEmail(employee.email_corporativo);
  }
  if (employee.cargo !== undefined) patch.cargo = employee.cargo || null;
  if (employee.sucursal !== undefined || employee.sucursales !== undefined) {
    patch.sucursal = normalizeSucursales(
      employee.sucursales || employee.sucursal,
    );
  }
  if (employee.area !== undefined) patch.area = employee.area || null;
  if (employee.telefono !== undefined)
    patch.telefono = employee.telefono || null;
  if (employee.fecha_nacimiento !== undefined)
    patch.fecha_nacimiento = employee.fecha_nacimiento || null;
  if (employee.fecha_ingreso !== undefined)
    patch.fecha_ingreso = employee.fecha_ingreso || null;
  if (employee.activo !== undefined) patch.activo = Boolean(employee.activo);
  if (employee.es_director !== undefined)
    patch.es_director = Boolean(employee.es_director);
  if (employee.work_mode !== undefined)
    patch.work_mode = employee.work_mode || "office";

  if (Object.keys(patch).length === 0) {
    const err = new Error("no_fields_to_update");
    err.code = "no_fields_to_update";
    throw err;
  }

  try {
    const { data, error } = await supabase
      .from("empleados")
      .update(patch)
      .eq("id", id)
      .select(
        `id, legajo, nombre, apellido, email_corporativo, cargo, sucursal, area, telefono, fecha_nacimiento, fecha_ingreso, activo, es_director, work_mode, foto_url`,
      )
      .maybeSingle();

    if (error) {
      console.error(
        "[empleados.service] SUPABASE ERROR updateEmployee:",
        error,
      );
      throw error;
    }

    if (!data) {
      const err = new Error("not_found");
      err.code = "not_found";
      throw err;
    }

    return data;
  } catch (err) {
    console.error("[empleados.service] Unexpected error updateEmployee:", err);
    throw err;
  }
}

async function deactivateEmployee(id) {
  return removeEmployee(id);
}

async function removeEmployee(id) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  const employeeId = normalizeEmployeeId(id);

  try {
    const { data: existing, error: findErr } = await supabase
      .from("empleados")
      .select("id, nombre, apellido, email_corporativo, auth_user_id")
      .eq("id", employeeId)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!existing) {
      const err = new Error("not_found");
      err.code = "not_found";
      throw err;
    }

    await deleteEmployeeRelations(employeeId);

    const { data, error } = await supabase
      .from("empleados")
      .delete()
      .eq("id", employeeId)
      .select("id, legajo, nombre, apellido")
      .maybeSingle();

    if (error) {
      console.error(
        "[empleados.service] SUPABASE ERROR removeEmployee:",
        error,
      );
      throw error;
    }

    if (!data) {
      const err = new Error("not_found");
      err.code = "not_found";
      throw err;
    }

    // Si todo salió bien y tenía auth_user_id, eliminar el usuario de Auth
    if (existing.auth_user_id) {
      await supabase.auth.admin
        .deleteUser(existing.auth_user_id)
        .catch((err) => {
          console.error(
            "[empleados.service] Error deleting user from Supabase Auth:",
            err,
          );
        });
    }

    return { success: true, data, deleted: true };
  } catch (err) {
    console.error("[empleados.service] Unexpected error removeEmployee:", err);
    throw err;
  }
}

async function updateEmployeePassword(userId, newPassword) {
  if (!supabase || typeof supabase.from !== "function") {
    const err = new Error("Supabase client not initialized");
    console.error("[empleados.service] SUPABASE CLIENT ERROR:", err.message);
    throw err;
  }

  if (!newPassword || String(newPassword).length < 8) {
    const err = new Error("invalid_password");
    console.error("[empleados.service] Invalid password length");
    throw err;
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);

  try {
    const { data, error } = await supabase
      .from("empleados")
      .update({ password_hash: passwordHash, must_change_password: false })
      .eq("id", userId)
      .select(
        `id, legajo, nombre, apellido, email_corporativo, cargo, sucursal, area, telefono, activo, es_director, work_mode, must_change_password`,
      )
      .single();

    if (error) {
      console.error(
        "[empleados.service] SUPABASE ERROR updateEmployeePassword:",
        error,
      );
      throw error;
    }

    return data;
  } catch (err) {
    console.error(
      "[empleados.service] Unexpected error updateEmployeePassword:",
      err,
    );
    throw err;
  }
}

module.exports = {
  getAllEmployees,
  buscarEmpleadoPorEmail,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  removeEmployee,
  verifyEmployeePassword,
  updateEmployeePassword,
  getMustChangePassword,
  normalizeSucursales,
  parseSucursalesFromStored,
};
