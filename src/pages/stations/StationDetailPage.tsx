import { Link, useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'
import { MapPin, Cpu, Activity, Zap, Shield, Clock, RefreshCw } from 'lucide-react'
import { useStation } from '@/core/hooks/useStations'
import { MapComponent } from '@/components/common/MapComponent'
import { PATHS } from '@/router/paths'

const STATION_CP_STATUS_CLASS = {
  Available: 'active',
  Charging: 'online',
  Faulted: 'faulted',
  Unavailable: 'offline',
} as const

export function StationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userRole = useAuthStore((state) => state.user?.role)
  const { data: station, isLoading, error } = useStation(id)
  const canConfigureAssets = !!userRole && canManageStations(userRole)

  if (isLoading) {
    return <DashboardLayout pageTitle="Loading..."><div className="p-12 text-center text-subtle font-mono animate-pulse">Retrieving station telemetry...</div></DashboardLayout>
  }

  if (error || !station) {
    return (
      <DashboardLayout pageTitle="Station Not Found">
        <div className="card text-center py-12 border-danger/30" style={{ color: 'var(--danger)' }}>
          <div className="text-lg font-bold">Error 404</div>
          <div className="text-sm opacity-70">Station not found or telemetry stream interrupted.</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={station.name}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {station.address}, {station.city}</div>
          <span className={`pill ${station.status.toLowerCase()}`}>{station.status}</span>
          <span className="pill pending">{station.serviceMode}</span>
        </div>
        {canConfigureAssets && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-bg-muted border border-border rounded-lg text-xs font-semibold hover:border-accent transition-all">Configure Assets</button>
            <button className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold shadow-lg shadow-accent/20 hover:brightness-110 transition-all">Service Mode</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={station.swapSummary ? 'grid grid-cols-2 md:grid-cols-5 gap-4' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}>
            <div className="kpi-card group hover:border-accent transition-all cursor-default">
              <div className="label">Nominal Power</div>
              <div className="value flex items-center gap-2">{station.capacity} kW <Zap size={14} className="text-ok" /></div>
            </div>
            <div className="kpi-card">
              <div className="label">Charging Assets</div>
              <div className="value">{station.chargePoints.length}</div>
            </div>
            {station.swapSummary && (
              <div className="kpi-card">
                <div className="label">Swap Cabinets</div>
                <div className="value">{station.swapSummary.cabinetCount}</div>
              </div>
            )}
            <div className="kpi-card">
              <div className="label">Uptime (30d)</div>
              <div className="value">{station.uptimePercent30d}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Daily Throughput</div>
              <div className="value text-accent">{station.dailyAverageKwh}</div>
            </div>
          </div>

          <div className="card p-0 h-[400px] overflow-hidden relative border-accent/10 shadow-xl group">
            <MapComponent
              center={{ lat: station.lat, lng: station.lng }}
              zoom={15}
              markers={[{
                id: station.id,
                lat: station.lat,
                lng: station.lng,
                title: station.name,
                status: station.status,
              }]}
            />
            <div className="absolute top-4 right-4 bg-bg/80 backdrop-blur-md border border-border p-2 rounded-lg text-[10px] uppercase tracking-tighter text-subtle pointer-events-none">
              {station.geofenceStatus}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Cpu size={16} className="text-accent" />Charge Points & Connectors</div>
            {station.chargePoints.length > 0 ? (
              <div className="table-wrap mt-4">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>Type</th><th>Status</th><th>Last Heartbeat</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {station.chargePoints.map((cp) => (
                      <tr key={cp.id}>
                        <td className="font-mono text-xs">{cp.id}</td>
                        <td className="text-xs">{cp.type}</td>
                        <td><span className={`pill ${STATION_CP_STATUS_CLASS[cp.status]}`}>{cp.status}</span></td>
                        <td className="text-[10px] text-subtle">{cp.lastHeartbeatLabel ?? 'Unknown'}</td>
                        <td><button className="text-accent text-[10px] font-bold uppercase hover:underline">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 px-4 py-5 text-sm text-subtle">
                No charging assets are configured for this site. This location is operating in {station.serviceMode.toLowerCase()} mode.
              </div>
            )}
          </div>

          {station.swapSummary && (
            <div className="card">
              <div className="section-title"><RefreshCw size={16} className="text-accent" />Battery Swapping</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="rounded-lg border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-[11px] uppercase tracking-wide text-subtle">Cabinets</div>
                  <div className="text-2xl font-bold">{station.swapSummary.cabinetCount}</div>
                </div>
                <div className="rounded-lg border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-[11px] uppercase tracking-wide text-subtle">Ready Packs</div>
                  <div className="text-2xl font-bold text-ok">{station.swapSummary.availableChargedPacks}</div>
                </div>
                <div className="rounded-lg border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-[11px] uppercase tracking-wide text-subtle">Charging Packs</div>
                  <div className="text-2xl font-bold text-warning">{station.swapSummary.chargingPacks}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-subtle">
                Swap cabinet telemetry is managed from the dedicated swap workspace.
                {' '}
                <Link to={PATHS.SWAP_STATIONS} className="text-accent hover:underline">Open swap stations</Link>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card border-l-4 border-l-ok">
            <div className="section-title"><Shield size={16} className="text-ok" />System Integrity</div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-subtle">Firmware Version</span>
                <span className="font-mono bg-bg-muted px-2 py-0.5 rounded">{station.systemIntegrity.firmwareVersion}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-subtle">OCPP Version</span>
                <span className="font-mono px-2 py-0.5 rounded border border-border">{station.systemIntegrity.ocppVersion}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-subtle">SLA Compliance</span>
                <span className="text-ok font-bold">{station.systemIntegrity.slaCompliance}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Activity size={16} className="text-accent" />Network Latency</div>
            <div className="mt-4 h-24 flex items-end gap-1 px-2">
              {station.networkLatency.points.map((height, index) => (
                <div key={index} className="flex-1 bg-accent/20 rounded-t-sm hover:bg-accent transition-all cursor-help" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-subtle uppercase">
              <span>{station.networkLatency.averageLabel}</span>
              <span>{station.networkLatency.modeLabel}</span>
            </div>
          </div>

          <div className="card border-l-4 border-l-accent/50">
            <div className="section-title"><Clock size={16} className="text-accent" />Recent Events</div>
            <div className="mt-4 space-y-4">
              {station.recentEvents.map((event) => (
                <div key={`${event.description}-${event.time}`} className="flex justify-between items-start gap-4">
                  <div className="text-[11px] leading-tight">{event.description}</div>
                  <div className="text-[9px] text-subtle whitespace-nowrap">{event.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
