const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { isAdmin } = require("../utils/roles");

const ENV_PATH = path.resolve(__dirname, "../../.env");
//
function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;

  const content = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const existingValue = process.env[key];
    if (!existingValue || String(existingValue).trim() === "") {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const DEFAULT_EMAILS = {
  agustina: process.env.EMAIL_AGUSTINA || "",
  sara: process.env.EMAIL_SARA || "",
  rrhh: process.env.EMAIL_RRHH || "",
  proveedores: process.env.EMAIL_PROVEEDORES || "",
  tesoreria: process.env.EMAIL_TESORERIA || "",
  matias: process.env.EMAIL_MATIAS,
  luciano: process.env.EMAIL_LUCIANO,
  javier: process.env.EMAIL_JAVIER,
  sistemas: process.env.EMAIL_SISTEMAS,
  auditoria: process.env.EMAIL_AUDITORIA,
  // EMAIL_CAJA se conserva como compatibilidad con la configuración anterior.
  cajaMdp:
    process.env.EMAIL_CAJA_MDP ||
    process.env.EMAIL_CAJA ||
    "",
  cajaBrasil: process.env.EMAIL_CAJA_BRASIL || "",
};

const TIPOS_AUSENCIAS_RRHH = [
  "vacaciones",
  "vacacion",
  "ausencias",
  "ausencia",
  "llegada_tarde",
];
const TIPOS_AUTO_HOTEL = ["auto", "hotel"];
const TIPOS_VIATICOS_Y_RENDICIONES = [
  "viaticos",
  "viatico",
  "rendicion_viaticos",
];
const TIPOS_ADELANTOS = ["adelanto", "adelantos"];
const TIPOS_INSUMOS_TECNICOS = ["insumos técnicos", "insumo tecnico"];
const TIPOS_PERMITIDOS = [
  "vacaciones",
  "vacacion",
  "ausencias",
  "viaticos",
  "viatico",
  "rendicion_viaticos",
  "hotel",
  "auto",
  "adelanto",
  "adelantos",
  ...TIPOS_INSUMOS_TECNICOS,
];

function normalizeTipo(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeEmailPass(value) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
}

function getCajaDestinatarioParaAdelanto(sucursal) {
  const normalizedSucursal = String(sucursal || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Mar del Plata tiene prioridad cuando el empleado pertenece a ambas sucursales.
  if (
    normalizedSucursal.includes("mar del plata") ||
    normalizedSucursal === "mdp" ||
    normalizedSucursal.includes("corrientes")
  ) {
    return DEFAULT_EMAILS.cajaMdp;
  }

  if (
    normalizedSucursal.includes("caba") ||
    normalizedSucursal.includes("buenos aires") ||
    normalizedSucursal === "ba"
  ) {
    return DEFAULT_EMAILS.cajaBrasil;
  }

  return null;
}

function getSucursalSolicitante(solicitud) {
  return (
    solicitud?.solicitante?.sucursal ||
    solicitud?.empleado?.sucursal ||
    solicitud?.empleados?.sucursal ||
    solicitud?.sucursal ||
    null
  );
}

function getDestinatarios(tipo, solicitud = null) {
  const normalizedTipo = normalizeTipo(tipo);
  const destinatarios = [];

  if (!normalizedTipo) return [];

  // Ausencias, llegadas tarde y vacaciones se informan exclusivamente a RRHH.
  if (TIPOS_AUSENCIAS_RRHH.includes(normalizedTipo)) {
    destinatarios.push(DEFAULT_EMAILS.rrhh);
  }

  // Al crear una reserva, los administradores mantienen el circuito actual.
  // Al aprobarla, getDestinatariosParaEtapa la deriva exclusivamente a Proveedores.
  if (TIPOS_AUTO_HOTEL.includes(normalizedTipo)) {
    destinatarios.push(DEFAULT_EMAILS.rrhh, DEFAULT_EMAILS.sara);
  }

  // Viáticos y sus rendiciones se gestionan únicamente entre RRHH y Tesorería.
  if (TIPOS_VIATICOS_Y_RENDICIONES.includes(normalizedTipo)) {
    destinatarios.push(DEFAULT_EMAILS.rrhh, DEFAULT_EMAILS.tesoreria);
  }

  // Los adelantos deben notificarse a RRHH, Tesorería y la Caja de la sucursal solicitante.
  if (TIPOS_ADELANTOS.includes(normalizedTipo)) {
    destinatarios.push(DEFAULT_EMAILS.rrhh, DEFAULT_EMAILS.tesoreria);
    destinatarios.push(
      getCajaDestinatarioParaAdelanto(getSucursalSolicitante(solicitud)),
    );
  }

  if (TIPOS_INSUMOS_TECNICOS.includes(normalizedTipo)) {
    destinatarios.push(
      DEFAULT_EMAILS.rrhh,
      DEFAULT_EMAILS.sara,
      DEFAULT_EMAILS.matias,
      DEFAULT_EMAILS.luciano,
      DEFAULT_EMAILS.javier,
      DEFAULT_EMAILS.sistemas,
      DEFAULT_EMAILS.auditoria,
    );
    return [...new Set(destinatarios.filter(Boolean))];
  }

  if (normalizedTipo === "auto" || normalizedTipo === "hotel") {
    return [...new Set(destinatarios.filter(Boolean))];
  }

  return [...new Set(destinatarios.filter(Boolean))];
}

function getSolicitanteEmailNormalizado(solicitud) {
  const email = getSolicitanteEmail(solicitud);
  return email === "No informado" ? null : email.toLowerCase();
}

function getDestinatariosPorEtapa({
  destinatarios,
  emailSolicitante,
  rolesPorEmail,
  etapa,
}) {
  return destinatarios.filter((email) => {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail || normalizedEmail === emailSolicitante) return false;

    const esAdministrador = isAdmin(rolesPorEmail.get(normalizedEmail));
    return etapa === "aprobada" ? !esAdministrador : esAdministrador;
  });
}

async function getRolesPorEmail(destinatarios) {
  const emails = [
    ...new Set(
      destinatarios
        .map((email) =>
          String(email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
  const rolesPorEmail = new Map();
  if (!emails.length) return rolesPorEmail;

  const supabase = require("../config/supabase");
  const { data, error } = await supabase
    .from("empleados")
    .select("email_corporativo, role")
    .eq("activo", true)
    .in("email_corporativo", emails);

  if (error) throw error;
  for (const empleado of data || []) {
    rolesPorEmail.set(
      String(empleado.email_corporativo || "")
        .trim()
        .toLowerCase(),
      String(empleado.role || "")
        .trim()
        .toLowerCase(),
    );
  }
  return rolesPorEmail;
}

async function getDestinatariosParaEtapa(tipo, solicitud, etapa = "creada") {
  const normalizedTipo = normalizeTipo(tipo);

  // Proveedores no recibe ninguna solicitud pendiente ni de otro tipo: sólo
  // reservas de auto/hotel que ya fueron aprobadas por un administrador.
  if (TIPOS_AUTO_HOTEL.includes(normalizedTipo) && etapa === "aprobada") {
    return [DEFAULT_EMAILS.proveedores].filter(Boolean);
  }

  // Estas solicitudes son únicamente para el administrador de RRHH. No se
  // aplica el filtro de roles para que el destinatario no dependa de su rol
  // registrado en la tabla de empleados.
  if (TIPOS_AUSENCIAS_RRHH.includes(normalizedTipo)) {
    return [DEFAULT_EMAILS.rrhh].filter(Boolean);
  }

  const destinatarios = getDestinatarios(normalizedTipo, solicitud);

  // Insumos Técnicos conserva, sin cambios, el circuito y destinatarios existentes.
  if (TIPOS_INSUMOS_TECNICOS.includes(normalizedTipo)) return destinatarios;

  const rolesPorEmail = await getRolesPorEmail(destinatarios);
  return getDestinatariosPorEtapa({
    destinatarios,
    emailSolicitante: getSolicitanteEmailNormalizado(solicitud),
    rolesPorEmail,
    etapa,
  });
}

function parseLocalDate(value) {
  if (!value && value !== 0) return null;
  const valueString = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(valueString)) {
    const [year, month, day] = valueString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(valueString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = parseLocalDate(value);
  if (!date) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDiasSolicitados(solicitud) {
  const value =
    solicitud?.dias ?? solicitud?.total_dias ?? solicitud?.dias_solicitados;
  if (value !== undefined && value !== null && value !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  const desde =
    solicitud?.fecha_desde ||
    solicitud?.fechaDesde ||
    solicitud?.desde ||
    solicitud?.fecha_inicio ||
    solicitud?.startDate;
  const hasta =
    solicitud?.fecha_hasta ||
    solicitud?.fechaHasta ||
    solicitud?.hasta ||
    solicitud?.fecha_fin ||
    solicitud?.endDate;

  if (!desde || !hasta) return 1;
  const a = parseLocalDate(desde);
  const b = parseLocalDate(hasta);
  if (!a || !b) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function getPeriodoSolicitado(solicitud) {
  const desde =
    solicitud?.fecha_desde ||
    solicitud?.fechaDesde ||
    solicitud?.desde ||
    solicitud?.fecha_inicio ||
    solicitud?.startDate ||
    solicitud?.fecha;
  const hasta =
    solicitud?.fecha_hasta ||
    solicitud?.fechaHasta ||
    solicitud?.hasta ||
    solicitud?.fecha_fin ||
    solicitud?.endDate;
  const dias = getDiasSolicitados(solicitud);

  if (desde && hasta) {
    return `Desde ${formatDate(desde)} hasta ${formatDate(hasta)} (${dias} día${dias === 1 ? "" : "s"} en total)`;
  }

  if (desde) {
    return `${formatDate(desde)} (${dias} día${dias === 1 ? "" : "s"} en total)`;
  }

  return `${formatDate(solicitud?.fecha || solicitud?.created_at)} (${dias} día${dias === 1 ? "" : "s"} en total)`;
}

function getSolicitanteEmail(solicitud) {
  const emailCandidates = [
    solicitud?.email,
    solicitud?.email_solicitante,
    solicitud?.email_corporativo,
    solicitud?.solicitante?.email,
    solicitud?.solicitante?.email_corporativo,
    solicitud?.empleado?.email,
    solicitud?.empleado?.email_corporativo,
    solicitud?.empleados?.email,
    solicitud?.empleados?.email_corporativo,
    solicitud?.datosEmpleado?.email,
    solicitud?.datosEmpleado?.email_corporativo,
  ];

  const email = emailCandidates.find((value) => String(value || "").trim());
  return email ? String(email).trim() : "No informado";
}

function getMontoSolicitado(solicitud) {
  const datosExtra = solicitud?.datos_extra || solicitud?.datosExtra || {};
  const candidates = [
    solicitud?.monto_solicitar,
    solicitud?.monto_total,
    solicitud?.monto_estimado,
    solicitud?.monto,
    datosExtra?.monto_solicitar,
    datosExtra?.monto_total,
    datosExtra?.monto_estimado,
    datosExtra?.monto,
  ];

  for (const value of candidates) {
    if (value === undefined || value === null || String(value).trim() === "")
      continue;
    const rawValue = String(value).trim().replace(/\s|\$/g, "");
    const normalizedValue = rawValue.includes(",")
      ? rawValue.replace(/\./g, "").replace(",", ".")
      : rawValue;
    const amount = Number(normalizedValue);
    if (Number.isFinite(amount)) return amount;
  }

  return null;
}

function formatMontoSolicitado(monto) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(monto);
}

function buildEmailHtml(solicitud) {
  const tipo = normalizeTipo(solicitud?.tipo || "desconocido") || "desconocido";
  const empleado =
    solicitud?.empleado || solicitud?.solicitante || "Empleado no informado";
  const emailSolicitante = getSolicitanteEmail(solicitud);
  const periodoSolicitado = getPeriodoSolicitado(solicitud);
  const estado = solicitud?.estado || "Pendiente";
  const descripcion =
    solicitud?.descripcion ||
    solicitud?.motivo ||
    solicitud?.observaciones ||
    solicitud?.destino ||
    "Sin descripción";
  const id = solicitud?.id || "N/A";
  const montoSolicitado = ["viaticos", "viatico"].includes(tipo)
    ? getMontoSolicitado(solicitud)
    : null;
  const montoSolicitadoHtml =
    montoSolicitado === null
      ? ""
      : `<li><strong>Monto solicitado:</strong> ${formatMontoSolicitado(montoSolicitado)}</li>`;

  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 640px; margin: 0 auto;">
      <div style="background: #0f766e; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">Nueva solicitud recibida</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p style="margin-top: 0;">Se registró una nueva solicitud en el portal interno.</p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li><strong>Empleado:</strong> ${empleado}</li>
          <li><strong>Email:</strong> ${emailSolicitante}</li>
          <li><strong>Tipo:</strong> ${tipo}</li>
          <li><strong>Periodo solicitado:</strong> ${periodoSolicitado}</li>
          <li><strong>Estado:</strong> ${estado}</li>
          <li><strong>Descripción:</strong> ${descripcion}</li>
          ${montoSolicitadoHtml}
          <li><strong>ID de solicitud:</strong> ${id}</li>
        </ul>
        <p style="margin-bottom: 0; color: #6b7280; font-size: 13px;">Este correo fue generado automáticamente por el sistema de notificaciones.</p>
      </div>
    </div>
  `;
}

function createTransporter() {
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = normalizeEmailPass(process.env.EMAIL_PASS);

  if (!user || !pass || pass === "CONTRASEÑA_DE_APLICACION") {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail(asunto, contenidoHtml, destinatarios) {
  try {
    const recipients = [...new Set((destinatarios || []).filter(Boolean))];
    if (recipients.length === 0) {
      return { ok: false, code: "email_not_configured", destinatarios: [] };
    }

    const transporter = createTransporter();
    if (!transporter) {
      return { ok: false, code: "email_not_configured", destinatarios: recipients };
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: asunto,
      html: contenidoHtml,
    });

    console.log("[EMAIL] Correo enviado correctamente");
    return { ok: true, destinatarios: recipients };
  } catch (error) {
    console.error(`[EMAIL] Error enviando correo: ${error?.message || error}`);
    return { ok: false, error };
  }
}

async function sendSolicitudNotification(solicitud) {
  const tipo = normalizeTipo(
    solicitud?.tipo || solicitud?.tipo_solicitud || "desconocido",
  );
  const etapa = solicitud?.etapa === "aprobada" ? "aprobada" : "creada";
  const destinatarios = await getDestinatariosParaEtapa(tipo, solicitud, etapa);

  console.log("[EMAIL] Iniciando envío...");
  console.log(`[EMAIL] Tipo de solicitud: ${tipo}`);
  console.log(`[EMAIL] Etapa: ${etapa}`);
  console.log(`[EMAIL] Destinatarios: ${destinatarios.join(", ")}`);

  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    console.log(
      `[EMAIL] Tipo de solicitud no contemplado: ${tipo}. El destinatario se define por la regla del tipo.`,
    );
  }

  const asunto = `Nueva solicitud de ${tipo}`;
  const contenidoHtml = buildEmailHtml({
    ...solicitud,
    tipo,
    empleado:
      solicitud?.empleado || solicitud?.solicitante || "Empleado no informado",
    fecha: solicitud?.fecha || solicitud?.fecha_desde || solicitud?.created_at,
    estado: solicitud?.estado || "Pendiente",
    descripcion:
      solicitud?.descripcion ||
      solicitud?.motivo ||
      solicitud?.observaciones ||
      solicitud?.destino ||
      "Sin descripción",
    id: solicitud?.id || solicitud?.solicitud_id || "N/A",
  });

  return sendEmail(asunto, contenidoHtml, destinatarios);
}

async function sendTestEmail() {
  const asunto = "Prueba de correo del portal interno";
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #0f766e;">Prueba de correo del portal interno</h2>
      <p>Si recibiste este correo, la configuración de Gmail y Nodemailer funciona correctamente.</p>
    </div>
  `;

  const destinatarios = [DEFAULT_EMAILS.agustina, DEFAULT_EMAILS.sara].filter(
    Boolean,
  );
  return sendEmail(asunto, contenidoHtml, destinatarios);
}

module.exports = {
  sendSolicitudNotification,
  enviarNotificacionSolicitud: sendSolicitudNotification,
  sendTestEmail,
  getDestinatarios,
  getCajaDestinatarioParaAdelanto,
  getSucursalSolicitante,
  getDestinatariosPorEtapa,
  getDestinatariosParaEtapa,
  getMontoSolicitado,
  buildEmailHtml,
  normalizeTipo,
  normalizeEmailPass,
};
