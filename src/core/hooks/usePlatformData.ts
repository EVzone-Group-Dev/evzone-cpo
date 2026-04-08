import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointPublicationResponse,
  ChargePointDetail,
  ChargePointSummary,
  ConfirmChargePointIdentityRequest,
  CreateChargePointRequest,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  IntegrationModuleResponse,
  LoadPolicyRecord,
  NotificationsModuleResponse,
  OCPICdrsResponse,
  OCPICommandsResponse,
  RoamingPartnerObservabilityDetail,
  RoamingPartnerObservabilityResponse,
  PayoutRecord,
  PlatformFeatureFlagRecord,
  PlatformFeatureFlags,
  ProtocolEngineResponse,
  ReportsResponse,
  RoamingPartnerRecord,
  RoamingSessionsResponse,
  SessionRecord,
  SettlementResponse,
  SiteOwnerDashboardResponse,
  SmartChargingResponse,
  TariffRecord,
  TeamMember,
  WebhooksModuleResponse,
} from '@/core/types/mockApi'

const FALLBACK_DEMO_USERS: DemoUserHint[] = [
  {
    id: 'demo-super-admin',
    name: 'Platform Admin',
    email: 'admin@evzone.io',
    password: 'admin',
    role: 'SUPER_ADMIN',
  },
  {
    id: 'demo-finance',
    name: 'Finance Ops',
    email: 'finance@evzone.io',
    password: 'admin',
    role: 'FINANCE',
  },
  {
    id: 'demo-station-manager',
    name: 'Station Manager',
    email: 'manager@evzone.io',
    password: 'admin',
    role: 'STATION_MANAGER',
  },
]

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asNullableRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeCurrencyCode(value: unknown, fallback = 'USD'): string {
  const normalized = asString(value, fallback).trim().toUpperCase()
  return normalized.length > 0 ? normalized : fallback
}

function formatAmount(value: unknown, currencyCode: string): string {
  return `${currencyCode} ${asNumber(value, 0).toFixed(0)}`
}

const DEFAULT_PLATFORM_FLAGS: PlatformFeatureFlags = {
  commerce_v1: false,
  fleet_v1: false,
  pnc_v1: false,
  enterprise_sso_v1: false,
}

function normalizeFeatureFlags(value: unknown): PlatformFeatureFlags {
  const records = asArray<PlatformFeatureFlagRecord>(value)
  const flags: PlatformFeatureFlags = { ...DEFAULT_PLATFORM_FLAGS }

  for (const record of records) {
    const key = asString(record.key, '')
    if (!key) continue
    flags[key] = Boolean(record.isEnabled)
  }

  return flags
}

const DEFAULT_REMOTE_COMMANDS: ChargePointDetail['remoteCommands'] = [
  'Remote Start Session',
  'Remote Stop Session',
  'Soft Reset',
  'Hard Reboot',
  'Unlock Connector',
  'Update Firmware',
]

function normalizeChargePointStatus(value: unknown): ChargePointSummary['status'] {
  const normalized = asString(value, 'OFFLINE').toUpperCase()

  if (normalized === 'ONLINE' || normalized === 'AVAILABLE' || normalized === 'ACTIVE' || normalized === 'CHARGING') {
    return 'Online'
  }

  if (normalized === 'DEGRADED' || normalized === 'FAULTED' || normalized === 'UNAVAILABLE') {
    return 'Degraded'
  }

  return 'Offline'
}

function formatHeartbeatLabel(value: unknown): string {
  const raw = asString(value, '')
  if (!raw) {
    return 'No heartbeat'
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }

  return parsed.toLocaleString()
}

function normalizeChargePointSummary(value: unknown, fallbackIndex = 0): ChargePointSummary {
  const record = asRecord(value)
  const station = asRecord(record.station)
  const connectorType = asString(record.connectorType ?? record.type, 'CCS2')
  const connectorTypes = asArray<unknown>(record.connectorTypes)
    .map((entry) => asString(entry))
    .filter((entry) => entry.length > 0)
  const status = normalizeChargePointStatus(record.status)
  const id = asString(record.id, asString(record.ocppId, `charge-point-${fallbackIndex + 1}`))
  const ocppId = asString(record.ocppId, id)
  const lastHeartbeat = record.lastHeartbeatLabel ?? record.lastHeartbeat

  return {
    id,
    stationId: asString(record.stationId, asString(station.id, 'unknown-station')),
    stationName: asString(record.stationName ?? station.name, asString(record.stationId, 'Unassigned Station')),
    model: asString(record.model, ocppId),
    manufacturer: asString(record.manufacturer ?? record.vendor, 'Unknown Manufacturer'),
    serialNumber: asString(record.serialNumber, ocppId),
    firmwareVersion: asString(record.firmwareVersion, 'Unknown firmware'),
    connectorType,
    connectorTypes: connectorTypes.length > 0 ? connectorTypes : [connectorType],
    ocppId,
    ocppVersion: asString(record.ocppVersion, '1.6'),
    maxCapacityKw: asNumber(record.maxCapacityKw ?? record.power, 0),
    status,
    ocppStatus: asString(record.ocppStatus, status),
    roamingPublished: Boolean(record.roamingPublished),
    bootNotificationAt: asString(record.bootNotificationAt, '') || null,
    identityConfirmedAt: asString(record.identityConfirmedAt, '') || null,
    bootNotificationPayload: asNullableRecord(record.bootNotificationPayload),
    lastHeartbeatLabel: formatHeartbeatLabel(lastHeartbeat),
    stale: typeof record.stale === 'boolean' ? record.stale : !asString(record.lastHeartbeat),
  }
}

