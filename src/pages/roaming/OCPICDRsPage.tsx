import { DashboardLayout } from '@/components/layout/DashboardLayout'

const CDRS = [
  { id: 'CDR-001', session: 'SES-003', emsp: 'ChargeNow', start: '2025-03-27 06:00', end: '2025-03-27 07:30', energy: '50.0 kWh', cost: 'KES 3,000', status: 'Acknowledged' },
  { id: 'CDR-002', session: 'SES-001', emsp: 'EVgo Roaming', start: '2025-03-27 08:14', end: '2025-03-27 09:02', energy: '22.4 kWh', cost: 'KES 1,344', status: 'Sent' },
  { id: 'CDR-003', session: 'SES-009', emsp: 'GIREVE HUB', start: '2025-03-26 14:00', end: '2025-03-26 15:10', energy: '38.1 kWh', cost: 'KES 2,286', status: 'Sent' },
]

export function OCPICDRsPage() {
  return (
    <DashboardLayout pageTitle="CDR Ledger (Charge Detail Records)">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>CDR ID</th><th>Session</th><th>eMSP Partner</th><th>Start</th><th>End</th><th>Energy</th><th>Cost</th><th>Status</th></tr>
          </thead>
          <tbody>
            {CDRS.map(c => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.id}</td>
                <td className="text-xs">{c.session}</td>
                <td className="text-sm">{c.emsp}</td>
                <td className="text-xs">{c.start}</td>
                <td className="text-xs">{c.end}</td>
                <td>{c.energy}</td>
                <td className="font-medium">{c.cost}</td>
                <td><span className={`pill ${c.status === 'Acknowledged' ? 'online' : 'pending'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
