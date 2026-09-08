import { getBackendUrl, getSession } from './auth'
import { isSessionAuthError } from '../utils/sessionToken'

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const session = getSession()
  const authToken = token ?? session?.token ?? null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${getBackendUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let code = 'request_failed'
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) code = data.error
    } catch {
      // ignore parse errors
    }
    if (code === 'password_change_required') {
      window.dispatchEvent(new CustomEvent('gn:password-change-required'))
    }
    if (isSessionAuthError(code)) {
      window.dispatchEvent(new CustomEvent('gn:session-invalid', { detail: { error: code } }))
    }
    throw new Error(code)
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body, token }),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE', token }),
}
