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
  it('creates a charge point and returns it in subsequent list reads', async () => {
    const createResponse = await fetch('/api/charge-points', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u4', 'tenant-evzone-ke'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stationId: 'st-1',
        model: 'ABB Terra 124',
        manufacturer: 'ABB',
        serialNumber: 'SN-9000',
        ocppId: 'EVZ-WL-900',
        ocppVersion: '2.0.1',
        maxCapacityKw: 62,
        connectorType: 'DC Fast',
      }),
    })

    expect(createResponse.status).toBe(201)
    const created = await createResponse.json()
    expect(created).toMatchObject({
      stationId: 'st-1',
      ocppId: 'EVZ-WL-900',
      status: 'Online',
      ocppStatus: 'Available',
      connectorType: 'DC Fast',
    })

    const listResponse = await fetch('/api/charge-points', {
      headers: authHeaders('demo-token-u4', 'tenant-evzone-ke'),
    })

    expect(listResponse.status).toBe(200)
    const listed = await listResponse.json() as Array<{ ocppId: string }>
    expect(listed.some((record) => record.ocppId === 'EVZ-WL-900')).toBe(true)
  })

  it('returns 403 when operator role tries to create charge points', async () => {
    const response = await fetch('/api/charge-points', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u3', 'tenant-westlands-mall'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stationId: 'st-1',
        model: 'Wallbox Pulsar',
        manufacturer: 'Wallbox',
        serialNumber: 'SN-3333',
        ocppId: 'EVZ-WL-333',
        ocppVersion: '1.6J',
        maxCapacityKw: 22,
        connectorType: 'AC Type 2',
      }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'OPERATOR' })
  })

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
