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
  getAll: () => apiClient.get<{ data: BeneficioDTO[] }>('/beneficios'),

  create: (payload: { nombre: string; descripcion?: string; imagen_url?: string; enlace_url?: string }) =>
    apiClient.post<{ data: BeneficioDTO }>('/beneficios', payload),

  update: (id: number | string, payload: Partial<BeneficioDTO>) =>
    apiClient.put<{ data: BeneficioDTO }>(`/beneficios/${id}`, payload),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/beneficios/${id}`),
}
