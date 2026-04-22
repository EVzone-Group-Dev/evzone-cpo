import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useFleetOverview } from '@/core/hooks/usePlatformData'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
} as const

export function FleetPage() {
  const { data, isLoading, error } = useFleetOverview()

  if (isLoading) {
    return <DashboardLayout pageTitle="Fleet Operations"><div className="p-8 text-center text-subtle">Loading fleet operations...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Fleet Operations"><div className="p-8 text-center text-danger">Unable to load fleet operations.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Fleet Operations">
      <div className="kpi-row mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="section-title">Fleet Accounts</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Currency</th>
                  <th>Groups</th>
                  <th>Drivers</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="font-semibold">{account.name}</td>
                    <td><span className={`pill ${account.status === 'ACTIVE' ? 'online' : 'pending'}`}>{account.status}</span></td>
                    <td>{account.currency}</td>
                    <td>{account.driverGroups}</td>
                    <td>{account.drivers}</td>
                  </tr>
                ))}
                {data.accounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">No fleet accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Driver Groups & Policy Links</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Account</th>
                  <th>Tariffs</th>
                  <th>Locations</th>
                  <th>Spend Limit</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <div className="font-semibold">{group.name}</div>
                      <div className="text-[11px] text-subtle">{group.status}</div>
                    </td>
                    <td>{group.accountName}</td>
                    <td>{group.tariffs.length}</td>
                    <td>{group.locations.length}</td>
                    <td>{group.monthlySpendLimit}</td>
                  </tr>
                ))}
                {data.groups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">No driver groups found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Drivers & Token Assignments</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Group</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Tokens</th>
                <th>Monthly Limit</th>
              </tr>
            </thead>
            <tbody>
              {data.drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="font-semibold">{driver.displayName}</td>
                  <td>{driver.groupName}</td>
                  <td>{driver.accountName}</td>
                  <td className="text-xs">{driver.contact}</td>
                  <td><span className={`pill ${driver.status === 'ACTIVE' ? 'online' : 'pending'}`}>{driver.status}</span></td>
                  <td>{driver.tokenSummary}</td>
                  <td>{driver.monthlySpendLimit}</td>
                </tr>
              ))}
              {data.drivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-subtle py-8">No drivers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6">
        <div className="section-title">Fleet Note</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  )
}

