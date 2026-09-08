import { apiClient } from './apiClient'

export type MensajeDTO = {
  id: number
  remitente_id: number
  destinatario_id: number
  from: string
  to: string
  subject: string
  body: string
  date: string
  read: boolean
  folder: 'inbox' | 'sent'
}

export type ContactoDTO = {
  id: number
  nombre: string
  email?: string | null
  area?: string | null
  role?: string | null
}

export const messagesService = {
  getContactos: () => apiClient.get<{ data: ContactoDTO[] }>('/mensajes/contactos'),

  getAll: (carpeta: 'inbox' | 'sent' = 'inbox') =>
    apiClient.get<{ data: MensajeDTO[] }>(`/mensajes?carpeta=${carpeta}`),

  create: (payload: { destinatario_id: number; asunto?: string; cuerpo: string }) =>
    apiClient.post<{ data: MensajeDTO }>('/mensajes', payload),

  markRead: (id: number | string) =>
    apiClient.put<{ success: boolean }>(`/mensajes/${id}/leer`, {}),

  remove: (id: number | string) =>
    apiClient.delete<{ success: boolean }>(`/mensajes/${id}`),
}
