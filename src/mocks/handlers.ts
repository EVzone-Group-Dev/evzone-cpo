import { http, HttpResponse } from 'msw'
import { authenticateDemoUser, getChargePointById, getDemoUserHints, getModuleNotice, getStationById, mockData } from './data'

export const handlers = [
  http.get('/api/auth/demo-users', () => {
    return HttpResponse.json(getDemoUserHints())
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    const auth = authenticateDemoUser(email, password)

    if (!auth) {
      return HttpResponse.json({ message: 'Invalid credentials.' }, { status: 401 })
    }

    return HttpResponse.json(auth)
  }),

  http.get('/api/dashboard/overview', () => HttpResponse.json(mockData.dashboardOverview)),
  http.get('/api/dashboard/site-owner', () => HttpResponse.json(mockData.siteOwnerDashboard)),

  http.get('/api/stations', () => HttpResponse.json(mockData.stations)),

  http.get('/api/stations/:id', ({ params }) => {
    const station = getStationById(String(params.id))

    if (!station) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json(station)
  }),

  http.get('/api/charge-points', () => HttpResponse.json(mockData.chargePoints)),

  http.get('/api/charge-points/:id', ({ params }) => {
    const chargePoint = getChargePointById(String(params.id))

    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    return HttpResponse.json(chargePoint)
  }),

  http.post('/api/charge-points/:id/commands', async ({ params, request }) => {
    const chargePoint = getChargePointById(String(params.id))

    if (!chargePoint) {
      return HttpResponse.json({ message: 'Charge point not found.' }, { status: 404 })
    }

    const { command } = await request.json() as { command: string }

    return HttpResponse.json({
      message: `${command} command accepted for ${chargePoint.ocppId}.`,
      status: 'Accepted',
    })
  }),

  http.get('/api/sessions', () => HttpResponse.json(mockData.sessions)),
  http.get('/api/incidents', () => HttpResponse.json(mockData.incidentCommand)),
  http.get('/api/alerts', () => HttpResponse.json(mockData.alerts)),
  http.get('/api/tariffs', () => HttpResponse.json(mockData.tariffs)),
  http.get('/api/energy/smart-charging', () => HttpResponse.json(mockData.smartCharging)),
  http.get('/api/energy/load-policies', () => HttpResponse.json(mockData.loadPolicies)),
  http.get('/api/roaming/partners', () => HttpResponse.json(mockData.roamingPartners)),
  http.get('/api/roaming/sessions', () => HttpResponse.json(mockData.roamingSessions)),
  http.get('/api/roaming/cdrs', () => HttpResponse.json(mockData.ocpiCdrs)),
  http.get('/api/roaming/commands', () => HttpResponse.json(mockData.ocpiCommands)),
  http.get('/api/finance/billing', () => HttpResponse.json(mockData.billing)),
  http.get('/api/finance/payouts', () => HttpResponse.json(mockData.payouts)),
  http.get('/api/finance/settlement', () => HttpResponse.json(mockData.settlement)),
  http.get('/api/team', () => HttpResponse.json(mockData.team)),
  http.get('/api/audit-logs', () => HttpResponse.json(mockData.auditLogs)),
  http.get('/api/reports', () => HttpResponse.json(mockData.reports)),
  http.get('/api/protocols', () => HttpResponse.json(mockData.protocols)),
  http.get('/api/platform/:moduleKey', ({ params }) => {
    const moduleKey = String(params.moduleKey) as 'integrations' | 'webhooks' | 'notifications'
    return HttpResponse.json(getModuleNotice(moduleKey))
  }),

  http.post('/api/commands/start', async ({ request }) => {
    const { chargePointId } = await request.json() as { chargePointId: string }
    console.log(`[MSW] Starting remote session for ${chargePointId}`)
    return HttpResponse.json({ status: 'Accepted', sessionId: `ses-${Math.random().toString(36).slice(2, 9)}` })
  }),
]
