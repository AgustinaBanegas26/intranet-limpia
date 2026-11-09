// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: administración de empleados.
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
  // Obtiene los datos necesarios.
  getAll: (token?: string | null, includeInactive = false) =>
    apiClient.get<{ data: EmpleadoDTO[] }>(`/empleados${includeInactive ? '?includeInactive=true' : ''}`, token),

  // Obtiene los datos necesarios.
  getPersonalProfile: (id: string | number, token?: string | null) =>
    apiClient.get<{ data: ProfileData }>(`/empleados/${id}/perfil`, token),

  // Crea el registro o elemento correspondiente.
  create: (payload: Omit<EmpleadoDTO, 'id'>, token?: string | null) =>
    apiClient.post<{ data: EmpleadoDTO }>('/empleados', payload, token),

  // Actualiza los datos correspondientes.
  update: (id: string | number, payload: Partial<EmpleadoDTO>, token?: string | null) =>
    apiClient.put<{ data: EmpleadoDTO }>(`/empleados/${id}`, payload, token),

  // Elimina el elemento indicado.
  remove: (id: string | number, token?: string | null) =>
    apiClient.delete<{ success: boolean }>(`/empleados/${id}`, token),
}
