import { apiClient } from './apiClient'

export type SugerenciaDTO = {
  id?: string | number
  titulo: string
  descripcion: string
  categoria?: string
  estado?: 'review' | 'approved' | 'implemented' | 'rejected'
  votos?: number
  votado?: boolean
  autor?: string
  fecha?: string
}

export const suggestionsService = {
  getAll: () => apiClient.get<{ data: SugerenciaDTO[] }>('/sugerencias'),

  create: (payload: { descripcion: string; categoria?: string; titulo?: string }) =>
    apiClient.post<{ data: SugerenciaDTO }>('/sugerencias', payload),

  vote: (id: string | number) =>
    apiClient.post<{ data: { votos: number; votado: boolean } }>(`/sugerencias/${id}/vote`, {}),

  updateStatus: (id: string | number, estado: SugerenciaDTO['estado']) =>
    apiClient.put<{ data: SugerenciaDTO }>(`/sugerencias/${id}/status`, { estado }),

  remove: (id: string | number) =>
    apiClient.delete<{ success: boolean }>(`/sugerencias/${id}`),
}
