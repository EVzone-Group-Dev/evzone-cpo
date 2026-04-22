import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useIntegrationsModule } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

const INTEGRATION_STATUS_CLASS = {
  Connected: 'online',
  Degraded: 'degraded',
  Pending: 'pending',
} as const

export function IntegrationsPage() {
  const { data, isLoading, error } = useIntegrationsModule()

  if (isLoading) {
    return <DashboardLayout pageTitle="Integrations"><div className="p-8 text-center text-subtle">Loading integration registry...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Integrations"><div className="p-8 text-center text-danger">Unable to load integration registry.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Integrations">
      <div className="kpi-row mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="section-title">Connection Registry</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Integration</th>
                <th>Category</th>
                <th>Auth</th>
                <th>Last Sync</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.connections.map((connection) => (
                <tr key={connection.id}>
                  <td>
                    <div className="font-semibold">{connection.name}</div>
                    <div className="text-[11px] text-subtle font-mono">{connection.id}</div>
                  </td>
                  <td>{connection.category}</td>
                  <td className="text-xs text-subtle">{connection.authMode}</td>
                  <td>{connection.lastSync}</td>
                  <td>{connection.latency}</td>
                  <td><span className={`pill ${INTEGRATION_STATUS_CLASS[connection.status]}`}>{connection.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Integration Notes</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}

