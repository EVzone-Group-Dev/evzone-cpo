import {
  ACCESS_POLICY,
  canAccessRole,
} from '@/core/auth/access'
import type { CPORole } from '@/core/types/domain'
import { http, HttpResponse } from 'msw'
import {
  authenticateDemoUser,
  createChargePoint,
  getBatteryInventory,
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
  getStationById,
  getSwapStationById,
  getWebhooksModule,
  listAlerts,
  listAuditLogs,
  listBatterySwapSessions,
  listChargePoints,
  listLoadPolicies,
  listPayouts,
  listRoamingPartners,
  listSessions,
  listStations,
  listSwapStations,
  listTariffs,
  listTeamMembers,
  resolveTenantContext,
} from './data'

type TenantId = Parameters<typeof getDashboardOverview>[0]
type ResolvedTenantContext = NonNullable<ReturnType<typeof resolveTenantContext>>

interface RequestAccess {
  context: ResolvedTenantContext
  tenantId: TenantId
  role: CPORole
}

type AccessResult =
  | { ok: true; access: RequestAccess }
  | { ok: false; response: Response }

const DEMO_TOKEN_PREFIX = 'demo-token-'

function getTokenValue(authorizationHeader: string | null) {
  if (!authorizationHeader) return null
  return authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : authorizationHeader
}

function getRoleFromAuthorization(authorizationHeader: string | null): CPORole | null {
  const token = getTokenValue(authorizationHeader)
  if (!token || !token.startsWith(DEMO_TOKEN_PREFIX)) {
    return null
  }

  const userId = token.slice(DEMO_TOKEN_PREFIX.length)
  const demoUser = getDemoUserHints().find((user) => user.id === userId)
  return demoUser?.role ?? null
}

function getRequestAccess(request: Request): RequestAccess | null {
  const authorization = request.headers.get('authorization')
  const context = resolveTenantContext(
    authorization,
    request.headers.get('x-tenant-id'),
  )
  const role = getRoleFromAuthorization(authorization)

  if (!context || !role) {
    return null
  }

  return {
    context,
    tenantId: context.activeTenant.id as TenantId,
    role,
  }
}

function unauthorized() {
  return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
}

function forbidden(role: CPORole, allowedRoles: readonly CPORole[]) {
  return HttpResponse.json(
    {
      message: 'Forbidden.',
      role,
      allowedRoles,
    },
    { status: 403 },
  )
}

