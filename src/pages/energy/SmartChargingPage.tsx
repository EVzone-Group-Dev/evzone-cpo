import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSmartCharging } from '@/core/hooks/usePlatformData'
import { Zap, Activity, PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const DISTRIBUTION_COLORS = {
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  warning: 'var(--warning)',
} as const

export function SmartChargingPage() {
  const [loadBalancing, setLoadBalancing] = useState(true)
  const [peakShaving, setPeakShaving] = useState(true)
  const [v2gEnabled, setV2gEnabled] = useState(false)
  const [maxGridOverride, setMaxGridOverride] = useState<number | null>(null)
  const [selectedStrategyOverride, setSelectedStrategyOverride] = useState<string | null>(null)
  const { data, isLoading, error } = useSmartCharging()

  if (isLoading) {
    return <DashboardLayout pageTitle="Smart Charging"><div className="p-8 text-center text-subtle">Loading smart charging controls...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Smart Charging"><div className="p-8 text-center text-danger">Unable to load smart charging data.</div></DashboardLayout>
  }

  const currentLoad = data.distribution.reduce((total, item) => total + item.val, 0)
  const activeSessions = data.metrics.find((metric) => metric.id === 'sessions')?.value ?? '0'
  const maxGridKw = maxGridOverride ?? data.loadProfile[0]?.cap ?? 180
  const selectedStrategy = selectedStrategyOverride ?? data.optimizer.selectedStrategy
  const percentage = maxGridKw === 0 ? 0 : Math.round((currentLoad / maxGridKw) * 100)

  return (
    <DashboardLayout pageTitle="Smart Charging">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Current Load</div><div className="value">{currentLoad} kW</div></div>
        <div className="kpi-card"><div className="label">Grid Cap</div><div className="value">{maxGridKw} kW</div></div>
        <div className="kpi-card"><div className="label">Utilisation</div><div className="value" style={{ color: percentage > 85 ? 'var(--danger)' : 'var(--ok)' }}>{percentage}%</div></div>
        <div className="kpi-card"><div className="label">Active Sessions</div><div className="value">{activeSessions}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card h-[400px]">
            <div className="section-title flex justify-between items-center">
              <div className="flex items-center gap-2"><Activity size={16} className="text-accent" /> Grid Load Profile (24h)</div>
              <div className="text-[10px] uppercase text-subtle">Live Telemetry</div>
            </div>
            <div className="h-full w-full pt-4 pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.loadProfile}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} unit="kW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Area type="monotone" dataKey="load" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                  <Area type="monotone" dataKey="cap" stroke="var(--danger)" strokeDasharray="5 5" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="section-title"><PieIcon size={16} className="text-accent" /> Load Distribution</div>
              <div className="mt-4 space-y-4">
                {data.distribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label}</span>
                      <span className="font-bold">{item.val} kW</span>
                    </div>
                    <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(item.val / Math.max(currentLoad, 1)) * 100}%`, backgroundColor: DISTRIBUTION_COLORS[item.colorKey] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="section-title"><BarIcon size={16} className="text-accent" /> Curtailment Events</div>
              <div className="mt-8 text-center py-4">
                <div className="text-3xl font-bold text-subtle opacity-20">{data.activeCurtailments}</div>
                <div className="text-[10px] uppercase text-subtle tracking-widest">Active Curtailments</div>
              </div>
              <p className="text-[10px] text-subtle text-center mt-2 px-4">Grid stability is currently within nominal parameters. No curtailment required.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="section-title"><Zap size={16} className="text-accent" /> Control Panel</div>
            <div className="space-y-4 mt-4">
              {[
                { label: 'Dynamic Load Balancing', value: loadBalancing, setValue: setLoadBalancing, description: 'Optimise power across all active connectors.' },
                { label: 'Peak Shaving', value: peakShaving, setValue: setPeakShaving, description: 'Avoid exceeding grid capacity limits.' },
                { label: 'V2G / Bidirectional (Beta)', value: v2gEnabled, setValue: setV2gEnabled, description: 'Allow vehicles to discharge back to the grid.' },
              ].map((option) => (
                <div key={option.label} className="p-3 rounded-lg border border-border group hover:border-accent/30 transition-all">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="text-[10px] text-subtle">{option.description}</div>
                    </div>
                    <div
                      className="w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer flex-shrink-0"
                      style={{ background: option.value ? 'var(--accent)' : 'var(--border)' }}
                      onClick={() => option.setValue((value) => !value)}
                    >
                      <div
                        className="w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200"
                        style={{ background: '#fff', left: option.value ? '1.25rem' : '0.125rem' }}
                      />
                    </div>
                  </label>
                </div>
              ))}
              <div className="pt-2">
                <label className="form-label text-[10px] uppercase tracking-wider">Operational Grid Cap (kW)</label>
                <div className="flex gap-2">
                  <input type="number" className="input h-10" value={maxGridKw} onChange={(e) => setMaxGridOverride(Number(e.target.value))} />
                  <button className="px-4 bg-bg-muted border border-border rounded-lg text-xs hover:bg-border transition-all">Update</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-accent/5 border-accent/20">
            <div className="section-title text-accent">AI Energy Optimizer</div>
            <p className="text-[11px] leading-relaxed text-subtle">
              The smart charging engine is predicting a peak load at <strong>{data.optimizer.forecastTime}</strong> today.
              System will automatically apply a {data.optimizer.reductionPercent}% reduction to lower priority connectors to avoid penalties.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-[9px] font-bold uppercase text-subtle opacity-60">Active V2G Strategy</div>
              <select className="input h-8 text-[10px] bg-bg-card" value={selectedStrategy} onChange={(e) => setSelectedStrategyOverride(e.target.value)}>
                {data.optimizer.strategies.map((strategy) => (
                  <option key={strategy}>{strategy}</option>
                ))}
              </select>
            </div>
            <button className="w-full mt-4 py-2 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20 hover:bg-accent/20 transition-all">
              {data.optimizer.cta}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
