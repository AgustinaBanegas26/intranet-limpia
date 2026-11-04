import { apiClient } from './apiClient'
import type { AusenciaDTO } from './absences'

export type VacacionesSaldo = {
  empleado_id: number
  anio: number
  dias_asignados: number
  dias_usados: number
  dias_disponibles: number
}

export const vacationsService = {
  // Obtiene los datos necesarios.
  getSaldo: () => apiClient.get<{ data: VacacionesSaldo }>('/vacaciones/saldo'),

  // Obtiene los datos necesarios.
  getSolicitudes: () => apiClient.get<{ data: AusenciaDTO[] }>('/vacaciones'),

  // Crea el registro o elemento correspondiente.
  create: (payload: { fecha_desde: string; fecha_hasta: string; motivo?: string; comment?: string }) =>
    apiClient.post<{ data: AusenciaDTO }>('/vacaciones', payload),

  // Actualiza los datos correspondientes.
  update: (id: number | string, payload: { fecha_desde?: string; fecha_hasta?: string; motivo?: string; comment?: string }) =>
    apiClient.put<{ data: AusenciaDTO }>(`/vacaciones/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/vacaciones/${id}`),
}
