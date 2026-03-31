import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PATHS } from '@/router/paths'
import { Search, Cpu, Wifi, WifiOff, Plus } from 'lucide-react'
import { useChargePoints } from '@/core/hooks/usePlatformData'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'

type StatusFilter = 'All' | 'Online' | 'Offline' | 'Degraded'
type RoamingFilter = 'All' | 'Published' | 'Unpublished'

export function ChargePointsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [stationFilter, setStationFilter] = useState<string>('All')
  const [roamingFilter, setRoamingFilter] = useState<RoamingFilter>('All')
  const { data: chargePoints, isLoading, error } = useChargePoints()
  const userRole = useAuthStore((state) => state.user?.role)
  const canCreateChargePoints = !!userRole && canManageStations(userRole)

  const stationOptions = useMemo(
    () => ['All', ...Array.from(new Set((chargePoints || []).map((cp) => cp.stationName || 'Unassigned Station'))).sort((a, b) => a.localeCompare(b))],
    [chargePoints],
  )

  const filtered = (chargePoints || []).filter((cp) => {
    const searchTerm = search.trim().toLowerCase()
    const matchesSearch = !searchTerm
      || cp.model.toLowerCase().includes(searchTerm)
      || cp.ocppId.toLowerCase().includes(searchTerm)
      || (cp.stationName || 'Unassigned Station').toLowerCase().includes(searchTerm)
    const matchesStatus = statusFilter === 'All' || cp.status === statusFilter
    const matchesStation = stationFilter === 'All' || (cp.stationName || 'Unassigned Station') === stationFilter
    const matchesRoaming = roamingFilter === 'All'
      || (roamingFilter === 'Published' && cp.roamingPublished)
      || (roamingFilter === 'Unpublished' && !cp.roamingPublished)

    return matchesSearch && matchesStatus && matchesStation && matchesRoaming
  })

  if (isLoading) {
    return <DashboardLayout pageTitle="Charge Points"><div className="p-8 text-center text-subtle">Loading charge point fleet...</div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout pageTitle="Charge Points"><div className="p-8 text-center text-danger">Unable to load charge point inventory.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Charge Points">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input className="input pl-9" placeholder="Search by model, OCPP ID, station…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input md:w-[170px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          <option value="All">All Statuses</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Degraded">Degraded</option>
        </select>
        <select className="input md:w-[210px]" value={stationFilter} onChange={(event) => setStationFilter(event.target.value)}>
          {stationOptions.map((stationName) => (
            <option key={stationName} value={stationName}>
              {stationName === 'All' ? 'All Stations' : stationName}
            </option>
          ))}
        </select>
        <select className="input md:w-[170px]" value={roamingFilter} onChange={(event) => setRoamingFilter(event.target.value as RoamingFilter)}>
          <option value="All">All Roaming</option>
          <option value="Published">Published</option>
          <option value="Unpublished">Unpublished</option>
        </select>
        {canCreateChargePoints && (
          <Link to={PATHS.CHARGE_POINT_NEW} className="btn primary flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={14} />
            Add Charge Point
          </Link>
        )}
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
              <tr key={`${cp.id}-${cp.ocppId}`}>
                <td>
                  <div className="flex items-center gap-2">
                    <Cpu size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <Link to={PATHS.CHARGE_POINT_DETAIL(cp.id)} className="text-xs font-bold hover:underline" style={{ color: 'var(--text)' }}>
                        {cp.model}
                      </Link>
                      <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                        {cp.manufacturer} · {cp.serialNumber} · {(cp.connectorTypes?.length ? cp.connectorTypes.join(' / ') : cp.connectorType)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-xs">{cp.stationName || 'Unassigned Station'}</td>
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <div className="text-subtle mb-1">No charge points match the current filters.</div>
                  <button
                    className="text-accent text-xs hover:underline"
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('All')
                      setStationFilter('All')
                      setRoamingFilter('All')
                    }}
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
