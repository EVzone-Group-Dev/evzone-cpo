import { useAuthStore } from '@/core/auth/authStore'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'

type AuthSessionResponse = {
  accessToken?: string
  refreshToken?: string
  token?: string
  user?: AuthenticatedApiUser
}

let refreshTokenRequest: Promise<string | null> | null = null

function normalizeApiBaseUrl(rawValue: string | undefined): string | null {
  if (!rawValue) {
    return null
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  // Handle accidental `http://host::port` typo in env values.
  const corrected = trimmed.replace(/^(https?:\/\/[^/:/?#]+)::(\d+)/i, '$1:$2')

  try {
    const url = new URL(corrected)
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function resolveRequestUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) {
    return input
  }

  const apiBaseUrl = normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL as string | undefined,
  )

  if (!apiBaseUrl) {
    return input
  }

  if (input.startsWith('/')) {
    return `${apiBaseUrl}${input}`
  }

  return `${apiBaseUrl}/${input}`
}

function isAuthRoute(input: string): boolean {
  const normalized = input.toLowerCase()
  return normalized.includes('/api/v1/auth/login') || normalized.includes('/api/v1/auth/refresh')
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message ?? null
  } catch {
    return null
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, replaceUser, logout } = useAuthStore.getState()

  if (!refreshToken) {
    logout()
    return null
  }

  if (refreshTokenRequest) {
    return refreshTokenRequest
  }

  refreshTokenRequest = (async () => {
    try {
      const response = await fetch(resolveRequestUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        logout()
        return null
      }

      const payload = await response.json() as AuthSessionResponse
      const newAccessToken = payload.accessToken ?? payload.token
      if (!newAccessToken) {
        logout()
        return null
      }

      setTokens(newAccessToken, payload.refreshToken ?? refreshToken)
      if (payload.user) {
        replaceUser(payload.user)
      }
      return newAccessToken
    } catch {
      logout()
      return null
    } finally {
      refreshTokenRequest = null
    }
  })()

  return refreshTokenRequest
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const { activeTenantId, token } = useAuthStore.getState()
  const headers = new Headers(init?.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (activeTenantId && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', activeTenantId)
  }

  const requestUrl = resolveRequestUrl(input)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const baseRequest: RequestInit = {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  }

  let response = await fetch(requestUrl, baseRequest)

  if (response.status === 401 && !isAuthRoute(input) && token) {
    const refreshedToken = await refreshAccessToken()
    if (!refreshedToken) {
      throw new Error('Session expired. Please sign in again.')
    }

    const retryHeaders = new Headers(init?.headers)
    retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
    if (activeTenantId && !retryHeaders.has('x-tenant-id')) {
      retryHeaders.set('x-tenant-id', activeTenantId)
    }

    response = await fetch(requestUrl, {
      ...init,
      headers: retryHeaders,
      credentials: init?.credentials ?? 'include',
    })
  }

  if (!response.ok) {
    const message = (await readErrorMessage(response)) ?? `Request failed with status ${response.status}`

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
