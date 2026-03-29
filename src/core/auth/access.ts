import type { CPORole } from '@/core/types/domain'
import { PATHS } from '@/router/paths'

export type DashboardVariant =
  | 'super-admin'
  | 'cpo-admin'
  | 'station-manager'
  | 'finance'
  | 'operator'
  | 'technician'

export const ACTIVE_ROLES = [
  'SUPER_ADMIN',
  'CPO_ADMIN',
  'STATION_MANAGER',
  'FINANCE',
  'OPERATOR',
  'TECHNICIAN',
] as const satisfies readonly CPORole[]

export const ADMIN_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN'] as const satisfies readonly CPORole[]
export const ASSET_MANAGER_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'STATION_MANAGER'] as const satisfies readonly CPORole[]
export const INFRASTRUCTURE_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'STATION_MANAGER', 'OPERATOR', 'TECHNICIAN'] as const satisfies readonly CPORole[]
export const OPERATIONS_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'STATION_MANAGER', 'OPERATOR', 'TECHNICIAN'] as const satisfies readonly CPORole[]
export const ENERGY_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'STATION_MANAGER', 'OPERATOR', 'TECHNICIAN'] as const satisfies readonly CPORole[]
export const ROAMING_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'FINANCE'] as const satisfies readonly CPORole[]
export const FINANCE_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'FINANCE'] as const satisfies readonly CPORole[]
export const REPORTING_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN', 'FINANCE', 'STATION_MANAGER'] as const satisfies readonly CPORole[]
export const TEAM_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN'] as const satisfies readonly CPORole[]
export const PLATFORM_ADMIN_ROLES = ['SUPER_ADMIN', 'CPO_ADMIN'] as const satisfies readonly CPORole[]
export const SETTINGS_ROLES = ACTIVE_ROLES
export const SUPER_ADMIN_ROLES = ['SUPER_ADMIN'] as const satisfies readonly CPORole[]
export const CPO_ADMIN_ROLES = ['CPO_ADMIN'] as const satisfies readonly CPORole[]
export const STATION_MANAGER_ROLES = ['STATION_MANAGER'] as const satisfies readonly CPORole[]
export const FINANCE_DASHBOARD_ROLES = ['FINANCE'] as const satisfies readonly CPORole[]
export const OPERATOR_ROLES = ['OPERATOR'] as const satisfies readonly CPORole[]
export const TECHNICIAN_ROLES = ['TECHNICIAN'] as const satisfies readonly CPORole[]

export const ROLE_DASHBOARD_VARIANT = {
  SUPER_ADMIN: 'super-admin',
  CPO_ADMIN: 'cpo-admin',
  STATION_MANAGER: 'station-manager',
  FINANCE: 'finance',
  OPERATOR: 'operator',
  TECHNICIAN: 'technician',
} as const satisfies Record<CPORole, DashboardVariant>

export const ROLE_HOME = {
  SUPER_ADMIN: PATHS.DASHBOARD_SUPER_ADMIN,
  CPO_ADMIN: PATHS.DASHBOARD_CPO_ADMIN,
  STATION_MANAGER: PATHS.DASHBOARD_STATION_MANAGER,
  FINANCE: PATHS.DASHBOARD_FINANCE,
  OPERATOR: PATHS.DASHBOARD_OPERATOR,
  TECHNICIAN: PATHS.DASHBOARD_TECHNICIAN,
} as const satisfies Record<CPORole, string>

// Shared permission catalog for UI routes, navigation, and API handlers.
export const ACCESS_POLICY = {
  tenancyContext: ACTIVE_ROLES,
  dashboardHome: ACTIVE_ROLES,
  dashboardSuperAdmin: SUPER_ADMIN_ROLES,
  dashboardCpoAdmin: CPO_ADMIN_ROLES,
  dashboardStationManager: STATION_MANAGER_ROLES,
  dashboardFinance: FINANCE_DASHBOARD_ROLES,
  dashboardOperator: OPERATOR_ROLES,
  dashboardTechnician: TECHNICIAN_ROLES,
  siteDashboard: ACTIVE_ROLES,
  stationsRead: INFRASTRUCTURE_ROLES,
  stationsWrite: ASSET_MANAGER_ROLES,
  chargePointsRead: INFRASTRUCTURE_ROLES,
  chargePointsWrite: ASSET_MANAGER_ROLES,
  swapStationsRead: INFRASTRUCTURE_ROLES,
  sessionsRead: OPERATIONS_ROLES,
  swapSessionsRead: OPERATIONS_ROLES,
  swapLifecycleWrite: OPERATIONS_ROLES,
  incidentsRead: OPERATIONS_ROLES,
  alertsRead: OPERATIONS_ROLES,
  smartChargingRead: ENERGY_ROLES,
  loadPoliciesRead: ENERGY_ROLES,
  batteryInventoryRead: ENERGY_ROLES,
  roamingRead: ROAMING_ROLES,
  tariffsRead: FINANCE_ROLES,
  billingRead: FINANCE_ROLES,
  payoutsRead: FINANCE_ROLES,
  settlementRead: FINANCE_ROLES,
  teamRead: TEAM_ROLES,
  reportsRead: REPORTING_ROLES,
  auditLogsRead: FINANCE_ROLES,
  platformAdminRead: PLATFORM_ADMIN_ROLES,
  settingsRead: SETTINGS_ROLES,
  notificationsRead: SETTINGS_ROLES,
  whiteLabelAdmin: ADMIN_ROLES,
  remoteCommandStart: OPERATIONS_ROLES,
  chargePointCommands: OPERATIONS_ROLES,
} as const

export function canAccessRole(role: CPORole | undefined, allowedRoles: readonly CPORole[]) {
  return !!role && allowedRoles.includes(role)
}

export function getRoleHomePath(role?: CPORole | null) {
  return role ? ROLE_HOME[role] : PATHS.LOGIN
}

export function getRoleDashboardVariant(role?: CPORole | null) {
  return role ? ROLE_DASHBOARD_VARIANT[role] : null
}
