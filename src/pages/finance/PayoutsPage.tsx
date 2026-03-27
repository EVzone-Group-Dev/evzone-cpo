import { DashboardLayout } from '@/components/layout/DashboardLayout'

const PAYOUTS = [
  { id: 'PAY-1', period: 'Mar 1–15, 2025', amount: 'KES 2,108,400', fee: 'KES 210,840', net: 'KES 1,897,560', status: 'Completed', sessions: 1420 },
  { id: 'PAY-2', period: 'Mar 16–31, 2025', amount: 'KES 2,175,800', fee: 'KES 217,580', net: 'KES 1,958,220', status: 'Processing', sessions: 1505 },
]

export function PayoutsPage() {
  return (
    <DashboardLayout pageTitle="Payouts">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Payout ID</th><th>Period</th><th>Sessions</th><th>Revenue</th><th>Fee</th><th>Net</th><th>Status</th></tr></thead>
          <tbody>
            {PAYOUTS.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.id}</td>
                <td>{p.period}</td>
                <td>{p.sessions}</td>
                <td>{p.amount}</td>
                <td>{p.fee}</td>
                <td className="font-bold">{p.net}</td>
                <td><span className={`pill ${p.status === 'Completed' ? 'online' : 'pending'}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
