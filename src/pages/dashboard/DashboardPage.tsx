import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { Zap, Activity, AlertTriangle, BarChart3, TrendingUp, Cpu, Users, Globe2 } from 'lucide-react'

interface KPI { label: string; value: string; delta?: string; up?: boolean; icon: React.ReactNode; color: string }

const KPIS: KPI[] = [
  { label: 'Active Sessions', value: '148', delta: '+12 vs yesterday', up: true,  icon: <Activity size={20} />, color: 'var(--ok)' },
  { label: 'Charge Points Online', value: '312 / 340', delta: '91.8% uptime', up: true,  icon: <Cpu size={20} />, color: 'var(--info)' },
  { label: 'Energy Today (kWh)', value: '4,821', delta: '+8.2% vs avg', up: true,  icon: <Zap size={20} />, color: 'var(--accent)' },
  { label: 'Revenue Today', value: 'KES 142,400', delta: '+5.1% vs avg', up: true,  icon: <BarChart3 size={20} />, color: 'var(--warning)' },
  { label: 'Open Incidents', value: '7', delta: '-3 resolved today', up: false, icon: <AlertTriangle size={20} />, color: 'var(--danger)' },
  { label: 'Roaming Sessions', value: '34', delta: '3 OCPI partners', up: true,  icon: <Globe2 size={20} />, color: 'var(--info)' },
  { label: 'Grid Load', value: '82%', delta: 'Peak shaving active', up: false, icon: <TrendingUp size={20} />, color: 'var(--warning)' },
  { label: 'Active Operators', value: '12', delta: '3 on field', up: true,  icon: <Users size={20} />, color: 'var(--text-muted)' },
]

const RECENT_SESSIONS = [
  { id: 'S-001', station: 'Westlands Hub', cp: 'CP-003', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Active', method: 'App' },
  { id: 'S-002', station: 'CBD Station', cp: 'CP-011', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'RFID' },
  { id: 'S-003', station: 'Airport East', cp: 'CP-007', energy: '50.0 kWh', amount: 'KES 3,000', status: 'Active', method: 'Roaming' },
  { id: 'S-004', station: 'Garden City', cp: 'CP-001', energy: '8.2 kWh', amount: 'KES 492', status: 'Completed', method: 'App' },
  { id: 'S-005', station: 'Strathmore', cp: 'CP-022', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID' },
]

const RECENT_INCIDENTS = [
  { id: 'INC-044', station: 'Westlands Hub', severity: 'High', title: 'CP-003 connector fault', status: 'Open' },
  { id: 'INC-043', station: 'CBD Station', severity: 'Medium', title: 'Heartbeat timeout CP-011', status: 'Acknowledged' },
  { id: 'INC-042', station: 'Airport East', severity: 'Low', title: 'Firmware update pending', status: 'Open' },
]

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <DashboardLayout pageTitle="Operations Overview">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Welcome back, <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{user?.name}</span>.
          Here's your network at a glance.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {KPIS.map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <div className="flex items-center gap-2">
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
              <span className="label">{kpi.label}</span>
            </div>
            <div className="value">{kpi.value}</div>
            {kpi.delta && (
              <div className={kpi.up ? 'delta-up' : 'delta-down'}>
                {kpi.up ? '↑' : '↓'} {kpi.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="card">
          <div className="section-title">
            <Activity size={16} style={{ color: 'var(--accent)' }} />
            Recent Sessions
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Station / CP</th>
                  <th>Energy</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_SESSIONS.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{s.station}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>{s.cp} · {s.method}</div>
                    </td>
                    <td className="text-sm">{s.energy}</td>
                    <td className="text-sm font-medium">{s.amount}</td>
                    <td>
                      <span className={`pill ${s.status === 'Active' ? 'active' : s.status === 'Completed' ? 'online' : 'faulted'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <div className="section-title">
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            Active Incidents
          </div>
          <div className="space-y-3">
            {RECENT_INCIDENTS.map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
                <span className={`pill flex-shrink-0 ${inc.severity === 'High' ? 'faulted' : inc.severity === 'Medium' ? 'degraded' : 'pending'}`}>
                  {inc.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{inc.title}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>{inc.station} · {inc.id}</div>
                </div>
                <span className={`pill flex-shrink-0 ${inc.status === 'Open' ? 'offline' : 'pending'}`}>{inc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
