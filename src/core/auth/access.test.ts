import { describe, expect, it } from 'vitest'
import { getRoleHomePath } from '@/core/auth/access'
import { PATHS } from '@/router/paths'
import type { CPORole } from '@/core/types/domain'

describe('getRoleHomePath', () => {
  it('maps every supported role to a role-specific dashboard route', () => {
    const expectedPaths: Record<CPORole, string> = {
      SUPER_ADMIN: PATHS.DASHBOARD_SUPER_ADMIN,
      CPO_ADMIN: PATHS.DASHBOARD_CPO_ADMIN,
      STATION_MANAGER: PATHS.DASHBOARD_STATION_MANAGER,
      FINANCE: PATHS.DASHBOARD_FINANCE,
      OPERATOR: PATHS.DASHBOARD_OPERATOR,
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
})
