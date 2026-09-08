import { apiClient } from './apiClient'

import type { ProfileData } from './profile'

export type EmpleadoDTO = {
  id?: string | number
  legajo?: string | number
  nombre: string
  apellido: string
  email_corporativo: string
  cargo?: string | null
  area?: string | null
  sucursal?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  fecha_ingreso?: string | null
  foto_url?: string | null
  activo?: boolean
  es_director?: boolean
  work_mode?: string | null
}

export const employeesService = {
  getAll: (token?: string | null, includeInactive = false) =>
    apiClient.get<{ data: EmpleadoDTO[] }>(`/empleados${includeInactive ? '?includeInactive=true' : ''}`, token),

  getPersonalProfile: (id: string | number, token?: string | null) =>
    apiClient.get<{ data: ProfileData }>(`/empleados/${id}/perfil`, token),

  create: (payload: Omit<EmpleadoDTO, 'id'>, token?: string | null) =>
    apiClient.post<{ data: EmpleadoDTO }>('/empleados', payload, token),

  update: (id: string | number, payload: Partial<EmpleadoDTO>, token?: string | null) =>
    apiClient.put<{ data: EmpleadoDTO }>(`/empleados/${id}`, payload, token),

  remove: (id: string | number, token?: string | null) =>
    apiClient.delete<{ success: boolean }>(`/empleados/${id}`, token),
}
