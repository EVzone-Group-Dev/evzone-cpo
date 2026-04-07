import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChargePointDetailPage } from '@/pages/charge-points/ChargePointDetailPage'
import {
  useChargePoint,
  useChargePointPublication,
  useConfirmChargePointIdentity,
  useSessions,
  useSetChargePointPublication,
} from '@/core/hooks/usePlatformData'

const mockConfirmIdentity = vi.fn()
const mockSetPublication = vi.fn()

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
  useChargePointPublication: vi.fn(),
  useSetChargePointPublication: vi.fn(),
  useConfirmChargePointIdentity: vi.fn(),
}))

vi.mock('@/core/auth/access', () => ({
  canAccessPolicy: vi.fn(() => true),
  getTemporaryAccessState: vi.fn(() => 'none'),
}))

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { user: object }) => unknown) =>
    selector({ user: { id: 'user-1', role: 'SUPER_ADMIN' } }),
  ),
}))

function buildChargePoint(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'cp-1',
    stationId: 'st-1',
    stationName: 'Westlands Hub',
    connectorType: 'CCS2',
    connectorTypes: ['CCS2'],
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
    roamingPublished: false,
    remoteCommands: ['Soft Reset'],
    unitHealth: {
      ocppConnection: 'Connected',
      lastHeartbeat: '12s ago',
      errorCode: 'NoError',
    },
    ...overrides,
  }
}

describe('ChargePointDetailPage setup onboarding', () => {
  const mockedUseChargePoint = vi.mocked(useChargePoint)
  const mockedUseSessions = vi.mocked(useSessions)
  const mockedUseChargePointPublication = vi.mocked(useChargePointPublication)
  const mockedUseSetChargePointPublication = vi.mocked(useSetChargePointPublication)
  const mockedUseConfirmChargePointIdentity = vi.mocked(useConfirmChargePointIdentity)

  function renderPage(initialState?: Record<string, unknown>) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: '/charge-points/cp-1', state: initialState }]}>
          <Routes>
            <Route path="/charge-points/:id" element={<ChargePointDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('shows waiting-for-boot setup state with continue-later action', () => {
    mockedUseChargePoint.mockReturnValue({
      data: buildChargePoint({ bootNotificationAt: null, identityConfirmedAt: null }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePoint>)
    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)
    mockedUseChargePointPublication.mockReturnValue({
      data: { chargePointId: 'cp-1', published: false, updatedAt: null },
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePointPublication>)
    mockedUseSetChargePointPublication.mockReturnValue({
      mutateAsync: mockSetPublication,
      isPending: false,
    } as unknown as ReturnType<typeof useSetChargePointPublication>)
    mockedUseConfirmChargePointIdentity.mockReturnValue({
      mutateAsync: mockConfirmIdentity,
      isPending: false,
    } as unknown as ReturnType<typeof useConfirmChargePointIdentity>)

    renderPage({
      setupCredentials: {
        username: 'EVZ-WL-001',
        password: 'one-time',
      },
      setupStartedAt: new Date().toISOString(),
    })

    expect(screen.getByText('Setup Progress')).toBeInTheDocument()
    expect(screen.getByText('Provisioned Credentials')).toBeInTheDocument()
    expect(screen.getByText('Waiting for first BootNotification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue Later' })).toBeInTheDocument()
  })

  it('confirms identity from editable setup form after boot notification', async () => {
    mockConfirmIdentity.mockReset()
    mockConfirmIdentity.mockResolvedValue({})

    mockedUseChargePoint.mockReturnValue({
      data: buildChargePoint({ bootNotificationAt: '2026-04-07T09:00:00.000Z', identityConfirmedAt: null }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePoint>)
    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)
    mockedUseChargePointPublication.mockReturnValue({
      data: { chargePointId: 'cp-1', published: false, updatedAt: null },
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePointPublication>)
    mockedUseSetChargePointPublication.mockReturnValue({
      mutateAsync: mockSetPublication,
      isPending: false,
    } as unknown as ReturnType<typeof useSetChargePointPublication>)
    mockedUseConfirmChargePointIdentity.mockReturnValue({
      mutateAsync: mockConfirmIdentity,
      isPending: false,
    } as unknown as ReturnType<typeof useConfirmChargePointIdentity>)

    renderPage()

    const modelInput = screen.getByPlaceholderText('e.g. ABB Terra 184')
    const manufacturerInput = screen.getByPlaceholderText('e.g. ABB')
    const firmwareInput = screen.getByPlaceholderText('e.g. 1.4.2')

    fireEvent.change(modelInput, { target: { value: 'ABB Terra 124' } })
    fireEvent.change(manufacturerInput, { target: { value: 'ABB' } })
    fireEvent.change(firmwareInput, { target: { value: '2.0.0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Identity' }))

    await waitFor(() => {
      expect(mockConfirmIdentity).toHaveBeenCalledWith({
        model: 'ABB Terra 124',
        manufacturer: 'ABB',
        firmwareVersion: '2.0.0',
      })
    })
  })

  it('persists publication state through backend mutation instead of local-only toggle', async () => {
    mockSetPublication.mockReset()
    mockSetPublication.mockResolvedValue({ chargePointId: 'cp-1', published: true, updatedAt: '2026-04-07T10:00:00.000Z' })

    mockedUseChargePoint.mockReturnValue({
      data: buildChargePoint({
        bootNotificationAt: '2026-04-07T09:00:00.000Z',
        identityConfirmedAt: '2026-04-07T09:10:00.000Z',
        roamingPublished: false,
      }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePoint>)
    mockedUseSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)
    mockedUseChargePointPublication.mockReturnValue({
      data: { chargePointId: 'cp-1', published: false, updatedAt: null },
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useChargePointPublication>)
    mockedUseSetChargePointPublication.mockReturnValue({
      mutateAsync: mockSetPublication,
      isPending: false,
    } as unknown as ReturnType<typeof useSetChargePointPublication>)
    mockedUseConfirmChargePointIdentity.mockReturnValue({
      mutateAsync: mockConfirmIdentity,
      isPending: false,
    } as unknown as ReturnType<typeof useConfirmChargePointIdentity>)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Enable Roaming' }))

    await waitFor(() => {
      expect(mockSetPublication).toHaveBeenCalledWith(true)
    })
  })
})
