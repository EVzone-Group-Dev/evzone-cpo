import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StationDetailPage } from '@/pages/stations/StationDetailPage'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'
import { useStation } from '@/core/hooks/useStations'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/components/common/MapComponent', () => ({
  MapComponent: () => <div data-testid="station-map" />,
}))

vi.mock('@/core/auth/authStore', () => ({
  canManageStations: vi.fn(),
  useAuthStore: vi.fn(),
}))

vi.mock('@/core/hooks/useStations', () => ({
  useStation: vi.fn(),
}))

describe('StationDetailPage', () => {
  const mockedCanManageStations = vi.mocked(canManageStations)
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedUseStation = vi.mocked(useStation)

  function renderPage() {
    render(
      <MemoryRouter initialEntries={['/stations/st-101']}>
        <Routes>
          <Route path="/stations/:id" element={<StationDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders fallback telemetry when station detail data is incomplete', () => {
    mockedCanManageStations.mockReturnValue(false)
    mockedUseAuthStore.mockImplementation((selector: (state: { user: null }) => unknown) => selector({ user: null }))
    mockedUseStation.mockReturnValue({
      data: {
        id: 'st-101',
        name: 'CBD Charging Station',
        serviceMode: 'Charging',
        status: 'Online',
        address: 'Kenyatta Avenue',
        city: 'Nairobi',
        country: 'Kenya',
        capacity: 100,
        lat: -1.2863,
        lng: 36.8172,
        chargePoints: [],
        uptimePercent30d: '94.1%',
        dailyAverageKwh: '78 kWh',
        geofenceStatus: 'Monitoring Mode',
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStation>)

    renderPage()

    expect(screen.getByRole('heading', { name: 'CBD Charging Station' })).toBeInTheDocument()
    expect(screen.getByText('Unknown firmware')).toBeInTheDocument()
    expect(screen.getByText('No telemetry')).toBeInTheDocument()
    expect(screen.getByText(/No charging assets are configured for this site/i)).toBeInTheDocument()
    expect(screen.getByTestId('station-map')).toBeInTheDocument()
  })
})
