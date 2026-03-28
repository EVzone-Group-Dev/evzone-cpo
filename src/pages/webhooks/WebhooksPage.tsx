import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useWebhooksModule } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

const ENDPOINT_STATUS_CLASS = {
  Healthy: 'online',
  Retrying: 'degraded',
  Muted: 'pending',
} as const

const DELIVERY_STATUS_CLASS = {
  Delivered: 'online',
  Retried: 'degraded',
  Failed: 'faulted',
} as const

export function WebhooksPage() {
  const { data, isLoading, error } = useWebhooksModule()

  if (isLoading) {
    return <DashboardLayout pageTitle="Webhooks"><div className="p-8 text-center text-subtle">Loading webhook control plane...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Webhooks"><div className="p-8 text-center text-danger">Unable to load webhook control plane.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Webhooks">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 mb-6">
        <div className="card">
          <div className="section-title">Endpoint Health</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Events</th>
                  <th>Last Delivery</th>
                  <th>Signing</th>
                  <th>Success</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.endpoints.map((endpoint) => (
                  <tr key={endpoint.id}>
                    <td>
                      <div className="font-mono text-[11px] break-all">{endpoint.target}</div>
                    </td>
                    <td>{endpoint.eventGroup}</td>
                    <td>{endpoint.lastDelivery}</td>
                    <td className="text-xs text-subtle">{endpoint.signingStatus}</td>
                    <td className="font-bold">{endpoint.successRate}</td>
                    <td><span className={`pill ${ENDPOINT_STATUS_CLASS[endpoint.status]}`}>{endpoint.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Recent Deliveries</div>
          <div className="space-y-3">
            {data.recentDeliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-sm font-semibold">{delivery.event}</div>
                  <span className={`pill ${DELIVERY_STATUS_CLASS[delivery.result]}`}>{delivery.result}</span>
                </div>
                <div className="text-xs text-subtle">{delivery.endpoint}</div>
                <div className="text-xs mt-2"><span className="text-subtle">Latency:</span> {delivery.latency}</div>
                <div className="text-xs"><span className="text-subtle">Time:</span> {delivery.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Webhook Notes</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}
