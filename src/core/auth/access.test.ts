import { describe, expect, it } from 'vitest'
import { canAccessPolicy, getRoleHomePath, getTemporaryAccessState, isTemporaryAccessExpired, normalizeAuthenticatedUser } from '@/core/auth/access'
import { PATHS } from '@/router/paths'
import type { AccessProfile, CPORole } from '@/core/types/domain'

function buildAccessProfile(overrides: Partial<AccessProfile> = {}): AccessProfile {
  return {
    version: '2026-04-v1',
    legacyRole: 'SUPER_ADMIN',
    canonicalRole: 'PLATFORM_SUPER_ADMIN',
    roleFamily: 'platform',
    permissions: [],
    scope: {
      type: 'platform',
      tenantId: null,
      stationId: null,
      stationIds: [],
      providerId: null,
      isTemporary: false,
    },
    ...overrides,
  }
}

describe('getRoleHomePath', () => {
  it('maps every supported role to a role-specific dashboard route', () => {
    const expectedPaths: Record<CPORole, string> = {
      SUPER_ADMIN: PATHS.DASHBOARD_SUPER_ADMIN,
      CPO_ADMIN: PATHS.DASHBOARD_CPO_ADMIN,
      STATION_MANAGER: PATHS.DASHBOARD_STATION_MANAGER,
      FINANCE: PATHS.DASHBOARD_FINANCE,
      OPERATOR: PATHS.DASHBOARD_OPERATOR,
      SITE_HOST: PATHS.SITE_DASHBOARD,
      TECHNICIAN: PATHS.DASHBOARD_TECHNICIAN,
    }

    for (const [role, expectedPath] of Object.entries(expectedPaths) as Array<[CPORole, string]>) {
      expect(getRoleHomePath(role)).toBe(expectedPath)
    }
  })

  it('falls back to login when no role is provided', () => {
    expect(getRoleHomePath(undefined)).toBe(PATHS.LOGIN)
    expect(getRoleHomePath(null)).toBe(PATHS.LOGIN)
  })

  it('routes site-scoped canonical users to the site dashboard', () => {
    expect(
      getRoleHomePath({
        role: 'SITE_OWNER',
        accessProfile: buildAccessProfile({
          legacyRole: 'SITE_OWNER',
          canonicalRole: 'SITE_HOST',
          roleFamily: 'tenant',
          permissions: ['finance.revenue_reports.read', 'sites.read'],
          scope: {
            type: 'site',
            tenantId: 'org-1',
            stationId: null,
            stationIds: ['st-1'],
            providerId: null,
            isTemporary: false,
          },
        }),
      }),
    ).toBe(PATHS.SITE_DASHBOARD)
  })

  it('routes provider-only canonical users to OCPI partners', () => {
    expect(
      getRoleHomePath({
        role: 'SWAP_PROVIDER_ADMIN',
        accessProfile: buildAccessProfile({
          legacyRole: 'SWAP_PROVIDER_ADMIN',
          canonicalRole: 'EXTERNAL_PROVIDER_OPERATOR',
          roleFamily: 'provider',
          permissions: ['ocpi.partners.read'],
          scope: {
            type: 'provider',
            tenantId: null,
            stationId: null,
            stationIds: [],
            providerId: 'provider-1',
            isTemporary: false,
          },
        }),
      }),
    ).toBe(PATHS.OCPI_PARTNERS)
  })

  it('routes fleet-scoped users to sessions as the default operational home', () => {
    expect(
      getRoleHomePath({
        role: 'FLEET_DISPATCHER',
        accessProfile: buildAccessProfile({
          legacyRole: 'FLEET_DISPATCHER',
          canonicalRole: 'FLEET_DISPATCHER',
          roleFamily: 'fleet',
          permissions: ['sessions.read'],
          scope: {
            type: 'fleet_group',
            tenantId: 'org-fleet-1',
            stationId: null,
            stationIds: [],
            providerId: null,
            isTemporary: false,
          },
        }),
      }),
    ).toBe(PATHS.SESSIONS)
  })
})

