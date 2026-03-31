import { useAuthStore } from '@/core/auth/authStore'

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

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const { activeTenantId, token } = useAuthStore.getState()
  const headers = new Headers(init?.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (activeTenantId && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', activeTenantId)
  }

  const response = await fetch(resolveRequestUrl(input), {
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
