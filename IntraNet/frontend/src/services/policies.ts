import { apiClient } from './apiClient'

export type PoliticaDTO = {
  id: number
  titulo: string
  categoria?: string | null
  archivo_url?: string | null
  version?: string | null
  activo?: boolean
  obligatoria?: boolean
  created_at?: string
  updated_at?: string
  leida?: boolean
}

export const policiesService = {
  getAll: () => apiClient.get<{ data: PoliticaDTO[] }>('/politicas'),

  create: (payload: {
    titulo: string
    categoria?: string
    archivo_url?: string
    version?: string
    obligatoria?: boolean
  }) => apiClient.post<{ data: PoliticaDTO }>('/politicas', payload),

  update: (id: number | string, payload: Partial<PoliticaDTO>) =>
    apiClient.put<{ data: PoliticaDTO }>(`/politicas/${id}`, payload),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/politicas/${id}`),

  markRead: (id: number | string) =>
    apiClient.post<{ success: boolean }>(`/politicas/${id}/leer`, {}),
}