describe('canAccessPolicy', () => {
  it('uses access profile permissions as the source of truth when available', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SUPER_ADMIN',
          accessProfile: buildAccessProfile({
            legacyRole: 'EVZONE_OPERATOR',
            canonicalRole: 'PLATFORM_NOC_LEAD',
            permissions: ['sessions.read', 'incidents.read'],
          }),
        },
        'billingRead',
      ),
    ).toBe(false)
  })

  it('blocks non-operational pages for temporary installer scope even if a permission slips through', () => {
    expect(
      canAccessPolicy(
        {
          role: 'TECHNICIAN',
          accessProfile: buildAccessProfile({
            legacyRole: 'INSTALLER_AGENT',
            canonicalRole: 'INSTALLER_AGENT',
            roleFamily: 'technical',
            permissions: ['finance.billing.read'],
            scope: {
              type: 'temporary',
              tenantId: 'org-1',
              stationId: 'st-1',
              stationIds: ['st-1'],
              providerId: null,
              isTemporary: true,
            },
          }),
        },
        'billingRead',
      ),
    ).toBe(false)
  })

  it('blocks infrastructure pages for provider-scoped users even when a broad permission is present', () => {
    expect(
      canAccessPolicy(
        {
          role: 'CPO_ADMIN',
          accessProfile: buildAccessProfile({
            legacyRole: 'EXTERNAL_PROVIDER_OPERATOR',
            canonicalRole: 'EXTERNAL_PROVIDER_OPERATOR',
            roleFamily: 'provider',
            permissions: ['charge_points.read', 'ocpi.partners.read'],
            scope: {
              type: 'provider',
              tenantId: null,
              stationId: null,
              stationIds: [],
              providerId: 'provider-1',
              isTemporary: false,
            },
          }),
        },
        'chargePointsRead',
      ),
    ).toBe(false)
  })

  it('blocks site-scoped users from tenant infrastructure pages', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SITE_HOST',
          accessProfile: buildAccessProfile({
            legacyRole: 'SITE_HOST',
            canonicalRole: 'SITE_HOST',
            roleFamily: 'tenant',
            permissions: ['stations.read', 'finance.revenue_reports.read'],
            scope: {
              type: 'site',
              tenantId: 'org-site-1',
              stationId: null,
              stationIds: ['st-1'],
              providerId: null,
              isTemporary: false,
            },
          }),
        },
        'stationsRead',
      ),
    ).toBe(false)
  })

  it('allows roaming pages for provider-scoped users', () => {
    expect(
      canAccessPolicy(
        {
          role: 'CPO_ADMIN',
          accessProfile: buildAccessProfile({
            legacyRole: 'EXTERNAL_PROVIDER_OPERATOR',
            canonicalRole: 'EXTERNAL_PROVIDER_OPERATOR',
            roleFamily: 'provider',
            permissions: ['ocpi.partners.read'],
            scope: {
              type: 'provider',
              tenantId: null,
              stationId: null,
              stationIds: [],
              providerId: 'provider-1',
              isTemporary: false,
            },
          }),
        },
        'roamingRead',
      ),
    ).toBe(true)
  })

  it('blocks tenancy context policy for platform sessions without explicit tenant impersonation', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SUPER_ADMIN',
          sessionScopeType: 'platform',
          actingAsTenant: false,
          accessProfile: buildAccessProfile({
            canonicalRole: 'PLATFORM_SUPER_ADMIN',
            scope: {
              type: 'platform',
              tenantId: null,
              stationId: null,
              stationIds: [],
              providerId: null,
              isTemporary: false,
            },
          }),
        },
        'tenancyContext',
      ),
    ).toBe(false)
  })

  it('allows tenancy context policy for platform sessions when acting as tenant', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SUPER_ADMIN',
          sessionScopeType: 'tenant',
          actingAsTenant: true,
          selectedTenantId: 'org-1',
          accessProfile: buildAccessProfile({
            canonicalRole: 'PLATFORM_SUPER_ADMIN',
            scope: {
              type: 'platform',
              tenantId: 'org-1',
              stationId: null,
              stationIds: [],
              providerId: null,
              isTemporary: false,
            },
          }),
        },
        'tenancyContext',
      ),
    ).toBe(true)
  })

  it('blocks tenant-only policies for platform sessions without impersonation', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SUPER_ADMIN',
          sessionScopeType: 'platform',
          actingAsTenant: false,
          accessProfile: buildAccessProfile({
            canonicalRole: 'PLATFORM_SUPER_ADMIN',
            permissions: ['stations.read'],
            scope: {
              type: 'platform',
              tenantId: null,
              stationId: null,
              stationIds: [],
              providerId: null,
              isTemporary: false,
            },
          }),
        },
        'stationsRead',
      ),
    ).toBe(false)
  })

  it('keeps platform-control policies available without tenant impersonation', () => {
    expect(
      canAccessPolicy(
        {
          role: 'SUPER_ADMIN',
          sessionScopeType: 'platform',
          actingAsTenant: false,
          accessProfile: buildAccessProfile({
            canonicalRole: 'PLATFORM_SUPER_ADMIN',
            permissions: ['platform.tenants.read'],
            scope: {
              type: 'platform',
              tenantId: null,
              stationId: null,
              stationIds: [],
              providerId: null,
              isTemporary: false,
            },
          }),
        },
        'dashboardSuperAdmin',
      ),
    ).toBe(true)
  })
})

