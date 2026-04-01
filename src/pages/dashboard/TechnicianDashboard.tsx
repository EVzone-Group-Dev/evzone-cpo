import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getTemporaryAccessState, getTemporaryAccessWindowLabel, isTemporaryScopeUser } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useAlerts, useIncidentCommand } from '@/core/hooks/usePlatformData'
import { useTenant } from '@/core/hooks/useTenant'
import { AlertTriangle, Shield, Wrench } from 'lucide-react'

const ALERT_CLASS = {
  Critical: 'faulted',
  Warning: 'degraded',
  Info: 'pending',
} as const

export function TechnicianDashboard() {
  const user = useAuthStore((state) => state.user)
  const { activeStationContext, availableStationContexts, dataScopeLabel } = useTenant()
  const { data: incidents, isLoading: incidentsLoading, error: incidentsError } = useIncidentCommand()
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useAlerts()
  const temporaryAccessState = getTemporaryAccessState(user)
  const temporaryAccessWindowLabel = getTemporaryAccessWindowLabel(user)
  const hasTemporaryScope = isTemporaryScopeUser(user)
  const assignedStationsLabel = availableStationContexts.length > 0
    ? availableStationContexts
      .map((context) => context.stationName ?? context.stationId)
      .join(', ')
    : user?.assignedStationIds?.join(', ') ?? 'Tenant-wide queue'

  if (incidentsLoading || alertsLoading) {
    return <DashboardLayout pageTitle="Field Service"><div className="p-8 text-center text-subtle">Loading technician dashboard...</div></DashboardLayout>
  }

  if (incidentsError || alertsError || !incidents || !alerts) {
    return <DashboardLayout pageTitle="Field Service"><div className="p-8 text-center text-danger">Unable to load technician dashboard.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Field Service">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {incidents.stats.map((stat) => (
          <div key={stat.id} className="kpi-card">
            <div className="label">{stat.label}</div>
            <div className={`value ${stat.tone === 'danger' ? 'text-danger' : stat.tone === 'warning' ? 'text-warning' : stat.tone === 'ok' ? 'text-ok' : ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="card">
          <div className="section-title"><Wrench size={16} className="text-accent" />Assigned Incident Queue</div>
          <div className="space-y-3 mt-4">
            {incidents.incidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{incident.stationName}</div>
                    <div className="text-[11px] text-subtle">{incident.type} · {incident.id}</div>
                  </div>
                  <span className={`pill ${incident.status === 'Closed' ? 'online' : incident.severity === 'Critical' ? 'faulted' : 'degraded'}`}>{incident.status}</span>
                </div>
                <div className="text-sm mt-3">{incident.situationAudit}</div>
                <div className="mt-3 text-[11px] text-subtle">
                  {incident.serviceLog.find((item) => item.active)?.title ?? 'Inspection queued'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="section-title"><AlertTriangle size={16} className="text-warning" />Field Alerts</div>
            <div className="space-y-3 mt-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between gap-3">
                    <div className="text-sm font-semibold">{alert.station}</div>
                    <span className={`pill ${ALERT_CLASS[alert.type]}`}>{alert.type}</span>
                  </div>
                  <div className="text-[11px] text-subtle mt-2">{alert.message}</div>
                  <div className="text-[10px] text-subtle mt-2">{alert.ts}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-l-4 border-l-ok">
            <div className="section-title"><Shield size={16} className="text-ok" />Technician Scope</div>
            <div className="space-y-3 mt-4 text-sm">
              <div><span className="text-subtle">User:</span> {user?.name}</div>
              <div><span className="text-subtle">Active Station:</span> {activeStationContext?.stationName ?? activeStationContext?.stationId ?? 'All assigned stations'}</div>
              <div><span className="text-subtle">Assigned Stations:</span> {assignedStationsLabel}</div>
              <div><span className="text-subtle">Shift Window:</span> {activeStationContext?.shiftStart && activeStationContext?.shiftEnd ? `${activeStationContext.shiftStart} - ${activeStationContext.shiftEnd}` : 'Not time-bound'}</div>
              {hasTemporaryScope && <div><span className="text-subtle">Temporary Access:</span> {temporaryAccessState}</div>}
              {hasTemporaryScope && <div><span className="text-subtle">Access Window:</span> {temporaryAccessWindowLabel}</div>}
              <div><span className="text-subtle">Coverage:</span> {dataScopeLabel}</div>
              <div><span className="text-subtle">Priority Action:</span> {incidents.predictiveAlert.cta}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
