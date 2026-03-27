import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Gauge, Zap, Activity } from 'lucide-react'


export function SmartChargingPage() {
  const [loadBalancing, setLoadBalancing] = useState(true)
  const [peakShaving, setPeakShaving] = useState(true)
  const [v2gEnabled, setV2gEnabled] = useState(false)
  const [maxGridKw, setMaxGridKw] = useState(180)

  const currentLoad = 148
  const percentage = Math.round((currentLoad / maxGridKw) * 100)

  return (
    <DashboardLayout pageTitle="Smart Charging">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Current Load</div><div className="value">{currentLoad} kW</div></div>
        <div className="kpi-card"><div className="label">Grid Cap</div><div className="value">{maxGridKw} kW</div></div>
        <div className="kpi-card"><div className="label">Utilisation</div><div className="value" style={{ color: percentage > 85 ? 'var(--danger)' : 'var(--ok)' }}>{percentage}%</div></div>
        <div className="kpi-card"><div className="label">Active Sessions</div><div className="value">18</div></div>
      </div>

      {/* Load bar */}
      <div className="card mb-6">
        <div className="section-title"><Gauge size={16} style={{ color: 'var(--accent)' }} />Live Grid Load</div>
        <div className="h-4 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, background: percentage > 85 ? 'var(--danger)' : percentage > 70 ? 'var(--warning)' : 'var(--accent)' }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>0 kW</span><span>{currentLoad} kW current</span><span>{maxGridKw} kW max</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-title"><Zap size={16} style={{ color: 'var(--accent)' }} />Load Management Settings</div>
          <div className="space-y-4">
            {[
              { label: 'Dynamic Load Balancing', val: loadBalancing, set: setLoadBalancing },
              { label: 'Peak Shaving', val: peakShaving, set: setPeakShaving },
              { label: 'V2G / Bidirectional Charging (Beta)', val: v2gEnabled, set: setV2gEnabled },
            ].map(opt => (
              <label key={opt.label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">{opt.label}</span>
                <div
                  className="w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer"
                  style={{ background: opt.val ? 'var(--accent)' : 'var(--border)' }}
                  onClick={() => opt.set(v => !v)}
                >
                  <div
                    className="w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200"
                    style={{ background: '#fff', left: opt.val ? '1.25rem' : '0.125rem' }}
                  />
                </div>
              </label>
            ))}
            <div>
              <label className="form-label">Max Grid Load (kW)</label>
              <input type="number" className="input" value={maxGridKw} onChange={e => setMaxGridKw(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title"><Activity size={16} style={{ color: 'var(--accent)' }} />Per-Station Distribution</div>
          <div className="space-y-3">
            {[
              { name: 'Westlands Hub', load: 62, cap: 80 },
              { name: 'CBD Station', load: 35, cap: 50 },
              { name: 'Airport East', load: 51, cap: 100 },
            ].map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text)' }}>{s.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{s.load} / {s.cap} kW</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(s.load/s.cap)*100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
