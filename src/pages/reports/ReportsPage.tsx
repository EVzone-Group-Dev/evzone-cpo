import { DashboardLayout } from '@/components/layout/DashboardLayout'

const stats: [string, string][] = [
  ['Total Sessions (MTD)', '2,925'],
  ['Total Energy (MTD)', '88,412 kWh'],
  ['Revenue (MTD)', 'KES 5,304,720'],
  ['Avg Session Duration', '54 min'],
  ['Network Uptime', '98.2%'],
  ['Roaming Ratio', '15.3%'],
]

export function ReportsPage() {
  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="kpi-card">
            <div className="label">{label}</div>
            <div className="value text-2xl">{value}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
