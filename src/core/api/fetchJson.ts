import { useAuthStore } from '@/core/auth/authStore'

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const { activeTenantId, token } = useAuthStore.getState()
  const headers = new Headers(init?.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (activeTenantId && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', activeTenantId)
  }

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = await response.json() as { message?: string }
      if (payload.message) {
        message = payload.message
      }
    } catch {
      // Ignore JSON parsing failures and fall back to the default message.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}
