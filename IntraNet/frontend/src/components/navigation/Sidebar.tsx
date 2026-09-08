import { Link, useLocation } from "react-router";
import {
  Home,
  Users,
  Bell,
  Calendar,
  FileText,
  UserX,
  Gift,
  FileCheck,
  MessageSquare,
  LogOut,
  Palmtree,
  Car,
  Wallet,
  UserCircle,
  Image,
  BookOpen,
  Cpu,
} from "lucide-react";
import { useAuth, getInitials } from "../../context/AuthContext";
import { ThemeToggle } from "../ThemeToggle";
import { InstallAppButton } from "../InstallAppButton";

const adminNav = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Users, label: "Empleados", path: "/empleados" },
  { icon: Bell, label: "Novedades", path: "/novedades" },
  { icon: Calendar, label: "Eventos", path: "/eventos" },
  { icon: Calendar, label: "Calendario", path: "/calendario" },
  { icon: FileText, label: "Solicitudes", path: "/solicitudes" },
  { icon: Cpu, label: "Insumos Técnicos", path: "/insumos-tecnicos" },
  { icon: UserX, label: "Ausencias y Llegadas Tardes", path: "/ausencias" },
  { icon: Gift, label: "Beneficios", path: "/beneficios" },
  { icon: FileCheck, label: "Políticas", path: "/politicas" },
  { icon: BookOpen, label: "Manuales", path: "/manuales" },
  { icon: MessageSquare, label: "Sugerencias", path: "/sugerencias" },
];

const employeeMainNav = [
  { icon: Home, label: "Inicio", path: "/" },
  { icon: Bell, label: "Novedades", path: "/novedades" },
  { icon: Calendar, label: "Eventos", path: "/eventos" },
  { icon: Image, label: "Beneficios", path: "/beneficios" },
];

const employeeMoreNav = [
  { icon: Palmtree, label: "Vacaciones", path: "/vacaciones" },
  { icon: Wallet, label: "Adelantos", path: "/adelantos" },
  { icon: Car, label: "Auto y hotel", path: "/solicitar" },
  { icon: Cpu, label: "Insumos Técnicos", path: "/insumos-tecnicos" },
  { icon: Wallet, label: "On Balance", path: "/on-balanceada" },
  { icon: BookOpen, label: "Manuales", path: "/manuales" },
  { icon: FileCheck, label: "Políticas", path: "/politicas" },
  { icon: MessageSquare, label: "Sugerencias", path: "/sugerencias" },
  { icon: UserCircle, label: "Mi perfil", path: "/perfil" },
];

function NavItem({
  icon: Icon,
  label,
  path,
  badge,
}: {
  icon: typeof Home;
  label: string;
  path: string;
  badge?: number;
}) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 transition-all ${
        isActive
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className={`text-xs font-bold min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-foreground text-background"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const { user, isAdmin, onLogout } = useAuth();
  const initials = getInitials(user.name);
  const roleLabel = isAdmin ? "Administradora" : "Empleado";

  return (
    <aside className="w-60 bg-sidebar h-screen flex flex-col border-r border-sidebar-border fixed left-0 top-0 z-20 transition-colors">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-sidebar-foreground truncate">
              Panel Admin
            </h1>
            <p className="text-xs text-muted-foreground">Portal interno</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {adminNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-1 transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-accent-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Link
          to="/perfil"
          className="mt-3 w-full flex items-center gap-3 rounded-3xl border border-border px-4 py-4 bg-card text-sidebar-foreground transition-all hover:border-primary hover:bg-muted"
        >
          <div className="w-10 h-10 rounded-full avatar-gradient flex items-center justify-center text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </Link>
      </nav>

      <div className="p-3">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-primary hover:bg-accent rounded-full transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

function EmployeeSidebar() {
  const { user, isRRHH, onLogout } = useAuth();
  const initials = getInitials(user.name);
  const handle = `@${user.name.split(/\s+/)[0]?.toLowerCase() || "empleado"}`;

  return (
    <aside className="w-[240px] shrink-0 flex flex-col">
      <div className="bg-card rounded-3xl p-5 shadow-card border border-border mb-4 overflow-hidden relative">
        <div className="h-16 rounded-2xl bg-gradient-to-br from-primary/30 via-accent to-muted mb-10" />
        <div className="absolute top-10 left-5">
          <div className="w-16 h-16 rounded-full avatar-gradient border-4 border-card flex items-center justify-center text-lg font-bold shadow-md">
            {initials}
          </div>
        </div>
        <div className="mt-1">
          <p className="font-bold text-foreground text-sm leading-tight">
            {user.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{handle}</p>
        </div>
      </div>

      <nav className="bg-card rounded-3xl p-3 shadow-card border border-border flex-1 flex flex-col">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2">
          Menú
        </p>
        {employeeMainNav.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        {isRRHH && <NavItem icon={Users} label="Empleados" path="/empleados" />}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2 mt-2">
          Servicios
        </p>
        {employeeMoreNav.map((item) => (
          <NavItem key={item.path + item.label} {...item} />
        ))}

        <div className="mt-auto pt-3 px-2 flex items-center justify-between border-t border-border">
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-primary text-sm font-medium hover:bg-accent rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </nav>

      <div className="mt-4 bg-card rounded-3xl p-4 border border-dashed border-border text-center">
        <p className="text-xs font-medium text-foreground mb-1">
          Portal interno
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Tu red interna — novedades, equipo y trámites en un solo lugar.
        </p>
        <div className="mt-3 flex justify-center">
          <InstallAppButton variant="secondary" className="w-full" />
        </div>
        <div className="flex justify-center -space-x-2 mt-3">
          {["MR", "JL", "AC"].map((i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full avatar-gradient text-[10px] font-medium flex items-center justify-center border-2 border-card"
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminSidebar /> : <EmployeeSidebar />;
}
