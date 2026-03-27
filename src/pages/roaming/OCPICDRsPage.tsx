import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FileText, Download, Filter, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'

interface CDR {
  id: string
  sessionId: string
  emspName: string
  partyId: string
  country: string
  start: string
  end: string
  kwh: number
  totalCost: string
  currency: string
  status: 'Sent' | 'Received' | 'Accepted' | 'Rejected' | 'Settled'
}

const MOCK_CDRS: CDR[] = [
  { id: 'CDR-29481', sessionId: 'SES-9120', emspName: 'Plugsurfing', partyId: 'PLG', country: 'NL', start: '2024-03-27 10:15', end: '2024-03-27 11:20', kwh: 42.5, totalCost: '1,240.00', currency: 'KES', status: 'Settled' },
  { id: 'CDR-29482', sessionId: 'SES-9125', emspName: 'Hubject', partyId: 'HBJ', country: 'DE', start: '2024-03-27 14:02', end: '2024-03-27 14:45', kwh: 18.2, totalCost: '546.00', currency: 'KES', status: 'Accepted' },
  { id: 'CDR-29483', sessionId: 'SES-9128', emspName: 'New Motion', partyId: 'TNM', country: 'NL', start: '2024-03-27 16:30', end: '2024-03-27 17:10', kwh: 31.0, totalCost: '930.00', currency: 'KES', status: 'Sent' },
  { id: 'CDR-29484', sessionId: 'SES-9130', emspName: 'Public Charge', partyId: 'PBC', country: 'KE', start: '2024-03-27 18:00', end: '2024-03-27 19:15', kwh: 55.4, totalCost: '1,662.00', currency: 'KES', status: 'Rejected' },
]

export function OCPICDRsPage() {
  const [search, setSearch] = useState('')

  return (
    <DashboardLayout pageTitle="Charge Detail Records">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Total CDRs</div><div className="value">1,248</div></div>
        <div className="kpi-card"><div className="label">Awaiting Settlement</div><div className="value text-warning">142</div></div>
        <div className="kpi-card"><div className="label">Total Revenue (R)</div><div className="value">KES 842K</div></div>
        <div className="kpi-card"><div className="label">Error Rate</div><div className="value text-ok">0.4%</div></div>
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
            <button className="px-4 bg-bg-muted border border-border rounded-lg flex items-center gap-2 text-sm h-10 hover:border-accent transition-all">
               <Filter size={16} /> Filters
            </button>
         </div>
         <button className="px-4 py-2 bg-bg-muted border border-border rounded-lg flex items-center gap-2 text-sm font-bold hover:border-accent transition-all">
            <Download size={16} /> Export Ledger
         </button>
      </div>

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
              {MOCK_CDRS.map(cdr => (
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
                      <span className={`pill ${cdr.status.toLowerCase()}`}>
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
              ))}
           </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-bg-muted/50 rounded-xl border border-border flex items-center gap-4">
         <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
            <FileText className="text-accent" size={20} />
         </div>
         <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider">Automated Settlement</div>
            <p className="text-[10px] text-subtle">
               CDRs are automatically shared with roaming partners via OCPI upon session completion. 
               Settlement cycles follow the B2B agreement protocols (Daily/Weekly).
            </p>
         </div>
         <button className="px-4 py-2 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20 hover:bg-accent/20 transition-all">
            Review Rules
         </button>
      </div>
    </DashboardLayout>
  )
}
