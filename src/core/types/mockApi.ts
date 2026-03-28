import type { CPORole, CPOUser } from '@/core/types/domain'

export interface DemoUserHint {
  id: string
  name: string
  email: string
  password: string
  role: CPORole
}

export interface LoginResponse {
  token: string
  user: CPOUser
}

export type TenantScope = 'platform' | 'organization' | 'site'
export type DashboardMode = 'operations' | 'site'

export interface TenantSummary {
  chargePointCount: number
  code: string
  currency: string
  description: string
  id: string
  name: string
  region: string
  scope: TenantScope
  scopeLabel: string
  siteCount: number
  slug: string
  stationCount: number
  timeZone: string
}

export interface TenantContextResponse {
  activeTenant: TenantSummary
  availableTenants: TenantSummary[]
  canSwitchTenants: boolean
  dashboardMode: DashboardMode
  dataScopeLabel: string
}

export interface DashboardKpi {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  iconKey: 'activity' | 'charge-points' | 'energy' | 'revenue' | 'incidents' | 'roaming' | 'load' | 'operators'
}

export interface DashboardSession {
  id: string
  station: string
  cp: string
  energy: string
  amount: string
  status: 'Active' | 'Completed' | 'Failed'
  method: string
}

export interface DashboardIncident {
  id: string
  station: string
  severity: 'High' | 'Medium' | 'Low'
  title: string
  status: 'Open' | 'Acknowledged'
}

export interface DashboardOverviewResponse {
  kpis: DashboardKpi[]
  recentIncidents: DashboardIncident[]
  recentSessions: DashboardSession[]
}

export interface SiteOwnerMetric {
  id: 'revenue' | 'uptime' | 'utilisation' | 'energy'
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
  note: string
}

export interface RevenuePoint {
  day: string
  rev: number
}

export interface SiteOwnerTopUnit {
  id: string
  loc: string
  rev: string
  sessions: number
  status: 'Online' | 'Offline' | 'Degraded'
}

export interface SiteOwnerAlert {
  id: number
  msg: string
  time: string
  type: 'Issue' | 'Info'
}

export interface SiteOwnerDashboardResponse {
  alerts: SiteOwnerAlert[]
  metrics: SiteOwnerMetric[]
  optimizationTip: {
    cta: string
    text: string
    title: string
  }
  revenueData: RevenuePoint[]
  subtitle: string
  title: string
  topUnits: SiteOwnerTopUnit[]
}

export interface StationChargePointSummary {
  id: string
  lastHeartbeatLabel?: string
  status: 'Available' | 'Charging' | 'Faulted' | 'Unavailable'
  type: string
}

export interface StationSummary {
  address: string
  capacity: number
  chargePoints: StationChargePointSummary[]
  city: string
  country: string
  id: string
  lat: number
  lng: number
  name: string
  status: 'Online' | 'Offline' | 'Degraded' | 'Faulted'
}

export interface StationDetail extends StationSummary {
  dailyAverageKwh: string
  geofenceStatus: string
  networkLatency: {
    averageLabel: string
    modeLabel: string
    points: number[]
  }
  recentEvents: Array<{
    description: string
    time: string
  }>
  systemIntegrity: {
    firmwareVersion: string
    ocppVersion: string
    slaCompliance: string
  }
  uptimePercent30d: string
}

export interface ChargePointSummary {
  firmwareVersion: string
  id: string
  lastHeartbeatLabel: string
  manufacturer: string
  maxCapacityKw: number
  model: string
  ocppId: string
  ocppStatus: string
  ocppVersion: string
  roamingPublished: boolean
  serialNumber: string
  stale: boolean
  stationId: string
  stationName: string
  status: 'Online' | 'Offline' | 'Degraded'
}

export interface ChargePointDetail extends ChargePointSummary {
  remoteCommands: string[]
  unitHealth: {
    errorCode: string
    lastHeartbeat: string
    ocppConnection: string
  }
}

export interface SessionRecord {
  amount: string
  cp: string
  emsp: string
  ended: string | null
  energy: string
  id: string
  method: string
  started: string
  station: string
  status: 'Active' | 'Completed' | 'Failed'
}

export interface IncidentStat {
  id: 'open' | 'response' | 'dispatched' | 'sla'
  label: string
  tone: 'default' | 'danger' | 'warning' | 'ok'
  value: string
}

export interface IncidentRecord {
  assignedTech?: string
  id: string
  reportedAt: string
  serviceLog: Array<{
    active: boolean
    note: string
    title: string
  }>
  severity: 'Critical' | 'Major' | 'Minor'
  situationAudit: string
  stationId: string
  stationName: string
  status: 'Open' | 'Dispatched' | 'Resolving' | 'Closed'
  type: 'Hardware Failure' | 'Communication Loss' | 'Power Surge' | 'Vandalism'
}

