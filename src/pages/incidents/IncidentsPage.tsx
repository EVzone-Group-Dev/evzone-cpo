import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AlertCircle, Clock, CheckCircle2, User, MapPin, Send, AlertTriangle, Filter, Search } from 'lucide-react'

interface Incident {
  id: string
  stationId: string
  stationName: string
  type: 'Hardware Failure' | 'Communication Loss' | 'Power Surge' | 'Vandalism'
  severity: 'Critical' | 'Major' | 'Minor'
  status: 'Open' | 'Dispatched' | 'Resolving' | 'Closed'
  reportedAt: string
  assignedTech?: string
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-2041', stationId: 'LOC-1', stationName: 'Westlands Hub', type: 'Communication Loss', severity: 'Major', status: 'Dispatched', reportedAt: '20m ago', assignedTech: 'David Karanja' },
  { id: 'INC-2042', stationId: 'LOC-4', stationName: 'CBD Central', type: 'Hardware Failure', severity: 'Critical', status: 'Open', reportedAt: '5m ago' },
  { id: 'INC-2035', stationId: 'LOC-9', stationName: 'Karen Eco Park', type: 'Vandalism', severity: 'Minor', status: 'Closed', reportedAt: '2h ago', assignedTech: 'Sarah M.' },
]

export function IncidentsPage() {
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null)

  return (
    <DashboardLayout pageTitle="Incident Command">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card"><div className="label">Open Incidents</div><div className="value text-danger">12</div></div>
        <div className="kpi-card"><div className="label">Avg Response</div><div className="value">18m</div></div>
        <div className="kpi-card"><div className="label">Dispatched</div><div className="value text-warning">5</div></div>
        <div className="kpi-card"><div className="label">SLA Compliance</div><div className="value text-ok">94%</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incident List */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-subtle">Active Tickets</h3>
              <div className="flex gap-2">
                 <button className="p-2 border border-border rounded-lg hover:border-accent transition-all"><Filter size={14} /></button>
                 <button className="p-2 border border-border rounded-lg hover:border-accent transition-all"><Search size={14} /></button>
              </div>
           </div>

           {MOCK_INCIDENTS.map(inc => (
             <div 
               key={inc.id} 
               onClick={() => setActiveIncident(inc)}
               className={`card flex gap-4 p-4 cursor-pointer transition-all border-l-4 ${inc.severity === 'Critical' ? 'border-l-danger bg-danger/5' : 'border-l-warning'} ${activeIncident?.id === inc.id ? 'ring-2 ring-accent' : 'hover:border-accent'}`}
             >
                <div className={`p-2 rounded-lg h-fit ${inc.severity === 'Critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                   <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-bold">{inc.type}</div>
                         <div className="text-[10px] text-subtle flex items-center gap-1 font-mono uppercase tracking-widest"><MapPin size={10} /> {inc.stationName} • {inc.id}</div>
                      </div>
                      <span className={`pill ${inc.status.toLowerCase()} py-0 px-2 text-[9px]`}>{inc.status}</span>
                   </div>
                   <div className="mt-3 flex items-center gap-4 text-[10px] text-subtle">
                      <span className="flex items-center gap-1"><Clock size={12} /> {inc.reportedAt}</span>
                      {inc.assignedTech && <span className="flex items-center gap-1"><User size={12} /> {inc.assignedTech}</span>}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1 space-y-6">
           {activeIncident ? (
             <div className="card space-y-6 sticky top-24 border-accent animate-in slide-in-from-right-4 duration-300">
                <div className="section-title flex justify-between">
                   <span>Ticket Control</span>
                   <span className="text-accent">{activeIncident.id}</span>
                </div>
                
                <div className="p-4 bg-bg-muted rounded-xl space-y-3">
                   <div className="text-xs font-bold uppercase text-subtle">Situation Audit</div>
                   <p className="text-[11px] text-subtle leading-relaxed">
                      Sensors detected a drop in grid voltage at {activeIncident.stationName}. External diagnostics indicate a possible hardware breakdown in Cabinet #1.
                   </p>
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
                      <div className="flex gap-3 items-start border-l-2 border-accent pl-4 relative">
                         <div className="w-2 h-2 rounded-full bg-accent absolute -left-[5px] top-1" />
                         <div>
                            <div className="text-[10px] font-bold">Technician Assigned</div>
                            <div className="text-[9px] text-subtle">Assigning David K. to the ticket.</div>
                         </div>
                      </div>
                      <div className="flex gap-3 items-start border-l-2 border-border pl-4 relative">
                         <div className="w-2 h-2 rounded-full bg-border absolute -left-[5px] top-1" />
                         <div>
                            <div className="text-[10px] font-bold">Ticket Created</div>
                            <div className="text-[9px] text-subtle">Automated alert triggered by telemetry loss.</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="card h-[400px] border-dashed flex flex-col items-center justify-center text-center p-8 text-subtle">
                <AlertCircle size={40} className="mb-4 opacity-20" />
                <div className="font-bold">Command Center</div>
                <p className="text-xs px-4">Select an incident from the queue to manage dispatch and resolution.</p>
             </div>
           )}

           <div className="card bg-accent/5 border-accent/20">
              <div className="section-title text-accent">Predictive Health</div>
              <p className="text-[10px] text-subtle leading-relaxed">
                 Based on heat signatures, Station [LOC-2] is at risk of a major connector fault within the next 48 hours.
              </p>
              <button className="mt-4 text-[10px] font-bold text-accent hover:underline flex items-center gap-1">
                 Schedule Maintenance <CheckCircle2 size={12} />
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
