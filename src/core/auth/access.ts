import type { CPORole } from '@/core/types/domain'
import { PATHS } from '@/router/paths'

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

export function canAccessRole(role: CPORole | undefined, allowedRoles: readonly CPORole[]) {
  return !!role && allowedRoles.includes(role)
}

export function getRoleHomePath(role?: CPORole | null) {
  return role ? PATHS.DASHBOARD : PATHS.LOGIN
}
