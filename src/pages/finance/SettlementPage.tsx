import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSettlement } from '@/core/hooks/usePlatformData'

const SETTLEMENT_STATUS_CLASS = {
  Ready: 'pending',
  Reconciling: 'active',
  Settled: 'online',
} as const

export function SettlementPage() {
  const { data, isLoading, error } = useSettlement()

  if (isLoading) {
    return <DashboardLayout pageTitle="Settlement"><div className="p-8 text-center text-subtle">Loading settlement cycles...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Settlement"><div className="p-8 text-center text-danger">Unable to load settlement data.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Settlement">
      <div className="table-wrap mb-4">
        <table className="table">
          <thead><tr><th>Cycle</th><th>Partner</th><th>Period</th><th>Net Amount</th><th>Status</th></tr></thead>
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
      <p className="text-muted text-sm">{data.note}</p>
    </DashboardLayout>
  )
}
