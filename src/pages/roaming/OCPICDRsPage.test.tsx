import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OCPICDRsPage } from '@/pages/roaming/OCPICDRsPage'
import {
  useOCPICdrs,
  useRoamingPartnerObservability,
  useRoamingPartners,
} from '@/core/hooks/usePlatformData'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useOCPICdrs: vi.fn(),
  useRoamingPartners: vi.fn(),
  useRoamingPartnerObservability: vi.fn(),
}))

describe('OCPICDRsPage', () => {
  const mockedUseOCPICdrs = vi.mocked(useOCPICdrs)
  const mockedUseRoamingPartners = vi.mocked(useRoamingPartners)
  const mockedUseRoamingPartnerObservability = vi.mocked(useRoamingPartnerObservability)

  it('applies status/country/partner filters from the filter toolbar', () => {
    mockedUseRoamingPartners.mockReturnValue({
      data: [
        {
          id: 'p1',
          name: 'Plugsurfing BV',
          type: 'EMSP',
          status: 'Connected',
          country: 'NL',
          partyId: 'PLG',
          lastSync: '2026-03-28 14:20',
          version: '2.2.1',
        },
        {
          id: 'p2',
          name: 'Hubject GmbH',
          type: 'HUB',
          status: 'Connected',
          country: 'DE',
          partyId: 'HBJ',
          lastSync: '2026-03-28 15:45',
          version: '2.2.1',
        },
      ],
    } as unknown as ReturnType<typeof useRoamingPartners>)

    mockedUseRoamingPartnerObservability.mockReturnValue({
      data: {
        metrics: [],
        note: 'Partner observability ready.',
        partners: [
          {
            id: 'p1',
            deliveryStatus: 'Healthy',
            eventCoverage: ['CDRs'],
            lastEventAt: '2m ago',
            lastPartnerActivity: '3m ago',
            retryQueueDepth: 0,
            successRate: '99.4%',
            totalEvents24h: 128,
            callbackFailures24h: 0,
          },
          {
            id: 'p2',
            deliveryStatus: 'Retrying',
            eventCoverage: ['CDRs'],
            lastEventAt: '4m ago',
            lastPartnerActivity: '5m ago',
            retryQueueDepth: 2,
            successRate: '96.8%',
            totalEvents24h: 84,
            callbackFailures24h: 1,
          },
        ],
      },
    } as unknown as ReturnType<typeof useRoamingPartnerObservability>)

    mockedUseOCPICdrs.mockReturnValue({
      data: {
        metrics: [
          { id: 'total', label: 'Total CDRs', value: '2', tone: 'default' },
          { id: 'awaiting', label: 'Awaiting Settlement', value: '1', tone: 'warning' },
          { id: 'revenue', label: 'Total Revenue', value: 'KES 1,786', tone: 'default' },
          { id: 'error-rate', label: 'Error Rate', value: '0.4%', tone: 'ok' },
        ],
        records: [
          {
            id: 'CDR-29481',
            sessionId: 'SES-9120',
            emspName: 'Plugsurfing',
            partnerId: 'p1',
            partyId: 'PLG',
            country: 'NL',
            start: '2026-03-28 10:15',
            end: '2026-03-28 11:20',
            kwh: 42.5,
            totalCost: '1,240.00',
            currency: 'KES',
            status: 'Settled',
          },
          {
            id: 'CDR-29482',
            sessionId: 'SES-9125',
            emspName: 'Hubject',
            partnerId: 'p2',
            partyId: 'HBJ',
            country: 'DE',
            start: '2026-03-28 14:02',
            end: '2026-03-28 14:45',
            kwh: 18.2,
            totalCost: '546.00',
            currency: 'KES',
            status: 'Accepted',
          },
        ],
        automation: { text: 'CDRs are shared automatically.', cta: 'Review Rules' },
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useOCPICdrs>)

    render(<OCPICDRsPage />)

    expect(screen.getByText('CDR-29481')).toBeInTheDocument()
    expect(screen.getByText('CDR-29482')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle CDR filters' }))
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Settled' } })

    expect(screen.getByText('CDR-29481')).toBeInTheDocument()
    expect(screen.queryByText('CDR-29482')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'DE' } })
    expect(screen.getByText('No CDR records match the current search/filter criteria.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(screen.getByText('CDR-29481')).toBeInTheDocument()
    expect(screen.getByText('CDR-29482')).toBeInTheDocument()
  })
})
