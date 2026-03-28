import { http, HttpResponse } from 'msw'
import {
  authenticateDemoUser,
  getBilling,
  getChargePointById,
  getDashboardOverview,
  getDemoUserHints,
  getIncidentCommand,
  getIntegrationsModule,
  getNotificationsModule,
  getOCPICommands,
  getOCPICdrs,
  getProtocolEngine,
  getReports,
  getRoamingSessions,
  getSettlement,
  getSiteOwnerDashboard,
  getSmartCharging,
  getSwapStationById,
  getBatteryInventory,
  getStationById,
  getWebhooksModule,
  listAlerts,
  listAuditLogs,
  listBatterySwapSessions,
  listChargePoints,
  listLoadPolicies,
  listPayouts,
  listRoamingPartners,
  listSessions,
  listSwapStations,
  listStations,
  listTariffs,
  listTeamMembers,
  resolveTenantContext,
} from './data'

type TenantId = Parameters<typeof getDashboardOverview>[0]

function getTenantId(request: Request) {
  const context = resolveTenantContext(
    request.headers.get('authorization'),
    request.headers.get('x-tenant-id'),
  )

  if (!context) {
    return null
  }

  return {
    context,
    tenantId: context.activeTenant.id as TenantId,
  }
}

function unauthorized() {
  return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
}

export const handlers = [
  http.get('/api/auth/demo-users', () => HttpResponse.json(getDemoUserHints())),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    const auth = authenticateDemoUser(email, password)

    if (!auth) {
      return HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 })
    }

    return HttpResponse.json(auth)
  }),

  http.get('/api/tenancy/context', ({ request }) => {
    const context = resolveTenantContext(
      request.headers.get('authorization'),
      request.headers.get('x-tenant-id'),
    )

    if (!context) {
      return unauthorized()
    }

    return HttpResponse.json(context)
  }),

  http.get('/api/dashboard/overview', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getDashboardOverview(access.tenantId))
  }),

  http.get('/api/dashboard/site-owner', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getSiteOwnerDashboard(access.tenantId))
  }),

  http.get('/api/stations', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listStations(access.tenantId))
  }),

  http.get('/api/stations/:id', ({ params, request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()

    const station = getStationById(String(params.id), access.tenantId)
    if (!station) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/swapping/stations', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listSwapStations(access.tenantId))
  }),

  http.get('/api/swapping/stations/:id', ({ params, request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()

    const station = getSwapStationById(String(params.id), access.tenantId)
    if (!station) return HttpResponse.json({ message: 'Swap station not found.' }, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/charge-points', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listChargePoints(access.tenantId))
  }),

  http.get('/api/charge-points/:id', ({ params, request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()

    const chargePoint = getChargePointById(String(params.id), access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    return HttpResponse.json(chargePoint)
  }),

  http.post('/api/charge-points/:id/commands', async ({ params, request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()

    const chargePoint = getChargePointById(String(params.id), access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })

    const { command } = await request.json() as { command: string }

    return HttpResponse.json({
      message: `${command} command accepted for ${chargePoint.ocppId} in ${access.context.activeTenant.name}.`,
      status: 'Accepted',
    })
  }),

  http.get('/api/sessions', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listSessions(access.tenantId))
  }),

  http.get('/api/swapping/sessions', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listBatterySwapSessions(access.tenantId))
  }),

  http.get('/api/swapping/inventory', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getBatteryInventory(access.tenantId))
  }),

  http.get('/api/incidents', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getIncidentCommand(access.tenantId))
  }),

  http.get('/api/alerts', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listAlerts(access.tenantId))
  }),

  http.get('/api/tariffs', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listTariffs(access.tenantId))
  }),

  http.get('/api/energy/smart-charging', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getSmartCharging(access.tenantId))
  }),

  http.get('/api/energy/load-policies', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listLoadPolicies(access.tenantId))
  }),

  http.get('/api/roaming/partners', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listRoamingPartners(access.tenantId))
  }),

  http.get('/api/roaming/sessions', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getRoamingSessions(access.tenantId))
  }),

  http.get('/api/roaming/cdrs', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getOCPICdrs(access.tenantId))
  }),

  http.get('/api/roaming/commands', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getOCPICommands(access.tenantId))
  }),

  http.get('/api/finance/billing', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getBilling(access.tenantId))
  }),

  http.get('/api/finance/payouts', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listPayouts(access.tenantId))
  }),

  http.get('/api/finance/settlement', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getSettlement(access.tenantId))
  }),

  http.get('/api/team', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listTeamMembers(access.tenantId))
  }),

  http.get('/api/audit-logs', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(listAuditLogs(access.tenantId))
  }),

  http.get('/api/reports', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getReports(access.tenantId))
  }),

  http.get('/api/protocols', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getProtocolEngine(access.tenantId))
  }),

  http.get('/api/platform/integrations', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getIntegrationsModule(access.tenantId))
  }),

  http.get('/api/platform/webhooks', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getWebhooksModule(access.tenantId))
  }),

  http.get('/api/platform/notifications', ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()
    return HttpResponse.json(getNotificationsModule(access.tenantId))
  }),

  http.post('/api/commands/start', async ({ request }) => {
    const access = getTenantId(request)
    if (!access) return unauthorized()

    const { chargePointId } = await request.json() as { chargePointId: string }

    return HttpResponse.json({
      status: 'Accepted',
      sessionId: `ses-${Math.random().toString(36).slice(2, 9)}`,
      tenant: access.context.activeTenant.name,
      chargePointId,
    })
  }),
]
