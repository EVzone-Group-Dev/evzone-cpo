import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SwapStationDetailPage } from '@/pages/swapping/SwapStationDetailPage'
import {
  useInspectSwapPack,
  useRetireSwapPack,
  useSwapStation,
  useTransitionSwapPack,
} from '@/core/hooks/useSwapping'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/components/common/MapComponent', () => ({
  MapComponent: () => <div>Map</div>,
}))

vi.mock('@/core/hooks/useSwapping', () => ({
  PACK_STATUS_FLOW: {
    Ready: ['Charging', 'Reserved', 'Installed', 'Quarantined'],
    Charging: ['Ready', 'Reserved', 'Quarantined'],
    Reserved: ['Ready', 'Installed', 'Quarantined'],
    Installed: ['Ready', 'Charging', 'Quarantined'],
    Quarantined: ['Ready', 'Charging', 'Reserved', 'Retired'],
    Retired: [],
  },
  useSwapStation: vi.fn(),
  useTransitionSwapPack: vi.fn(),
  useInspectSwapPack: vi.fn(),
  useRetireSwapPack: vi.fn(),
}))

describe('SwapStationDetailPage', () => {
  const mockedUseSwapStation = vi.mocked(useSwapStation)
  const mockedUseTransitionSwapPack = vi.mocked(useTransitionSwapPack)
  const mockedUseInspectSwapPack = vi.mocked(useInspectSwapPack)
  const mockedUseRetireSwapPack = vi.mocked(useRetireSwapPack)

  it('renders retirement policy and pack timeline, then triggers retirement approval', async () => {
    const transitionMutate = vi.fn().mockResolvedValue({ message: 'ok' })
    const inspectMutate = vi.fn().mockResolvedValue({ message: 'ok' })
    const retirementMutate = vi.fn().mockResolvedValue({ message: 'Pack PK-1 retired successfully.' })

    mockedUseTransitionSwapPack.mockReturnValue({
      mutateAsync: transitionMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useTransitionSwapPack>)

    mockedUseInspectSwapPack.mockReturnValue({
      mutateAsync: inspectMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useInspectSwapPack>)

    mockedUseRetireSwapPack.mockReturnValue({
      mutateAsync: retirementMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useRetireSwapPack>)

    mockedUseSwapStation.mockReturnValue({
      data: {
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
        readyPacks: 2,
        chargingPacks: 1,
        avgSwapDurationLabel: '3m 00s',
        gridBufferLabel: 'Grid cap active',
        alerts: [{ level: 'Info', message: 'All good' }],
        cabinets: [{
          id: 'cab-1',
          model: 'Rack',
          status: 'Online',
          slotCount: 16,
          availableChargedPacks: 2,
          chargingPacks: 1,
          reservedPacks: 0,
          lastHeartbeatLabel: '10s ago',
        }],
        packs: [{
          id: 'PK-1',
          chemistry: 'LFP',
          cycleCount: 332,
          healthLabel: '87% SoH',
          status: 'Quarantined',
          socLabel: '41% SoC',
          slotLabel: 'Inspection Bay',
          stationName: 'Westlands Swap Annex',
          lastSeenLabel: '2m ago',
          inspectionStatus: 'Failed',
          inspectionNote: 'Thermal anomaly',
          retirementAssessment: {
            action: 'Retire',
            cycleThresholdBreached: true,
            sohThresholdBreached: true,
            evaluatedAtLabel: 'just now',
            reason: 'Retirement recommended due threshold breach.',
          },
          timeline: [
            { id: 'evt-1', type: 'Retirement', summary: 'Retirement recommendation issued.', timeLabel: '5m ago' },
            { id: 'evt-2', type: 'Inspection', summary: 'Inspection recorded as Failed.', timeLabel: '6m ago' },
            { id: 'evt-3', type: 'Swap', summary: 'BSS-200 completed (3m 22s).', timeLabel: '2026-03-29 09:10' },
          ],
        }],
        recentSwaps: [{
          id: 'SWP-1',
          riderLabel: 'Rider 01',
          returnedPackId: 'PK-1',
          durationLabel: '3m 22s',
          status: 'Completed',
          timeLabel: '5m ago',
        }],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSwapStation>)

    render(
      <MemoryRouter initialEntries={['/swap-stations/swap-st-1']}>
        <Routes>
          <Route path="/swap-stations/:id" element={<SwapStationDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Retirement Policy')).toBeInTheDocument()
    expect(screen.getByText('Retirement recommendation issued.')).toBeInTheDocument()
    expect(screen.getByText('Pack Timeline')).toBeInTheDocument()
    expect(screen.getByText('BSS-200 completed (3m 22s).')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Approve Retirement' }))

    await waitFor(() => {
      expect(retirementMutate).toHaveBeenCalledWith({
        packId: 'PK-1',
        action: 'ApproveRetirement',
        note: undefined,
      })
    })
  })
})
