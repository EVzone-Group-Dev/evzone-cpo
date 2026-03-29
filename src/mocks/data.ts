import type { CPOUser } from '@/core/types/domain'
import type {
  AlertRecord,
  AuditLogRecord,
  BatteryInventoryResponse,
  BatteryPackRecord,
  BatteryPackRetirementAssessment,
  BatteryPackTimelineEvent,
  BatterySwapSessionRecord,
  BillingResponse,
  ChargePointDetail,
  CreateChargePointRequest,
  DashboardMode,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  IntegrationModuleResponse,
  LoadPolicyRecord,
  LoginResponse,
  NotificationsModuleResponse,
  OCPICdrsResponse,
  OCPICommandsResponse,
  RoamingPartnerObservabilityDetail,
  RoamingPartnerObservabilityResponse,
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
  SwapPackInspectionRequest,
  SwapPackRetirementRequest,
  SwapPackTransitionRequest,
  SwapDispatchActionRequest,
  SwapDispatchRecord,
  SwapRebalancingRecommendation,
  SwapRebalancingResponse,
  SwapDispatchStatus,
  SwapStationDetail,
  TariffRecord,
  TeamMember,
  TenantContextResponse,
  TenantSummary,
  WebhooksModuleResponse,
} from '@/core/types/mockApi'

type TenantId = 'tenant-global' | 'tenant-evzone-ke' | 'tenant-westlands-mall'

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
  {
    id: 'u4',
    name: 'Station Manager',
    email: 'stationmanager@evzone.io',
    password: 'stationmanager',
    role: 'STATION_MANAGER',
    defaultTenantId: 'tenant-evzone-ke',
    tenantIds: ['tenant-evzone-ke'],
    user: {
      id: 'u4',
      name: 'Station Manager',
      email: 'stationmanager@evzone.io',
      role: 'STATION_MANAGER',
      status: 'Active',
      organizationId: 'org-evzone-ke',
      assignedStationIds: ['st-1', 'st-2', 'st-3'],
      mfaEnabled: true,
      createdAt: '2026-03-04T08:00:00.000Z',
    },
  },
  {
    id: 'u5',
    name: 'Finance Lead',
    email: 'finance@evzone.io',
    password: 'finance',
    role: 'FINANCE',
    defaultTenantId: 'tenant-global',
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
    user: {
      id: 'u5',
      name: 'Finance Lead',
      email: 'finance@evzone.io',
      role: 'FINANCE',
      status: 'Active',
      organizationId: 'org-evzone-finance',
      mfaEnabled: true,
      createdAt: '2026-03-05T08:00:00.000Z',
    },
  },
  {
    id: 'u6',
    name: 'Field Technician',
    email: 'technician@evzone.io',
    password: 'technician',
    role: 'TECHNICIAN',
    defaultTenantId: 'tenant-evzone-ke',
    tenantIds: ['tenant-evzone-ke'],
    user: {
      id: 'u6',
      name: 'Field Technician',
      email: 'technician@evzone.io',
      role: 'TECHNICIAN',
      status: 'Active',
      organizationId: 'org-evzone-ke',
      assignedStationIds: ['st-1', 'st-2'],
      mfaEnabled: false,
      createdAt: '2026-03-06T08:00:00.000Z',
    },
  },
]