function normalizeChargePointDetail(value: unknown): ChargePointDetail {
  const record = asRecord(value)
  const base = normalizeChargePointSummary(record)
  const unitHealth = asRecord(record.unitHealth)
  const ocppCredentialsRecord = asRecord(record.ocppCredentials)
  const remoteCommands = asArray<unknown>(record.remoteCommands)
    .map((entry) => asString(entry))
    .filter((entry) => entry.length > 0)

  return {
    ...base,
    ocppCredentials:
      Object.keys(ocppCredentialsRecord).length > 0
        ? {
            username: asString(ocppCredentialsRecord.username, ''),
            password: asString(ocppCredentialsRecord.password, ''),
            wsUrl: asString(ocppCredentialsRecord.wsUrl, ''),
            subprotocol: asString(ocppCredentialsRecord.subprotocol, ''),
            authProfile: asString(ocppCredentialsRecord.authProfile, '') as
              | 'basic'
              | 'mtls_bootstrap'
              | 'mtls'
              | undefined,
            bootstrapExpiresAt: asString(
              ocppCredentialsRecord.bootstrapExpiresAt,
              '',
            ),
            requiresClientCertificate: Boolean(
              ocppCredentialsRecord.requiresClientCertificate,
            ),
            mtlsInstructions: asString(ocppCredentialsRecord.mtlsInstructions, ''),
          }
        : undefined,
    remoteCommands: remoteCommands.length > 0 ? remoteCommands : DEFAULT_REMOTE_COMMANDS,
    unitHealth: {
      ocppConnection: asString(
        unitHealth.ocppConnection,
        base.status === 'Online' ? 'Connected' : 'Disconnected',
      ),
      lastHeartbeat: asString(unitHealth.lastHeartbeat, base.lastHeartbeatLabel),
      errorCode: asString(unitHealth.errorCode, asString(record.errorCode, 'None')),
    },
    smartChargingEnabled: Boolean(record.smartChargingEnabled),
  }
}

function toTimestamp(value: unknown): number {
  const parsed = Date.parse(asString(value, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function mapDashboardIncidentSeverity(value: unknown): DashboardOverviewResponse['recentIncidents'][number]['severity'] {
  const normalized = asString(value, 'LOW').toUpperCase()
  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    return 'High'
  }
  if (normalized === 'MEDIUM') {
    return 'Medium'
  }
  return 'Low'
}

function normalizeDashboardOverview(
  analyticsValue: unknown,
  sessionsValue: unknown,
  incidentsValue: unknown,
  defaultCurrencyCode: string,
): DashboardOverviewResponse {
  const analytics = asRecord(analyticsValue)
  const realtime = asRecord(analytics.realTime)
  const today = asRecord(analytics.today)
  const totalSessions = asNumber(analytics.totalSessions ?? today.sessions, 0)
  const totalEnergy = asNumber(analytics.totalEnergy ?? today.energyDelivered, 0)
  const revenue = asNumber(analytics.revenue ?? today.revenue, 0)
  const activeChargers = asNumber(analytics.activeChargers ?? realtime.onlineChargers, 0)
  const incidents24h = asNumber(analytics.incidents24h ?? today.incidents, 0)

  const kpis: DashboardOverviewResponse['kpis'] = [
    {
      id: 'sessions',
      label: 'Sessions Today',
      value: totalSessions.toLocaleString(),
      delta: 'Today',
      trend: 'up',
      iconKey: 'activity',
    },
    {
      id: 'energy',
      label: 'Energy Delivered',
      value: `${totalEnergy.toFixed(1)} kWh`,
      delta: 'Today',
      trend: 'up',
      iconKey: 'energy',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: `${defaultCurrencyCode} ${Math.round(revenue).toLocaleString()}`,
      delta: 'Today',
      trend: 'up',
      iconKey: 'revenue',
    },
    {
      id: 'active-chargers',
      label: 'Active Chargers',
      value: activeChargers.toLocaleString(),
      delta: 'Live',
      trend: 'up',
      iconKey: 'charge-points',
    },
    {
      id: 'incidents',
      label: 'Incidents (24h)',
      value: incidents24h.toLocaleString(),
      delta: '24h',
      trend: incidents24h > 0 ? 'down' : 'up',
      iconKey: 'incidents',
    },
  ]

  const recentSessions = normalizeSessionRecords(sessionsValue, defaultCurrencyCode)
    .sort((a, b) => toTimestamp(b.started) - toTimestamp(a.started))
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      station: session.station,
      cp: session.cp,
      energy: session.energy,
      amount: session.amount,
      status: session.status,
      method: session.method,
    }))

  const recentIncidents = asArray<Record<string, unknown>>(incidentsValue)
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 5)
    .map((incident) => {
      const status: DashboardOverviewResponse['recentIncidents'][number]['status'] =
        asString(incident.status, 'OPEN').toUpperCase() === 'OPEN'
          ? 'Open'
          : 'Acknowledged'

      return {
        id: asString(incident.id, 'N/A'),
        station: asString(asRecord(incident.station).name ?? incident.stationId, 'Unknown Station'),
        severity: mapDashboardIncidentSeverity(incident.severity),
        title: asString(incident.title ?? incident.description, 'Incident'),
        status,
      }
    })

  return {
    kpis,
    recentIncidents,
    recentSessions,
  }
}

