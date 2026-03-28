import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/router/guards'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { CPOUser, CPORole } from '@/core/types/domain'

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
            element={<RequireAuth allowedRoles={['FINANCE']}><div>Finance Billing</div></RequireAuth>}
          />
          <Route path={PATHS.DASHBOARD_OPERATOR} element={<div>Operator Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Operator Dashboard Home')).toBeInTheDocument()
    expect(screen.queryByText('Finance Billing')).not.toBeInTheDocument()
  })
})
