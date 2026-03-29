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
  it('records failed inspection and moves pack to quarantined status', async () => {
    const inspectResponse = await fetch('/api/swapping/packs/PK-WL-001/inspection', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u3', 'tenant-westlands-mall'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        result: 'Failed',
        note: 'Thermal anomaly detected.',
      }),
    })

    expect(inspectResponse.status).toBe(200)
    expect(await inspectResponse.json()).toMatchObject({
      message: 'Inspection failed. Pack PK-WL-001 moved to Quarantined.',
      pack: {
        id: 'PK-WL-001',
        status: 'Quarantined',
        inspectionStatus: 'Failed',
      },
    })

    const inventoryResponse = await fetch('/api/swapping/inventory', {
      headers: authHeaders('demo-token-u3', 'tenant-westlands-mall'),
    })

    expect(inventoryResponse.status).toBe(200)
    const inventory = await inventoryResponse.json() as { packs: Array<{ id: string; status: string; inspectionStatus?: string }> }
    expect(inventory.packs.find((pack) => pack.id === 'PK-WL-001')).toMatchObject({
      status: 'Quarantined',
      inspectionStatus: 'Failed',
    })
  })

  it('returns 403 when finance role tries swap lifecycle transition', async () => {
    const response = await fetch('/api/swapping/packs/PK-WL-007/transition', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u5', 'tenant-global'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toStatus: 'Quarantined',
        note: 'Manual hold.',
      }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'FINANCE' })
  })

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
