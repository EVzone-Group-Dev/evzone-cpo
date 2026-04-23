import type {
  AccessProfile,
  CPORole,
  CPOUser,
  CanonicalAccessRole,
} from "@/core/types/domain";
import { PATHS } from "@/router/paths";
import { resolveDisplayLabel } from "@/core/auth/displayLabel";
import { normalizeTenantCpoType } from "@/core/tenancy/cpoType";

export type DashboardVariant =
  | "super-admin"
  | "cpo-admin"
  | "station-manager"
  | "finance"
  | "operator"
  | "site-host"
  | "technician";

export const ACTIVE_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "FINANCE",
  "OPERATOR",
  "SITE_HOST",
  "TECHNICIAN",
] as const satisfies readonly CPORole[];

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
] as const satisfies readonly CPORole[];
export const ASSET_MANAGER_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
] as const satisfies readonly CPORole[];
export const INFRASTRUCTURE_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "OPERATOR",
  "TECHNICIAN",
] as const satisfies readonly CPORole[];
export const OPERATIONS_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "OPERATOR",
  "TECHNICIAN",
] as const satisfies readonly CPORole[];
export const FLEET_OPS_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "OPERATOR",
] as const satisfies readonly CPORole[];
export const ENERGY_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "OPERATOR",
  "TECHNICIAN",
] as const satisfies readonly CPORole[];
export const ROAMING_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "FINANCE",
  "OPERATOR",
] as const satisfies readonly CPORole[];
export const FINANCE_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "FINANCE",
] as const satisfies readonly CPORole[];
export const REPORTING_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "FINANCE",
  "STATION_MANAGER",
] as const satisfies readonly CPORole[];
export const TEAM_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
] as const satisfies readonly CPORole[];
export const PLATFORM_ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
] as const satisfies readonly CPORole[];
export const SETTINGS_ROLES = ACTIVE_ROLES;
export const SUPER_ADMIN_ROLES = [
  "SUPER_ADMIN",
] as const satisfies readonly CPORole[];
export const CPO_ADMIN_ROLES = [
  "CPO_ADMIN",
] as const satisfies readonly CPORole[];
export const STATION_MANAGER_ROLES = [
  "STATION_MANAGER",
] as const satisfies readonly CPORole[];
export const FINANCE_DASHBOARD_ROLES = [
  "FINANCE",
] as const satisfies readonly CPORole[];
export const OPERATOR_ROLES = [
  "OPERATOR",
] as const satisfies readonly CPORole[];
export const SITE_HOST_ROLES = [
  "SITE_HOST",
] as const satisfies readonly CPORole[];
export const TECHNICIAN_ROLES = [
  "TECHNICIAN",
] as const satisfies readonly CPORole[];

export const ROLE_DASHBOARD_VARIANT = {
  SUPER_ADMIN: "super-admin",
  CPO_ADMIN: "cpo-admin",
  STATION_MANAGER: "station-manager",
  FINANCE: "finance",
  OPERATOR: "operator",
  SITE_HOST: "site-host",
  TECHNICIAN: "technician",
} as const satisfies Record<CPORole, DashboardVariant>;

export const ROLE_HOME = {
  SUPER_ADMIN: PATHS.DASHBOARD_SUPER_ADMIN,
  CPO_ADMIN: PATHS.DASHBOARD_CPO_ADMIN,
  STATION_MANAGER: PATHS.DASHBOARD_STATION_MANAGER,
  FINANCE: PATHS.DASHBOARD_FINANCE,
  OPERATOR: PATHS.DASHBOARD_OPERATOR,
  SITE_HOST: PATHS.SITE_DASHBOARD,
  TECHNICIAN: PATHS.DASHBOARD_TECHNICIAN,
} as const satisfies Record<CPORole, string>;

