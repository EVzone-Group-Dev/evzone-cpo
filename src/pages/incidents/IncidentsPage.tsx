import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useIncidentCommand } from '@/core/hooks/usePlatformData'
import type { IncidentRecord } from '@/core/types/mockApi'
import { AlertCircle, CheckCircle2, User, MapPin, Send, AlertTriangle, Filter, Search, Clock } from 'lucide-react'

const EMPTY_INCIDENTS: IncidentRecord[] = []

export function IncidentsPage() {
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | IncidentRecord['status']>('All')
  const [severityFilter, setSeverityFilter] = useState<'All' | IncidentRecord['severity']>('All')
  const [stationFilter, setStationFilter] = useState('All')
  const { data, isLoading, error } = useIncidentCommand()
  const incidents = data?.incidents ?? EMPTY_INCIDENTS

  const stationOptions = useMemo(
    () => ['All', ...Array.from(new Set(incidents.map((incident) => incident.stationName))).sort((left, right) => left.localeCompare(right))],
    [incidents],
  )

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const filteredIncidents = useMemo(
    () => incidents.filter((incident) => {
      const matchesStatus = statusFilter === 'All' || incident.status === statusFilter
      const matchesSeverity = severityFilter === 'All' || incident.severity === severityFilter
      const matchesStation = stationFilter === 'All' || incident.stationName === stationFilter
      const matchesSearch = !normalizedSearchQuery || [
        incident.id,
        incident.type,
        incident.stationName,
        incident.status,
        incident.severity,
        incident.assignedTech ?? '',
      ].some((field) => field.toLowerCase().includes(normalizedSearchQuery))

      return matchesStatus && matchesSeverity && matchesStation && matchesSearch
    }),
    [incidents, normalizedSearchQuery, severityFilter, stationFilter, statusFilter],
  )

  const activeIncident = useMemo(() => {
    if (!filteredIncidents.length) {
      return null
    }

    return filteredIncidents.find((incident) => incident.id === activeIncidentId) ?? filteredIncidents[0]
  }, [activeIncidentId, filteredIncidents])

  const hasActiveFilters = statusFilter !== 'All' || severityFilter !== 'All' || stationFilter !== 'All'
  const isSearchActive = isSearchOpen || searchQuery.trim().length > 0
  const isFilterActive = isFilterOpen || hasActiveFilters

  const clearFilters = () => {
    setStatusFilter('All')
    setSeverityFilter('All')
    setStationFilter('All')
  }

  if (isLoading) {
    return <DashboardLayout pageTitle="Incident Command"><div className="p-8 text-center text-subtle">Loading incident queue...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Incident Command"><div className="p-8 text-center text-danger">Unable to load incident data.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Incident Command">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {data.stats.map((stat) => (
          <div key={stat.id} className="kpi-card">
            <div className="label">{stat.label}</div>
            <div className={`value ${stat.tone === 'danger' ? 'text-danger' : stat.tone === 'warning' ? 'text-warning' : stat.tone === 'ok' ? 'text-ok' : ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-subtle">Active Tickets</h3>
            <div className="flex gap-2">
              <button
                className={`p-2 border rounded-lg transition-all ${isFilterActive ? 'border-accent text-accent' : 'border-border hover:border-accent'}`}
                aria-label="Toggle filters"
                onClick={() => setIsFilterOpen((current) => !current)}
              >
                <Filter size={14} />
              </button>
              <button
                className={`p-2 border rounded-lg transition-all ${isSearchActive ? 'border-accent text-accent' : 'border-border hover:border-accent'}`}
                aria-label="Toggle search"
                onClick={() => setIsSearchOpen((current) => !current)}
              >
                <Search size={14} />
              </button>
            </div>
          </div>

          {(isSearchActive || isFilterActive) && (
            <div className="card p-3 space-y-3">
              {isSearchActive && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    className="input pl-9"
                    placeholder="Search by incident ID, type, station, technician..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search incidents"
                  />
                </div>
              )}

              {isFilterActive && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="incident-status-filter" className="form-label">Status</label>
                    <select
                      id="incident-status-filter"
                      className="input"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as 'All' | IncidentRecord['status'])}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Resolving">Resolving</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="incident-severity-filter" className="form-label">Severity</label>
                    <select
                      id="incident-severity-filter"
                      className="input"
                      value={severityFilter}
                      onChange={(event) => setSeverityFilter(event.target.value as 'All' | IncidentRecord['severity'])}
                    >
                      <option value="All">All Severities</option>
                      <option value="Critical">Critical</option>
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="incident-station-filter" className="form-label">Station</label>
                    <select
                      id="incident-station-filter"
                      className="input"
                      value={stationFilter}
                      onChange={(event) => setStationFilter(event.target.value)}
                    >
                      {stationOptions.map((stationName) => (
                        <option key={stationName} value={stationName}>
                          {stationName === 'All' ? 'All Stations' : stationName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-subtle">
                <span>{filteredIncidents.length} of {data.incidents.length} incidents</span>
                {hasActiveFilters && (
                  <button className="btn sm secondary" onClick={clearFilters}>Clear Filters</button>
                )}
              </div>
            </div>
          )}

          {filteredIncidents.length === 0 ? (
            <div className="card border-dashed text-center py-10 text-subtle">
              No incidents match the current search/filter criteria.
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => setActiveIncidentId(incident.id)}
                className={`card flex gap-4 p-4 cursor-pointer transition-all border-l-4 ${incident.severity === 'Critical' ? 'border-l-danger bg-danger/5' : 'border-l-warning'} ${activeIncident?.id === incident.id ? 'ring-2 ring-accent' : 'hover:border-accent'}`}
              >
                <div className={`p-2 rounded-lg h-fit ${incident.severity === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{incident.type}</div>
                      <div className="text-[10px] text-subtle flex items-center gap-1 font-mono uppercase tracking-widest"><MapPin size={10} /> {incident.stationName} • {incident.id}</div>
                    </div>
                    <span className={`pill ${incident.status.toLowerCase()} py-0 px-2 text-[9px]`}>{incident.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-subtle">
                    <span className="flex items-center gap-1"><Clock size={12} /> {incident.reportedAt}</span>
                    {incident.assignedTech && <span className="flex items-center gap-1"><User size={12} /> {incident.assignedTech}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {activeIncident ? (
            <div className="card space-y-6 sticky top-24 border-accent animate-in slide-in-from-right-4 duration-300">
              <div className="section-title flex justify-between">
                <span>Ticket Control</span>
                <span className="text-accent">{activeIncident.id}</span>
              </div>

              <div className="p-4 bg-bg-muted rounded-xl space-y-3">
                <div className="text-xs font-bold uppercase text-subtle">Situation Audit</div>
                <p className="text-[11px] text-subtle leading-relaxed">{activeIncident.situationAudit}</p>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all">
                  <Send size={16} /> Dispatch Technician
                </button>
                <button className="w-full py-2 bg-bg-muted border border-border rounded-lg text-xs font-bold hover:border-accent transition-all text-subtle hover:text-text">
                  Initiate Remote Reboot
                </button>
                <button className="w-full py-2 bg-ok/10 text-ok border border-ok/20 rounded-lg text-xs font-bold hover:bg-ok/20 transition-all">
                  Mark as Resolved
                </button>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="text-[10px] uppercase font-bold text-subtle mb-3">Service Log</div>
                <div className="space-y-4">
                  {activeIncident.serviceLog.map((entry) => (
                    <div key={entry.title} className={`flex gap-3 items-start border-l-2 pl-4 relative ${entry.active ? 'border-accent' : 'border-border'}`}>
                      <div className={`w-2 h-2 rounded-full absolute -left-[5px] top-1 ${entry.active ? 'bg-accent' : 'bg-border'}`} />
                      <div>
                        <div className="text-[10px] font-bold">{entry.title}</div>
                        <div className="text-[9px] text-subtle">{entry.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-[400px] border-dashed flex flex-col items-center justify-center text-center p-8 text-subtle">
              <AlertCircle size={40} className="mb-4 opacity-20" />
              <div className="font-bold">{filteredIncidents.length === 0 ? 'No Matching Tickets' : 'Command Center'}</div>
              <p className="text-xs px-4">
                {filteredIncidents.length === 0
                  ? 'Adjust your search or filters to find incident tickets.'
                  : 'Select an incident from the queue to manage dispatch and resolution.'}
              </p>
            </div>
          )}

          <div className="card bg-accent/5 border-accent/20">
            <div className="section-title text-accent">Predictive Health</div>
            <p className="text-[10px] text-subtle leading-relaxed">{data.predictiveAlert.text}</p>
            <button className="mt-4 text-[10px] font-bold text-accent hover:underline flex items-center gap-1">
              {data.predictiveAlert.cta} <CheckCircle2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
