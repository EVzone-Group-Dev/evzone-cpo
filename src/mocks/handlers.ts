import {
  ACCESS_POLICY,
  canAccessPolicy,
  type AccessPolicyKey,
} from '@/core/auth/access'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { http, HttpResponse } from 'msw'
import {
  applySwapPackRetirementDecision,
  applySwapDispatchAction,
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
  getSwapRebalancing,
  getRoamingPartnerObservability,
  getRoamingPartnerObservabilityDetail,
  getReports,
  getRoamingSessions,
  getSettlement,
  getSiteOwnerDashboard,
  getSmartCharging,
  getStationById,
  getSwapStationById,
  getWebhooksModule,
  inspectSwapPack,
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
  listDemoTenants,
  refreshDemoUserSession,
  resetDemoAuthSessions,
  resolveDemoAccess,
  stopSessionById,
  updateDemoUserProfile,
  transitionSwapPack,
  switchDemoTenant,
  switchDemoStationContext,
  type ResolvedDemoAccess,
} from './data'

type RequestAccess = ResolvedDemoAccess

type AccessResult =
  | { ok: true; access: RequestAccess }
  | { ok: false; response: Response }

function getRequestAccess(request: Request): RequestAccess | null {
  return resolveDemoAccess(
    request.headers.get('authorization'),
    request.headers.get('x-tenant-id'),
  )
}

function unauthorized() {
  return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
}

function forbidden(user: AuthenticatedApiUser, policy: AccessPolicyKey) {
  return HttpResponse.json(
    {
      message: 'Forbidden.',
      role: user.role,
      allowedRoles: ACCESS_POLICY[policy],
      policy,
    },
    { status: 403 },
  )
}

function authorize(request: Request, policy: AccessPolicyKey): AccessResult {
  const access = getRequestAccess(request)
  if (!access) {
    return { ok: false, response: unauthorized() }
  }

  if (!canAccessPolicy(access.user, policy)) {
    return { ok: false, response: forbidden(access.user, policy) }
  }

  return { ok: true, access }
}

function loginResolver(request: Request) {
  return request.json()
    .then(({ email, password }) => {
      const auth = authenticateDemoUser(email, password)
      if (!auth) {
        return HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 })
      }
      return HttpResponse.json(auth)
    })
}

const REFERENCE_COUNTRIES = [
  {
    code2: 'DE',
    code3: 'DEU',
    name: 'Germany',
    officialName: 'Federal Republic of Germany',
    flagUrl: 'https://flagcdn.com/de.svg',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    currencySymbol: 'EUR',
    languages: ['German'],
  },
  {
    code2: 'KE',
    code3: 'KEN',
    name: 'Kenya',
    officialName: 'Republic of Kenya',
    flagUrl: 'https://flagcdn.com/ke.svg',
    currencyCode: 'KES',
    currencyName: 'Kenyan shilling',
    currencySymbol: 'KSh',
    languages: ['English', 'Swahili'],
  },
  {
    code2: 'NL',
    code3: 'NLD',
    name: 'Netherlands',
    officialName: 'Kingdom of the Netherlands',
    flagUrl: 'https://flagcdn.com/nl.svg',
    currencyCode: 'EUR',
    currencyName: 'Euro',
    currencySymbol: 'EUR',
    languages: ['Dutch'],
  },
  {
    code2: 'UG',
    code3: 'UGA',
    name: 'Uganda',
    officialName: 'Republic of Uganda',
    flagUrl: 'https://flagcdn.com/ug.svg',
    currencyCode: 'UGX',
    currencyName: 'Ugandan shilling',
    currencySymbol: 'USh',
    languages: ['English', 'Swahili'],
  },
  {
    code2: 'US',
    code3: 'USA',
    name: 'United States',
    officialName: 'United States of America',
    flagUrl: 'https://flagcdn.com/us.svg',
    currencyCode: 'USD',
    currencyName: 'United States dollar',
    currencySymbol: '$',
    languages: ['English'],
  },
]

