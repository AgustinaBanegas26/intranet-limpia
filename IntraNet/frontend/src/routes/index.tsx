import { Routes, Route, Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { canListEmployees, isAdminUser, useAuth } from '../context/AuthContext'

import { AdminDashboard } from '../pages/dashboard/AdminDashboard'
import { EmployeeDashboard } from '../pages/dashboard/EmployeeDashboard'
import { NewsPage } from '../pages/news/NewsPage'
import { EventsPage } from '../pages/events/EventsPage'
import { BenefitsPage } from '../pages/benefits/BenefitsPage'
import { AbsencesPage } from '../pages/absences/AbsencesPage'
import { PoliciesPage } from '../pages/policies/PoliciesPage'
import { SuggestionsPage } from '../pages/suggestions/SuggestionsPage'
import { EmployeesPage } from '../pages/employees/EmployeesPage'
import { RequestsManagementPage } from '../pages/requests/RequestsManagementPage'
import { NewRequestPage } from '../pages/requests/NewRequestPage'
import { ViaticosPage } from '../pages/requests/ViaticosPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { VacationsPage } from '../pages/vacations/VacationsPage'
import { OnBalancePage } from '../pages/on-balance/OnBalancePage'
import { ManualsPage } from '../pages/manuals/ManualsPage'
import { AdelantosPage } from '../pages/adelantos/AdelantosPage'
import { TechnicalSuppliesPage } from '../pages/technical-supplies/TechnicalSuppliesPage'
import { CalendarPage } from '../pages/calendar/CalendarPage'

// Gestiona la operacion DashboardRoute.
function DashboardRoute() {
  const { user } = useAuth()
  return isAdminUser(user) ? <AdminDashboard /> : <EmployeeDashboard />
}

// Gestiona la operacion AdminOnly.
function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!isAdminUser(user)) return <Navigate to="/" replace />
  return <>{children}</>
}

// Gestiona la operacion StaffOnly.
function StaffOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!canListEmployees(user)) return <Navigate to="/" replace />
  return <>{children}</>
}


// Gestiona la operacion EmployeeOnly.
function EmployeeOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (isAdminUser(user)) return <Navigate to="/" replace />
  return <>{children}</>
}

// Gestiona la operacion AuthenticatedRoutes.
export function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardRoute />} />

        <Route path="novedades" element={<NewsPage />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="beneficios" element={<BenefitsPage />} />
        <Route path="ausencias" element={<AbsencesPage />} />
        <Route path="politicas" element={<PoliciesPage />} />
        <Route path="sugerencias" element={<SuggestionsPage />} />
        <Route path="manuales" element={<ManualsPage />} />

        <Route path="empleados" element={<StaffOnly><EmployeesPage /></StaffOnly>} />
        <Route path="solicitudes" element={<AdminOnly><RequestsManagementPage /></AdminOnly>} />
        <Route path="calendario" element={<AdminOnly><CalendarPage /></AdminOnly>} />
        <Route path="solicitudes/viaticos" element={<AdminOnly><Navigate to="/solicitudes" replace /></AdminOnly>} />
        <Route path="solicitudes/adelantos" element={<AdminOnly><Navigate to="/solicitudes" replace /></AdminOnly>} />

        <Route path="perfil" element={<ProfilePage />} />
        <Route path="vacaciones" element={<EmployeeOnly><VacationsPage /></EmployeeOnly>} />
        <Route path="adelantos" element={<AdelantosPage />} />
        <Route path="insumos-tecnicos" element={<TechnicalSuppliesPage />} />
        <Route path="solicitar" element={<EmployeeOnly><NewRequestPage /></EmployeeOnly>} />
        <Route path="reservas" element={<EmployeeOnly><NewRequestPage /></EmployeeOnly>} />
        <Route path="viaticos" element={<EmployeeOnly><ViaticosPage /></EmployeeOnly>} />
        <Route path="on-balanceada" element={<EmployeeOnly><OnBalancePage /></EmployeeOnly>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
