import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StationDetailPage } from '@/pages/stations/StationDetailPage'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'
import type { AuthState } from '@/core/auth/authStore'
import { useSessions } from '@/core/hooks/usePlatformData'
import { useStation, useStationUptime } from '@/core/hooks/useStations'

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
  useStationUptime: vi.fn(),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useSessions: vi.fn(),
}))

describe('StationDetailPage', () => {
  const mockedCanManageStations = vi.mocked(canManageStations)
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedUseSessions = vi.mocked(useSessions)
  const mockedUseStation = vi.mocked(useStation)
  const mockedUseStationUptime = vi.mocked(useStationUptime)

  function renderPage() {
    render(
      <MemoryRouter initialEntries={['/stations/st-101']}>
        <Routes>
          <Route path="/stations/:id" element={<StationDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  function createAuthState(user: AuthState['user']): AuthState {
    return {
      activeTenantId: null,
      user,
      token: null,
      refreshToken: null,
      isAuthenticated: !!user,
      isLoading: false,
      setUser: vi.fn(),
      replaceUser: vi.fn(),
      setTokens: vi.fn(),
      setActiveTenantId: vi.fn(),
      logout: vi.fn(),
      setLoading: vi.fn(),
    }
  }

  it('renders backend-backed charge point telemetry and station-scoped management links', () => {
    mockedCanManageStations.mockReturnValue(true)
    mockedUseAuthStore.mockImplementation((selector) => selector(createAuthState({ role: 'STATION_MANAGER' } as never)))
    mockedUseStation.mockReturnValue({
      data: {
        id: 'st-101',
        name: 'City Mall Roof',
        serviceMode: 'Charging',
        status: 'Online',
        address: 'Plot 7 Jinja Rd',
        city: 'Kampala',
        country: 'Uganda',
        capacity: 180,
        lat: 0.3476,
        lng: 32.5825,
        chargePoints: [
          {
            id: 'cp-1',
            ocppId: 'EVZ-CMR-001',
            model: 'ABB Terra 184',
            manufacturer: 'ABB',
            firmwareVersion: '1.4.2',
            ocppVersion: '2.0.1',
            type: 'CCS2',
            maxPowerKw: 90,
            status: 'Available',
            lastHeartbeatAt: '2026-04-07T09:58:00.000Z',
            lastHeartbeatLabel: '2m ago',
          },
          {
            id: 'cp-2',
            ocppId: 'EVZ-CMR-002',
            model: 'ABB Terra 184',
            manufacturer: 'ABB',
            firmwareVersion: '1.4.2',
            ocppVersion: '2.0.1',
            type: 'CCS2',
            maxPowerKw: 90,
            status: 'Charging',
            lastHeartbeatAt: '2026-04-07T09:59:00.000Z',
            lastHeartbeatLabel: '1m ago',
          },
        ],
        uptimePercent30d: 'N/A',
        dailyAverageKwh: 'N/A',
        geofenceStatus: '0.3476, 32.5825',
        networkLatency: {
          averageLabel: 'N/A',
          modeLabel: 'N/A',
          points: [],
        },
        recentEvents: [],
        systemIntegrity: {
          firmwareVersion: 'N/A',
          ocppVersion: 'N/A',
          slaCompliance: 'N/A',
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStation>)
    mockedUseStationUptime.mockReturnValue({
      data: {
        uptimePercent: 98.4,
        downtimePercent: 1.6,
        uptimeLabel: '98.4%',
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStationUptime>)
    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)

    renderPage()

    expect(screen.getByRole('heading', { name: 'City Mall Roof' })).toBeInTheDocument()
    expect(screen.getByText(/Kampala/)).toBeInTheDocument()
    expect(screen.getAllByText('1.4.2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2.0.1').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Add Charge Point' })[0]).toHaveAttribute('href', '/charge-points/new?stationId=st-101&returnTo=station-detail')
    expect(screen.getByRole('link', { name: 'Manage Charge Points' })).toHaveAttribute('href', '/charge-points?stationId=st-101')
    expect(screen.getAllByRole('link', { name: 'Manage' })[0]).toHaveAttribute('href', '/charge-points/cp-1')
    expect(screen.getByTestId('station-map')).toBeInTheDocument()
  })

  it('renders safe fallback messaging when the station has no charge points yet', () => {
    mockedCanManageStations.mockReturnValue(false)
    mockedUseAuthStore.mockImplementation((selector) => selector(createAuthState(null)))
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
        uptimePercent30d: 'N/A',
        dailyAverageKwh: 'N/A',
        geofenceStatus: 'N/A',
        networkLatency: {
          averageLabel: 'N/A',
          modeLabel: 'N/A',
          points: [],
        },
        recentEvents: [],
        systemIntegrity: {
          firmwareVersion: 'N/A',
          ocppVersion: 'N/A',
          slaCompliance: 'N/A',
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStation>)
    mockedUseStationUptime.mockReturnValue({
      data: {
        uptimePercent: null,
        downtimePercent: null,
        uptimeLabel: 'N/A',
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStationUptime>)
    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)

    renderPage()

    expect(screen.getAllByText('Reported per charge point only').length).toBe(2)
    expect(screen.getByText(/No charging assets are configured for this site/i)).toBeInTheDocument()
    expect(screen.getByText(/No recent station telemetry has been reported by the backend yet/i)).toBeInTheDocument()
    expect(screen.getByTestId('station-map')).toBeInTheDocument()
  })
})