export const ACCESS_POLICY = {
  tenancyContext: ACTIVE_ROLES,
  dashboardHome: ACTIVE_ROLES,
  onboardingApplicant: CPO_ADMIN_ROLES,
  onboardingAdmin: SUPER_ADMIN_ROLES,
  dashboardSuperAdmin: SUPER_ADMIN_ROLES,
  dashboardCpoAdmin: CPO_ADMIN_ROLES,
  dashboardStationManager: STATION_MANAGER_ROLES,
  dashboardFinance: FINANCE_DASHBOARD_ROLES,
  dashboardOperator: OPERATOR_ROLES,
  dashboardTechnician: TECHNICIAN_ROLES,
  siteDashboard: [
    ...SUPER_ADMIN_ROLES,
    ...CPO_ADMIN_ROLES,
    ...SITE_HOST_ROLES,
  ] as const satisfies readonly CPORole[],
  stationsRead: INFRASTRUCTURE_ROLES,
  stationsWrite: ASSET_MANAGER_ROLES,
  chargePointsRead: INFRASTRUCTURE_ROLES,
  chargePointsWrite: ASSET_MANAGER_ROLES,
  swapStationsRead: INFRASTRUCTURE_ROLES,
  sessionsRead: OPERATIONS_ROLES,
  reservationsRead: OPERATIONS_ROLES,
  fleetRead: FLEET_OPS_ROLES,
  swapSessionsRead: OPERATIONS_ROLES,
  swapLifecycleWrite: OPERATIONS_ROLES,
  swapDispatchWrite: OPERATIONS_ROLES,
  incidentsRead: OPERATIONS_ROLES,
  alertsRead: OPERATIONS_ROLES,
  smartChargingRead: ENERGY_ROLES,
  loadPoliciesRead: ENERGY_ROLES,
  derOrchestrationRead: ENERGY_ROLES,
  smartChargingWrite: ENERGY_ROLES,
  loadPoliciesWrite: ENERGY_ROLES,
  batteryInventoryRead: ENERGY_ROLES,
  pncRead: INFRASTRUCTURE_ROLES,
  roamingRead: ROAMING_ROLES,
  tariffsRead: FINANCE_ROLES,
  billingRead: FINANCE_ROLES,
  payoutsRead: FINANCE_ROLES,
  settlementRead: FINANCE_ROLES,
  teamRead: TEAM_ROLES,
  reportsRead: REPORTING_ROLES,
  auditLogsRead: FINANCE_ROLES,
  platformAdminRead: PLATFORM_ADMIN_ROLES,
  tierPricingAdmin: SUPER_ADMIN_ROLES,
  enterpriseIamRead: PLATFORM_ADMIN_ROLES,
  developerPlatformRead: PLATFORM_ADMIN_ROLES,
  settingsRead: SETTINGS_ROLES,
  notificationsRead: SETTINGS_ROLES,
  whiteLabelAdmin: ADMIN_ROLES,
  remoteCommandStart: OPERATIONS_ROLES,
  chargePointCommands: OPERATIONS_ROLES,
} as const;

export type AccessPolicyKey = keyof typeof ACCESS_POLICY;

type AccessAwareUser =
  | Pick<
      CPOUser,
      | "role"
      | "accessProfile"
      | "legacyRole"
      | "activeStationContext"
      | "sessionScopeType"
      | "actingAsTenant"
      | "selectedTenantId"
      | "tenantActivated"
      | "mfaRequired"
      | "twoFactorEnabled"
      | "mfaSetupRequired"
    >
  | {
      role?: string | null;
      accessProfile?: AccessProfile | null;
      legacyRole?: string;
      sessionScopeType?: "platform" | "tenant";
      actingAsTenant?: boolean;
      selectedTenantId?: string | null;
      tenantActivated?: boolean;
      mfaRequired?: boolean;
      twoFactorEnabled?: boolean;
      mfaSetupRequired?: boolean;
      activeStationContext?: {
        stationId?: string | null;
        stationName?: string | null;
        shiftStart?: string | null;
        shiftEnd?: string | null;
      } | null;
    }
  | null
  | undefined;

export type TemporaryAccessState =
  | "none"
  | "unbounded"
  | "upcoming"
  | "active"
  | "expired";

const CPO_ROLE_VALUES = [
  "SUPER_ADMIN",
  "CPO_ADMIN",
  "STATION_MANAGER",
  "FINANCE",
  "OPERATOR",
  "SITE_HOST",
  "TECHNICIAN",
] as const;

const ACCESS_PERMISSION_MAP: Record<
  AccessPolicyKey,
  readonly string[] | undefined
