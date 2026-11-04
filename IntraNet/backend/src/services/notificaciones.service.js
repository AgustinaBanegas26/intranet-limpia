const supabase = require("../config/supabase");
const { normalizeEmpleadoSucursal } = require("../utils/sucursalTargeting");

/**
 * Crea notificaciones al publicar una novedad.
 * Tabla: notificaciones (empleado_id, titulo, mensaje, leida, created_at)
 */
async function notifyNovedadPublished({
  titulo,
  contenido,
  publicadoPor,
  sucursalesDestino = null,
}) {
  if (!supabase || typeof supabase.from !== "function") return;

  const { data: empleados, error } = await supabase
    .from("empleados")
    .select("id, sucursal")
    .eq("activo", true)
    .neq("id", publicadoPor);

  if (error) {
    console.error("[notificaciones.service] notify list empleados:", error);
    return;
  }

  const destinos =
    Array.isArray(sucursalesDestino) && sucursalesDestino.length > 0
      ? sucursalesDestino
      : null;

  const rows = (empleados || [])
    .filter((emp) => {
      if (!destinos) return true;
      const norm = normalizeEmpleadoSucursal(emp.sucursal);
      if (!norm) return true;
      return destinos.includes(norm);
    })
    .map((emp) => ({
      empleado_id: emp.id,
      titulo: String(titulo || "Nueva novedad").slice(0, 200),
      mensaje: String(contenido || "").slice(0, 500),
      leida: false,
    }));

  if (rows.length === 0) return;

  const { error: insertError } = await supabase
    .from("notificaciones")
    .insert(rows);
  if (insertError) {
    console.error("[notificaciones.service] notify insert:", insertError);
  }
}

// Obtiene los datos necesarios.
async function getNotificacionesForEmpleado(empleadoId) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("notificaciones")
    .select("id, empleado_id, titulo, mensaje, leida, created_at")
    .eq("empleado_id", empleadoId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[notificaciones.service] getNotificaciones:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    mensaje: row.mensaje,
    leida: Boolean(row.leida),
    fecha: row.created_at,
    tipo: inferTipoNotificacion(row.titulo, row.mensaje),
  }));
}

// Gestiona la operacion inferTipoNotificacion.
function inferTipoNotificacion(titulo, mensaje) {
  const text = `${titulo || ""} ${mensaje || ""}`.toLowerCase();
  if (text.includes("novedad") || text.includes("comunicado")) return "novedad";
  if (text.includes("rendición") || text.includes("rendicion"))
    return "rendicion_viaticos";
  if (text.includes("adelanto")) return "adelanto";
  if (
    text.includes("ausencia") ||
    text.includes("vacacion") ||
    text.includes("licencia")
  )
    return "ausencia";
  if (text.includes("insumo")) return "insumos";
  if (text.includes("hotel")) return "hotel";
  if (text.includes("viático") || text.includes("viatico")) return "viaticos";
  if (
    text.includes("auto") ||
    text.includes("vehiculo") ||
    text.includes("vehículo")
  )
    return "auto";
  if (text.includes("solicitud")) return "solicitud";
  if (
    text.includes("evento") ||
    text.includes("reunion") ||
    text.includes("reunión")
  )
    return "evento";
  if (text.includes("política") || text.includes("politica")) return "politica";
  return "general";
}

// Gestiona la operacion markAllNotificacionesLeidas.
async function markAllNotificacionesLeidas(empleadoId) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { error } = await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("empleado_id", empleadoId)
    .eq("leida", false);

  if (error) throw error;
  return { success: true };
}

// Gestiona la operacion markNotificacionLeida.
async function markNotificacionLeida(notificacionId, empleadoId) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { error } = await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("id", notificacionId)
    .eq("empleado_id", empleadoId);

  if (error) throw error;
  return { success: true };
}

