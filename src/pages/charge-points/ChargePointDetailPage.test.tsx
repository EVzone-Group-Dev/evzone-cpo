import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChargePointDetailPage } from '@/pages/charge-points/ChargePointDetailPage'
import { useChargePoint, useSessions } from '@/core/hooks/usePlatformData'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useChargePoint: vi.fn(),
  useSessions: vi.fn(),
}))

describe('ChargePointDetailPage', () => {
  const mockedUseChargePoint = vi.mocked(useChargePoint)
  const mockedUseSessions = vi.mocked(useSessions)

  function renderPage() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/charge-points/cp-1']}>
          <Routes>
            <Route path="/charge-points/:id" element={<ChargePointDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('shows back link to charge points list', () => {
    mockedUseChargePoint.mockReturnValue({
      data: {
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
        remoteCommands: ['Soft Reset'],
        unitHealth: {
          ocppConnection: 'Connected',
          lastHeartbeat: '12s ago',
          errorCode: 'NoError',
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useChargePoint>)

    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)

    renderPage()

    expect(screen.getByRole('link', { name: 'Back to Charge Points' })).toHaveAttribute('href', '/charge-points')
  })

  it('renders top 5 recent sessions with connector-type filtering and fallback cp matching', () => {
    mockedUseChargePoint.mockReturnValue({
      data: {
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
        remoteCommands: ['Soft Reset'],
        unitHealth: {
          ocppConnection: 'Connected',
          lastHeartbeat: '12s ago',
          errorCode: 'NoError',
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useChargePoint>)

    mockedUseSessions.mockReturnValue({
      data: [
        { id: 'SES-101', chargePointId: 'cp-1', connectorType: 'DC Fast', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 10:00', ended: null, energy: '10.0 kWh', amount: 'KES 600', status: 'Active', method: 'App', emsp: '-' },
        { id: 'SES-102', chargePointId: 'cp-1', connectorType: 'AC Type 2', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 09:50', ended: '2026-03-29 10:10', energy: '8.0 kWh', amount: 'KES 420', status: 'Completed', method: 'RFID', emsp: '-' },
        { id: 'SES-103', chargePointId: 'cp-1', connectorType: 'DC Fast', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 09:40', ended: '2026-03-29 09:55', energy: '6.0 kWh', amount: 'KES 350', status: 'Completed', method: 'App', emsp: '-' },
        { id: 'SES-104', chargePointId: 'cp-1', connectorType: 'DC Fast', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 09:30', ended: '2026-03-29 09:45', energy: '5.0 kWh', amount: 'KES 300', status: 'Completed', method: 'App', emsp: '-' },
        { id: 'SES-105', chargePointId: 'cp-1', connectorType: 'AC Type 2', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 09:20', ended: '2026-03-29 09:30', energy: '4.0 kWh', amount: 'KES 240', status: 'Completed', method: 'App', emsp: '-' },
        { id: 'SES-106', chargePointId: 'cp-1', connectorType: 'DC Fast', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 09:10', ended: '2026-03-29 09:18', energy: '3.0 kWh', amount: 'KES 180', status: 'Completed', method: 'App', emsp: '-' },
        { id: 'SES-FALLBACK', chargePointId: 'cp-unknown', connectorType: 'AC Type 2', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2026-03-29 10:05', ended: null, energy: '11.0 kWh', amount: 'KES 660', status: 'Active', method: 'App', emsp: '-' },
        { id: 'SES-OTHER', chargePointId: 'cp-2', connectorType: 'DC Fast', station: 'Westlands Hub', cp: 'EVZ-WL-002', started: '2026-03-29 10:20', ended: null, energy: '13.0 kWh', amount: 'KES 780', status: 'Active', method: 'App', emsp: '-' },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)

    renderPage()
    const recentSessionsTable = screen.getByRole('table')

    expect(screen.getByText('SES-FALLBACK')).toBeInTheDocument()
    expect(within(recentSessionsTable).getByText('SES-101')).toBeInTheDocument()
    expect(screen.getByText('SES-102')).toBeInTheDocument()
    expect(screen.getByText('SES-103')).toBeInTheDocument()
    expect(screen.getByText('SES-104')).toBeInTheDocument()
    expect(screen.queryByText('SES-105')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'AC Type 2' } })

    expect(screen.getByText('SES-FALLBACK')).toBeInTheDocument()
    expect(screen.getByText('SES-102')).toBeInTheDocument()
    expect(within(recentSessionsTable).queryByText('SES-101')).not.toBeInTheDocument()
  })
})
