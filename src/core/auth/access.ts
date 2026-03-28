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

export const ROLE_DASHBOARD_VARIANT = {
  SUPER_ADMIN: 'super-admin',
  CPO_ADMIN: 'cpo-admin',
  STATION_MANAGER: 'station-manager',
  FINANCE: 'finance',
  OPERATOR: 'operator',
  TECHNICIAN: 'technician',
} as const satisfies Record<CPORole, DashboardVariant>

export const ROLE_HOME = {
  SUPER_ADMIN: PATHS.DASHBOARD,
  CPO_ADMIN: PATHS.DASHBOARD,
  STATION_MANAGER: PATHS.DASHBOARD,
  FINANCE: PATHS.DASHBOARD,
  OPERATOR: PATHS.DASHBOARD,
  TECHNICIAN: PATHS.DASHBOARD,
} as const satisfies Record<CPORole, string>

export function canAccessRole(role: CPORole | undefined, allowedRoles: readonly CPORole[]) {
  return !!role && allowedRoles.includes(role)
}

export function getRoleHomePath(role?: CPORole | null) {
  return role ? ROLE_HOME[role] : PATHS.LOGIN
}

export function getRoleDashboardVariant(role?: CPORole | null) {
  return role ? ROLE_DASHBOARD_VARIANT[role] : null
}
