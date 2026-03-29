import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChargePointsPage } from '@/pages/charge-points/ChargePointsPage'
import { useChargePoints } from '@/core/hooks/usePlatformData'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useChargePoints: vi.fn(),
}))

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn(),
  canManageStations: vi.fn(),
}))

describe('ChargePointsPage', () => {
  const mockedUseChargePoints = vi.mocked(useChargePoints)
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedCanManageStations = vi.mocked(canManageStations)

  beforeEach(() => {
    mockedUseChargePoints.mockReturnValue({
      data: [
        {
          id: 'cp-1',
          stationId: 'st-1',
          stationName: 'Westlands Hub',
          connectorType: 'DC Fast',
          model: 'ABB Terra 184',
          manufacturer: 'ABB',
          serialNumber: 'SN-001A',
          firmwareVersion: '1.4.2',
          ocppId: 'EVZ-WL-001',
          ocppVersion: '2.0.1',
          status: 'Online',
          ocppStatus: 'Charging',
          maxCapacityKw: 75,
          lastHeartbeatLabel: '12s ago',
          stale: false,
          roamingPublished: true,
        },
        {
          id: 'cp-2',
          stationId: 'st-1',
          stationName: 'Westlands Hub',
          connectorType: 'DC Fast',
          model: 'ABB Terra 184',
          manufacturer: 'ABB',
          serialNumber: 'SN-001B',
          firmwareVersion: '1.4.2',
          ocppId: 'EVZ-WL-002',
          ocppVersion: '2.0.1',
          status: 'Online',
          ocppStatus: 'Available',
          maxCapacityKw: 75,
          lastHeartbeatLabel: '18s ago',
          stale: false,
          roamingPublished: true,
        },
        {
          id: 'cp-3',
          stationId: 'st-2',
          stationName: 'CBD Charging Station',
          connectorType: 'AC Type 2',
          model: 'Alfen Eve Pro',
          manufacturer: 'Alfen',
          serialNumber: 'SN-002A',
          firmwareVersion: '3.1.0',
          ocppId: 'EVZ-CBD-001',
          ocppVersion: '1.6J',
          status: 'Degraded',
          ocppStatus: 'Faulted',
          maxCapacityKw: 22,
          lastHeartbeatLabel: '7m ago',
          stale: true,
          roamingPublished: false,
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useChargePoints>)
  })

  it('applies combined search, status, station, and roaming filters', () => {
    mockedUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'STATION_MANAGER' } } as never))
    mockedCanManageStations.mockReturnValue(true)

    render(
      <MemoryRouter>
        <ChargePointsPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search by model, OCPP ID, station…'), { target: { value: 'EVZ-WL-001' } })

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Online' } })
    fireEvent.change(selects[1], { target: { value: 'Westlands Hub' } })
    fireEvent.change(selects[2], { target: { value: 'Published' } })

    expect(screen.getByText('EVZ-WL-001')).toBeInTheDocument()
    expect(screen.queryByText('EVZ-WL-002')).not.toBeInTheDocument()
    expect(screen.queryByText('EVZ-CBD-001')).not.toBeInTheDocument()
  })

  it('shows add button for asset managers and keeps model name as details link', () => {
    mockedUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'STATION_MANAGER' } } as never))
    mockedCanManageStations.mockReturnValue(true)

    render(
      <MemoryRouter>
        <ChargePointsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Add Charge Point' })).toHaveAttribute('href', '/charge-points/new')

    const modelLinks = screen.getAllByRole('link', { name: 'ABB Terra 184' })
    expect(modelLinks[0]).toHaveAttribute('href', '/charge-points/cp-1')
  })

  it('hides add button when the role cannot manage assets', () => {
    mockedUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'OPERATOR' } } as never))
    mockedCanManageStations.mockReturnValue(false)

    render(
      <MemoryRouter>
        <ChargePointsPage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: 'Add Charge Point' })).not.toBeInTheDocument()
  })
})
