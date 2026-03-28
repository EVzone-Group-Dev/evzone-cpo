import type { CPOUser } from '@/core/types/domain'
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointDetail,
  DashboardOverviewResponse,
  DemoUserHint,
  IncidentCommandResponse,
  LoadPolicyRecord,
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
} from '@/core/types/mockApi'

interface DemoUserRecord extends DemoUserHint {
  user: CPOUser
}

const demoUsers: DemoUserRecord[] = [
  {
    id: 'u1',
    name: 'Super Admin',
    email: 'admin@evzone.io',
    password: 'admin',
    role: 'SUPER_ADMIN',
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
    user: {
      id: 'u2',
      name: 'CPO Manager',
      email: 'manager@evzone.io',
      role: 'CPO_ADMIN',
      status: 'Active',
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
    user: {
      id: 'u3',
      name: 'Field Operator',
      email: 'operator@evzone.io',
      role: 'OPERATOR',
      status: 'Active',
      mfaEnabled: false,
      createdAt: '2026-03-03T08:00:00.000Z',
    },
  },
]

const chargePoints: ChargePointDetail[] = [
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
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot', 'Unlock Connector'],
    unitHealth: {
      ocppConnection: 'Connected',
      lastHeartbeat: '12s ago',
      errorCode: 'NoError',
    },
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
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot', 'Unlock Connector'],
    unitHealth: {
      ocppConnection: 'Connected',
      lastHeartbeat: '18s ago',
      errorCode: 'NoError',
    },
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
    remoteCommands: ['Soft Reset', 'Hard Reboot', 'Unlock Connector'],
    unitHealth: {
      ocppConnection: 'Intermittent',
      lastHeartbeat: '7m ago',
      errorCode: 'ConnectorLockFailure',
    },
  },
  {
    id: 'cp-4',
    stationId: 'st-3',
    stationName: 'Airport East',
    model: 'Tritium RT175',
    manufacturer: 'Tritium',
    serialNumber: 'SN-003A',
    firmwareVersion: '2.7.1',
    ocppId: 'EVZ-AP-001',
    ocppVersion: '2.0.1',
    status: 'Online',
    ocppStatus: 'Available',
    maxCapacityKw: 175,
    lastHeartbeatLabel: '22s ago',
    stale: false,
    roamingPublished: true,
    remoteCommands: ['Remote Start Session', 'Soft Reset', 'Hard Reboot', 'Unlock Connector'],
    unitHealth: {
      ocppConnection: 'Connected',
      lastHeartbeat: '22s ago',
      errorCode: 'NoError',
    },
  },
  {
    id: 'cp-5',
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
    remoteCommands: ['Hard Reboot', 'Unlock Connector'],
    unitHealth: {
      ocppConnection: 'Disconnected',
      lastHeartbeat: '1h ago',
      errorCode: 'PowerLoss',
    },
  },
]

