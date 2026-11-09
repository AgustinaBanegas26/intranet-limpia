// Pantalla pública de inicio de sesión: valida con la API Express propia y
// deriva la recuperación a su flujo independiente en /reset-password.
import { useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  HelpCircle,
  LockKeyhole,
  Moon,
  Newspaper,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { InstallAppButton } from "../../components/InstallAppButton";
import { useTheme } from "../../context/ThemeContext";
import { getBackendUrl, login, type Session } from "../../services/auth";
import {
  getPasswordRecoveryErrorMessage,
  requestPasswordRecovery,
} from "../../services/passwordRecovery";

interface Props {
  onLogin: (session: Session) => void;
}

// Traduce errores funcionales del backend a mensajes breves para quien inicia sesión.
function formatError(fullMessage: string) {
  // login() comunica los errores con el formato "código:mensaje" para traducirlos en la interfaz.
  const parts = String(fullMessage || "").split(":");
  const code = parts[0];
  const detail = parts.slice(1).join(":");

  if (
    code === "invalid_credentials" ||
    fullMessage.includes("Invalid login credentials")
  )
    return "Correo o contraseña incorrectos.";
  if (code === "auth_locked")
    return "Cuenta bloqueada temporalmente. Intentá más tarde.";
  if (code === "account_inactive" || code === "account_disabled")
    return "Tu cuenta está inactiva. Contactá a RRHH.";
  if (fullMessage.includes("Failed to fetch"))
    return `No se puede conectar con el servidor (${getBackendUrl()}). Verificá que el backend esté iniciado.`;
  if (code === "login_failed")
    return "No se pudo iniciar sesión. Revisá el servidor.";

  // El backend puede adjuntar un detalle funcional para explicar el rechazo.
  if (detail) return `${detail.trim()}`;

  return "Ocurrió un error. Intentá nuevamente.";
}

const INSIGHTS = [
  { icon: Newspaper, text: "Comunicados internos y agenda corporativa" },
  {
    icon: CalendarDays,
    text: "Eventos, reservas y solicitudes en seguimiento",
  },
  { icon: ShieldCheck, text: "Acceso protegido para empleados" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
};

// Crea la secuencia de entrada escalonada que usa el contenido visual de la pantalla.
const stagger = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: delay } },
});

