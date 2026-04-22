// Core domain types for EVzone CPO Central

export type StationId = string
export type ChargePointId = string
export type SwapCabinetId = string
export type BatteryPackId = string
export type ConnectorId = number
export type SessionId = string
export type OrganizationId = string
export type UserId = string

// ── Station & Assets ──────────────────────────────────────
export type StationStatus = 'Online' | 'Degraded' | 'Offline' | 'Maintenance'
export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB/T' | 'NACS'
export type PowerType = 'AC' | 'DC'
export type OCPPVersion = '1.6' | '1.6J' | '2.0.1' | '2.1'
export type ServiceMode = 'Charging' | 'Swapping' | 'Hybrid'
export type SwapCabinetStatus = 'Online' | 'Degraded' | 'Offline' | 'Maintenance'
export type BatteryPackStatus = 'Ready' | 'Charging' | 'Reserved' | 'In Use' | 'Quarantined'
export type BatteryChemistry = 'LFP' | 'NMC'

export interface Site {
  id: string
  name: string
  address: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  stationIds: StationId[]
  ownerId?: OrganizationId
  createdAt: string
}

export interface Station {
  id: StationId
  name: string
  siteId?: string
  serviceMode: ServiceMode
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  status: StationStatus
  chargePoints?: ChargePoint[]
  swapCabinets?: SwapCabinet[]
  capacity: number // kW
  createdAt: string
}

