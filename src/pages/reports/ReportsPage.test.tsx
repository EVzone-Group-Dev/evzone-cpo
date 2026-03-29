import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { useReports } from '@/core/hooks/usePlatformData'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useReports: vi.fn(),
}))

describe('ReportsPage', () => {
  const mockedUseReports = vi.mocked(useReports)

  it('filters recent exports when the filter button is toggled', () => {
    mockedUseReports.mockReturnValue({
      data: {
        templates: [
          { id: 'revenue-summary', label: 'Revenue Summary' },
          { id: 'uptime-sla', label: 'Uptime SLA' },
        ],
        periods: ['March 2026', 'February 2026'],
        scheduledEmails: [{ label: 'Weekly Executive Summary', enabled: true }],
        recentExports: [
          { name: 'Revenue_MAR_26.csv', type: 'Financial', size: '2.4 MB', time: '10m ago' },
          { name: 'Ops_Uptime_Week12.pdf', type: 'Operations', size: '1.2 MB', time: '2h ago' },
        ],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReports>)

    render(<ReportsPage />)

    expect(screen.getByText('Revenue_MAR_26.csv')).toBeInTheDocument()
    expect(screen.getByText('Ops_Uptime_Week12.pdf')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle export filters' }))
    fireEvent.change(screen.getByLabelText('Export Type'), { target: { value: 'Operations' } })

    expect(screen.getByText('Ops_Uptime_Week12.pdf')).toBeInTheDocument()
    expect(screen.queryByText('Revenue_MAR_26.csv')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Time Window'), { target: { value: 'Last 30m' } })
    expect(screen.getByText('No exports match the current filters.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(screen.getByText('Revenue_MAR_26.csv')).toBeInTheDocument()
    expect(screen.getByText('Ops_Uptime_Week12.pdf')).toBeInTheDocument()
  })
})

