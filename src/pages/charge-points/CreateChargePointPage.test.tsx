import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CreateChargePointPage } from '@/pages/charge-points/CreateChargePointPage'
import { useCreateChargePoint } from '@/core/hooks/usePlatformData'
import { useStations } from '@/core/hooks/useStations'

const mockNavigate = vi.fn()
const mockMutateAsync = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useCreateChargePoint: vi.fn(),
}))

vi.mock('@/core/hooks/useStations', () => ({
  useStations: vi.fn(),
}))

describe('CreateChargePointPage', () => {
  const mockedUseCreateChargePoint = vi.mocked(useCreateChargePoint)
  const mockedUseStations = vi.mocked(useStations)

  beforeEach(() => {
    mockNavigate.mockReset()
    mockMutateAsync.mockReset()
    mockMutateAsync.mockResolvedValue({})

    mockedUseStations.mockReturnValue({
      data: [
        {
          id: 'st-101',
          name: 'City Mall Roof',
          address: 'Plot 7 Jinja Rd',
          city: 'Kampala',
          country: 'Uganda',
          lat: 0.3476,
          lng: 32.5825,
          capacity: 180,
          status: 'Online',
          serviceMode: 'Charging',
          chargePoints: [],
          networkLatency: {
            averageLabel: 'just now',
            modeLabel: 'Derived from charge point heartbeats',
            points: [100, 100, 95, 90, 85, 80],
          },
        },
        {
          id: 'st-102',
          name: 'Tech Park A',
          address: 'Block 4',
          city: 'Kampala',
          country: 'Uganda',
          lat: 0.063,
          lng: 32.4631,
          capacity: 100,
          status: 'Degraded',
          serviceMode: 'Charging',
          chargePoints: [],
          networkLatency: {
            averageLabel: '30s ago',
            modeLabel: 'Derived from charge point heartbeats',
            points: [75, 70, 65, 60, 55, 50],
          },
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStations>)

    mockedUseCreateChargePoint.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateChargePoint>)
  })

  function renderPage(initialEntry = '/charge-points/new?stationId=st-101&returnTo=station-detail') {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <CreateChargePointPage />
      </MemoryRouter>,
    )
  }

  it('prefills the station from the route and submits the backend-aligned charge point payload', async () => {
    renderPage()

    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('st-101')

    fireEvent.change(screen.getByPlaceholderText('e.g. ABB Terra 184, Wallbox Pulsar'), { target: { value: 'ABB Terra 184' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. ABB, Wallbox, Siemens'), { target: { value: 'ABB' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. EVZ-CP-001, STATION-01-01'), { target: { value: 'EVZ-CMR-003' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1.4.2, 2.1.0'), { target: { value: '1.4.2' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Charge Point/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        stationId: 'st-101',
        model: 'ABB Terra 184',
        manufacturer: 'ABB',
        firmwareVersion: '1.4.2',
        ocppId: 'EVZ-CMR-003',
        ocppVersion: '1.6',
        power: 50,
        type: 'CCS2',
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/stations/st-101')
    })
  })
})
