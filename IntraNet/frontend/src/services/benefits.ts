// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: beneficios para empleados.
import { apiClient } from './apiClient'

export type BeneficioDTO = {
  id: number
  nombre: string
  descripcion?: string | null
  imagen_url?: string | null
  enlace_url?: string | null
  activo?: boolean
  created_at?: string
}

export const benefitsService = {
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: BeneficioDTO[] }>('/beneficios'),

  // Crea el registro o elemento correspondiente.
  create: (payload: { nombre: string; descripcion?: string; imagen_url?: string; enlace_url?: string }) =>
    apiClient.post<{ data: BeneficioDTO }>('/beneficios', payload),

  // Actualiza los datos correspondientes.
  update: (id: number | string, payload: Partial<BeneficioDTO>) =>
    apiClient.put<{ data: BeneficioDTO }>(`/beneficios/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/beneficios/${id}`),
}
