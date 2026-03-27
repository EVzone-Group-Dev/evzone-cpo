export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  // Infrastructure
  STATIONS: '/stations',
  STATION_DETAIL: (id: string) => `/stations/${id}`,
  CHARGE_POINTS: '/charge-points',
  CHARGE_POINT_DETAIL: (id: string) => `/charge-points/${id}`,

  // Operations
  SESSIONS: '/sessions',
  INCIDENTS: '/incidents',
  ALERTS: '/alerts',
  DISPATCHES: '/dispatches',

  // Energy
  SMART_CHARGING: '/smart-charging',
  LOAD_POLICY: '/load-policy',

  // Roaming
  OCPI_PARTNERS: '/roaming/partners',
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
