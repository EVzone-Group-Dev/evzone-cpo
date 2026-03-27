import { DashboardLayout } from '@/components/layout/DashboardLayout'

const LOGS = [
  { actor: 'admin@evzone.io', action: 'REMOTE_RESET', target: 'CP EVZ-WL-003', ts: '2025-03-27 09:14' },
  { actor: 'manager@evzone.io', action: 'TARIFF_UPDATED', target: 'Night Smart Rate', ts: '2025-03-27 08:50' },
  { actor: 'System', action: 'OCPI_SYNC', target: 'ChargeNow — 4 CDRs sent', ts: '2025-03-27 09:00' },
  { actor: 'grace@evzone.io', action: 'INCIDENT_RESOLVED', target: 'INC-041 Garden City', ts: '2025-03-27 08:00' },
]

export function AuditLogsPage() {
  return (
    <DashboardLayout pageTitle="Audit Logs">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Timestamp</th></tr></thead>
          <tbody>
            {LOGS.map((l, i) => (
              <tr key={i}>
                <td className="text-xs">{l.actor}</td>
                <td><span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{l.action}</span></td>
                <td className="text-xs">{l.target}</td>
                <td className="text-xs">{l.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
