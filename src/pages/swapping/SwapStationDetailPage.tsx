import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MapComponent } from '@/components/common/MapComponent'
import { useSwapStation } from '@/core/hooks/useSwapping'
import { AlertTriangle, Clock, MapPin, Package, RefreshCw, Shield } from 'lucide-react'

const CABINET_STATUS_CLASS = {
  Online: 'online',
  Degraded: 'degraded',
  Offline: 'offline',
  Maintenance: 'maintenance',
} as const

const PACK_STATUS_CLASS = {
  Ready: 'online',
  Charging: 'pending',
  Reserved: 'maintenance',
  Installed: 'active',
  Quarantined: 'faulted',
} as const

const ALERT_CLASS = {
  Critical: 'text-danger',
  Warning: 'text-warning',
  Info: 'text-subtle',
} as const

export function SwapStationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: station, isLoading, error } = useSwapStation(id)

  if (isLoading) {
    return <DashboardLayout pageTitle="Swap Station"><div className="p-8 text-center text-subtle">Loading swap telemetry...</div></DashboardLayout>
  }

  if (error || !station) {
    return <DashboardLayout pageTitle="Swap Station"><div className="p-8 text-center text-danger">Swap station not found.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle={station.name}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 text-sm text-subtle flex-wrap">
          <div className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {station.address}, {station.city}</div>
          <span className={`pill ${CABINET_STATUS_CLASS[station.status]}`}>{station.status}</span>
          <span className="pill pending">{station.serviceMode}</span>
        </div>
        <div className="text-xs text-subtle">{station.gridBufferLabel}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Cabinets</div><div className="value">{station.cabinetCount}</div></div>
        <div className="kpi-card"><div className="label">Ready Packs</div><div className="value text-ok">{station.readyPacks}</div></div>
        <div className="kpi-card"><div className="label">Charging Packs</div><div className="value text-warning">{station.chargingPacks}</div></div>
        <div className="kpi-card"><div className="label">Avg Turnaround</div><div className="value">{station.avgSwapDurationLabel}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 h-[340px] overflow-hidden relative border-accent/10 shadow-xl">
            <MapComponent
              center={{ lat: station.lat, lng: station.lng }}
              zoom={15}
              markers={[{
                id: station.id,
                lat: station.lat,
                lng: station.lng,
                title: station.name,
                status: station.status === 'Maintenance' ? 'Offline' : station.status,
              }]}
            />
          </div>

          <div className="card">
            <div className="section-title"><RefreshCw size={16} className="text-accent" />Swap Cabinets</div>
            <div className="table-wrap mt-4">
              <table className="table">
                <thead>
                  <tr><th>Cabinet</th><th>Model</th><th>Status</th><th>Ready</th><th>Charging</th><th>Reserved</th><th>Heartbeat</th></tr>
                </thead>
                <tbody>
                  {station.cabinets.map((cabinet) => (
                    <tr key={cabinet.id}>
                      <td className="font-mono text-xs">{cabinet.id}</td>
                      <td>{cabinet.model}</td>
                      <td><span className={`pill ${CABINET_STATUS_CLASS[cabinet.status]}`}>{cabinet.status}</span></td>
                      <td className="font-semibold text-ok">{cabinet.availableChargedPacks}</td>
                      <td>{cabinet.chargingPacks}</td>
                      <td>{cabinet.reservedPacks}</td>
                      <td className="text-xs text-subtle">{cabinet.lastHeartbeatLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Package size={16} className="text-accent" />Battery Packs</div>
            <div className="table-wrap mt-4">
              <table className="table">
                <thead>
                  <tr><th>Pack</th><th>Status</th><th>SoC</th><th>Health</th><th>Cycles</th><th>Slot</th><th>Seen</th></tr>
                </thead>
                <tbody>
                  {station.packs.map((pack) => (
                    <tr key={pack.id}>
                      <td className="font-mono text-xs">{pack.id}</td>
                      <td><span className={`pill ${PACK_STATUS_CLASS[pack.status]}`}>{pack.status}</span></td>
                      <td>{pack.socLabel}</td>
                      <td>{pack.healthLabel}</td>
                      <td>{pack.cycleCount}</td>
                      <td className="text-xs text-subtle">{pack.slotLabel}</td>
                      <td className="text-xs text-subtle">{pack.lastSeenLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="section-title"><AlertTriangle size={16} className="text-warning" />Operational Alerts</div>
            <div className="space-y-3 mt-4">
              {station.alerts.map((alert) => (
                <div key={alert.message} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className={`text-[11px] uppercase tracking-wide font-semibold ${ALERT_CLASS[alert.level]}`}>{alert.level}</div>
                  <div className="text-sm mt-1">{alert.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Clock size={16} className="text-accent" />Recent Swaps</div>
            <div className="space-y-4 mt-4">
              {station.recentSwaps.map((swap) => (
                <div key={swap.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{swap.riderLabel}</div>
                      <div className="text-[11px] text-subtle">{swap.id} · Returned {swap.returnedPackId}</div>
                    </div>
                    <span className={`pill ${swap.status === 'Completed' ? 'online' : swap.status === 'Flagged' ? 'faulted' : 'active'}`}>{swap.status}</span>
                  </div>
                  <div className="flex justify-between mt-3 text-[11px] text-subtle">
                    <span>{swap.durationLabel}</span>
                    <span>{swap.timeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-l-4 border-l-ok">
            <div className="section-title"><Shield size={16} className="text-ok" />Swap Integrity</div>
            <p className="text-sm text-subtle mt-4">
              Battery swapping requires cabinet availability, returned-pack inspection, and recharge balancing to stay within reserve thresholds.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
