import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DollarSign, Zap, Clock, TrendingUp, MapPin, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const revenueData = [
  { day: 'Mon', rev: 1200 },
  { day: 'Tue', rev: 1800 },
  { day: 'Wed', rev: 1400 },
  { day: 'Thu', rev: 2200 },
  { day: 'Fri', rev: 2800 },
  { day: 'Sat', rev: 3200 },
  { day: 'Sun', rev: 2100 },
]

export function SiteOwnerDashboard() {
  return (
    <DashboardLayout pageTitle="Property Overview">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Westlands Mall Portfolio</h2>
            <p className="text-xs text-subtle">Real-time performance for your hosted charging infrastructure.</p>
         </div>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-bg-muted border border-border rounded-lg text-xs font-bold hover:border-accent transition-all">Monthly Report</button>
            <button className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold shadow-lg shadow-accent/20 hover:brightness-110 transition-all">Request Payout</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card border-l-4 border-l-accent p-5">
           <div className="flex justify-between items-start mb-2">
              <div className="label">Total Revenue</div>
              <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><DollarSign size={16} /></div>
           </div>
           <div className="value">KES 14.8K</div>
           <div className="text-[10px] text-ok mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight size={12} /> +18.4%
              <span className="text-subtle font-normal">vs last week</span>
           </div>
        </div>
        <div className="card border-l-4 border-l-ok p-5">
           <div className="flex justify-between items-start mb-2">
              <div className="label">Uptime Avg</div>
              <div className="p-1.5 bg-ok/10 rounded-lg text-ok"><Zap size={16} /></div>
           </div>
           <div className="value">99.8%</div>
           <div className="text-[10px] text-ok mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight size={12} /> +0.2%
              <span className="text-subtle font-normal">SLA Compliant</span>
           </div>
        </div>
        <div className="card border-l-4 border-l-warning p-5">
           <div className="flex justify-between items-start mb-2">
              <div className="label">Utilisation</div>
              <div className="p-1.5 bg-warning/10 rounded-lg text-warning"><TrendingUp size={16} /></div>
           </div>
           <div className="value">42%</div>
           <div className="text-[10px] text-danger mt-2 flex items-center gap-1 font-bold">
              <ArrowDownRight size={12} /> -5.1%
              <span className="text-subtle font-normal">Peak: 12pm-4pm</span>
           </div>
        </div>
        <div className="card border-l-4 border-l-accent p-5">
           <div className="flex justify-between items-start mb-2">
              <div className="label">Total Energy</div>
              <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><Clock size={16} /></div>
           </div>
           <div className="value">1.2 MWh</div>
           <div className="text-[10px] text-subtle mt-2 flex items-center gap-1">
              Active since Nov 2023
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="card h-[400px] flex flex-col">
               <div className="section-title">Revenue Distribution (7 Days)</div>
               <div className="flex-1 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'var(--bg-muted)', opacity: 0.1 }}
                        contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px' }}
                      />
                      <Bar dataKey="rev" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="card p-0 overflow-hidden">
               <div className="p-5 border-b border-border bg-bg-muted/10 flex justify-between items-center">
                  <h3 className="text-sm font-bold">Top Performing Units</h3>
                  <button className="text-subtle hover:text-text"><MoreHorizontal size={16} /></button>
               </div>
               <table className="table">
                  <thead>
                     <tr>
                        <th>Station ID</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Sessions</th>
                        <th className="text-right">Revenue</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[
                       { id: 'W-001', loc: 'Entrance A (Level 1)', status: 'Online', sessions: 142, rev: '4,280' },
                       { id: 'W-002', loc: 'Basement Parking 1', status: 'Online', sessions: 98, rev: '3,120' },
                       { id: 'W-003', loc: 'East Wing Premium', status: 'Online', sessions: 155, rev: '5,400' },
                     ].map(unit => (
                       <tr key={unit.id} className="hover:bg-bg-muted/30 transition-colors">
                          <td className="font-mono text-[10px] font-bold text-accent">{unit.id}</td>
                          <td className="text-xs font-semibold">{unit.loc}</td>
                          <td><span className="pill online border-none py-0 px-2 text-[9px] uppercase">Online</span></td>
                          <td className="text-xs">{unit.sessions}</td>
                          <td className="text-right font-bold text-xs">KES {unit.rev}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-8">
            <div className="card bg-accent/5 border-accent/20">
               <div className="section-title text-accent">Optimization Tip</div>
               <p className="text-[11px] leading-relaxed text-subtle">
                  Stations in <strong>Entrance A</strong> are reaching 90% capacity between 5 PM and 7 PM. 
                  Increasing your tariff by 10% during peak hours could generate an additional KES 2.5K/week.
               </p>
               <button className="mt-4 text-accent text-[10px] font-bold hover:underline">Apply Smart Pricing</button>
            </div>

            <div className="card">
               <div className="section-title">Site Alerts</div>
               <div className="mt-4 space-y-4">
                  {[
                    { id: 1, type: 'Issue', msg: 'W-002: Communication lag detected.', time: '2h ago' },
                    { id: 2, type: 'Info', msg: 'Monthly settlement is ready for review.', time: '1d ago' },
                  ].map(alert => (
                    <div key={alert.id} className="flex gap-3 items-start p-3 bg-bg-muted/50 rounded-lg border border-border">
                       <MapPin className={alert.type === 'Issue' ? 'text-danger' : 'text-accent'} size={14} />
                       <div>
                          <div className="text-[10px] font-bold">{alert.msg}</div>
                          <div className="text-[9px] text-subtle">{alert.time}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </DashboardLayout>
  )
}
