import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/router/guards'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { AccessProfile, CPOUser, CPORole } from '@/core/types/domain'

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}))

function buildUser(role: CPORole): CPOUser {
  return {
    id: `user-${role.toLowerCase()}`,
    name: `${role} User`,
    email: `${role.toLowerCase()}@evzone.io`,
    role,
    status: 'Active',
    mfaEnabled: true,
    createdAt: '2026-03-29T00:00:00.000Z',
  }
}

describe('RequireAuth', () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore)

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

  function mockAuthState(state: { isAuthenticated: boolean; user: CPOUser | null }) {
    mockedUseAuthStore.mockImplementation(((selector: (store: { isAuthenticated: boolean; user: CPOUser | null }) => unknown) => (
      selector(state)
    )) as typeof useAuthStore)
  }

  beforeEach(() => {
    mockAuthState({
      isAuthenticated: false,
      user: null,
    })
  })

  it('redirects a forbidden role to its role-specific dashboard home', async () => {
    mockAuthState({
      isAuthenticated: true,
      user: buildUser('OPERATOR'),
    })

    render(
      <MemoryRouter initialEntries={[PATHS.BILLING]}>
        <Routes>
          <Route
            path={PATHS.BILLING}
            element={<RequireAuth policy="billingRead"><div>Finance Billing</div></RequireAuth>}
          />
          <Route path={PATHS.DASHBOARD_OPERATOR} element={<div>Operator Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Operator Dashboard Home')).toBeInTheDocument()
    expect(screen.queryByText('Finance Billing')).not.toBeInTheDocument()
  })

  it('allows permission-based access even when the fallback role would not match', async () => {
    mockAuthState({
      isAuthenticated: true,
      user: {
        ...buildUser('OPERATOR'),
        accessProfile: buildAccessProfile({
          legacyRole: 'STATION_ADMIN',
          canonicalRole: 'TENANT_ADMIN',
          roleFamily: 'tenant',
          permissions: ['finance.billing.read'],
          scope: {
            type: 'tenant',
            tenantId: 'org-1',
            stationId: null,
            stationIds: [],
            providerId: null,
            isTemporary: false,
          },
        }),
      },
    })

    render(
      <MemoryRouter initialEntries={[PATHS.BILLING]}>
        <Routes>
          <Route
            path={PATHS.BILLING}
            element={<RequireAuth policy="billingRead"><div>Finance Billing</div></RequireAuth>}
          />
          <Route path={PATHS.DASHBOARD_OPERATOR} element={<div>Operator Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Finance Billing')).toBeInTheDocument()
    expect(screen.queryByText('Operator Dashboard Home')).not.toBeInTheDocument()
  })

  it('shows an expiry notice when temporary station access has ended', async () => {
    mockAuthState({
      isAuthenticated: true,
      user: {
        ...buildUser('TECHNICIAN'),
        activeStationContext: {
          assignmentId: 'assignment-1',
          stationId: 'st-1',
          stationName: 'Kampala Yard',
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
      },
    })

    vi.setSystemTime(new Date('2026-04-01T09:30:00.000Z'))

    render(
      <MemoryRouter initialEntries={[PATHS.DASHBOARD_TECHNICIAN]}>
        <Routes>
          <Route
            path={PATHS.DASHBOARD_TECHNICIAN}
            element={<RequireAuth policy="dashboardTechnician"><div>Technician Dashboard</div></RequireAuth>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Temporary station access expired')).toBeInTheDocument()
    expect(screen.queryByText('Technician Dashboard')).not.toBeInTheDocument()
  })

  it('redirects provider-scoped users away from infrastructure pages toward roaming home', async () => {
    mockAuthState({
      isAuthenticated: true,
      user: {
        ...buildUser('CPO_ADMIN'),
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
    })

    render(
      <MemoryRouter initialEntries={[PATHS.CHARGE_POINTS]}>
        <Routes>
          <Route
            path={PATHS.CHARGE_POINTS}
            element={<RequireAuth policy="chargePointsRead"><div>Charge Points</div></RequireAuth>}
          />
          <Route path={PATHS.OCPI_PARTNERS} element={<div>Provider Roaming Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Provider Roaming Home')).toBeInTheDocument()
    expect(screen.queryByText('Charge Points')).not.toBeInTheDocument()
  })

  it('redirects platform sessions without impersonation away from tenant-only routes', async () => {
    mockAuthState({
      isAuthenticated: true,
      user: {
        ...buildUser('SUPER_ADMIN'),
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
    })

    render(
      <MemoryRouter initialEntries={[PATHS.STATIONS]}>
        <Routes>
          <Route
            path={PATHS.STATIONS}
            element={<RequireAuth policy="stationsRead"><div>Stations</div></RequireAuth>}
          />
          <Route path={PATHS.DASHBOARD_SUPER_ADMIN} element={<div>Super Admin Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Super Admin Home')).toBeInTheDocument()
    expect(screen.queryByText('Stations')).not.toBeInTheDocument()
  })
})
