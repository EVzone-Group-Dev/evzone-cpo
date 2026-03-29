import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useReports } from '@/core/hooks/usePlatformData'
import { FileBarChart, Download, Calendar, Mail, FileText, CheckCircle2, ChevronRight, Filter, Search } from 'lucide-react'

function toRelativeMinutes(label: string) {
  const normalized = label.trim().toLowerCase()
  const match = normalized.match(/(\d+)\s*([mhd])/)
  if (!match) {
    return null
  }

  const value = Number(match[1])
  if (!Number.isFinite(value)) {
    return null
  }

  if (match[2] === 'h') {
    return value * 60
  }

  if (match[2] === 'd') {
    return value * 24 * 60
  }

  return value
}

export function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplateOverride, setSelectedTemplateOverride] = useState<string | null>(null)
  const [selectedPeriodOverride, setSelectedPeriodOverride] = useState<string | null>(null)
  const [isExportFiltersOpen, setIsExportFiltersOpen] = useState(false)
  const [exportSearch, setExportSearch] = useState('')
  const [exportTypeFilter, setExportTypeFilter] = useState('All')
  const [exportWindowFilter, setExportWindowFilter] = useState<'All' | 'Last 30m' | 'Last 1h' | 'Last 24h'>('All')
  const { data, isLoading, error } = useReports()

  if (isLoading) {
    return <DashboardLayout pageTitle="Analytics & Reports"><div className="p-8 text-center text-subtle">Loading reporting workspace...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Analytics & Reports"><div className="p-8 text-center text-danger">Unable to load reporting workspace.</div></DashboardLayout>
  }

  const selectedTemplate = selectedTemplateOverride ?? data.templates[0]?.id ?? ''
  const selectedPeriod = selectedPeriodOverride ?? data.periods[0] ?? ''
  const exportTypeOptions = ['All', ...Array.from(new Set(data.recentExports.map((report) => report.type))).sort((left, right) => left.localeCompare(right))]
  const hasActiveExportFilters = exportTypeFilter !== 'All' || exportWindowFilter !== 'All' || exportSearch.trim().length > 0
  const isExportFilterActive = isExportFiltersOpen || hasActiveExportFilters

  const filteredExports = data.recentExports.filter((report) => {
    const searchTerm = exportSearch.trim().toLowerCase()
    const matchesSearch = !searchTerm || report.name.toLowerCase().includes(searchTerm) || report.type.toLowerCase().includes(searchTerm)
    const matchesType = exportTypeFilter === 'All' || report.type === exportTypeFilter
    const relativeMinutes = toRelativeMinutes(report.time)
    const maxAgeMinutes = exportWindowFilter === 'Last 30m'
      ? 30
      : exportWindowFilter === 'Last 1h'
        ? 60
        : exportWindowFilter === 'Last 24h'
          ? 24 * 60
          : null
    const matchesWindow = maxAgeMinutes === null || (relativeMinutes !== null && relativeMinutes <= maxAgeMinutes)

    return matchesSearch && matchesType && matchesWindow
  })

  const clearExportFilters = () => {
    setExportSearch('')
    setExportTypeFilter('All')
    setExportWindowFilter('All')
  }

  return (
    <DashboardLayout pageTitle="Analytics & Reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="section-title flex items-center gap-2"><FileBarChart size={16} className="text-accent" /> Report Builder</div>
            <p className="text-[11px] text-subtle mb-6">Generate standardized telemetry and financial exports for auditing or B2B settlement.</p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Template Type</label>
                <select className="input h-10" value={selectedTemplate} onChange={(e) => setSelectedTemplateOverride(e.target.value)}>
                  {data.templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Period</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={16} />
                  <select className="input pl-10 h-10 appearance-none" value={selectedPeriod} onChange={(e) => setSelectedPeriodOverride(e.target.value)}>
                    {data.periods.map((period) => (
                      <option key={period}>{period}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 bg-bg-muted border border-accent rounded-lg text-[10px] font-bold">CSV (Data)</button>
                  <button className="py-2 bg-bg-muted border border-border rounded-lg text-[10px] font-bold text-subtle hover:border-accent">PDF (Layout)</button>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => { setIsGenerating(true); setTimeout(() => setIsGenerating(false), 2000) }}
                  className="w-full py-3 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? <Download size={16} className="animate-bounce" /> : <Download size={16} />}
                  {isGenerating ? 'Compiling Dataset...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title flex items-center gap-2"><Mail size={16} className="text-accent" /> Scheduled Emails</div>
            {data.scheduledEmails.map((schedule) => (
              <div key={schedule.label} className="mt-4 p-3 bg-bg-muted/50 rounded-lg border border-border flex justify-between items-center group cursor-pointer hover:border-accent transition-all">
                <div className="text-xs">{schedule.label}</div>
                <div className={`text-[10px] font-bold ${schedule.enabled ? 'text-ok' : 'text-subtle'}`}>{schedule.enabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            ))}
            <button className="w-full mt-4 py-2 border border-dashed border-border rounded-lg text-[10px] font-bold text-subtle hover:border-accent transition-all">+ Add Schedule</button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-subtle">Recent Exports</h3>
            <button
              className={`p-2 border rounded-lg transition-all ${isExportFilterActive ? 'border-accent text-accent' : 'border-border hover:border-accent'}`}
              onClick={() => setIsExportFiltersOpen((current) => !current)}
              aria-label="Toggle export filters"
            >
              <Filter size={14} />
            </button>
          </div>

          {isExportFilterActive && (
            <div className="card p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    className="input pl-9"
                    placeholder="Search export name..."
                    value={exportSearch}
                    onChange={(event) => setExportSearch(event.target.value)}
                    aria-label="Search exports"
                  />
                </div>
                <div>
                  <label htmlFor="export-type-filter" className="form-label">Export Type</label>
                  <select
                    id="export-type-filter"
                    className="input"
                    value={exportTypeFilter}
                    onChange={(event) => setExportTypeFilter(event.target.value)}
                  >
                    {exportTypeOptions.map((type) => (
                      <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="export-window-filter" className="form-label">Time Window</label>
                  <select
                    id="export-window-filter"
                    className="input"
                    value={exportWindowFilter}
                    onChange={(event) => setExportWindowFilter(event.target.value as 'All' | 'Last 30m' | 'Last 1h' | 'Last 24h')}
                  >
                    <option value="All">Any Time</option>
                    <option value="Last 30m">Last 30m</option>
                    <option value="Last 1h">Last 1h</option>
                    <option value="Last 24h">Last 24h</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-subtle">
                <span>{filteredExports.length} of {data.recentExports.length} exports</span>
                {hasActiveExportFilters && (
                  <button className="btn sm secondary" onClick={clearExportFilters}>Clear Filters</button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredExports.length === 0 ? (
              <div className="card border-dashed text-center py-10 text-subtle">
                No exports match the current filters.
              </div>
            ) : (
              filteredExports.map((report) => (
                <div key={report.name} className="card p-4 flex items-center gap-4 group hover:border-accent transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-bg-muted flex items-center justify-center text-subtle group-hover:text-accent group-hover:bg-accent/10 transition-all">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{report.name}</div>
                    <div className="flex gap-4 text-[10px] text-subtle">
                      <span className="uppercase tracking-widest">{report.type}</span>
                      <span>{report.size}</span>
                      <span>{report.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-ok" />
                    <ChevronRight size={16} className="text-subtle group-hover:text-text transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
