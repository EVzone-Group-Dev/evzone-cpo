import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBilling, useSettlement } from '@/core/hooks/usePlatformData'
import { DollarSign, FileWarning, ShieldCheck } from 'lucide-react'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

export function FinanceDashboard() {
  const { data: billing, isLoading: billingLoading, error: billingError } = useBilling()
  const { data: settlement, isLoading: settlementLoading, error: settlementError } = useSettlement()

  if (billingLoading || settlementLoading) {
    return <DashboardLayout pageTitle="Finance Command"><div className="p-8 text-center text-subtle">Loading finance dashboard...</div></DashboardLayout>
  }

  if (billingError || settlementError || !billing || !settlement) {
    return <DashboardLayout pageTitle="Finance Command"><div className="p-8 text-center text-danger">Unable to load finance dashboard.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Finance Command">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {billing.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="card">
          <div className="section-title"><DollarSign size={16} className="text-accent" />Invoice Queue</div>
          <div className="table-wrap mt-4">
            <table className="table">
              <thead>
                <tr><th>Invoice</th><th>Customer</th><th>Scope</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {billing.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-mono text-xs">{invoice.id}</td>
                    <td>{invoice.customer}</td>
                    <td className="text-xs text-subtle">{invoice.scope}</td>
                    <td className="font-bold">{invoice.amount}</td>
                    <td><span className={`pill ${invoice.status === 'Paid' ? 'online' : invoice.status === 'Overdue' ? 'faulted' : invoice.status === 'Issued' ? 'active' : 'pending'}`}>{invoice.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="section-title"><ShieldCheck size={16} className="text-ok" />Settlement Cycle</div>
            <div className="space-y-3 mt-4">
              {settlement.records.map((record) => (
                <div key={record.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{record.partner}</div>
                      <div className="text-[11px] text-subtle">{record.period}</div>
                    </div>
                    <span className={`pill ${record.status === 'Settled' ? 'online' : record.status === 'Reconciling' ? 'degraded' : 'pending'}`}>{record.status}</span>
                  </div>
                  <div className="text-lg font-bold mt-2">{record.netAmount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><FileWarning size={16} className="text-warning" />Exceptions</div>
            <div className="space-y-3 mt-4">
              {settlement.exceptions.map((exception) => (
                <div key={exception.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-sm font-semibold">{exception.partner}</div>
                  <div className="text-[11px] text-subtle mt-1">{exception.reason}</div>
                  <div className="text-[11px] mt-2 text-warning">{exception.impact}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-subtle mt-4">{settlement.note}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
