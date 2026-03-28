import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PATHS } from '@/router/paths'
import { Search, Cpu, Wifi, WifiOff } from 'lucide-react'
import { useChargePoints } from '@/core/hooks/usePlatformData'

export function ChargePointsPage() {
  const [search, setSearch] = useState('')
  const { data: chargePoints, isLoading, error } = useChargePoints()

  const filtered = (chargePoints || []).filter((cp) =>
    cp.model.toLowerCase().includes(search.toLowerCase()) ||
    cp.ocppId.toLowerCase().includes(search.toLowerCase()) ||
    cp.stationName.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading) {
    return <DashboardLayout pageTitle="Charge Points"><div className="p-8 text-center text-subtle">Loading charge point fleet...</div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout pageTitle="Charge Points"><div className="p-8 text-center text-danger">Unable to load charge point inventory.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Charge Points">
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input className="input pl-9" placeholder="Search by model, OCPP ID, station…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {filtered.map((cp) => (
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
                  <div className="text-xs font-mono">{cp.ocppId}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>OCPP {cp.ocppVersion}</div>
                </td>
                <td className="text-sm">{cp.maxCapacityKw} kW</td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className={`pill ${cp.status.toLowerCase()}`}>{cp.status}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{cp.ocppStatus}</span>
                  </div>
                </td>
                <td>
                  {cp.roamingPublished
                    ? <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--ok)' }}><Wifi size={12} /> Published</span>
                    : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-subtle)' }}><WifiOff size={12} /> Unpublished</span>}
                </td>
                <td>
                  <span className={`text-xs ${cp.stale ? 'text-warning' : 'text-ok'}`}>
                    {cp.lastHeartbeatLabel}
                  </span>
                </td>
                <td>
                  <Link to={PATHS.CHARGE_POINT_DETAIL(cp.id)} className="btn secondary sm">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
