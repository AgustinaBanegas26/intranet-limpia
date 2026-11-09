// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: novedades y publicaciones.
import { apiClient } from './apiClient'

export type EncuestaOpcionDTO = {
  id: string
  texto: string
  votos: number
}

export type EncuestaDTO = {
  pregunta: string
  opciones: EncuestaOpcionDTO[]
  totalVotos?: number
  miVoto?: string | null
}

export type ArchivoAdjuntoDTO = {
  url: string
  nombre: string
  tipo: string
}

export type NovedadDTO = {
  id?: string | number
  titulo: string
  contenido: string
  autor?: string
  autorFoto?: string | null
  autorSucursal?: string | null
  autorSector?: string | null
  publicadoPor?: string | number
  importante?: boolean
  fecha?: string
  likes?: number
  liked?: boolean
  imagenes?: string[]
  archivo?: ArchivoAdjuntoDTO | null
  encuesta?: EncuestaDTO | null
  destacadoAdminHasta?: string | null
  sucursalesDestino?: string[] | null
}

export type CreateNovedadPayload = {
  titulo: string
  contenido: string
  importante?: boolean
  imagen_url?: string | null
  archivo_url?: string | null
  archivo_nombre?: string | null
  archivo_tipo?: string | null
  destacado_admin_dias?: number
  encuesta?: {
    pregunta: string
    opciones: string[]
  } | null
  sucursales_destino?: string[]
}

export type UpdateNovedadPayload = {
  titulo?: string
  contenido?: string
  importante?: boolean
  imagen_url?: string | null
  sucursales_destino?: string[]
}

export const newsService = {
  // Obtiene los datos necesarios.
  getAll: (token?: string | null) =>
    apiClient.get<{ data: NovedadDTO[] }>('/novedades', token),

  // Obtiene los datos necesarios.
  getMine: (token?: string | null) =>
    apiClient.get<{ data: NovedadDTO[] }>('/novedades/mias', token),

  // Crea el registro o elemento correspondiente.
  create: (payload: CreateNovedadPayload, token?: string | null) =>
    apiClient.post<{ data: NovedadDTO }>('/novedades', payload, token),

  // Actualiza los datos correspondientes.
  update: (id: string | number, payload: UpdateNovedadPayload, token?: string | null) =>
    apiClient.put<NovedadDTO>(`/novedades/${id}`, payload, token),

  // Elimina el elemento indicado.
  remove: (id: string | number, token?: string | null) =>
    apiClient.delete<{ success: boolean }>(`/novedades/${id}`, token),

  // Gestiona la operacion like.
  like: (id: string | number, token?: string | null) =>
    apiClient.post<{ likes: number; liked: boolean }>(`/novedades/${id}/like`, {}, token),

  // Gestiona la operacion votePoll.
  votePoll: (id: string | number, opcionId: string, token?: string | null) =>
    apiClient.post<{ encuesta: EncuestaDTO }>(`/novedades/${id}/encuesta/vote`, { opcionId }, token),
}
