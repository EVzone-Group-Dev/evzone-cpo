import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CPOUser, CPORole } from '@/core/types/domain'

export interface AuthState {
  activeTenantId: string | null
  user: CPOUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: CPOUser, token: string, refreshToken?: string | null) => void
  setTokens: (token: string, refreshToken?: string | null) => void
  setActiveTenantId: (tenantId: string | null) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      activeTenantId: null,
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token, refreshToken = null) =>
        set({
          activeTenantId: null,
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),
      setTokens: (token, refreshToken) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
          isAuthenticated: !!state.user,
        })),
      setActiveTenantId: (tenantId) => set({ activeTenantId: tenantId }),
      logout: () =>
        set({
          activeTenantId: null,
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'cpo-auth',
      partialize: (s) => ({
        activeTenantId: s.activeTenantId,
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
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
