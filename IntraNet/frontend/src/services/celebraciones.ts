// Servicio del frontend: encapsula las llamadas HTTP y transforma respuestas para que las pantallas no dependan del detalle de transporte. Tema específico: celebraciones.
import { apiClient } from './apiClient'

export type CelebracionPersona = {
  id: string | number
  nombre: string
  apellido: string
  nombreCompleto: string
  area: string | null
  sucursal: string | null
  foto: string | null
  fecha: string
  esHoy?: boolean
  diasRestantes?: number
}

export type AniversarioPersona = {
  id: string | number
  nombre: string
  apellido: string
  nombreCompleto: string
  area: string | null
  sucursal: string | null
  foto: string | null
  anios: number
  fecha: string
}

export type CelebracionesDTO = {
  cumpleanosHoy: CelebracionPersona[]
  proximosCumpleanos: CelebracionPersona[]
  aniversariosMes: AniversarioPersona[]
  aniversariosHoy: AniversarioPersona[]
}

export const celebracionesService = {
  // Obtiene los datos necesarios.
  getAll: (token?: string | null, days = 14) =>
    apiClient.get<{ data: CelebracionesDTO }>(`/birthdays?days=${days}`, token),
}