function normalizeSiteOwnerDashboard(value: unknown): SiteOwnerDashboardResponse {
  const record = asRecord(value)
  return {
    title: asString(record.title, 'Site Owner Dashboard'),
    subtitle: asString(record.subtitle, 'Backend analytics feed'),
    metrics: asArray<SiteOwnerDashboardResponse['metrics'][number]>(record.metrics),
    revenueData: asArray<SiteOwnerDashboardResponse['revenueData'][number]>(record.revenueData),
    topUnits: asArray<SiteOwnerDashboardResponse['topUnits'][number]>(record.topUnits),
    alerts: asArray<SiteOwnerDashboardResponse['alerts'][number]>(record.alerts),
    optimizationTip: (record.optimizationTip as SiteOwnerDashboardResponse['optimizationTip']) ?? {
      title: 'Optimization Insight',
      text: 'No optimization hint available from backend yet.',
      cta: 'Review station analytics',
    },
  }
}

function normalizeSessionRecords(value: unknown, defaultCurrencyCode: string): SessionRecord[] {
  return asArray<Record<string, unknown>>(value).map((session) => ({
    id: asString(session.id, 'N/A'),
    stationId: asString(session.stationId, ''),
    station: asString((session.station as Record<string, unknown>)?.name ?? session.stationId, 'Unknown Station'),
    cp: asString(session.ocppId, asString(session.chargePointId, 'N/A')),
    chargePointId: asString(session.chargePointId, ''),
    started: asString(session.startTime ?? session.createdAt, 'N/A'),
    ended: typeof session.endTime === 'string' ? session.endTime : null,
    energy: `${asNumber(session.totalEnergy, 0).toFixed(1)} kWh`,
    amount: formatAmount(session.amount, normalizeCurrencyCode(session.currency, defaultCurrencyCode)),
    status: (asString(session.status, 'COMPLETED').toUpperCase() === 'ACTIVE'
      ? 'Active'
      : asString(session.status, 'COMPLETED').toUpperCase() === 'FAILED'
        ? 'Failed'
        : 'Completed'),
    emsp: asString(session.emsp, 'Direct'),
    method: asString(session.authMethod, 'App'),
    connectorType: asString(session.connectorType, 'CCS2'),
  }))
}

function normalizeIncidentCommand(value: unknown): IncidentCommandResponse {
  const fromArray = asArray<Record<string, unknown>>(value)
  const sourceIncidents = Array.isArray((value as Record<string, unknown>)?.incidents)
    ? asArray<Record<string, unknown>>((value as Record<string, unknown>).incidents)
    : fromArray

  const incidents: IncidentCommandResponse['incidents'] = sourceIncidents.map((incident) => {
    const severity: IncidentCommandResponse['incidents'][number]['severity'] =
      asString(incident.severity, 'LOW').toUpperCase() === 'CRITICAL'
        ? 'Critical'
        : asString(incident.severity, 'LOW').toUpperCase() === 'HIGH'
          ? 'Major'
          : 'Minor'

    const status: IncidentCommandResponse['incidents'][number]['status'] =
      asString(incident.status, 'OPEN').toUpperCase() === 'OPEN'
        ? 'Open'
        : asString(incident.status, 'OPEN').toUpperCase() === 'DISPATCHED'
          ? 'Dispatched'
          : asString(incident.status, 'OPEN').toUpperCase() === 'CLOSED'
            ? 'Closed'
            : 'Resolving'

    const mappedType: IncidentCommandResponse['incidents'][number]['type'] =
      asString(incident.type).toUpperCase().includes('COMM')
        ? 'Communication Loss'
        : asString(incident.type).toUpperCase().includes('POWER')
          ? 'Power Surge'
          : asString(incident.type).toUpperCase().includes('VAND')
            ? 'Vandalism'
            : 'Hardware Failure'

    return {
      id: asString(incident.id, 'N/A'),
      type: mappedType,
      stationId: asString(incident.stationId, ''),
      stationName: asString((incident.station as Record<string, unknown>)?.name, 'Unknown Station'),
      severity,
      status,
      reportedAt: asString(incident.createdAt, 'N/A'),
      assignedTech: asString(incident.assignedTo, ''),
      situationAudit: asString(incident.description, 'No additional audit details.'),
      serviceLog: [
        { title: 'Incident Logged', note: asString(incident.createdAt, 'N/A'), active: true },
        { title: 'Awaiting Dispatch', note: 'Technician assignment pending.', active: false },
      ],
    }
  })

  const openCount = incidents.filter((incident) => incident.status !== 'Closed').length
  const dispatchedCount = incidents.filter((incident) => incident.status === 'Dispatched').length

  return {
    incidents,
    stats: [
      { id: 'open', label: 'Open Tickets', value: openCount.toString(), tone: 'danger' },
      { id: 'response', label: 'Avg Response', value: 'N/A', tone: 'default' },
      { id: 'dispatched', label: 'Dispatched', value: dispatchedCount.toString(), tone: 'warning' },
      { id: 'sla', label: 'SLA', value: 'N/A', tone: 'ok' },
    ],
    predictiveAlert: {
      text: 'Predictive incident analytics are not exposed by backend yet.',
      cta: 'Review incident queue',
    },
  }
}

