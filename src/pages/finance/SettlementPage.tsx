import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSettlement } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
} as const

const SETTLEMENT_STATUS_CLASS = {
  Ready: 'pending',
  Reconciling: 'active',
  Settled: 'online',
} as const

export function SettlementPage() {
  const { data, isLoading, error } = useSettlement()

  if (isLoading) {
    return <DashboardLayout pageTitle="Settlement"><div className="p-8 text-center text-subtle">Loading settlement workspace...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Settlement"><div className="p-8 text-center text-danger">Unable to load settlement data.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Settlement">
      <div className="kpi-row mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-6">
        <div className="card">
          <div className="section-title">Settlement Cycles</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Partner</th>
                  <th>Period</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record) => (
                  <tr key={record.id}>
                    <td className="font-mono text-xs">{record.id}</td>
                    <td>{record.partner}</td>
                    <td>{record.period}</td>
                    <td className="font-bold">{record.netAmount}</td>
                    <td><span className={`pill ${SETTLEMENT_STATUS_CLASS[record.status]}`}>{record.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Exceptions</div>
          <div className="space-y-3">
            {data.exceptions.map((exception) => (
              <div key={exception.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-mono text-[10px]">{exception.id}</span>
                  <span className="pill faulted">Action Needed</span>
                </div>
                <div className="text-sm font-semibold">{exception.partner}</div>
                <div className="text-xs text-subtle">{exception.reason}</div>
                <div className="text-xs mt-2"><span className="text-subtle">Impact:</span> {exception.impact}</div>
                <div className="text-xs"><span className="text-subtle">Next Step:</span> {exception.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Settlement Notes</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}

