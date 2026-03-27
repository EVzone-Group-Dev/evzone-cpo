import { DashboardLayout } from '@/components/layout/DashboardLayout'
import type { ReactNode } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

const PARTNERS = [
  { id: 'P-1', name: 'ChargeNow Global', role: 'EMSP', country: 'DE', partyId: 'CNG', versions: ['2.2.1', '2.3'], status: 'Active', lastSync: '2025-03-27 09:00', sessionsToday: 34 },
  { id: 'P-2', name: 'EVgo Roaming', role: 'EMSP', country: 'US', partyId: 'EVG', versions: ['2.2.1'], status: 'Active', lastSync: '2025-03-27 08:45', sessionsToday: 12 },
  { id: 'P-3', name: 'Hubject Hub', role: 'HUB', country: 'DE', partyId: 'HJT', versions: ['2.2.1', '2.3'], status: 'Pending', lastSync: '—', sessionsToday: 0 },
  { id: 'P-4', name: 'GIREVE HUB', role: 'HUB', country: 'FR', partyId: 'GRV', versions: ['2.2.1'], status: 'Active', lastSync: '2025-03-27 07:30', sessionsToday: 8 },
]

const STS: Record<string, ReactNode> = {
  Active: <span className="flex items-center gap-1 text-ok text-xs"><CheckCircle size={12} /> Active</span>,
  Pending: <span className="flex items-center gap-1 text-warning text-xs"><Clock size={12} /> Pending</span>,
  Failed: <span className="flex items-center gap-1 text-danger text-xs"><XCircle size={12} /> Failed</span>,
}

export function OCPIPartnersPage() {
  return (
    <DashboardLayout pageTitle="OCPI Roaming Partners">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Active Partners</div><div className="value">{PARTNERS.filter(p => p.status === 'Active').length}</div></div>
        <div className="kpi-card"><div className="label">Sessions Today</div><div className="value">{PARTNERS.reduce((s, p) => s + p.sessionsToday, 0)}</div></div>
        <div className="kpi-card"><div className="label">OCPI Versions</div><div className="value">2.2.1 / 2.3</div></div>
        <div className="kpi-card"><div className="label">Pending Handshakes</div><div className="value">{PARTNERS.filter(p => p.status === 'Pending').length}</div></div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Partner</th><th>Role</th><th>Country</th><th>Party ID</th><th>Versions</th><th>Sessions Today</th><th>Last Sync</th><th>Status</th></tr></thead>
          <tbody>
            {PARTNERS.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-sm">{p.name}</td>
                <td><span className="pill pending">{p.role}</span></td>
                <td className="text-sm">{p.country}</td>
                <td className="font-mono text-xs">{p.partyId}</td>
                <td className="text-xs">{p.versions.join(', ')}</td>
                <td className="text-sm">{p.sessionsToday}</td>
                <td className="text-xs">{p.lastSync}</td>
                <td>{STS[p.status] ?? p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
