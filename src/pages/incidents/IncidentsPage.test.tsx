import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { IncidentsPage } from '@/pages/incidents/IncidentsPage'
import { useIncidentCommand } from '@/core/hooks/usePlatformData'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useIncidentCommand: vi.fn(),
}))

describe('IncidentsPage', () => {
  const mockedUseIncidentCommand = vi.mocked(useIncidentCommand)

  it('toggles search and filters and applies them to active tickets', () => {
    mockedUseIncidentCommand.mockReturnValue({
      data: {
        stats: [
          { id: 'open', label: 'Open Incidents', tone: 'danger', value: '2' },
          { id: 'response', label: 'Avg Response', tone: 'default', value: '16m' },
          { id: 'dispatched', label: 'Dispatched', tone: 'ok', value: '1' },
          { id: 'sla', label: 'SLA Compliance', tone: 'ok', value: '96%' },
        ],
        incidents: [
          {
            id: 'INC-2041',
            stationId: 'st-1',
            stationName: 'Westlands Hub',
            type: 'Communication Loss',
            severity: 'Major',
            status: 'Dispatched',
            reportedAt: '20m ago',
            assignedTech: 'David Karanja',
            situationAudit: 'Sensors detected intermittent packet loss at Westlands Hub.',
            serviceLog: [
              { title: 'Technician Assigned', note: 'Assigning David K. to the ticket.', active: true },
              { title: 'Ticket Created', note: 'Automated alert triggered by telemetry loss.', active: false },
            ],
          },
          {
            id: 'INC-2042',
            stationId: 'st-2',
            stationName: 'CBD Charging Station',
            type: 'Hardware Failure',
            severity: 'Critical',
            status: 'Open',
            reportedAt: '5m ago',
            situationAudit: 'Grid voltage dropped below threshold and station relay failed to recover.',
            serviceLog: [
              { title: 'Awaiting Dispatch', note: 'No technician has accepted the task yet.', active: true },
              { title: 'Ticket Created', note: 'Automated alert triggered by grid instability.', active: false },
            ],
          },
        ],
        predictiveAlert: {
          text: 'Cells in sector C indicate thermal oscillation patterns; pre-emptive inspection advised.',
          cta: 'Run Fleet Scan',
        },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useIncidentCommand>)

    render(<IncidentsPage />)

    expect(screen.getByText('Communication Loss')).toBeInTheDocument()
    expect(screen.getByText('Hardware Failure')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle search' }))
    fireEvent.change(screen.getByLabelText('Search incidents'), { target: { value: 'INC-2042' } })

    expect(screen.getByText('Hardware Failure')).toBeInTheDocument()
    expect(screen.queryByText('Communication Loss')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search incidents'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Toggle filters' }))
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Dispatched' } })
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'Critical' } })

    expect(screen.getByText('No incidents match the current search/filter criteria.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))

    expect(screen.getByText('Communication Loss')).toBeInTheDocument()
    expect(screen.getByText('Hardware Failure')).toBeInTheDocument()
  }, 15000)
})
