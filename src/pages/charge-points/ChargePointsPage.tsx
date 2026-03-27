import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PATHS } from '@/router/paths'
import { Search, Cpu, Wifi, WifiOff } from 'lucide-react'

const MOCK_CPS = [
  { id: 'cp-1', stationId: 'st-1', stationName: 'Westlands Hub', model: 'ABB Terra 184', manufacturer: 'ABB', serialNumber: 'SN-001A', firmwareVersion: '1.4.2', ocppId: 'EVZ-WL-001', ocppVersion: '2.0.1', status: 'Online', ocppStatus: 'Charging', maxCapacityKw: 75, lastHeartbeat: new Date().toISOString(), roamingPublished: true },
  { id: 'cp-2', stationId: 'st-1', stationName: 'Westlands Hub', model: 'ABB Terra 184', manufacturer: 'ABB', serialNumber: 'SN-001B', firmwareVersion: '1.4.2', ocppId: 'EVZ-WL-002', ocppVersion: '2.0.1', status: 'Online', ocppStatus: 'Available', maxCapacityKw: 75, lastHeartbeat: new Date().toISOString(), roamingPublished: true },
  { id: 'cp-3', stationId: 'st-2', stationName: 'CBD Station', model: 'Alfen Eve Pro', manufacturer: 'Alfen', serialNumber: 'SN-002A', firmwareVersion: '3.1.0', ocppId: 'EVZ-CBD-001', ocppVersion: '1.6J', status: 'Degraded', ocppStatus: 'Faulted', maxCapacityKw: 22, lastHeartbeat: new Date(Date.now() - 7*60000).toISOString(), roamingPublished: false },
  { id: 'cp-4', stationId: 'st-3', stationName: 'Airport East', model: 'Tritium RT175', manufacturer: 'Tritium', serialNumber: 'SN-003A', firmwareVersion: '2.7.1', ocppId: 'EVZ-AP-001', ocppVersion: '2.0.1', status: 'Online', ocppStatus: 'Available', maxCapacityKw: 175, lastHeartbeat: new Date().toISOString(), roamingPublished: true },
  { id: 'cp-5', stationId: 'st-4', stationName: 'Garden City Mall', model: 'Wallbox Supernova', manufacturer: 'Wallbox', serialNumber: 'SN-004A', firmwareVersion: '1.0.9', ocppId: 'EVZ-GC-001', ocppVersion: '1.6J', status: 'Offline', ocppStatus: 'Unavailable', maxCapacityKw: 60, lastHeartbeat: new Date(Date.now() - 90*60000).toISOString(), roamingPublished: false },
]

export function ChargePointsPage() {
  const [search, setSearch] = useState('')
  const filtered = MOCK_CPS.filter(cp =>
    cp.model.toLowerCase().includes(search.toLowerCase()) ||
    cp.ocppId?.toLowerCase().includes(search.toLowerCase()) ||
    cp.stationName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout pageTitle="Charge Points">
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input className="input pl-9" placeholder="Search by model, OCPP ID, station…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Station</th>
              <th>OCPP ID / Version</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Roaming</th>
              <th>Heartbeat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cp => {
              const heartbeatMs = cp.lastHeartbeat ? Date.now() - new Date(cp.lastHeartbeat).getTime() : null
              const stale = heartbeatMs && heartbeatMs > 5 * 60 * 1000
              return (
                <tr key={cp.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Cpu size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>{cp.model}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>{cp.manufacturer} · {cp.serialNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs">{cp.stationName}</td>
                  <td>
                    <div className="text-xs font-mono">{cp.ocppId || '-'}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>OCPP {cp.ocppVersion}</div>
                  </td>
                  <td className="text-sm">{cp.maxCapacityKw} kW</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`pill ${cp.status.toLowerCase()}`}>{cp.status}</span>
                      {cp.ocppStatus && <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{cp.ocppStatus}</span>}
                    </div>
                  </td>
                  <td>
                    {cp.roamingPublished
                      ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ok)' }}><Wifi size={12} /> Published</span>
                      : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-subtle)' }}><WifiOff size={12} /> Unpublished</span>}
                  </td>
                  <td>
                    <span className={`text-xs ${stale ? 'text-warning' : 'text-ok'}`}>
                      {heartbeatMs ? `${Math.round(heartbeatMs/1000)}s ago` : 'Never'}
                    </span>
                  </td>
                  <td>
                    <Link to={PATHS.CHARGE_POINT_DETAIL(cp.id)} className="btn secondary sm">Manage</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
