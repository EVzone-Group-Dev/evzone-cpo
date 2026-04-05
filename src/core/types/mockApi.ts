import type { AccessProfile, CPORole, CPOUser, ServiceMode } from '@/core/types/domain'

export interface DemoUserHint {
  id: string
  name: string
  email: string
  password: string
  role: CPORole
}

export interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  token?: string
  user: AuthenticatedApiUser
}

export type AuthenticatedApiUser = Omit<CPOUser, 'role'> & {
  role: string
  twoFactorEnabled?: boolean
  accessProfile?: AccessProfile | null
}

export type TenantScope = 'platform' | 'tenant' | 'site'
export type DashboardMode = 'operations' | 'site'

export interface GeographyCountryReference {
  code2: string
  code3: string | null
  name: string
  officialName: string | null
  flagUrl: string | null
  currencyCode: string | null
  currencyName: string | null
  currencySymbol: string | null
  languages: string[]
}

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

export interface StationSwapSummary {
  availableChargedPacks: number
  cabinetCount: number
  chargingPacks: number
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
  serviceMode: ServiceMode
  status: 'Online' | 'Offline' | 'Degraded' | 'Faulted'
  swapSummary?: StationSwapSummary
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

export interface SwapCabinetSummary {
  availableChargedPacks: number
  chargingPacks: number
  id: string
  lastHeartbeatLabel: string
  model: string
  reservedPacks: number
  slotCount: number
  status: 'Online' | 'Offline' | 'Degraded' | 'Maintenance'
}

export type BatteryPackStatus = 'Ready' | 'Charging' | 'Reserved' | 'Installed' | 'Quarantined' | 'Retired'

export interface BatteryPackTimelineEvent {
  id: string
  summary: string
  timeLabel: string
  type: 'Swap' | 'Inspection' | 'Lifecycle' | 'Retirement'
}

export interface BatteryPackRetirementAssessment {
  action: 'None' | 'Monitor' | 'Retire'
  cycleThresholdBreached: boolean
  evaluatedAtLabel: string
  reason: string
  sohThresholdBreached: boolean
}

export interface BatteryPackRetirementDecision {
  action: 'Approved' | 'Deferred'
  actorLabel: string
  note?: string
  timeLabel: string
}

export interface BatteryPackRecord {
  chemistry: 'LFP' | 'NMC'
  cycleCount: number
  healthLabel: string
  id: string
  inspectionNote?: string
  inspectionStatus?: 'Passed' | 'Review' | 'Failed'
  lastInspectionLabel?: string
  lastSeenLabel: string
  retirementAssessment?: BatteryPackRetirementAssessment
  retirementDecision?: BatteryPackRetirementDecision
  slotLabel: string
  socLabel: string
  stationName: string
  status: BatteryPackStatus
  timeline?: BatteryPackTimelineEvent[]
}

export interface SwapPackTransitionRequest {
  note?: string
  toStatus: BatteryPackRecord['status']
}

export interface SwapPackInspectionRequest {
  note?: string
  result: 'Passed' | 'Review' | 'Failed'
}

export interface SwapPackRetirementRequest {
  action: 'ApproveRetirement' | 'DeferRetirement'
  note?: string
}

export interface SwapPackMutationResponse {
  message: string
  pack: BatteryPackRecord
}

export type SwapDispatchStatus = 'Proposed' | 'Approved' | 'Rejected' | 'In Transit' | 'Completed'

export interface SwapRebalancingRecommendation {
  confidencePercent: number
  demandTrendLabel: 'Rising' | 'Stable' | 'Cooling'
  etaImpactLabel: string
  fromStationId: string
  fromStationName: string
  id: string
  packsSuggested: number
  priority: 'Critical' | 'High' | 'Medium'
  reason: string
  sourceSurplusScore: number
  status: SwapDispatchStatus
  targetDeficitScore: number
  toStationId: string
  toStationName: string
}

export interface SwapDispatchHistoryEvent {
  actorLabel: string
  note?: string
  status: SwapDispatchStatus
  timeLabel: string
}

export interface SwapDispatchRecord {
  confidencePercent: number
  etaImpactLabel: string
  fromStationName: string
  history: SwapDispatchHistoryEvent[]
  id: string
  packs: number
  recommendationId: string
  status: Exclude<SwapDispatchStatus, 'Proposed'>
  toStationName: string
}

export interface SwapRebalancingResponse {
  dispatches: SwapDispatchRecord[]
  generatedAtLabel: string
  recommendations: SwapRebalancingRecommendation[]
}

export interface SwapDispatchActionRequest {
  action: 'Approve' | 'Reject' | 'MarkInTransit' | 'MarkCompleted'
  note?: string
}

export interface SwapDispatchActionResponse {
  dispatch: SwapDispatchRecord
  message: string
}

export interface SwapStationSummary {
  address: string
  avgSwapDurationLabel: string
  cabinetCount: number
  chargingPacks: number
  city: string
  country: string
  id: string
  lat: number
  lng: number
  name: string
  readyPacks: number
  serviceMode: Extract<ServiceMode, 'Swapping' | 'Hybrid'>
  status: 'Online' | 'Offline' | 'Degraded' | 'Maintenance'
}

export interface SwapStationDetail extends SwapStationSummary {
  alerts: Array<{
    level: 'Critical' | 'Warning' | 'Info'
    message: string
  }>
  cabinets: SwapCabinetSummary[]
  gridBufferLabel: string
  packs: BatteryPackRecord[]
  recentSwaps: Array<{
    durationLabel: string
    id: string
    riderLabel: string
    returnedPackId: string
    status: 'Completed' | 'Flagged' | 'In Progress'
    timeLabel: string
  }>
}

export interface BatterySwapSessionRecord {
  cabinetId: string
  healthCheck: 'Passed' | 'Review' | 'Failed'
  id: string
  initiatedAt: string
  outgoingPackId: string
  returnedPackId: string
  revenue: string
  riderLabel: string
  stationName: string
  status: 'Completed' | 'In Progress' | 'Flagged'
  turnaroundLabel: string
}

export interface BatteryInventoryResponse {
  balancingNote: string
  metrics: Array<{
    id: 'ready' | 'charging' | 'reserved' | 'quarantined' | 'retired'
    label: string
    tone: 'default' | 'ok' | 'warning' | 'danger'
    value: string
  }>
  packs: BatteryPackRecord[]
}

export interface ChargePointSummary {
  connectorType: string
  connectorTypes?: string[]
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
  smartChargingEnabled?: boolean
}

export interface SessionRecord {
  amount: string
  chargePointId: string
  connectorType: string
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

export interface CreateChargePointRequest {
  connectorType: string
  manufacturer: string
  maxCapacityKw: number
  model: string
  ocppId: string
  ocppVersion: string
  serialNumber: string
  stationId: string
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

export interface PartnerObservabilityMetric {
  id: 'healthy' | 'attention' | 'events' | 'failures'
  label: string
  note: string
  tone: 'accent' | 'ok' | 'warning' | 'danger'
  value: string
}

export interface RoamingPartnerObservabilitySummary {
  callbackFailures24h: number
  deliveryStatus: 'Healthy' | 'Retrying' | 'Degraded'
  eventCoverage: string[]
  id: string
  lastEventAt: string
  lastPartnerActivity: string
  retryQueueDepth: number
  successRate: string
  totalEvents24h: number
}

export interface RoamingPartnerObservabilityEvent {
  direction: 'Inbound' | 'Outbound'
  id: string
  module: string
  status: 'Delivered' | 'Retried' | 'Failed'
  summary: string
  time: string
}

export interface RoamingPartnerObservabilityAlert {
  detail: string
  id: string
  severity: 'Info' | 'Warning' | 'Critical'
  title: string
}

export interface RoamingPartnerObservabilityDetail extends RoamingPartnerObservabilitySummary {
  callbacks: {
    avgLatency: string
    delivered24h: number
    failed24h: number
    lastDelivery: string
    lastHttpStatus: string
  }
  recentEvents: RoamingPartnerObservabilityEvent[]
  warnings: RoamingPartnerObservabilityAlert[]
}

export interface RoamingPartnerObservabilityResponse {
  metrics: PartnerObservabilityMetric[]
  note: string
  partners: RoamingPartnerObservabilitySummary[]
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
  partnerId: string
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
  partnerId: string
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
  partnerId: string
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
  aging: Array<{
    label: string
    value: string
  }>
  invoices: Array<{
    amount: string
    customer: string
    dueDate: string
    id: string
    scope: string
    status: 'Draft' | 'Issued' | 'Paid' | 'Overdue'
  }>
  metrics: Array<{
    id: 'revenue' | 'collection-rate' | 'outstanding' | 'tax'
    label: string
    tone: 'default' | 'ok' | 'warning'
    value: string
  }>
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
  exceptions: Array<{
    action: string
    id: string
    impact: string
    partner: string
    reason: string
  }>
  metrics: Array<{
    id: 'ready' | 'reconciling' | 'settled' | 'exceptions'
    label: string
    tone: 'default' | 'ok' | 'warning' | 'danger'
    value: string
  }>
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

export type ProtocolImplementationStage = 'Mock Bench' | 'Pilot' | 'Live'

export interface ProtocolEngineResponse {
  complianceNote: string
  endpoints: ProtocolEndpointRecord[]
  handshakeLogs: ProtocolLogRecord[]
  headline: string
  implementationStage: ProtocolImplementationStage
  liveServicesDeployed: boolean
  plannedVersions: string[]
  statusNote: string
  supportedVersions: string[]
}

export interface IntegrationModuleResponse {
  connections: Array<{
    authMode: string
    category: 'Payments' | 'Roaming' | 'ERP' | 'CRM'
    id: string
    lastSync: string
    latency: string
    name: string
    status: 'Connected' | 'Degraded' | 'Pending'
  }>
  metrics: Array<{
    id: 'connected' | 'degraded' | 'pending' | 'coverage'
    label: string
    tone: 'default' | 'ok' | 'warning'
    value: string
  }>
  note: string
}

export interface WebhooksModuleResponse {
  endpoints: Array<{
    eventGroup: string
    id: string
    lastDelivery: string
    signingStatus: string
    status: 'Healthy' | 'Retrying' | 'Muted'
    successRate: string
    target: string
  }>
  metrics: Array<{
    id: 'healthy' | 'retrying' | 'muted' | 'deliveries'
    label: string
    tone: 'default' | 'ok' | 'warning'
    value: string
  }>
  note: string
  recentDeliveries: Array<{
    endpoint: string
    event: string
    id: string
    latency: string
    result: 'Delivered' | 'Retried' | 'Failed'
    time: string
  }>
}

export interface NotificationsModuleResponse {
  channels: Array<{
    coverage: string
    id: string
    name: string
    status: 'Active' | 'Fallback' | 'Paused'
    volume: string
  }>
  metrics: Array<{
    id: 'active-routes' | 'delivery-rate' | 'escalations' | 'suppressed'
    label: string
    tone: 'default' | 'ok' | 'warning'
    value: string
  }>
  note: string
  recentDispatches: Array<{
    channel: string
    id: string
    recipient: string
    rule: string
    status: 'Delivered' | 'Queued' | 'Escalated'
    time: string
  }>
}
