import { DashboardLayout } from '@/components/layout/DashboardLayout'



const INCIDENTS = [
  { id: 'INC-044', station: 'Westlands Hub', cp: 'EVZ-WL-003', severity: 'High', title: 'Connector 1 stuck in charging state', assignee: 'John Kamau', status: 'Open', created: '2025-03-27 07:32', slaBreach: false },
  { id: 'INC-043', station: 'CBD Station', cp: 'EVZ-CBD-001', severity: 'Medium', title: 'Heartbeat timeout — 7 minutes', assignee: 'Unassigned', status: 'Acknowledged', created: '2025-03-27 08:15', slaBreach: false },
  { id: 'INC-042', station: 'Airport East', cp: 'EVZ-AP-002', severity: 'Low', title: 'Firmware v2.7.0 update pending', assignee: 'Tech Team', status: 'Open', created: '2025-03-26 14:00', slaBreach: false },
  { id: 'INC-041', station: 'Garden City', cp: 'EVZ-GC-001', severity: 'Critical', title: 'Station fully offline — grid fault', assignee: 'Grace Otieno', status: 'In-Progress', created: '2025-03-27 05:00', slaBreach: true },
]

const SEV_CLASS: Record<string, string> = { Critical: 'faulted', High: 'offline', Medium: 'degraded', Low: 'pending' }
const STS_CLASS: Record<string, string> = { Open: 'offline', Acknowledged: 'pending', 'In-Progress': 'degraded', Resolved: 'online', Closed: 'online' }

export function IncidentsPage() {
  return (
    <DashboardLayout pageTitle="Incidents">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>ID</th><th>Station / CP</th><th>Severity</th><th>Title</th><th>Assignee</th><th>Status</th><th>Created</th><th>SLA</th></tr></thead>
          <tbody>
            {INCIDENTS.map(inc => (
              <tr key={inc.id}>
                <td className="font-mono text-xs">{inc.id}</td>
                <td><div className="text-xs font-semibold">{inc.station}</div><div className="text-[11px] text-subtle">{inc.cp}</div></td>
                <td><span className={`pill ${SEV_CLASS[inc.severity] ?? 'pending'}`}>{inc.severity}</span></td>
                <td className="text-sm max-w-xs"><div className="truncate">{inc.title}</div></td>
                <td className="text-xs">{inc.assignee}</td>
                <td><span className={`pill ${STS_CLASS[inc.status] ?? 'pending'}`}>{inc.status}</span></td>
                <td className="text-xs">{inc.created}</td>
                <td>{inc.slaBreach && <span className="pill faulted">Breach</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
