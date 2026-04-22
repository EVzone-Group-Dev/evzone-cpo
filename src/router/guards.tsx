import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  canAccessPolicy,
  getRoleHomePath,
  getTemporaryAccessWindowLabel,
  isTemporaryAccessExpired,
  isTenantActivationPendingForUser,
  type AccessPolicyKey,
} from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import type { CPOUser } from '@/core/types/domain'

function TemporaryAccessExpiredNotice({ user }: { user: CPOUser | null }) {
  const stationLabel = user?.activeStationContext?.stationName ?? user?.activeStationContext?.stationId ?? 'your assigned station'

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg w-full rounded-2xl border px-6 py-7" style={{ borderColor: 'var(--danger)', background: 'var(--bg-card)' }}>
        <div className="text-lg font-bold text-danger">Temporary station access expired</div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Your installer or temporary technician scope for {stationLabel} is no longer active. Ask a tenant admin to refresh the assignment if you still need commissioning access.
        </p>
        <div className="mt-4 rounded-xl border px-4 py-3 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-subtle)' }}>
          {getTemporaryAccessWindowLabel(user)}
        </div>
      </div>
    </div>
  )
}

function TenantAccountNotActivatedNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg w-full rounded-2xl border px-6 py-7" style={{ borderColor: 'var(--warning)', background: 'var(--bg-card)' }}>
        <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>Account Not Activated---- contact Admin.</div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Your tenant access is pending activation. Please contact your tenant admin to complete activation before signing in.
        </p>
      </div>
    </div>
  )
}

export function RequireAuth({ children, policy }: { children: ReactNode; policy?: AccessPolicyKey }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isTenantActivationPendingForUser(user)) {
    return <TenantAccountNotActivatedNotice />
  }
  if (policy && !canAccessPolicy(user, policy)) {
    if (isTemporaryAccessExpired(user)) {
      return <TemporaryAccessExpiredNotice user={user} />
    }
    return <Navigate to={getRoleHomePath(user)} replace />
  }
  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  if (isAuthenticated) return <Navigate to={getRoleHomePath(user)} replace />
  return <>{children}</>
}
