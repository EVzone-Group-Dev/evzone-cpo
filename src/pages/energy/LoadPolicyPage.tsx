import { DashboardLayout } from '@/components/layout/DashboardLayout'

const POLICIES = [
  { id: 'LP-1', name: 'Westlands Hub Default', station: 'Westlands Hub', maxLoadKw: 80, curtailment: 95, priority: 'FIFO', active: true },
  { id: 'LP-2', name: 'Airport Peak Hours', station: 'Airport East', maxLoadKw: 150, curtailment: 90, priority: 'Priority', active: true },
  { id: 'LP-3', name: 'Garden City Night Mode', station: 'Garden City Mall', maxLoadKw: 40, curtailment: 80, priority: 'Fair-Share', active: false },
]

export function LoadPolicyPage() {
  return (
    <DashboardLayout pageTitle="Load Policies">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Policy</th><th>Station</th><th>Max Load</th><th>Curtailment %</th><th>Priority Mode</th><th>Status</th></tr></thead>
          <tbody>
            {POLICIES.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-sm">{p.name}</td>
                <td className="text-sm">{p.station}</td>
                <td className="text-sm">{p.maxLoadKw} kW</td>
                <td className="text-sm">{p.curtailment}%</td>
                <td><span className="pill pending">{p.priority}</span></td>
                <td><span className={`pill ${p.active ? 'active' : 'offline'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
