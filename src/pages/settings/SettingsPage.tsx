import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'

export function SettingsPage() {
  const { user } = useAuthStore()
  return (
    <DashboardLayout pageTitle="Settings">
      <div className="card max-w-lg">
        <div className="section-title">Profile</div>
        <div className="space-y-3 text-sm">
          <div><div className="form-label">Name</div><div>{user?.name}</div></div>
          <div><div className="form-label">Email</div><div>{user?.email}</div></div>
          <div><div className="form-label">Role</div><div>{user?.role}</div></div>
          <div><div className="form-label">MFA</div><div>{user?.mfaEnabled ? 'Enabled' : 'Disabled'}</div></div>
        </div>
      </div>
    </DashboardLayout>
  )
}