// Elimina el elemento indicado.
async function deleteNotificacion(notificacionId, empleadoId) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase
    .from("notificaciones")
    .delete()
    .eq("id", notificacionId)
    .eq("empleado_id", empleadoId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const err = new Error("not_found");
    err.code = "not_found";
    throw err;
  }
  return { success: true };
}

// Elimina el elemento indicado.
async function deleteAllNotificaciones(empleadoId) {
  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("Supabase client not initialized");
  }

  const { error } = await supabase
    .from("notificaciones")
    .delete()
    .eq("empleado_id", empleadoId);

  if (error) throw error;
  return { success: true };
}

const TIPO_LABELS = {
  viaticos: "Viáticos",
  rendicion_viaticos: "Rendición de Viáticos",
  hotel: "Hotel",
  auto: "Auto",
  anticipo: "Anticipo",
  adelanto: "Adelanto",
  varias: "Auto + Hotel",
  "insumos Técnicos": "Insumos Técnicos",
};

// Obtiene los datos necesarios.
async function getActiveAdminIds() {
  const { data: admins, error } = await supabase
    .from("empleados")
    .select("id, role, email_corporativo")
    .eq("activo", true);

  if (error) {
    console.error("[notificaciones.service] dismissAdmin list:", error);
    return [];
  }

  const targetEmails = new Set();
  return (admins || [])
    .filter((admin) => {
      const role = String(admin?.role || "").toLowerCase();
      const email = String(admin?.email_corporativo || "")
        .trim()
        .toLowerCase();
      return (
        ["admin", "director", "rrhh"].includes(role) || targetEmails.has(email)
      );
    })
    .map((admin) => admin.id);
}

/**
 * Marca como leídas las alertas pendientes de admins que coinciden por título/mensaje.
 */
async function dismissAdminPendingNotifications({
  tituloPrefix,
  tituloExacto,
  mensajeExacto,
}) {
  if (!supabase || typeof supabase.from !== "function" || !mensajeExacto)
    return;

  const adminIds = await getActiveAdminIds();
  if (adminIds.length === 0) return;

  const mensaje = String(mensajeExacto).slice(0, 500);

  let query = supabase
    .from("notificaciones")
    .update({ leida: true })
    .in("empleado_id", adminIds)
    .eq("leida", false)
    .eq("mensaje", mensaje);

  if (tituloExacto) {
    query = query.eq("titulo", String(tituloExacto).slice(0, 200));
  } else if (tituloPrefix) {
    query = query.ilike("titulo", `${tituloPrefix}%`);
  }

  const { error } = await query;
  if (error) {
    console.error("[notificaciones.service] dismissAdminPending:", error);
  }
}

/**
 * Notifica a administradores cuando un empleado envía una solicitud.
 */
async function notifyAdminsNewSolicitud({
  solicitante,
  tipo,
  descripcion,
  count = 1,
}) {
  if (!supabase || typeof supabase.from !== "function") return;

  const { data: admins, error } = await supabase
    .from("empleados")
    .select("id, role, email_corporativo")
    .eq("activo", true);

  if (error) {
    console.error("[notificaciones.service] notifyAdmins list:", error);
    return;
  }

  const targetEmails = new Set();
  const adminIds = (admins || [])
    .filter((admin) => {
      const role = String(admin?.role || "").toLowerCase();
      const email = String(admin?.email_corporativo || "")
        .trim()
        .toLowerCase();
      return (
        ["admin", "director", "rrhh"].includes(role) || targetEmails.has(email)
      );
    })
    .map((admin) => admin.id);

  if (!adminIds.length) return;

  const tipoLabel = TIPO_LABELS[tipo] || "Solicitud";
  const titulo =
    count > 1
      ? `Nuevas solicitudes de ${solicitante}`
      : `Nueva solicitud de ${tipoLabel}`;

  const rows = adminIds.map((empleadoId) => ({
    empleado_id: empleadoId,
    titulo: titulo.slice(0, 200),
    mensaje: String(descripcion || "").slice(0, 500),
    leida: false,
  }));

  const { error: insertError } = await supabase
    .from("notificaciones")
    .insert(rows);
  if (insertError) {
    console.error("[notificaciones.service] notifyAdmins insert:", insertError);
  }
}

