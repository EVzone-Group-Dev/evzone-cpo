import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Search, Filter } from 'lucide-react'

const SESSIONS = [
  { id: 'SES-001', station: 'Westlands Hub', cp: 'EVZ-WL-001', started: '2025-03-27 08:14', ended: '2025-03-27 09:02', energy: '22.4 kWh', amount: 'KES 1,344', status: 'Completed', method: 'App', emsp: 'EVzone eMSP' },
  { id: 'SES-002', station: 'CBD Station', cp: 'EVZ-CBD-001', started: '2025-03-27 07:50', ended: null, energy: '31.0 kWh', amount: 'KES 1,860', status: 'Active', method: 'RFID', emsp: '—' },
  { id: 'SES-003', station: 'Airport East', cp: 'EVZ-AP-001', started: '2025-03-27 06:00', ended: '2025-03-27 07:30', energy: '50.0 kWh', amount: 'KES 3,000', status: 'Completed', method: 'Roaming', emsp: 'ChargeNow' },
  { id: 'SES-004', station: 'Strathmore', cp: 'EVZ-STR-001', started: '2025-03-27 10:00', ended: '2025-03-27 10:05', energy: '0.0 kWh', amount: 'KES 0', status: 'Failed', method: 'RFID', emsp: '—' },
  { id: 'SES-005', station: 'Two Rivers', cp: 'EVZ-TR-001', started: '2025-03-27 09:30', ended: '2025-03-27 10:15', energy: '14.8 kWh', amount: 'KES 888', status: 'Completed', method: 'App', emsp: 'EVzone eMSP' },
]

type Filter = 'All' | 'Active' | 'Completed' | 'Failed'

export function SessionsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const filtered = SESSIONS.filter(s =>
    (filter === 'All' || s.status === filter) &&
    (s.station.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())))

  return (
    <DashboardLayout pageTitle="Charging Sessions">
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }} />
          <input className="input pl-9" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Completed', 'Failed'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn sm ${filter === f ? 'primary' : 'secondary'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Session ID</th><th>Station / CP</th><th>Started</th><th>Energy</th><th>Amount</th><th>eMSP</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.id}</td>
                <td>
                  <div className="text-xs font-semibold">{s.station}</div>
                  <div className="text-[11px] text-subtle">{s.cp}</div>
                </td>
                <td className="text-xs">{s.started}</td>
                <td className="text-sm">{s.energy}</td>
                <td className="text-sm font-medium">{s.amount}</td>
                <td className="text-xs">{s.emsp}</td>
                <td className="text-xs">{s.method}</td>
                <td><span className={`pill ${s.status === 'Active' ? 'active' : s.status === 'Completed' ? 'online' : 'faulted'}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