function authorize(request: Request, allowedRoles: readonly CPORole[]): AccessResult {
  const access = getRequestAccess(request)
  if (!access) {
    return { ok: false, response: unauthorized() }
  }

  if (!canAccessRole(access.role, allowedRoles)) {
    return { ok: false, response: forbidden(access.role, allowedRoles) }
  }

  return { ok: true, access }
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
    const result = authorize(request, ACCESS_POLICY.tenancyContext)
    if (!result.ok) return result.response
    return HttpResponse.json(result.access.context)
  }),

  http.get('/api/dashboard/overview', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.dashboardHome)
    if (!result.ok) return result.response
    return HttpResponse.json(getDashboardOverview(result.access.tenantId))
  }),

  http.get('/api/dashboard/site-owner', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.siteDashboard)
    if (!result.ok) return result.response
    return HttpResponse.json(getSiteOwnerDashboard(result.access.tenantId))
  }),

  http.get('/api/stations', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.stationsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listStations(result.access.tenantId))
  }),

  http.get('/api/stations/:id', ({ params, request }) => {
    const result = authorize(request, ACCESS_POLICY.stationsRead)
    if (!result.ok) return result.response

    const station = getStationById(String(params.id), result.access.tenantId)
    if (!station) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/swapping/stations', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.swapStationsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listSwapStations(result.access.tenantId))
  }),

  http.get('/api/swapping/stations/:id', ({ params, request }) => {
    const result = authorize(request, ACCESS_POLICY.swapStationsRead)
    if (!result.ok) return result.response

    const station = getSwapStationById(String(params.id), result.access.tenantId)
    if (!station) return HttpResponse.json({ message: 'Swap station not found.' }, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/charge-points', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.chargePointsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listChargePoints(result.access.tenantId))
  }),

  http.get('/api/charge-points/:id', ({ params, request }) => {
    const result = authorize(request, ACCESS_POLICY.chargePointsRead)
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    return HttpResponse.json(chargePoint)
  }),

  http.post('/api/charge-points', async ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.chargePointsWrite)
    if (!result.ok) return result.response

    const payload = await request.json() as Parameters<typeof createChargePoint>[0]
    const chargePoint = createChargePoint(payload, result.access.tenantId)

    if (!chargePoint) {
      return HttpResponse.json({ message: 'Station not found for active tenant.' }, { status: 400 })
    }

    return HttpResponse.json(chargePoint, { status: 201 })
  }),

  http.post('/api/charge-points/:id/commands', async ({ params, request }) => {
    const result = authorize(request, ACCESS_POLICY.chargePointCommands)
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })

    const { command } = await request.json() as { command: string }

    return HttpResponse.json({
      message: `${command} command accepted for ${chargePoint.ocppId} in ${result.access.context.activeTenant.name}.`,
      status: 'Accepted',
    })
  }),

  http.get('/api/sessions', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.sessionsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listSessions(result.access.tenantId))
  }),

  http.get('/api/swapping/sessions', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.swapSessionsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listBatterySwapSessions(result.access.tenantId))
  }),

  http.get('/api/swapping/inventory', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.batteryInventoryRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getBatteryInventory(result.access.tenantId))
  }),

  http.get('/api/incidents', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.incidentsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getIncidentCommand(result.access.tenantId))
  }),

  http.get('/api/alerts', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.alertsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listAlerts(result.access.tenantId))
  }),

  http.get('/api/tariffs', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.tariffsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listTariffs(result.access.tenantId))
  }),

  http.get('/api/energy/smart-charging', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.smartChargingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getSmartCharging(result.access.tenantId))
  }),

  http.get('/api/energy/load-policies', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.loadPoliciesRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listLoadPolicies(result.access.tenantId))
  }),

  http.get('/api/roaming/partners', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.roamingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listRoamingPartners(result.access.tenantId))
  }),

  http.get('/api/roaming/sessions', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.roamingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getRoamingSessions(result.access.tenantId))
  }),

  http.get('/api/roaming/cdrs', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.roamingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getOCPICdrs(result.access.tenantId))
  }),

  http.get('/api/roaming/commands', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.roamingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getOCPICommands(result.access.tenantId))
  }),

  http.get('/api/finance/billing', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.billingRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getBilling(result.access.tenantId))
  }),

  http.get('/api/finance/payouts', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.payoutsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listPayouts(result.access.tenantId))
  }),

  http.get('/api/finance/settlement', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.settlementRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getSettlement(result.access.tenantId))
  }),

  http.get('/api/team', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.teamRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listTeamMembers(result.access.tenantId))
  }),

  http.get('/api/audit-logs', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.auditLogsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(listAuditLogs(result.access.tenantId))
  }),

  http.get('/api/reports', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.reportsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getReports(result.access.tenantId))
  }),

  http.get('/api/protocols', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.platformAdminRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getProtocolEngine(result.access.tenantId))
  }),

  http.get('/api/platform/integrations', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.platformAdminRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getIntegrationsModule(result.access.tenantId))
  }),

  http.get('/api/platform/webhooks', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.platformAdminRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getWebhooksModule(result.access.tenantId))
  }),

  http.get('/api/platform/notifications', ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.notificationsRead)
    if (!result.ok) return result.response
    return HttpResponse.json(getNotificationsModule(result.access.tenantId))
  }),

  http.post('/api/commands/start', async ({ request }) => {
    const result = authorize(request, ACCESS_POLICY.remoteCommandStart)
    if (!result.ok) return result.response

    const { chargePointId } = await request.json() as { chargePointId: string }

    return HttpResponse.json({
      status: 'Accepted',
      sessionId: `ses-${Math.random().toString(36).slice(2, 9)}`,
      tenant: result.access.context.activeTenant.name,
      chargePointId,
    })
  }),
]
