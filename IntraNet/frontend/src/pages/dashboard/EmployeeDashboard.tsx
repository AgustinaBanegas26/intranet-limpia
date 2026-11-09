// Pantalla del frontend: combina componentes React, estado y servicios para presentar este módulo al usuario. Tema específico: panel principal según el rol.
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getProfile, type Profile } from '../../services/api'
import { celebracionesService, type CelebracionesDTO } from '../../services/celebraciones'
import { getFirstName } from '../../utils/greeting'
import { AnniversariesHomeSection } from '../../components/home/AnniversariesHomeSection'
import { AbsencesHomeSection } from '../../components/home/AbsencesHomeSection'
import { DashboardBirthdayHero } from '../../components/home/DashboardBirthdayHero'
import { MainSlider } from '../../components/home/MainSlider'
import { NewsFeed } from '../../components/home/NewsFeed'

// Gestiona la operacion EmployeeDashboard.
export function EmployeeDashboard() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [celebraciones, setCelebraciones] = useState<CelebracionesDTO | null>(null)

  useEffect(() => {
    let active = true
    getProfile(token)
      .then((data) => { if (active) setProfile(data) })
      .catch(() => { if (active) setProfile(null) })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    let active = true
    celebracionesService
      .getAll(token, 31)
      .then((res) => { if (active) setCelebraciones(res.data) })
      .catch(() => { if (active) setCelebraciones(null) })
    return () => { active = false }
  }, [token])

  const displayName = profile?.nombreCompleto || user.name
  const firstName = getFirstName(displayName)
  const sector = profile?.sector || 'Sector no informado'
  const sucursal = profile?.sucursal || 'Sucursal no informada'
  const anniversaries = celebraciones?.aniversariosHoy || []

  return (
    <div className="dashboard-root employee-home">
      <MainSlider />

      <DashboardBirthdayHero
        token={token}
        selfProfile={{
          id: profile?.id,
          fechaNac: profile?.fechaNac,
          nombreCompleto: displayName,
          firstName,
          sector,
          sucursal,
          foto: profile?.foto,
        }}
      />

      <AnniversariesHomeSection people={anniversaries} />

      <AbsencesHomeSection />

      <NewsFeed token={token} showHeading={false} showModuleHeader maxPosts={3} />
    </div>
  )
}
