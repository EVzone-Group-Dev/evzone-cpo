import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PATHS } from '@/router/paths'
import { Search, Plus, MapPin, Zap } from 'lucide-react'
import type { Station, StationStatus } from '@/core/types/domain'

const MOCK_STATIONS: Station[] = [
  { id: 'st-1', name: 'Westlands Hub', address: 'Westlands Ave', city: 'Nairobi', country: 'Kenya', latitude: -1.268, longitude: 36.806, status: 'Online', capacity: 150, createdAt: '2024-01-15', chargePoints: [] },
  { id: 'st-2', name: 'CBD Charging Station', address: 'Kenyatta Ave', city: 'Nairobi', country: 'Kenya', latitude: -1.283, longitude: 36.820, status: 'Degraded', capacity: 100, createdAt: '2024-02-10', chargePoints: [] },
  { id: 'st-3', name: 'Airport East', address: 'Airport North Rd', city: 'Nairobi', country: 'Kenya', latitude: -1.319, longitude: 36.927, status: 'Online', capacity: 250, createdAt: '2024-03-01', chargePoints: [] },
  { id: 'st-4', name: 'Garden City Mall', address: 'Thika Rd', city: 'Nairobi', country: 'Kenya', latitude: -1.231, longitude: 36.867, status: 'Maintenance', capacity: 80, createdAt: '2024-01-20', chargePoints: [] },
  { id: 'st-5', name: 'Strathmore University', address: 'Ole Sangale Rd', city: 'Nairobi', country: 'Kenya', latitude: -1.310, longitude: 36.814, status: 'Online', capacity: 60, createdAt: '2024-04-05', chargePoints: [] },
  { id: 'st-6', name: 'Two Rivers Mall', address: 'Limuru Rd', city: 'Nairobi', country: 'Kenya', latitude: -1.200, longitude: 36.787, status: 'Offline', capacity: 120, createdAt: '2024-05-12', chargePoints: [] },
]

const STATUS_FILTER: (StationStatus | 'All')[] = ['All', 'Online', 'Degraded', 'Maintenance', 'Offline']

export function StationsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StationStatus | 'All'>('All')

  const filtered = MOCK_STATIONS.filter(s =>
    (filter === 'All' || s.status === filter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout
      pageTitle="Stations"
      actions={
        <Link to="/stations/new" className="btn primary sm">
          <Plus size={14} /> Add Station
        </Link>
      }
    >
      {/* Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['Online', 'Degraded', 'Maintenance', 'Offline'] as StationStatus[]).map(s => (
          <div key={s} className="kpi-card">
            <div className="label">{s}</div>
            <div className="value">{MOCK_STATIONS.filter(x => x.status === s).length}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input type="text" placeholder="Search stations..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTER.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn sm ${filter === f ? 'primary' : 'secondary'}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(station => (
          <Link key={station.id} to={PATHS.STATION_DETAIL(station.id)} className="card hover:border-[var(--accent)] transition-colors block">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{station.name}</div>
                <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  <MapPin size={10} />{station.city}, {station.country}
                </div>
              </div>
              <span className={`pill ${station.status.toLowerCase()}`}>{station.status}</span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><Zap size={12} /> {station.capacity} kW capacity</span>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16" style={{ color: 'var(--text-muted)' }}>
            No stations match your filter.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