function normalizeAlerts(value: unknown): AlertRecord[] {
  const source = asArray<Record<string, unknown>>(value)
  return source.map((alert) => ({
    id: asString(alert.id, 'N/A'),
    message: asString(alert.title ?? alert.description, 'Alert'),
    station: asString((alert.station as Record<string, unknown>)?.name, 'Unknown Station'),
    ts: asString(alert.createdAt, 'N/A'),
    type: (asString(alert.severity, 'LOW').toUpperCase() === 'CRITICAL'
      ? 'Critical'
      : asString(alert.severity, 'LOW').toUpperCase() === 'HIGH'
        ? 'Warning'
        : 'Info'),
    acked: asString(alert.status).toUpperCase() === 'CLOSED',
  }))
}

function normalizeTeamMembers(value: unknown): TeamMember[] {
  return asArray<Record<string, unknown>>(value).map((member) => ({
    name: asString(member.name, asString(member.email, 'Unknown User')),
    email: asString(member.email, 'unknown@evzone.io'),
    role: asString(member.role, 'STAFF'),
    lastSeen: asString(member.lastSeen ?? member.updatedAt, 'N/A'),
    status: asString(member.status).toUpperCase() === 'ACTIVE' ? 'Active' : 'Invited',
  }))
}

function normalizeAuditLogs(value: unknown): AuditLogRecord[] {
  return asArray<Record<string, unknown>>(value).map((log) => ({
    actor: asString(log.actor, 'system'),
    action: asString(log.action, 'UNKNOWN_ACTION'),
    target: asString(log.target ?? log.resource, 'N/A'),
    ts: asString(log.ts ?? log.createdAt, 'N/A'),
  }))
}

function normalizeBilling(value: unknown, defaultCurrencyCode: string): BillingResponse {
  const rows = asArray<Record<string, unknown>>(value)
  const invoices = rows.map((invoice) => {
    const normalizedStatus = asString(invoice.status, 'ISSUED').toUpperCase()
    const status: BillingResponse['invoices'][number]['status'] =
      normalizedStatus === 'PAID'
        ? 'Paid'
        : normalizedStatus === 'OVERDUE'
          ? 'Overdue'
          : normalizedStatus === 'DRAFT'
            ? 'Draft'
            : 'Issued'

    return {
      id: asString(invoice.id, 'N/A'),
      customer: asString(invoice.customerName ?? invoice.customer, 'N/A'),
      scope: asString(invoice.scope ?? invoice.settlementStatus, 'General'),
      amount: formatAmount(invoice.amount, normalizeCurrencyCode(invoice.currency, defaultCurrencyCode)),
      dueDate: asString(invoice.dueDate ?? invoice.issuedAt ?? invoice.createdAt, 'N/A'),
      status,
    }
  })

  const totalAmount = invoices.reduce((sum, invoice) => {
    const parsed = Number((invoice.amount.split(' ').at(-1) || '0').replace(/,/g, ''))
    return sum + (Number.isFinite(parsed) ? parsed : 0)
  }, 0)
  const issuedCount = invoices.filter((invoice) => invoice.status === 'Issued').length
  const paidCount = invoices.filter((invoice) => invoice.status === 'Paid').length
  const overdueCount = invoices.filter((invoice) => invoice.status === 'Overdue').length
  const collectionRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0

  return {
    metrics: [
      { id: 'revenue', label: 'Revenue', value: `${defaultCurrencyCode} ${Math.round(totalAmount).toLocaleString()}`, tone: 'default' },
      { id: 'collection-rate', label: 'Collection Rate', value: `${collectionRate}%`, tone: 'ok' },
      { id: 'outstanding', label: 'Outstanding', value: `${issuedCount + overdueCount}`, tone: overdueCount > 0 ? 'warning' : 'default' },
      { id: 'tax', label: 'Tax', value: `${defaultCurrencyCode} 0`, tone: 'default' },
    ],
    invoices,
    aging: [
      { label: 'Current', value: `${paidCount}` },
      { label: 'Issued', value: `${issuedCount}` },
      { label: 'Overdue', value: `${overdueCount}` },
    ],
    note: 'Billing data sourced from live backend invoices.',
    totalRevenueThisMonth: `${defaultCurrencyCode} ${Math.round(totalAmount).toLocaleString()}`,
  }
}

function normalizePayouts(value: unknown, defaultCurrencyCode: string): PayoutRecord[] {
  return asArray<Record<string, unknown>>(value).map((payout) => ({
    id: asString(payout.id, 'N/A'),
    period: asString(payout.period ?? payout.startedAt, 'N/A'),
    sessions: asNumber(payout.sessions, 0),
    amount: formatAmount(payout.amount, normalizeCurrencyCode(payout.currency, defaultCurrencyCode)),
    fee: formatAmount(payout.fee, normalizeCurrencyCode(payout.currency, defaultCurrencyCode)),
    net: formatAmount(payout.netAmount ?? payout.net ?? payout.amount, normalizeCurrencyCode(payout.currency, defaultCurrencyCode)),
    status: asString(payout.status).toLowerCase() === 'completed' ? 'Completed' : 'Processing',
  }))
}

