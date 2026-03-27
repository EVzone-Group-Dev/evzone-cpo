import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Bell } from 'lucide-react'

const ALERTS = [
  { id: 'A-1', type: 'Critical', message: 'Garden City station offline — grid power fault', station: 'Garden City', ts: '2025-03-27 05:02', acked: false },
  { id: 'A-2', type: 'Warning', message: 'Load at 92% of grid limit — Westlands Hub', station: 'Westlands Hub', ts: '2025-03-27 08:45', acked: false },
  { id: 'A-3', type: 'Info', message: 'Roaming partner "ChargeNow" sync complete — 12 CDRs sent', station: '—', ts: '2025-03-27 09:00', acked: true },
  { id: 'A-4', type: 'Warning', message: 'CP-003 heartbeat stale for 6min', station: 'CBD Station', ts: '2025-03-27 09:15', acked: false },
]

export function AlertsPage() {
  return (
    <DashboardLayout pageTitle="Alerts">
      <div className="space-y-3">
        {ALERTS.map(a => (
          <div key={a.id} className={`alert ${a.type === 'Critical' ? 'danger' : a.type === 'Warning' ? 'warning' : 'info'}`}>
            <Bell size={14} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{a.message}</div>
              <div className="text-xs opacity-80 mt-0.5">{a.station} · {a.ts}</div>
            </div>
            {a.acked && <span className="pill online text-[10px] flex-shrink-0">ACK'd</span>}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
