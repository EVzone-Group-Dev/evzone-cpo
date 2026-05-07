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
    mockMutateAsync.mockResolvedValue({
      id: 'cp-303',
      ocppCredentials: {
        username: 'EVZ-CMR-003',
        password: 'one-time-secret',
        wsUrl: 'wss://ocpp.example.com/ocpp/1.6/EVZ-CMR-003',
      },
    })

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

  it('submits provisioning payload and redirects to setup detail with one-time credentials', async () => {
    renderPage()

    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('st-101')

    fireEvent.change(screen.getByPlaceholderText('e.g. EVZ-CP-001, STATION-01-01'), { target: { value: 'EVZ-CMR-003' } })
    fireEvent.click(screen.getByRole('button', { name: /Provision Charge Point/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        stationId: 'st-101',
        ocppId: 'EVZ-CMR-003',
        ocppVersion: '1.6',
        power: 50,
        type: 'CCS2',
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/charge-points/cp-303', {
        state: expect.objectContaining({
          returnTo: '/stations/st-101',
          setupCredentials: expect.objectContaining({
            username: 'EVZ-CMR-003',
            password: 'one-time-secret',
          }),
          setupStartedAt: expect.any(String),
        }),
      })
    })
  }, 15000)
})