// Muestra el formulario de acceso y permite comenzar la recuperación pública.
// Recibe onLogin para que App.tsx guarde la sesión emitida por Express.
export function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  // Envía correo y contraseña al login existente; entrega la sesión al componente padre.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!email || !password) return;

    setError("");
    setLoading(true);
    try {
      const session = await login({ email, password });
      onLogin({
        token: session.token,
        user: {
          ...session.user,
          mustChangePassword: Boolean(session.user.mustChangePassword),
        },
      });
    } catch (err) {
      console.error("[Login] error caught:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(formatError(message));
    } finally {
      setLoading(false);
    }
  };

  // Solicita el código al backend propio y conserva un mensaje genérico por privacidad.
  const handleRecoverySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recoveryEmail) return;

    setRecoveryLoading(true);
    setRecoveryMessage("");
    setRecoveryFailed(false);

    try {
      setRecoveryMessage(await requestPasswordRecovery(recoveryEmail.trim()));
    } catch (error) {
      // No se revela si el email existe ni se exponen detalles del proveedor SMTP.
      setRecoveryFailed(true);
      setRecoveryMessage(getPasswordRecoveryErrorMessage(
        error,
        "No se pudo procesar la solicitud ahora. Intentá nuevamente más tarde.",
      ));
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <main className="premium-login" lang="es">
      <div className="login-surface" aria-hidden="true" />
      <div className="login-noise" aria-hidden="true" />
      <div className="login-orb login-orb-top-left" aria-hidden="true" />
      <div className="login-orb login-orb-top" aria-hidden="true" />
      <div className="login-orb login-orb-bottom-left" aria-hidden="true" />
      <div className="login-orb login-orb-bottom" aria-hidden="true" />

      <section className="login-intel">
        <motion.div
          className="login-intel-inner"
          initial="hidden"
          animate="visible"
          variants={stagger(0)}
        >
          <motion.div
            className="login-brand"
            aria-hidden="true"
            variants={fadeUp}
          />

          <motion.div variants={fadeUp}>
            <p className="login-kicker">Portal corporativo</p>
            <h1>
              Una intranet más segura, simple y conectada
              <span className="login-period">.</span>
            </h1>
            <p className="login-desc">
              Accedé a novedades, solicitudes, beneficios y documentación
              interna desde una experiencia unificada.
            </p>
          </motion.div>

          <motion.div
            className="login-insights"
            initial="hidden"
            animate="visible"
            variants={stagger(0.25)}
          >
            {INSIGHTS.map(({ icon: Icon, text }) => (
              <motion.article
                key={text}
                variants={slideLeft}
                whileHover={{ x: 6, transition: { duration: 0.18 } }}
              >
                <span className="login-insight-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span>{text}</span>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="login-theme-selector login-theme-desktop"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <span className="login-theme-label">Cambiar tema</span>
          <div
            className="login-theme-pill"
            role="group"
            aria-label="Seleccionar tema"
          >
            <button
              type="button"
              className={`login-theme-icon${theme === "light" ? " active" : ""}`}
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              aria-label="Modo claro"
              title="Modo claro"
            >
              <Sun size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`login-theme-icon${theme === "dark" ? " active" : ""}`}
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              aria-label="Modo oscuro"
              title="Modo oscuro"
            >
              <Moon size={15} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </section>

      <section className="login-panel">
        <div className="login-tools">
          <div
            className="login-theme-pill login-theme-mobile"
            role="group"
            aria-label="Seleccionar tema"
          >
            <button
              type="button"
              className={`login-theme-icon${theme === "light" ? " active" : ""}`}
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              aria-label="Modo claro"
              title="Modo claro"
            >
              <Sun size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`login-theme-icon${theme === "dark" ? " active" : ""}`}
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              aria-label="Modo oscuro"
              title="Modo oscuro"
            >
              <Moon size={15} aria-hidden="true" />
            </button>
          </div>
          <InstallAppButton variant="ghost" />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="login-card"
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="login-card-logo">
            <div aria-hidden="true" />
          </div>

          <div className="login-card-head">
            <p className="login-kicker">Acceso seguro</p>
            <h2>Iniciar sesión</h2>
            <span>Ingresá con tu email corporativo y contraseña.</span>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="login-error"
                role="alert"
                key="login-error"
                initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22 }}
              >
                <AlertCircle size={17} aria-hidden="true" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <label className="login-field" htmlFor="login-email">
            <span>Email corporativo</span>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nombre@empresa.com"
            />
          </label>

          <label className="login-field" htmlFor="login-password">
            <span>Contraseña</span>
            <div className="login-password-wrap">
              <input
                id="login-password"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((value) => !value)}
                aria-label={
                  showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="button"
            className="login-forgot"
            onClick={() => setShowRecovery(true)}
          >
            <HelpCircle size={14} aria-hidden="true" />
            ¿Olvidaste tu contraseña?
          </button>

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <LockKeyhole size={18} aria-hidden="true" />
            )}
            {loading ? "Ingresando..." : "Entrar al portal"}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </motion.form>
      </section>

      <AnimatePresence>
        {showRecovery && (
          <motion.div
            className="login-recovery-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowRecovery(false)}
          >
            <motion.div
              className="login-recovery-modal"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.24, ease }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Recuperar contraseña"
            >
              <div className="login-recovery-head">
                <div>
                  <p className="login-kicker">Soporte</p>
                  <h3>Recuperar contraseña</h3>
                </div>
                <button
                  type="button"
                  className="login-recovery-close"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryMessage("");
                    setRecoveryFailed(false);
                    setRecoveryEmail("");
                  }}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {recoveryMessage ? (
                <div
                  className="login-recovery-body"
                  style={{ textAlign: "center", marginTop: "16px" }}
                >
                  <p
                    style={{
                      color: recoveryFailed
                        ? "var(--danger)"
                        : "var(--success)",
                    }}
                  >
                    {recoveryMessage}
                  </p>
                  <button
                    type="button"
                    className="login-recovery-btn"
                    onClick={() => {
                      const target = recoveryFailed
                        ? "/reset-password"
                        : `/reset-password?email=${encodeURIComponent(recoveryEmail.trim())}`;
                      setShowRecovery(false);
                      setRecoveryMessage("");
                      setRecoveryFailed(false);
                      navigate(target);
                    }}
                    style={{ marginTop: "16px" }}
                  >
                    {recoveryFailed
                      ? "Intentar nuevamente"
                      : "Ingresar código"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit}>
                  <p className="login-recovery-body">
                    Ingresá tu correo electrónico corporativo y te enviaremos
                    las instrucciones para restablecer tu contraseña.
                  </p>
                  <label
                    className="login-field"
                    htmlFor="recovery-email"
                    style={{ marginTop: "16px" }}
                  >
                    <span>Email corporativo</span>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      placeholder="nombre@empresa.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="login-recovery-btn"
                    disabled={recoveryLoading}
                    style={{ marginTop: "16px" }}
                  >
                    {recoveryLoading ? "Enviando..." : "Enviar instrucciones"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
