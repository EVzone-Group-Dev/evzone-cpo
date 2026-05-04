import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  isSuperAdminUser,
  isFinanceDashboardUser,
  isSiteScopedUser,
  isStationManagerDashboardUser,
  isTechnicianDashboardUser,
} from '@/core/auth/access'
import { useDashboardOverview } from '@/core/hooks/usePlatformData'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { FinanceDashboard } from '@/pages/dashboard/FinanceDashboard'
import { SiteOwnerDashboard } from '@/pages/dashboard/SiteOwnerDashboard'
import { StationManagerDashboard } from '@/pages/dashboard/StationManagerDashboard'
import { SuperAdminDashboard } from '@/pages/dashboard/SuperAdminDashboard'
import { TechnicianDashboard } from '@/pages/dashboard/TechnicianDashboard'
import { Zap, Activity, AlertTriangle, BarChart3, TrendingUp, Cpu, Users, Globe2 } from 'lucide-react'

const KPI_META = {
  activity: { icon: <Activity size={20} />, color: 'var(--ok)' },
  'charge-points': { icon: <Cpu size={20} />, color: 'var(--info)' },
  energy: { icon: <Zap size={20} />, color: 'var(--accent)' },
  revenue: { icon: <BarChart3 size={20} />, color: 'var(--warning)' },
  incidents: { icon: <AlertTriangle size={20} />, color: 'var(--danger)' },
  roaming: { icon: <Globe2 size={20} />, color: 'var(--info)' },
  load: { icon: <TrendingUp size={20} />, color: 'var(--warning)' },
  operators: { icon: <Users size={20} />, color: 'var(--text-muted)' },
} as const

export function DashboardPage() {
  const { user } = useAuthStore()
  const { activeTenant, dashboardMode, isLoading: isTenantLoading } = useTenant()
  const usesOperationsDashboard = dashboardMode !== 'site'
    && !isSuperAdminUser(user)
    && !isFinanceDashboardUser(user)
    && !isTechnicianDashboardUser(user)
    && !isStationManagerDashboardUser(user)
  const { data, isLoading, error } = useDashboardOverview({ enabled: usesOperationsDashboard })

  if (isTenantLoading) {
    return <DashboardLayout pageTitle="Tenant Overview"><div className="p-8 text-center text-subtle">Loading tenant context...</div></DashboardLayout>
  }

  if (isFinanceDashboardUser(user)) {
    return <FinanceDashboard />
  }

  if (isTechnicianDashboardUser(user)) {
    return <TechnicianDashboard />
  }

  if (isStationManagerDashboardUser(user)) {
    return <StationManagerDashboard />
  }

  if (isSuperAdminUser(user)) {
    return <SuperAdminDashboard />
  }

  if (isSiteScopedUser(user) || dashboardMode === 'site') {
    return <SiteOwnerDashboard />
  }

  if (isLoading) {
    return <DashboardLayout pageTitle="Operations Overview"><div className="p-8 text-center text-subtle">Loading network overview...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Operations Overview"><div className="p-8 text-center text-danger">Unable to load dashboard data.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Operations Overview">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* Greeting */}
        <div className="mb-5 sm:mb-6">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Welcome back, <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{user?.name}</span>.
            Here's {activeTenant ? `${activeTenant.name}'s` : 'your'} network at a glance.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="kpi-row mb-6 sm:mb-8">
          {data.kpis.map((kpi) => {
            const meta = KPI_META[kpi.iconKey]

            return (
              <div key={kpi.label} className="kpi-card">
                <div className="flex items-center gap-2">
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span className="label">{kpi.label}</span>
                </div>
                <div className="value">{kpi.value}</div>
                <div className={kpi.trend === 'up' ? 'delta-up' : 'delta-down'}>
                  {kpi.trend === 'up' ? '↑' : '↓'} {kpi.delta}
                </div>
              </div>
            )
          })}
        </div>

        {/* Two-column lower section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  {data.recentSessions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>
                        No sessions yet for this tenant.
                      </td>
                    </tr>
                  )}
                  {data.recentSessions.map((s) => (
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
              {data.recentIncidents.length === 0 && (
                <div className="rounded-lg border px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  No incidents in the current window.
                </div>
              )}
              {data.recentIncidents.map((inc) => (
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
      </div>
    </DashboardLayout>
  )
}

