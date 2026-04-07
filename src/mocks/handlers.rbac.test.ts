import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { resetDemoAuthSessions } from '@/mocks/data'
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
  resetDemoAuthSessions()
})

afterAll(() => {
  server.close()
})

describe('MSW RBAC authorization boundaries', () => {
  it('logs in through v1 auth and returns canonical access context', async () => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'technician@evzone.io',
        password: 'technician',
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      accessToken: 'demo-token-u6',
      refreshToken: 'demo-refresh-u6',
      user: {
        activeTenantId: 'org-evzone-ke',
        accessProfile: {
          canonicalRole: 'FIELD_TECHNICIAN',
          scope: {
            type: 'station',
          },
        },
        stationContexts: expect.arrayContaining([
          expect.objectContaining({ assignmentId: 'asg-u6-st-1', stationId: 'st-1' }),
          expect.objectContaining({ assignmentId: 'asg-u6-st-2', stationId: 'st-2' }),
        ]),
      },
    })
  })

  it('switches tenant context and reflects it in users/me', async () => {
    const switchResponse = await fetch('/api/v1/auth/switch-tenant', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer demo-token-u5',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: 'org-evzone-ke',
      }),
    })

    expect(switchResponse.status).toBe(200)
    expect(await switchResponse.json()).toMatchObject({
      user: {
        activeTenantId: 'org-evzone-ke',
      },
    })

    const currentUserResponse = await fetch('/api/v1/users/me', {
      headers: {
        Authorization: 'Bearer demo-token-u5',
      },
    })

    expect(currentUserResponse.status).toBe(200)
    expect(await currentUserResponse.json()).toMatchObject({
      activeTenantId: 'org-evzone-ke',
      accessProfile: {
        canonicalRole: 'PLATFORM_BILLING_ADMIN',
      },
    })
  })

  it('patches the current user profile and keeps users/me in sync', async () => {
    const patchResponse = await fetch('/api/v1/auth/me', {
      method: 'PATCH',
      headers: {
        ...authHeaders('demo-token-u5', 'tenant-global'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Olimi Brave',
        country: 'Uganda',
      }),
    })

    expect(patchResponse.status).toBe(200)
    expect(await patchResponse.json()).toMatchObject({
      name: 'Olimi Brave',
      country: 'Uganda',
    })

    const currentUserResponse = await fetch('/api/v1/users/me', {
      headers: authHeaders('demo-token-u5', 'tenant-global'),
    })

    expect(currentUserResponse.status).toBe(200)
    expect(await currentUserResponse.json()).toMatchObject({
      name: 'Olimi Brave',
      country: 'Uganda',
    })
  })

  it('switches station context and reflects it in users/me', async () => {
    const switchResponse = await fetch('/api/v1/users/me/station-context', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer demo-token-u6',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: 'asg-u6-st-2',
      }),
    })

    expect(switchResponse.status).toBe(200)
    expect(await switchResponse.json()).toMatchObject({
      activeStationContext: {
        assignmentId: 'asg-u6-st-2',
        stationId: 'st-2',
      },
    })

    const currentUserResponse = await fetch('/api/v1/users/me', {
      headers: {
        Authorization: 'Bearer demo-token-u6',
      },
    })

    expect(currentUserResponse.status).toBe(200)
    expect(await currentUserResponse.json()).toMatchObject({
      activeStationContext: {
        assignmentId: 'asg-u6-st-2',
        stationId: 'st-2',
      },
      accessProfile: {
        scope: {
          stationId: 'st-2',
        },
      },
    })
  })

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

  it('approves a rebalancing recommendation and persists dispatch status progression', async () => {
    const recommendationsResponse = await fetch('/api/swapping/rebalancing', {
      headers: authHeaders('demo-token-u2', 'tenant-evzone-ke'),
    })

    expect(recommendationsResponse.status).toBe(200)
    const recommendationsPayload = await recommendationsResponse.json() as {
      recommendations: Array<{ id: string; status: string }>
    }
    expect(recommendationsPayload.recommendations.length).toBeGreaterThan(0)

    const recommendationId = recommendationsPayload.recommendations[0].id

    const approveResponse = await fetch(`/api/swapping/rebalancing/${recommendationId}/action`, {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u2', 'tenant-evzone-ke'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'Approve',
        note: 'Route approved for next shift.',
      }),
    })

    expect(approveResponse.status).toBe(200)
    expect(await approveResponse.json()).toMatchObject({
      message: expect.stringContaining('Dispatch approved'),
      dispatch: {
        recommendationId,
        status: 'Approved',
      },
    })

    const inTransitResponse = await fetch(`/api/swapping/rebalancing/${recommendationId}/action`, {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u2', 'tenant-evzone-ke'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'MarkInTransit',
      }),
    })

    expect(inTransitResponse.status).toBe(200)
    expect(await inTransitResponse.json()).toMatchObject({
      dispatch: {
        recommendationId,
        status: 'In Transit',
      },
    })

    const finalReadResponse = await fetch('/api/swapping/rebalancing', {
      headers: authHeaders('demo-token-u2', 'tenant-evzone-ke'),
    })

    expect(finalReadResponse.status).toBe(200)
    const finalRead = await finalReadResponse.json() as {
      dispatches: Array<{
        recommendationId: string
        status: string
        history: Array<{ status: string }>
      }>
      recommendations: Array<{ id: string; status: string }>
    }

    expect(finalRead.recommendations.find((item) => item.id === recommendationId)).toMatchObject({
      status: 'In Transit',
    })
    expect(finalRead.dispatches.find((item) => item.recommendationId === recommendationId)).toMatchObject({
      status: 'In Transit',
      history: expect.arrayContaining([
        expect.objectContaining({ status: 'Proposed' }),
        expect.objectContaining({ status: 'Approved' }),
        expect.objectContaining({ status: 'In Transit' }),
      ]),
    })
  })

  it('returns 403 when finance role tries rebalancing dispatch actions', async () => {
    const response = await fetch('/api/swapping/rebalancing/RB-swap-st-2-swap-st-3/action', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u5', 'tenant-global'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'Approve',
      }),
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ message: 'Forbidden.', role: 'FINANCE' })
  })

  it('approves pack retirement and records the action in station detail timeline', async () => {
    const retireResponse = await fetch('/api/swapping/packs/PK-WL-014/retirement', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u3', 'tenant-westlands-mall'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ApproveRetirement',
        note: 'Capacity dropped below safety floor.',
      }),
    })

    expect(retireResponse.status).toBe(200)
    expect(await retireResponse.json()).toMatchObject({
      message: 'Pack PK-WL-014 retired successfully.',
      pack: {
        id: 'PK-WL-014',
        status: 'Retired',
        retirementDecision: {
          action: 'Approved',
        },
      },
    })

    const stationResponse = await fetch('/api/swapping/stations/swap-st-1', {
      headers: authHeaders('demo-token-u3', 'tenant-westlands-mall'),
    })

    expect(stationResponse.status).toBe(200)
    const station = await stationResponse.json() as {
      packs: Array<{
        id: string
        status: string
        timeline?: Array<{ type: string }>
      }>
    }
    expect(station.packs.find((pack) => pack.id === 'PK-WL-014')).toMatchObject({
      status: 'Retired',
      timeline: expect.arrayContaining([
        expect.objectContaining({ type: 'Retirement' }),
      ]),
    })
  })

  it('returns 403 when finance role tries swap retirement action', async () => {
    const response = await fetch('/api/swapping/packs/PK-WL-014/retirement', {
      method: 'POST',
      headers: {
        ...authHeaders('demo-token-u5', 'tenant-global'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ApproveRetirement',
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
        ocppId: 'EVZ-WL-900',
        ocppVersion: '2.0.1',
        power: 62,
        type: 'DC Fast',
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
        ocppId: 'EVZ-WL-333',
        ocppVersion: '1.6',
        power: 22,
        type: 'AC Type 2',
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
