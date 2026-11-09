// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: ProductUI.
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Cpu,
  Gift,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plane,
  ReceiptText,
  ShieldCheck,
  Sun,
  UserCircle,
  UserMinus,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { InstallAppButton } from "../InstallAppButton";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { ConfirmDialog } from "./ConfirmDialog";
import { getInitials, useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getProfile } from "../../services/api";
import {
  getNotificationModulePath,
  getNotificationTypeLabel,
  notificationsService,
  type NotificacionDTO,
} from "../../services/notifications";
import { getFirstName, getGreeting } from "../../utils/greeting";
//
const PAGE_LABELS: Record<string, { title: string; kicker: string }> = {
  "/": { title: "Inicio", kicker: "Portal de empleados" },
  "/novedades": { title: "Novedades", kicker: "Comunicación interna" },
  "/eventos": { title: "Eventos", kicker: "Agenda corporativa" },
  "/calendario": { title: "Calendario", kicker: "Solicitudes aprobadas" },
  "/beneficios": { title: "Beneficios", kicker: "Bienestar del equipo" },
  "/ausencias": {
    title: "Ausencias y Llegadas Tardes",
    kicker: "Gestión de asistencia",
  },
  "/politicas": { title: "Políticas", kicker: "Normativas internas" },
  "/sugerencias": { title: "Sugerencias", kicker: "Tu voz importa" },
  "/manuales": { title: "Manuales", kicker: "Documentación interna" },
  "/empleados": { title: "Empleados", kicker: "Gestión de personal" },
  "/solicitudes": { title: "Solicitudes", kicker: "Panel administrativo" },
  "/adelantos": { title: "Adelantos", kicker: "Solicitudes de anticipo" },
  "/insumos-tecnicos": {
    title: "Insumos Técnicos",
    kicker: "Herramientas de trabajo",
  },
  "/perfil": { title: "Mi perfil", kicker: "Datos personales" },
  "/vacaciones": { title: "Vacaciones", kicker: "Gestión de licencias" },
  "/solicitar": { title: "Auto y hotel", kicker: "Solicitudes de servicio" },
  "/reservas": { title: "Reservas", kicker: "Solicitudes de servicio" },
  "/on-balanceada": { title: "On Balance", kicker: "Bienestar personal" },
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
  status?: "ready" | "pending";
};

const adminNav: NavItem[] = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Users, label: "Empleados", path: "/empleados" },
  { icon: Bell, label: "Novedades", path: "/novedades" },
  { icon: CalendarDays, label: "Eventos", path: "/eventos" },
  { icon: CalendarDays, label: "Calendario", path: "/calendario" },
  { icon: WalletCards, label: "Solicitudes", path: "/solicitudes" },
  { icon: Wrench, label: "Insumos Técnicos", path: "/insumos-tecnicos" },
  { icon: UserMinus, label: "Ausencias y Llegadas Tardes", path: "/ausencias" },
  { icon: Gift, label: "Beneficios", path: "/beneficios" },
  { icon: ShieldCheck, label: "Políticas", path: "/politicas" },
  { icon: BookOpen, label: "Manuales", path: "/manuales" },
  { icon: MessageSquare, label: "Sugerencias", path: "/sugerencias" },
];

const employeeNavMain: NavItem[] = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Bell, label: "Novedades", path: "/novedades" },
  { icon: CalendarDays, label: "Eventos", path: "/eventos" },
  { icon: Gift, label: "Beneficios", path: "/beneficios" },
];

const employeeNavMore: NavItem[] = [
  { icon: UserMinus, label: "Ausencias", path: "/ausencias" },
  { icon: Plane, label: "Vacaciones", path: "/vacaciones" },
  { icon: WalletCards, label: "Adelantos", path: "/adelantos" },
  { icon: WalletCards, label: "Viáticos", path: "/viaticos" },
  { icon: WalletCards, label: "Auto y hotel", path: "/solicitar" },
  { icon: Cpu, label: "Insumos Técnicos", path: "/insumos-tecnicos" },
  { icon: ReceiptText, label: "On Balance", path: "/on-balanceada" },
  { icon: BookOpen, label: "Manuales", path: "/manuales" },
  { icon: ShieldCheck, label: "Políticas", path: "/politicas" },
  { icon: MessageSquare, label: "Sugerencias", path: "/sugerencias" },
  { icon: UserCircle, label: "Mi perfil", path: "/perfil" },
];