// Gestiona la operacion notifyEmpleadoRendicionHabilitada.
async function notifyEmpleadoRendicionHabilitada({
  empleadoId,
  destino,
  viaticoId,
}) {
  if (!supabase || typeof supabase.from !== "function" || !empleadoId) return;

  const titulo = "Tenés una rendición de viáticos pendiente";
  const mensaje = destino
    ? `Tenés una rendición de viáticos pendiente correspondiente al viaje a ${String(destino).slice(0, 120)}.`
    : "Tenés una rendición de viáticos pendiente.";

  const { error } = await supabase.from("notificaciones").insert({
    empleado_id: empleadoId,
    titulo: titulo.slice(0, 200),
    mensaje: String(mensaje).slice(0, 500),
    leida: false,
  });

  if (error) {
    console.error(
      "[notificaciones.service] notifyEmpleadoRendicionHabilitada:",
      error,
    );
    return;
  }

  await supabase
    .from("viaticos_rendiciones")
    .update({ habilitada_notificada_at: new Date().toISOString() })
    .eq("viatico_id", viaticoId)
    .is("habilitada_notificada_at", null);
}

// Gestiona la operacion notifyAdminsNewAusencia.
async function notifyAdminsNewAusencia({ solicitante, tipo, motivo }) {
  if (!supabase || typeof supabase.from !== "function") return;

  const { data: admins, error } = await supabase
    .from("empleados")
    .select("id, role, email_corporativo")
    .eq("activo", true);

  if (error) {
    console.error(
      "[notificaciones.service] notifyAdminsNewAusencia list:",
      error,
    );
    return;
  }

  const targetEmails = new Set();
  const adminIds = (admins || [])
    .filter((admin) => {
      const role = String(admin?.role || "").toLowerCase();
      const email = String(admin?.email_corporativo || "")
        .trim()
        .toLowerCase();
      return (
        ["admin", "director", "rrhh"].includes(role) || targetEmails.has(email)
      );
    })
    .map((admin) => admin.id);

  if (!adminIds.length) return;

  const rows = adminIds.map((empleadoId) => ({
    empleado_id: empleadoId,
    titulo: `Nueva ausencia: ${String(tipo || "solicitud").slice(0, 80)}`,
    mensaje: `${solicitante}: ${String(motivo || "").slice(0, 450)}`,
    leida: false,
  }));

  await supabase.from("notificaciones").insert(rows);
}

// Gestiona la operacion notifyAdminsNewAdelanto.
async function notifyAdminsNewAdelanto({ solicitante, monto, empresa }) {
  if (!supabase || typeof supabase.from !== "function") return;

  const { data: admins, error } = await supabase
    .from("empleados")
    .select("id, email_corporativo, role")
    .eq("activo", true);

  if (error) {
    console.error(
      "[notificaciones.service] notifyAdminsNewAdelanto list:",
      error,
    );
    return;
  }

  const targetEmails = new Set();
  const adminIds = (admins || [])
    .filter((admin) => {
      const role = String(admin?.role || "").toLowerCase();
      const email = String(admin?.email_corporativo || "")
        .trim()
        .toLowerCase();
      return (
        ["admin", "director", "rrhh"].includes(role) || targetEmails.has(email)
      );
    })
    .map((admin) => admin.id);

  if (!adminIds.length) return;

  const rows = adminIds.map((id) => ({
    empleado_id: id,
    titulo: "Nueva solicitud de Adelanto",
    mensaje: `${solicitante}: Adelanto de $${Number(monto || 0)} para ${String(empresa || "").slice(0, 200)}`,
    leida: false,
  }));

  await supabase.from("notificaciones").insert(rows);
}