const REFERENCE_STATES: Record<string, Array<{ countryCode: string; code: string; name: string }>> = {
  DE: [
    { countryCode: 'DE', code: 'BE', name: 'Berlin' },
    { countryCode: 'DE', code: 'BW', name: 'Baden-Wurttemberg' },
    { countryCode: 'DE', code: 'BY', name: 'Bavaria' },
  ],
  KE: [
    { countryCode: 'KE', code: 'NA', name: 'Nairobi County' },
    { countryCode: 'KE', code: 'MU', name: 'Mombasa County' },
    { countryCode: 'KE', code: 'KI', name: 'Kiambu County' },
  ],
  NL: [
    { countryCode: 'NL', code: 'NH', name: 'North Holland' },
    { countryCode: 'NL', code: 'ZH', name: 'South Holland' },
  ],
  UG: [
    { countryCode: 'UG', code: 'C', name: 'Central Region' },
    { countryCode: 'UG', code: 'E', name: 'Eastern Region' },
    { countryCode: 'UG', code: 'N', name: 'Northern Region' },
    { countryCode: 'UG', code: 'W', name: 'Western Region' },
  ],
  US: [
    { countryCode: 'US', code: 'CA', name: 'California' },
    { countryCode: 'US', code: 'NY', name: 'New York' },
    { countryCode: 'US', code: 'TX', name: 'Texas' },
  ],
}

const REFERENCE_CITIES: Record<string, Array<{ countryCode: string; stateCode: string; name: string }>> = {
  'DE:BE': [
    { countryCode: 'DE', stateCode: 'BE', name: 'Berlin' },
  ],
  'DE:BW': [
    { countryCode: 'DE', stateCode: 'BW', name: 'Stuttgart' },
    { countryCode: 'DE', stateCode: 'BW', name: 'Mannheim' },
  ],
  'DE:BY': [
    { countryCode: 'DE', stateCode: 'BY', name: 'Munich' },
    { countryCode: 'DE', stateCode: 'BY', name: 'Nuremberg' },
  ],
  'KE:NA': [
    { countryCode: 'KE', stateCode: 'NA', name: 'Nairobi' },
    { countryCode: 'KE', stateCode: 'NA', name: 'Westlands' },
  ],
  'KE:MU': [
    { countryCode: 'KE', stateCode: 'MU', name: 'Mombasa' },
  ],
  'KE:KI': [
    { countryCode: 'KE', stateCode: 'KI', name: 'Kiambu' },
    { countryCode: 'KE', stateCode: 'KI', name: 'Thika' },
  ],
  'NL:NH': [
    { countryCode: 'NL', stateCode: 'NH', name: 'Amsterdam' },
    { countryCode: 'NL', stateCode: 'NH', name: 'Haarlem' },
  ],
  'NL:ZH': [
    { countryCode: 'NL', stateCode: 'ZH', name: 'Rotterdam' },
    { countryCode: 'NL', stateCode: 'ZH', name: 'The Hague' },
  ],
  'UG:C': [
    { countryCode: 'UG', stateCode: 'C', name: 'Kampala' },
    { countryCode: 'UG', stateCode: 'C', name: 'Entebbe' },
  ],
  'UG:E': [
    { countryCode: 'UG', stateCode: 'E', name: 'Jinja' },
    { countryCode: 'UG', stateCode: 'E', name: 'Mbale' },
  ],
  'UG:N': [
    { countryCode: 'UG', stateCode: 'N', name: 'Gulu' },
  ],
  'UG:W': [
    { countryCode: 'UG', stateCode: 'W', name: 'Mbarara' },
  ],
  'US:CA': [
    { countryCode: 'US', stateCode: 'CA', name: 'San Francisco' },
    { countryCode: 'US', stateCode: 'CA', name: 'Los Angeles' },
  ],
  'US:NY': [
    { countryCode: 'US', stateCode: 'NY', name: 'New York' },
    { countryCode: 'US', stateCode: 'NY', name: 'Buffalo' },
  ],
  'US:TX': [
    { countryCode: 'US', stateCode: 'TX', name: 'Austin' },
    { countryCode: 'US', stateCode: 'TX', name: 'Houston' },
  ],
}

function normalizeGeographyToken(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T
  } catch {
    return {} as T
  }
}

