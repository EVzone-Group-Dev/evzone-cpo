import type { CPOUser } from '@/core/types/domain'
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointDetail,
  DashboardMode,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  LoadPolicyRecord,
  LoginResponse,
  ModuleNotice,
  OCPICdrsResponse,
  OCPICommandsResponse,
  PayoutRecord,
  ProtocolEngineResponse,
  ReportsResponse,
  RoamingPartnerRecord,
  RoamingSessionsResponse,
  SessionRecord,
  SettlementResponse,
  SiteOwnerDashboardResponse,
  SmartChargingResponse,
  StationDetail,
  TariffRecord,
  TeamMember,
  TenantContextResponse,
  TenantSummary,
} from '@/core/types/mockApi'

type TenantId = 'tenant-global' | 'tenant-evzone-ke' | 'tenant-westlands-mall'
type ModuleKey = 'integrations' | 'webhooks' | 'notifications'

interface DemoUserRecord extends DemoUserHint {
  defaultTenantId: TenantId
  tenantIds: TenantId[]
  user: CPOUser
}

interface TenantRecord extends Omit<TenantSummary, 'chargePointCount'> {
  dashboardMode: DashboardMode
  dataScopeLabel: string
}

type TenantScoped<T> = T & { tenantIds: TenantId[] }

const tenantCatalog: Record<TenantId, TenantRecord> = {
  'tenant-global': {
    id: 'tenant-global',
    code: 'GLOBAL',
    currency: 'Multi-currency',
    dashboardMode: 'operations',
    dataScopeLabel: 'Platform-wide visibility across all operating companies and hosted sites.',
    description: 'Global enterprise control plane for EVzone operations.',
    name: 'EVzone Global',
    region: 'Global',
    scope: 'platform',
    scopeLabel: 'Platform',
    siteCount: 4,
    slug: 'evzone-global',
    stationCount: 4,
    timeZone: 'UTC',
  },
  'tenant-evzone-ke': {
    id: 'tenant-evzone-ke',
    code: 'KE-CPO',
    currency: 'KES',
    dashboardMode: 'operations',
    dataScopeLabel: 'Operating company scope for EVzone Kenya public infrastructure.',
    description: 'Kenya operating company for public charging operations.',
    name: 'EVzone Kenya',
    region: 'Kenya',
    scope: 'organization',
    scopeLabel: 'Operating Company',
    siteCount: 3,
    slug: 'evzone-kenya',
    stationCount: 3,
    timeZone: 'Africa/Nairobi',
  },
  'tenant-westlands-mall': {
    id: 'tenant-westlands-mall',
    code: 'WML',
    currency: 'KES',
    dashboardMode: 'site',
    dataScopeLabel: 'Hosted-site scope limited to the Westlands Mall charging portfolio.',
    description: 'Hosted premium site tenant for Westlands Mall.',
    name: 'Westlands Mall Portfolio',
    region: 'Nairobi',
    scope: 'site',
    scopeLabel: 'Hosted Site',
    siteCount: 1,
    slug: 'westlands-mall-portfolio',
    stationCount: 1,
    timeZone: 'Africa/Nairobi',
  },
}

const demoUsers: DemoUserRecord[] = [
  {
    id: 'u1',
    name: 'Super Admin',
    email: 'admin@evzone.io',
    password: 'admin',
    role: 'SUPER_ADMIN',
    defaultTenantId: 'tenant-global',
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
    user: {
      id: 'u1',
      name: 'Super Admin',
      email: 'admin@evzone.io',
      role: 'SUPER_ADMIN',
      status: 'Active',
      mfaEnabled: true,
      createdAt: '2026-03-01T08:00:00.000Z',
    },
  },
  {
    id: 'u2',
    name: 'CPO Manager',
    email: 'manager@evzone.io',
    password: 'manager',
    role: 'CPO_ADMIN',
    defaultTenantId: 'tenant-evzone-ke',
    tenantIds: ['tenant-evzone-ke'],
    user: {
      id: 'u2',
      name: 'CPO Manager',
      email: 'manager@evzone.io',
      role: 'CPO_ADMIN',
      status: 'Active',
      organizationId: 'org-evzone-ke',
      mfaEnabled: true,
      createdAt: '2026-03-02T08:00:00.000Z',
    },
  },
  {
    id: 'u3',
    name: 'Field Operator',
    email: 'operator@evzone.io',
    password: 'operator',
    role: 'OPERATOR',
    defaultTenantId: 'tenant-westlands-mall',
    tenantIds: ['tenant-westlands-mall'],
    user: {
      id: 'u3',
      name: 'Field Operator',
      email: 'operator@evzone.io',
      role: 'OPERATOR',
      status: 'Active',
      organizationId: 'org-evzone-ke',
      assignedStationIds: ['st-1'],
      mfaEnabled: false,
      createdAt: '2026-03-03T08:00:00.000Z',
    },
  },
]

