import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useReports } from '@/core/hooks/usePlatformData'
import { FileBarChart, Download, Calendar, Mail, FileText, CheckCircle2, ChevronRight, Filter } from 'lucide-react'

export function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplateOverride, setSelectedTemplateOverride] = useState<string | null>(null)
  const [selectedPeriodOverride, setSelectedPeriodOverride] = useState<string | null>(null)
  const { data, isLoading, error } = useReports()

  if (isLoading) {
    return <DashboardLayout pageTitle="Analytics & Reports"><div className="p-8 text-center text-subtle">Loading reporting workspace...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Analytics & Reports"><div className="p-8 text-center text-danger">Unable to load reporting workspace.</div></DashboardLayout>
  }

  const selectedTemplate = selectedTemplateOverride ?? data.templates[0]?.id ?? ''
  const selectedPeriod = selectedPeriodOverride ?? data.periods[0] ?? ''

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
            <button className="p-2 border border-border rounded-lg hover:border-accent transition-all"><Filter size={14} /></button>
          </div>

          <div className="space-y-3">
            {data.recentExports.map((report) => (
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
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
