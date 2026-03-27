import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Play, Square, Unlock, ShieldAlert, Send, RefreshCw, Smartphone } from 'lucide-react'

interface CommandLog {
  id: string
  time: string
  command: string
  partner: string
  status: 'Accepted' | 'Rejected' | 'Timed Out'
  payload: string
}

export function OCPICommandsPage() {
  const [logs] = useState<CommandLog[]>([
    { id: '1', time: '14:20:10', command: 'START_SESSION', partner: 'Plugsurfing', status: 'Accepted', payload: '{ "location_id": "LOC-1", "evse_uid": "E1" }' },
    { id: '2', time: '14:25:45', command: 'STOP_SESSION', partner: 'Hubject', status: 'Rejected', payload: '{ "session_id": "SES-91" }' },
  ])

  const [isSimulating, setIsSimulating] = useState(false)

  return (
    <DashboardLayout pageTitle="eMSP Command Simulator">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
           <div className="card border-l-4 border-l-accent">
              <div className="section-title flex items-center gap-2"><Smartphone size={16} className="text-accent" /> Inbound Simulation</div>
              <p className="text-[11px] text-subtle mb-6">Test the platform's response to incoming OCPI 2.2.1 commands from remote eMSP applications.</p>
              
              <div className="space-y-4">
                 <div>
                    <label className="form-label">Target Partner</label>
                    <select className="input h-10">
                       <option>Plugsurfing (PLG)</option>
                       <option>Hubject (HBJ)</option>
                       <option>New Motion (TNM)</option>
                    </select>
                 </div>
                 <div>
                    <label className="form-label">Remote Command Type</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button className="py-2 bg-accent/10 text-accent text-[10px] font-bold rounded-lg border border-accent/20 hover:bg-accent/20 transition-all flex items-center justify-center gap-2">
                          <Play size={12} /> START
                       </button>
                       <button className="py-2 bg-danger/10 text-danger text-[10px] font-bold rounded-lg border border-danger/20 hover:bg-danger/20 transition-all flex items-center justify-center gap-2">
                          <Square size={12} /> STOP
                       </button>
                       <button className="py-2 bg-bg-muted text-text text-[10px] font-bold rounded-lg border border-border hover:border-accent transition-all flex items-center justify-center gap-2">
                          <Unlock size={12} /> UNLOCK
                       </button>
                       <button className="py-2 bg-bg-muted text-text text-[10px] font-bold rounded-lg border border-border hover:border-accent transition-all flex items-center justify-center gap-2">
                          <ShieldAlert size={12} /> RESERVE
                       </button>
                    </div>
                 </div>
                 <div className="pt-4">
                    <button 
                       onClick={() => { setIsSimulating(true); setTimeout(() => setIsSimulating(false), 2000); }}
                       className="w-full py-3 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
                    >
                       {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                       Fire OCPI Command
                    </button>
                 </div>
              </div>
           </div>

           <div className="card bg-warning/5 border-warning/20">
              <div className="section-title text-warning">Safety Protocol</div>
              <p className="text-[10px] leading-relaxed text-subtle">
                 Remote commands bypass local RFID validation. Ensure the eMSP Token is whitelisted or real-time authorized before execution.
              </p>
           </div>
        </div>

        {/* Log Terminal */}
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col h-[500px]">
           <div className="p-4 border-b border-border bg-bg-muted/30 flex justify-between items-center">
              <h3 className="font-bold text-sm">Real-time Command Pipeline</h3>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                 <span className="text-[9px] uppercase font-bold text-subtle tracking-widest">Listening...</span>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto font-mono text-[11px] p-0">
              <table className="table border-none">
                 <thead className="sticky top-0 bg-bg-card shadow-sm z-10">
                    <tr className="border-b border-border/50">
                       <th className="py-2 pl-4">Timestamp</th>
                       <th className="py-2">Command</th>
                       <th className="py-2">Partner</th>
                       <th className="py-2">Status</th>
                       <th className="py-2 text-right pr-4">Payload</th>
                    </tr>
                 </thead>
                 <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-border/20 last:border-b-0 hover:bg-bg-muted/20 transition-all">
                         <td className="py-3 pl-4 text-subtle">{log.time}</td>
                         <td><span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[10px] font-bold">{log.command}</span></td>
                         <td className="font-semibold">{log.partner}</td>
                         <td><span className={`text-[10px] font-bold ${log.status === 'Accepted' ? 'text-ok' : 'text-danger'}`}>{log.status}</span></td>
                         <td className="text-right pr-4 text-subtle truncate max-w-[200px]" title={log.payload}>{log.payload}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