const chargePoints: Array<TenantScoped<ChargePointDetail>> = [
  {
    id: 'cp-1',
    stationId: 'st-1',
    stationName: 'Westlands Hub',
    model: 'ABB Terra 184',
    manufacturer: 'ABB',
    serialNumber: 'SN-001A',
    firmwareVersion: '1.4.2',
    ocppId: 'EVZ-WL-001',
    ocppVersion: '2.0.1',
    status: 'Online',
    ocppStatus: 'Charging',
    maxCapacityKw: 75,
    lastHeartbeatLabel: '12s ago',
    stale: false,
    roamingPublished: true,
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot'],
    unitHealth: { ocppConnection: 'Connected', lastHeartbeat: '12s ago', errorCode: 'NoError' },
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
  },
  {
    id: 'cp-2',
    stationId: 'st-1',
    stationName: 'Westlands Hub',
    model: 'ABB Terra 184',
    manufacturer: 'ABB',
    serialNumber: 'SN-001B',
    firmwareVersion: '1.4.2',
    ocppId: 'EVZ-WL-002',
    ocppVersion: '2.0.1',
    status: 'Online',
    ocppStatus: 'Available',
    maxCapacityKw: 75,
    lastHeartbeatLabel: '18s ago',
    stale: false,
    roamingPublished: true,
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot'],
    unitHealth: { ocppConnection: 'Connected', lastHeartbeat: '18s ago', errorCode: 'NoError' },
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
  },
  {
    id: 'cp-3',
    stationId: 'st-2',
    stationName: 'CBD Charging Station',
    model: 'Alfen Eve Pro',
    manufacturer: 'Alfen',
    serialNumber: 'SN-002A',
    firmwareVersion: '3.1.0',
    ocppId: 'EVZ-CBD-001',
    ocppVersion: '1.6J',
    status: 'Degraded',
    ocppStatus: 'Faulted',
    maxCapacityKw: 22,
    lastHeartbeatLabel: '7m ago',
    stale: true,
    roamingPublished: false,
    remoteCommands: ['Soft Reset', 'Hard Reboot'],
    unitHealth: { ocppConnection: 'Intermittent', lastHeartbeat: '7m ago', errorCode: 'ConnectorLockFailure' },
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
  },
  {
    id: 'cp-4',
    stationId: 'st-4',
    stationName: 'Garden City Mall',
    model: 'Wallbox Supernova',
    manufacturer: 'Wallbox',
    serialNumber: 'SN-004A',
    firmwareVersion: '1.0.9',
    ocppId: 'EVZ-GC-001',
    ocppVersion: '1.6J',
    status: 'Offline',
    ocppStatus: 'Unavailable',
    maxCapacityKw: 60,
    lastHeartbeatLabel: '1h ago',
    stale: true,
    roamingPublished: false,
    remoteCommands: ['Hard Reboot'],
    unitHealth: { ocppConnection: 'Disconnected', lastHeartbeat: '1h ago', errorCode: 'PowerLoss' },
    tenantIds: ['tenant-global'],
  },
]

