import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/core/hooks/useTenant', () => ({
  useTenant: vi.fn(),
}))

describe('SettingsPage', () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedUseTenant = vi.mocked(useTenant)

  beforeEach(() => {
    vi.useFakeTimers()

    mockedUseAuthStore.mockReturnValue({
        user: {
          id: 'usr-1',
          name: 'Station Manager',
          email: 'stationmanager@evzone.io',
          role: 'STATION_MANAGER',
          status: 'Active',
          organizationId: 'org-evzone-ke',
          assignedStationIds: ['st-1', 'st-2', 'st-3'],
          createdAt: '2026-01-01 09:00',
          mfaEnabled: true,
        },
      } as unknown as ReturnType<typeof useAuthStore>)

    mockedUseTenant.mockReturnValue({
      activeTenant: {
        id: 'tenant-evzone-ke',
        code: 'EVZKE',
        slug: 'evzone-ke',
        name: 'EVzone Kenya',
        description: 'Kenya operating company',
        scope: 'organization',
        scopeLabel: 'Operating Company',
        region: 'Kenya',
        timeZone: 'Africa/Nairobi',
        currency: 'KES',
        siteCount: 12,
        stationCount: 38,
        chargePointCount: 124,
      },
      availableTenants: [
        {
          id: 'tenant-evzone-ke',
          code: 'EVZKE',
          slug: 'evzone-ke',
          name: 'EVzone Kenya',
          description: 'Kenya operating company',
          scope: 'organization',
          scopeLabel: 'Operating Company',
          region: 'Kenya',
          timeZone: 'Africa/Nairobi',
          currency: 'KES',
          siteCount: 12,
          stationCount: 38,
          chargePointCount: 124,
        },
      ],
      dataScopeLabel: 'Operating company scope for EVzone Kenya public infrastructure.',
      activeTenantId: 'tenant-evzone-ke',
      dashboardMode: 'operations',
      canSwitchTenants: true,
      setActiveTenantId: vi.fn(),
      isLoading: false,
      isReady: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders premium settings sections and save flow', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile & Identity')).toBeInTheDocument()
    expect(screen.getByText('Security & Access')).toBeInTheDocument()
    expect(screen.getByText('Notification Controls')).toBeInTheDocument()
    expect(screen.getByText('Tenant Scope')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All changes saved' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Ops Controller' } })

    const saveButton = screen.getByRole('button', { name: 'Save changes' })
    expect(saveButton).toBeEnabled()

    fireEvent.click(saveButton)
    expect(screen.getByRole('button', { name: 'Saving changes...' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(screen.getByRole('button', { name: 'All changes saved' })).toBeDisabled()
  })
})