function normalizeSettlement(value: unknown, defaultCurrencyCode: string): SettlementResponse {
  const rows = asArray<Record<string, unknown>>(value)
  const records = rows.map((entry) => {
    const normalizedStatus = asString(entry.status, 'reconciling').toLowerCase()
    const status: SettlementResponse['records'][number]['status'] =
      normalizedStatus === 'completed' || normalizedStatus === 'settled'
        ? 'Settled'
        : normalizedStatus === 'ready'
          ? 'Ready'
          : 'Reconciling'

    return {
      id: asString(entry.id, 'N/A'),
      partner: asString(entry.org ?? entry.partner ?? entry.region, 'N/A'),
      period: asString(entry.startedAt ?? entry.period, 'N/A'),
      netAmount: formatAmount(entry.amount, normalizeCurrencyCode(entry.currency, defaultCurrencyCode)),
      status,
    }
  })

  const readyCount = records.filter((record) => record.status === 'Ready').length
  const reconcilingCount = records.filter((record) => record.status === 'Reconciling').length
  const settledCount = records.filter((record) => record.status === 'Settled').length
  const exceptionCount = rows.filter((entry) => asString(entry.status).toLowerCase() === 'disputed').length

  return {
    metrics: [
      { id: 'ready', label: 'Ready', value: readyCount.toString(), tone: 'default' },
      { id: 'reconciling', label: 'Reconciling', value: reconcilingCount.toString(), tone: 'warning' },
      { id: 'settled', label: 'Settled', value: settledCount.toString(), tone: 'ok' },
      { id: 'exceptions', label: 'Exceptions', value: exceptionCount.toString(), tone: exceptionCount > 0 ? 'danger' : 'default' },
    ],
    records,
    exceptions: [],
    note: 'Settlement records sourced from live backend settlement feed.',
  }
}

function normalizeSmartCharging(value: unknown): SmartChargingResponse {
  const record = asRecord(value)
  return {
    metrics: Array.isArray(record.metrics) ? asArray<SmartChargingResponse['metrics'][number]>(record.metrics) : [],
    distribution: Array.isArray(record.distribution) ? asArray<SmartChargingResponse['distribution'][number]>(record.distribution) : [],
    loadProfile: Array.isArray(record.loadProfile) ? asArray<SmartChargingResponse['loadProfile'][number]>(record.loadProfile) : [],
    activeCurtailments: asNumber(record.activeCurtailments, 0),
    optimizer: (record.optimizer as SmartChargingResponse['optimizer']) ?? {
      selectedStrategy: 'Balanced',
      strategies: ['Balanced'],
      forecastTime: 'N/A',
      reductionPercent: 0,
      cta: 'Optimizer controls unavailable',
    },
  }
}

function normalizeRoamingPartners(value: unknown): RoamingPartnerRecord[] {
  return asArray<Record<string, unknown>>(value).map((partner) => ({
    id: asString(partner.id, 'N/A'),
    name: asString(partner.name, 'Unknown Partner'),
    country: asString(partner.countryCode ?? partner.country, 'N/A'),
    partyId: asString(partner.partyId, 'N/A'),
    status: asString(partner.status).toUpperCase() === 'ACTIVE' ? 'Connected' : 'Pending',
    type: asString(partner.role).toUpperCase() === 'HUB' ? 'HUB' : 'EMSP',
    version: asString(partner.version, 'N/A'),
    lastSync: asString(partner.lastSyncAt ?? partner.updatedAt, 'N/A'),
  }))
}

function normalizeObservability(value: unknown): RoamingPartnerObservabilityResponse {
  const partners = normalizeRoamingPartners(value).map((partner) => ({
    id: partner.id,
    deliveryStatus: 'Healthy' as const,
    successRate: 'N/A',
    callbackFailures24h: 0,
    retryQueueDepth: 0,
    totalEvents24h: 0,
    eventCoverage: [],
    lastEventAt: partner.lastSync,
    lastPartnerActivity: partner.lastSync,
  }))

  return {
    metrics: [],
    note: 'Partner observability stream not yet exposed by backend.',
    partners,
  }
}

function normalizeObservabilityDetail(value: unknown): RoamingPartnerObservabilityDetail {
  const record = asRecord(value)
  return {
    id: asString(record.id, 'N/A'),
    deliveryStatus: 'Healthy',
    successRate: 'N/A',
    callbackFailures24h: 0,
    retryQueueDepth: 0,
    totalEvents24h: 0,
    eventCoverage: [],
    lastEventAt: asString(record.updatedAt, 'N/A'),
    lastPartnerActivity: asString(record.updatedAt, 'N/A'),
    callbacks: {
      avgLatency: 'N/A',
      delivered24h: 0,
      failed24h: 0,
      lastDelivery: 'N/A',
      lastHttpStatus: 'N/A',
    },
    recentEvents: [],
    warnings: [],
  }
}

function normalizeRoamingSessions(): RoamingSessionsResponse {
  return {
    metrics: [],
    regionalReach: [],
    sessions: [],
    settlementAging: [],
  }
}

function normalizeCdrs(value: unknown, defaultCurrencyCode: string): OCPICdrsResponse {
  const records = asArray<Record<string, unknown>>(value).map((cdr) => ({
    id: asString(cdr.id, 'N/A'),
    partnerId: asString(cdr.partnerId, 'N/A'),
    emspName: asString(cdr.emspName, 'Unknown'),
    partyId: asString(cdr.partyId, 'N/A'),
    sessionId: asString(cdr.sessionId, 'N/A'),
    start: asString(cdr.startTime ?? cdr.start, 'N/A'),
    end: asString(cdr.endTime ?? cdr.end, 'N/A'),
    kwh: asNumber(cdr.kwh ?? cdr.totalEnergy, 0),
    totalCost: asNumber(cdr.totalCost ?? cdr.amount, 0).toFixed(0),
    currency: normalizeCurrencyCode(cdr.currency, defaultCurrencyCode),
    country: asString(cdr.country, 'N/A'),
    status: 'Sent' as const,
  }))

  return {
    metrics: [],
    records,
    automation: {
      cta: 'No automation controls available',
      text: 'OCPI CDR automation controls are not exposed by backend yet.',
    },
  }
}

