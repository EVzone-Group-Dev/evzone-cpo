import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Globe, ArrowDownLeft, ArrowUpRight, Zap, Clock, ShieldCheck, Search } from 'lucide-react'

interface RoamingSession {
  id: string
  stationName: string
  emspName: string
  partyId: string
  status: 'Active' | 'Completed' | 'Authorized'
  startTime: string
  energy: number
  amount: string
}

const MOCK_ROAMING_SESSIONS: RoamingSession[] = [
  { id: 'RS-901', stationName: 'Westlands Hub', emspName: 'Plugsurfing', partyId: 'PLG', status: 'Active', startTime: '10m ago', energy: 12.5, amount: 'KES 375' },
  { id: 'RS-902', stationName: 'CBD Station', emspName: 'Hubject', partyId: 'HBJ', status: 'Active', startTime: '45m ago', energy: 34.2, amount: 'KES 1,026' },
  { id: 'RS-890', stationName: 'Westlands Hub', emspName: 'New Motion', partyId: 'TNM', status: 'Completed', startTime: '2h ago', energy: 50.0, amount: 'KES 1,500' },
]

export function RoamingSessionsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all')

  return (
    <DashboardLayout pageTitle="Roaming Operations">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-l-accent flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent"><ArrowDownLeft size={24} /></div>
           <div>
              <div className="label">Incoming Traffic</div>
              <div className="value">KES 124K</div>
              <div className="text-[10px] text-ok mt-1">+12% vs last month</div>
           </div>
        </div>
        <div className="card border-l-4 border-l-ok flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-ok/10 flex items-center justify-center text-ok"><ShieldCheck size={24} /></div>
           <div>
              <div className="label">Authorized Tokens</div>
              <div className="value">842</div>
              <div className="text-[10px] text-subtle mt-1">Cross-platform verified</div>
           </div>
        </div>
        <div className="card border-l-4 border-l-warning flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning"><Zap size={24} /></div>
           <div>
              <div className="label">Roaming Utilization</div>
              <div className="value">34%</div>
              <div className="text-[10px] text-subtle mt-1">Grid share: 450 kW</div>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
         <div className="flex bg-bg-muted rounded-lg p-1 border border-border">
            {['all', 'active', 'pending'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-accent text-white' : 'text-subtle hover:text-text'}`}
              >
                {tab}
              </button>
            ))}
         </div>
         <div className="flex gap-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={14} />
               <input type="text" className="input pl-9 h-9 text-xs w-64" placeholder="Filter by Token or Partner..." />
            </div>
            <button className="px-4 bg-bg-muted border border-border rounded-lg text-xs font-bold hover:border-accent h-9 transition-all">Download Audit</button>
         </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
           <thead>
              <tr>
                 <th>Session ID</th>
                 <th>Asset / Station</th>
                 <th>eMSP Auth Provider</th>
                 <th>Start Time</th>
                 <th>Telemetry</th>
                 <th>Total</th>
                 <th>Status</th>
              </tr>
           </thead>
           <tbody>
              {MOCK_ROAMING_SESSIONS.map(s => (
                <tr key={s.id} className="hover:bg-bg-muted/30 transition-colors cursor-pointer">
                   <td className="font-mono text-[11px] font-bold text-accent">{s.id}</td>
                   <td>
                      <div className="text-sm font-semibold">{s.stationName}</div>
                      <div className="text-[10px] text-subtle uppercase">Connector #1</div>
                   </td>
                   <td>
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded bg-bg-muted flex items-center justify-center text-[8px] font-bold border border-border">{s.partyId}</div>
                         <div className="text-xs">{s.emspName}</div>
                      </div>
                   </td>
                   <td><div className="text-xs text-subtle flex items-center gap-1"><Clock size={12} /> {s.startTime}</div></td>
                   <td>
                      <div className="text-xs font-semibold">{s.energy} kWh</div>
                      <div className="w-24 h-1 bg-bg-muted rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-accent animate-pulse" style={{ width: '60%' }} />
                      </div>
                   </td>
                   <td><div className="font-bold text-xs">{s.amount}</div></td>
                   <td><span className={`pill ${s.status.toLowerCase()}`}>{s.status}</span></td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
         <div className="card bg-bg-muted/20 min-w-[300px] flex-1">
            <div className="section-title text-[10px] text-accent"><Globe size={14} /> Regional Reach</div>
            <div className="mt-4 space-y-3">
               {[
                 { region: 'East Africa (KE/TZ)', count: 420 },
                 { region: 'European Roaming', count: 1250 },
                 { region: 'Bilateral Direct', count: 15 },
               ].map(r => (
                 <div key={r.region} className="flex justify-between items-center text-[11px]">
                    <span className="text-subtle">{r.region}</span>
                    <span className="font-bold">{r.count} Sessions</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="card bg-bg-muted/20 min-w-[300px] flex-1">
            <div className="section-title text-[10px] text-warning"><ArrowUpRight size={14} /> Settlement Aging</div>
            <div className="mt-4 flex items-end gap-2 h-16 px-4">
               {[30, 50, 70, 40, 90, 60, 40].map((h, i) => (
                 <div key={i} className="flex-1 bg-warning/20 border-t-2 border-warning group-hover:bg-warning transition-all" style={{ height: `${h}%` }} />
               ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-subtle uppercase">
               <span>Week 1</span>
               <span>Today</span>
            </div>
         </div>
      </div>
    </DashboardLayout>
  )
}
