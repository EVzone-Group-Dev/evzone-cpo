import { DashboardLayout } from '@/components/layout/DashboardLayout'

const TARIFFS = [
  { id: 'T-1', name: 'Standard Day Rate', type: 'Energy', currency: 'KES', pricePerKwh: 60, active: true },
  { id: 'T-2', name: 'Peak Hours Premium', type: 'Mixed', currency: 'KES', pricePerKwh: 85, active: true },
  { id: 'T-3', name: 'Roaming Partner Rate', type: 'Energy', currency: 'KES', pricePerKwh: 70, active: true },
  { id: 'T-4', name: 'Night Smart Rate', type: 'Time', currency: 'KES', pricePerKwh: 40, active: false },
]

export function TariffsPage() {
  return (
    <DashboardLayout pageTitle="Tariffs">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Tariff</th><th>Type</th><th>Price/kWh</th><th>Currency</th><th>Status</th></tr></thead>
          <tbody>
            {TARIFFS.map(t => (
              <tr key={t.id}>
                <td className="font-semibold">{t.name}</td>
                <td><span className="pill pending">{t.type}</span></td>
                <td>{t.pricePerKwh}</td>
                <td>{t.currency}</td>
                <td><span className={`pill ${t.active ? 'active' : 'offline'}`}>{t.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
