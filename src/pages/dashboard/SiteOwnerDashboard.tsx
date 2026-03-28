import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSiteOwnerDashboard } from '@/core/hooks/usePlatformData'
import { DollarSign, Zap, Clock, TrendingUp, MapPin, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const METRIC_ICONS = {
  revenue: <DollarSign size={16} />,
  uptime: <Zap size={16} />,
  utilisation: <TrendingUp size={16} />,
  energy: <Clock size={16} />,
} as const

const METRIC_ACCENTS = {
  revenue: {
    badge: 'bg-accent/10 text-accent',
    card: 'border-l-accent',
  },
  uptime: {
    badge: 'bg-ok/10 text-ok',
    card: 'border-l-ok',
  },
  utilisation: {
    badge: 'bg-warning/10 text-warning',
    card: 'border-l-warning',
  },
  energy: {
    badge: 'bg-accent/10 text-accent',
    card: 'border-l-accent',
  },
} as const

export function SiteOwnerDashboard() {
  const { data, isLoading, error } = useSiteOwnerDashboard()

  if (isLoading) {
    return <DashboardLayout pageTitle="Property Overview"><div className="p-8 text-center text-subtle">Loading property portfolio...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Property Overview"><div className="p-8 text-center text-danger">Unable to load site owner dashboard.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Property Overview">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">{data.title}</h2>
            <p className="text-xs text-subtle">{data.subtitle}</p>
         </div>
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-bg-muted border border-border rounded-lg text-xs font-bold hover:border-accent transition-all">Monthly Report</button>
            <button className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold shadow-lg shadow-accent/20 hover:brightness-110 transition-all">Request Payout</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {data.metrics.map((metric) => {
          const accent = METRIC_ACCENTS[metric.id]
          const toneClass = metric.trend === 'up' ? 'text-ok' : metric.trend === 'down' ? 'text-danger' : 'text-subtle'
          const directionIcon = metric.trend === 'up' ? <ArrowUpRight size={12} /> : metric.trend === 'down' ? <ArrowDownRight size={12} /> : null

          return (
            <div key={metric.id} className={`card border-l-4 p-5 ${accent.card}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="label">{metric.label}</div>
                <div className={`p-1.5 rounded-lg ${accent.badge}`}>{METRIC_ICONS[metric.id]}</div>
              </div>
              <div className="value">{metric.value}</div>
              <div className={`text-[10px] mt-2 flex items-center gap-1 font-bold ${toneClass}`}>
                {directionIcon}
                {metric.delta}
                <span className="text-subtle font-normal">{metric.note}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="card h-[400px] flex flex-col">
               <div className="section-title">Revenue Distribution (7 Days)</div>
               <div className="flex-1 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueData}>
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
                     {data.topUnits.map((unit) => (
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
               <div className="section-title text-accent">{data.optimizationTip.title}</div>
               <p className="text-[11px] leading-relaxed text-subtle">
                  {data.optimizationTip.text}
               </p>
               <button className="mt-4 text-accent text-[10px] font-bold hover:underline">{data.optimizationTip.cta}</button>
            </div>

            <div className="card">
               <div className="section-title">Site Alerts</div>
               <div className="mt-4 space-y-4">
                  {data.alerts.map((alert) => (
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
