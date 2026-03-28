import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSwapSessions } from '@/core/hooks/useSwapping'
import { RefreshCw, Search } from 'lucide-react'

type Filter = 'All' | 'Completed' | 'In Progress' | 'Flagged'

const HEALTH_CLASS = {
  Passed: 'online',
  Review: 'pending',
  Failed: 'faulted',
} as const

export function SwapSessionsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const { data: sessions, isLoading, error } = useSwapSessions()

  const filtered = (sessions ?? []).filter((session) =>
    (filter === 'All' || session.status === filter) &&
    (
      session.stationName.toLowerCase().includes(search.toLowerCase()) ||
      session.riderLabel.toLowerCase().includes(search.toLowerCase()) ||
      session.id.toLowerCase().includes(search.toLowerCase())
    ),
  )

  if (isLoading) {
    return <DashboardLayout pageTitle="Swap Sessions"><div className="p-8 text-center text-subtle">Loading swap sessions...</div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout pageTitle="Swap Sessions"><div className="p-8 text-center text-danger">Unable to load swap sessions.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Swap Sessions">
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Search swap sessions..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Completed', 'In Progress', 'Flagged'] as Filter[]).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Station / Cabinet</th>
              <th>Rider</th>
              <th>Packs</th>
              <th>Started</th>
              <th>Turnaround</th>
              <th>Revenue</th>
              <th>Inspection</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={session.id}>
                <td className="font-mono text-xs">{session.id}</td>
                <td>
                  <div className="text-xs font-semibold">{session.stationName}</div>
                  <div className="text-[11px] text-subtle">{session.cabinetId}</div>
                </td>
                <td>{session.riderLabel}</td>
                <td className="text-xs">
                  <div>{session.outgoingPackId}</div>
                  <div className="text-subtle">{session.returnedPackId}</div>
                </td>
                <td className="text-xs">{session.initiatedAt}</td>
                <td className="font-semibold">{session.turnaroundLabel}</td>
                <td className="font-bold">{session.revenue}</td>
                <td><span className={`pill ${HEALTH_CLASS[session.healthCheck]}`}>{session.healthCheck}</span></td>
                <td>
                  <span className={`pill ${session.status === 'Completed' ? 'online' : session.status === 'Flagged' ? 'faulted' : 'active'}`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-subtle flex items-center gap-2">
        <RefreshCw size={12} className="text-accent" />
        Swap workflows track outgoing pack dispatch, returned-pack inspection, and turnaround time instead of kWh delivery.
      </div>
    </DashboardLayout>
  )
}