> = {
  tenancyContext: undefined,
  dashboardHome: undefined,
  onboardingApplicant: ["tenant.users.read", "tenant.settings.read"],
  onboardingAdmin: ['platform.tenants.read', 'platform.tenants.write'],
  dashboardSuperAdmin: ["platform.tenants.read"],
  dashboardCpoAdmin: ["tenant.users.read", "tenant.settings.read"],
  dashboardStationManager: ["stations.write"],
  dashboardFinance: ["finance.billing.read", "platform.billing.read"],
  dashboardOperator: ["sessions.read", "commands.read"],
  dashboardTechnician: ["maintenance.dispatch.read"],
  siteDashboard: ["finance.revenue_reports.read"],
  stationsRead: ["stations.read"],
  stationsWrite: ["stations.write"],
  chargePointsRead: ["charge_points.read"],
  chargePointsWrite: ["charge_points.write"],
  swapStationsRead: ["stations.read", "battery_inventory.read"],
  sessionsRead: ["sessions.read"],
  reservationsRead: ["sessions.read", "commands.read"],
  fleetRead: ["tenant.users.read", "sessions.read", "fleet.vehicles.read"],
  swapSessionsRead: ["sessions.read"],
  swapLifecycleWrite: undefined,
  swapDispatchWrite: undefined,
  incidentsRead: ["incidents.read"],
  alertsRead: ["alerts.read"],
  smartChargingRead: ["smart_charging.read", "load_profiles.read"],
  loadPoliciesRead: ["smart_charging.read", "load_profiles.read"],
  derOrchestrationRead: ["smart_charging.read", "load_profiles.read"],
  smartChargingWrite: ["smart_charging.write"],
  loadPoliciesWrite: ["smart_charging.write"],
  batteryInventoryRead: ["battery_inventory.read"],
  pncRead: ["charge_points.read", "charge_points.security.write"],
  roamingRead: [
    "ocpi.partners.read",
    "ocpi.sessions.read",
    "ocpi.cdrs.read",
    "ocpi.commands.read",
    "ocpi.commands.write",
  ],
  tariffsRead: ["tenant.tariffs.read"],
  billingRead: ["finance.billing.read", "platform.billing.read"],
  payoutsRead: ["finance.payouts.read"],
  settlementRead: ["finance.settlement.read"],
  teamRead: ["tenant.users.read"],
  reportsRead: ["finance.revenue_reports.read"],
  auditLogsRead: ["platform.audit.read"],
  platformAdminRead: ["platform.integrations.read", "platform.audit.read"],
  tierPricingAdmin: ["platform.tenants.read"],
  enterpriseIamRead: ["tenant.settings.read", "platform.tenants.read"],
  developerPlatformRead: ["platform.integrations.read", "tenant.settings.read"],
  settingsRead: ["tenant.settings.read", "platform.tenants.read"],
  notificationsRead: undefined,
  whiteLabelAdmin: [
    "tenant.branding.write",
    "platform.tenants.write",
    "platform.tenants.read",
  ],
  remoteCommandStart: ["commands.write"],
  chargePointCommands: ["charge_points.command"],
};

const CANONICAL_ROLE_TO_CPO_ROLE: Partial<
  Record<CanonicalAccessRole, CPORole>
> = {
  PLATFORM_SUPER_ADMIN: "SUPER_ADMIN",
  PLATFORM_BILLING_ADMIN: "FINANCE",
  PLATFORM_NOC_LEAD: "OPERATOR",
  TENANT_ADMIN: "CPO_ADMIN",
  SITE_HOST: "SITE_HOST",
  ROAMING_MANAGER: "CPO_ADMIN",
  STATION_MANAGER: "STATION_MANAGER",
  OPERATIONS_OPERATOR: "OPERATOR",
  FLEET_DISPATCHER: "OPERATOR",
  FLEET_DRIVER: "OPERATOR",
  INSTALLER_AGENT: "TECHNICIAN",
  SMART_CHARGING_ENGINEER: "TECHNICIAN",
  FIELD_TECHNICIAN: "TECHNICIAN",
  TENANT_FINANCE_ANALYST: "FINANCE",
  EXTERNAL_PROVIDER_OPERATOR: "OPERATOR",
};

const ROLE_LABELS: Record<CPORole, string> = {
  SUPER_ADMIN: "Platform Super Admin",
  CPO_ADMIN: "Tenant Admin",
  STATION_MANAGER: "Station Manager",
  FINANCE: "Finance",
  OPERATOR: "Operations",
  SITE_HOST: "Site Host",
  TECHNICIAN: "Technician",
};

const CANONICAL_ROLE_LABELS: Partial<Record<CanonicalAccessRole, string>> = {
  PLATFORM_SUPER_ADMIN: "Platform Super Admin",
  PLATFORM_BILLING_ADMIN: "Platform Billing Admin",
  PLATFORM_NOC_LEAD: "NOC Lead",
  TENANT_ADMIN: "Tenant Admin",
  SITE_HOST: "Site Host",
  ROAMING_MANAGER: "Roaming Manager",
  STATION_MANAGER: "Station Manager",
  OPERATIONS_OPERATOR: "Operations Operator",
  FLEET_DISPATCHER: "Fleet Dispatcher",
  FLEET_DRIVER: "Fleet Driver",
  INSTALLER_AGENT: "Installer Agent",
  SMART_CHARGING_ENGINEER: "Smart Charging Engineer",
  FIELD_TECHNICIAN: "Field Technician",
  TENANT_FINANCE_ANALYST: "Tenant Finance Analyst",
  EXTERNAL_PROVIDER_OPERATOR: "External Provider Operator",
  LEGACY_UNMAPPED: "Legacy Access",
};

const TEMPORARY_SCOPE_ALLOWED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardHome",
  "dashboardTechnician",
  "stationsRead",
  "chargePointsRead",
  "sessionsRead",
  "incidentsRead",
  "alertsRead",
  "settingsRead",
  "notificationsRead",
  "remoteCommandStart",
  "chargePointCommands",
]);

