import { apiClient } from './apiClient'

export type SliderSlideDTO = {
  id: string
  titulo: string
  subtitulo?: string | null
  imagen_url: string
  enlace?: string | null
  orden?: number
  activo?: boolean
  mostrar_titulo?: boolean
  created_at?: string
  updated_at?: string | null
}

export type SliderSlidePayload = {
  titulo?: string
  subtitulo?: string
  imagen_url: string
  enlace?: string
  orden?: number
  activo?: boolean
  mostrar_titulo?: boolean
}

export const sliderService = {
  // Obtiene los datos necesarios.
  getAll: () => apiClient.get<{ data: SliderSlideDTO[] }>('/slider'),

  // Crea el registro o elemento correspondiente.
  create: (payload: SliderSlidePayload) =>
    apiClient.post<{ data: SliderSlideDTO }>('/slider', payload),

  // Actualiza los datos correspondientes.
  update: (id: string, payload: Partial<SliderSlidePayload>) =>
    apiClient.put<{ data: SliderSlideDTO }>(`/slider/${id}`, payload),

  // Elimina el elemento indicado.
  remove: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/slider/${id}`),
}
