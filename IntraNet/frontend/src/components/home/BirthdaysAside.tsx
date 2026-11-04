import { useEffect, useState } from 'react'
import { Cake, Award } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { celebracionesService, type CelebracionesDTO } from '../../services/celebraciones'
import { PersonRow } from './PersonRow'
import { BirthdayCard } from './BirthdayCard'
import { BirthdayCarousel } from './BirthdayCarousel'
import { BirthdayUpcomingAccordion } from './BirthdayUpcomingAccordion'

// Gestiona la operacion BirthdaysAside.
export function BirthdaysAside() {
  const { token } = useAuth()
  const [data, setData] = useState<CelebracionesDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    celebracionesService
      .getAll(token, 14)
      .then((response) => {
        if (active) setData(response.data)
      })
      .catch(() => {
        if (active) setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const hoy = data?.cumpleanosHoy ?? []
  const proximos = data?.proximosCumpleanos ?? []
  const aniversarios = data?.aniversariosMes ?? []

  return (
    <aside className="gn-aside-card" aria-label="Cumpleaños y aniversarios">
      <section className="gn-aside-section">
        <header className="gn-aside-head">
          <Cake size={18} aria-hidden="true" />
          <h3>Cumpleaños</h3>
        </header>

        {loading ? (
          <p className="gn-aside-empty">Cargando celebraciones…</p>
        ) : (
          <>
            {hoy.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {hoy.length === 1 ? (
                  <BirthdayCard
                    person={hoy[0]}
                    isToday
                    isUpcoming={false}
                    upcomingPersons={proximos}
                  />
                ) : (
                  <BirthdayCarousel persons={hoy} autoplayInterval={5000} upcomingPersons={proximos} />
                )}
              </div>
            )}

            {hoy.length === 0 && proximos.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <BirthdayUpcomingAccordion persons={proximos} embedded />
              </div>
            )}

            {hoy.length === 0 && proximos.length === 0 && (
              <p className="gn-aside-empty">No hay cumpleaños próximos.</p>
            )}
          </>
        )}

      </section>

      <section className="gn-aside-section gn-aside-section--divider">
        <header className="gn-aside-head">
          <Award size={18} aria-hidden="true" />
          <h3>Aniversarios</h3>
        </header>
        {loading ? (
          <p className="gn-aside-empty">Cargando aniversarios…</p>
        ) : aniversarios.length === 0 ? (
          <p className="gn-aside-empty">Sin aniversarios laborales este mes.</p>
        ) : (
          <div className="gn-person-list">
            {aniversarios.slice(0, 4).map((person) => (
              <PersonRow
                key={String(person.id)}
                nombreCompleto={person.nombreCompleto}
                area={person.area}
                foto={person.foto}
                meta={`${person.anios} años · ${person.fecha}`}
              />
            ))}
          </div>
        )}
      </section>
    </aside>
  )
}
