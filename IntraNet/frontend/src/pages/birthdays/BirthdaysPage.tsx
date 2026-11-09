// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: cumpleaños y celebraciones.
import { useEffect, useState } from "react";
import { Cake, Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import {
  celebracionesService,
  type CelebracionesDTO,
  type CelebracionPersona,
} from "../../services/celebraciones";
import { buildUpcomingOnlyPersons } from "../../utils/birthdayUpcoming";
import { PersonRow } from "../../components/home/PersonRow";
import { BirthdayCard } from "../../components/home/BirthdayCard";
import { BirthdayCarousel } from "../../components/home/BirthdayCarousel";
import { BirthdayUpcomingAccordion } from "../../components/home/BirthdayUpcomingAccordion";
import { PageHero, PremiumCard } from "../../components/ui/ProductUI";

// Calcula el resultado correspondiente.
function computeIsToday(p: CelebracionPersona) {
  return p.esHoy === true || p.diasRestantes === 0;
}

// Genera la vista del componente.
function renderBirthdaySection(
  allPersons: CelebracionPersona[],
  upcoming: CelebracionPersona[],
) {
  if (allPersons.length === 0) return null;
  if (allPersons.length === 1) {
    return (
      <BirthdayCard
        person={allPersons[0]}
        isToday={computeIsToday(allPersons[0])}
        isUpcoming={
          !computeIsToday(allPersons[0]) &&
          (allPersons[0].diasRestantes ?? 99) < 7
        }
        upcomingPersons={upcoming}
      />
    );
  }
  return <BirthdayCarousel persons={allPersons} upcomingPersons={upcoming} />;
}

// Gestiona la operacion BirthdaysPage.
export function BirthdaysPage() {
  const { token } = useAuth();
  const [data, setData] = useState<CelebracionesDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    celebracionesService
      .getAll(token, 60)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const cumpleanosHoy = data?.cumpleanosHoy ?? [];
  const upcomingAll = data?.proximosCumpleanos ?? [];
  const upcomingPersons = buildUpcomingOnlyPersons(upcomingAll);

  const anniversarySection = {
    key: "aniversariosMes",
    title: "Aniversarios del mes",
    icon: Trophy,
    people: data?.aniversariosMes ?? [],
    empty: "Sin aniversarios este mes.",
  };

  return (
    <div className="page-root">
      <PageHero
        eyebrow="Personas"
        title="Equipo"
        description="Cumpleaños y aniversarios laborales del equipo."
      />

      {loading ? (
        <div className="card" style={{ minHeight: 200 }}>
          <p style={{ color: "var(--muted-foreground)", margin: 0 }}>
            Cargando equipo…
          </p>
        </div>
      ) : error ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "40px 24px" }}
        >
          <p style={{ color: "var(--muted-foreground)", margin: 0 }}>
            No se pudieron cargar las celebraciones.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Birthday section — card or carousel */}
          {cumpleanosHoy.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Cake
                  size={16}
                  style={{ color: "var(--primary)" }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Cumpleaños de hoy
                </span>
              </div>
              {renderBirthdaySection(cumpleanosHoy, upcomingPersons)}
            </motion.div>
          )}

          {cumpleanosHoy.length === 0 && upcomingPersons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <PremiumCard title="Próximos cumpleaños" icon={Star}>
                <BirthdayUpcomingAccordion
                  persons={upcomingPersons}
                  embedded
                  alwaysShow
                />
              </PremiumCard>
            </motion.div>
          )}

          {/* Anniversaries */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.35 }}
          >
            <PremiumCard
              title={anniversarySection.title}
              icon={anniversarySection.icon}
            >
              {anniversarySection.people.length === 0 ? (
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    margin: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {anniversarySection.empty}
                </p>
              ) : (
                <div>
                  {anniversarySection.people.map((person) => (
                    <PersonRow
                      key={String(person.id)}
                      nombreCompleto={person.nombreCompleto}
                      area={person.area}
                      foto={person.foto}
                      meta={`${"anios" in person ? `${(person as { anios?: number }).anios} años · ` : ""}${person.fecha}`}
                    />
                  ))}
                </div>
              )}
            </PremiumCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