function normalizeOcpiCommands(value: unknown): OCPICommandsResponse {
  const logs = asArray<Record<string, unknown>>(value).map((command) => ({
    id: asString(command.id, 'N/A'),
    command: asString(command.commandType, 'COMMAND'),
    partner: asString(command.partnerName, 'N/A'),
    partnerId: asString(command.partnerId, 'N/A'),
    time: asString(command.createdAt, 'N/A'),
    status: 'Accepted' as const,
    payload: JSON.stringify(command.payload ?? {}, null, 0),
  }))

  return {
    logs,
    partners: [],
  }
}

function normalizeReports(value: unknown): ReportsResponse {
  const record = asRecord(value)
  return {
    templates: Array.isArray(record.templates) ? asArray<ReportsResponse['templates'][number]>(record.templates) : [],
    periods: Array.isArray(record.periods) ? asArray<string>(record.periods) : [],
    recentExports: Array.isArray(record.recentExports) ? asArray<ReportsResponse['recentExports'][number]>(record.recentExports) : [],
    scheduledEmails: Array.isArray(record.scheduledEmails) ? asArray<ReportsResponse['scheduledEmails'][number]>(record.scheduledEmails) : [],
  }
}

function normalizeProtocolEngine(value: unknown): ProtocolEngineResponse {
  const record = asRecord(value)
  return {
    headline: asString(record.headline, 'Protocol engine summary'),
    implementationStage: 'Pilot',
    liveServicesDeployed: true,
    supportedVersions: asArray<string>(record.supportedVersions),
    plannedVersions: asArray<string>(record.plannedVersions),
    statusNote: asString(record.statusNote, 'Protocol diagnostics sourced from backend health telemetry.'),
    endpoints: asArray<ProtocolEngineResponse['endpoints'][number]>(record.endpoints),
    handshakeLogs: asArray<ProtocolEngineResponse['handshakeLogs'][number]>(record.handshakeLogs),
    complianceNote: asString(record.complianceNote, 'Compliance diagnostics not provided by backend.'),
  }
}

function normalizeIntegrations(value: unknown): IntegrationModuleResponse {
  const record = asRecord(value)
  return {
    metrics: asArray<IntegrationModuleResponse['metrics'][number]>(record.metrics),
    connections: asArray<IntegrationModuleResponse['connections'][number]>(record.connections),
    note: asString(record.note, 'Integration control-plane feed not provided by backend yet.'),
  }
}

function normalizeWebhooks(value: unknown): WebhooksModuleResponse {
  const record = asRecord(value)
  const endpoints = Array.isArray(record.endpoints)
    ? asArray<WebhooksModuleResponse['endpoints'][number]>(record.endpoints)
    : asArray<Record<string, unknown>>(value).map((webhook) => ({
      id: asString(webhook.id, 'N/A'),
      target: asString(webhook.url, 'N/A'),
      eventGroup: asString(webhook.eventType, 'General'),
      lastDelivery: asString(webhook.lastTriggeredAt, 'N/A'),
      signingStatus: asString(webhook.signingStatus, 'Unknown'),
      successRate: asString(webhook.successRate, 'N/A'),
      status: 'Healthy' as const,
    }))

  return {
    metrics: asArray<WebhooksModuleResponse['metrics'][number]>(record.metrics),
    endpoints,
    recentDeliveries: asArray<WebhooksModuleResponse['recentDeliveries'][number]>(record.recentDeliveries),
    note: asString(record.note, 'Webhook diagnostics sourced from backend webhook registry.'),
  }
}

function normalizeNotifications(value: unknown): NotificationsModuleResponse {
  const record = asRecord(value)
  return {
    metrics: asArray<NotificationsModuleResponse['metrics'][number]>(record.metrics),
    channels: asArray<NotificationsModuleResponse['channels'][number]>(record.channels),
    recentDispatches: asArray<NotificationsModuleResponse['recentDispatches'][number]>(record.recentDispatches),
    note: asString(record.note, 'Notification channel analytics are not provided by backend yet.'),
  }
}

function useTenantQueryContext(enabled = true) {
  const { activeScopeKey, isReady, activeTenant } = useTenant()

  return {
    enabled: enabled && isReady,
    currencyCode: normalizeCurrencyCode(activeTenant?.currency),
    scopeKey: activeScopeKey,
  }
}

export function useDemoUsers() {
  return useQuery<DemoUserHint[]>({
    queryKey: ['auth', 'demo-users'],
    // Backend has no public demo-users endpoint; keep frontend login hints local.
    queryFn: async () => FALLBACK_DEMO_USERS,
  })
}

export function useDashboardOverview(options?: { enabled?: boolean }) {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext(options?.enabled ?? true)

  return useQuery<DashboardOverviewResponse>({
    queryKey: ['dashboard', 'overview', scopeKey],
    queryFn: async () => {
      const [analytics, sessions, incidents] = await Promise.all([
        fetchJson<unknown>('/api/v1/analytics/dashboard'),
        fetchJson<unknown>('/api/v1/sessions/history/all').catch(() => []),
        fetchJson<unknown>('/api/v1/incidents').catch(() => []),
      ])

      return normalizeDashboardOverview(analytics, sessions, incidents, currencyCode)
    },
    enabled,
  })
}

