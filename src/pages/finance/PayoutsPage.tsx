import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { usePayouts } from '@/core/hooks/usePlatformData'

export function PayoutsPage() {
  const { data: payouts, isLoading, error } = usePayouts()

  if (isLoading) {
    return <DashboardLayout pageTitle="Payouts"><div className="p-8 text-center text-subtle">Loading payout cycles...</div></DashboardLayout>
  }

  if (error || !payouts) {
    return <DashboardLayout pageTitle="Payouts"><div className="p-8 text-center text-danger">Unable to load payout cycles.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Payouts">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Payout ID</th><th>Period</th><th>Sessions</th><th>Revenue</th><th>Fee</th><th>Net</th><th>Status</th></tr></thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className="font-mono text-xs">{payout.id}</td>
                <td>{payout.period}</td>
                <td>{payout.sessions}</td>
                <td>{payout.amount}</td>
                <td>{payout.fee}</td>
                <td className="font-bold">{payout.net}</td>
                <td><span className={`pill ${payout.status === 'Completed' ? 'online' : 'pending'}`}>{payout.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
