import { apiClient } from './apiClient'

export type SectorDTO = {
  id: number
  nombre: string
  activo?: boolean
  created_at?: string
}

export const sectoresService = {
  // Obtiene los datos necesarios.
  getAll: (includeInactive = false) =>
    apiClient.get<{ data: SectorDTO[] }>(`/sectores${includeInactive ? '?includeInactive=true' : ''}`),

  // Crea el registro o elemento correspondiente.
  create: (nombre: string) =>
    apiClient.post<{ data: SectorDTO }>('/sectores', { nombre }),

  // Actualiza los datos correspondientes.
  update: (id: number, payload: Partial<{ nombre: string; activo: boolean }>) =>
    apiClient.put<{ data: SectorDTO }>(`/sectores/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/sectores/${id}`),
}
