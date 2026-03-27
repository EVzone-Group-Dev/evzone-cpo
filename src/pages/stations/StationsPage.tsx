import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Search, Filter, Map as MapIcon, List, MapPin, Zap, Plus } from 'lucide-react'
import { useStations, type Station } from '@/core/hooks/useStations'
import { PATHS } from '@/router/paths'
import { MapComponent } from '@/components/common/MapComponent'

export function StationsPage() {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  
  const { data: stations, isLoading, error } = useStations()

  const filtered = (stations || []).filter(s => 
    (statusFilter === 'All' || s.status === statusFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
  )

  if (isLoading) return <DashboardLayout pageTitle="Stations"><div className="p-8 text-center text-subtle">Loading fleet data...</div></DashboardLayout>
  if (error) return <DashboardLayout pageTitle="Stations"><div className="p-8 text-center text-danger">Error loading stations.</div></DashboardLayout>

  return (
    <DashboardLayout pageTitle="Stations">
      {/* Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Total Stations</div><div className="value">{stations?.length}</div></div>
        <div className="kpi-card"><div className="label">Online</div><div className="value">{stations?.filter(s => s.status === 'Online').length}</div></div>
        <div className="kpi-card"><div className="label">Faulted</div><div className="value">{stations?.filter(s => s.status === 'Faulted').length}</div></div>
        <div className="kpi-card"><div className="label">Grid Capacity</div><div className="value">1.2 MW</div></div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or city..." 
              className="input pl-10 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <select 
              className="input pl-10 h-10 appearance-none pr-8"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Degraded">Degraded</option>
              <option value="Offline">Offline</option>
              <option value="Faulted">Faulted</option>
            </select>
          </div>
          <Link to="/stations/new" className="px-4 bg-accent text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 h-10 transition-all">
            <Plus size={16} /> <span className="hidden sm:inline">Add Station</span>
          </Link>
        </div>

        <div className="flex bg-bg-muted rounded-lg p-1 border border-border">
          <button 
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all ${view === 'list' ? 'bg-accent text-white shadow-lg' : 'text-subtle hover:text-text'}`}
          >
            <List size={14} /> List
          </button>
          <button 
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all ${view === 'map' ? 'bg-accent text-white shadow-lg' : 'text-subtle hover:text-text'}`}
          >
            <MapIcon size={14} /> Map
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((station: Station) => (
            <Link key={station.id} to={PATHS.STATION_DETAIL(station.id)} className="card hover:border-accent transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-base group-hover:text-accent transition-colors">{station.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-subtle mt-1">
                    <MapPin size={12} /> {station.city}, {station.country}
                  </div>
                </div>
                <span className={`pill ${station.status.toLowerCase()}`}>{station.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  <div>
                    <div className="text-[10px] text-subtle uppercase leading-none">Power</div>
                    <div className="text-sm font-semibold">{station.capacity} kW</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />
                  <div>
                    <div className="text-[10px] text-subtle uppercase leading-none">Connectors</div>
                    <div className="text-sm font-semibold">{station.chargePoints?.length || 0} Units</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
              <div className="text-subtle mb-2">No stations found matching your criteria.</div>
              <button onClick={() => { setSearch(''); setStatusFilter('All'); }} className="text-accent text-sm hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card h-[600px] p-0 overflow-hidden relative border-accent/20 shadow-2xl">
          <MapComponent 
            center={{ lat: -1.2863, lng: 36.8172 }} // Nairobi center
            markers={filtered.map(s => ({
              id: s.id,
              lat: s.lat,
              lng: s.lng,
              title: s.name,
              status: s.status
            }))}
            onMarkerClick={(id: string) => {
              // Custom logic for marker click (e.g. open detail or tooltip)
              console.log('Clicked station:', id)
            }}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