export function useSiteOwnerDashboard(options?: { enabled?: boolean }) {
  const { enabled, scopeKey } = useTenantQueryContext(options?.enabled ?? true)

  return useQuery<SiteOwnerDashboardResponse>({
    queryKey: ['dashboard', 'site-owner', scopeKey],
    queryFn: async () => normalizeSiteOwnerDashboard(await fetchJson<unknown>('/api/v1/analytics/owner/dashboard')),
    enabled,
  })
}

export function useChargePoints() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<ChargePointSummary[]>({
    queryKey: ['charge-points', scopeKey],
    queryFn: async () => {
      const seen = new Set<string>()
      const records = asArray<unknown>(await fetchJson<unknown>('/api/v1/charge-points'))

      return records.map((record, index) => {
        const normalized = normalizeChargePointSummary(record, index)
        let stableId = normalized.id || `charge-point-${index + 1}`

        if (seen.has(stableId)) {
          stableId = `${stableId}-${index + 1}`
        }
        seen.add(stableId)

        return { ...normalized, id: stableId }
      })
    },
    enabled,
  })
}

export function useChargePoint(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id)

  return useQuery<ChargePointDetail>({
    queryKey: ['charge-points', scopeKey, id],
    queryFn: async () =>
      normalizeChargePointDetail(await fetchJson<unknown>(`/api/v1/charge-points/${id}`)),
    enabled,
  })
}

export function useCreateChargePoint() {
  const { scopeKey } = useTenantQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateChargePointRequest) =>
      fetchJson<unknown>('/api/v1/charge-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((value) => normalizeChargePointDetail(value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey] })
      queryClient.invalidateQueries({ queryKey: ['stations', scopeKey] })
    },
  })
}

