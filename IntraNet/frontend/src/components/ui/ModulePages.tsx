// Componente React reutilizable: recibe datos mediante props, puede manejar estado local y representa una parte de la interfaz. Tema específico: ModulePages.
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { FileWarning, UserCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getProfile, type Profile } from "../../services/api";
import { EmptyState, PageHero, PremiumCard } from "./ProductUI";

// Gestiona la operacion PendingModulePage.
export function PendingModulePage({
  eyebrow,
  title,
  description,
  endpoint,
  reason,
  icon: Icon = FileWarning,
}: {
  eyebrow: string;
  title: string;
  description: string;
  endpoint?: string;
  reason: string;
  icon?: LucideIcon;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: "grid", gap: 20 }}
    >
      <PageHero eyebrow={eyebrow} title={title} description={description} />

      <section className="card">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "32px 16px",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "var(--warning-bg)",
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={28} />
          </div>

          <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              Módulo en preparación
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {reason}
            </p>
          </div>

          {endpoint && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                background: "var(--muted)",
                border: "1px solid var(--border-solid)",
              }}
            >
              <AlertCircle
                size={13}
                style={{ color: "var(--warning)", flexShrink: 0 }}
              />
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.78rem",
                  color: "var(--muted-foreground)",
                }}
              >
                {endpoint}
              </code>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

// Gestiona la operacion ProfileModulePage.
export function ProfileModulePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProfile(token)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHero
        eyebrow="Perfil"
        title={user.name}
        description="Tu perfil y datos personales en la organización."
      />

      <PremiumCard title="Datos personales" eyebrow="Perfil" icon={UserCircle}>
        {loading ? (
          <EmptyState
            title="Cargando perfil..."
            description="Consultando tu información."
          />
        ) : !profile ? (
          <EmptyState
            title="Sin datos"
            description="No se pudo cargar tu perfil."
            endpoint="GET /profile"
          />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                margin: 0,
              }}
            >
              {profile.emailEmpresa || user.email || "Sin email"}
            </p>
          </div>
        )}
      </PremiumCard>
    </motion.div>
  );
}