export const handlers = [
  http.get('/api/v1/auth/demo-users', () => HttpResponse.json(getDemoUserHints())),
  http.get('/api/auth/demo-users', () => HttpResponse.json(getDemoUserHints())),

  http.post('/api/v1/auth/login', ({ request }) => loginResolver(request)),
  http.post('/api/auth/login', ({ request }) => loginResolver(request)),

  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = await request.json() as { refreshToken?: string | null }
    const auth = refreshDemoUserSession(body.refreshToken ?? null)

    if (!auth) {
      return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    return HttpResponse.json(auth)
  }),

  http.patch('/api/v1/auth/me', async ({ request }) => {
    const access = getRequestAccess(request)
    if (!access) {
      return unauthorized()
    }

    const body = await readJsonBody<{ country?: string; name?: string }>(request)
    const updatedUser = updateDemoUserProfile(access, body)

    if (!updatedUser) {
      return unauthorized()
    }

    return HttpResponse.json(updatedUser)
  }),
  http.patch('/api/auth/me', async ({ request }) => {
    const access = getRequestAccess(request)
    if (!access) {
      return unauthorized()
    }

    const body = await readJsonBody<{ country?: string; name?: string }>(request)
    const updatedUser = updateDemoUserProfile(access, body)

    if (!updatedUser) {
      return unauthorized()
    }

    return HttpResponse.json(updatedUser)
  }),

  http.get('/api/v1/users/me', ({ request }) => {
    const access = getRequestAccess(request)
    if (!access) {
      return unauthorized()
    }
    return HttpResponse.json(access.user)
  }),

  http.get('/api/v1/auth/access-profile', ({ request }) => {
    const access = getRequestAccess(request)
    if (!access) {
      return unauthorized()
    }
    return HttpResponse.json(access.user.accessProfile ?? null)
  }),

  http.post('/api/v1/auth/switch-tenant', async ({ request }) => {
    const authorization = request.headers.get('authorization')
    const { tenantId } = await request.json() as { tenantId: string }
    const auth = switchDemoTenant(authorization, tenantId)

    if (!auth) {
      return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    return HttpResponse.json(auth)
  }),

  http.get('/api/v1/users/me/station-contexts', ({ request }) => {
    const access = getRequestAccess(request)
    if (!access) {
      return unauthorized()
    }

    return HttpResponse.json({
      stationContexts: access.user.stationContexts ?? [],
      activeStationContext: access.user.activeStationContext ?? null,
    })
  }),

  http.post('/api/v1/users/me/station-context', async ({ request }) => {
    const authorization = request.headers.get('authorization')
    const { assignmentId } = await request.json() as { assignmentId: string }
    const stationContext = switchDemoStationContext(authorization, assignmentId)

    if (!stationContext) {
      return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    return HttpResponse.json(stationContext)
  }),

  http.get('/api/v1/tenants', ({ request }) => {
    const tenants = listDemoTenants(request.headers.get('authorization'))
    if (tenants.length === 0) {
      return unauthorized()
    }
    return HttpResponse.json(tenants)
  }),

  http.get('/api/v1/geography/reference/countries', () => HttpResponse.json(REFERENCE_COUNTRIES)),
  http.get('/api/v1/geography/reference/countries/:countryCode/states', ({ params }) => {
    const countryCode = normalizeGeographyToken(params.countryCode)
    return HttpResponse.json(REFERENCE_STATES[countryCode] ?? [])
  }),
  http.get('/api/v1/geography/reference/countries/:countryCode/states/:stateCode/cities', ({ params }) => {
    const countryCode = normalizeGeographyToken(params.countryCode)
    const stateCode = normalizeGeographyToken(params.stateCode)
    return HttpResponse.json(REFERENCE_CITIES[`${countryCode}:${stateCode}`] ?? [])
  }),

  http.get('/api/tenancy/context', ({ request }) => {
    const result = authorize(request, 'tenancyContext')
    if (!result.ok) return result.response
    return HttpResponse.json(result.access.context)
  }),

  http.get('/api/dashboard/overview', ({ request }) => {
    const result = authorize(request, 'dashboardHome')
    if (!result.ok) return result.response
    return HttpResponse.json(getDashboardOverview(result.access.tenantId))
  }),

  http.get('/api/dashboard/site-owner', ({ request }) => {
    const result = authorize(request, 'siteDashboard')
    if (!result.ok) return result.response
    return HttpResponse.json(getSiteOwnerDashboard(result.access.tenantId))
  }),

  http.get('/api/stations', ({ request }) => {
    const result = authorize(request, 'stationsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listStations(result.access.tenantId))
  }),

  http.get('/api/stations/:id', ({ params, request }) => {
    const result = authorize(request, 'stationsRead')
    if (!result.ok) return result.response

    const station = getStationById(String(params.id), result.access.tenantId)
    if (!station) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/swapping/stations', ({ request }) => {
    const result = authorize(request, 'swapStationsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listSwapStations(result.access.tenantId))
  }),

  http.get('/api/swapping/stations/:id', ({ params, request }) => {
    const result = authorize(request, 'swapStationsRead')
    if (!result.ok) return result.response

    const station = getSwapStationById(String(params.id), result.access.tenantId)
    if (!station) return HttpResponse.json({ message: 'Swap station not found.' }, { status: 404 })
    return HttpResponse.json(station)
  }),

  http.get('/api/charge-points', ({ request }) => {
    const result = authorize(request, 'chargePointsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listChargePoints(result.access.tenantId))
  }),

  http.get('/api/charge-points/:id', ({ params, request }) => {
    const result = authorize(request, 'chargePointsRead')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    return HttpResponse.json(chargePoint)
  }),

  http.post('/api/charge-points', async ({ request }) => {
    const result = authorize(request, 'chargePointsWrite')
    if (!result.ok) return result.response

    const payload = await readJsonBody<Parameters<typeof createChargePoint>[0]>(request)
    const chargePoint = createChargePoint(payload, result.access.tenantId)

    if (!chargePoint) {
      return HttpResponse.json({ message: 'Station not found for active tenant.' }, { status: 400 })
    }

    return HttpResponse.json(chargePoint, { status: 201 })
  }),

  http.post('/api/v1/charge-points/:id/commands/remote-start', async ({ params, request }) => {
    const result = authorize(request, 'remoteCommandStart')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    const body = await readJsonBody<{ idTag?: string; connectorId?: number; evseId?: number }>(request)
    const idTag = typeof body.idTag === 'string' && body.idTag.trim().length > 0 ? body.idTag.trim() : 'EVZONE_REMOTE'
    return HttpResponse.json({
      message: `Remote start command queued for ${chargePoint.ocppId} with ${idTag}.`,
      status: 'Queued',
    })
  }),

  http.post('/api/v1/charge-points/:id/commands/soft-reset', async ({ params, request }) => {
    const result = authorize(request, 'chargePointCommands')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    return HttpResponse.json({
      message: `Soft reset command queued for ${chargePoint.ocppId}.`,
      status: 'Queued',
    })
  }),

  http.post('/api/v1/charge-points/:id/reboot', async ({ params, request }) => {
    const result = authorize(request, 'chargePointCommands')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    return HttpResponse.json({
      message: `Hard reboot command queued for ${chargePoint.ocppId}.`,
      status: 'Queued',
    })
  }),

  http.post('/api/v1/charge-points/:id/commands/unlock', async ({ params, request }) => {
    const result = authorize(request, 'chargePointCommands')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    const body = await readJsonBody<{ connectorId?: number; evseId?: number }>(request)
    const connectorId = typeof body.connectorId === 'number' ? body.connectorId : 1
    return HttpResponse.json({
      message: `Unlock connector command queued for ${chargePoint.ocppId} on connector ${connectorId}.`,
      status: 'Queued',
    })
  }),

  http.post('/api/v1/charge-points/:id/commands/update-firmware', async ({ params, request }) => {
    const result = authorize(request, 'chargePointCommands')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    const body = await readJsonBody<{ location?: string }>(request)
    const location = typeof body.location === 'string' && body.location.trim().length > 0 ? body.location.trim() : 'firmware.bin'
    return HttpResponse.json({
      message: `Firmware update command queued for ${chargePoint.ocppId} using ${location}.`,
      status: 'Queued',
    })
  }),

  http.post('/api/charge-points/:id/commands', async ({ params, request }) => {
    const result = authorize(request, 'chargePointCommands')
    if (!result.ok) return result.response

    const chargePoint = getChargePointById(String(params.id), result.access.tenantId)
    if (!chargePoint) return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })

    const { command } = await request.json() as { command: string }

    return HttpResponse.json({
      message: `${command} command accepted for ${chargePoint.ocppId} in ${result.access.context.activeTenant.name}.`,
      status: 'Accepted',
    })
  }),

  http.post('/api/v1/sessions/:id/stop', async ({ params, request }) => {
    const result = authorize(request, 'remoteCommandStart')
    if (!result.ok) return result.response

    const stoppedSession = stopSessionById(String(params.id), result.access.tenantId)
    if (!stoppedSession) {
      return HttpResponse.json({ message: 'Session not found.' }, { status: 404 })
    }

    const body = await readJsonBody<{ reason?: string }>(request)
    const reason = typeof body.reason === 'string' && body.reason.trim().length > 0 ? body.reason.trim() : null

    return HttpResponse.json({
      message: reason
        ? `Remote stop request accepted for session ${stoppedSession.id} with reason: ${reason}.`
        : `Remote stop request accepted for session ${stoppedSession.id}.`,
      status: 'Completed',
      session: stoppedSession,
    })
  }),

  http.get('/api/sessions', ({ request }) => {
    const result = authorize(request, 'sessionsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listSessions(result.access.tenantId))
  }),

  http.get('/api/swapping/sessions', ({ request }) => {
    const result = authorize(request, 'swapSessionsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listBatterySwapSessions(result.access.tenantId))
  }),

  http.get('/api/swapping/inventory', ({ request }) => {
    const result = authorize(request, 'batteryInventoryRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getBatteryInventory(result.access.tenantId))
  }),

  http.get('/api/swapping/rebalancing', ({ request }) => {
    const result = authorize(request, 'swapStationsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getSwapRebalancing(result.access.tenantId))
  }),

  http.post('/api/swapping/rebalancing/:id/action', async ({ params, request }) => {
    const result = authorize(request, 'swapDispatchWrite')
    if (!result.ok) return result.response

    const payload = await request.json() as Parameters<typeof applySwapDispatchAction>[1]
    const dispatch = applySwapDispatchAction(String(params.id), payload, result.access.tenantId)

    if (!dispatch.ok) {
      return HttpResponse.json({ message: dispatch.message }, { status: dispatch.notFound ? 404 : 400 })
    }

    return HttpResponse.json({
      message: dispatch.message,
      dispatch: dispatch.dispatch,
    })
  }),

  http.post('/api/swapping/packs/:id/transition', async ({ params, request }) => {
    const result = authorize(request, 'swapLifecycleWrite')
    if (!result.ok) return result.response

    const payload = await request.json() as Parameters<typeof transitionSwapPack>[1]
    const transition = transitionSwapPack(String(params.id), payload, result.access.tenantId)

    if (!transition.ok) {
      return HttpResponse.json({ message: transition.message }, { status: 400 })
    }

    return HttpResponse.json({
      message: transition.message,
      pack: transition.pack,
    })
  }),

  http.post('/api/swapping/packs/:id/inspection', async ({ params, request }) => {
    const result = authorize(request, 'swapLifecycleWrite')
    if (!result.ok) return result.response

    const payload = await request.json() as Parameters<typeof inspectSwapPack>[1]
    const inspection = inspectSwapPack(String(params.id), payload, result.access.tenantId)

    if (!inspection.ok) {
      return HttpResponse.json({ message: inspection.message }, { status: 400 })
    }

    return HttpResponse.json({
      message: inspection.message,
      pack: inspection.pack,
    })
  }),

  http.post('/api/swapping/packs/:id/retirement', async ({ params, request }) => {
    const result = authorize(request, 'swapLifecycleWrite')
    if (!result.ok) return result.response

    const payload = await request.json() as Parameters<typeof applySwapPackRetirementDecision>[1]
    const retirement = applySwapPackRetirementDecision(String(params.id), payload, result.access.tenantId)

    if (!retirement.ok) {
      return HttpResponse.json({ message: retirement.message }, { status: 400 })
    }

    return HttpResponse.json({
      message: retirement.message,
      pack: retirement.pack,
    })
  }),

  http.get('/api/incidents', ({ request }) => {
    const result = authorize(request, 'incidentsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getIncidentCommand(result.access.tenantId))
  }),

  http.get('/api/alerts', ({ request }) => {
    const result = authorize(request, 'alertsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listAlerts(result.access.tenantId))
  }),

  http.get('/api/tariffs', ({ request }) => {
    const result = authorize(request, 'tariffsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listTariffs(result.access.tenantId))
  }),

  http.get('/api/energy/smart-charging', ({ request }) => {
    const result = authorize(request, 'smartChargingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getSmartCharging(result.access.tenantId))
  }),

  http.get('/api/energy/load-policies', ({ request }) => {
    const result = authorize(request, 'loadPoliciesRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listLoadPolicies(result.access.tenantId))
  }),

  http.get('/api/roaming/partners', ({ request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listRoamingPartners(result.access.tenantId))
  }),

  http.get('/api/roaming/partners/observability', ({ request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getRoamingPartnerObservability(result.access.tenantId))
  }),

  http.get('/api/roaming/partners/:id/observability', ({ params, request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response

    const observability = getRoamingPartnerObservabilityDetail(String(params.id), result.access.tenantId)
    if (!observability) return HttpResponse.json({ message: 'Roaming partner observability not found.' }, { status: 404 })
    return HttpResponse.json(observability)
  }),

  http.get('/api/roaming/sessions', ({ request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getRoamingSessions(result.access.tenantId))
  }),

  http.get('/api/roaming/cdrs', ({ request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getOCPICdrs(result.access.tenantId))
  }),

  http.get('/api/roaming/commands', ({ request }) => {
    const result = authorize(request, 'roamingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getOCPICommands(result.access.tenantId))
  }),

  http.get('/api/finance/billing', ({ request }) => {
    const result = authorize(request, 'billingRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getBilling(result.access.tenantId))
  }),

  http.get('/api/finance/payouts', ({ request }) => {
    const result = authorize(request, 'payoutsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listPayouts(result.access.tenantId))
  }),

  http.get('/api/finance/settlement', ({ request }) => {
    const result = authorize(request, 'settlementRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getSettlement(result.access.tenantId))
  }),

  http.get('/api/team', ({ request }) => {
    const result = authorize(request, 'teamRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listTeamMembers(result.access.tenantId))
  }),

  http.get('/api/audit-logs', ({ request }) => {
    const result = authorize(request, 'auditLogsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(listAuditLogs(result.access.tenantId))
  }),

  http.get('/api/reports', ({ request }) => {
    const result = authorize(request, 'reportsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getReports(result.access.tenantId))
  }),

  http.get('/api/protocols', ({ request }) => {
    const result = authorize(request, 'platformAdminRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getProtocolEngine(result.access.tenantId))
  }),

  http.get('/api/platform/integrations', ({ request }) => {
    const result = authorize(request, 'platformAdminRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getIntegrationsModule(result.access.tenantId))
  }),

  http.get('/api/platform/webhooks', ({ request }) => {
    const result = authorize(request, 'platformAdminRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getWebhooksModule(result.access.tenantId))
  }),

  http.get('/api/platform/notifications', ({ request }) => {
    const result = authorize(request, 'notificationsRead')
    if (!result.ok) return result.response
    return HttpResponse.json(getNotificationsModule(result.access.tenantId))
  }),

  http.post('/api/commands/start', async ({ request }) => {
    const result = authorize(request, 'remoteCommandStart')
    if (!result.ok) return result.response

    const { chargePointId } = await request.json() as { chargePointId: string }

    return HttpResponse.json({
      status: 'Accepted',
      sessionId: `ses-${Math.random().toString(36).slice(2, 9)}`,
      tenant: result.access.context.activeTenant.name,
      chargePointId,
    })
  }),
  http.get('/api/swapping/packs/:id/telemetry', () => {
    // Generate mock cell voltages near 3.2V
    const generateCell = () => 3.2 + (Math.random() * 0.1 - 0.05)
    const cells = Array(16).fill(0).map(generateCell)
    
    // Create an artificial imbalance for visual demo purposes
    if (Math.random() > 0.5) {
        cells[5] = 2.85 // Low voltage
    } else {
        cells[10] = 3.68 // High voltage
    }
    
    return HttpResponse.json({
      voltage: cells.reduce((sum, c) => sum + c, 0),
      current: 12.5 + Math.random(),
      soc: 85 - Math.random() * 2,
      temps: [24.5 + Math.random(), 25.1 + Math.random()],
      cells
    })
  }),

  http.post('/api/swapping/packs/:id/kill', () => {
    return HttpResponse.json({ message: 'Kill command dispatched' })
  }),
]

resetDemoAuthSessions()
