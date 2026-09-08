import { apiClient } from './apiClient'

export type SectorDTO = {
  id: number
  nombre: string
  activo?: boolean
  created_at?: string
}

export const sectoresService = {
  getAll: (includeInactive = false) =>
    apiClient.get<{ data: SectorDTO[] }>(`/sectores${includeInactive ? '?includeInactive=true' : ''}`),

  create: (nombre: string) =>
    apiClient.post<{ data: SectorDTO }>('/sectores', { nombre }),

  update: (id: number, payload: Partial<{ nombre: string; activo: boolean }>) =>
    apiClient.put<{ data: SectorDTO }>(`/sectores/${id}`, payload),

  remove: (id: number) =>
    apiClient.delete<{ success: boolean }>(`/sectores/${id}`),
}
