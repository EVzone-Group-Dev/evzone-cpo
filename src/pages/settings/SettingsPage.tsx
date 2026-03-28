import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'

export function SettingsPage() {
  const { user } = useAuthStore()
  const { activeTenant, availableTenants, dataScopeLabel } = useTenant()

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card max-w-2xl">
          <div className="section-title">Profile</div>
          <div className="space-y-3 text-sm">
            <div><div className="form-label">Name</div><div>{user?.name}</div></div>
            <div><div className="form-label">Email</div><div>{user?.email}</div></div>
            <div><div className="form-label">Role</div><div>{user?.role}</div></div>
            <div><div className="form-label">MFA</div><div>{user?.mfaEnabled ? 'Enabled' : 'Disabled'}</div></div>
            <div><div className="form-label">Organization</div><div>{user?.organizationId ?? 'Platform-wide access'}</div></div>
            <div><div className="form-label">Assigned Stations</div><div>{user?.assignedStationIds?.join(', ') ?? 'All tenant stations'}</div></div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Tenant Scope</div>
          <div className="space-y-3 text-sm">
            <div><div className="form-label">Active Tenant</div><div>{activeTenant?.name ?? 'Loading...'}</div></div>
            <div><div className="form-label">Scope</div><div>{activeTenant?.scopeLabel ?? '-'}</div></div>
            <div><div className="form-label">Region</div><div>{activeTenant?.region ?? '-'}</div></div>
            <div><div className="form-label">Coverage</div><div>{dataScopeLabel}</div></div>
            <div><div className="form-label">Available Tenants</div><div>{availableTenants.length}</div></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
