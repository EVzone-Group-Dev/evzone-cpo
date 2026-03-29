import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useOCPICdrs } from '@/core/hooks/usePlatformData'
import { FileText, Download, Filter, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'

const CDR_STATUS_CLASS = {
  Sent: 'pending',
  Received: 'pending',
  Accepted: 'active',
  Rejected: 'faulted',
  Settled: 'online',
} as const

type CdrStatusFilter = 'All' | keyof typeof CDR_STATUS_CLASS

export function OCPICDRsPage() {
  const [search, setSearch] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<CdrStatusFilter>('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [partnerFilter, setPartnerFilter] = useState('All')
  const { data, isLoading, error } = useOCPICdrs()

  if (isLoading) {
    return <DashboardLayout pageTitle="Charge Detail Records"><div className="p-8 text-center text-subtle">Loading roaming ledger...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Charge Detail Records"><div className="p-8 text-center text-danger">Unable to load roaming ledger.</div></DashboardLayout>
  }

  const searchTerm = search.trim().toLowerCase()
  const countryOptions = ['All', ...Array.from(new Set(data.records.map((record) => record.country))).sort((left, right) => left.localeCompare(right))]
  const partnerOptions = ['All', ...Array.from(new Set(data.records.map((record) => record.emspName))).sort((left, right) => left.localeCompare(right))]
  const hasActiveFilters = statusFilter !== 'All' || countryFilter !== 'All' || partnerFilter !== 'All'
  const isFilterActive = isFilterOpen || hasActiveFilters

  const filteredRecords = data.records.filter((record) => {
    const matchesSearch = !searchTerm || [
      record.id,
      record.sessionId,
      record.emspName,
      record.partyId,
      record.country,
      record.status,
    ].some((value) => value.toLowerCase().includes(searchTerm))
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter
    const matchesCountry = countryFilter === 'All' || record.country === countryFilter
    const matchesPartner = partnerFilter === 'All' || record.emspName === partnerFilter

    return matchesSearch && matchesStatus && matchesCountry && matchesPartner
  })

  const clearFilters = () => {
    setStatusFilter('All')
    setCountryFilter('All')
    setPartnerFilter('All')
  }

  return (
    <DashboardLayout pageTitle="Charge Detail Records">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${metric.tone === 'warning' ? 'text-warning' : metric.tone === 'ok' ? 'text-ok' : ''}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <input
              type="text"
              placeholder="Search by CDR or Partner..."
              className="input pl-10 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`px-4 bg-bg-muted border rounded-lg flex items-center gap-2 text-sm h-10 transition-all ${isFilterActive ? 'border-accent text-accent' : 'border-border hover:border-accent'}`}
            onClick={() => setIsFilterOpen((current) => !current)}
            aria-label="Toggle CDR filters"
          >
            <Filter size={16} /> Filters
          </button>
        </div>
        <button className="px-4 py-2 bg-bg-muted border border-border rounded-lg flex items-center gap-2 text-sm font-bold hover:border-accent transition-all">
          <Download size={16} /> Export Ledger
        </button>
      </div>

      {isFilterActive && (
        <div className="card p-3 mb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="cdr-status-filter" className="form-label">Status</label>
              <select
                id="cdr-status-filter"
                className="input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as CdrStatusFilter)}
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Received">Received</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Settled">Settled</option>
              </select>
            </div>

            <div>
              <label htmlFor="cdr-country-filter" className="form-label">Country</label>
              <select
                id="cdr-country-filter"
                className="input"
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>{country === 'All' ? 'All Countries' : country}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cdr-partner-filter" className="form-label">Partner</label>
              <select
                id="cdr-partner-filter"
                className="input"
                value={partnerFilter}
                onChange={(event) => setPartnerFilter(event.target.value)}
              >
                {partnerOptions.map((partner) => (
                  <option key={partner} value={partner}>{partner === 'All' ? 'All Partners' : partner}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-subtle">
            <span>{filteredRecords.length} of {data.records.length} CDRs</span>
            {hasActiveFilters && (
              <button className="btn sm secondary" onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>CDR ID</th>
              <th>Partner</th>
              <th>Duration / Energy</th>
              <th>Financials</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-subtle">
                  No CDR records match the current search/filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((cdr) => (
                <tr key={cdr.id} className="group hover:bg-bg-muted/30 transition-colors">
                  <td>
                    <div className="font-mono text-xs font-bold text-accent">{cdr.id}</div>
                    <div className="text-[10px] text-subtle">Ref: {cdr.sessionId}</div>
                  </td>
                  <td>
                    <div className="text-sm font-semibold">{cdr.emspName}</div>
                    <div className="text-[10px] text-subtle font-mono uppercase">{cdr.country} / {cdr.partyId}</div>
                  </td>
                  <td>
                    <div className="text-sm">{cdr.kwh} kWh</div>
                    <div className="text-[10px] text-subtle flex items-center gap-1"><Clock size={10} /> 1h 15m</div>
                  </td>
                  <td>
                    <div className="text-sm font-bold">{cdr.currency} {cdr.totalCost}</div>
                    <div className="text-[9px] text-ok uppercase tracking-wider">Verified</div>
                  </td>
                  <td>
                    <span className={`pill ${CDR_STATUS_CLASS[cdr.status]}`}>
                      {cdr.status === 'Settled' && <CheckCircle2 size={10} className="mr-1" />}
                      {cdr.status === 'Rejected' && <AlertTriangle size={10} className="mr-1" />}
                      {cdr.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="p-2 text-subtle hover:text-accent transition-colors" title="View Details">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-bg-muted/50 rounded-xl border border-border flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
          <FileText className="text-accent" size={20} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider">Automated Settlement</div>
          <p className="text-[10px] text-subtle">{data.automation.text}</p>
        </div>
        <button className="px-4 py-2 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20 hover:bg-accent/20 transition-all">
          {data.automation.cta}
        </button>
      </div>
    </DashboardLayout>
  )
}
