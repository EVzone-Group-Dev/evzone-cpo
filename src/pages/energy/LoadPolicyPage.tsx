import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useLoadPolicies } from '@/core/hooks/usePlatformData'

export function LoadPolicyPage() {
  const { data: policies, isLoading, error } = useLoadPolicies()

  if (isLoading) {
    return <DashboardLayout pageTitle="Load Policies"><div className="p-8 text-center text-subtle">Loading load policies...</div></DashboardLayout>
  }

  if (error || !policies) {
    return <DashboardLayout pageTitle="Load Policies"><div className="p-8 text-center text-danger">Unable to load load policies.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Load Policies">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Policy</th><th>Station</th><th>Max Load</th><th>Curtailment %</th><th>Priority Mode</th><th>Status</th></tr></thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="font-semibold text-sm">{policy.name}</td>
                <td className="text-sm">{policy.station}</td>
                <td className="text-sm">{policy.maxLoadKw} kW</td>
                <td className="text-sm">{policy.curtailment}%</td>
                <td><span className="pill pending">{policy.priority}</span></td>
                <td><span className={`pill ${policy.active ? 'active' : 'offline'}`}>{policy.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