const stations: StationDetail[] = [
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
    systemIntegrity: {
      firmwareVersion: 'v2.4.1-stable',
      ocppVersion: '2.0.1',
      slaCompliance: '100%',
    },
    networkLatency: {
      averageLabel: '1.2s avg',
      modeLabel: 'Real-time',
      points: [40, 60, 45, 80, 50, 30, 45, 40, 50, 35, 40, 30],
    },
    recentEvents: [
      { description: 'Heartbeat received', time: '2m ago' },
      { description: 'Status notification (Charging)', time: '14m ago' },
      { description: 'Remote start approved for connector A', time: '1h ago' },
    ],
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
    chargePoints: [
      { id: 'cp-3', status: 'Faulted', type: 'AC Type 2', lastHeartbeatLabel: '7m ago' },
    ],
    uptimePercent30d: '94.1%',
    dailyAverageKwh: '78 kWh',
    geofenceStatus: 'Monitoring Mode',
    systemIntegrity: {
      firmwareVersion: 'v3.1.0',
      ocppVersion: '1.6J',
      slaCompliance: '94%',
    },
    networkLatency: {
      averageLabel: '3.8s avg',
      modeLabel: 'Delayed',
      points: [55, 65, 72, 68, 74, 80, 76, 70, 74, 82, 78, 69],
    },
    recentEvents: [
      { description: 'Connector fault reported on CP-3', time: '6m ago' },
      { description: 'Heartbeat missed threshold', time: '12m ago' },
      { description: 'Maintenance ticket opened', time: '32m ago' },
    ],
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
    chargePoints: [
      { id: 'cp-4', status: 'Available', type: 'DC Ultra Fast', lastHeartbeatLabel: '22s ago' },
    ],
    uptimePercent30d: '99.8%',
    dailyAverageKwh: '188 kWh',
    geofenceStatus: 'Live Geofence Active',
    systemIntegrity: {
      firmwareVersion: 'v2.7.1',
      ocppVersion: '2.0.1',
      slaCompliance: '100%',
    },
    networkLatency: {
      averageLabel: '0.9s avg',
      modeLabel: 'Real-time',
      points: [28, 32, 30, 34, 31, 33, 30, 29, 35, 31, 28, 27],
    },
    recentEvents: [
      { description: 'Heartbeat received', time: '1m ago' },
      { description: 'Tariff update synced', time: '18m ago' },
      { description: 'Roaming publication confirmed', time: '1h ago' },
    ],
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
    chargePoints: [
      { id: 'cp-5', status: 'Unavailable', type: 'DC Fast', lastHeartbeatLabel: '1h ago' },
    ],
    uptimePercent30d: '88.6%',
    dailyAverageKwh: '54 kWh',
    geofenceStatus: 'Geofence Offline',
    systemIntegrity: {
      firmwareVersion: 'v1.0.9',
      ocppVersion: '1.6J',
      slaCompliance: '89%',
    },
    networkLatency: {
      averageLabel: 'Offline',
      modeLabel: 'No telemetry',
      points: [10, 12, 8, 5, 6, 4, 3, 5, 2, 4, 3, 2],
    },
    recentEvents: [
      { description: 'Site power loss detected', time: '53m ago' },
      { description: 'Remote reboot attempt timed out', time: '1h ago' },
      { description: 'Technician dispatched', time: '1h 10m ago' },
    ],
  },
]

