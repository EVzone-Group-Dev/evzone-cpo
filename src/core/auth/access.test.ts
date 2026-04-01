import { describe, expect, it } from 'vitest'
import { canAccessPolicy, getRoleHomePath } from '@/core/auth/access'
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
      organizationId: null,
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
            organizationId: 'org-1',
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
          canonicalRole: 'EXTERNAL_PROVIDER_ADMIN',
          roleFamily: 'provider',
          permissions: ['ocpi.partners.read'],
          scope: {
            type: 'provider',
            organizationId: null,
            stationId: null,
            stationIds: [],
            providerId: 'provider-1',
            isTemporary: false,
          },
        }),
      }),
    ).toBe(PATHS.OCPI_PARTNERS)
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
})
