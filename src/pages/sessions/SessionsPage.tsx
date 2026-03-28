import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useSessions } from '@/core/hooks/usePlatformData'
import { Search } from 'lucide-react'

type Filter = 'All' | 'Active' | 'Completed' | 'Failed'

export function SessionsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const { data: sessions, isLoading, error } = useSessions()

  const filtered = (sessions || []).filter((session) =>
    (filter === 'All' || session.status === filter) &&
    (session.station.toLowerCase().includes(search.toLowerCase()) || session.id.toLowerCase().includes(search.toLowerCase())),
  )

  if (isLoading) {
    return <DashboardLayout pageTitle="Charging Sessions"><div className="p-8 text-center text-subtle">Loading charging sessions...</div></DashboardLayout>
  }

  if (error) {
    return <DashboardLayout pageTitle="Charging Sessions"><div className="p-8 text-center text-danger">Unable to load session history.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Charging Sessions">
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input className="input pl-9" placeholder="Search sessions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Completed', 'Failed'] as Filter[]).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Session ID</th><th>Station / CP</th><th>Started</th><th>Energy</th><th>Amount</th><th>eMSP</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={session.id}>
                <td className="font-mono text-xs">{session.id}</td>
                <td>
                  <div className="text-xs font-semibold">{session.station}</div>
                  <div className="text-[11px] text-subtle">{session.cp}</div>
                </td>
                <td className="text-xs">{session.started}</td>
                <td className="text-sm">{session.energy}</td>
                <td className="text-sm font-medium">{session.amount}</td>
                <td className="text-xs">{session.emsp}</td>
                <td className="text-xs">{session.method}</td>
                <td><span className={`pill ${session.status === 'Active' ? 'active' : session.status === 'Completed' ? 'online' : 'faulted'}`}>{session.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