const TEMPORARY_EXPIRED_ALLOWED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardHome",
  "settingsRead",
  "notificationsRead",
]);

const SITE_SCOPE_ALLOWED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardHome",
  "siteDashboard",
  "settingsRead",
  "notificationsRead",
]);

const PROVIDER_SCOPE_ALLOWED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardHome",
  "roamingRead",
  "settingsRead",
  "notificationsRead",
]);

const FLEET_SCOPE_ALLOWED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardHome",
  "sessionsRead",
  "reservationsRead",
  "fleetRead",
  "swapSessionsRead",
  "alertsRead",
  "settingsRead",
  "notificationsRead",
]);

const TENANT_CONTEXT_REQUIRED_POLICIES = new Set<AccessPolicyKey>([
  "tenancyContext",
  "dashboardCpoAdmin",
  "dashboardStationManager",
  "dashboardFinance",
  "dashboardOperator",
  "dashboardTechnician",
  "siteDashboard",
  "stationsRead",
  "stationsWrite",
  "chargePointsRead",
  "chargePointsWrite",
  "swapStationsRead",
  "sessionsRead",
  "reservationsRead",
  "fleetRead",
  "swapSessionsRead",
  "swapLifecycleWrite",
  "swapDispatchWrite",
  "incidentsRead",
  "alertsRead",
  "smartChargingRead",
  "loadPoliciesRead",
  "derOrchestrationRead",
  "smartChargingWrite",
  "loadPoliciesWrite",
  "batteryInventoryRead",
  "pncRead",
  "roamingRead",
  "tariffsRead",
  "billingRead",
  "payoutsRead",
  "settlementRead",
  "teamRead",
  "reportsRead",
]);

function policyRequiresTenantContext(policy: AccessPolicyKey) {
  return TENANT_CONTEXT_REQUIRED_POLICIES.has(policy);
}

function isCPORole(role: string): role is CPORole {
  return (CPO_ROLE_VALUES as readonly string[]).includes(role);
}

function getPermissions(user: AccessAwareUser) {
  return user?.accessProfile?.permissions ?? [];
}

