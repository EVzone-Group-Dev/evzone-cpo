import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBilling } from '@/core/hooks/usePlatformData'

export function BillingPage() {
  const { data, isLoading, error } = useBilling()

  if (isLoading) {
    return <DashboardLayout pageTitle="Billing"><div className="p-8 text-center text-subtle">Loading billing summary...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Billing"><div className="p-8 text-center text-danger">Unable to load billing summary.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Billing">
      <div className="kpi-card mb-4">
        <div className="label">Total Revenue This Month</div>
        <div className="value">{data.totalRevenueThisMonth}</div>
      </div>
      <p className="text-muted text-sm">{data.note}</p>
    </DashboardLayout>
  )
}
