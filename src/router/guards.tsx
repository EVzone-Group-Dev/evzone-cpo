import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { canAccessPolicy, getRoleHomePath, type AccessPolicyKey } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'

export function RequireAuth({ children, policy }: { children: ReactNode; policy?: AccessPolicyKey }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (policy && !canAccessPolicy(user, policy)) {
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
