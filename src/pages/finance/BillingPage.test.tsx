import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BillingPage } from '@/pages/finance/BillingPage'
import { useBilling } from '@/core/hooks/usePlatformData'
import type { BillingResponse } from '@/core/types/mockApi'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/usePlatformData', () => ({
  useBilling: vi.fn(),
}))

describe('BillingPage', () => {
  const mockedUseBilling = vi.mocked(useBilling)

  it('renders invoice and aging data from the billing workspace', () => {
    const billingData: BillingResponse = {
      totalRevenueThisMonth: 'KES 4,284,200',
      note: 'Global billing rollup.',
      metrics: [
        { id: 'revenue', label: 'Revenue', value: 'KES 4,284,200', tone: 'default' },
        { id: 'collection-rate', label: 'Collection Rate', value: '97.8%', tone: 'ok' },
        { id: 'outstanding', label: 'Outstanding', value: 'KES 318,400', tone: 'warning' },
        { id: 'tax', label: 'Tax Exposure', value: 'KES 482,000', tone: 'warning' },
      ],
      invoices: [
        { id: 'INV-24031', customer: 'Hubject Settlement Desk', scope: 'Platform roaming', amount: 'KES 684,220', dueDate: 'Apr 02, 2026', status: 'Issued' },
      ],
      aging: [
        { label: 'Current', value: 'KES 1.9M' },
        { label: '1-30 Days', value: 'KES 274K' },
      ],
    }

    mockedUseBilling.mockReturnValue({
      data: billingData,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useBilling>)

    render(<BillingPage />)

    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByText('Invoice Queue')).toBeInTheDocument()
    expect(screen.getByText('Hubject Settlement Desk')).toBeInTheDocument()
    expect(screen.getByText('KES 1.9M')).toBeInTheDocument()
    expect(screen.getByText('Global billing rollup.')).toBeInTheDocument()
  })
})