const stations: Array<TenantScoped<StationDetail>> = [
  {
    id: 'st-1',
    name: 'Westlands Hub',
    status: 'Online',
    address: 'Westlands Avenue',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 150,
    lat: -1.2633,
    lng: 36.8045,
    chargePoints: [
      { id: 'cp-1', status: 'Charging', type: 'DC Fast', lastHeartbeatLabel: '12s ago' },
      { id: 'cp-2', status: 'Available', type: 'DC Fast', lastHeartbeatLabel: '18s ago' },
    ],
    uptimePercent30d: '99.4%',
    dailyAverageKwh: '142 kWh',
    geofenceStatus: 'Live Geofence Active',
    systemIntegrity: { firmwareVersion: 'v2.4.1-stable', ocppVersion: '2.0.1', slaCompliance: '100%' },
    networkLatency: { averageLabel: '1.2s avg', modeLabel: 'Real-time', points: [40, 60, 45, 80, 50, 30] },
    recentEvents: [
      { description: 'Heartbeat received', time: '2m ago' },
      { description: 'Remote start approved for connector A', time: '1h ago' },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
  },
  {
    id: 'st-2',
    name: 'CBD Charging Station',
    status: 'Degraded',
    address: 'Kenyatta Avenue',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 100,
    lat: -1.2863,
    lng: 36.8172,
    chargePoints: [{ id: 'cp-3', status: 'Faulted', type: 'AC Type 2', lastHeartbeatLabel: '7m ago' }],
    uptimePercent30d: '94.1%',
    dailyAverageKwh: '78 kWh',
    geofenceStatus: 'Monitoring Mode',
    systemIntegrity: { firmwareVersion: 'v3.1.0', ocppVersion: '1.6J', slaCompliance: '94%' },
    networkLatency: { averageLabel: '3.8s avg', modeLabel: 'Delayed', points: [55, 65, 72, 68, 74, 80] },
    recentEvents: [
      { description: 'Connector fault reported on CP-3', time: '6m ago' },
      { description: 'Maintenance ticket opened', time: '32m ago' },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
  },
  {
    id: 'st-3',
    name: 'Airport East',
    status: 'Online',
    address: 'Cargo Terminal Road',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 175,
    lat: -1.3198,
    lng: 36.9276,
    chargePoints: [],
    uptimePercent30d: '99.8%',
    dailyAverageKwh: '188 kWh',
    geofenceStatus: 'Live Geofence Active',
    systemIntegrity: { firmwareVersion: 'v2.7.1', ocppVersion: '2.0.1', slaCompliance: '100%' },
    networkLatency: { averageLabel: '0.9s avg', modeLabel: 'Real-time', points: [28, 32, 30, 34, 31, 33] },
    recentEvents: [
      { description: 'Roaming publication confirmed', time: '1h ago' },
      { description: 'Heartbeat received', time: '1m ago' },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
  },
  {
    id: 'st-4',
    name: 'Garden City Mall',
    status: 'Offline',
    address: 'Thika Superhighway',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 60,
    lat: -1.2318,
    lng: 36.8784,
    chargePoints: [{ id: 'cp-4', status: 'Unavailable', type: 'DC Fast', lastHeartbeatLabel: '1h ago' }],
    uptimePercent30d: '88.6%',
    dailyAverageKwh: '54 kWh',
    geofenceStatus: 'Geofence Offline',
    systemIntegrity: { firmwareVersion: 'v1.0.9', ocppVersion: '1.6J', slaCompliance: '89%' },
    networkLatency: { averageLabel: 'Offline', modeLabel: 'No telemetry', points: [10, 12, 8, 5, 6, 4] },
    recentEvents: [
      { description: 'Site power loss detected', time: '53m ago' },
      { description: 'Technician dispatched', time: '1h 10m ago' },
    ],
    tenantIds: ['tenant-global'],
  },
]

const sessions: Array<TenantScoped<SessionRecord>> = [
  { id: 'SES-001', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-28 08:14', ended: '2026-03-28 09:02', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Completed', method: 'App', emsp: 'EVzone eMSP', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'SES-002', station: 'CBD Charging Station', cp: 'EVZ-CBD-001', started: '2026-03-28 07:50', ended: null, energy: '31.0 kWh', amount: 'KES 1,860', status: 'Active', method: 'RFID', emsp: '-', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { id: 'SES-003', station: 'Garden City Mall', cp: 'EVZ-GC-001', started: '2026-03-28 10:00', ended: '2026-03-28 10:05', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID', emsp: '-', tenantIds: ['tenant-global'] },
]

const incidentRecords: Array<TenantScoped<IncidentCommandResponse['incidents'][number]>> = [
  {
    id: 'INC-2041',
    stationId: 'st-1',
    stationName: 'Westlands Hub',
    type: 'Communication Loss',
    severity: 'Major',
    status: 'Dispatched',
    reportedAt: '20m ago',
    assignedTech: 'David Karanja',
    situationAudit: 'Sensors detected intermittent packet loss at Westlands Hub.',
    serviceLog: [
      { title: 'Technician Assigned', note: 'Assigning David K. to the ticket.', active: true },
      { title: 'Ticket Created', note: 'Automated alert triggered by telemetry loss.', active: false },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
  },
  {
    id: 'INC-2042',
    stationId: 'st-2',
    stationName: 'CBD Charging Station',
    type: 'Hardware Failure',
    severity: 'Critical',
    status: 'Open',
    reportedAt: '5m ago',
    situationAudit: 'Grid voltage dropped below threshold and station relay failed to recover.',
    serviceLog: [
      { title: 'Awaiting Dispatch', note: 'No technician has accepted the task yet.', active: true },
      { title: 'Ticket Created', note: 'Automated alert triggered by grid instability.', active: false },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
  },
]

const alerts: Array<TenantScoped<AlertRecord>> = [
  { id: 'A-1', type: 'Critical', message: 'Garden City Mall station offline due to grid power fault', station: 'Garden City Mall', ts: '2026-03-28 05:02', acked: false, tenantIds: ['tenant-global'] },
  { id: 'A-2', type: 'Warning', message: 'Load at 92% of grid limit at Westlands Hub', station: 'Westlands Hub', ts: '2026-03-28 08:45', acked: false, tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'A-3', type: 'Info', message: 'Roaming partner sync complete', station: '-', ts: '2026-03-28 09:00', acked: true, tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
]

const tariffs: Array<TenantScoped<TariffRecord>> = [
  { id: 'T-1', name: 'Standard Day Rate', type: 'Energy', currency: 'KES', pricePerKwh: 60, active: true, tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'T-2', name: 'Peak Hours Premium', type: 'Mixed', currency: 'KES', pricePerKwh: 85, active: true, tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'T-3', name: 'Roaming Partner Rate', type: 'Energy', currency: 'KES', pricePerKwh: 70, active: true, tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
]

const loadPolicies: Array<TenantScoped<LoadPolicyRecord>> = [
  { id: 'LP-1', name: 'Westlands Hub Default', station: 'Westlands Hub', maxLoadKw: 80, curtailment: 95, priority: 'FIFO', active: true, tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'LP-2', name: 'Airport Peak Hours', station: 'Airport East', maxLoadKw: 150, curtailment: 90, priority: 'Priority', active: true, tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
]

const roamingPartners: Array<TenantScoped<RoamingPartnerRecord>> = [
  { id: 'p1', name: 'Plugsurfing BV', type: 'EMSP', status: 'Connected', country: 'NL', partyId: 'PLG', lastSync: '2026-03-28 14:20', version: '2.2.1', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'p2', name: 'Hubject GmbH', type: 'HUB', status: 'Connected', country: 'DE', partyId: 'HBJ', lastSync: '2026-03-28 15:45', version: '2.2.1', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
]

const payouts: Array<TenantScoped<PayoutRecord>> = [
  { id: 'PAY-G-1', period: 'Mar 1-15, 2026', amount: 'KES 2,108,400', fee: 'KES 210,840', net: 'KES 1,897,560', status: 'Completed', sessions: 1420, tenantIds: ['tenant-global'] },
  { id: 'PAY-G-2', period: 'Mar 16-31, 2026', amount: 'KES 2,175,800', fee: 'KES 217,580', net: 'KES 1,958,220', status: 'Processing', sessions: 1505, tenantIds: ['tenant-global'] },
  { id: 'PAY-KE-1', period: 'Mar 1-15, 2026', amount: 'KES 1,608,400', fee: 'KES 160,840', net: 'KES 1,447,560', status: 'Completed', sessions: 1120, tenantIds: ['tenant-evzone-ke'] },
  { id: 'PAY-WML-1', period: 'Mar 1-15, 2026', amount: 'KES 198,400', fee: 'KES 19,840', net: 'KES 178,560', status: 'Completed', sessions: 164, tenantIds: ['tenant-westlands-mall'] },
]

const team: Array<TenantScoped<TeamMember>> = [
  { name: 'John Kamau', email: 'john@evzone.io', role: 'STATION_MANAGER', status: 'Active', lastSeen: '2 min ago', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { name: 'Grace Otieno', email: 'grace@evzone.io', role: 'TECHNICIAN', status: 'Active', lastSeen: '1 hr ago', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { name: 'Martha Wanjiku', email: 'martha@westlandsmall.com', role: 'SITE_HOST', status: 'Active', lastSeen: '28 min ago', tenantIds: ['tenant-westlands-mall'] },
]

const auditLogs: Array<TenantScoped<AuditLogRecord>> = [
  { actor: 'admin@evzone.io', action: 'REMOTE_RESET', target: 'CP EVZ-WL-003', ts: '2026-03-28 09:14', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { actor: 'manager@evzone.io', action: 'TARIFF_UPDATED', target: 'Night Smart Rate', ts: '2026-03-28 08:50', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { actor: 'operator@evzone.io', action: 'SITE_CHECKLIST_COMPLETED', target: 'Westlands Hub opening checklist', ts: '2026-03-28 07:42', tenantIds: ['tenant-westlands-mall'] },
]

function stripTenantIds<T extends { tenantIds: TenantId[] }>(record: T): Omit<T, 'tenantIds'> {
  const { tenantIds, ...rest } = record
  void tenantIds
  return rest
}

function listTenantScoped<T extends { tenantIds: TenantId[] }>(records: T[], tenantId: TenantId): Array<Omit<T, 'tenantIds'>> {
  return records.filter((record) => record.tenantIds.includes(tenantId)).map(stripTenantIds)
}

function makeDashboardOverview(
  activeSessions: string,
  revenueToday: string,
  chargePointStatus: string,
  incidentCount: string,
  recentSessions: DashboardOverviewResponse['recentSessions'],
  recentIncidents: DashboardOverviewResponse['recentIncidents'],
): DashboardOverviewResponse {
  return {
    kpis: [
      { id: 'kpi-1', label: 'Active Sessions', value: activeSessions, delta: '+8 vs yesterday', trend: 'up', iconKey: 'activity' },
      { id: 'kpi-2', label: 'Charge Points Online', value: chargePointStatus, delta: 'Tenant scoped', trend: 'up', iconKey: 'charge-points' },
      { id: 'kpi-3', label: 'Energy Today (kWh)', value: '3,408', delta: '+6.4% vs avg', trend: 'up', iconKey: 'energy' },
      { id: 'kpi-4', label: 'Revenue Today', value: revenueToday, delta: '+4.3% vs avg', trend: 'up', iconKey: 'revenue' },
      { id: 'kpi-5', label: 'Open Incidents', value: incidentCount, delta: 'Tenant scoped', trend: 'down', iconKey: 'incidents' },
      { id: 'kpi-6', label: 'Roaming Sessions', value: '18', delta: '2 OCPI partners', trend: 'up', iconKey: 'roaming' },
      { id: 'kpi-7', label: 'Grid Load', value: '81%', delta: 'Peak shaving active', trend: 'down', iconKey: 'load' },
      { id: 'kpi-8', label: 'Active Operators', value: '7', delta: '2 on field', trend: 'up', iconKey: 'operators' },
    ],
    recentSessions,
    recentIncidents,
  }
}

function makeSiteOwnerDashboard(title: string, subtitle: string, revenueValue: string, alertMessage: string): SiteOwnerDashboardResponse {
  return {
    title,
    subtitle,
    metrics: [
      { id: 'revenue', label: 'Total Revenue', value: revenueValue, delta: '+18.4%', trend: 'up', note: 'vs last week' },
      { id: 'uptime', label: 'Uptime Avg', value: '99.8%', delta: '+0.2%', trend: 'up', note: 'SLA compliant' },
      { id: 'utilisation', label: 'Utilisation', value: '42%', delta: '-5.1%', trend: 'down', note: 'Peak: 12pm-4pm' },
      { id: 'energy', label: 'Total Energy', value: '1.2 MWh', delta: 'Active since Nov 2025', trend: 'neutral', note: 'Hosted network' },
    ],
    revenueData: [
      { day: 'Mon', rev: 1200 },
      { day: 'Tue', rev: 1800 },
      { day: 'Wed', rev: 1400 },
      { day: 'Thu', rev: 2200 },
      { day: 'Fri', rev: 2800 },
      { day: 'Sat', rev: 3200 },
      { day: 'Sun', rev: 2100 },
    ],
    topUnits: [
      { id: 'W-001', loc: 'Entrance A (Level 1)', status: 'Online', sessions: 142, rev: '4,280' },
      { id: 'W-002', loc: 'Basement Parking 1', status: 'Online', sessions: 98, rev: '3,120' },
      { id: 'W-003', loc: 'East Wing Premium', status: 'Online', sessions: 155, rev: '5,400' },
    ],
    optimizationTip: {
      title: 'Optimization Tip',
      text: 'Peak demand is clustering in the late afternoon. Smart pricing would increase margin without adding hardware.',
      cta: 'Apply Smart Pricing',
    },
    alerts: [
      { id: 1, type: 'Issue', msg: alertMessage, time: '2h ago' },
      { id: 2, type: 'Info', msg: 'Monthly settlement is ready for review.', time: '1d ago' },
    ],
  }
}

function makeSmartCharging(load: string, cap: string, sessionsValue: string, strategy: string): SmartChargingResponse {
  return {
    metrics: [
      { id: 'load', label: 'Current Load', value: load, tone: 'default' },
      { id: 'cap', label: 'Grid Cap', value: cap, tone: 'default' },
      { id: 'utilisation', label: 'Utilisation', value: '81%', tone: 'ok' },
      { id: 'sessions', label: 'Active Sessions', value: sessionsValue, tone: 'default' },
    ],
    loadProfile: [
      { time: '00:00', load: 35, cap: 150 },
      { time: '08:00', load: 97, cap: 150 },
      { time: '12:00', load: 136, cap: 150 },
      { time: '20:00', load: 131, cap: 150 },
    ],
    distribution: [
      { label: 'Priority Fleet', val: 61, colorKey: 'accent' },
      { label: 'Public Charging', val: 42, colorKey: 'ok' },
      { label: 'System Overhead', val: 18, colorKey: 'warning' },
    ],
    activeCurtailments: 1,
    optimizer: {
      forecastTime: '18:10',
      reductionPercent: 11,
      selectedStrategy: strategy,
      strategies: [strategy, 'Aggressive Peak Shaving'],
      cta: 'Review Strategy',
    },
  }
}

const dashboardOverviewByTenant: Record<TenantId, DashboardOverviewResponse> = {
  'tenant-global': makeDashboardOverview(
    '148',
    'KES 142,400',
    '312 / 340',
    '7',
    [
      { id: 'S-001', station: 'Westlands Hub', cp: 'CP-003', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Active', method: 'App' },
      { id: 'S-002', station: 'CBD Charging Station', cp: 'CP-011', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'RFID' },
      { id: 'S-003', station: 'Garden City Mall', cp: 'CP-001', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID' },
    ],
    [
      { id: 'INC-044', station: 'Westlands Hub', severity: 'High', title: 'CP-003 connector fault', status: 'Open' },
      { id: 'INC-043', station: 'CBD Charging Station', severity: 'Medium', title: 'Heartbeat timeout CP-011', status: 'Acknowledged' },
    ],
  ),
  'tenant-evzone-ke': makeDashboardOverview(
    '91',
    'KES 94,200',
    '3 / 4',
    '4',
    [
      { id: 'S-001', station: 'Westlands Hub', cp: 'CP-003', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Active', method: 'App' },
      { id: 'S-002', station: 'CBD Charging Station', cp: 'CP-011', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'RFID' },
    ],
    [
      { id: 'INC-044', station: 'Westlands Hub', severity: 'High', title: 'CP-003 connector fault', status: 'Open' },
      { id: 'INC-043', station: 'CBD Charging Station', severity: 'Medium', title: 'Heartbeat timeout CP-011', status: 'Acknowledged' },
    ],
  ),
  'tenant-westlands-mall': makeDashboardOverview(
    '12',
    'KES 12,800',
    '2 / 2',
    '1',
    [
      { id: 'S-001', station: 'Westlands Hub', cp: 'CP-001', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Active', method: 'App' },
    ],
    [
      { id: 'INC-044', station: 'Westlands Hub', severity: 'High', title: 'Communication lag on cabinet 2', status: 'Open' },
    ],
  ),
}

const siteOwnerDashboardByTenant: Record<TenantId, SiteOwnerDashboardResponse> = {
  'tenant-global': makeSiteOwnerDashboard('Global Hosted Portfolio', 'Hosted performance across premium locations.', 'KES 214.8K', 'Garden City: Power instability detected.'),
  'tenant-evzone-ke': makeSiteOwnerDashboard('EVzone Kenya Hosted Portfolio', 'Property and hosted-site performance inside Kenya operations.', 'KES 94.8K', 'Westlands: Communication lag detected.'),
  'tenant-westlands-mall': makeSiteOwnerDashboard('Westlands Mall Portfolio', 'Real-time performance for your hosted charging infrastructure.', 'KES 14.8K', 'W-002: Communication lag detected.'),
}

const smartChargingByTenant: Record<TenantId, SmartChargingResponse> = {
  'tenant-global': makeSmartCharging('148 kW', '180 kW', '18', 'Grid-Interactive (Standard)'),
  'tenant-evzone-ke': makeSmartCharging('121 kW', '150 kW', '11', 'Grid-Interactive (Standard)'),
  'tenant-westlands-mall': makeSmartCharging('64 kW', '80 kW', '3', 'Property-Safe Load Balancing'),
}

const roamingSessionsByTenant: Record<TenantId, RoamingSessionsResponse> = {
  'tenant-global': {
    metrics: [
      { id: 'incoming', label: 'Incoming Traffic', value: 'KES 124K', note: '+12% vs last month', tone: 'accent' },
      { id: 'authorized', label: 'Authorized Tokens', value: '842', note: 'Cross-platform verified', tone: 'ok' },
      { id: 'utilisation', label: 'Roaming Utilization', value: '34%', note: 'Grid share: 450 kW', tone: 'warning' },
    ],
    sessions: [
      { id: 'RS-901', stationName: 'Westlands Hub', emspName: 'Plugsurfing', partyId: 'PLG', status: 'Active', startTime: '10m ago', energy: 12.5, amount: 'KES 375' },
      { id: 'RS-902', stationName: 'CBD Charging Station', emspName: 'Hubject', partyId: 'HBJ', status: 'Active', startTime: '45m ago', energy: 34.2, amount: 'KES 1,026' },
    ],
    regionalReach: [{ region: 'East Africa', count: 420 }, { region: 'Europe', count: 1250 }],
    settlementAging: [30, 50, 70, 40, 90, 60, 40],
  },
  'tenant-evzone-ke': {
    metrics: [
      { id: 'incoming', label: 'Incoming Traffic', value: 'KES 96K', note: '+9% vs last month', tone: 'accent' },
      { id: 'authorized', label: 'Authorized Tokens', value: '611', note: 'National roaming enabled', tone: 'ok' },
      { id: 'utilisation', label: 'Roaming Utilization', value: '28%', note: 'Operational stations only', tone: 'warning' },
    ],
    sessions: [
      { id: 'RS-901', stationName: 'Westlands Hub', emspName: 'Plugsurfing', partyId: 'PLG', status: 'Active', startTime: '10m ago', energy: 12.5, amount: 'KES 375' },
    ],
    regionalReach: [{ region: 'Kenya Domestic', count: 420 }, { region: 'Cross-border Direct', count: 180 }],
    settlementAging: [28, 41, 53, 37, 66, 44, 31],
  },
  'tenant-westlands-mall': {
    metrics: [
      { id: 'incoming', label: 'Incoming Traffic', value: 'KES 18K', note: 'Single premium site', tone: 'accent' },
      { id: 'authorized', label: 'Authorized Tokens', value: '96', note: 'Hosted roaming available', tone: 'ok' },
      { id: 'utilisation', label: 'Roaming Utilization', value: '22%', note: 'Focused on mall traffic', tone: 'warning' },
    ],
    sessions: [
      { id: 'RS-901', stationName: 'Westlands Hub', emspName: 'Plugsurfing', partyId: 'PLG', status: 'Active', startTime: '10m ago', energy: 12.5, amount: 'KES 375' },
    ],
    regionalReach: [{ region: 'Hosted Site Roaming', count: 96 }, { region: 'Partner Walk-ins', count: 42 }],
    settlementAging: [18, 21, 24, 19, 22, 18, 16],
  },
}

const ocpiCdrsByTenant: Record<TenantId, OCPICdrsResponse> = {
  'tenant-global': {
    metrics: [
      { id: 'total', label: 'Total CDRs', value: '1,248', tone: 'default' },
      { id: 'awaiting', label: 'Awaiting Settlement', value: '142', tone: 'warning' },
      { id: 'revenue', label: 'Total Revenue', value: 'KES 842K', tone: 'default' },
      { id: 'error-rate', label: 'Error Rate', value: '0.4%', tone: 'ok' },
    ],
    records: [
      { id: 'CDR-29481', sessionId: 'SES-9120', emspName: 'Plugsurfing', partyId: 'PLG', country: 'NL', start: '2026-03-28 10:15', end: '2026-03-28 11:20', kwh: 42.5, totalCost: '1,240.00', currency: 'KES', status: 'Settled' },
      { id: 'CDR-29482', sessionId: 'SES-9125', emspName: 'Hubject', partyId: 'HBJ', country: 'DE', start: '2026-03-28 14:02', end: '2026-03-28 14:45', kwh: 18.2, totalCost: '546.00', currency: 'KES', status: 'Accepted' },
    ],
    automation: { text: 'CDRs are shared automatically with roaming partners after session completion.', cta: 'Review Global Rules' },
  },
  'tenant-evzone-ke': {
    metrics: [
      { id: 'total', label: 'Total CDRs', value: '842', tone: 'default' },
      { id: 'awaiting', label: 'Awaiting Settlement', value: '88', tone: 'warning' },
      { id: 'revenue', label: 'Total Revenue', value: 'KES 566K', tone: 'default' },
      { id: 'error-rate', label: 'Error Rate', value: '0.5%', tone: 'ok' },
    ],
    records: [
      { id: 'CDR-29481', sessionId: 'SES-9120', emspName: 'Plugsurfing', partyId: 'PLG', country: 'NL', start: '2026-03-28 10:15', end: '2026-03-28 11:20', kwh: 42.5, totalCost: '1,240.00', currency: 'KES', status: 'Settled' },
    ],
    automation: { text: 'Kenya roaming CDRs are isolated to EVzone Kenya operations.', cta: 'Review Kenya Rules' },
  },
  'tenant-westlands-mall': {
    metrics: [
      { id: 'total', label: 'Total CDRs', value: '96', tone: 'default' },
      { id: 'awaiting', label: 'Awaiting Settlement', value: '11', tone: 'warning' },
      { id: 'revenue', label: 'Total Revenue', value: 'KES 68K', tone: 'default' },
      { id: 'error-rate', label: 'Error Rate', value: '0.1%', tone: 'ok' },
    ],
    records: [
      { id: 'CDR-29481', sessionId: 'SES-9120', emspName: 'Plugsurfing', partyId: 'PLG', country: 'NL', start: '2026-03-28 10:15', end: '2026-03-28 11:20', kwh: 42.5, totalCost: '1,240.00', currency: 'KES', status: 'Settled' },
    ],
    automation: { text: 'Hosted-site CDRs stay isolated to the Westlands Mall tenant.', cta: 'Review Hosted Rules' },
  },
}

const ocpiCommandsByTenant: Record<TenantId, OCPICommandsResponse> = {
  'tenant-global': {
    partners: [{ id: 'plugsurfing', label: 'Plugsurfing (PLG)' }, { id: 'hubject', label: 'Hubject (HBJ)' }],
    logs: [
      { id: '1', time: '14:20:10', command: 'START_SESSION', partner: 'Plugsurfing', status: 'Accepted', payload: '{ "location_id": "LOC-1" }' },
      { id: '2', time: '14:25:45', command: 'STOP_SESSION', partner: 'Hubject', status: 'Rejected', payload: '{ "session_id": "SES-91" }' },
    ],
  },
  'tenant-evzone-ke': {
    partners: [{ id: 'plugsurfing', label: 'Plugsurfing (PLG)' }, { id: 'hubject', label: 'Hubject (HBJ)' }],
    logs: [{ id: '1', time: '14:20:10', command: 'START_SESSION', partner: 'Plugsurfing', status: 'Accepted', payload: '{ "location_id": "EVZ-WL" }' }],
  },
  'tenant-westlands-mall': {
    partners: [{ id: 'plugsurfing', label: 'Plugsurfing (PLG)' }],
    logs: [{ id: '1', time: '14:20:10', command: 'START_SESSION', partner: 'Plugsurfing', status: 'Accepted', payload: '{ "location_id": "WML-ENTRANCE-A" }' }],
  },
}

const billingByTenant: Record<TenantId, BillingResponse> = {
  'tenant-global': { totalRevenueThisMonth: 'KES 4,284,200', note: 'Global billing rollup across every active tenant.' },
  'tenant-evzone-ke': { totalRevenueThisMonth: 'KES 3,112,800', note: 'Kenya billing is scoped to EVzone Kenya stations and roaming.' },
  'tenant-westlands-mall': { totalRevenueThisMonth: 'KES 428,400', note: 'Hosted-site billing reflects Westlands Mall only.' },
}

const settlementByTenant: Record<TenantId, SettlementResponse> = {
  'tenant-global': { note: 'Settlement rolls up tenant-isolated partner cycles.', records: [{ id: 'SET-1', partner: 'Hubject', period: 'Mar 1-15, 2026', netAmount: 'KES 684,220', status: 'Settled' }, { id: 'SET-2', partner: 'Plugsurfing', period: 'Mar 16-31, 2026', netAmount: 'KES 518,900', status: 'Reconciling' }] },
  'tenant-evzone-ke': { note: 'Settlement is isolated to EVzone Kenya counterparties.', records: [{ id: 'SET-KE-1', partner: 'Hubject', period: 'Mar 1-15, 2026', netAmount: 'KES 484,220', status: 'Settled' }] },
  'tenant-westlands-mall': { note: 'Hosted settlement reflects the Westlands Mall revenue-share agreement.', records: [{ id: 'SET-WML-1', partner: 'Westlands Mall Revenue Share', period: 'Mar 1-15, 2026', netAmount: 'KES 148,220', status: 'Settled' }] },
}

const reportsByTenant: Record<TenantId, ReportsResponse> = {
  'tenant-global': { templates: [{ id: 'revenue-summary', label: 'Monthly Revenue Summary' }, { id: 'uptime-sla', label: 'Infrastructure Uptime (SLA)' }], periods: ['March 2026', 'February 2026'], scheduledEmails: [{ label: 'Weekly Executive Summary', enabled: true }], recentExports: [{ name: 'Revenue_MAR_26.csv', type: 'Financial', size: '2.4 MB', time: '10m ago' }] },
  'tenant-evzone-ke': { templates: [{ id: 'ke-revenue-summary', label: 'Kenya Revenue Summary' }, { id: 'ke-uptime', label: 'Kenya Uptime (SLA)' }], periods: ['March 2026', 'February 2026'], scheduledEmails: [{ label: 'Kenya Leadership Summary', enabled: true }], recentExports: [{ name: 'KE_Revenue_MAR_26.csv', type: 'Financial', size: '1.3 MB', time: '18m ago' }] },
  'tenant-westlands-mall': { templates: [{ id: 'site-revenue', label: 'Hosted Site Revenue Summary' }, { id: 'site-utilization', label: 'Hosted Site Utilization' }], periods: ['March 2026', 'February 2026'], scheduledEmails: [{ label: 'Westlands Property Summary', enabled: true }], recentExports: [{ name: 'WML_Revenue_MAR_26.csv', type: 'Financial', size: '420 KB', time: '42m ago' }] },
}

const protocolsByTenant: Record<TenantId, ProtocolEngineResponse> = {
  'tenant-global': {
    headline: 'OCPI Contract Bench',
    implementationStage: 'Mock Bench',
    liveServicesDeployed: false,
    supportedVersions: ['2.2.1'],
    plannedVersions: ['2.3'],
    statusNote: 'Endpoints shown here are mock contract surfaces and handshake simulations, not deployed OCPI services.',
    endpoints: [
      { module: 'Credentials', url: '/ocpi/cpo/2.2.1/credentials', status: 'Online' },
      { module: 'Sessions', url: '/ocpi/cpo/2.2.1/sessions', status: 'Online' },
    ],
    handshakeLogs: [
      { level: 'info', message: '[14:20:01] INFO: Initializing global protocol checks' },
      { level: 'warning', message: '[14:20:04] NOTE: Mock bench mode; no live OCPI peer is connected.' },
      { level: 'accent', message: '[14:20:07] SUCCESS: Contract validation completed.' },
    ],
    complianceNote: 'Global protocol bench passed tenant-aware isolation checks against the mocked contract surface.',
  },
  'tenant-evzone-ke': {
    headline: 'Tenant OCPI Contract Bench',
    implementationStage: 'Mock Bench',
    liveServicesDeployed: false,
    supportedVersions: ['2.2.1'],
    plannedVersions: ['2.3'],
    statusNote: 'The Kenya tenant exposes mocked OCPI contracts only. Production credentials exchange and transport services are not deployed yet.',
    endpoints: [
      { module: 'Credentials', url: '/ocpi/ke/2.2.1/credentials', status: 'Online' },
      { module: 'Sessions', url: '/ocpi/ke/2.2.1/sessions', status: 'Online' },
    ],
    handshakeLogs: [
      { level: 'info', message: '[15:01:11] INFO: Validating EVzone Kenya tenant OCPI credentials...' },
      { level: 'warning', message: '[15:01:12] NOTE: Running against MSW contract fixtures only.' },
      { level: 'accent', message: '[15:01:13] SUCCESS: Tenant-scoped contract validation responded normally.' },
    ],
    complianceNote: 'Kenya tenant OCPI routes are isolated from other tenants, but still operate as mocked contract endpoints.',
  },
  'tenant-westlands-mall': {
    headline: 'Hosted-Site OCPI Contract Bench',
    implementationStage: 'Mock Bench',
    liveServicesDeployed: false,
    supportedVersions: ['2.2.1'],
    plannedVersions: ['2.3'],
    statusNote: 'Hosted-site protocol visibility is simulated for tenant isolation checks only. No live OCPI service has been deployed for this portfolio.',
    endpoints: [
      { module: 'Locations', url: '/ocpi/wml/2.2.1/locations', status: 'Online' },
      { module: 'Sessions', url: '/ocpi/wml/2.2.1/sessions', status: 'Online' },
    ],
    handshakeLogs: [
      { level: 'info', message: '[15:22:41] INFO: Verifying hosted-site partner visibility...' },
      { level: 'warning', message: '[15:22:42] NOTE: Contract bench mode is active; transport and auth are mocked.' },
      { level: 'accent', message: '[15:22:43] SUCCESS: Westlands hosted endpoints are tenant-isolated in the mock bench.' },
    ],
    complianceNote: 'Hosted-site protocol exposure is limited to the Westlands Mall tenant in the mock contract bench.',
  },
}

function getChargePointCount(tenantId: TenantId) {
  return chargePoints.filter((record) => record.tenantIds.includes(tenantId)).length
}

function getTokenValue(authorizationHeader?: string | null) {
  if (!authorizationHeader) return null
  return authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice('Bearer '.length) : authorizationHeader
}

function getDemoUserByToken(token: string | null) {
  if (!token) return null
  return demoUsers.find((user) => `demo-token-${user.id}` === token) ?? null
}

function getTenantSummary(tenantId: TenantId): TenantSummary {
  return {
    ...tenantCatalog[tenantId],
    chargePointCount: getChargePointCount(tenantId),
  }
}

export function authenticateDemoUser(email: string, password: string): LoginResponse | null {
  const match = demoUsers.find((user) => user.email === email && user.password === password)
  return match ? { token: `demo-token-${match.id}`, user: match.user } : null
}

export function getDemoUserHints(): DemoUserHint[] {
  return demoUsers.map(({ id, name, email, password, role }) => ({ id, name, email, password, role }))
}

export function resolveTenantContext(authorizationHeader?: string | null, requestedTenantId?: string | null): TenantContextResponse | null {
  const demoUser = getDemoUserByToken(getTokenValue(authorizationHeader))
  if (!demoUser) return null

  const activeTenantId = demoUser.tenantIds.includes(requestedTenantId as TenantId)
    ? requestedTenantId as TenantId
    : demoUser.defaultTenantId

  return {
    activeTenant: getTenantSummary(activeTenantId),
    availableTenants: demoUser.tenantIds.map(getTenantSummary),
    canSwitchTenants: demoUser.tenantIds.length > 1,
    dashboardMode: tenantCatalog[activeTenantId].dashboardMode,
    dataScopeLabel: tenantCatalog[activeTenantId].dataScopeLabel,
  }
}

export function getDashboardOverview(tenantId: TenantId) { return dashboardOverviewByTenant[tenantId] }
export function getSiteOwnerDashboard(tenantId: TenantId) { return siteOwnerDashboardByTenant[tenantId] }
export function listStations(tenantId: TenantId) { return listTenantScoped(stations, tenantId) }
export function getStationById(id: string, tenantId: TenantId) { const station = stations.find((record) => record.id === id && record.tenantIds.includes(tenantId)); return station ? stripTenantIds(station) : undefined }
export function listChargePoints(tenantId: TenantId) { return listTenantScoped(chargePoints, tenantId) }
export function getChargePointById(id: string, tenantId: TenantId) { const chargePoint = chargePoints.find((record) => record.id === id && record.tenantIds.includes(tenantId)); return chargePoint ? stripTenantIds(chargePoint) : undefined }
export function listSessions(tenantId: TenantId) { return listTenantScoped(sessions, tenantId) }
export function listAlerts(tenantId: TenantId) { return listTenantScoped(alerts, tenantId) }
export function listTariffs(tenantId: TenantId) { return listTenantScoped(tariffs, tenantId) }
export function getSmartCharging(tenantId: TenantId) { return smartChargingByTenant[tenantId] }
export function listLoadPolicies(tenantId: TenantId) { return listTenantScoped(loadPolicies, tenantId) }
export function listRoamingPartners(tenantId: TenantId) { return listTenantScoped(roamingPartners, tenantId) }
export function getRoamingSessions(tenantId: TenantId) { return roamingSessionsByTenant[tenantId] }
export function getOCPICdrs(tenantId: TenantId) { return ocpiCdrsByTenant[tenantId] }
export function getOCPICommands(tenantId: TenantId) { return ocpiCommandsByTenant[tenantId] }
export function getBilling(tenantId: TenantId) { return billingByTenant[tenantId] }
export function listPayouts(tenantId: TenantId) { return listTenantScoped(payouts, tenantId) }
export function getSettlement(tenantId: TenantId) { return settlementByTenant[tenantId] }
export function listTeamMembers(tenantId: TenantId) { return listTenantScoped(team, tenantId) }
export function listAuditLogs(tenantId: TenantId) { return listTenantScoped(auditLogs, tenantId) }
export function getReports(tenantId: TenantId) { return reportsByTenant[tenantId] }
export function getProtocolEngine(tenantId: TenantId) { return protocolsByTenant[tenantId] }

export function getIncidentCommand(tenantId: TenantId): IncidentCommandResponse {
  const incidents = listTenantScoped(incidentRecords, tenantId)

  return {
    stats: tenantId === 'tenant-westlands-mall'
      ? [
        { id: 'open', label: 'Open Incidents', value: '1', tone: 'danger' },
        { id: 'response', label: 'Avg Response', value: '11m', tone: 'default' },
        { id: 'dispatched', label: 'Dispatched', value: '1', tone: 'warning' },
        { id: 'sla', label: 'SLA Compliance', value: '99%', tone: 'ok' },
      ]
      : [
        { id: 'open', label: 'Open Incidents', value: tenantId === 'tenant-global' ? '12' : '4', tone: 'danger' },
        { id: 'response', label: 'Avg Response', value: tenantId === 'tenant-global' ? '18m' : '16m', tone: 'default' },
        { id: 'dispatched', label: 'Dispatched', value: tenantId === 'tenant-global' ? '5' : '3', tone: 'warning' },
        { id: 'sla', label: 'SLA Compliance', value: tenantId === 'tenant-global' ? '94%' : '96%', tone: 'ok' },
      ],
    incidents,
    predictiveAlert: tenantId === 'tenant-westlands-mall'
      ? { text: 'Communication lag on the Westlands switch stack suggests a connector fault risk within 24 hours.', cta: 'Schedule Site Check' }
      : { text: 'Based on heat signatures, Station LOC-2 is at risk of a major connector fault within the next 48 hours.', cta: 'Schedule Maintenance' },
  }
}

export function getModuleNotice(moduleKey: ModuleKey, tenantId: TenantId): ModuleNotice {
  const tenantName = tenantCatalog[tenantId].name
  const messages: Record<ModuleKey, string> = {
    integrations: `Integration management is still mocked, but ${tenantName} now receives tenant-scoped integration notices from MSW.`,
    webhooks: `Webhook endpoint management remains mocked, with status now scoped to ${tenantName}.`,
    notifications: `Notification preferences are still a placeholder workflow, but the page now reflects the active ${tenantName} tenant.`,
  }

  return { message: messages[moduleKey] }
}
