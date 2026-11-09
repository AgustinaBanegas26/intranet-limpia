// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: sugerencias de empleados.
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
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: SugerenciaDTO[] }>('/sugerencias'),

  // Crea el registro o elemento correspondiente.
  create: (payload: { descripcion: string; categoria?: string; titulo?: string }) =>
    apiClient.post<{ data: SugerenciaDTO }>('/sugerencias', payload),

  // Gestiona la operacion vote.
  vote: (id: string | number) =>
    apiClient.post<{ data: { votos: number; votado: boolean } }>(`/sugerencias/${id}/vote`, {}),

  // Actualiza los datos correspondientes.
  updateStatus: (id: string | number, estado: SugerenciaDTO['estado']) =>
    apiClient.put<{ data: SugerenciaDTO }>(`/sugerencias/${id}/status`, { estado }),

  // Elimina el elemento indicado.
  remove: (id: string | number) =>
    apiClient.delete<{ success: boolean }>(`/sugerencias/${id}`),
}
