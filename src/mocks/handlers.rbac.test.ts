import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

const server = setupServer(...handlers)

function authHeaders(token: string, tenantId: string) {
  return {
    Authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('MSW RBAC authorization boundaries', () => {
  it('returns 403 when operator role calls finance billing endpoint', async () => {
    const response = await fetch('/api/finance/billing', {
      headers: authHeaders('demo-token-u3', 'tenant-westlands-mall'),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'OPERATOR' })
  })

  it('returns 403 when finance role calls operations incident endpoint', async () => {
    const response = await fetch('/api/incidents', {
      headers: authHeaders('demo-token-u5', 'tenant-global'),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'FINANCE' })
  })

  it('returns 403 when operator role calls platform admin integrations endpoint', async () => {
    const response = await fetch('/api/platform/integrations', {
      headers: authHeaders('demo-token-u3', 'tenant-westlands-mall'),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'OPERATOR' })
  })
})