export function useConfirmChargePointIdentity(id?: string) {
  const { scopeKey } = useTenantQueryContext(!!id)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConfirmChargePointIdentityRequest) =>
      fetchJson<unknown>(`/api/v1/charge-points/${id}/identity/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((value) => normalizeChargePointDetail(value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey] })
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey, id] })
      queryClient.invalidateQueries({ queryKey: ['stations', scopeKey] })
    },
  })
}

export function useChargePointPublication(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id)

  return useQuery<ChargePointPublicationResponse>({
    queryKey: ['charge-points', scopeKey, id, 'publication'],
    queryFn: async () =>
      fetchJson<ChargePointPublicationResponse>(`/api/v1/charge-points/${id}/publication`),
    enabled,
  })
}

export function useSetChargePointPublication(id?: string) {
  const { scopeKey } = useTenantQueryContext(!!id)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (published: boolean) =>
      fetchJson<ChargePointPublicationResponse>(`/api/v1/charge-points/${id}/publication`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey] })
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey, id] })
      queryClient.invalidateQueries({ queryKey: ['charge-points', scopeKey, id, 'publication'] })
      queryClient.invalidateQueries({ queryKey: ['stations', scopeKey] })
    },
  })
}

export function useSessions() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext()

  return useQuery<SessionRecord[]>({
    queryKey: ['sessions', scopeKey],
    queryFn: async () => normalizeSessionRecords(await fetchJson<unknown>('/api/v1/sessions/history/all'), currencyCode),
    enabled,
  })
}

export function useIncidentCommand() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<IncidentCommandResponse>({
    queryKey: ['incidents', 'command', scopeKey],
    queryFn: async () => normalizeIncidentCommand(await fetchJson<unknown>('/api/v1/incidents')),
    enabled,
  })
}

export function useAlerts() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<AlertRecord[]>({
    queryKey: ['alerts', scopeKey],
    queryFn: async () => normalizeAlerts(await fetchJson<unknown>('/api/v1/incidents')),
    enabled,
  })
}

export function useTariffs() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<TariffRecord[]>({
    queryKey: ['tariffs', scopeKey],
    queryFn: async () => asArray<TariffRecord>(await fetchJson<unknown>('/api/v1/tariffs')),
    enabled,
  })
}

export function useSmartCharging() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<SmartChargingResponse>({
    queryKey: ['energy', 'smart-charging', scopeKey],
    queryFn: async () => normalizeSmartCharging(await fetchJson<unknown>('/api/v1/analytics/realtime')),
    enabled,
  })
}

export function useLoadPolicies() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<LoadPolicyRecord[]>({
    queryKey: ['energy', 'load-policies', scopeKey],
    queryFn: async () => asArray<LoadPolicyRecord>(await fetchJson<unknown>('/api/v1/analytics/usage')),
    enabled,
  })
}

export function useRoamingPartners() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<RoamingPartnerRecord[]>({
    queryKey: ['roaming', 'partners', scopeKey],
    queryFn: async () => normalizeRoamingPartners(await fetchJson<unknown>('/api/v1/ocpi/partners')),
    enabled,
  })
}

export function useRoamingPartnerObservability() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<RoamingPartnerObservabilityResponse>({
    queryKey: ['roaming', 'partners', 'observability', scopeKey],
    queryFn: async () => normalizeObservability(await fetchJson<unknown>('/api/v1/ocpi/partners')),
    enabled,
  })
}

export function useRoamingPartnerObservabilityDetail(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id)

  return useQuery<RoamingPartnerObservabilityDetail>({
    queryKey: ['roaming', 'partners', 'observability', scopeKey, id],
    queryFn: async () => normalizeObservabilityDetail(await fetchJson<unknown>(`/api/v1/ocpi/partners/${id}`)),
    enabled,
  })
}

export function useRoamingSessions() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<RoamingSessionsResponse>({
    queryKey: ['roaming', 'sessions', scopeKey],
    queryFn: async () => {
      await fetchJson<unknown>('/api/v1/ocpi/actions/roaming-sessions')
      return normalizeRoamingSessions()
    },
    enabled,
  })
}

export function useOCPICdrs() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext()

  return useQuery<OCPICdrsResponse>({
    queryKey: ['roaming', 'cdrs', scopeKey],
    queryFn: async () => normalizeCdrs(await fetchJson<unknown>('/api/v1/ocpi/actions/roaming-cdrs'), currencyCode),
    enabled,
  })
}

export function useOCPICommands() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<OCPICommandsResponse>({
    queryKey: ['roaming', 'commands', scopeKey],
    queryFn: async () => normalizeOcpiCommands(await fetchJson<unknown>('/api/v1/commands')),
    enabled,
  })
}

export function usePlatformFeatureFlags() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<PlatformFeatureFlags>({
    queryKey: ['platform', 'feature-flags', scopeKey],
    queryFn: async () =>
      normalizeFeatureFlags(await fetchJson<unknown>('/api/v1/feature-flags').catch(() => [])),
    enabled,
  })
}

export function useBilling() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext()
  const { data: flags } = usePlatformFeatureFlags()
  const commerceEnabled = flags?.commerce_v1 ?? true

  return useQuery<BillingResponse>({
    queryKey: ['finance', 'billing', scopeKey, commerceEnabled],
    queryFn: async () => {
      if (!commerceEnabled) {
        return {
          metrics: [
            { id: 'revenue', label: 'Revenue', value: 'N/A', tone: 'default' },
            { id: 'collection-rate', label: 'Collection Rate', value: 'N/A', tone: 'ok' },
            { id: 'outstanding', label: 'Outstanding', value: '0', tone: 'default' },
            { id: 'tax', label: 'Tax', value: 'N/A', tone: 'default' },
          ],
          invoices: [],
          aging: [],
          note: 'Commerce phase flag is disabled for this tenant.',
          totalRevenueThisMonth: 'N/A',
        }
      }

      return normalizeBilling(await fetchJson<unknown>('/api/v1/billing/invoices'), currencyCode)
    },
    enabled,
  })
}

export function usePayouts() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext()
  const { data: flags } = usePlatformFeatureFlags()
  const commerceEnabled = flags?.commerce_v1 ?? true

  return useQuery<PayoutRecord[]>({
    queryKey: ['finance', 'payouts', scopeKey, commerceEnabled],
    queryFn: async () => {
      if (!commerceEnabled) {
        return []
      }
      return normalizePayouts(await fetchJson<unknown>('/api/v1/finance/payments'), currencyCode)
    },
    enabled,
  })
}

export function useSettlement() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext()
  const { data: flags } = usePlatformFeatureFlags()
  const commerceEnabled = flags?.commerce_v1 ?? true

  return useQuery<SettlementResponse>({
    queryKey: ['finance', 'settlement', scopeKey, commerceEnabled],
    queryFn: async () => {
      if (!commerceEnabled) {
        return {
          metrics: [
            { id: 'ready', label: 'Ready', value: '0', tone: 'default' },
            { id: 'reconciling', label: 'Reconciling', value: '0', tone: 'warning' },
            { id: 'settled', label: 'Settled', value: '0', tone: 'ok' },
            { id: 'exceptions', label: 'Exceptions', value: '0', tone: 'default' },
          ],
          records: [],
          exceptions: [],
          note: 'Commerce phase flag is disabled for this tenant.',
        }
      }
      return normalizeSettlement(await fetchJson<unknown>('/api/v1/settlements'), currencyCode)
    },
    enabled,
  })
}

export function useTeamMembers() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<TeamMember[]>({
    queryKey: ['team', scopeKey],
    queryFn: async () => normalizeTeamMembers(await fetchJson<unknown>('/api/v1/users/team')),
    enabled,
  })
}

export function useAuditLogs() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<AuditLogRecord[]>({
    queryKey: ['audit-logs', scopeKey],
    queryFn: async () => normalizeAuditLogs(await fetchJson<unknown>('/api/v1/audit-logs')),
    enabled,
  })
}

export function useReports() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<ReportsResponse>({
    queryKey: ['reports', scopeKey],
    queryFn: async () => normalizeReports(await fetchJson<unknown>('/api/v1/analytics/usage')),
    enabled,
  })
}

export function useProtocolEngine() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<ProtocolEngineResponse>({
    queryKey: ['protocols', scopeKey],
    queryFn: async () => normalizeProtocolEngine(await fetchJson<unknown>('/api/v1/analytics/system-health')),
    enabled,
  })
}

export function useIntegrationsModule() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<IntegrationModuleResponse>({
    queryKey: ['platform', 'integrations', scopeKey],
    queryFn: async () => normalizeIntegrations(await fetchJson<unknown>('/api/v1/analytics/system-health')),
    enabled,
  })
}

export function useWebhooksModule() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<WebhooksModuleResponse>({
    queryKey: ['platform', 'webhooks', scopeKey],
    queryFn: async () => normalizeWebhooks(await fetchJson<unknown>('/api/v1/webhooks')),
    enabled,
  })
}

export function useNotificationsModule() {
  const { enabled, scopeKey } = useTenantQueryContext()

  return useQuery<NotificationsModuleResponse>({
    queryKey: ['platform', 'notifications', scopeKey],
    queryFn: async () => normalizeNotifications(await fetchJson<unknown>('/api/v1/notifications')),
    enabled,
  })
}
