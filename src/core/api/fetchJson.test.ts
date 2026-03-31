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

  beforeEach(() => {
    env.VITE_API_BASE_URL = ''
    mockedGetState.mockReturnValue({
      activeTenantId: 'tenant-evzone-ke',
      token: 'demo-token',
    } as ReturnType<typeof useAuthStore.getState>)
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
})