export interface IncidentCommandResponse {
  incidents: IncidentRecord[]
  predictiveAlert: {
    cta: string
    text: string
  }
  stats: IncidentStat[]
}

export interface AlertRecord {
  acked: boolean
  id: string
  message: string
  station: string
  ts: string
  type: 'Critical' | 'Warning' | 'Info'
}

export interface TariffRecord {
  active: boolean
  currency: string
  id: string
  name: string
  pricePerKwh: number
  type: 'Energy' | 'Mixed' | 'Time'
}

export interface SmartChargingMetric {
  id: 'load' | 'cap' | 'utilisation' | 'sessions'
  label: string
  tone: 'default' | 'danger' | 'ok'
  value: string
}

export interface SmartChargingResponse {
  activeCurtailments: number
  distribution: Array<{
    colorKey: 'accent' | 'ok' | 'warning'
    label: string
    val: number
  }>
  loadProfile: Array<{
    cap: number
    load: number
    time: string
  }>
  metrics: SmartChargingMetric[]
  optimizer: {
    cta: string
    forecastTime: string
    reductionPercent: number
    selectedStrategy: string
    strategies: string[]
  }
}

export interface LoadPolicyRecord {
  active: boolean
  curtailment: number
  id: string
  maxLoadKw: number
  name: string
  priority: 'FIFO' | 'Priority' | 'Fair-Share'
  station: string
}

export interface RoamingPartnerRecord {
  country: string
  id: string
  lastSync: string
  name: string
  partyId: string
  status: 'Connected' | 'Pending' | 'Suspended'
  type: 'EMSP' | 'HUB'
  version: string
}

export interface RoamingMetric {
  id: 'incoming' | 'authorized' | 'utilisation'
  label: string
  note: string
  tone: 'accent' | 'ok' | 'warning'
  value: string
}

export interface RoamingSessionRecord {
  amount: string
  emspName: string
  energy: number
  id: string
  partyId: string
  startTime: string
  stationName: string
  status: 'Active' | 'Completed' | 'Authorized'
}

export interface RoamingSessionsResponse {
  metrics: RoamingMetric[]
  regionalReach: Array<{
    count: number
    region: string
  }>
  sessions: RoamingSessionRecord[]
  settlementAging: number[]
}

export interface CdrMetric {
  id: 'total' | 'awaiting' | 'revenue' | 'error-rate'
  label: string
  tone: 'default' | 'warning' | 'ok'
  value: string
}

export interface CdrRecord {
  country: string
  currency: string
  emspName: string
  end: string
  id: string
  kwh: number
  partyId: string
  sessionId: string
  start: string
  status: 'Sent' | 'Received' | 'Accepted' | 'Rejected' | 'Settled'
  totalCost: string
}

export interface OCPICdrsResponse {
  automation: {
    cta: string
    text: string
  }
  metrics: CdrMetric[]
  records: CdrRecord[]
}

export interface CommandLog {
  command: string
  id: string
  partner: string
  payload: string
  status: 'Accepted' | 'Rejected' | 'Timed Out'
  time: string
}

export interface OCPICommandsResponse {
  logs: CommandLog[]
  partners: Array<{
    id: string
    label: string
  }>
}

export interface BillingResponse {
  note: string
  totalRevenueThisMonth: string
}

export interface PayoutRecord {
  amount: string
  fee: string
  id: string
  net: string
  period: string
  sessions: number
  status: 'Completed' | 'Processing'
}

export interface SettlementRecord {
  id: string
  netAmount: string
  partner: string
  period: string
  status: 'Ready' | 'Reconciling' | 'Settled'
}

export interface SettlementResponse {
  note: string
  records: SettlementRecord[]
}

export interface TeamMember {
  email: string
  lastSeen: string
  name: string
  role: string
  status: 'Active' | 'Invited'
}

export interface AuditLogRecord {
  action: string
  actor: string
  target: string
  ts: string
}

export interface ReportTemplateOption {
  id: string
  label: string
}

export interface ReportExportRecord {
  name: string
  size: string
  time: string
  type: string
}

export interface ScheduledEmailRecord {
  enabled: boolean
  label: string
}

export interface ReportsResponse {
  periods: string[]
  recentExports: ReportExportRecord[]
  scheduledEmails: ScheduledEmailRecord[]
  templates: ReportTemplateOption[]
}

export interface ProtocolEndpointRecord {
  module: string
  status: 'Online' | 'Warning'
  url: string
}

export interface ProtocolLogRecord {
  level: 'info' | 'success' | 'warning' | 'accent'
  message: string
}

export interface ProtocolEngineResponse {
  complianceNote: string
  endpoints: ProtocolEndpointRecord[]
  handshakeLogs: ProtocolLogRecord[]
}

export interface ModuleNotice {
  message: string
}
