import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAlerts } from '@/core/hooks/usePlatformData'
import { Bell } from 'lucide-react'

export function AlertsPage() {
  const { data: alerts, isLoading, error } = useAlerts()

  if (isLoading) {
    return <DashboardLayout pageTitle="Alerts"><div className="p-8 text-center text-subtle">Loading alert stream...</div></DashboardLayout>
  }

  if (error || !alerts) {
    return <DashboardLayout pageTitle="Alerts"><div className="p-8 text-center text-danger">Unable to load alerts.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Alerts">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert ${alert.type === 'Critical' ? 'danger' : alert.type === 'Warning' ? 'warning' : 'info'}`}>
            <Bell size={14} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{alert.message}</div>
              <div className="text-xs opacity-80 mt-0.5">{alert.station} · {alert.ts}</div>
            </div>
            {alert.acked && <span className="pill online text-[10px] flex-shrink-0">ACK'd</span>}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
