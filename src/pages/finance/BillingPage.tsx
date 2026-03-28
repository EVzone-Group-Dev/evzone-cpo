import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBilling } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

const INVOICE_STATUS_CLASS = {
  Draft: 'pending',
  Issued: 'active',
  Paid: 'online',
  Overdue: 'faulted',
} as const

export function BillingPage() {
  const { data, isLoading, error } = useBilling()

  if (isLoading) {
    return <DashboardLayout pageTitle="Billing"><div className="p-8 text-center text-subtle">Loading billing workspace...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Billing"><div className="p-8 text-center text-danger">Unable to load billing workspace.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Billing">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-6 mb-6">
        <div className="card">
          <div className="section-title">Invoice Queue</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Scope</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-mono text-xs">{invoice.id}</td>
                    <td>{invoice.customer}</td>
                    <td className="text-xs text-subtle">{invoice.scope}</td>
                    <td className="font-bold">{invoice.amount}</td>
                    <td>{invoice.dueDate}</td>
                    <td><span className={`pill ${INVOICE_STATUS_CLASS[invoice.status]}`}>{invoice.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Receivables Aging</div>
          <div className="space-y-3">
            {data.aging.map((bucket) => (
              <div key={bucket.label} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="text-[11px] text-subtle uppercase tracking-wide">{bucket.label}</div>
                <div className="text-lg font-bold">{bucket.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Finance Notes</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}
