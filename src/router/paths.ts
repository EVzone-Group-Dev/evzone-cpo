export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  DASHBOARD_SUPER_ADMIN: '/dashboard/super-admin',
  DASHBOARD_CPO_ADMIN: '/dashboard/cpo-admin',
  DASHBOARD_STATION_MANAGER: '/dashboard/station-manager',
  DASHBOARD_FINANCE: '/dashboard/finance',
  DASHBOARD_OPERATOR: '/dashboard/operator',
  DASHBOARD_TECHNICIAN: '/dashboard/technician',
  SITE_DASHBOARD: '/site-dashboard',

  // Infrastructure
  STATIONS: '/stations',
  STATION_DETAIL: (id: string) => `/stations/${id}`,
  CHARGE_POINTS: '/charge-points',
  CHARGE_POINT_NEW: '/charge-points/new',
  CHARGE_POINT_DETAIL: (id: string) => `/charge-points/${id}`,
  SWAP_STATIONS: '/swap-stations',
  SWAP_STATION_DETAIL: (id: string) => `/swap-stations/${id}`,

  // Operations
  SESSIONS: '/sessions',
  SWAP_SESSIONS: '/swap-sessions',
  INCIDENTS: '/incidents',
  ALERTS: '/alerts',
  DISPATCHES: '/dispatches',

  // Energy
  SMART_CHARGING: '/smart-charging',
  LOAD_POLICY: '/load-policy',
  BATTERY_INVENTORY: '/battery-inventory',

  // Roaming
  OCPI_PARTNERS: '/roaming/partners',
  OCPI_SESSIONS: '/roaming/sessions',
  OCPI_COMMANDS: '/roaming/commands',
  OCPI_CDRS: '/roaming/cdrs',

  // Finance
  TARIFFS: '/tariffs',
  BILLING: '/billing',
  PAYOUTS: '/payouts',
  SETTLEMENT: '/settlement',

  // Team
  TEAM: '/team',
  USERS: '/users',

  // Platform
  REPORTS: '/reports',
  AUDIT_LOGS: '/audit-logs',
  WEBHOOKS: '/webhooks',
  INTEGRATIONS: '/integrations',
  PROTOCOLS: '/protocols',

  // Settings
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
}