export interface ChargePoint {
  id: ChargePointId
  stationId: StationId
  model: string
  manufacturer: string
  serialNumber: string
  firmwareVersion: string
  ocppId?: string
  ocppVersion?: OCPPVersion
  status: StationStatus
  ocppStatus?: 'Available' | 'Preparing' | 'Charging' | 'SuspendedEVSE' | 'SuspendedEV' | 'Finishing' | 'Reserved' | 'Unavailable' | 'Faulted'
  connectors: Connector[]
  maxCapacityKw?: number
  lastHeartbeat?: string
  power?: number
  type?: string
  roamingPublished?: boolean
  smartChargingEnabled?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Connector {
  id: ConnectorId
  type: ConnectorType
  powerType: PowerType
  maxPowerKw: number
  status: 'Available' | 'Occupied' | 'Faulted' | 'Reserved' | 'Unavailable'
  currentSessionId?: SessionId
}

export interface SwapCabinet {
  id: SwapCabinetId
  stationId: StationId
  name: string
  model: string
  manufacturer: string
  slotCount: number
  availableChargedPacks: number
  chargingPacks: number
  reservedPacks: number
  status: SwapCabinetStatus
  lastHeartbeat?: string
}

export interface BatteryPack {
  id: BatteryPackId
  serialNumber: string
  chemistry: BatteryChemistry
  nominalCapacityKwh: number
  stateOfChargePercent: number
  stateOfHealthPercent: number
  cycleCount: number
  status: BatteryPackStatus
  stationId: StationId
  cabinetId?: SwapCabinetId
  slotNumber?: number
  lastSwapAt?: string
  installedVehicleId?: string
}

// ── Sessions ──────────────────────────────────────────────
export type SessionStatus = 'Pending' | 'Active' | 'Completed' | 'Failed' | 'Cancelled'
export type PaymentMethod = 'Card' | 'Roaming' | 'Wallet' | 'Mobile Money' | 'Cash'
export type AuthMethod = 'RFID' | 'App' | 'Plug&Charge' | 'Remote' | 'QR'

export interface ChargingSession {
  id: SessionId
  stationId: StationId
  chargePointId: ChargePointId
  connectorId: ConnectorId
  start: string
  end?: string
  energyKwh?: number
  tariffId?: string
  tariffName?: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  authMethod?: AuthMethod
  status: SessionStatus
  meterStart?: number
  meterEnd?: number
  emspId?: string   // Which EMSP/roaming partner if applicable
  failureReason?: string
}

export interface SwapSession {
  id: SessionId
  stationId: StationId
  cabinetId: SwapCabinetId
  outgoingPackId: BatteryPackId
  returnedPackId?: BatteryPackId
  start: string
  end?: string
  durationMinutes?: number
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  authMethod?: AuthMethod
  status: SessionStatus
  operatorId?: UserId
  returnedPackStateOfChargePercent?: number
  returnedPackStateOfHealthPercent?: number
  failureReason?: string
}

// ── Tariffs ───────────────────────────────────────────────
export type TariffType = 'Energy' | 'Time' | 'Fixed' | 'Mixed'

export interface Tariff {
  id: string
  name: string
  type: TariffType
  currency: string
  pricePerKwh?: number
  pricePerMinute?: number
  pricePerSession?: number
  minPower?: number
  maxPower?: number
  validFrom?: string
  validTo?: string
  restrictions?: string
  active: boolean
  stationIds?: StationId[]
  createdAt: string
}

// ── Incidents & Alerts ────────────────────────────────────
export type IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'Open' | 'Acknowledged' | 'In-Progress' | 'Resolved' | 'Closed'

export interface Incident {
  id: string
  stationId?: StationId
  chargePointId?: ChargePointId
  severity: IncidentSeverity
  title: string
  description: string
  status: IncidentStatus
  reportedBy?: string
  assignedTo?: string
  createdAt: string
  resolvedAt?: string
  slaBreach?: boolean
}

// ── OCPI / Roaming ────────────────────────────────────────
export type OCPIRole = 'CPO' | 'EMSP' | 'NSP' | 'HUB'
export type OCPIStatus = 'Active' | 'Pending' | 'Suspended' | 'Failed'

export interface OCPIPartner {
  id: string
  name: string
  role: OCPIRole
  country: string
  partyId: string
  ocpiVersions: string[]  // e.g. ['2.2.1', '2.3']
  token?: string
  endpointUrl: string
  status: OCPIStatus
  lastSync?: string
  sessionsToday?: number
}

export interface CDR {
  id: string
  sessionId: SessionId
  emspId: string
  emspName: string
  start: string
  end: string
  energyKwh: number
  totalCost: number
  currency: string
  status: 'Sent' | 'Acknowledged' | 'Failed' | 'Pending'
  createdAt: string
}

// ── Users & Roles ─────────────────────────────────────────
export type CPORole =
  | 'SUPER_ADMIN'       // Full platform access
  | 'CPO_ADMIN'         // Org-level admin
  | 'STATION_MANAGER'   // Manages stations & operators
  | 'OPERATOR'          // Field operator
  | 'TECHNICIAN'        // Maintenance only
  | 'SITE_HOST'         // Site-level read-only owner view
  | 'FINANCE'           // Financial reports only

export type CanonicalAccessRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'PLATFORM_BILLING_ADMIN'
  | 'PLATFORM_NOC_LEAD'
  | 'TENANT_ADMIN'
  | 'STATION_MANAGER'
  | 'SITE_HOST'
  | 'ROAMING_MANAGER'
  | 'FLEET_DISPATCHER'
  | 'FLEET_DRIVER'
  | 'INSTALLER_AGENT'
  | 'SMART_CHARGING_ENGINEER'
  | 'OPERATIONS_OPERATOR'
  | 'FIELD_TECHNICIAN'
  | 'TENANT_FINANCE_ANALYST'
  | 'EXTERNAL_PROVIDER_OPERATOR'
  | 'LEGACY_UNMAPPED'

export type TenantCpoType = 'CHARGE' | 'SWAP' | 'HYBRID'

export type AccessScopeType =
  | 'platform'
  | 'tenant'
  | 'site'
  | 'station'
  | 'fleet_group'
  | 'charge_point'
  | 'device'
  | 'temporary'
  | 'provider'

export type AccessRoleFamily =
  | 'platform'
  | 'tenant'
  | 'operations'
  | 'finance'
  | 'fleet'
  | 'technical'
  | 'provider'
  | 'legacy'

export interface AccessScopeSummary {
  type: AccessScopeType
  tenantId: string | null
  stationId: string | null
  stationIds: string[]
  providerId: string | null
  isTemporary: boolean
}

export interface AccessProfile {
  version: string
  legacyRole: string
  canonicalRole: CanonicalAccessRole
  roleFamily: AccessRoleFamily
  permissions: string[]
  scope: AccessScopeSummary
}

export type UserStatus = 'Active' | 'Invited' | 'Suspended' | 'Pending'

export interface OrganizationMembershipSummary {
  id?: string
  tenantId: OrganizationId
  role: string
  ownerCapability?: string | null
  status?: string
  tenantName?: string
  tenantType?: string
  cpoType?: TenantCpoType
}

export interface StationContextSummary {
  assignmentId: string
  stationId: StationId
  stationName: string | null
  tenantId: OrganizationId | null
  role: string
  isPrimary: boolean
  attendantMode?: string | null
  shiftStart?: string | null
  shiftEnd?: string | null
  timezone?: string | null
}

export interface CPOUser {
  id: UserId
  name: string
  email: string
  phone?: string
  role: CPORole
  legacyRole?: string
  status: UserStatus
  tenantId?: OrganizationId
  tenantActivated?: boolean
  activeTenantId?: OrganizationId | null
  activeTenantCpoType?: TenantCpoType | null
  orgId?: OrganizationId | null
  organizationName?: string | null
  activeTenantName?: string | null
  scopeDisplayName?: string | null
  activeStationName?: string | null
  displayTenantName?: string | null
  displayOrganizationName?: string | null
  displayScopeName?: string | null
  displayStationName?: string | null
  sessionScopeType?: 'platform' | 'tenant'
  actingAsTenant?: boolean
  selectedTenantId?: OrganizationId | null
  selectedTenantName?: string | null
  assignedStationIds?: StationId[]
  memberships?: OrganizationMembershipSummary[]
  stationContexts?: StationContextSummary[]
  activeStationContext?: StationContextSummary | null
  avatarUrl?: string
  lastSeen?: string
  createdAt?: string
  mfaEnabled?: boolean
  mfaRequired?: boolean
  providerId?: string | null
  region?: string | null
  zoneId?: string | null
  ownerCapability?: string | null
  mustChangePassword?: boolean
  accessProfile?: AccessProfile | null
}

// ── Finance ───────────────────────────────────────────────
export type PayoutStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed'

export interface Settlement {
  id: string
  organizationId: OrganizationId
  period: { start: string; end: string }
  totalRevenue: number
  platformFee: number
  netAmount: number
  currency: string
  status: PayoutStatus
  sessionCount: number
  payoutDate?: string
}

// ── Load Management ───────────────────────────────────────
export interface LoadPolicy {
  id: string
  name: string
  stationId?: StationId
  maxLoadKw: number
  curtailmentThreshold: number
  priority: 'FIFO' | 'Priority' | 'Fair-Share'
  active: boolean
  schedule?: { start: string; end: string; days: number[] }
}

// ── System Health ─────────────────────────────────────────
export interface SystemMetrics {
  onlineChargePoints: number
  totalChargePoints: number
  activeSessions: number
  energyTodayKwh: number
  revenueTodayAmount: number
  currency: string
  uptimePercent: number
  openIncidents: number
}