const chargePoints: Array<TenantScoped<ChargePointDetail>> = [
  {
    id: 'cp-1',
    stationId: 'st-1',
    stationName: 'Westlands Hub',
    connectorType: 'CCS 2',
    connectorTypes: ['CCS 2', 'CHAdeMO', 'AC Type 2'],
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
    connectorType: 'CCS 2',
    connectorTypes: ['CCS 2', 'CHAdeMO', 'AC Type 2'],
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
    connectorType: 'Type 2',
    connectorTypes: ['Type 2'],
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
    connectorType: 'CCS 2',
    connectorTypes: ['CCS 2 (x2)'],
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
    serviceMode: 'Hybrid',
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
    swapSummary: { cabinetCount: 1, availableChargedPacks: 9, chargingPacks: 3 },
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
    serviceMode: 'Charging',
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
    serviceMode: 'Swapping',
    status: 'Online',
    address: 'Cargo Terminal Road',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 175,
    lat: -1.3198,
    lng: 36.9276,
    chargePoints: [],
    swapSummary: { cabinetCount: 2, availableChargedPacks: 18, chargingPacks: 6 },
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
    serviceMode: 'Charging',
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

const swapStations: Array<TenantScoped<SwapStationDetail>> = [
  {
    id: 'swap-st-1',
    name: 'Westlands Swap Annex',
    address: 'Westlands Avenue',
    city: 'Nairobi',
    country: 'Kenya',
    lat: -1.2631,
    lng: 36.8042,
    status: 'Online',
    serviceMode: 'Hybrid',
    cabinetCount: 1,
    readyPacks: 9,
    chargingPacks: 3,
    avgSwapDurationLabel: '3m 40s',
    gridBufferLabel: 'Recharge load capped at 72 kW during evening peak.',
    alerts: [
      { level: 'Info', message: 'Morning rider demand tracking within forecast.' },
      { level: 'Warning', message: 'Cabinet 1 is two packs below reserve threshold.' },
    ],
    cabinets: [
      {
        id: 'cab-wl-1',
        model: 'Gogoro GoStation 3.0',
        status: 'Online',
        slotCount: 16,
        availableChargedPacks: 9,
        chargingPacks: 3,
        reservedPacks: 2,
        lastHeartbeatLabel: '8s ago',
      },
    ],
    packs: [
      { id: 'PK-WL-001', chemistry: 'LFP', cycleCount: 184, healthLabel: '97% SoH', lastSeenLabel: '1m ago', slotLabel: 'Cab 1 / Slot 03', socLabel: '98% SoC', stationName: 'Westlands Swap Annex', status: 'Ready' },
      { id: 'PK-WL-007', chemistry: 'LFP', cycleCount: 211, healthLabel: '95% SoH', lastSeenLabel: '2m ago', slotLabel: 'Cab 1 / Slot 07', socLabel: '63% SoC', stationName: 'Westlands Swap Annex', status: 'Charging' },
      { id: 'PK-WL-011', chemistry: 'LFP', cycleCount: 226, healthLabel: '93% SoH', lastSeenLabel: '4m ago', slotLabel: 'Cab 1 / Slot 11', socLabel: '100% SoC', stationName: 'Westlands Swap Annex', status: 'Reserved' },
      { id: 'PK-WL-014', chemistry: 'LFP', cycleCount: 308, healthLabel: '88% SoH', lastSeenLabel: '9m ago', slotLabel: 'Inspection Bay', socLabel: '42% SoC', stationName: 'Westlands Swap Annex', status: 'Quarantined' },
    ],
    recentSwaps: [
      { id: 'SWP-901', riderLabel: 'Rider 14 / Boda EV', returnedPackId: 'PK-WL-207', durationLabel: '3m 14s', status: 'Completed', timeLabel: '4m ago' },
      { id: 'SWP-900', riderLabel: 'Fleet 22 / Courier', returnedPackId: 'PK-WL-205', durationLabel: '4m 02s', status: 'Completed', timeLabel: '12m ago' },
      { id: 'SWP-899', riderLabel: 'Rider 09 / Tuk', returnedPackId: 'PK-WL-203', durationLabel: '6m 11s', status: 'Flagged', timeLabel: '23m ago' },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'],
  },
  {
    id: 'swap-st-2',
    name: 'Airport East Battery Exchange',
    address: 'Cargo Terminal Road',
    city: 'Nairobi',
    country: 'Kenya',
    lat: -1.3195,
    lng: 36.9281,
    status: 'Online',
    serviceMode: 'Swapping',
    cabinetCount: 2,
    readyPacks: 18,
    chargingPacks: 6,
    avgSwapDurationLabel: '2m 55s',
    gridBufferLabel: 'Battery farm shifted to off-peak recharge profile.',
    alerts: [
      { level: 'Info', message: 'Airport courier fleet reservations are fully covered.' },
      { level: 'Info', message: 'Returned-pack inspection queue cleared for the last 6 hours.' },
    ],
    cabinets: [
      {
        id: 'cab-air-1',
        model: 'Ampersand Hub Rack',
        status: 'Online',
        slotCount: 18,
        availableChargedPacks: 10,
        chargingPacks: 4,
        reservedPacks: 2,
        lastHeartbeatLabel: '6s ago',
      },
      {
        id: 'cab-air-2',
        model: 'Ampersand Hub Rack',
        status: 'Online',
        slotCount: 18,
        availableChargedPacks: 8,
        chargingPacks: 2,
        reservedPacks: 1,
        lastHeartbeatLabel: '5s ago',
      },
    ],
    packs: [
      { id: 'PK-AIR-004', chemistry: 'LFP', cycleCount: 132, healthLabel: '98% SoH', lastSeenLabel: '30s ago', slotLabel: 'Cab 1 / Slot 04', socLabel: '100% SoC', stationName: 'Airport East Battery Exchange', status: 'Ready' },
      { id: 'PK-AIR-009', chemistry: 'LFP', cycleCount: 145, healthLabel: '97% SoH', lastSeenLabel: '2m ago', slotLabel: 'Cab 1 / Slot 09', socLabel: '78% SoC', stationName: 'Airport East Battery Exchange', status: 'Charging' },
      { id: 'PK-AIR-013', chemistry: 'LFP', cycleCount: 201, healthLabel: '94% SoH', lastSeenLabel: '1m ago', slotLabel: 'Cab 2 / Slot 02', socLabel: '100% SoC', stationName: 'Airport East Battery Exchange', status: 'Ready' },
      { id: 'PK-AIR-018', chemistry: 'LFP', cycleCount: 244, healthLabel: '91% SoH', lastSeenLabel: '3m ago', slotLabel: 'Cab 2 / Slot 05', socLabel: '100% SoC', stationName: 'Airport East Battery Exchange', status: 'Installed' },
      { id: 'PK-AIR-024', chemistry: 'NMC', cycleCount: 266, healthLabel: '89% SoH', lastSeenLabel: '7m ago', slotLabel: 'Cab 2 / Slot 11', socLabel: '100% SoC', stationName: 'Airport East Battery Exchange', status: 'Reserved' },
    ],
    recentSwaps: [
      { id: 'SWP-948', riderLabel: 'Cargo Rider 8', returnedPackId: 'PK-AIR-119', durationLabel: '2m 41s', status: 'Completed', timeLabel: '2m ago' },
      { id: 'SWP-947', riderLabel: 'Courier Van 3', returnedPackId: 'PK-AIR-117', durationLabel: '3m 03s', status: 'Completed', timeLabel: '10m ago' },
      { id: 'SWP-946', riderLabel: 'Cargo Rider 2', returnedPackId: 'PK-AIR-116', durationLabel: '3m 28s', status: 'In Progress', timeLabel: '18m ago' },
    ],
    tenantIds: ['tenant-global', 'tenant-evzone-ke'],
  },
  {
    id: 'swap-st-3',
    name: 'Global Logistics Swap Yard',
    address: 'Inland Container Access Road',
    city: 'Nairobi',
    country: 'Kenya',
    lat: -1.2889,
    lng: 36.9004,
    status: 'Degraded',
    serviceMode: 'Swapping',
    cabinetCount: 3,
    readyPacks: 11,
    chargingPacks: 8,
    avgSwapDurationLabel: '4m 10s',
    gridBufferLabel: 'One rack is running on derated cooling until fan replacement.',
    alerts: [
      { level: 'Critical', message: 'Cabinet 3 cooling fan has fallen below safe threshold.' },
      { level: 'Warning', message: 'Ready-pack inventory is 18% below the midday buffer plan.' },
    ],
    cabinets: [
      {
        id: 'cab-glo-1',
        model: 'Tier-1 Fleet Rack',
        status: 'Online',
        slotCount: 20,
        availableChargedPacks: 6,
        chargingPacks: 3,
        reservedPacks: 2,
        lastHeartbeatLabel: '11s ago',
      },
      {
        id: 'cab-glo-2',
        model: 'Tier-1 Fleet Rack',
        status: 'Degraded',
        slotCount: 20,
        availableChargedPacks: 5,
        chargingPacks: 3,
        reservedPacks: 1,
        lastHeartbeatLabel: '19s ago',
      },
      {
        id: 'cab-glo-3',
        model: 'Tier-1 Fleet Rack',
        status: 'Maintenance',
        slotCount: 20,
        availableChargedPacks: 0,
        chargingPacks: 2,
        reservedPacks: 0,
        lastHeartbeatLabel: '2m ago',
      },
    ],
    packs: [
      { id: 'PK-GLO-003', chemistry: 'LFP', cycleCount: 344, healthLabel: '87% SoH', lastSeenLabel: '2m ago', slotLabel: 'Cab 2 / Slot 03', socLabel: '100% SoC', stationName: 'Global Logistics Swap Yard', status: 'Ready' },
      { id: 'PK-GLO-006', chemistry: 'NMC', cycleCount: 389, healthLabel: '84% SoH', lastSeenLabel: '5m ago', slotLabel: 'Cab 1 / Slot 06', socLabel: '54% SoC', stationName: 'Global Logistics Swap Yard', status: 'Charging' },
      { id: 'PK-GLO-012', chemistry: 'LFP', cycleCount: 412, healthLabel: '81% SoH', lastSeenLabel: '8m ago', slotLabel: 'Service Bench', socLabel: '28% SoC', stationName: 'Global Logistics Swap Yard', status: 'Quarantined' },
      { id: 'PK-GLO-018', chemistry: 'LFP', cycleCount: 276, healthLabel: '92% SoH', lastSeenLabel: '1m ago', slotLabel: 'Cab 1 / Slot 18', socLabel: '100% SoC', stationName: 'Global Logistics Swap Yard', status: 'Reserved' },
    ],
    recentSwaps: [
      { id: 'SWP-981', riderLabel: 'Fleet Rig 11', returnedPackId: 'PK-GLO-204', durationLabel: '4m 22s', status: 'Completed', timeLabel: '9m ago' },
      { id: 'SWP-980', riderLabel: 'Fleet Rig 14', returnedPackId: 'PK-GLO-202', durationLabel: '7m 01s', status: 'Flagged', timeLabel: '22m ago' },
      { id: 'SWP-979', riderLabel: 'Fleet Rig 06', returnedPackId: 'PK-GLO-198', durationLabel: '4m 11s', status: 'Completed', timeLabel: '40m ago' },
    ],
    tenantIds: ['tenant-global'],
  },
]

const batterySwapSessions: Array<TenantScoped<BatterySwapSessionRecord>> = [
  { id: 'BSS-301', stationName: 'Westlands Swap Annex', cabinetId: 'cab-wl-1', riderLabel: 'Rider 14 / Boda EV', outgoingPackId: 'PK-WL-001', returnedPackId: 'PK-WL-207', initiatedAt: '2026-03-29 08:14', turnaroundLabel: '3m 14s', revenue: 'KES 420', status: 'Completed', healthCheck: 'Passed', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'BSS-302', stationName: 'Airport East Battery Exchange', cabinetId: 'cab-air-1', riderLabel: 'Cargo Rider 8', outgoingPackId: 'PK-AIR-004', returnedPackId: 'PK-AIR-119', initiatedAt: '2026-03-29 08:11', turnaroundLabel: '2m 41s', revenue: 'KES 510', status: 'Completed', healthCheck: 'Passed', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { id: 'BSS-303', stationName: 'Airport East Battery Exchange', cabinetId: 'cab-air-2', riderLabel: 'Cargo Rider 2', outgoingPackId: 'PK-AIR-013', returnedPackId: 'PK-AIR-116', initiatedAt: '2026-03-29 07:58', turnaroundLabel: '3m 28s', revenue: 'KES 505', status: 'In Progress', healthCheck: 'Review', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { id: 'BSS-304', stationName: 'Global Logistics Swap Yard', cabinetId: 'cab-glo-2', riderLabel: 'Fleet Rig 14', outgoingPackId: 'PK-GLO-018', returnedPackId: 'PK-GLO-202', initiatedAt: '2026-03-29 07:36', turnaroundLabel: '7m 01s', revenue: 'KES 690', status: 'Flagged', healthCheck: 'Failed', tenantIds: ['tenant-global'] },
  { id: 'BSS-305', stationName: 'Westlands Swap Annex', cabinetId: 'cab-wl-1', riderLabel: 'Courier 22', outgoingPackId: 'PK-WL-009', returnedPackId: 'PK-WL-205', initiatedAt: '2026-03-29 07:22', turnaroundLabel: '4m 02s', revenue: 'KES 430', status: 'Completed', healthCheck: 'Passed', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
]

const swapDispatchRecords: Array<TenantScoped<SwapDispatchRecord>> = [
  {
    id: 'DSP-001',
    recommendationId: 'RB-swap-st-2-swap-st-3',
    fromStationName: 'Airport East Battery Exchange',
    toStationName: 'Global Logistics Swap Yard',
    packs: 2,
    confidencePercent: 88,
    etaImpactLabel: '+3.0h runway at destination',
    status: 'Completed',
    history: [
      { status: 'Proposed', timeLabel: '2026-03-28 09:10', actorLabel: 'Rebalancing Engine', note: 'Deficit detected at logistics yard.' },
      { status: 'Approved', timeLabel: '2026-03-28 09:18', actorLabel: 'Ops Controller', note: 'Approved for immediate transfer.' },
      { status: 'In Transit', timeLabel: '2026-03-28 09:40', actorLabel: 'Dispatch Rider', note: 'Two packs loaded and en route.' },
      { status: 'Completed', timeLabel: '2026-03-28 10:15', actorLabel: 'Station Operator', note: 'Packs landed and verified.' },
    ],
    tenantIds: ['tenant-global'],
  },
]

let swapDispatchCounter = 1

const sessions: Array<TenantScoped<SessionRecord>> = [
  { id: 'SES-001', station: 'Westlands Hub', chargePointId: 'cp-1', connectorType: 'CCS 2', cp: 'EVZ-WL-001', started: '2026-03-28 08:14', ended: '2026-03-28 09:02', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Completed', method: 'App', emsp: 'EVzone eMSP', tenantIds: ['tenant-global', 'tenant-evzone-ke', 'tenant-westlands-mall'] },
  { id: 'SES-002', station: 'CBD Charging Station', chargePointId: 'cp-3', connectorType: 'Type 2', cp: 'EVZ-CBD-001', started: '2026-03-28 07:50', ended: null, energy: '31.0 kWh', amount: 'KES 1,860', status: 'Active', method: 'RFID', emsp: '-', tenantIds: ['tenant-global', 'tenant-evzone-ke'] },
  { id: 'SES-003', station: 'Garden City Mall', chargePointId: 'cp-4', connectorType: 'CCS 2', cp: 'EVZ-GC-001', started: '2026-03-28 10:00', ended: '2026-03-28 10:05', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID', emsp: '-', tenantIds: ['tenant-global'] },
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

const roamingPartnerObservability: Array<TenantScoped<RoamingPartnerObservabilityDetail>> = [
  {
    id: 'p1',
    deliveryStatus: 'Healthy',
    eventCoverage: ['Commands', 'Sessions', 'CDRs', 'Tokens', 'Credentials', 'Tariffs'],
    lastEventAt: '45s ago',
    lastPartnerActivity: '2m ago',
    retryQueueDepth: 0,
    successRate: '99.2%',
    totalEvents24h: 1642,
    callbackFailures24h: 1,
    callbacks: {
      avgLatency: '420 ms',
      delivered24h: 511,
      failed24h: 1,
      lastDelivery: '45s ago',
      lastHttpStatus: '202 Accepted',
    },
    recentEvents: [
      {
        id: 'obs-p1-global-1',
        module: 'Sessions',
        direction: 'Outbound',
        status: 'Delivered',
        summary: 'PATCH /sessions/SES-9120 exported after roaming session progress update.',
        time: '45s ago',
      },
      {
        id: 'obs-p1-global-2',
        module: 'Tokens',
        direction: 'Inbound',
        status: 'Delivered',
        summary: 'Token authorization payload validated and forwarded to the backend token cache.',
        time: '4m ago',
      },
      {
        id: 'obs-p1-global-3',
        module: 'Credentials',
        direction: 'Outbound',
        status: 'Retried',
        summary: 'Credential heartbeat delivery retried once before peer acknowledgement.',
        time: '18m ago',
      },
    ],
    warnings: [
      {
        id: 'obs-p1-global-warning-1',
        severity: 'Info',
        title: 'Credential rotation window approaching',
        detail: 'Token C rotation is due within 3 days, but no delivery degradation is currently visible.',
      },
    ],
    tenantIds: ['tenant-global'],
  },
  {
    id: 'p2',
    deliveryStatus: 'Retrying',
    eventCoverage: ['Commands', 'Sessions', 'CDRs', 'Locations', 'Tariffs', 'Tokens', 'Credentials', 'Partner Lifecycle'],
    lastEventAt: '2m ago',
    lastPartnerActivity: '4m ago',
    retryQueueDepth: 3,
    successRate: '96.8%',
    totalEvents24h: 2314,
    callbackFailures24h: 8,
    callbacks: {
      avgLatency: '610 ms',
      delivered24h: 688,
      failed24h: 8,
      lastDelivery: '2m ago',
      lastHttpStatus: '504 Gateway Timeout',
    },
    recentEvents: [
      {
        id: 'obs-p2-global-1',
        module: 'CDRs',
        direction: 'Outbound',
        status: 'Failed',
        summary: 'POST /cdrs callback timed out after the partner edge returned 504.',
        time: '2m ago',
      },
      {
        id: 'obs-p2-global-2',
        module: 'Locations',
        direction: 'Outbound',
        status: 'Retried',
        summary: 'Location delta export is draining through the retry queue after a transient peer outage.',
        time: '6m ago',
      },
      {
        id: 'obs-p2-global-3',
        module: 'Commands',
        direction: 'Inbound',
        status: 'Delivered',
        summary: 'START_SESSION command accepted and relayed to the backend command bridge.',
        time: '12m ago',
      },
    ],
    warnings: [
      {
        id: 'obs-p2-global-warning-1',
        severity: 'Warning',
        title: 'Retry backlog is growing',
        detail: 'Three callback jobs are waiting on peer recovery, concentrated around CDR and location exports.',
      },
      {
        id: 'obs-p2-global-warning-2',
        severity: 'Info',
        title: 'Partner traffic still flowing',
        detail: 'Inbound commands and token checks are healthy even while outbound delivery retries remain elevated.',
      },
    ],
    tenantIds: ['tenant-global'],
  },
  {
    id: 'p1',
    deliveryStatus: 'Healthy',
    eventCoverage: ['Commands', 'Sessions', 'CDRs', 'Tokens', 'Credentials'],
    lastEventAt: '1m ago',
    lastPartnerActivity: '3m ago',
    retryQueueDepth: 0,
    successRate: '99.4%',
    totalEvents24h: 982,
    callbackFailures24h: 0,
    callbacks: {
      avgLatency: '380 ms',
      delivered24h: 301,
      failed24h: 0,
      lastDelivery: '1m ago',
      lastHttpStatus: '202 Accepted',
    },
    recentEvents: [
      {
        id: 'obs-p1-ke-1',
        module: 'Commands',
        direction: 'Inbound',
        status: 'Delivered',
        summary: 'RESERVE_NOW command relay completed for the Kenya operating scope.',
        time: '1m ago',
      },
      {
        id: 'obs-p1-ke-2',
        module: 'Sessions',
        direction: 'Outbound',
        status: 'Delivered',
        summary: 'Session progress export acknowledged by the roaming partner without retry.',
        time: '9m ago',
      },
      {
        id: 'obs-p1-ke-3',
        module: 'Tokens',
        direction: 'Inbound',
        status: 'Delivered',
        summary: 'Partner token cache refresh landed inside the tenant-scoped auth store.',
        time: '22m ago',
      },
    ],
    warnings: [
      {
        id: 'obs-p1-ke-warning-1',
        severity: 'Info',
        title: 'Kenya tenant is stable',
        detail: 'No retry backlog or callback failures have been recorded in the last 24 hours.',
      },
    ],
    tenantIds: ['tenant-evzone-ke'],
  },
  {
    id: 'p2',
    deliveryStatus: 'Degraded',
    eventCoverage: ['Commands', 'Sessions', 'CDRs', 'Locations', 'Tariffs', 'Partner Lifecycle'],
    lastEventAt: '3m ago',
    lastPartnerActivity: '7m ago',
    retryQueueDepth: 7,
    successRate: '94.6%',
    totalEvents24h: 1255,
    callbackFailures24h: 6,
    callbacks: {
      avgLatency: '890 ms',
      delivered24h: 344,
      failed24h: 6,
      lastDelivery: '3m ago',
      lastHttpStatus: '502 Bad Gateway',
    },
    recentEvents: [
      {
        id: 'obs-p2-ke-1',
        module: 'Partner Lifecycle',
        direction: 'Outbound',
        status: 'Failed',
        summary: 'Partner capability sync stalled during a peer-side 502 window.',
        time: '3m ago',
      },
      {
        id: 'obs-p2-ke-2',
        module: 'CDRs',
        direction: 'Outbound',
        status: 'Retried',
        summary: 'Settlement export is being replayed after repeated upstream gateway failures.',
        time: '11m ago',
      },
      {
        id: 'obs-p2-ke-3',
        module: 'Commands',
        direction: 'Inbound',
        status: 'Delivered',
        summary: 'STOP_SESSION command relay succeeded despite outbound callback degradation.',
        time: '15m ago',
      },
    ],
    warnings: [
      {
        id: 'obs-p2-ke-warning-1',
        severity: 'Critical',
        title: 'Partner callback health is degraded',
        detail: 'Failure rate has crossed the Kenya tenant threshold and requires partner follow-up before settlement drift grows.',
      },
      {
        id: 'obs-p2-ke-warning-2',
        severity: 'Warning',
        title: 'Retry queue depth is above target',
        detail: 'Seven pending deliveries are stacked behind partner edge instability across CDR and location flows.',
      },
    ],
    tenantIds: ['tenant-evzone-ke'],
  },
  {
    id: 'p1',
    deliveryStatus: 'Healthy',
    eventCoverage: ['Commands', 'Sessions', 'CDRs', 'Tokens'],
    lastEventAt: '5m ago',
    lastPartnerActivity: '12m ago',
    retryQueueDepth: 0,
    successRate: '99.8%',
    totalEvents24h: 244,
    callbackFailures24h: 0,
    callbacks: {
      avgLatency: '290 ms',
      delivered24h: 88,
      failed24h: 0,
      lastDelivery: '5m ago',
      lastHttpStatus: '202 Accepted',
    },
    recentEvents: [
      {
        id: 'obs-p1-westlands-1',
        module: 'Sessions',
        direction: 'Outbound',
        status: 'Delivered',
        summary: 'Hosted-site session update delivered successfully to the roaming partner.',
        time: '5m ago',
      },
      {
        id: 'obs-p1-westlands-2',
        module: 'CDRs',
        direction: 'Outbound',
        status: 'Delivered',
        summary: 'Latest hosted-site CDR export cleared immediately after settlement packaging.',
        time: '27m ago',
      },
    ],
    warnings: [
      {
        id: 'obs-p1-westlands-warning-1',
        severity: 'Info',
        title: 'Hosted-site feed is healthy',
        detail: 'This portfolio is currently limited to a lighter set of modules, but all instrumented exports are green.',
      },
    ],
    tenantIds: ['tenant-westlands-mall'],
  },
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

function toRoamingPartnerObservabilitySummary(
  partner: RoamingPartnerObservabilityDetail,
): RoamingPartnerObservabilityResponse['partners'][number] {
  const { callbacks, recentEvents, warnings, ...summary } = partner
  void callbacks
  void recentEvents
  void warnings
  return summary
}

function getRoamingObservabilityNote(tenantId: TenantId) {
  if (tenantId === 'tenant-westlands-mall') {
    return 'Hosted-site roaming observability is now visible from Kafka-derived partner events and callback delivery traces for the Westlands portfolio.'
  }

  if (tenantId === 'tenant-evzone-ke') {
    return 'Kenya roaming operations now surface partner health, retry pressure, and callback performance directly from the OCPI event stream.'
  }

  return 'Global partner observability fuses OCPI gateway event coverage with backend callback delivery signals so operations can spot retry pressure before roaming SLAs drift.'
}

function getRoamingPartnerObservabilityMetrics(
  partners: RoamingPartnerObservabilityDetail[],
): RoamingPartnerObservabilityResponse['metrics'] {
  const healthyCount = partners.filter((partner) => partner.deliveryStatus === 'Healthy').length
  const attentionCount = partners.length - healthyCount
  const degradedCount = partners.filter((partner) => partner.deliveryStatus === 'Degraded').length
  const retryingCount = partners.filter((partner) => partner.deliveryStatus === 'Retrying').length
  const totalEvents = partners.reduce((sum, partner) => sum + partner.totalEvents24h, 0)
  const totalFailures = partners.reduce((sum, partner) => sum + partner.callbackFailures24h, 0)

  return [
    {
      id: 'healthy',
      label: 'Healthy Partners',
      value: `${healthyCount}/${partners.length}`,
      note: partners.length === 0
        ? 'No partner feeds are configured for this scope yet.'
        : `${partners.length} active partner feeds instrumented.`,
      tone: healthyCount === partners.length ? 'ok' : 'accent',
    },
    {
      id: 'attention',
      label: 'Needs Attention',
      value: `${attentionCount}`,
      note: attentionCount === 0
        ? 'No retry backlog detected.'
        : `${retryingCount} retrying, ${degradedCount} degraded.`,
      tone: degradedCount > 0 ? 'danger' : 'warning',
    },
    {
      id: 'events',
      label: 'Events / 24h',
      value: totalEvents.toLocaleString(),
      note: 'Commands, sessions, CDRs, tokens, tariffs, and lifecycle flows.',
      tone: 'accent',
    },
    {
      id: 'failures',
      label: 'Callback Failures',
      value: `${totalFailures}`,
      note: 'Last 24h delivery failures persisting after retry.',
      tone: totalFailures > 0 ? 'warning' : 'ok',
    },
  ]
}

function getNextChargePointId() {
  const highestId = chargePoints.reduce((highest, record) => {
    const parsedId = Number(record.id.replace('cp-', ''))
    return Number.isFinite(parsedId) ? Math.max(highest, parsedId) : highest
  }, 0)

  return `cp-${highestId + 1}`
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

function makeBillingResponse(
  totalRevenueThisMonth: string,
  note: string,
  collectionRate: string,
  outstanding: string,
  taxExposure: string,
  invoices: BillingResponse['invoices'],
  aging: BillingResponse['aging'],
): BillingResponse {
  return {
    totalRevenueThisMonth,
    note,
    metrics: [
      { id: 'revenue', label: 'Revenue', value: totalRevenueThisMonth, tone: 'default' },
      { id: 'collection-rate', label: 'Collection Rate', value: collectionRate, tone: 'ok' },
      { id: 'outstanding', label: 'Outstanding', value: outstanding, tone: 'warning' },
      { id: 'tax', label: 'Tax Exposure', value: taxExposure, tone: 'warning' },
    ],
    invoices,
    aging,
  }
}

const billingByTenant: Record<TenantId, BillingResponse> = {
  'tenant-global': makeBillingResponse(
    'KES 4,284,200',
    'Global billing rollup across every active tenant, with invoice queue and aging exposed through the mock finance API.',
    '97.8%',
    'KES 318,400',
    'KES 482,000 due Apr 5',
    [
      { id: 'INV-24031', customer: 'Hubject Settlement Desk', scope: 'Platform roaming', amount: 'KES 684,220', dueDate: 'Apr 02, 2026', status: 'Issued' },
      { id: 'INV-24032', customer: 'Shell Recharge', scope: 'Cross-border roaming', amount: 'KES 302,115', dueDate: 'Apr 04, 2026', status: 'Overdue' },
      { id: 'INV-24033', customer: 'Westlands Mall Group', scope: 'Hosted site revenue share', amount: 'KES 148,220', dueDate: 'Apr 06, 2026', status: 'Draft' },
      { id: 'INV-24030', customer: 'Kenya Fleet Program', scope: 'Managed charging', amount: 'KES 412,700', dueDate: 'Mar 26, 2026', status: 'Paid' },
    ],
    [
      { label: 'Current', value: 'KES 1.9M' },
      { label: '1-30 Days', value: 'KES 274K' },
      { label: '31-60 Days', value: 'KES 44K' },
      { label: '61+ Days', value: 'KES 8K' },
    ],
  ),
  'tenant-evzone-ke': makeBillingResponse(
    'KES 3,112,800',
    'Kenya billing is scoped to EVzone Kenya stations, roaming partners, and operating-company tax obligations.',
    '98.4%',
    'KES 201,900',
    'KES 331,000 due Apr 5',
    [
      { id: 'INV-KE-1201', customer: 'Hubject', scope: 'Roaming settlement', amount: 'KES 484,220', dueDate: 'Apr 02, 2026', status: 'Issued' },
      { id: 'INV-KE-1202', customer: 'Kenya Fleet Program', scope: 'Managed charging', amount: 'KES 412,700', dueDate: 'Mar 26, 2026', status: 'Paid' },
      { id: 'INV-KE-1203', customer: 'Shell Recharge', scope: 'Roaming settlement', amount: 'KES 198,900', dueDate: 'Apr 04, 2026', status: 'Overdue' },
    ],
    [
      { label: 'Current', value: 'KES 1.4M' },
      { label: '1-30 Days', value: 'KES 176K' },
      { label: '31-60 Days', value: 'KES 22K' },
      { label: '61+ Days', value: 'KES 3K' },
    ],
  ),
  'tenant-westlands-mall': makeBillingResponse(
    'KES 428,400',
    'Hosted-site billing reflects the Westlands Mall tenant only, including revenue share, service fees, and portfolio aging.',
    '99.2%',
    'KES 28,200',
    'KES 42,000 due Apr 8',
    [
      { id: 'INV-WML-201', customer: 'Westlands Mall Group', scope: 'Hosted portfolio share', amount: 'KES 148,220', dueDate: 'Apr 06, 2026', status: 'Draft' },
      { id: 'INV-WML-202', customer: 'Premium Parking Ops', scope: 'Facility service fee', amount: 'KES 42,800', dueDate: 'Mar 27, 2026', status: 'Paid' },
      { id: 'INV-WML-203', customer: 'Partner roaming true-up', scope: 'Monthly true-up', amount: 'KES 28,200', dueDate: 'Apr 03, 2026', status: 'Issued' },
    ],
    [
      { label: 'Current', value: 'KES 186K' },
      { label: '1-30 Days', value: 'KES 24K' },
      { label: '31-60 Days', value: 'KES 4K' },
      { label: '61+ Days', value: 'KES 0' },
    ],
  ),
}

function makeSettlementResponse(
  note: string,
  ready: string,
  reconciling: string,
  settled: string,
  exceptions: SettlementResponse['exceptions'],
  records: SettlementResponse['records'],
): SettlementResponse {
  return {
    note,
    metrics: [
      { id: 'ready', label: 'Ready', value: ready, tone: 'default' },
      { id: 'reconciling', label: 'Reconciling', value: reconciling, tone: 'warning' },
      { id: 'settled', label: 'Settled', value: settled, tone: 'ok' },
      { id: 'exceptions', label: 'Exceptions', value: String(exceptions.length), tone: exceptions.length > 0 ? 'danger' : 'ok' },
    ],
    exceptions,
    records,
  }
}

const settlementByTenant: Record<TenantId, SettlementResponse> = {
  'tenant-global': makeSettlementResponse(
    'Settlement rolls up tenant-isolated partner cycles, exception handling, and reconciliation queues.',
    'KES 302,115',
    'KES 518,900',
    'KES 684,220',
    [
      { id: 'EX-31', partner: 'Shell Recharge', reason: 'CDR currency mismatch', impact: 'KES 22,400 held', action: 'Review conversion rule' },
      { id: 'EX-32', partner: 'Westlands Mall Group', reason: 'Revenue-share invoice awaiting approval', impact: 'Payout blocked', action: 'Request finance sign-off' },
    ],
    [
      { id: 'SET-1', partner: 'Hubject', period: 'Mar 1-15, 2026', netAmount: 'KES 684,220', status: 'Settled' },
      { id: 'SET-2', partner: 'Plugsurfing', period: 'Mar 16-31, 2026', netAmount: 'KES 518,900', status: 'Reconciling' },
      { id: 'SET-3', partner: 'Shell Recharge', period: 'Mar 16-31, 2026', netAmount: 'KES 302,115', status: 'Ready' },
    ],
  ),
  'tenant-evzone-ke': makeSettlementResponse(
    'Settlement is isolated to EVzone Kenya counterparties and local finance controls.',
    'KES 198,900',
    'KES 318,900',
    'KES 484,220',
    [
      { id: 'EX-KE-1', partner: 'Shell Recharge', reason: 'Outstanding approval for roaming fees', impact: 'KES 18,200 held', action: 'Approve roaming statement' },
    ],
    [
      { id: 'SET-KE-1', partner: 'Hubject', period: 'Mar 1-15, 2026', netAmount: 'KES 484,220', status: 'Settled' },
      { id: 'SET-KE-2', partner: 'Plugsurfing', period: 'Mar 16-31, 2026', netAmount: 'KES 318,900', status: 'Reconciling' },
      { id: 'SET-KE-3', partner: 'Shell Recharge', period: 'Mar 16-31, 2026', netAmount: 'KES 198,900', status: 'Ready' },
    ],
  ),
  'tenant-westlands-mall': makeSettlementResponse(
    'Hosted settlement reflects the Westlands Mall revenue-share agreement and site-owner approval workflow.',
    'KES 92,300',
    'KES 0',
    'KES 148,220',
    [
      { id: 'EX-WML-1', partner: 'Westlands Mall Group', reason: 'Awaiting site-owner invoice approval', impact: 'Next payout delayed', action: 'Approve hosted statement' },
    ],
    [
      { id: 'SET-WML-1', partner: 'Westlands Mall Revenue Share', period: 'Mar 1-15, 2026', netAmount: 'KES 148,220', status: 'Settled' },
      { id: 'SET-WML-2', partner: 'Westlands Mall Revenue Share', period: 'Mar 16-31, 2026', netAmount: 'KES 92,300', status: 'Ready' },
    ],
  ),
}

const integrationsByTenant: Record<TenantId, IntegrationModuleResponse> = {
  'tenant-global': {
    note: 'The integration registry is still mocked, but each connection now carries tenant-scoped health, sync, and auth posture.',
    metrics: [
      { id: 'connected', label: 'Connected', value: '8', tone: 'ok' },
      { id: 'degraded', label: 'Degraded', value: '2', tone: 'warning' },
      { id: 'pending', label: 'Pending', value: '1', tone: 'warning' },
      { id: 'coverage', label: 'Coverage', value: 'Finance + CRM + Roaming', tone: 'default' },
    ],
    connections: [
      { id: 'int-1', name: 'Hubject OCPI Gateway', category: 'Roaming', status: 'Connected', authMode: 'Token Exchange', lastSync: '2 min ago', latency: '420 ms' },
      { id: 'int-2', name: 'SAP Finance Bridge', category: 'ERP', status: 'Degraded', authMode: 'Service Account', lastSync: '18 min ago', latency: '2.8 s' },
      { id: 'int-3', name: 'Stripe Treasury', category: 'Payments', status: 'Connected', authMode: 'OAuth 2.0', lastSync: '34 sec ago', latency: '180 ms' },
      { id: 'int-4', name: 'Salesforce Enterprise', category: 'CRM', status: 'Pending', authMode: 'OAuth 2.0', lastSync: 'Awaiting approval', latency: '-' },
    ],
  },
  'tenant-evzone-ke': {
    note: 'Kenya operating-company integrations now expose sync posture and tenant-specific dependency health from MSW.',
    metrics: [
      { id: 'connected', label: 'Connected', value: '5', tone: 'ok' },
      { id: 'degraded', label: 'Degraded', value: '1', tone: 'warning' },
      { id: 'pending', label: 'Pending', value: '1', tone: 'warning' },
      { id: 'coverage', label: 'Coverage', value: 'Roaming + ERP + Payments', tone: 'default' },
    ],
    connections: [
      { id: 'int-ke-1', name: 'Hubject OCPI Gateway', category: 'Roaming', status: 'Connected', authMode: 'Token Exchange', lastSync: '3 min ago', latency: '460 ms' },
      { id: 'int-ke-2', name: 'SAP Finance Bridge', category: 'ERP', status: 'Degraded', authMode: 'Service Account', lastSync: '18 min ago', latency: '2.8 s' },
      { id: 'int-ke-3', name: 'DPO Payments', category: 'Payments', status: 'Connected', authMode: 'API Key', lastSync: '51 sec ago', latency: '220 ms' },
    ],
  },
  'tenant-westlands-mall': {
    note: 'Hosted-site integrations are still mocked, but now reflect the site portfolio’s payment, CRM, and roaming dependencies.',
    metrics: [
      { id: 'connected', label: 'Connected', value: '3', tone: 'ok' },
      { id: 'degraded', label: 'Degraded', value: '0', tone: 'ok' },
      { id: 'pending', label: 'Pending', value: '1', tone: 'warning' },
      { id: 'coverage', label: 'Coverage', value: 'Hosted billing + access', tone: 'default' },
    ],
    connections: [
      { id: 'int-wml-1', name: 'Property PMS Sync', category: 'CRM', status: 'Connected', authMode: 'SAML + API Token', lastSync: '6 min ago', latency: '510 ms' },
      { id: 'int-wml-2', name: 'DPO Hosted Billing', category: 'Payments', status: 'Connected', authMode: 'API Key', lastSync: '1 min ago', latency: '240 ms' },
      { id: 'int-wml-3', name: 'Plugsurfing OCPI Link', category: 'Roaming', status: 'Pending', authMode: 'Token Exchange', lastSync: 'Awaiting counterpart', latency: '-' },
    ],
  },
}

const webhooksByTenant: Record<TenantId, WebhooksModuleResponse> = {
  'tenant-global': {
    note: 'Webhook management remains mocked, but endpoint health, signing posture, and recent deliveries now reflect realistic platform operations.',
    metrics: [
      { id: 'healthy', label: 'Healthy', value: '12', tone: 'ok' },
      { id: 'retrying', label: 'Retrying', value: '2', tone: 'warning' },
      { id: 'muted', label: 'Muted', value: '1', tone: 'warning' },
      { id: 'deliveries', label: '24h Deliveries', value: '148K', tone: 'default' },
    ],
    endpoints: [
      { id: 'wh-1', target: 'https://erp.evzone.io/webhooks/finance', eventGroup: 'billing.*', lastDelivery: '42 sec ago', signingStatus: 'Secret rotated 7d ago', status: 'Healthy', successRate: '99.98%' },
      { id: 'wh-2', target: 'https://partners.hubject.io/ocpi/events', eventGroup: 'roaming.cdr.*', lastDelivery: '3 min ago', signingStatus: 'Secret rotated 14d ago', status: 'Retrying', successRate: '96.2%' },
      { id: 'wh-3', target: 'https://crm.evzone.io/hooks/incidents', eventGroup: 'incidents.*', lastDelivery: 'Muted for maintenance', signingStatus: 'Secret rotated today', status: 'Muted', successRate: '-' },
    ],
    recentDeliveries: [
      { id: 'dlv-1', endpoint: 'ERP Finance', event: 'billing.invoice.issued', result: 'Delivered', latency: '190 ms', time: '42 sec ago' },
      { id: 'dlv-2', endpoint: 'Hubject Events', event: 'roaming.cdr.sent', result: 'Retried', latency: '4.8 s', time: '3 min ago' },
      { id: 'dlv-3', endpoint: 'CRM Incidents', event: 'incident.created', result: 'Failed', latency: '6.2 s', time: '12 min ago' },
    ],
  },
  'tenant-evzone-ke': {
    note: 'Kenya webhook delivery status now reflects the operating-company event streams and retry backlog.',
    metrics: [
      { id: 'healthy', label: 'Healthy', value: '7', tone: 'ok' },
      { id: 'retrying', label: 'Retrying', value: '1', tone: 'warning' },
      { id: 'muted', label: 'Muted', value: '0', tone: 'ok' },
      { id: 'deliveries', label: '24h Deliveries', value: '82K', tone: 'default' },
    ],
    endpoints: [
      { id: 'wh-ke-1', target: 'https://finance.ke.evzone.io/webhooks', eventGroup: 'billing.*', lastDelivery: '1 min ago', signingStatus: 'Secret rotated 9d ago', status: 'Healthy', successRate: '99.9%' },
      { id: 'wh-ke-2', target: 'https://hubject.ke.evzone.io/events', eventGroup: 'roaming.cdr.*', lastDelivery: '4 min ago', signingStatus: 'Secret rotated 16d ago', status: 'Retrying', successRate: '95.8%' },
    ],
    recentDeliveries: [
      { id: 'dlv-ke-1', endpoint: 'Kenya Finance', event: 'billing.invoice.issued', result: 'Delivered', latency: '220 ms', time: '1 min ago' },
      { id: 'dlv-ke-2', endpoint: 'Hubject Kenya', event: 'roaming.cdr.sent', result: 'Retried', latency: '5.1 s', time: '4 min ago' },
    ],
  },
  'tenant-westlands-mall': {
    note: 'Hosted-site webhooks are mocked but now expose health, muted maintenance windows, and recent delivery outcomes.',
    metrics: [
      { id: 'healthy', label: 'Healthy', value: '3', tone: 'ok' },
      { id: 'retrying', label: 'Retrying', value: '0', tone: 'ok' },
      { id: 'muted', label: 'Muted', value: '1', tone: 'warning' },
      { id: 'deliveries', label: '24h Deliveries', value: '12K', tone: 'default' },
    ],
    endpoints: [
      { id: 'wh-wml-1', target: 'https://ops.westlandsmall.com/hooks/billing', eventGroup: 'billing.*', lastDelivery: '5 min ago', signingStatus: 'Secret rotated 3d ago', status: 'Healthy', successRate: '100%' },
      { id: 'wh-wml-2', target: 'https://ops.westlandsmall.com/hooks/access', eventGroup: 'session.*', lastDelivery: 'Muted during site maintenance', signingStatus: 'Secret rotated 1d ago', status: 'Muted', successRate: '-' },
    ],
    recentDeliveries: [
      { id: 'dlv-wml-1', endpoint: 'Westlands Billing', event: 'billing.invoice.draft', result: 'Delivered', latency: '260 ms', time: '5 min ago' },
      { id: 'dlv-wml-2', endpoint: 'Westlands Access', event: 'session.started', result: 'Retried', latency: '1.8 s', time: '14 min ago' },
    ],
  },
}

const notificationsByTenant: Record<TenantId, NotificationsModuleResponse> = {
  'tenant-global': {
    note: 'Notification routing remains mocked, but delivery posture, escalation channels, and dispatch activity are now visible by tenant.',
    metrics: [
      { id: 'active-routes', label: 'Active Routes', value: '24', tone: 'ok' },
      { id: 'delivery-rate', label: 'Delivery Rate', value: '99.1%', tone: 'ok' },
      { id: 'escalations', label: 'Escalations', value: '6', tone: 'warning' },
      { id: 'suppressed', label: 'Suppressed', value: '18', tone: 'warning' },
    ],
    channels: [
      { id: 'ch-1', name: 'Email Ops', coverage: 'Operational digests and incidents', status: 'Active', volume: '12.4K / day' },
      { id: 'ch-2', name: 'Slack NOC', coverage: 'Critical fleet alerts', status: 'Active', volume: '420 / day' },
      { id: 'ch-3', name: 'SMS Escalation', coverage: 'Sev-1 after-hours events', status: 'Fallback', volume: '38 / day' },
      { id: 'ch-4', name: 'Push Mobile', coverage: 'Field technician dispatch', status: 'Paused', volume: '0 / day' },
    ],
    recentDispatches: [
      { id: 'ntf-1', channel: 'Slack NOC', recipient: '#noc-global', rule: 'Critical site outage', status: 'Delivered', time: '2 min ago' },
      { id: 'ntf-2', channel: 'SMS Escalation', recipient: 'On-call finance lead', rule: 'Settlement exception > KES 20K', status: 'Escalated', time: '11 min ago' },
      { id: 'ntf-3', channel: 'Email Ops', recipient: 'regional-managers@evzone.io', rule: 'Morning executive digest', status: 'Queued', time: '18 min ago' },
    ],
  },
  'tenant-evzone-ke': {
    note: 'Kenya notification routing reflects operating-company incidents, finance escalations, and local field dispatch.',
    metrics: [
      { id: 'active-routes', label: 'Active Routes', value: '16', tone: 'ok' },
      { id: 'delivery-rate', label: 'Delivery Rate', value: '99.4%', tone: 'ok' },
      { id: 'escalations', label: 'Escalations', value: '3', tone: 'warning' },
      { id: 'suppressed', label: 'Suppressed', value: '9', tone: 'warning' },
    ],
    channels: [
      { id: 'ch-ke-1', name: 'Email Ops KE', coverage: 'Daily ops and finance', status: 'Active', volume: '7.2K / day' },
      { id: 'ch-ke-2', name: 'Slack KE NOC', coverage: 'Critical site alerts', status: 'Active', volume: '210 / day' },
      { id: 'ch-ke-3', name: 'SMS Escalation KE', coverage: 'Sev-1 field alerts', status: 'Fallback', volume: '19 / day' },
    ],
    recentDispatches: [
      { id: 'ntf-ke-1', channel: 'Slack KE NOC', recipient: '#ke-noc', rule: 'Critical charger outage', status: 'Delivered', time: '3 min ago' },
      { id: 'ntf-ke-2', channel: 'SMS Escalation KE', recipient: 'Kenya on-call lead', rule: 'Settlement exception > KES 10K', status: 'Escalated', time: '16 min ago' },
    ],
  },
  'tenant-westlands-mall': {
    note: 'Hosted-site notification channels now show the property team’s active, paused, and fallback routing posture.',
    metrics: [
      { id: 'active-routes', label: 'Active Routes', value: '8', tone: 'ok' },
      { id: 'delivery-rate', label: 'Delivery Rate', value: '99.8%', tone: 'ok' },
      { id: 'escalations', label: 'Escalations', value: '1', tone: 'warning' },
      { id: 'suppressed', label: 'Suppressed', value: '4', tone: 'warning' },
    ],
    channels: [
      { id: 'ch-wml-1', name: 'Property Email', coverage: 'Hosted finance and uptime', status: 'Active', volume: '1.8K / day' },
      { id: 'ch-wml-2', name: 'Security Desk SMS', coverage: 'After-hours access alerts', status: 'Fallback', volume: '8 / day' },
      { id: 'ch-wml-3', name: 'Tenant App Push', coverage: 'Customer concierge updates', status: 'Paused', volume: '0 / day' },
    ],
    recentDispatches: [
      { id: 'ntf-wml-1', channel: 'Property Email', recipient: 'ops@westlandsmall.com', rule: 'Hosted billing draft ready', status: 'Delivered', time: '7 min ago' },
      { id: 'ntf-wml-2', channel: 'Security Desk SMS', recipient: 'Security desk lead', rule: 'After-hours communication lag', status: 'Escalated', time: '22 min ago' },
    ],
  },
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

function getSwapPacks(tenantId: TenantId) {
  return swapStations
    .filter((record) => record.tenantIds.includes(tenantId))
    .flatMap((record) => record.packs)
}

function getSwapDispatches(tenantId: TenantId) {
  return listTenantScoped(swapDispatchRecords, tenantId)
}

function getNextSwapDispatchId() {
  const highestId = swapDispatchRecords.reduce((highest, record) => {
    const parsedId = Number(record.id.replace('DSP-', ''))
    return Number.isFinite(parsedId) ? Math.max(highest, parsedId) : highest
  }, swapDispatchCounter)

  swapDispatchCounter = highestId + 1
  return `DSP-${String(swapDispatchCounter).padStart(3, '0')}`
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildSwapSessionStats(tenantId: TenantId) {
  const stats = new Map<string, { completed: number; flagged: number; inProgress: number }>()

  for (const session of listTenantScoped(batterySwapSessions, tenantId)) {
    const current = stats.get(session.stationName) ?? { completed: 0, flagged: 0, inProgress: 0 }
    if (session.status === 'Completed') {
      current.completed += 1
    } else if (session.status === 'Flagged') {
      current.flagged += 1
    } else {
      current.inProgress += 1
    }
    stats.set(session.stationName, current)
  }

  return stats
}

interface StationBalanceProfile {
  deficitScore: number
  deficitUnits: number
  demandTrendLabel: 'Rising' | 'Stable' | 'Cooling'
  id: string
  name: string
  readyPacks: number
  reserveFloor: number
  runwayHours: number | null
  surplusScore: number
  surplusUnits: number
  swapsPerHour: number
}

function computeStationBalanceProfiles(tenantId: TenantId): StationBalanceProfile[] {
  const sessionsByStation = buildSwapSessionStats(tenantId)
  const stationsForTenant = swapStations.filter((station) => station.tenantIds.includes(tenantId))

  return stationsForTenant.map((station) => {
    const sessionStats = sessionsByStation.get(station.name) ?? { completed: 0, flagged: 0, inProgress: 0 }
    const reserveFloor = Math.max(6, station.cabinetCount * 4)
    const demandScore = (sessionStats.completed * 2) + (sessionStats.inProgress * 3) + (sessionStats.flagged * 3)
    const demandPressure = Math.max(1, Math.ceil(demandScore / 3))
    const targetReadyFloor = reserveFloor + (demandPressure * 2)
    const deficitUnits = Math.max(0, targetReadyFloor - station.readyPacks)
    const surplusUnits = Math.max(0, station.readyPacks - targetReadyFloor)
    const swapsPerHour = (sessionStats.completed + sessionStats.flagged + (sessionStats.inProgress * 0.5)) / 24
    const runwayHours = swapsPerHour > 0 ? station.readyPacks / swapsPerHour : null
    const availabilityPenalty = runwayHours !== null && runwayHours < 10 ? (10 - runwayHours) * 2.5 : 0
    const statusPenalty = station.status === 'Offline' ? 18 : station.status === 'Degraded' ? 10 : 0
    const deficitScore = (deficitUnits * 14) + (demandPressure * 6) + availabilityPenalty + statusPenalty
    const surplusScore = (surplusUnits * 12) + (runwayHours !== null && runwayHours > 16 ? (runwayHours - 16) : 0)
    const demandTrendLabel: StationBalanceProfile['demandTrendLabel'] =
      sessionStats.inProgress + sessionStats.flagged >= 2
        ? 'Rising'
        : sessionStats.completed >= 2
          ? 'Stable'
          : 'Cooling'

    return {
      deficitScore,
      deficitUnits,
      demandTrendLabel,
      id: station.id,
      name: station.name,
      readyPacks: station.readyPacks,
      reserveFloor,
      runwayHours,
      surplusScore,
      surplusUnits,
      swapsPerHour,
    }
  })
}

function formatRunwayImpact(deltaHours: number | null) {
  if (deltaHours === null || !Number.isFinite(deltaHours)) {
    return 'Runway impact unavailable'
  }

  const sign = deltaHours >= 0 ? '+' : ''
  return `${sign}${deltaHours.toFixed(1)}h runway at destination`
}

function buildRebalancingRecommendations(tenantId: TenantId): SwapRebalancingRecommendation[] {
  const profiles = computeStationBalanceProfiles(tenantId)
  const dispatchByRecommendation = new Map<string, SwapDispatchRecord>()

  for (const dispatch of getSwapDispatches(tenantId)) {
    dispatchByRecommendation.set(dispatch.recommendationId, dispatch)
  }

  const deficits = profiles
    .filter((profile) => profile.deficitUnits > 0)
    .sort((left, right) => right.deficitScore - left.deficitScore)
    .map((profile) => ({ ...profile, remaining: profile.deficitUnits }))

  const surpluses = profiles
    .filter((profile) => profile.surplusUnits > 0)
    .sort((left, right) => right.surplusScore - left.surplusScore)
    .map((profile) => ({ ...profile, remaining: profile.surplusUnits }))

  const recommendations: SwapRebalancingRecommendation[] = []

  for (const deficit of deficits) {
    for (const surplus of surpluses) {
      if (deficit.remaining <= 0) {
        break
      }

      if (surplus.remaining <= 0 || surplus.id === deficit.id) {
        continue
      }

      const transferable = Math.min(deficit.remaining, surplus.remaining, 4)
      if (transferable < 1) {
        continue
      }

      const destinationRunwayCurrent = deficit.runwayHours
      const destinationRunwayProjected = deficit.swapsPerHour > 0
        ? (deficit.readyPacks + transferable) / deficit.swapsPerHour
        : null
      const runwayDelta = destinationRunwayProjected !== null && destinationRunwayCurrent !== null
        ? destinationRunwayProjected - destinationRunwayCurrent
        : null
      const confidencePercent = Math.round(
        clampNumber(56 + (Math.min(deficit.deficitScore, surplus.surplusScore) * 0.35) + (transferable * 4), 55, 96),
      )
      const recommendationId = `RB-${surplus.id}-${deficit.id}`
      const existingDispatch = dispatchByRecommendation.get(recommendationId)

      recommendations.push({
        id: recommendationId,
        fromStationId: surplus.id,
        fromStationName: surplus.name,
        toStationId: deficit.id,
        toStationName: deficit.name,
        packsSuggested: transferable,
        confidencePercent,
        etaImpactLabel: formatRunwayImpact(runwayDelta),
        demandTrendLabel: deficit.demandTrendLabel,
        priority: deficit.deficitScore >= 60 ? 'Critical' : deficit.deficitScore >= 35 ? 'High' : 'Medium',
        reason: `Ready-pack gap ${deficit.deficitUnits} vs reserve floor ${deficit.reserveFloor}; source surplus ${surplus.surplusUnits}.`,
        sourceSurplusScore: Math.round(surplus.surplusScore),
        targetDeficitScore: Math.round(deficit.deficitScore),
        status: existingDispatch?.status ?? 'Proposed',
      })

      deficit.remaining -= transferable
      surplus.remaining -= transferable
    }
  }

  return recommendations.slice(0, 8)
}

const DISPATCH_ACTION_TRANSITIONS: Record<SwapDispatchStatus, SwapDispatchActionRequest['action'][]> = {
  Proposed: ['Approve', 'Reject'],
  Approved: ['MarkInTransit', 'Reject'],
  Rejected: [],
  'In Transit': ['MarkCompleted'],
  Completed: [],
}

const PACK_STATUS_TRANSITIONS: Record<BatteryPackRecord['status'], BatteryPackRecord['status'][]> = {
  Ready: ['Charging', 'Reserved', 'Installed', 'Quarantined'],
  Charging: ['Ready', 'Reserved', 'Quarantined'],
  Reserved: ['Ready', 'Installed', 'Quarantined'],
  Installed: ['Ready', 'Charging', 'Quarantined'],
  Quarantined: ['Ready', 'Charging', 'Reserved', 'Retired'],
  Retired: [],
}

const RETIREMENT_POLICY = {
  monitorCycleCount: 280,
  monitorSohPercent: 92,
  retireCycleCount: 320,
  retireSohPercent: 88,
} as const

let packTimelineCounter = 1

function nextTimelineEventId(packId: string) {
  packTimelineCounter += 1
  return `${packId}-evt-${packTimelineCounter}`
}

function parseSohPercent(healthLabel: string) {
  const match = healthLabel.match(/(\d+(?:\.\d+)?)\s*%/)
  if (!match) {
    return null
  }

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function evaluatePackRetirementPolicy(pack: BatteryPackRecord): BatteryPackRetirementAssessment {
  const sohPercent = parseSohPercent(pack.healthLabel)
  const cycleThresholdBreached = pack.cycleCount >= RETIREMENT_POLICY.retireCycleCount
  const sohThresholdBreached = sohPercent !== null && sohPercent <= RETIREMENT_POLICY.retireSohPercent
  const cycleMonitorBreached = pack.cycleCount >= RETIREMENT_POLICY.monitorCycleCount
  const sohMonitorBreached = sohPercent !== null && sohPercent <= RETIREMENT_POLICY.monitorSohPercent

  if (cycleThresholdBreached || sohThresholdBreached) {
    const reasons = [
      cycleThresholdBreached ? `cycle count ${pack.cycleCount} >= ${RETIREMENT_POLICY.retireCycleCount}` : null,
      sohThresholdBreached ? `SoH ${sohPercent?.toFixed(0)}% <= ${RETIREMENT_POLICY.retireSohPercent}%` : null,
    ].filter(Boolean).join('; ')

    return {
      action: 'Retire',
      cycleThresholdBreached,
      sohThresholdBreached,
      reason: `Retirement recommended: ${reasons}.`,
      evaluatedAtLabel: 'just now',
    }
  }

  if (cycleMonitorBreached || sohMonitorBreached) {
    const reasons = [
      cycleMonitorBreached ? `cycle count ${pack.cycleCount} >= ${RETIREMENT_POLICY.monitorCycleCount}` : null,
      sohMonitorBreached ? `SoH ${sohPercent?.toFixed(0)}% <= ${RETIREMENT_POLICY.monitorSohPercent}%` : null,
    ].filter(Boolean).join('; ')

    return {
      action: 'Monitor',
      cycleThresholdBreached: false,
      sohThresholdBreached: false,
      reason: `Monitor closely: ${reasons}.`,
      evaluatedAtLabel: 'just now',
    }
  }

  return {
    action: 'None',
    cycleThresholdBreached: false,
    sohThresholdBreached: false,
    reason: 'Pack is operating within retirement policy thresholds.',
    evaluatedAtLabel: 'just now',
  }
}

function appendPackTimelineEvent(pack: BatteryPackRecord, event: Omit<BatteryPackTimelineEvent, 'id'>) {
  const entry: BatteryPackTimelineEvent = {
    id: nextTimelineEventId(pack.id),
    ...event,
  }

  const existing = pack.timeline ?? []
  pack.timeline = [entry, ...existing].slice(0, 16)
}

function refreshPackRetirementAssessment(pack: BatteryPackRecord) {
  if (pack.status === 'Retired') {
    pack.retirementAssessment = {
      action: 'Retire',
      cycleThresholdBreached: true,
      sohThresholdBreached: true,
      reason: 'Pack is retired and removed from active dispatch.',
      evaluatedAtLabel: 'just now',
    }
    return
  }

  pack.retirementAssessment = evaluatePackRetirementPolicy(pack)
}

function extractCabinetIndex(slotLabel: string) {
  const match = slotLabel.match(/Cab\\s+(\\d+)/i)
  if (!match) {
    return null
  }

  const parsed = Number(match[1])
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null
  }

  return parsed - 1
}

function rebuildSwapStationPackAggregates(station: TenantScoped<SwapStationDetail>) {
  station.readyPacks = station.packs.filter((pack) => pack.status === 'Ready').length
  station.chargingPacks = station.packs.filter((pack) => pack.status === 'Charging').length

  station.cabinets.forEach((cabinet, index) => {
    const packsInCabinet = station.packs.filter((pack) => extractCabinetIndex(pack.slotLabel) === index)
    cabinet.availableChargedPacks = packsInCabinet.filter((pack) => pack.status === 'Ready').length
    cabinet.chargingPacks = packsInCabinet.filter((pack) => pack.status === 'Charging').length
    cabinet.reservedPacks = packsInCabinet.filter((pack) => pack.status === 'Reserved').length
  })
}

function findPackRecord(packId: string, tenantId: TenantId) {
  for (const station of swapStations) {
    if (!station.tenantIds.includes(tenantId)) {
      continue
    }

    const pack = station.packs.find((candidate) => candidate.id === packId)
    if (pack) {
      return { station, pack }
    }
  }

  return null
}

type SwapPackMutationResult =
  | { ok: true; message: string; pack: BatteryPackRecord }
  | { ok: false; message: string }

type SwapDispatchMutationResult =
  | { ok: true; message: string; dispatch: SwapDispatchRecord }
  | { ok: false; message: string; notFound?: boolean }

function toSwapStationSummary(record: SwapStationDetail) {
  const {
    alerts,
    cabinets,
    gridBufferLabel,
    packs,
    recentSwaps,
    ...summary
  } = record

  void alerts
  void cabinets
  void gridBufferLabel
  void packs
  void recentSwaps

  return summary
}

function buildBatteryInventory(tenantId: TenantId): BatteryInventoryResponse {
  const packs = getSwapPacks(tenantId)
  const count = (status: BatteryPackRecord['status']) => packs.filter((pack) => pack.status === status).length

  return {
    metrics: [
      { id: 'ready', label: 'Ready Packs', value: `${count('Ready')}`, tone: 'ok' },
      { id: 'charging', label: 'Charging', value: `${count('Charging')}`, tone: 'default' },
      { id: 'reserved', label: 'Reserved', value: `${count('Reserved') + count('Installed')}`, tone: 'warning' },
      { id: 'quarantined', label: 'Quarantined', value: `${count('Quarantined')}`, tone: 'danger' },
      { id: 'retired', label: 'Retired', value: `${count('Retired')}`, tone: 'default' },
    ],
    packs,
    balancingNote: tenantId === 'tenant-westlands-mall'
      ? 'Hosted-site inventory stays isolated to the Westlands hybrid swap annex and its rider reserve buffer.'
      : tenantId === 'tenant-evzone-ke'
        ? 'Kenya inventory balancing prioritizes airport logistics demand before reallocating packs to premium city sites.'
        : 'Global battery balancing highlights reserve gaps across both public charging hubs and dedicated swap yards.',
  }
}

function initializeSwapPackLifecycleState() {
  for (const station of swapStations) {
    for (const pack of station.packs) {
      if (!pack.timeline || pack.timeline.length === 0) {
        const seeded: BatteryPackTimelineEvent[] = []
        const relatedSessions = batterySwapSessions
          .filter((session) => session.outgoingPackId === pack.id || session.returnedPackId === pack.id)
          .slice(0, 2)

        for (const session of relatedSessions) {
          seeded.push({
            id: nextTimelineEventId(pack.id),
            type: 'Swap',
            summary: `${session.id} ${session.status.toLowerCase()} (${session.turnaroundLabel}).`,
            timeLabel: session.initiatedAt,
          })
        }

        if (pack.status === 'Quarantined' || pack.inspectionStatus === 'Failed') {
          seeded.push({
            id: nextTimelineEventId(pack.id),
            type: 'Inspection',
            summary: 'Safety inspection failed. Pack moved to quarantine hold.',
            timeLabel: pack.lastInspectionLabel ?? 'recently',
          })
        }

        seeded.push({
          id: nextTimelineEventId(pack.id),
          type: 'Lifecycle',
          summary: `Pack status is ${pack.status}.`,
          timeLabel: pack.lastSeenLabel,
        })

        pack.timeline = seeded
      }

      refreshPackRetirementAssessment(pack)
    }
  }
}

initializeSwapPackLifecycleState()

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
export function createChargePoint(payload: CreateChargePointRequest, tenantId: TenantId) {
  const stationRecord = stations.find((record) => record.id === payload.stationId && record.tenantIds.includes(tenantId))
  if (!stationRecord) {
    return null
  }

  const chargePointId = getNextChargePointId()
  const createdRecord: TenantScoped<ChargePointDetail> = {
    id: chargePointId,
    stationId: payload.stationId,
    stationName: stationRecord.name,
    connectorType: payload.connectorType.trim(),
    connectorTypes: [payload.connectorType.trim()],
    model: payload.model.trim(),
    manufacturer: payload.manufacturer.trim(),
    serialNumber: payload.serialNumber.trim(),
    firmwareVersion: '1.0.0',
    ocppId: payload.ocppId.trim(),
    ocppVersion: payload.ocppVersion.trim(),
    status: 'Online',
    ocppStatus: 'Available',
    maxCapacityKw: payload.maxCapacityKw,
    lastHeartbeatLabel: 'just now',
    stale: false,
    roamingPublished: false,
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot'],
    unitHealth: { ocppConnection: 'Connected', lastHeartbeat: 'just now', errorCode: 'NoError' },
    tenantIds: [tenantId],
  }

  chargePoints.push(createdRecord)
  stationRecord.chargePoints.push({
    id: chargePointId,
    status: 'Available',
    type: createdRecord.connectorType,
    lastHeartbeatLabel: 'just now',
  })

  return stripTenantIds(createdRecord)
}
export function listSessions(tenantId: TenantId) { return listTenantScoped(sessions, tenantId) }
export function listSwapStations(tenantId: TenantId) { return swapStations.filter((record) => record.tenantIds.includes(tenantId)).map((record) => toSwapStationSummary(stripTenantIds(record))) }
export function getSwapStationById(id: string, tenantId: TenantId) { const station = swapStations.find((record) => record.id === id && record.tenantIds.includes(tenantId)); return station ? stripTenantIds(station) : undefined }
export function listBatterySwapSessions(tenantId: TenantId) { return listTenantScoped(batterySwapSessions, tenantId) }
export function getBatteryInventory(tenantId: TenantId) { return buildBatteryInventory(tenantId) }
export function getSwapRebalancing(tenantId: TenantId): SwapRebalancingResponse {
  const recommendations = buildRebalancingRecommendations(tenantId)
  const dispatches = getSwapDispatches(tenantId)
    .sort((left, right) => right.id.localeCompare(left.id))

  return {
    generatedAtLabel: 'just now',
    recommendations,
    dispatches,
  }
}

export function applySwapDispatchAction(recommendationId: string, payload: SwapDispatchActionRequest, tenantId: TenantId): SwapDispatchMutationResult {
  const recommendations = buildRebalancingRecommendations(tenantId)
  const recommendation = recommendations.find((candidate) => candidate.id === recommendationId)

  if (!recommendation) {
    return { ok: false, message: 'Rebalancing recommendation not found for this tenant.', notFound: true }
  }

  let dispatchRecord = swapDispatchRecords.find((record) => record.recommendationId === recommendationId && record.tenantIds.includes(tenantId))
  const currentStatus: SwapDispatchStatus = dispatchRecord?.status ?? 'Proposed'
  const allowedActions = DISPATCH_ACTION_TRANSITIONS[currentStatus]

  if (!allowedActions.includes(payload.action)) {
    return { ok: false, message: `Cannot apply ${payload.action} while dispatch is ${currentStatus}.` }
  }

  const nextStatus: SwapDispatchStatus =
    payload.action === 'Approve'
      ? 'Approved'
      : payload.action === 'Reject'
        ? 'Rejected'
        : payload.action === 'MarkInTransit'
          ? 'In Transit'
          : 'Completed'

  const defaultNote = payload.action === 'Approve'
    ? 'Dispatch approved by operations.'
    : payload.action === 'Reject'
      ? 'Recommendation rejected by operations.'
      : payload.action === 'MarkInTransit'
        ? 'Dispatch rider has departed source station.'
        : 'Dispatch received and closed at destination station.'

  if (!dispatchRecord) {
    dispatchRecord = {
      id: getNextSwapDispatchId(),
      recommendationId,
      fromStationName: recommendation.fromStationName,
      toStationName: recommendation.toStationName,
      packs: recommendation.packsSuggested,
      confidencePercent: recommendation.confidencePercent,
      etaImpactLabel: recommendation.etaImpactLabel,
      status: nextStatus as SwapDispatchRecord['status'],
      history: [{
        status: 'Proposed',
        timeLabel: 'just now',
        actorLabel: 'Rebalancing Engine',
        note: recommendation.reason,
      }],
      tenantIds: [tenantId],
    }
    swapDispatchRecords.push(dispatchRecord)
  } else {
    dispatchRecord.status = nextStatus as SwapDispatchRecord['status']
  }

  dispatchRecord.history.push({
    status: nextStatus,
    timeLabel: 'just now',
    actorLabel: 'Dispatch Operator',
    note: payload.note?.trim() || defaultNote,
  })

  const message = payload.action === 'Approve'
    ? `Dispatch approved for ${recommendation.packsSuggested} packs.`
    : payload.action === 'Reject'
      ? `Recommendation ${recommendationId} rejected.`
      : payload.action === 'MarkInTransit'
        ? `Dispatch ${dispatchRecord.id} is now in transit.`
        : `Dispatch ${dispatchRecord.id} completed successfully.`

  return {
    ok: true,
    message,
    dispatch: stripTenantIds(dispatchRecord),
  }
}
export function transitionSwapPack(packId: string, payload: SwapPackTransitionRequest, tenantId: TenantId): SwapPackMutationResult {
  const resolved = findPackRecord(packId, tenantId)
  if (!resolved) {
    return { ok: false, message: 'Battery pack not found for the active tenant.' }
  }

  const nextStatus = payload.toStatus
  const currentStatus = resolved.pack.status
  if (nextStatus === currentStatus) {
    return { ok: false, message: `Pack ${packId} is already in ${currentStatus} status.` }
  }

  const allowedTransitions = PACK_STATUS_TRANSITIONS[currentStatus]
  if (!allowedTransitions.includes(nextStatus)) {
    return { ok: false, message: `Cannot transition pack ${packId} from ${currentStatus} to ${nextStatus}.` }
  }

  resolved.pack.status = nextStatus
  resolved.pack.lastSeenLabel = 'just now'
  if (nextStatus === 'Quarantined') {
    resolved.pack.inspectionStatus = 'Failed'
    resolved.pack.lastInspectionLabel = 'just now'
    resolved.pack.inspectionNote = payload.note ?? 'Auto quarantine via lifecycle transition.'
  }
  if (nextStatus === 'Retired') {
    resolved.pack.retirementDecision = {
      action: 'Approved',
      actorLabel: 'Lifecycle Operator',
      note: payload.note?.trim() || 'Retired through lifecycle transition.',
      timeLabel: 'just now',
    }
  }

  appendPackTimelineEvent(resolved.pack, {
    type: 'Lifecycle',
    summary: `Lifecycle transition applied: ${currentStatus} -> ${nextStatus}.`,
    timeLabel: 'just now',
  })
  refreshPackRetirementAssessment(resolved.pack)

  rebuildSwapStationPackAggregates(resolved.station)

  return {
    ok: true,
    message: `Pack ${packId} transitioned to ${nextStatus}.`,
    pack: { ...resolved.pack },
  }
}

export function inspectSwapPack(packId: string, payload: SwapPackInspectionRequest, tenantId: TenantId): SwapPackMutationResult {
  const resolved = findPackRecord(packId, tenantId)
  if (!resolved) {
    return { ok: false, message: 'Battery pack not found for the active tenant.' }
  }

  resolved.pack.inspectionStatus = payload.result
  resolved.pack.inspectionNote = payload.note?.trim() || undefined
  resolved.pack.lastInspectionLabel = 'just now'
  resolved.pack.lastSeenLabel = 'just now'
  appendPackTimelineEvent(resolved.pack, {
    type: 'Inspection',
    summary: `Inspection recorded as ${payload.result}.`,
    timeLabel: 'just now',
  })

  if (payload.result === 'Failed') {
    const previousStatus = resolved.pack.status
    resolved.pack.status = 'Quarantined'
    appendPackTimelineEvent(resolved.pack, {
      type: 'Lifecycle',
      summary: `Lifecycle transition applied: ${previousStatus} -> Quarantined.`,
      timeLabel: 'just now',
    })
    refreshPackRetirementAssessment(resolved.pack)
    rebuildSwapStationPackAggregates(resolved.station)
    return {
      ok: true,
      message: `Inspection failed. Pack ${packId} moved to Quarantined.`,
      pack: { ...resolved.pack },
    }
  }

  if (payload.result === 'Passed' && resolved.pack.status === 'Quarantined') {
    resolved.pack.status = 'Ready'
    appendPackTimelineEvent(resolved.pack, {
      type: 'Lifecycle',
      summary: 'Lifecycle transition applied: Quarantined -> Ready.',
      timeLabel: 'just now',
    })
  }

  refreshPackRetirementAssessment(resolved.pack)
  rebuildSwapStationPackAggregates(resolved.station)

  return {
    ok: true,
    message: `Inspection ${payload.result.toLowerCase()} recorded for ${packId}.`,
    pack: { ...resolved.pack },
  }
}

export function applySwapPackRetirementDecision(packId: string, payload: SwapPackRetirementRequest, tenantId: TenantId): SwapPackMutationResult {
  const resolved = findPackRecord(packId, tenantId)
  if (!resolved) {
    return { ok: false, message: 'Battery pack not found for the active tenant.' }
  }

  refreshPackRetirementAssessment(resolved.pack)

  if (resolved.pack.status === 'Retired') {
    return { ok: false, message: `Pack ${packId} is already retired.` }
  }

  if (!resolved.pack.retirementAssessment || resolved.pack.retirementAssessment.action === 'None') {
    return { ok: false, message: `Pack ${packId} does not currently meet retirement policy thresholds.` }
  }

  if (payload.action === 'DeferRetirement') {
    resolved.pack.retirementDecision = {
      action: 'Deferred',
      actorLabel: 'Lifecycle Operator',
      note: payload.note?.trim() || 'Retirement deferred pending additional diagnostics.',
      timeLabel: 'just now',
    }
    appendPackTimelineEvent(resolved.pack, {
      type: 'Retirement',
      summary: 'Retirement recommendation deferred pending follow-up review.',
      timeLabel: 'just now',
    })
    refreshPackRetirementAssessment(resolved.pack)
    rebuildSwapStationPackAggregates(resolved.station)
    return {
      ok: true,
      message: `Retirement for ${packId} deferred.`,
      pack: { ...resolved.pack },
    }
  }

  const previousStatus = resolved.pack.status
  resolved.pack.status = 'Retired'
  resolved.pack.lastSeenLabel = 'just now'
  resolved.pack.retirementDecision = {
    action: 'Approved',
    actorLabel: 'Lifecycle Operator',
    note: payload.note?.trim() || 'Retirement approved by policy workflow.',
    timeLabel: 'just now',
  }

  appendPackTimelineEvent(resolved.pack, {
    type: 'Retirement',
    summary: 'Retirement approved and pack removed from active fleet dispatch.',
    timeLabel: 'just now',
  })
  appendPackTimelineEvent(resolved.pack, {
    type: 'Lifecycle',
    summary: `Lifecycle transition applied: ${previousStatus} -> Retired.`,
    timeLabel: 'just now',
  })
  refreshPackRetirementAssessment(resolved.pack)
  rebuildSwapStationPackAggregates(resolved.station)

  return {
    ok: true,
    message: `Pack ${packId} retired successfully.`,
    pack: { ...resolved.pack },
  }
}
export function listAlerts(tenantId: TenantId) { return listTenantScoped(alerts, tenantId) }
export function listTariffs(tenantId: TenantId) { return listTenantScoped(tariffs, tenantId) }
export function getSmartCharging(tenantId: TenantId) { return smartChargingByTenant[tenantId] }
export function listLoadPolicies(tenantId: TenantId) { return listTenantScoped(loadPolicies, tenantId) }
export function listRoamingPartners(tenantId: TenantId) { return listTenantScoped(roamingPartners, tenantId) }
export function getRoamingPartnerObservability(tenantId: TenantId): RoamingPartnerObservabilityResponse {
  const partners = listTenantScoped(roamingPartnerObservability, tenantId)

  return {
    metrics: getRoamingPartnerObservabilityMetrics(partners),
    note: getRoamingObservabilityNote(tenantId),
    partners: partners.map(toRoamingPartnerObservabilitySummary),
  }
}
export function getRoamingPartnerObservabilityDetail(id: string, tenantId: TenantId) {
  const partner = roamingPartnerObservability.find((record) => record.id === id && record.tenantIds.includes(tenantId))
  return partner ? stripTenantIds(partner) : undefined
}
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
export function getIntegrationsModule(tenantId: TenantId) { return integrationsByTenant[tenantId] }
export function getWebhooksModule(tenantId: TenantId) { return webhooksByTenant[tenantId] }
export function getNotificationsModule(tenantId: TenantId) { return notificationsByTenant[tenantId] }

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
