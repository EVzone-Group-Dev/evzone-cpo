import { DashboardLayout } from '@/components/layout/DashboardLayout'

const TEAM = [
  { name: 'John Kamau', email: 'john@evzone.io', role: 'STATION_MANAGER', status: 'Active', lastSeen: '2 min ago' },
  { name: 'Grace Otieno', email: 'grace@evzone.io', role: 'TECHNICIAN', status: 'Active', lastSeen: '1 hr ago' },
  { name: "Peter Ndung'u", email: 'peter@evzone.io', role: 'OPERATOR', status: 'Invited', lastSeen: '—' },
  { name: 'Amina Hassan', email: 'amina@evzone.io', role: 'FINANCE', status: 'Active', lastSeen: '3 hr ago' },
]

export function TeamPage() {
  return (
    <DashboardLayout pageTitle="Team Members">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Seen</th><th>Status</th></tr></thead>
          <tbody>
            {TEAM.map(m => (
              <tr key={m.email}>
                <td className="font-semibold">{m.name}</td>
                <td className="text-sm">{m.email}</td>
                <td><span className="pill pending">{m.role}</span></td>
                <td className="text-xs">{m.lastSeen}</td>
                <td><span className={`pill ${m.status === 'Active' ? 'active' : 'pending'}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
