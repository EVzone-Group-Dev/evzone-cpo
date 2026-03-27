import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CPOUser, CPORole } from '@/core/types/domain'

export interface AuthState {
  user: CPOUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: CPOUser, token: string) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'cpo-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
)

// ─── RBAC helpers ─────────────────────────────────────────────────────────
const ROLE_HIERARCHY: Record<CPORole, number> = {
  SUPER_ADMIN: 100,
  CPO_ADMIN: 90,
  STATION_MANAGER: 70,
  FINANCE: 60,
  OPERATOR: 50,
  TECHNICIAN: 40,
  VIEWER: 10,
}

export function hasMinRole(userRole: CPORole, minRole: CPORole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

export function canManageStations(role: CPORole): boolean {
  return hasMinRole(role, 'STATION_MANAGER')
}

export function canDoFinance(role: CPORole): boolean {
  return hasMinRole(role, 'FINANCE')
}

export function canAdmin(role: CPORole): boolean {
  return hasMinRole(role, 'CPO_ADMIN')
}
