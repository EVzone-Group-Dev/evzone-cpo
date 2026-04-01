import type { AccessProfile, CPORole, CPOUser, CanonicalAccessRole } from '@/core/types/domain'
import { PATHS } from '@/router/paths'

export type DashboardVariant =
  | 'super-admin'
  | 'cpo-admin'
  | 'station-manager'
  | 'finance'
  | 'operator'
  | 'site-host'
  | 'technician'

export const ACTIVE_ROLES = [
  'SUPER_ADMIN',
  'CPO_ADMIN',
  'STATION_MANAGER',
  'FINANCE',
  'OPERATOR',
  'SITE_HOST',
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
export const SITE_HOST_ROLES = ['SITE_HOST'] as const satisfies readonly CPORole[]
export const TECHNICIAN_ROLES = ['TECHNICIAN'] as const satisfies readonly CPORole[]

export const ROLE_DASHBOARD_VARIANT = {
  SUPER_ADMIN: 'super-admin',
  CPO_ADMIN: 'cpo-admin',
  STATION_MANAGER: 'station-manager',
  FINANCE: 'finance',
  OPERATOR: 'operator',
  SITE_HOST: 'site-host',
  TECHNICIAN: 'technician',
} as const satisfies Record<CPORole, DashboardVariant>

export const ROLE_HOME = {
  SUPER_ADMIN: PATHS.DASHBOARD_SUPER_ADMIN,
  CPO_ADMIN: PATHS.DASHBOARD_CPO_ADMIN,
  STATION_MANAGER: PATHS.DASHBOARD_STATION_MANAGER,
  FINANCE: PATHS.DASHBOARD_FINANCE,
  OPERATOR: PATHS.DASHBOARD_OPERATOR,
  SITE_HOST: PATHS.SITE_DASHBOARD,
  TECHNICIAN: PATHS.DASHBOARD_TECHNICIAN,
} as const satisfies Record<CPORole, string>

export const ACCESS_POLICY = {
  tenancyContext: ACTIVE_ROLES,
  dashboardHome: ACTIVE_ROLES,
  dashboardSuperAdmin: SUPER_ADMIN_ROLES,
  dashboardCpoAdmin: CPO_ADMIN_ROLES,
  dashboardStationManager: STATION_MANAGER_ROLES,
  dashboardFinance: FINANCE_DASHBOARD_ROLES,
  dashboardOperator: OPERATOR_ROLES,
  dashboardTechnician: TECHNICIAN_ROLES,
  siteDashboard: [...SUPER_ADMIN_ROLES, ...CPO_ADMIN_ROLES, ...SITE_HOST_ROLES] as const satisfies readonly CPORole[],
  stationsRead: INFRASTRUCTURE_ROLES,
  stationsWrite: ASSET_MANAGER_ROLES,
  chargePointsRead: INFRASTRUCTURE_ROLES,
  chargePointsWrite: ASSET_MANAGER_ROLES,
  swapStationsRead: INFRASTRUCTURE_ROLES,
  sessionsRead: OPERATIONS_ROLES,
  swapSessionsRead: OPERATIONS_ROLES,
  swapLifecycleWrite: OPERATIONS_ROLES,
  swapDispatchWrite: OPERATIONS_ROLES,
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

export type AccessPolicyKey = keyof typeof ACCESS_POLICY

type AccessAwareUser =
  | Pick<CPOUser, 'role' | 'accessProfile' | 'legacyRole'>
  | { role?: string | null; accessProfile?: AccessProfile | null; legacyRole?: string }
  | null
  | undefined

const CPO_ROLE_VALUES = ['SUPER_ADMIN', 'CPO_ADMIN', 'STATION_MANAGER', 'FINANCE', 'OPERATOR', 'SITE_HOST', 'TECHNICIAN'] as const

const ACCESS_PERMISSION_MAP: Record<AccessPolicyKey, readonly string[] | undefined> = {
  tenancyContext: undefined,
  dashboardHome: undefined,
  dashboardSuperAdmin: ['platform.tenants.read'],
  dashboardCpoAdmin: ['tenant.users.read', 'tenant.settings.read'],
  dashboardStationManager: ['stations.write'],
  dashboardFinance: ['finance.billing.read', 'platform.billing.read'],
  dashboardOperator: ['sessions.read', 'commands.read'],
  dashboardTechnician: ['maintenance.dispatch.read'],
  siteDashboard: ['finance.revenue_reports.read'],
  stationsRead: ['stations.read'],
  stationsWrite: ['stations.write'],
  chargePointsRead: ['charge_points.read'],
  chargePointsWrite: ['charge_points.write'],
  swapStationsRead: ['stations.read', 'battery_inventory.read'],
  sessionsRead: ['sessions.read'],
  swapSessionsRead: ['sessions.read'],
  swapLifecycleWrite: undefined,
  swapDispatchWrite: undefined,
  incidentsRead: ['incidents.read'],
  alertsRead: ['alerts.read'],
  smartChargingRead: ['smart_charging.read'],
  loadPoliciesRead: ['load_profiles.read'],
  batteryInventoryRead: ['battery_inventory.read'],
  roamingRead: ['ocpi.partners.read', 'ocpi.sessions.read', 'ocpi.cdrs.read', 'ocpi.commands.read'],
  tariffsRead: ['tenant.tariffs.read'],
  billingRead: ['finance.billing.read', 'platform.billing.read'],
  payoutsRead: ['finance.payouts.read'],
  settlementRead: ['finance.settlement.read'],
  teamRead: ['tenant.users.read'],
  reportsRead: ['finance.revenue_reports.read'],
  auditLogsRead: ['platform.audit.read'],
  platformAdminRead: ['platform.integrations.read', 'platform.audit.read'],
  settingsRead: ['tenant.settings.read', 'platform.tenants.read'],
  notificationsRead: undefined,
  whiteLabelAdmin: ['tenant.branding.write'],
  remoteCommandStart: ['commands.write'],
  chargePointCommands: ['charge_points.command'],
}

const CANONICAL_ROLE_TO_CPO_ROLE: Partial<Record<CanonicalAccessRole, CPORole>> = {
  PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_BILLING_ADMIN: 'FINANCE',
  PLATFORM_NOC_LEAD: 'OPERATOR',
  TENANT_ADMIN: 'CPO_ADMIN',
  SITE_HOST: 'SITE_HOST',
  ROAMING_MANAGER: 'CPO_ADMIN',
  STATION_MANAGER: 'STATION_MANAGER',
  OPERATIONS_OPERATOR: 'OPERATOR',
  TENANT_FINANCE_ANALYST: 'FINANCE',
  FLEET_DISPATCHER: 'OPERATOR',
  FLEET_DRIVER: 'OPERATOR',
  INSTALLER_AGENT: 'TECHNICIAN',
  SMART_CHARGING_ENGINEER: 'TECHNICIAN',
  FIELD_TECHNICIAN: 'TECHNICIAN',
  EXTERNAL_PROVIDER_ADMIN: 'CPO_ADMIN',
  EXTERNAL_PROVIDER_OPERATOR: 'OPERATOR',
}

const ROLE_LABELS: Record<CPORole, string> = {
  SUPER_ADMIN: 'Platform Super Admin',
  CPO_ADMIN: 'Tenant Admin',
  STATION_MANAGER: 'Station Manager',
  FINANCE: 'Finance',
  OPERATOR: 'Operations',
  SITE_HOST: 'Site Host',
  TECHNICIAN: 'Technician',
}

const CANONICAL_ROLE_LABELS: Partial<Record<CanonicalAccessRole, string>> = {
  PLATFORM_SUPER_ADMIN: 'Platform Super Admin',
  PLATFORM_BILLING_ADMIN: 'Platform Billing Admin',
  PLATFORM_NOC_LEAD: 'NOC Lead',
  TENANT_ADMIN: 'Tenant Admin',
  SITE_HOST: 'Site Host',
  ROAMING_MANAGER: 'Roaming Manager',
  STATION_MANAGER: 'Station Manager',
  OPERATIONS_OPERATOR: 'Operations Operator',
  TENANT_FINANCE_ANALYST: 'Tenant Finance Analyst',
  FLEET_DISPATCHER: 'Fleet Dispatcher',
  FLEET_DRIVER: 'Fleet Driver',
  INSTALLER_AGENT: 'Installer Agent',
  SMART_CHARGING_ENGINEER: 'Smart Charging Engineer',
  FIELD_TECHNICIAN: 'Field Technician',
  EXTERNAL_PROVIDER_ADMIN: 'External Provider Admin',
  EXTERNAL_PROVIDER_OPERATOR: 'External Provider Operator',
  LEGACY_UNMAPPED: 'Legacy Access',
}

function isCPORole(role: string): role is CPORole {
  return (CPO_ROLE_VALUES as readonly string[]).includes(role)
}

function getPermissions(user: AccessAwareUser) {
  return user?.accessProfile?.permissions ?? []
}

function matchesPermission(user: AccessAwareUser, permissions: readonly string[]) {
  const grantedPermissions = getPermissions(user)
  return permissions.some((permission) => grantedPermissions.includes(permission))
}

function deriveAssignedStationIds(user: { assignedStationIds?: string[]; stationContexts?: Array<{ stationId: string }>; activeStationContext?: { stationId: string } | null; accessProfile?: AccessProfile | null }) {
  if (user.assignedStationIds && user.assignedStationIds.length > 0) {
    return Array.from(new Set(user.assignedStationIds))
  }

  if (user.activeStationContext?.stationId) {
    return [user.activeStationContext.stationId]
  }

  if (user.stationContexts && user.stationContexts.length > 0) {
    return Array.from(new Set(user.stationContexts.map((context) => context.stationId)))
  }

  if (user.accessProfile?.scope.stationIds && user.accessProfile.scope.stationIds.length > 0) {
    return Array.from(new Set(user.accessProfile.scope.stationIds))
  }

  return undefined
}

export function normalizeUserRole(role?: string | null, accessProfile?: AccessProfile | null): CPORole | null {
  const canonicalRole = accessProfile?.canonicalRole

  if (canonicalRole && CANONICAL_ROLE_TO_CPO_ROLE[canonicalRole]) {
    return CANONICAL_ROLE_TO_CPO_ROLE[canonicalRole]
  }

  if (role && isCPORole(role)) {
    return role
  }

  const permissions = accessProfile?.permissions ?? []

  if (permissions.includes('platform.tenants.read')) return 'SUPER_ADMIN'
  if (permissions.includes('tenant.users.read') || permissions.includes('tenant.settings.read')) return 'CPO_ADMIN'

  if (
    permissions.includes('sites.read')
    && permissions.includes('finance.revenue_reports.read')
    && !permissions.includes('tenant.users.read')
    && !permissions.includes('stations.write')
  ) {
    return 'SITE_HOST'
  }

  if (
    (permissions.includes('finance.billing.read') || permissions.includes('platform.billing.read'))
    && !permissions.includes('tenant.users.read')
    && !permissions.includes('stations.write')
  ) {
    return 'FINANCE'
  }

  if (permissions.includes('stations.write')) return 'STATION_MANAGER'

  if (
    permissions.includes('maintenance.dispatch.read')
    && !permissions.includes('stations.write')
    && !permissions.includes('tenant.users.read')
  ) {
    return 'TECHNICIAN'
  }

  if (
    permissions.includes('sessions.read')
    || permissions.includes('commands.read')
    || permissions.includes('ocpi.partners.read')
  ) {
    return 'OPERATOR'
  }

  return null
}

export function normalizeAuthenticatedUser<T extends Omit<CPOUser, 'role'> & { role: string; accessProfile?: AccessProfile | null; legacyRole?: string }>(user: T): CPOUser {
  const normalizedRole = normalizeUserRole(user.role, user.accessProfile) ?? 'OPERATOR'
  const legacyRole = user.legacyRole ?? (isCPORole(user.role) ? undefined : user.role)
  const assignedStationIds = deriveAssignedStationIds(user)

  return {
    ...user,
    role: normalizedRole,
    legacyRole,
    assignedStationIds,
    createdAt: user.createdAt ?? '',
    mfaEnabled: user.mfaEnabled ?? ('twoFactorEnabled' in user ? Boolean(user.twoFactorEnabled) : false),
    organizationId: user.activeOrganizationId ?? user.organizationId,
    orgId: user.orgId ?? user.activeOrganizationId ?? user.organizationId ?? null,
    activeOrganizationId: user.activeOrganizationId ?? user.organizationId ?? null,
    accessProfile: user.accessProfile ?? null,
  }
}

export function getResolvedUserRole(user?: AccessAwareUser) {
  if (!user) return null
  return normalizeUserRole(user.role ?? null, user.accessProfile ?? null)
}

export function getCanonicalUserRole(user?: AccessAwareUser) {
  return user?.accessProfile?.canonicalRole ?? null
}

export function getUserScopeType(user?: AccessAwareUser) {
  return user?.accessProfile?.scope.type ?? null
}

export function isFinanceDashboardUser(user?: AccessAwareUser) {
  const canonicalRole = getCanonicalUserRole(user)
  return canonicalRole === 'PLATFORM_BILLING_ADMIN'
    || canonicalRole === 'TENANT_FINANCE_ANALYST'
    || getResolvedUserRole(user) === 'FINANCE'
}

export function isStationManagerDashboardUser(user?: AccessAwareUser) {
  return getCanonicalUserRole(user) === 'STATION_MANAGER'
    || getResolvedUserRole(user) === 'STATION_MANAGER'
}

export function isTechnicianDashboardUser(user?: AccessAwareUser) {
  const canonicalRole = getCanonicalUserRole(user)
  return canonicalRole === 'FIELD_TECHNICIAN'
    || canonicalRole === 'INSTALLER_AGENT'
    || canonicalRole === 'SMART_CHARGING_ENGINEER'
    || getResolvedUserRole(user) === 'TECHNICIAN'
}

export function isSiteScopedUser(user?: AccessAwareUser) {
  return getUserScopeType(user) === 'site' || getResolvedUserRole(user) === 'SITE_HOST'
}

export function canAccessRole(role: string | undefined | null, allowedRoles: readonly CPORole[]) {
  return !!role && isCPORole(role) && allowedRoles.includes(role)
}

export function canAccessPolicy(user: AccessAwareUser, policy: AccessPolicyKey) {
  const permissions = ACCESS_PERMISSION_MAP[policy]

  if (user?.accessProfile && permissions && permissions.length > 0) {
    return matchesPermission(user, permissions)
  }

  return canAccessRole(getResolvedUserRole(user), ACCESS_POLICY[policy])
}

export function getUserRoleLabel(user?: AccessAwareUser) {
  if (!user) return 'Unknown'

  const canonicalRole = user.accessProfile?.canonicalRole
  if (canonicalRole) {
    return CANONICAL_ROLE_LABELS[canonicalRole] ?? canonicalRole
  }

  const resolvedRole = getResolvedUserRole(user)
  return resolvedRole ? ROLE_LABELS[resolvedRole] : user.legacyRole ?? user.role ?? 'Unknown'
}

function getHomePathFromUser(user: AccessAwareUser) {
  const resolvedRole = getResolvedUserRole(user)
  const permissions = getPermissions(user)
  const scopeType = user?.accessProfile?.scope.type

  if (scopeType === 'site' || resolvedRole === 'SITE_HOST') {
    return PATHS.SITE_DASHBOARD
  }

  if (permissions.includes('platform.tenants.read')) {
    return ROLE_HOME.SUPER_ADMIN
  }

  if (permissions.includes('tenant.users.read') || permissions.includes('tenant.settings.read')) {
    return ROLE_HOME.CPO_ADMIN
  }

  if (permissions.includes('ocpi.partners.read') && !permissions.includes('stations.read')) {
    return PATHS.OCPI_PARTNERS
  }

  if (
    (permissions.includes('finance.billing.read') || permissions.includes('platform.billing.read'))
    && !permissions.includes('tenant.users.read')
    && !permissions.includes('stations.write')
  ) {
    return ROLE_HOME.FINANCE
  }

  if (
    permissions.includes('maintenance.dispatch.read')
    && !permissions.includes('stations.write')
    && !permissions.includes('tenant.users.read')
  ) {
    return ROLE_HOME.TECHNICIAN
  }

  if (permissions.includes('stations.write')) {
    return resolvedRole === 'CPO_ADMIN' ? ROLE_HOME.CPO_ADMIN : ROLE_HOME.STATION_MANAGER
  }

  if (permissions.includes('sessions.read') || permissions.includes('commands.read')) {
    return ROLE_HOME.OPERATOR
  }

  return resolvedRole ? ROLE_HOME[resolvedRole] : PATHS.LOGIN
}

export function getRoleHomePath(roleOrUser?: CPORole | AccessAwareUser) {
  if (!roleOrUser) return PATHS.LOGIN
  if (typeof roleOrUser === 'string') {
    return ROLE_HOME[roleOrUser]
  }
  return getHomePathFromUser(roleOrUser)
}

export function getRoleDashboardVariant(roleOrUser?: CPORole | AccessAwareUser) {
  if (!roleOrUser) return null
  if (typeof roleOrUser === 'string') {
    return ROLE_DASHBOARD_VARIANT[roleOrUser]
  }

  const resolvedRole = getResolvedUserRole(roleOrUser)
  return resolvedRole ? ROLE_DASHBOARD_VARIANT[resolvedRole] : null
}
