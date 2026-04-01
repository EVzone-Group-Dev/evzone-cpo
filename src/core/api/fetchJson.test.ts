import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

describe('fetchJson', () => {
  const mockedGetState = vi.mocked(useAuthStore.getState)
  const env = import.meta.env as Record<string, string | undefined>
  const originalApiBaseUrl = env.VITE_API_BASE_URL
  const authState: {
    activeTenantId: string | null
    token: string | null
    refreshToken: string | null
    setTokens: ReturnType<typeof vi.fn<(token: string, refreshToken?: string | null) => void>>
    logout: ReturnType<typeof vi.fn>
  } = {
    activeTenantId: 'tenant-evzone-ke',
    token: 'demo-token',
    refreshToken: 'demo-refresh-token',
    setTokens: vi.fn<(token: string, refreshToken?: string | null) => void>(),
    logout: vi.fn(),
  }

  beforeEach(() => {
    env.VITE_API_BASE_URL = ''
    authState.activeTenantId = 'tenant-evzone-ke'
    authState.token = 'demo-token'
    authState.refreshToken = 'demo-refresh-token'
    authState.setTokens.mockReset()
    authState.logout.mockReset()

    authState.setTokens.mockImplementation((token, refreshToken) => {
      authState.token = token
      if (refreshToken !== undefined) {
        authState.refreshToken = refreshToken
      }
    })

    mockedGetState.mockImplementation(
      () => authState as unknown as ReturnType<typeof useAuthStore.getState>,
    )
  })

  afterEach(() => {
    env.VITE_API_BASE_URL = originalApiBaseUrl
    vi.restoreAllMocks()
  })

  it('injects auth and tenant headers when fetching JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await fetchJson<{ ok: boolean }>('/api/example')

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer demo-token')
    expect(headers.get('x-tenant-id')).toBe('tenant-evzone-ke')
    expect(init?.credentials).toBe('include')
  })

  it('surfaces API error messages when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Billing service unavailable.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(fetchJson('/api/example')).rejects.toThrow('Billing service unavailable.')
  })

  it('prefixes relative paths with VITE_API_BASE_URL when configured', async () => {
    env.VITE_API_BASE_URL = 'http://localhost:3000'

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await fetchJson('/api/example')

    const [requestUrl] = fetchMock.mock.calls[0]
    expect(requestUrl).toBe('http://localhost:3000/api/example')
  })

  it('normalizes malformed VITE_API_BASE_URL values', async () => {
    env.VITE_API_BASE_URL = 'http://localhost::3000'

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await fetchJson('/api/example')

    const [requestUrl] = fetchMock.mock.calls[0]
    expect(requestUrl).toBe('http://localhost:3000/api/example')
  })

  it('refreshes token on 401 and retries request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid or expired token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const result = await fetchJson<{ ok: boolean }>('/api/protected')
    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    const [firstUrl, firstInit] = fetchMock.mock.calls[0]
    expect(firstUrl).toBe('/api/protected')
    expect(new Headers(firstInit?.headers).get('Authorization')).toBe('Bearer demo-token')

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1]
    expect(refreshUrl).toBe('/api/v1/auth/refresh')
    expect(refreshInit?.method).toBe('POST')

    const [retryUrl, retryInit] = fetchMock.mock.calls[2]
    expect(retryUrl).toBe('/api/protected')
    expect(new Headers(retryInit?.headers).get('Authorization')).toBe('Bearer new-access-token')
    expect(authState.setTokens).toHaveBeenCalledWith('new-access-token', 'new-refresh-token')
    expect(authState.logout).not.toHaveBeenCalled()
  })

  it('logs out and throws session-expired error when refresh fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Refresh token revoked' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    await expect(fetchJson('/api/protected')).rejects.toThrow('Session expired. Please sign in again.')
    expect(authState.logout).toHaveBeenCalledTimes(1)
  })
})
