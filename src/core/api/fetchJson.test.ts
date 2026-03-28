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

  beforeEach(() => {
    mockedGetState.mockReturnValue({
      activeTenantId: 'tenant-evzone-ke',
      token: 'demo-token',
    } as ReturnType<typeof useAuthStore.getState>)
  })

  afterEach(() => {
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
})
