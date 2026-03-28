import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { canAccessRole, getRoleHomePath } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import type { CPORole } from '@/core/types/domain'

export function RequireAuth({ children, allowedRoles }: { children: ReactNode; allowedRoles?: readonly CPORole[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.user?.role)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !canAccessRole(userRole, allowedRoles)) {
    return <Navigate to={getRoleHomePath(userRole)} replace />
  }
  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.user?.role)
  if (isAuthenticated) return <Navigate to={getRoleHomePath(userRole)} replace />
  return <>{children}</>
}
