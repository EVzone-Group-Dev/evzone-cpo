import { DashboardLayout } from '@/components/layout/DashboardLayout'

const protos: [string, string, string][] = [
  ['OCPP 1.6J', 'Active', '312 charge points'],
  ['OCPP 2.0.1', 'Active', '28 charge points'],
  ['OCPI 2.2.1', 'Active', '4 partners'],
  ['OCPI 2.3', 'Active', '2 partners'],
  ['ISO 15118 (PnC)', 'Beta', '—'],
]

export function ProtocolsPage() {
  return (
    <DashboardLayout pageTitle="Protocol Status">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Protocol</th><th>Status</th><th>Connections</th></tr></thead>
          <tbody>
            {protos.map(([p, s, c]) => (
              <tr key={p}>
                <td className="font-semibold">{p}</td>
                <td><span className={`pill ${s === 'Active' ? 'active' : 'degraded'}`}>{s}</span></td>
                <td className="text-sm">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