describe('normalizeAuthenticatedUser', () => {
  it('nulls tenant identifiers for platform sessions without tenant impersonation', () => {
    const normalized = normalizeAuthenticatedUser({
      id: 'u-platform',
      name: 'Platform User',
      email: 'platform@evzone.io',
      role: 'SUPER_ADMIN',
      status: 'Active',
      createdAt: '2026-04-21T10:00:00.000Z',
      tenantId: 'org-leak',
      activeTenantId: 'org-leak',
      orgId: 'org-leak',
      organizationId: 'org-leak',
      sessionScopeType: 'platform',
      actingAsTenant: false,
      accessProfile: buildAccessProfile({
        canonicalRole: 'PLATFORM_SUPER_ADMIN',
        scope: {
          type: 'platform',
          tenantId: null,
          stationId: null,
          stationIds: [],
          providerId: null,
          isTemporary: false,
        },
      }),
    })

    expect(normalized.tenantId).toBeUndefined()
    expect(normalized.activeTenantId).toBeNull()
    expect(normalized.orgId).toBeNull()
    expect(normalized.displayScopeName).toBe('Platform')
  })
})

describe('temporary access helpers', () => {
  it('marks temporary installer access as expired after the station window closes', () => {
    const user = {
      role: 'TECHNICIAN',
      activeStationContext: {
        assignmentId: 'assignment-1',
        stationId: 'st-1',
        stationName: 'Station 1',
        tenantId: 'org-1',
        role: 'INSTALLER_AGENT',
        isPrimary: true,
        shiftStart: '2026-04-01T08:00:00.000Z',
        shiftEnd: '2026-04-01T09:00:00.000Z',
      },
      accessProfile: buildAccessProfile({
        legacyRole: 'INSTALLER_AGENT',
        canonicalRole: 'INSTALLER_AGENT',
        roleFamily: 'technical',
        permissions: ['maintenance.dispatch.read'],
        scope: {
          type: 'temporary',
          tenantId: 'org-1',
          stationId: 'st-1',
          stationIds: ['st-1'],
          providerId: null,
          isTemporary: true,
        },
      }),
    }

    const referenceTime = Date.parse('2026-04-01T09:30:00.000Z')

    expect(getTemporaryAccessState(user, referenceTime)).toBe('expired')
    expect(isTemporaryAccessExpired(user, referenceTime)).toBe(true)
  })
})