const dashboardOverview: DashboardOverviewResponse = {
  kpis: [
    { id: 'kpi-1', label: 'Active Sessions', value: '148', delta: '+12 vs yesterday', trend: 'up', iconKey: 'activity' },
    { id: 'kpi-2', label: 'Charge Points Online', value: '312 / 340', delta: '91.8% uptime', trend: 'up', iconKey: 'charge-points' },
    { id: 'kpi-3', label: 'Energy Today (kWh)', value: '4,821', delta: '+8.2% vs avg', trend: 'up', iconKey: 'energy' },
    { id: 'kpi-4', label: 'Revenue Today', value: 'KES 142,400', delta: '+5.1% vs avg', trend: 'up', iconKey: 'revenue' },
    { id: 'kpi-5', label: 'Open Incidents', value: '7', delta: '-3 resolved today', trend: 'down', iconKey: 'incidents' },
    { id: 'kpi-6', label: 'Roaming Sessions', value: '34', delta: '3 OCPI partners', trend: 'up', iconKey: 'roaming' },
    { id: 'kpi-7', label: 'Grid Load', value: '82%', delta: 'Peak shaving active', trend: 'down', iconKey: 'load' },
    { id: 'kpi-8', label: 'Active Operators', value: '12', delta: '3 on field', trend: 'up', iconKey: 'operators' },
  ],
  recentSessions: [
    { id: 'S-001', station: 'Westlands Hub', cp: 'CP-003', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Active', method: 'App' },
    { id: 'S-002', station: 'CBD Charging Station', cp: 'CP-011', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'RFID' },
    { id: 'S-003', station: 'Airport East', cp: 'CP-007', energy: '50.0 kWh', amount: 'KES 3,000', status: 'Active', method: 'Roaming' },
    { id: 'S-004', station: 'Garden City Mall', cp: 'CP-001', energy: '8.2 kWh', amount: 'KES 492', status: 'Completed', method: 'App' },
    { id: 'S-005', station: 'Strathmore', cp: 'CP-022', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID' },
  ],
  recentIncidents: [
    { id: 'INC-044', station: 'Westlands Hub', severity: 'High', title: 'CP-003 connector fault', status: 'Open' },
    { id: 'INC-043', station: 'CBD Charging Station', severity: 'Medium', title: 'Heartbeat timeout CP-011', status: 'Acknowledged' },
    { id: 'INC-042', station: 'Airport East', severity: 'Low', title: 'Firmware update pending', status: 'Open' },
  ],
}

const siteOwnerDashboard: SiteOwnerDashboardResponse = {
  title: 'Westlands Mall Portfolio',
  subtitle: 'Real-time performance for your hosted charging infrastructure.',
  metrics: [
    { id: 'revenue', label: 'Total Revenue', value: 'KES 14.8K', delta: '+18.4%', trend: 'up', note: 'vs last week' },
    { id: 'uptime', label: 'Uptime Avg', value: '99.8%', delta: '+0.2%', trend: 'up', note: 'SLA Compliant' },
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
    text: 'Stations in Entrance A are reaching 90% capacity between 5 PM and 7 PM. Increasing your tariff by 10% during peak hours could generate an additional KES 2.5K per week.',
    cta: 'Apply Smart Pricing',
  },
  alerts: [
    { id: 1, type: 'Issue', msg: 'W-002: Communication lag detected.', time: '2h ago' },
    { id: 2, type: 'Info', msg: 'Monthly settlement is ready for review.', time: '1d ago' },
  ],
}

const sessions: SessionRecord[] = [
  { id: 'SES-001', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-28 08:14', ended: '2026-03-28 09:02', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Completed', method: 'App', emsp: 'EVzone eMSP' },
  { id: 'SES-002', station: 'CBD Charging Station', cp: 'EVZ-CBD-001', started: '2026-03-28 07:50', ended: null, energy: '31.0 kWh', amount: 'KES 1,860', status: 'Active', method: 'RFID', emsp: '—' },
  { id: 'SES-003', station: 'Airport East', cp: 'EVZ-AP-001', started: '2026-03-28 06:00', ended: '2026-03-28 07:30', energy: '50.0 kWh', amount: 'KES 3,000', status: 'Completed', method: 'Roaming', emsp: 'ChargeNow' },
  { id: 'SES-004', station: 'Strathmore', cp: 'EVZ-STR-001', started: '2026-03-28 10:00', ended: '2026-03-28 10:05', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID', emsp: '—' },
  { id: 'SES-005', station: 'Two Rivers', cp: 'EVZ-TR-001', started: '2026-03-28 09:30', ended: '2026-03-28 10:15', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'App', emsp: 'EVzone eMSP' },
]

const incidentCommand: IncidentCommandResponse = {
  stats: [
    { id: 'open', label: 'Open Incidents', value: '12', tone: 'danger' },
    { id: 'response', label: 'Avg Response', value: '18m', tone: 'default' },
    { id: 'dispatched', label: 'Dispatched', value: '5', tone: 'warning' },
    { id: 'sla', label: 'SLA Compliance', value: '94%', tone: 'ok' },
  ],
  incidents: [
    {
      id: 'INC-2041',
      stationId: 'LOC-1',
      stationName: 'Westlands Hub',
      type: 'Communication Loss',
      severity: 'Major',
      status: 'Dispatched',
      reportedAt: '20m ago',
      assignedTech: 'David Karanja',
      situationAudit: 'Sensors detected intermittent packet loss at Westlands Hub. Preliminary diagnostics point to a switching fault on cabinet 2.',
      serviceLog: [
        { title: 'Technician Assigned', note: 'Assigning David K. to the ticket.', active: true },
        { title: 'Ticket Created', note: 'Automated alert triggered by telemetry loss.', active: false },
      ],
    },
    {
      id: 'INC-2042',
      stationId: 'LOC-4',
      stationName: 'CBD Central',
      type: 'Hardware Failure',
      severity: 'Critical',
      status: 'Open',
      reportedAt: '5m ago',
      situationAudit: 'Grid voltage dropped below threshold and station relay failed to recover. Immediate field inspection recommended.',
      serviceLog: [
        { title: 'Awaiting Dispatch', note: 'No technician has accepted the task yet.', active: true },
        { title: 'Ticket Created', note: 'Automated alert triggered by grid instability.', active: false },
      ],
    },
    {
      id: 'INC-2035',
      stationId: 'LOC-9',
      stationName: 'Karen Eco Park',
      type: 'Vandalism',
      severity: 'Minor',
      status: 'Closed',
      reportedAt: '2h ago',
      assignedTech: 'Sarah M.',
      situationAudit: 'Camera review confirmed cosmetic damage to the enclosure. Charging operations remained unaffected.',
      serviceLog: [
        { title: 'Ticket Closed', note: 'Area secured and enclosure repaired.', active: true },
        { title: 'Technician Assigned', note: 'Sarah M. inspected the enclosure.', active: false },
      ],
    },
  ],
  predictiveAlert: {
    text: 'Based on heat signatures, Station LOC-2 is at risk of a major connector fault within the next 48 hours.',
    cta: 'Schedule Maintenance',
  },
}

const alerts: AlertRecord[] = [
  { id: 'A-1', type: 'Critical', message: 'Garden City Mall station offline due to grid power fault', station: 'Garden City Mall', ts: '2026-03-28 05:02', acked: false },
  { id: 'A-2', type: 'Warning', message: 'Load at 92% of grid limit at Westlands Hub', station: 'Westlands Hub', ts: '2026-03-28 08:45', acked: false },
  { id: 'A-3', type: 'Info', message: 'Roaming partner ChargeNow sync complete with 12 CDRs sent', station: '—', ts: '2026-03-28 09:00', acked: true },
  { id: 'A-4', type: 'Warning', message: 'CP-003 heartbeat stale for 6 minutes', station: 'CBD Charging Station', ts: '2026-03-28 09:15', acked: false },
]

const tariffs: TariffRecord[] = [
  { id: 'T-1', name: 'Standard Day Rate', type: 'Energy', currency: 'KES', pricePerKwh: 60, active: true },
  { id: 'T-2', name: 'Peak Hours Premium', type: 'Mixed', currency: 'KES', pricePerKwh: 85, active: true },
  { id: 'T-3', name: 'Roaming Partner Rate', type: 'Energy', currency: 'KES', pricePerKwh: 70, active: true },
  { id: 'T-4', name: 'Night Smart Rate', type: 'Time', currency: 'KES', pricePerKwh: 40, active: false },
]

const smartCharging: SmartChargingResponse = {
  metrics: [
    { id: 'load', label: 'Current Load', value: '148 kW', tone: 'default' },
    { id: 'cap', label: 'Grid Cap', value: '180 kW', tone: 'default' },
    { id: 'utilisation', label: 'Utilisation', value: '82%', tone: 'ok' },
    { id: 'sessions', label: 'Active Sessions', value: '18', tone: 'default' },
  ],
  loadProfile: [
    { time: '00:00', load: 45, cap: 180 },
    { time: '04:00', load: 30, cap: 180 },
    { time: '08:00', load: 120, cap: 180 },
    { time: '12:00', load: 160, cap: 180 },
    { time: '16:00', load: 140, cap: 180 },
    { time: '20:00', load: 155, cap: 180 },
    { time: '23:59', load: 80, cap: 180 },
  ],
  distribution: [
    { label: 'Priority Fleet', val: 80, colorKey: 'accent' },
    { label: 'Public Charging', val: 48, colorKey: 'ok' },
    { label: 'System Overhead', val: 20, colorKey: 'warning' },
  ],
  activeCurtailments: 0,
  optimizer: {
    forecastTime: '19:30',
    reductionPercent: 15,
    selectedStrategy: 'Grid-Interactive (Standard)',
    strategies: [
      'Grid-Interactive (Standard)',
      'Aggressive Peak Shaving',
      'Emergency Load Shedding',
      'Renewable Max (Solar Sync)',
    ],
    cta: 'Review Strategy',
  },
}

const loadPolicies: LoadPolicyRecord[] = [
  { id: 'LP-1', name: 'Westlands Hub Default', station: 'Westlands Hub', maxLoadKw: 80, curtailment: 95, priority: 'FIFO', active: true },
  { id: 'LP-2', name: 'Airport Peak Hours', station: 'Airport East', maxLoadKw: 150, curtailment: 90, priority: 'Priority', active: true },
  { id: 'LP-3', name: 'Garden City Night Mode', station: 'Garden City Mall', maxLoadKw: 40, curtailment: 80, priority: 'Fair-Share', active: false },
]

const roamingPartners: RoamingPartnerRecord[] = [
  { id: 'p1', name: 'Plugsurfing BV', type: 'EMSP', status: 'Connected', country: 'NL', partyId: 'PLG', lastSync: '2026-03-28 14:20', version: '2.2.1' },
  { id: 'p2', name: 'Hubject GmbH', type: 'HUB', status: 'Connected', country: 'DE', partyId: 'HBJ', lastSync: '2026-03-28 15:45', version: '2.2.1' },
  { id: 'p3', name: 'Shell Recharge', type: 'EMSP', status: 'Pending', country: 'NL', partyId: 'TNM', lastSync: '-', version: '2.1.1' },
]

const roamingSessions: RoamingSessionsResponse = {
  metrics: [
    { id: 'incoming', label: 'Incoming Traffic', value: 'KES 124K', note: '+12% vs last month', tone: 'accent' },
    { id: 'authorized', label: 'Authorized Tokens', value: '842', note: 'Cross-platform verified', tone: 'ok' },
    { id: 'utilisation', label: 'Roaming Utilization', value: '34%', note: 'Grid share: 450 kW', tone: 'warning' },
  ],
  sessions: [
    { id: 'RS-901', stationName: 'Westlands Hub', emspName: 'Plugsurfing', partyId: 'PLG', status: 'Active', startTime: '10m ago', energy: 12.5, amount: 'KES 375' },
    { id: 'RS-902', stationName: 'CBD Charging Station', emspName: 'Hubject', partyId: 'HBJ', status: 'Active', startTime: '45m ago', energy: 34.2, amount: 'KES 1,026' },
    { id: 'RS-890', stationName: 'Westlands Hub', emspName: 'Shell Recharge', partyId: 'TNM', status: 'Completed', startTime: '2h ago', energy: 50.0, amount: 'KES 1,500' },
  ],
  regionalReach: [
    { region: 'East Africa (KE/TZ)', count: 420 },
    { region: 'European Roaming', count: 1250 },
    { region: 'Bilateral Direct', count: 15 },
  ],
  settlementAging: [30, 50, 70, 40, 90, 60, 40],
}

const ocpiCdrs: OCPICdrsResponse = {
  metrics: [
    { id: 'total', label: 'Total CDRs', value: '1,248', tone: 'default' },
    { id: 'awaiting', label: 'Awaiting Settlement', value: '142', tone: 'warning' },
    { id: 'revenue', label: 'Total Revenue (R)', value: 'KES 842K', tone: 'default' },
    { id: 'error-rate', label: 'Error Rate', value: '0.4%', tone: 'ok' },
  ],
  records: [
    { id: 'CDR-29481', sessionId: 'SES-9120', emspName: 'Plugsurfing', partyId: 'PLG', country: 'NL', start: '2026-03-28 10:15', end: '2026-03-28 11:20', kwh: 42.5, totalCost: '1,240.00', currency: 'KES', status: 'Settled' },
    { id: 'CDR-29482', sessionId: 'SES-9125', emspName: 'Hubject', partyId: 'HBJ', country: 'DE', start: '2026-03-28 14:02', end: '2026-03-28 14:45', kwh: 18.2, totalCost: '546.00', currency: 'KES', status: 'Accepted' },
    { id: 'CDR-29483', sessionId: 'SES-9128', emspName: 'Shell Recharge', partyId: 'TNM', country: 'NL', start: '2026-03-28 16:30', end: '2026-03-28 17:10', kwh: 31, totalCost: '930.00', currency: 'KES', status: 'Sent' },
    { id: 'CDR-29484', sessionId: 'SES-9130', emspName: 'Public Charge', partyId: 'PBC', country: 'KE', start: '2026-03-28 18:00', end: '2026-03-28 19:15', kwh: 55.4, totalCost: '1,662.00', currency: 'KES', status: 'Rejected' },
  ],
  automation: {
    text: 'CDRs are automatically shared with roaming partners via OCPI upon session completion. Settlement cycles follow the B2B agreement protocols (Daily or Weekly).',
    cta: 'Review Rules',
  },
}

const ocpiCommands: OCPICommandsResponse = {
  partners: [
    { id: 'plugsurfing', label: 'Plugsurfing (PLG)' },
    { id: 'hubject', label: 'Hubject (HBJ)' },
    { id: 'shell-recharge', label: 'Shell Recharge (TNM)' },
  ],
  logs: [
    { id: '1', time: '14:20:10', command: 'START_SESSION', partner: 'Plugsurfing', status: 'Accepted', payload: '{ "location_id": "LOC-1", "evse_uid": "E1" }' },
    { id: '2', time: '14:25:45', command: 'STOP_SESSION', partner: 'Hubject', status: 'Rejected', payload: '{ "session_id": "SES-91" }' },
  ],
}

const billing: BillingResponse = {
  totalRevenueThisMonth: 'KES 4,284,200',
  note: 'Invoice generation remains mocked, but all billing summary data now flows through the MSW API surface.',
}

const payouts: PayoutRecord[] = [
  { id: 'PAY-1', period: 'Mar 1–15, 2026', amount: 'KES 2,108,400', fee: 'KES 210,840', net: 'KES 1,897,560', status: 'Completed', sessions: 1420 },
  { id: 'PAY-2', period: 'Mar 16–31, 2026', amount: 'KES 2,175,800', fee: 'KES 217,580', net: 'KES 1,958,220', status: 'Processing', sessions: 1505 },
]

const settlement: SettlementResponse = {
  note: 'Settlement remains mocked, but partner cycles, statuses, and net values now come from the mock API.',
  records: [
    { id: 'SET-1', partner: 'Hubject', period: 'Mar 1–15, 2026', netAmount: 'KES 684,220', status: 'Settled' },
    { id: 'SET-2', partner: 'Plugsurfing', period: 'Mar 16–31, 2026', netAmount: 'KES 518,900', status: 'Reconciling' },
    { id: 'SET-3', partner: 'Shell Recharge', period: 'Mar 16–31, 2026', netAmount: 'KES 302,115', status: 'Ready' },
  ],
}

const team: TeamMember[] = [
  { name: 'John Kamau', email: 'john@evzone.io', role: 'STATION_MANAGER', status: 'Active', lastSeen: '2 min ago' },
  { name: 'Grace Otieno', email: 'grace@evzone.io', role: 'TECHNICIAN', status: 'Active', lastSeen: '1 hr ago' },
  { name: "Peter Ndung'u", email: 'peter@evzone.io', role: 'OPERATOR', status: 'Invited', lastSeen: '—' },
  { name: 'Amina Hassan', email: 'amina@evzone.io', role: 'FINANCE', status: 'Active', lastSeen: '3 hr ago' },
]

const auditLogs: AuditLogRecord[] = [
  { actor: 'admin@evzone.io', action: 'REMOTE_RESET', target: 'CP EVZ-WL-003', ts: '2026-03-28 09:14' },
  { actor: 'manager@evzone.io', action: 'TARIFF_UPDATED', target: 'Night Smart Rate', ts: '2026-03-28 08:50' },
  { actor: 'System', action: 'OCPI_SYNC', target: 'ChargeNow — 4 CDRs sent', ts: '2026-03-28 09:00' },
  { actor: 'grace@evzone.io', action: 'INCIDENT_RESOLVED', target: 'INC-041 Garden City', ts: '2026-03-28 08:00' },
]

const reports: ReportsResponse = {
  templates: [
    { id: 'revenue-summary', label: 'Monthly Revenue Summary' },
    { id: 'uptime-sla', label: 'Infrastructure Uptime (SLA)' },
    { id: 'roaming-cdrs', label: 'Detailed Roaming CDRs' },
    { id: 'energy-audit', label: 'Energy Consumption Audit' },
  ],
  periods: ['March 2026', 'February 2026', 'Custom Range...'],
  scheduledEmails: [
    { label: 'Weekly Executive Summary', enabled: true },
  ],
  recentExports: [
    { name: 'Revenue_MAR_26.csv', type: 'Financial', size: '2.4 MB', time: '10m ago' },
    { name: 'Uptime_SLA_Q1_26.pdf', type: 'Health', size: '840 KB', time: '2h ago' },
    { name: 'Roaming_Settlement_FEB_26.csv', type: 'Roaming', size: '1.8 MB', time: '1d ago' },
    { name: 'Carbon_Offset_2025.pdf', type: 'Sustainability', size: '4.2 MB', time: '5d ago' },
  ],
}

const protocols: ProtocolEngineResponse = {
  endpoints: [
    { module: 'Credentials', url: '/ocpi/cpo/2.2.1/credentials', status: 'Online' },
    { module: 'Locations', url: '/ocpi/cpo/2.2.1/locations', status: 'Online' },
    { module: 'Sessions', url: '/ocpi/cpo/2.2.1/sessions', status: 'Online' },
    { module: 'CDRs', url: '/ocpi/cpo/2.2.1/cdrs', status: 'Online' },
    { module: 'Tariffs', url: '/ocpi/cpo/2.2.1/tariffs', status: 'Warning' },
  ],
  handshakeLogs: [
    { level: 'info', message: '[14:20:01] INFO: Initializing test for endpoint https://test-msp.com/versions' },
    { level: 'success', message: '[14:20:02] SENT: GET /versions (Auth: Token-A)' },
    { level: 'warning', message: '[14:20:03] RCV: 200 OK - Versions: [2.0, 2.1.1, 2.2.1]' },
    { level: 'success', message: '[14:20:04] INFO: Selecting v2.2.1 for handshake...' },
    { level: 'success', message: '[14:20:05] SENT: POST /2.2.1/credentials (Body: Token-B, Roles: CPO)' },
    { level: 'success', message: '[14:20:06] RCV: 201 Created (Token-C received)' },
    { level: 'accent', message: '[14:20:07] SUCCESS: Handshake complete. Connection established.' },
  ],
  complianceNote: 'Core registration modules passed OCPI validator v1.2 in the mock test bench.',
}

const moduleNotices: Record<'integrations' | 'webhooks' | 'notifications', ModuleNotice> = {
  integrations: {
    message: 'Integration management is still mocked, but this page is now backed by the MSW platform API instead of inline placeholder data.',
  },
  webhooks: {
    message: 'Webhook endpoint management is still mocked, with module status now served through the MSW platform API.',
  },
  notifications: {
    message: 'Notification preferences remain a placeholder workflow for now, but the page copy now comes from the MSW platform API.',
  },
}

export const mockData = {
  alerts,
  auditLogs,
  billing,
  chargePoints,
  dashboardOverview,
  demoUsers,
  incidentCommand,
  loadPolicies,
  ocpiCdrs,
  ocpiCommands,
  payouts,
  protocols,
  reports,
  roamingPartners,
  roamingSessions,
  sessions,
  settlement,
  siteOwnerDashboard,
  smartCharging,
  stations,
  tariffs,
  team,
  moduleNotices,
}

export function authenticateDemoUser(email: string, password: string) {
  const match = demoUsers.find((user) => user.email === email && user.password === password)

  if (!match) {
    return null
  }

  return {
    token: `demo-token-${match.id}`,
    user: match.user,
  }
}

export function getDemoUserHints(): DemoUserHint[] {
  return demoUsers.map(({ id, name, email, password, role }) => ({
    id,
    name,
    email,
    password,
    role,
  }))
}

export function getStationById(id: string) {
  return stations.find((station) => station.id === id)
}

export function getChargePointById(id: string) {
  return chargePoints.find((chargePoint) => chargePoint.id === id)
}

export function getModuleNotice(moduleKey: 'integrations' | 'webhooks' | 'notifications') {
  return moduleNotices[moduleKey]
}
