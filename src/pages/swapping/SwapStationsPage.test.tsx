import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SwapStationsPage } from '@/pages/swapping/SwapStationsPage'
import { useSwapSessions, useSwapStations } from '@/core/hooks/useSwapping'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/useSwapping', () => ({
  useSwapStations: vi.fn(),
  useSwapSessions: vi.fn(),
}))

describe('SwapStationsPage', () => {
  const mockedUseSwapStations = vi.mocked(useSwapStations)
  const mockedUseSwapSessions = vi.mocked(useSwapSessions)

  it('renders operations KPIs and derived alerts from swap station/session data', () => {
    mockedUseSwapStations.mockReturnValue({
      data: [
        {
          id: 'swap-st-1',
          name: 'Westlands Swap Annex',
          address: 'Westlands Avenue',
          city: 'Nairobi',
          country: 'Kenya',
          lat: -1.26,
          lng: 36.8,
          status: 'Online',
          serviceMode: 'Hybrid',
          cabinetCount: 1,
          readyPacks: 5,
          chargingPacks: 8,
          avgSwapDurationLabel: '3m 40s',
        },
        {
          id: 'swap-st-2',
          name: 'Airport East Battery Exchange',
          address: 'Cargo Terminal Road',
          city: 'Nairobi',
          country: 'Kenya',
          lat: -1.31,
          lng: 36.9,
          status: 'Degraded',
          serviceMode: 'Swapping',
          cabinetCount: 2,
          readyPacks: 11,
          chargingPacks: 3,
          avgSwapDurationLabel: '2m 55s',
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSwapStations>)

    mockedUseSwapSessions.mockReturnValue({
      data: [
        {
          id: 'BSS-001',
          stationName: 'Westlands Swap Annex',
          cabinetId: 'cab-1',
          riderLabel: 'Rider 1',
          outgoingPackId: 'PK-1',
          returnedPackId: 'PK-2',
          initiatedAt: '2026-03-29 08:00',
          turnaroundLabel: '2m 00s',
          revenue: 'KES 300',
          status: 'Completed',
          healthCheck: 'Passed',
        },
        {
          id: 'BSS-002',
          stationName: 'Westlands Swap Annex',
          cabinetId: 'cab-1',
          riderLabel: 'Rider 2',
          outgoingPackId: 'PK-3',
          returnedPackId: 'PK-4',
          initiatedAt: '2026-03-29 08:10',
          turnaroundLabel: '4m 00s',
          revenue: 'KES 320',
          status: 'Completed',
          healthCheck: 'Passed',
        },
        {
          id: 'BSS-003',
          stationName: 'Airport East Battery Exchange',
          cabinetId: 'cab-2',
          riderLabel: 'Rider 3',
          outgoingPackId: 'PK-5',
          returnedPackId: 'PK-6',
          initiatedAt: '2026-03-29 08:20',
          turnaroundLabel: '5m 00s',
          revenue: 'KES 350',
          status: 'Completed',
          healthCheck: 'Review',
        },
        {
          id: 'BSS-004',
          stationName: 'Airport East Battery Exchange',
          cabinetId: 'cab-2',
          riderLabel: 'Rider 4',
          outgoingPackId: 'PK-7',
          returnedPackId: 'PK-8',
          initiatedAt: '2026-03-29 08:30',
          turnaroundLabel: '7m 00s',
          revenue: 'KES 360',
          status: 'Flagged',
          healthCheck: 'Failed',
        },
        {
          id: 'BSS-005',
          stationName: 'Airport East Battery Exchange',
          cabinetId: 'cab-2',
          riderLabel: 'Rider 5',
          outgoingPackId: 'PK-9',
          returnedPackId: 'PK-10',
          initiatedAt: '2026-03-29 08:35',
          turnaroundLabel: '3m 00s',
          revenue: 'KES 300',
          status: 'In Progress',
          healthCheck: 'Review',
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSwapSessions>)

    render(
      <MemoryRouter>
        <SwapStationsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Swap Success (24h)')).toBeInTheDocument()
    expect(screen.getByText('75.0%')).toBeInTheDocument()
    expect(screen.getByText('Failed Swaps (24h)')).toBeInTheDocument()
    expect(screen.getByText('Operational Alerts')).toBeInTheDocument()
    expect(screen.getByText('Ready pack reserve is low (5 packs).')).toBeInTheDocument()
    expect(screen.getByText('Station health is degraded and requires attention.')).toBeInTheDocument()
  })
})