// Gestiona la operacion notifyEmpleadoAusenciaResuelta.
async function notifyEmpleadoAusenciaResuelta({
  empleadoId,
  tipo,
  estado,
  comentario,
  motivo,
  solicitante,
}) {
  if (!supabase || typeof supabase.from !== "function" || !empleadoId) return;

  const label = estado === "aprobada" ? "aprobada" : "rechazada";
  await supabase.from("notificaciones").insert({
    empleado_id: empleadoId,
    titulo: `Tu solicitud de ${tipo} fue ${label}`,
    mensaje: comentario || `Estado: ${label}`,
    leida: false,
  });

  const tituloAdmin = `Nueva ausencia: ${String(tipo || "solicitud").slice(0, 80)}`;
  const mensajeAdmin = `${solicitante || "Un empleado"}: ${String(motivo || "").slice(0, 450)}`;
  await dismissAdminPendingNotifications({
    tituloExacto: tituloAdmin,
    mensajeExacto: mensajeAdmin,
  });
}

/**
 * Notifica al empleado cuando su solicitud (hotel, auto, viáticos, anticipo) es resuelta.
 */
async function notifyEmpleadoSolicitudResuelta({
  empleadoId,
  tipo,
  estado,
  comentario,
  descripcion,
}) {
  if (!supabase || typeof supabase.from !== "function" || !empleadoId) return;

  const label = estado === "aprobada" ? "aprobada" : "rechazada";
  const tipoLabel = TIPO_LABELS[tipo] || "Solicitud";
  const mensaje = comentario
    ? comentario
    : descripcion
      ? `${descripcion} — Estado: ${label}`
      : `Tu solicitud fue ${label}.`;

  const { error } = await supabase.from("notificaciones").insert({
    empleado_id: empleadoId,
    titulo: `Tu solicitud de ${tipoLabel} fue ${label}`,
    mensaje: String(mensaje).slice(0, 500),
    leida: false,
  });

  if (error) {
    console.error(
      "[notificaciones.service] notifyEmpleadoSolicitudResuelta:",
      error,
    );
  }

  const mensajeAdmin = String(descripcion || "Nueva solicitud").slice(0, 500);
  await dismissAdminPendingNotifications({
    tituloPrefix: "Nueva solicitud",
    mensajeExacto: mensajeAdmin,
  });
  await dismissAdminPendingNotifications({
    tituloPrefix: "Nuevas solicitudes",
    mensajeExacto: mensajeAdmin,
  });
}

// Gestiona la operacion notifyEmpleadoAdelantoResuelta.
async function notifyEmpleadoAdelantoResuelta({
  empleadoId,
  estado,
  comentario,
  monto,
  empresa,
  solicitante,
}) {
  if (!supabase || typeof supabase.from !== "function" || !empleadoId) return;

  const label = estado === "aprobada" ? "aprobada" : "rechazada";
  const mensaje =
    comentario ||
    `Tu adelanto de $${Number(monto || 0)} para ${String(empresa || "tu empresa")} fue ${label}.`;

  await supabase.from("notificaciones").insert({
    empleado_id: empleadoId,
    titulo: `Tu solicitud de Adelanto fue ${label}`,
    mensaje: String(mensaje).slice(0, 500),
    leida: false,
  });

  const mensajeAdmin = `${solicitante || "Un empleado"}: Adelanto de $${Number(monto || 0)} para ${String(empresa || "").slice(0, 200)}`;
  await dismissAdminPendingNotifications({
    tituloPrefix: "Nueva solicitud de Adelanto",
    mensajeExacto: mensajeAdmin,
  });
}

module.exports = {
  notifyNovedadPublished,
  notifyAdminsNewSolicitud,
  notifyAdminsNewAusencia,
  notifyAdminsNewAdelanto,
  notifyEmpleadoAusenciaResuelta,
  notifyEmpleadoSolicitudResuelta,
  notifyEmpleadoAdelantoResuelta,
  notifyEmpleadoRendicionHabilitada,
  getNotificacionesForEmpleado,
  markNotificacionLeida,
  markAllNotificacionesLeidas,
  deleteNotificacion,
  deleteAllNotificaciones,
};
