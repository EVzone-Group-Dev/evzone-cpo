import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useTariffs } from '@/core/hooks/usePlatformData'

export function TariffsPage() {
  const { data: tariffs, isLoading, error } = useTariffs()

  if (isLoading) {
    return <DashboardLayout pageTitle="Tariffs"><div className="p-8 text-center text-subtle">Loading tariff catalog...</div></DashboardLayout>
  }

  if (error || !tariffs) {
    return <DashboardLayout pageTitle="Tariffs"><div className="p-8 text-center text-danger">Unable to load tariffs.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Tariffs">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Tariff</th><th>Type</th><th>Price/kWh</th><th>Currency</th><th>Status</th></tr></thead>
          <tbody>
            {tariffs.map((tariff) => (
              <tr key={tariff.id}>
                <td className="font-semibold">{tariff.name}</td>
                <td><span className="pill pending">{tariff.type}</span></td>
                <td>{tariff.pricePerKwh}</td>
                <td>{tariff.currency}</td>
                <td><span className={`pill ${tariff.active ? 'active' : 'offline'}`}>{tariff.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