function matchesPermission(
  user: AccessAwareUser,
  permissions: readonly string[],
) {
  const grantedPermissions = getPermissions(user);
  return permissions.some((permission) =>
    grantedPermissions.includes(permission),
  );
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveAssignedStationIds(user: {
  assignedStationIds?: string[];
  stationContexts?: Array<{ stationId: string }>;
  activeStationContext?: { stationId: string } | null;
  accessProfile?: AccessProfile | null;
}) {
  if (user.assignedStationIds && user.assignedStationIds.length > 0) {
    return Array.from(new Set(user.assignedStationIds));
  }

  if (user.activeStationContext?.stationId) {
    return [user.activeStationContext.stationId];
  }

  if (user.stationContexts && user.stationContexts.length > 0) {
    return Array.from(
      new Set(user.stationContexts.map((context) => context.stationId)),
    );
  }

  if (
    user.accessProfile?.scope.stationIds &&
    user.accessProfile.scope.stationIds.length > 0
  ) {
    return Array.from(new Set(user.accessProfile.scope.stationIds));
  }

  return undefined;
}

function readRawStringValue(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isTenantImpersonationSession(user: {
  accessProfile?: AccessProfile | null;
  sessionScopeType?: "platform" | "tenant";
  actingAsTenant?: boolean;
  selectedTenantId?: string | null;
  activeTenantId?: string | null;
  tenantId?: string | null;
}) {
  if (user.sessionScopeType === "tenant") {
    return true;
  }

  if (user.actingAsTenant === true) {
    return true;
  }

  if (typeof user.selectedTenantId === "string" && user.selectedTenantId) {
    return true;
  }

  if (
    user.accessProfile?.scope.type !== "platform" &&
    (Boolean(user.activeTenantId) || Boolean(user.tenantId))
  ) {
    return true;
  }

  return false;
}

function isPlatformSessionWithoutTenant(user: AccessAwareUser) {
  if (!user) {
    return false;
  }

  const sessionScopeType = user.sessionScopeType;
  const isPlatformScope =
    sessionScopeType === "platform" || user.accessProfile?.scope.type === "platform";

  if (!isPlatformScope) {
    return false;
  }

  return !isTenantImpersonationSession({
    accessProfile: user.accessProfile ?? null,
    sessionScopeType,
    actingAsTenant: user.actingAsTenant,
    selectedTenantId: user.selectedTenantId ?? null,
    activeTenantId: null,
    tenantId: null,
  });
}

export function normalizeUserRole(
  role?: string | null,
  accessProfile?: AccessProfile | null,
): CPORole | null {
  const canonicalRole = accessProfile?.canonicalRole;

  if (canonicalRole && CANONICAL_ROLE_TO_CPO_ROLE[canonicalRole]) {
    return CANONICAL_ROLE_TO_CPO_ROLE[canonicalRole];
  }

  if (role && isCPORole(role)) {
    return role;
  }

  const permissions = accessProfile?.permissions ?? [];

  if (permissions.includes("platform.tenants.read")) return "SUPER_ADMIN";
  if (
    permissions.includes("tenant.users.read") ||
    permissions.includes("tenant.settings.read")
  )
    return "CPO_ADMIN";

  if (
    permissions.includes("sites.read") &&
    permissions.includes("finance.revenue_reports.read") &&
    !permissions.includes("tenant.users.read") &&
    !permissions.includes("stations.write")
  ) {
    return "SITE_HOST";
  }

  if (
    (permissions.includes("finance.billing.read") ||
      permissions.includes("platform.billing.read")) &&
    !permissions.includes("tenant.users.read") &&
    !permissions.includes("stations.write")
  ) {
    return "FINANCE";
  }

  if (permissions.includes("stations.write")) return "STATION_MANAGER";

  if (
    permissions.includes("maintenance.dispatch.read") &&
    !permissions.includes("stations.write") &&
    !permissions.includes("tenant.users.read")
  ) {
    return "TECHNICIAN";
  }

  if (
    permissions.includes("sessions.read") ||
    permissions.includes("commands.read") ||
    permissions.includes("ocpi.partners.read")
  ) {
    return "OPERATOR";
  }

  return null;
}

export function normalizeAuthenticatedUser<
  T extends Omit<CPOUser, "role"> & {
    role: string;
    accessProfile?: AccessProfile | null;
    legacyRole?: string;
  },
>(user: T): CPOUser {
  const normalizedRole =
    normalizeUserRole(user.role, user.accessProfile) ?? "OPERATOR";
  const legacyRole =
    user.legacyRole ?? (isCPORole(user.role) ? undefined : user.role);
  const assignedStationIds = deriveAssignedStationIds(user);
  const rawUser = user as unknown as Record<string, unknown>;
  const rawSessionScopeType = readRawStringValue(rawUser, "sessionScopeType");
  const sessionScopeType =
    rawSessionScopeType === "platform" || rawSessionScopeType === "tenant"
      ? rawSessionScopeType
      : null;
  const actingAsTenant = rawUser.actingAsTenant === true;
  const selectedTenantId = readRawStringValue(rawUser, "selectedTenantId");
  const selectedTenantName = readRawStringValue(rawUser, "selectedTenantName");
  const rawTenantId =
    readRawStringValue(rawUser, "activeTenantId") ??
    readRawStringValue(rawUser, "activeOrganizationId") ??
    readRawStringValue(rawUser, "tenantId") ??
    readRawStringValue(rawUser, "organizationId");
  const rawOrganizationId =
    readRawStringValue(rawUser, "orgId") ??
    readRawStringValue(rawUser, "activeTenantId") ??
    readRawStringValue(rawUser, "activeOrganizationId") ??
    readRawStringValue(rawUser, "tenantId") ??
    readRawStringValue(rawUser, "organizationId");
  const membershipTenantName =
    user.memberships?.find((membership) => membership.tenantId === rawTenantId)
      ?.tenantName ??
    user.memberships?.[0]?.tenantName ??
    null;
  const rawOrganizationName = readRawStringValue(rawUser, "organizationName");
  const rawActiveTenantName = readRawStringValue(rawUser, "activeTenantName");
  const activeTenantCpoType = normalizeTenantCpoType(
    readRawStringValue(rawUser, "activeTenantCpoType") ??
      readRawStringValue(rawUser, "tenantCpoType") ??
      readRawStringValue(rawUser, "cpoType"),
  );
  const rawScopeDisplayName = readRawStringValue(rawUser, "scopeDisplayName");
  const rawActiveStationName =
    readRawStringValue(rawUser, "activeStationName") ??
    user.activeStationContext?.stationName ??
    null;

  const tenantSession = isTenantImpersonationSession({
    accessProfile: user.accessProfile ?? null,
    sessionScopeType: sessionScopeType ?? undefined,
    actingAsTenant,
    selectedTenantId,
    activeTenantId: rawTenantId,
    tenantId: readRawStringValue(rawUser, "tenantId"),
  });
  const platformSessionWithoutTenant =
    (sessionScopeType === "platform" ||
      user.accessProfile?.scope.type === "platform") &&
    !tenantSession;
  const normalizedSessionScopeType: "platform" | "tenant" =
    platformSessionWithoutTenant ? "platform" : "tenant";
  const normalizedTenantId = platformSessionWithoutTenant
    ? null
    : selectedTenantId ?? rawTenantId ?? null;
  const normalizedOrganizationId = platformSessionWithoutTenant
    ? null
    : rawOrganizationId ?? normalizedTenantId;
  const normalizedActiveTenantId = platformSessionWithoutTenant
    ? null
    : selectedTenantId ?? rawTenantId ?? null;
  const displayTenantName = platformSessionWithoutTenant
    ? null
    : resolveDisplayLabel({
        primary: selectedTenantName ?? rawActiveTenantName,
        secondary: rawOrganizationName ?? membershipTenantName,
        fallback: "Unknown tenant",
      });
  const displayOrganizationName = platformSessionWithoutTenant
    ? null
    : resolveDisplayLabel({
        primary: rawOrganizationName ?? rawActiveTenantName,
        secondary: membershipTenantName,
        fallback: "Unknown tenant",
      });
  const displayStationName = resolveDisplayLabel({
    primary: rawActiveStationName,
    secondary: null,
    fallback: "Unassigned",
  });
  const displayScopeName = platformSessionWithoutTenant
    ? "Platform"
    : resolveDisplayLabel({
        primary: rawScopeDisplayName,
        secondary:
          user.accessProfile?.scope.type === "station"
            ? rawActiveStationName
            : displayTenantName,
        fallback: "Tenant Scope",
      });
  const normalizedMemberships = user.memberships?.map((membership) => {
    const membershipRecord = membership as unknown as Record<string, unknown>;
    const organizationName = readRawStringValue(
      membershipRecord,
      "organizationName",
    );
    const organizationType = readRawStringValue(
      membershipRecord,
      "organizationType",
    );
    const cpoType = normalizeTenantCpoType(
      readRawStringValue(membershipRecord, "cpoType") ??
        readRawStringValue(membershipRecord, "tenantCpoType") ??
        readRawStringValue(membershipRecord, "cpo_service_type"),
    );

    return {
      ...membership,
      tenantName: membership.tenantName ?? organizationName ?? membership.tenantId,
      tenantType: membership.tenantType ?? organizationType ?? undefined,
      cpoType: membership.cpoType ?? cpoType ?? undefined,
    };
  });

  return {
    ...user,
    role: normalizedRole,
    legacyRole,
    assignedStationIds,
    createdAt: user.createdAt ?? "",
    twoFactorEnabled:
      "twoFactorEnabled" in user ? Boolean(user.twoFactorEnabled) : false,
    mfaEnabled:
      user.mfaEnabled ??
      ("mfaRequired" in user && typeof user.mfaRequired === "boolean"
        ? user.mfaRequired
        : undefined) ??
      ("twoFactorEnabled" in user ? Boolean(user.twoFactorEnabled) : false),
    mfaRequired:
      "mfaRequired" in user && typeof user.mfaRequired === "boolean"
        ? user.mfaRequired
        : Boolean(user.mfaEnabled),
    mfaSetupRequired:
      "mfaSetupRequired" in user && typeof user.mfaSetupRequired === "boolean"
        ? user.mfaSetupRequired
        : false,
    tenantId: normalizedTenantId ?? undefined,
    orgId: normalizedOrganizationId,
    activeTenantId: normalizedActiveTenantId,
    activeTenantCpoType:
      normalizedSessionScopeType === "tenant" ? activeTenantCpoType : null,
    organizationName: displayOrganizationName,
    activeTenantName: displayTenantName,
    scopeDisplayName: displayScopeName,
    activeStationName: displayStationName,
    displayTenantName,
    displayOrganizationName,
    displayScopeName,
    displayStationName,
    sessionScopeType: normalizedSessionScopeType,
    actingAsTenant:
      normalizedSessionScopeType === "tenant" &&
      (actingAsTenant || Boolean(normalizedActiveTenantId)),
    selectedTenantId:
      normalizedSessionScopeType === "tenant" ? normalizedActiveTenantId : null,
    selectedTenantName:
      normalizedSessionScopeType === "tenant" ? displayTenantName : null,
    memberships: normalizedMemberships,
    accessProfile: user.accessProfile ?? null,
  };
}

export function getResolvedUserRole(user?: AccessAwareUser) {
  if (!user) return null;
  return normalizeUserRole(user.role ?? null, user.accessProfile ?? null);
}

export function requiresMfaSetup(user?: AccessAwareUser): boolean {
  if (!user) {
    return false;
  }

  return user.mfaSetupRequired === true;
}

export function getCanonicalUserRole(user?: AccessAwareUser) {
  return user?.accessProfile?.canonicalRole ?? null;
}

export function getUserScopeType(user?: AccessAwareUser) {
  return user?.accessProfile?.scope.type ?? null;
}

export function isTemporaryScopeUser(user?: AccessAwareUser) {
  return Boolean(
    user?.accessProfile?.scope.isTemporary ||
    user?.accessProfile?.scope.type === "temporary",
  );
}

export function getTemporaryAccessState(
  user?: AccessAwareUser,
  referenceTime = Date.now(),
): TemporaryAccessState {
  if (!isTemporaryScopeUser(user)) {
    return "none";
  }

  const shiftStart = parseDateValue(
    user?.activeStationContext?.shiftStart ?? null,
  );
  const shiftEnd = parseDateValue(user?.activeStationContext?.shiftEnd ?? null);

  if (!shiftStart && !shiftEnd) {
    return "unbounded";
  }

  if (shiftStart && referenceTime < shiftStart) {
    return "upcoming";
  }

  if (shiftEnd && referenceTime > shiftEnd) {
    return "expired";
  }

  return "active";
}

export function isTemporaryAccessExpired(
  user?: AccessAwareUser,
  referenceTime = Date.now(),
) {
  return getTemporaryAccessState(user, referenceTime) === "expired";
}

function formatDateLabel(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : null;
}

export function getTemporaryAccessWindowLabel(user?: AccessAwareUser) {
  if (!isTemporaryScopeUser(user)) {
    return "Not a temporary scope.";
  }

  const shiftStart = parseDateValue(
    user?.activeStationContext?.shiftStart ?? null,
  );
  const shiftEnd = parseDateValue(user?.activeStationContext?.shiftEnd ?? null);
  const startLabel = formatDateLabel(shiftStart);
  const endLabel = formatDateLabel(shiftEnd);

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  if (startLabel) {
    return `Starts ${startLabel}`;
  }

  if (endLabel) {
    return `Ends ${endLabel}`;
  }

  return "Temporary access is active until backend context changes.";
}

export function isFinanceDashboardUser(user?: AccessAwareUser) {
  const canonicalRole = getCanonicalUserRole(user);
  return (
    canonicalRole === "PLATFORM_BILLING_ADMIN" ||
    canonicalRole === "TENANT_FINANCE_ANALYST" ||
    getResolvedUserRole(user) === "FINANCE"
  );
}

export function isStationManagerDashboardUser(user?: AccessAwareUser) {
  return (
    getCanonicalUserRole(user) === "STATION_MANAGER" ||
    getResolvedUserRole(user) === "STATION_MANAGER"
  );
}

export function isTechnicianDashboardUser(user?: AccessAwareUser) {
  const canonicalRole = getCanonicalUserRole(user);
  return (
    canonicalRole === "FIELD_TECHNICIAN" ||
    canonicalRole === "INSTALLER_AGENT" ||
    canonicalRole === "SMART_CHARGING_ENGINEER" ||
    getResolvedUserRole(user) === "TECHNICIAN"
  );
}

export function isSiteScopedUser(user?: AccessAwareUser) {
  return (
    getUserScopeType(user) === "site" ||
    getResolvedUserRole(user) === "SITE_HOST"
  );
}

export function isProviderScopedUser(user?: AccessAwareUser) {
  return getUserScopeType(user) === "provider";
}

export function isFleetScopedUser(user?: AccessAwareUser) {
  return getUserScopeType(user) === "fleet_group";
}

function isTenantScopedSession(user?: AccessAwareUser) {
  const scopeType = getUserScopeType(user);
  if (scopeType) {
    return scopeType !== "platform";
  }

  return user?.sessionScopeType === "tenant";
}

function isTenantAdminForActivation(user?: AccessAwareUser) {
  const canonicalRole = getCanonicalUserRole(user);
  if (canonicalRole) {
    return canonicalRole === "TENANT_ADMIN";
  }

  return getResolvedUserRole(user) === "CPO_ADMIN";
}

export function isTenantActivationPendingForUser(user?: AccessAwareUser) {
  if (user?.tenantActivated !== false) {
    return false;
  }

  if (!isTenantScopedSession(user)) {
    return false;
  }

  return !isTenantAdminForActivation(user);
}

function isScopePolicyAllowed(user: AccessAwareUser, policy: AccessPolicyKey) {
  if (isTemporaryAccessExpired(user)) {
    return TEMPORARY_EXPIRED_ALLOWED_POLICIES.has(policy);
  }

  if (isTemporaryScopeUser(user)) {
    return TEMPORARY_SCOPE_ALLOWED_POLICIES.has(policy);
  }

  if (isSiteScopedUser(user)) {
    return SITE_SCOPE_ALLOWED_POLICIES.has(policy);
  }

  if (isProviderScopedUser(user)) {
    return PROVIDER_SCOPE_ALLOWED_POLICIES.has(policy);
  }

  if (isFleetScopedUser(user)) {
    return FLEET_SCOPE_ALLOWED_POLICIES.has(policy);
  }

  return true;
}

export function canAccessRole(
  role: string | undefined | null,
  allowedRoles: readonly CPORole[],
) {
  return !!role && isCPORole(role) && allowedRoles.includes(role);
}

export function canAccessPolicy(
  user: AccessAwareUser,
  policy: AccessPolicyKey,
) {
  const permissions = ACCESS_PERMISSION_MAP[policy];
  const hasPermissionAccess = Boolean(
    user?.accessProfile && permissions && permissions.length > 0,
  );
  const hasBaseAccess = hasPermissionAccess
    ? matchesPermission(user, permissions ?? [])
    : canAccessRole(getResolvedUserRole(user), ACCESS_POLICY[policy]);

  if (!hasBaseAccess) {
    return false;
  }

  if (
    policyRequiresTenantContext(policy) &&
    isPlatformSessionWithoutTenant(user)
  ) {
    return false;
  }

  return isScopePolicyAllowed(user, policy);
}

export function getUserRoleLabel(user?: AccessAwareUser) {
  if (!user) return "Unknown";

  const canonicalRole = user.accessProfile?.canonicalRole;
  if (canonicalRole) {
    return CANONICAL_ROLE_LABELS[canonicalRole] ?? canonicalRole;
  }

  const resolvedRole = getResolvedUserRole(user);
  return resolvedRole
    ? ROLE_LABELS[resolvedRole]
    : (user.legacyRole ?? user.role ?? "Unknown");
}

function getHomePathFromUser(user: AccessAwareUser) {
  const resolvedRole = getResolvedUserRole(user);
  const permissions = getPermissions(user);
  const scopeType = user?.accessProfile?.scope.type;

  if (scopeType === "site" || resolvedRole === "SITE_HOST") {
    if (canAccessPolicy(user, "siteDashboard")) {
      return PATHS.SITE_DASHBOARD;
    }
    if (canAccessPolicy(user, "notificationsRead")) {
      return PATHS.NOTIFICATIONS;
    }
    return PATHS.LOGIN;
  }

  if (scopeType === "provider") {
    if (canAccessPolicy(user, "roamingRead")) {
      return PATHS.OCPI_PARTNERS;
    }
    if (canAccessPolicy(user, "notificationsRead")) {
      return PATHS.NOTIFICATIONS;
    }
    return PATHS.LOGIN;
  }

  if (scopeType === "fleet_group") {
    if (canAccessPolicy(user, "sessionsRead")) {
      return PATHS.SESSIONS;
    }
    if (canAccessPolicy(user, "swapSessionsRead")) {
      return PATHS.SWAP_SESSIONS;
    }
    if (canAccessPolicy(user, "alertsRead")) {
      return PATHS.ALERTS;
    }
    if (canAccessPolicy(user, "notificationsRead")) {
      return PATHS.NOTIFICATIONS;
    }
    return PATHS.LOGIN;
  }

  if (permissions.includes("platform.tenants.read")) {
    return ROLE_HOME.SUPER_ADMIN;
  }

  if (
    permissions.includes("tenant.users.read") ||
    permissions.includes("tenant.settings.read")
  ) {
    return ROLE_HOME.CPO_ADMIN;
  }

  if (
    permissions.includes("ocpi.partners.read") ||
    permissions.includes("ocpi.sessions.read")
  ) {
    return PATHS.OCPI_PARTNERS;
  }

  if (
    (permissions.includes("finance.billing.read") ||
      permissions.includes("platform.billing.read")) &&
    !permissions.includes("tenant.users.read") &&
    !permissions.includes("stations.write")
  ) {
    return ROLE_HOME.FINANCE;
  }

  if (
    permissions.includes("maintenance.dispatch.read") &&
    !permissions.includes("stations.write") &&
    !permissions.includes("tenant.users.read")
  ) {
    return ROLE_HOME.TECHNICIAN;
  }

  if (permissions.includes("stations.write")) {
    return resolvedRole === "CPO_ADMIN"
      ? ROLE_HOME.CPO_ADMIN
      : ROLE_HOME.STATION_MANAGER;
  }

  if (
    permissions.includes("sessions.read") ||
    permissions.includes("commands.read")
  ) {
    return ROLE_HOME.OPERATOR;
  }

  return resolvedRole ? ROLE_HOME[resolvedRole] : PATHS.LOGIN;
}

export function getRoleHomePath(roleOrUser?: CPORole | AccessAwareUser) {
  if (!roleOrUser) return PATHS.LOGIN;
  if (typeof roleOrUser === "string") {
    return ROLE_HOME[roleOrUser];
  }
  return getHomePathFromUser(roleOrUser);
}

export function getRoleDashboardVariant(
  roleOrUser?: CPORole | AccessAwareUser,
) {
  if (!roleOrUser) return null;
  if (typeof roleOrUser === "string") {
    return ROLE_DASHBOARD_VARIANT[roleOrUser];
  }

  const resolvedRole = getResolvedUserRole(roleOrUser);
  return resolvedRole ? ROLE_DASHBOARD_VARIANT[resolvedRole] : null;
}
