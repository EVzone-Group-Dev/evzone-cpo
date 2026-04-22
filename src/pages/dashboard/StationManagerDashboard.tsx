import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useIncidentCommand } from '@/core/hooks/usePlatformData'
import { useStations } from '@/core/hooks/useStations'
import { useSwapStations } from '@/core/hooks/useSwapping'
import { Activity, AlertTriangle, BatteryCharging, MapPin } from 'lucide-react'

export function StationManagerDashboard() {
  const { data: stations, isLoading: stationsLoading, error: stationsError } = useStations()
  const { data: swapStations, isLoading: swapLoading, error: swapError } = useSwapStations()
  const { data: incidents, isLoading: incidentsLoading, error: incidentsError } = useIncidentCommand()

  if (stationsLoading || swapLoading || incidentsLoading) {
    return <DashboardLayout pageTitle="Station Operations"><div className="p-8 text-center text-subtle">Loading station manager workspace...</div></DashboardLayout>
  }

  if (stationsError || swapError || incidentsError || !stations || !swapStations || !incidents) {
    return <DashboardLayout pageTitle="Station Operations"><div className="p-8 text-center text-danger">Unable to load station manager workspace.</div></DashboardLayout>
  }

  const totalChargeAssets = stations.reduce((sum, station) => sum + station.chargePoints.length, 0)
  const openIncidents = incidents.stats.find((stat) => stat.id === 'open')?.value ?? '0'
  const avgResponse = incidents.stats.find((stat) => stat.id === 'response')?.value ?? '-'

  return (
    <DashboardLayout pageTitle="Station Operations">
      <div className="kpi-row mb-6">
        <div className="kpi-card"><div className="label">Managed Sites</div><div className="value">{stations.length}</div></div>
        <div className="kpi-card"><div className="label">Charge Assets</div><div className="value">{totalChargeAssets}</div></div>
        <div className="kpi-card"><div className="label">Swap Sites</div><div className="value">{swapStations.length}</div></div>
        <div className="kpi-card"><div className="label">Open Incidents</div><div className="value text-danger">{openIncidents}</div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="card">
          <div className="section-title"><MapPin size={16} className="text-accent" />Operational Sites</div>
          <div className="table-wrap mt-4">
            <table className="table">
              <thead>
                <tr><th>Site</th><th>Mode</th><th>Status</th><th>Charge</th><th>Swap</th></tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id}>
                    <td>
                      <div className="font-semibold">{station.name}</div>
                      <div className="text-[11px] text-subtle">{station.city}</div>
                    </td>
                    <td>{station.serviceMode}</td>
                    <td><span className={`pill ${station.status.toLowerCase()}`}>{station.status}</span></td>
                    <td>{station.chargePoints.length} assets</td>
                    <td>{station.swapSummary ? `${station.swapSummary.availableChargedPacks} ready` : 'Not enabled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="section-title"><AlertTriangle size={16} className="text-danger" />Incident Watch</div>
            <div className="space-y-3 mt-4">
              {incidents.incidents.slice(0, 4).map((incident) => (
                <div key={incident.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{incident.stationName}</div>
                      <div className="text-[11px] text-subtle">{incident.type}</div>
                    </div>
                    <span className={`pill ${incident.status === 'Closed' ? 'online' : incident.severity === 'Critical' ? 'faulted' : 'degraded'}`}>{incident.severity}</span>
                  </div>
                  <div className="text-sm mt-2">{incident.situationAudit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Activity size={16} className="text-accent" />Response Snapshot</div>
            <div className="space-y-3 mt-4 text-sm">
              <div className="flex justify-between"><span className="text-subtle">Average Response</span><span className="font-semibold">{avgResponse}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Swap Sites Enabled</span><span className="font-semibold">{swapStations.length}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Charge Asset Count</span><span className="font-semibold">{totalChargeAssets}</span></div>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><BatteryCharging size={16} className="text-ok" />Hybrid Readiness</div>
            <p className="text-sm text-subtle mt-4">
              Use this workspace to balance charging uptime, swap cabinet readiness, and field dispatch response across your managed sites.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

