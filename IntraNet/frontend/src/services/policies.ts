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
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: PoliticaDTO[] }>('/politicas'),

  // Crea el registro o elemento correspondiente.
  create: (payload: {
    titulo: string
    categoria?: string
    archivo_url?: string
    version?: string
    obligatoria?: boolean
  }) => apiClient.post<{ data: PoliticaDTO }>('/politicas', payload),

  // Actualiza los datos correspondientes.
  update: (id: number | string, payload: Partial<PoliticaDTO>) =>
    apiClient.put<{ data: PoliticaDTO }>(`/politicas/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/politicas/${id}`),

  // Gestiona la operacion markRead.
  markRead: (id: number | string) =>
    apiClient.post<{ success: boolean }>(`/politicas/${id}/leer`, {}),
}
