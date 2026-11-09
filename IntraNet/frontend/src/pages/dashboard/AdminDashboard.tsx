// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: panel principal según el rol.
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, UserMinus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getEmployees, type Employee } from "../../services/api";
import {
  EmptyState,
  MetricCard,
  PageHero,
  PremiumCard,
} from "../../components/ui/ProductUI";
import { Link } from "react-router";
import { DashboardBirthdayHero } from "../../components/home/DashboardBirthdayHero";
import { SliderAdminPanel } from "../../components/admin/SliderAdminPanel";
import { EventsAdminPanel } from "../../components/admin/EventsAdminPanel";
import { AbsencesAdminPanel } from "../../components/absences/AbsencesAdminPanel";
import { EmployeeDetailModal } from "../../components/employees/EmployeeDetailModal";
import {
  EmployeeExpandableItem,
  EmployeeExpandableList,
} from "../../components/employees/EmployeeExpandableItem";

type DashboardEmpleado = {
  id: string | number;
  legajo?: string | number;
  nombre: string;
  apellido: string;
  email_corporativo: string;
  cargo?: string | null;
  area?: string | null;
  sucursal?: string | null;
  telefono?: string | null;
  foto_url?: string | null;
  activo?: boolean;
  es_director?: boolean;
  work_mode?: string | null;
};

// Gestiona la operacion toDashboardEmpleado.
function toDashboardEmpleado(emp: Employee): DashboardEmpleado {
  return {
    id: emp.id,
    legajo: emp.legajo ?? undefined,
    nombre: emp.nombre || "",
    apellido: emp.apellido || "",
    email_corporativo: emp.email_corporativo || "",
    cargo: emp.cargo,
    area: emp.area,
    sucursal: emp.sucursal,
    telefono: emp.telefono,
    foto_url: emp.foto_url,
    activo: emp.activo !== false,
    es_director: emp.es_director,
    work_mode: emp.work_mode,
  };
}

// Gestiona la operacion AdminDashboard.
export function AdminDashboard() {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<DashboardEmpleado | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "delete">(
    "view",
  );
  const [pendingAusencias, setPendingAusencias] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePendingChange = useCallback((count: number) => {
    setPendingAusencias(count);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getEmployees(token)])
      .then(([rows]) => {
        if (!active) return;
        setEmployees(rows);
      })
      .catch((err) => {
        console.error("Error al cargar empleados:", err);
        if (active) setError("load_failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const metrics = useMemo(() => {
    const active = employees.filter((e) => e.activo !== false);
    const inactive = employees.filter((e) => e.activo === false);
    return {
      total: employees.length,
      active: active.length,
      inactive: inactive.length,
    };
  }, [employees]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  const openEmployeeDetail = useCallback(
    (emp: Employee, mode: "view" | "edit" | "delete" = "view") => {
      setModalMode(mode);
      setSelectedEmployee(toDashboardEmpleado(emp));
    },
    [],
  );

  const handleEmployeeUpdated = useCallback((updated: DashboardEmpleado) => {
    setEmployees((prev) =>
      prev.map((e) =>
        String(e.id) === String(updated.id) ? { ...e, ...updated } : e,
      ),
    );
    setSelectedEmployee((prev) =>
      prev?.id === updated.id ? { ...prev, ...updated } : prev,
    );
  }, []);

  const handleEmployeeDeleted = useCallback(
    async (id: string | number) => {
      setSelectedEmployee(null);
      try {
        const rows = await getEmployees(token);
        setEmployees(rows);
      } catch {
        setEmployees((prev) => prev.filter((e) => String(e.id) !== String(id)));
      }
    },
    [token],
  );

  return (
    <div className="page-root admin-dashboard admin-page">
      <DashboardBirthdayHero token={token} />

      <PageHero
        eyebrow="Panel administrativo"
        title={`Hola, ${firstName}.`}
        description="Resumen del estado de la organización."
      />

      <SliderAdminPanel />

      <EventsAdminPanel />

      <section className="metric-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="metric-card"
              style={{ opacity: 0.5, minHeight: 110 }}
            />
          ))
        ) : error ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState
              title="Sin datos"
              description="No fue posible obtener la información del resumen."
              icon={Users}
            />
          </div>
        ) : (
          [
            {
              label: "Empleados",
              value: metrics.total,
              detail: "Total registrados",
              icon: Users,
            },
            {
              label: "Activos",
              value: metrics.active,
              detail: "En nómina activa",
              icon: Users,
            },
            {
              label: "Inactivos",
              value: metrics.inactive,
              detail: "Dados de baja",
              icon: UserMinus,
            },
            {
              label: "Ausencias pendientes",
              value: pendingAusencias,
              detail: "Requieren resolución",
              icon: CalendarDays,
              link: "/ausencias",
            },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              {"link" in m && m.link ? (
                <Link
                  to={m.link}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <MetricCard
                    label={m.label}
                    value={m.value}
                    detail={m.detail}
                    icon={m.icon}
                  />
                </Link>
              ) : (
                <MetricCard
                  label={m.label}
                  value={m.value}
                  detail={m.detail}
                  icon={m.icon}
                />
              )}
            </motion.div>
          ))
        )}
      </section>

      <AbsencesAdminPanel
        embedded
        defaultEstado="pendiente"
        showLink
        onPendingChange={handlePendingChange}
      />
      <PremiumCard
        title="Empleados recientes"
        eyebrow="Datos en tiempo real"
        icon={Users}
        action={
          <Link to="/empleados" className="card-inline-link">
            Ver todos →
          </Link>
        }
      >
        {loading ? (
          <EmptyState
            title="Cargando…"
            description="Obteniendo la lista de empleados…"
            icon={Users}
          />
        ) : employees.length === 0 ? (
          <EmptyState
            title="Sin empleados"
            description="No hay empleados registrados por el momento."
            icon={Users}
          />
        ) : (
          <EmployeeExpandableList>
            {employees.slice(0, 6).map((emp) => {
              const name =
                `${emp.nombre || ""} ${emp.apellido || ""}`.trim() ||
                "Sin nombre";
              return (
                <EmployeeExpandableItem
                  key={emp.id}
                  employee={{
                    id: emp.id,
                    name,
                    area: emp.area,
                    cargo: emp.cargo,
                    sucursal: emp.sucursal,
                    activo: emp.activo,
                    legajo: emp.legajo,
                    foto: emp.foto_url,
                  }}
                  showFoto
                  onEyeClick={() => openEmployeeDetail(emp, "view")}
                />
              );
            })}
          </EmployeeExpandableList>
        )}
      </PremiumCard>

      <EmployeeDetailModal
        employee={selectedEmployee}
        token={token}
        initialMode={modalMode}
        onClose={() => {
          setSelectedEmployee(null);
          setModalMode("view");
        }}
        onUpdated={handleEmployeeUpdated}
        onDeleted={handleEmployeeDeleted}
      />
    </div>
  );
}
