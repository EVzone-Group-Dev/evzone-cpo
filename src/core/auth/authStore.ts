import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CPOUser, CPORole } from '@/core/types/domain'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { canAccessPolicy, getResolvedUserRole, normalizeAuthenticatedUser } from '@/core/auth/access'

export interface AuthState {
  activeTenantId: string | null
  user: CPOUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: CPOUser | AuthenticatedApiUser, token: string, refreshToken?: string | null) => void
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
          user: normalizeAuthenticatedUser(user),
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
      merge: (persistedState, currentState) => {
        const hydratedState = {
          ...currentState,
          ...(persistedState as Partial<AuthState>),
        }

        return {
          ...hydratedState,
          user: hydratedState.user ? normalizeAuthenticatedUser(hydratedState.user as CPOUser | AuthenticatedApiUser) : null,
        }
      },
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
  SITE_HOST: 30,
  TECHNICIAN: 40,
}

export function hasMinRole(userRole: CPORole, minRole: CPORole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

export function canManageStations(user: CPOUser | null | undefined): boolean {
  if (canAccessPolicy(user, 'stationsWrite') || canAccessPolicy(user, 'chargePointsWrite')) {
    return true
  }

  const role = getResolvedUserRole(user)
  return !!role && hasMinRole(role, 'STATION_MANAGER')
}

export function canDoFinance(user: CPOUser | null | undefined): boolean {
  if (canAccessPolicy(user, 'billingRead') || canAccessPolicy(user, 'payoutsRead') || canAccessPolicy(user, 'settlementRead')) {
    return true
  }

  const role = getResolvedUserRole(user)
  return !!role && hasMinRole(role, 'FINANCE')
}

export function canAdmin(user: CPOUser | null | undefined): boolean {
  if (canAccessPolicy(user, 'teamRead') || canAccessPolicy(user, 'whiteLabelAdmin')) {
    return true
  }

  const role = getResolvedUserRole(user)
  return !!role && hasMinRole(role, 'CPO_ADMIN')
}
