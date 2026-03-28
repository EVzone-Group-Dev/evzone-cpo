import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoamingSessions } from '@/core/hooks/usePlatformData'
import { Globe, ArrowDownLeft, Zap, Clock, ShieldCheck, Search } from 'lucide-react'

const METRIC_ICONS = {
  incoming: <ArrowDownLeft size={24} />,
  authorized: <ShieldCheck size={24} />,
  utilisation: <Zap size={24} />,
} as const

const METRIC_STYLES = {
  accent: {
    badge: 'bg-accent/10 text-accent',
    card: 'border-l-accent',
    note: 'text-ok',
  },
  ok: {
    badge: 'bg-ok/10 text-ok',
    card: 'border-l-ok',
    note: 'text-subtle',
  },
  warning: {
    badge: 'bg-warning/10 text-warning',
    card: 'border-l-warning',
    note: 'text-subtle',
  },
} as const

const SESSION_STATUS_CLASS = {
  Active: 'active',
  Completed: 'online',
  Authorized: 'pending',
} as const

export function RoamingSessionsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useRoamingSessions()

  if (isLoading) {
    return <DashboardLayout pageTitle="Roaming Operations"><div className="p-8 text-center text-subtle">Loading roaming operations...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Roaming Operations"><div className="p-8 text-center text-danger">Unable to load roaming operations.</div></DashboardLayout>
  }

  const filteredSessions = data.sessions.filter((session) => {
    const matchesTab = activeTab === 'all' || (activeTab === 'active' && session.status === 'Active') || (activeTab === 'pending' && session.status === 'Authorized')
    const matchesSearch = session.partyId.toLowerCase().includes(search.toLowerCase()) || session.emspName.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <DashboardLayout pageTitle="Roaming Operations">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {data.metrics.map((metric) => {
          const styles = METRIC_STYLES[metric.tone]

          return (
            <div key={metric.id} className={`card border-l-4 flex items-center gap-4 ${styles.card}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.badge}`}>{METRIC_ICONS[metric.id]}</div>
              <div>
                <div className="label">{metric.label}</div>
                <div className="value">{metric.value}</div>
                <div className={`text-[10px] mt-1 ${styles.note}`}>{metric.note}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex bg-bg-muted rounded-lg p-1 border border-border">
          {['all', 'active', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'all' | 'active' | 'pending')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-accent text-white' : 'text-subtle hover:text-text'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={14} />
            <input type="text" className="input pl-9 h-9 text-xs w-64" placeholder="Filter by Token or Partner..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {filteredSessions.map((session) => (
              <tr key={session.id} className="hover:bg-bg-muted/30 transition-colors cursor-pointer">
                <td className="font-mono text-[11px] font-bold text-accent">{session.id}</td>
                <td>
                  <div className="text-sm font-semibold">{session.stationName}</div>
                  <div className="text-[10px] text-subtle uppercase">Connector #1</div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-bg-muted flex items-center justify-center text-[8px] font-bold border border-border">{session.partyId}</div>
                    <div className="text-xs">{session.emspName}</div>
                  </div>
                </td>
                <td><div className="text-xs text-subtle flex items-center gap-1"><Clock size={12} /> {session.startTime}</div></td>
                <td>
                  <div className="text-xs font-semibold">{session.energy} kWh</div>
                  <div className="w-24 h-1 bg-bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-accent animate-pulse" style={{ width: '60%' }} />
                  </div>
                </td>
                <td><div className="font-bold text-xs">{session.amount}</div></td>
                <td><span className={`pill ${SESSION_STATUS_CLASS[session.status]}`}>{session.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        <div className="card bg-bg-muted/20 min-w-[300px] flex-1">
          <div className="section-title text-[10px] text-accent"><Globe size={14} /> Regional Reach</div>
          <div className="mt-4 space-y-3">
            {data.regionalReach.map((region) => (
              <div key={region.region} className="flex justify-between items-center text-[11px]">
                <span className="text-subtle">{region.region}</span>
                <span className="font-bold">{region.count} Sessions</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card bg-bg-muted/20 min-w-[300px] flex-1">
          <div className="section-title text-[10px] text-warning"><Zap size={14} /> Settlement Aging</div>
          <div className="mt-4 flex items-end gap-2 h-16 px-4">
            {data.settlementAging.map((height, index) => (
              <div key={index} className="flex-1 bg-warning/20 border-t-2 border-warning transition-all" style={{ height: `${height}%` }} />
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
