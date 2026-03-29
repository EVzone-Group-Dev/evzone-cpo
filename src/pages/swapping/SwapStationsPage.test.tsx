import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SwapStationsPage } from '@/pages/swapping/SwapStationsPage'
import {
  useBatteryInventory,
  useSwapDispatchAction,
  useSwapRebalancing,
  useSwapSessions,
  useSwapStations,
} from '@/core/hooks/useSwapping'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/useSwapping', () => ({
  useBatteryInventory: vi.fn(),
  useSwapDispatchAction: vi.fn(),
  useSwapRebalancing: vi.fn(),
  useSwapStations: vi.fn(),
  useSwapSessions: vi.fn(),
}))

describe('SwapStationsPage', () => {
  const mockedUseBatteryInventory = vi.mocked(useBatteryInventory)
  const mockedUseSwapDispatchAction = vi.mocked(useSwapDispatchAction)
  const mockedUseSwapRebalancing = vi.mocked(useSwapRebalancing)
  const mockedUseSwapStations = vi.mocked(useSwapStations)
  const mockedUseSwapSessions = vi.mocked(useSwapSessions)

  it('renders operations KPIs, economics, and rebalancing dispatch workflow', async () => {
    const mutateDispatch = vi.fn().mockResolvedValue({ message: 'Dispatch approved for 3 packs.' })

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

    mockedUseBatteryInventory.mockReturnValue({
      data: {
        balancingNote: 'Balanced',
        metrics: [
          { id: 'ready', label: 'Ready', value: '10', tone: 'ok' },
          { id: 'charging', label: 'Charging', value: '10', tone: 'warning' },
          { id: 'reserved', label: 'Reserved', value: '0', tone: 'default' },
          { id: 'quarantined', label: 'Quarantined', value: '0', tone: 'danger' },
        ],
        packs: [
          { id: 'PK-001', stationName: 'Westlands Swap Annex', status: 'Ready', chemistry: 'LFP', socLabel: '80%', healthLabel: '95%', cycleCount: 110, slotLabel: 'Cab 1 / Slot 1', lastSeenLabel: '1m ago' },
          { id: 'PK-002', stationName: 'Westlands Swap Annex', status: 'Charging', chemistry: 'LFP', socLabel: '63%', healthLabel: '94%', cycleCount: 120, slotLabel: 'Cab 1 / Slot 2', lastSeenLabel: '1m ago' },
          { id: 'PK-003', stationName: 'Westlands Swap Annex', status: 'Ready', chemistry: 'LFP', socLabel: '88%', healthLabel: '97%', cycleCount: 108, slotLabel: 'Cab 1 / Slot 3', lastSeenLabel: '2m ago' },
          { id: 'PK-004', stationName: 'Westlands Swap Annex', status: 'Charging', chemistry: 'LFP', socLabel: '41%', healthLabel: '90%', cycleCount: 130, slotLabel: 'Cab 1 / Slot 4', lastSeenLabel: '2m ago' },
          { id: 'PK-005', stationName: 'Westlands Swap Annex', status: 'Ready', chemistry: 'LFP', socLabel: '91%', healthLabel: '98%', cycleCount: 95, slotLabel: 'Cab 1 / Slot 5', lastSeenLabel: '3m ago' },
          { id: 'PK-006', stationName: 'Westlands Swap Annex', status: 'Charging', chemistry: 'LFP', socLabel: '53%', healthLabel: '92%', cycleCount: 140, slotLabel: 'Cab 1 / Slot 6', lastSeenLabel: '4m ago' },
          { id: 'PK-007', stationName: 'Westlands Swap Annex', status: 'Ready', chemistry: 'LFP', socLabel: '79%', healthLabel: '93%', cycleCount: 150, slotLabel: 'Cab 1 / Slot 7', lastSeenLabel: '5m ago' },
          { id: 'PK-008', stationName: 'Westlands Swap Annex', status: 'Ready', chemistry: 'LFP', socLabel: '84%', healthLabel: '95%', cycleCount: 111, slotLabel: 'Cab 1 / Slot 8', lastSeenLabel: '6m ago' },
          { id: 'PK-009', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '76%', healthLabel: '91%', cycleCount: 160, slotLabel: 'Cab 2 / Slot 1', lastSeenLabel: '1m ago' },
          { id: 'PK-010', stationName: 'Airport East Battery Exchange', status: 'Charging', chemistry: 'LFP', socLabel: '52%', healthLabel: '89%', cycleCount: 170, slotLabel: 'Cab 2 / Slot 2', lastSeenLabel: '2m ago' },
          { id: 'PK-011', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '82%', healthLabel: '90%', cycleCount: 180, slotLabel: 'Cab 2 / Slot 3', lastSeenLabel: '3m ago' },
          { id: 'PK-012', stationName: 'Airport East Battery Exchange', status: 'Charging', chemistry: 'LFP', socLabel: '44%', healthLabel: '88%', cycleCount: 190, slotLabel: 'Cab 2 / Slot 4', lastSeenLabel: '4m ago' },
          { id: 'PK-013', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '86%', healthLabel: '92%', cycleCount: 155, slotLabel: 'Cab 2 / Slot 5', lastSeenLabel: '5m ago' },
          { id: 'PK-014', stationName: 'Airport East Battery Exchange', status: 'Charging', chemistry: 'LFP', socLabel: '48%', healthLabel: '87%', cycleCount: 200, slotLabel: 'Cab 2 / Slot 6', lastSeenLabel: '6m ago' },
          { id: 'PK-015', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '81%', healthLabel: '89%', cycleCount: 175, slotLabel: 'Cab 2 / Slot 7', lastSeenLabel: '7m ago' },
          { id: 'PK-016', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '93%', healthLabel: '94%', cycleCount: 145, slotLabel: 'Cab 2 / Slot 8', lastSeenLabel: '8m ago' },
          { id: 'PK-017', stationName: 'Airport East Battery Exchange', status: 'Charging', chemistry: 'LFP', socLabel: '37%', healthLabel: '86%', cycleCount: 210, slotLabel: 'Cab 2 / Slot 9', lastSeenLabel: '9m ago' },
          { id: 'PK-018', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '77%', healthLabel: '88%', cycleCount: 185, slotLabel: 'Cab 2 / Slot 10', lastSeenLabel: '10m ago' },
          { id: 'PK-019', stationName: 'Airport East Battery Exchange', status: 'Charging', chemistry: 'LFP', socLabel: '42%', healthLabel: '85%', cycleCount: 220, slotLabel: 'Cab 2 / Slot 11', lastSeenLabel: '11m ago' },
          { id: 'PK-020', stationName: 'Airport East Battery Exchange', status: 'Ready', chemistry: 'LFP', socLabel: '90%', healthLabel: '93%', cycleCount: 135, slotLabel: 'Cab 2 / Slot 12', lastSeenLabel: '12m ago' },
        ],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useBatteryInventory>)

    mockedUseSwapRebalancing.mockReturnValue({
      data: {
        generatedAtLabel: 'just now',
        recommendations: [
          {
            id: 'RB-swap-st-2-swap-st-1',
            fromStationId: 'swap-st-2',
            fromStationName: 'Airport East Battery Exchange',
            toStationId: 'swap-st-1',
            toStationName: 'Westlands Swap Annex',
            packsSuggested: 3,
            confidencePercent: 84,
            etaImpactLabel: '+4.2h runway at destination',
            demandTrendLabel: 'Rising',
            priority: 'High',
            reason: 'Ready-pack gap 3 vs reserve floor 8; source surplus 6.',
            sourceSurplusScore: 68,
            targetDeficitScore: 57,
            status: 'Proposed',
          },
        ],
        dispatches: [
          {
            id: 'DSP-001',
            recommendationId: 'RB-swap-st-2-swap-st-3',
            fromStationName: 'Airport East Battery Exchange',
            toStationName: 'Global Logistics Swap Yard',
            packs: 2,
            confidencePercent: 88,
            etaImpactLabel: '+3.0h runway at destination',
            status: 'Completed',
            history: [
              { status: 'Proposed', timeLabel: '2026-03-28 09:10', actorLabel: 'Rebalancing Engine', note: 'Deficit detected at logistics yard.' },
              { status: 'Completed', timeLabel: '2026-03-28 10:15', actorLabel: 'Station Operator', note: 'Packs landed and verified.' },
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSwapRebalancing>)

    mockedUseSwapDispatchAction.mockReturnValue({
      mutateAsync: mutateDispatch,
      isPending: false,
    } as unknown as ReturnType<typeof useSwapDispatchAction>)

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
    expect(screen.getByText('Swap Economics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Revenue / Station / Day')).toBeInTheDocument()
    expect(screen.getByText('KES 485')).toBeInTheDocument()
    expect(screen.getAllByText('Yield / Pack / Day')).toHaveLength(2)
    expect(screen.getByText('KES 48.5')).toBeInTheDocument()
    expect(screen.getByText('Station-Level Performance')).toBeInTheDocument()
    expect(screen.getByText('KES 620')).toBeInTheDocument()
    expect(screen.getByText('KES 77.5')).toBeInTheDocument()
    expect(screen.getByText('Rebalancing Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Dispatch Workflow')).toBeInTheDocument()
    expect(screen.getAllByText('Airport East Battery Exchange').length).toBeGreaterThan(0)
    expect(screen.getByText('to Westlands Swap Annex')).toBeInTheDocument()
    expect(screen.getByText('84%')).toBeInTheDocument()
    expect(screen.getByText('DSP-001 · Airport East Battery Exchange to Global Logistics Swap Yard')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(mutateDispatch).toHaveBeenCalledWith({
        recommendationId: 'RB-swap-st-2-swap-st-1',
        action: 'Approve',
        note: undefined,
      })
    })
  })
})
