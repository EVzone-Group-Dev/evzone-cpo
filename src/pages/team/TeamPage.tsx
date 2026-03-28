import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useTeamMembers } from '@/core/hooks/usePlatformData'

export function TeamPage() {
  const { data: team, isLoading, error } = useTeamMembers()

  if (isLoading) {
    return <DashboardLayout pageTitle="Team Members"><div className="p-8 text-center text-subtle">Loading team roster...</div></DashboardLayout>
  }

  if (error || !team) {
    return <DashboardLayout pageTitle="Team Members"><div className="p-8 text-center text-danger">Unable to load team roster.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Team Members">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Seen</th><th>Status</th></tr></thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.email}>
                <td className="font-semibold">{member.name}</td>
                <td className="text-sm">{member.email}</td>
                <td><span className="pill pending">{member.role}</span></td>
                <td className="text-xs">{member.lastSeen}</td>
                <td><span className={`pill ${member.status === 'Active' ? 'active' : 'pending'}`}>{member.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