// Gestiona la operacion notificationTone.
function notificationTone(titulo: string): string {
  const t = titulo.toLowerCase();
  if (
    t.includes("solicitud") ||
    t.includes("ausencia") ||
    t.includes("vacacion")
  )
    return "warning";
  if (t.includes("evento") || t.includes("reunión") || t.includes("reunion"))
    return "info";
  if (t.includes("aprobada") || t.includes("beneficio")) return "success";
  return "accent";
}

// Prepara el valor para su uso.
function formatNotificationDate(fecha?: string) {
  if (!fecha) return "";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type NotificationMenuAnchor = {
  top: number;
  right: number;
  left?: number;
  width?: number;
};

// Gestiona la operacion NotificationCenter.
function NotificationCenter({
  compact = false,
  mode,
}: {
  compact?: boolean;
  mode: "admin" | "employee";
}) {
  const isAdmin = mode === "admin";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<NotificationMenuAnchor | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificacionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NotificacionDTO | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: "one"; id: number | string } | { type: "all" } | null
  >(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const itemsRef = useRef<NotificacionDTO[]>([]);

  const load = useCallback(async (background = false) => {
    const hasCachedItems = itemsRef.current.length > 0;
    const showLoading = !background && !hasCachedItems;
    if (showLoading) setLoading(true);
    try {
      const res = await notificationsService.getAll();
      setItems(res.data || []);
    } catch {
      if (!hasCachedItems) setItems([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onFocus = () => {
      load(true);
    };
    // Gestiona la accion correspondiente.
    const onVisibility = () => {
      if (document.visibilityState === "visible") load(true);
    };
    const interval = window.setInterval(() => load(true), 60_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const unread = items.filter((n) => !n.leida);

  // Gestiona la accion correspondiente.
  const handleOpen = () => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        setSelected(null);
        load(true);
      }
      return next;
    });
  };

  // Gestiona la accion correspondiente.
  const handleMarkRead = async (id: number | string) => {
    try {
      await notificationsService.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
      setSelected((prev) =>
        prev?.id === id ? { ...prev, leida: true } : prev,
      );
    } catch {
      // ignore
    }
  };

  // Gestiona la accion correspondiente.
  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
      setSelected((prev) => (prev ? { ...prev, leida: true } : prev));
    } catch {
      // ignore
    }
  };

  // Gestiona la accion correspondiente.
  const handleDelete = async (id: number | string) => {
    try {
      await notificationsService.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    } catch {
      // ignore
    }
  };

  // Gestiona la accion correspondiente.
  const handleDeleteAll = async () => {
    setConfirmBusy(true);
    try {
      await notificationsService.removeAll();
      setItems([]);
      setSelected(null);
      setConfirmAction(null);
    } catch {
      // ignore
    } finally {
      setConfirmBusy(false);
    }
  };

  // Gestiona la operacion runConfirmAction.
  const runConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "all") {
      await handleDeleteAll();
      return;
    }
    setConfirmBusy(true);
    try {
      await handleDelete(confirmAction.id);
      setConfirmAction(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    // Actualiza los datos correspondientes.
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      if (compact && isMobile) {
        setAnchor({ top: rect.bottom + 8, right: 12, left: 12 });
      } else {
        setAnchor({
          top: rect.bottom + 10,
          right: Math.max(12, window.innerWidth - rect.right),
          width: Math.min(380, window.innerWidth - 24),
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("notification-panel-open");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("notification-panel-open");
      document.body.style.overflow = prev;
    };
  }, [open]);

  const menuPanel = (
    <>
      <div className="notification-menu-head">
        <div>
          <p className="page-kicker">Centro interno</p>
          <h3>Notificaciones</h3>
        </div>
        <div className="notification-head-actions">
          <span>{unread.length} sin leer</span>
          <div className="notification-head-buttons">
            {unread.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleMarkAllRead}
              >
                Marcar todas
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost notification-delete-all"
                onClick={() => setConfirmAction({ type: "all" })}
              >
                Borrar todas
              </button>
            )}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="notification-detail">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setSelected(null)}
          >
            ← Volver
          </button>
          <span
            className={`notification-type-pill ${notificationTone(selected.titulo)}`}
          >
            {getNotificationTypeLabel(selected.tipo)}
          </span>
          <h4>{selected.titulo}</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{selected.mensaje}</p>
          {selected.fecha && (
            <time>{formatNotificationDate(selected.fecha)}</time>
          )}
          <div className="notification-detail-actions">
            {!selected.leida && (
              <button
                type="button"
                className="btn btn-sm btn-muted"
                onClick={() => handleMarkRead(selected.id)}
              >
                Marcar como leída
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-ghost notification-delete-all"
              onClick={() => setConfirmAction({ type: "one", id: selected.id })}
            >
              <X size={14} />
              Eliminar
            </button>
            <Link
              to={getNotificationModulePath(selected, isAdmin)}
              className="btn btn-sm btn-primary-fill"
              onClick={() => {
                if (!selected.leida) handleMarkRead(selected.id);
                setOpen(false);
              }}
            >
              Abrir módulo
            </Link>
          </div>
        </div>
      ) : (
        <div className="notification-list">
          {loading ? (
            <p className="notification-empty">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="notification-empty">Sin notificaciones.</p>
          ) : (
            items.slice(0, 12).map((item) => (
              <div key={String(item.id)} className="notification-item-row">
                <button
                  type="button"
                  className={`notification-item ${item.leida ? "read" : ""}`}
                  onClick={() => {
                    setSelected(item);
                  }}
                >
                  <span
                    className={`notification-dot ${notificationTone(item.titulo)}`}
                  />
                  <span className="notification-item-body">
                    <span className="notification-item-top">
                      <strong>{item.titulo}</strong>
                      <em>{getNotificationTypeLabel(item.tipo)}</em>
                    </span>
                    <small>{item.mensaje}</small>
                    {item.fecha && (
                      <time>{formatNotificationDate(item.fecha)}</time>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="notification-item-remove"
                  aria-label="Eliminar notificación"
                  onClick={() => setConfirmAction({ type: "one", id: item.id })}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      className={`notification-center${open ? " notification-center--open" : ""}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="app-header-btn notification-trigger"
        onClick={handleOpen}
        aria-label="Abrir notificaciones"
        aria-expanded={open}
      >
        <Bell size={compact ? 18 : 19} />
        {unread.length > 0 && (
          <span className="notification-count">{unread.length}</span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && anchor && (
            <>
              <motion.button
                key="notification-backdrop"
                type="button"
                className="notification-backdrop"
                aria-label="Cerrar notificaciones"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                key="notification-menu"
                className="notification-menu notification-menu-pro notification-menu--portaled"
                style={{
                  top: anchor.top,
                  right: anchor.right,
                  ...(anchor.left != null ? { left: anchor.left } : {}),
                  ...(anchor.width != null ? { width: anchor.width } : {}),
                }}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                {menuPanel}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <ConfirmDialog
        open={confirmAction != null}
        title={
          confirmAction?.type === "all"
            ? "¿Borrar todas las notificaciones?"
            : "¿Eliminar notificación?"
        }
        description={
          confirmAction?.type === "all"
            ? "Se eliminarán todas tus notificaciones. Esta acción no se puede deshacer."
            : "Esta acción no se puede deshacer."
        }
        confirmLabel={
          confirmAction?.type === "all" ? "Borrar todas" : "Eliminar"
        }
        loading={confirmBusy}
        onConfirm={runConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

/* ── Nav item ── */
function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`app-nav-link ${isActive ? "active" : ""}`}
    >
      <Icon size={20} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="app-nav-badge">{item.badge}</span>
      )}
    </Link>
  );
}

/* ── Sidebar content ── */
function SidebarContent({
  mode,
  onClose,
}: {
  mode: "admin" | "employee";
  onClose?: () => void;
}) {
  const { user, onLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const initials = getInitials(user.name);
  const role = mode === "admin" ? "Administración" : "Empleado";

  const mainNav = mode === "admin" ? adminNav : employeeNavMain;
  const moreNav = mode === "admin" ? [] : employeeNavMore;

  return (
    <>
      {/* Cerrar drawer (mobile) */}
      {onClose && (
        <div className="app-sidebar-logo-wrap app-sidebar-logo-wrap--close-only">
          <button
            type="button"
            className="app-header-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Profile */}
      <Link
        to="/perfil"
        className="app-profile-card"
        onClick={onClose}
        aria-label={`Perfil de ${user.name}`}
      >
        <div className="app-profile-avatar">
          {user.foto ? (
            <img
              src={user.foto}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="app-profile-info">
          <p className="app-profile-name">{user.name}</p>
          <p className="app-profile-role">{role}</p>
        </div>
        <ChevronRight size={16} className="app-profile-chevron" />
      </Link>

      {/* Separador visual */}
      <div className="app-sidebar-divider" aria-hidden="true" />

      {/* Main nav */}
      {mode === "employee" && (
        <p className="app-nav-section-label">Menú principal</p>
      )}
      {mode === "admin" && (
        <p className="app-nav-section-label">Administración</p>
      )}
      <nav aria-label="Navegación principal">
        {mainNav.map((item) => (
          <NavLink key={item.path + item.label} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* More nav */}
      {moreNav.length > 0 && (
        <>
          <p className="app-nav-section-label">
            {mode === "employee" ? "Servicios" : "Configuración"}
          </p>
          <nav aria-label={mode === "employee" ? "Servicios" : "Configuración"}>
            {moreNav.map((item) => (
              <NavLink
                key={item.path + item.label}
                item={item}
                onClick={onClose}
              />
            ))}
          </nav>
        </>
      )}

      {/* Footer */}
      <div className="app-sidebar-footer">
        <button
          type="button"
          className="app-nav-link"
          style={{
            width: "100%",
            background: "none",
            border: 0,
            cursor: "pointer",
          }}
          onClick={toggleTheme}
          aria-label={
            theme === "light" ? "Activar modo oscuro" : "Activar modo claro"
          }
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          <span style={{ flex: 1 }}>
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </span>
        </button>

        <InstallAppButton variant="ghost" className="app-nav-link" showLabel />

        <div className="app-sidebar-logout">
          {confirmLogout ? (
            <div
              className="app-logout-confirm"
              role="alertdialog"
              aria-label="Confirmar cierre de sesión"
            >
              <div className="app-logout-confirm-msg">
                <AlertTriangle size={16} />
                <span>¿Cerrar sesión?</span>
              </div>
              <div className="app-logout-confirm-actions">
                <button
                  type="button"
                  className="app-logout-yes"
                  onClick={onLogout}
                >
                  Cerrar sesión
                </button>
                <button
                  type="button"
                  className="app-logout-cancel"
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="app-nav-link app-nav-link-danger"
              style={{
                width: "100%",
                background: "none",
                border: 0,
                cursor: "pointer",
              }}
              onClick={() => setConfirmLogout(true)}
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Main shell ── */
export function ProductShell({ mode }: { mode: "admin" | "employee" }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const location = useLocation();
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const homePath = "/";

  const isEmployeeHome = mode === "employee" && location.pathname === "/";

  useEffect(() => {
    if (!isEmployeeHome || !token) {
      setHomeSubtitle("");
      return;
    }

    let active = true;
    getProfile(token)
      .then((profile) => {
        if (!active) return;
        const sector = profile.sector || "Sector no informado";
        const sucursal = profile.sucursal || "Sucursal no informada";
        setHomeSubtitle(`${sector} · ${sucursal}`);
      })
      .catch(() => {
        if (active) setHomeSubtitle("");
      });

    return () => {
      active = false;
    };
  }, [isEmployeeHome, token]);

  const currentPage = (() => {
    if (isEmployeeHome) {
      const firstName = getFirstName(user.name);
      return {
        title: `${getGreeting()}, ${firstName}.`,
        kicker: homeSubtitle || "Portal de empleados",
      };
    }
    return (
      PAGE_LABELS[location.pathname] ?? {
        title: "Portal interno",
        kicker: "Portal de empleados",
      }
    );
  })();

  return (
    <div className="app-shell">
      <div className="site-orb site-orb-top-left" aria-hidden="true" />
      <div className="site-orb site-orb-top" aria-hidden="true" />
      <div className="site-orb site-orb-bottom-left" aria-hidden="true" />
      <div className="site-orb site-orb-bottom" aria-hidden="true" />

      {/* Top navbar — mobile y desktop */}
      <header className="app-header">
        <div className="app-header-slot app-header-slot--start">
          <button
            type="button"
            className="app-header-btn app-header-btn--menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="app-header-slot app-header-slot--center">
          <Link
            to={homePath}
            className="app-header-logo-link"
            aria-label="Portal interno — inicio"
          >
            <span aria-hidden="true" />
          </Link>
        </div>

        <div className="app-header-slot app-header-slot--end app-header-actions app-header-notifications">
          <NotificationCenter compact mode={mode} />
        </div>
      </header>

      {/* Desktop sidebar — visible a partir de 768px vía CSS */}
      <aside
        className="app-sidebar"
        id="desktop-sidebar"
        aria-label="Navegación principal"
      >
        <SidebarContent mode={mode} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="app-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              id="mobile-drawer"
              className="app-sidebar app-sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              aria-label="Menú de navegación"
            >
              <SidebarContent
                mode={mode}
                onClose={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        key={location.pathname}
        className="app-main"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="app-topbar">
          <div>
            <p className="app-topbar-kicker">{currentPage.kicker}</p>
            <h1>{currentPage.title}</h1>
          </div>
          <div className="app-topbar-actions">
            <NotificationCenter mode={mode} />
          </div>
        </div>
        <Outlet />
      </motion.main>

      <ScrollToTopButton />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   UI COMPONENT LIBRARY (used by pages)
   ───────────────────────────────────────────────────────────────────────────── */

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <p className="page-kicker">{eyebrow}</p>
      <h1 className="page-hero-title">{title}</h1>
      <p className="page-hero-desc">{description}</p>
      {children && <div style={{ marginTop: 20 }}>{children}</div>}
    </section>
  );
}

// Gestiona la operacion PremiumCard.
export function PremiumCard({
  title,
  eyebrow,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          {Icon && (
            <div className="icon-tile">
              <Icon size={18} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <p className="page-kicker" style={{ marginBottom: 2 }}>
                {eyebrow}
              </p>
            )}
            <h3 className="card-title">{title}</h3>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Gestiona la operacion MetricCard.
export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="metric-card">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {detail && <p className="metric-detail">{detail}</p>}
        </div>
        <div className="icon-tile icon-tile-lg">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// Gestiona la operacion EmptyState.
export function EmptyState({
  title,
  description,
  endpoint,
  icon: Icon = Bell,
}: {
  title: string;
  description: string;
  endpoint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={22} />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {endpoint && import.meta.env.DEV && (
        <code className="empty-state-endpoint">{endpoint}</code>
      )}
    </div>
  );
}

// Gestiona la operacion EndpointBadge.
export function EndpointBadge({
  label,
  endpoint,
  compact = false,
}: {
  label: string;
  endpoint: string;
  compact?: boolean;
}) {
  return (
    <div className="endpoint-badge" title={`Endpoint pendiente: ${endpoint}`}>
      <span>{label}</span>
      {!compact && (
        <code style={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
          {endpoint}
        </code>
      )}
    </div>
  );
}

// Gestiona la operacion ModuleLink.
export function ModuleLink({
  title,
  description,
  to,
  icon: Icon,
  status = "pending",
}: {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  status?: "ready" | "pending";
}) {
  return (
    <Link to={to} className="module-link">
      <div className="icon-tile">
        <Icon size={18} />
      </div>
      <div className="module-link-content">
        <h3 className="module-link-title">{title}</h3>
        <p className="module-link-desc">{description}</p>
      </div>
      <span className={`status-pill ${status}`}>
        {status === "ready" ? "Listo" : "Pendiente"}
      </span>
      <ChevronRight
        size={16}
        style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
      />
    </Link>
  );
}
