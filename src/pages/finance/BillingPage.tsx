import { DashboardLayout } from '@/components/layout/DashboardLayout'

export function BillingPage() {
  return (
    <DashboardLayout pageTitle="Billing">
      <div className="kpi-card mb-4">
        <div className="label">Total Revenue This Month</div>
        <div className="value">KES 4,284,200</div>
      </div>
      <p className="text-muted text-sm">Detailed billing records and invoice generation coming in Phase 2.</p>
    </DashboardLayout>
  )
}
