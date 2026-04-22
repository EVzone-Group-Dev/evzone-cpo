import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useNotificationsModule } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

const CHANNEL_STATUS_CLASS = {
  Active: 'online',
  Fallback: 'degraded',
  Paused: 'pending',
} as const

const DISPATCH_STATUS_CLASS = {
  Delivered: 'online',
  Queued: 'pending',
  Escalated: 'degraded',
} as const

export function NotificationsPage() {
  const { data, isLoading, error } = useNotificationsModule()

  if (isLoading) {
    return <DashboardLayout pageTitle="Notifications"><div className="p-8 text-center text-subtle">Loading notification control plane...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Notifications"><div className="p-8 text-center text-danger">Unable to load notification control plane.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Notifications">
      <div className="kpi-row mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 mb-6">
        <div className="card">
          <div className="section-title">Channel Routing</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Coverage</th>
                  <th>Volume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((channel) => (
                  <tr key={channel.id}>
                    <td className="font-semibold">{channel.name}</td>
                    <td className="text-xs text-subtle">{channel.coverage}</td>
                    <td>{channel.volume}</td>
                    <td><span className={`pill ${CHANNEL_STATUS_CLASS[channel.status]}`}>{channel.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Recent Dispatches</div>
          <div className="space-y-3">
            {data.recentDispatches.map((dispatch) => (
              <div key={dispatch.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-sm font-semibold">{dispatch.rule}</div>
                  <span className={`pill ${DISPATCH_STATUS_CLASS[dispatch.status]}`}>{dispatch.status}</span>
                </div>
                <div className="text-xs text-subtle">{dispatch.channel} · {dispatch.recipient}</div>
                <div className="text-xs mt-2"><span className="text-subtle">Time:</span> {dispatch.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Notification Notes</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}

