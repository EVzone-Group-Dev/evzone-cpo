import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSwapStations } from '@/core/hooks/useSwapping'
import { PATHS } from '@/router/paths'
import { MapPin, RefreshCw, Search } from 'lucide-react'

type Filter = 'All' | 'Online' | 'Degraded' | 'Offline' | 'Maintenance'

export function SwapStationsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const { data: stations, isLoading, error } = useSwapStations()

  const filtered = (stations ?? []).filter((station) =>
    (filter === 'All' || station.status === filter) &&
    (station.name.toLowerCase().includes(search.toLowerCase()) || station.city.toLowerCase().includes(search.toLowerCase())),
  )

  const totals = useMemo(() => ({
    cabinets: (stations ?? []).reduce((sum, station) => sum + station.cabinetCount, 0),
    readyPacks: (stations ?? []).reduce((sum, station) => sum + station.readyPacks, 0),
    chargingPacks: (stations ?? []).reduce((sum, station) => sum + station.chargingPacks, 0),
  }), [stations])

  if (isLoading) {
    return <DashboardLayout pageTitle="Swap Stations"><div className="p-8 text-center text-subtle">Loading swap infrastructure...</div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout pageTitle="Swap Stations"><div className="p-8 text-center text-danger">Unable to load swap stations.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Swap Stations">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Sites</div><div className="value">{stations?.length ?? 0}</div></div>
        <div className="kpi-card"><div className="label">Cabinets</div><div className="value">{totals.cabinets}</div></div>
        <div className="kpi-card"><div className="label">Ready Packs</div><div className="value text-ok">{totals.readyPacks}</div></div>
        <div className="kpi-card"><div className="label">Charging Packs</div><div className="value text-warning">{totals.chargingPacks}</div></div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Search swap stations..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Online', 'Degraded', 'Offline', 'Maintenance'] as Filter[]).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((station) => (
          <Link key={station.id} to={PATHS.SWAP_STATION_DETAIL(station.id)} className="card hover:border-accent transition-all group">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base group-hover:text-accent transition-colors">{station.name}</h3>
                <div className="flex items-center gap-1 text-xs text-subtle mt-1">
                  <MapPin size={12} /> {station.address}, {station.city}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-accent mt-2">{station.serviceMode} Swap Site</div>
              </div>
              <span className={`pill ${station.status === 'Online' ? 'online' : station.status === 'Degraded' ? 'degraded' : station.status === 'Maintenance' ? 'maintenance' : 'offline'}`}>{station.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-subtle">Cabinets</div>
                <div className="text-lg font-bold">{station.cabinetCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-subtle">Avg Turnaround</div>
                <div className="text-lg font-bold">{station.avgSwapDurationLabel}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-subtle">Ready Packs</div>
                <div className="text-lg font-bold text-ok">{station.readyPacks}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-subtle">Charging Packs</div>
                <div className="text-lg font-bold text-warning">{station.chargingPacks}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-subtle flex items-center gap-2">
              <RefreshCw size={12} className="text-accent" />
              Cabinet, battery pack, and rider turnaround controls
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  )
}
