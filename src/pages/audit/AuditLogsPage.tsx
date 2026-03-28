import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuditLogs } from '@/core/hooks/usePlatformData'

export function AuditLogsPage() {
  const { data: logs, isLoading, error } = useAuditLogs()

  if (isLoading) {
    return <DashboardLayout pageTitle="Audit Logs"><div className="p-8 text-center text-subtle">Loading audit trail...</div></DashboardLayout>
  }

  if (error || !logs) {
    return <DashboardLayout pageTitle="Audit Logs"><div className="p-8 text-center text-danger">Unable to load audit trail.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Audit Logs">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Timestamp</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={`${log.actor}-${log.ts}-${log.action}`}>
                <td className="text-xs">{log.actor}</td>
                <td><span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{log.action}</span></td>
                <td className="text-xs">{log.target}</td>
                <td className="text-xs">{log.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
