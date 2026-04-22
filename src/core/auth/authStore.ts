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
  replaceUser: (user: CPOUser | AuthenticatedApiUser) => void
  setTokens: (token: string, refreshToken?: string | null) => void
  setActiveTenantId: (tenantId: string | null) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export function isPlatformSessionWithoutTenantContext(
  user: Partial<CPOUser | AuthenticatedApiUser> | null | undefined,
) {
  if (!user) {
    return false
  }

  if (user.sessionScopeType === 'platform') {
    return user.actingAsTenant !== true
  }

  if (user.sessionScopeType === 'tenant') {
    return false
  }

  const scopeType = user.accessProfile?.scope.type ?? null
  if (scopeType !== 'platform') {
    return false
  }

  const hasTenantSelection = Boolean(
    user.actingAsTenant
    || user.sessionScopeType === 'tenant'
    || user.selectedTenantId
    || user.activeTenantId
    || user.tenantId,
  )

  return !hasTenantSelection
}

export function resolveTenantIdFromUser(user: CPOUser | AuthenticatedApiUser) {
  if (isPlatformSessionWithoutTenantContext(user)) {
    return null
  }

  return user.selectedTenantId ?? user.activeTenantId ?? user.tenantId ?? null
}

export function mergeAuthUser(currentUser: CPOUser | null, incomingUser: CPOUser | AuthenticatedApiUser) {
  if (!currentUser) {
    return incomingUser
  }

  const incomingIsPlatformWithoutTenant = isPlatformSessionWithoutTenantContext(incomingUser)

  const mergedUser = {
    ...currentUser,
    ...incomingUser,
    activeTenantId:
      incomingUser.selectedTenantId
      ?? incomingUser.activeTenantId
      ?? incomingUser.tenantId
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.selectedTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.activeTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.tenantId)
      ?? null,
    orgId:
      incomingUser.orgId
      ?? incomingUser.selectedTenantId
      ?? incomingUser.activeTenantId
      ?? incomingUser.tenantId
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.orgId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.selectedTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.activeTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.tenantId)
      ?? null,
    selectedTenantId:
      incomingUser.selectedTenantId
      ?? incomingUser.activeTenantId
      ?? incomingUser.tenantId
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.selectedTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.activeTenantId)
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.tenantId)
      ?? null,
    selectedTenantName:
      incomingUser.selectedTenantName
      ?? (incomingIsPlatformWithoutTenant ? null : currentUser.selectedTenantName)
      ?? null,
    accessProfile: incomingUser.accessProfile ?? currentUser.accessProfile ?? null,
    memberships: incomingUser.memberships ?? currentUser.memberships,
    stationContexts: incomingUser.stationContexts ?? currentUser.stationContexts,
    activeStationContext: incomingUser.activeStationContext ?? currentUser.activeStationContext ?? null,
    assignedStationIds: incomingUser.assignedStationIds ?? currentUser.assignedStationIds,
    mfaEnabled: incomingUser.mfaEnabled ?? currentUser.mfaEnabled,
    createdAt: incomingUser.createdAt ?? currentUser.createdAt,
  }

  if (incomingIsPlatformWithoutTenant || isPlatformSessionWithoutTenantContext(mergedUser)) {
    return {
      ...mergedUser,
      activeTenantId: null,
      tenantId: undefined,
      orgId: null,
      selectedTenantId: null,
      selectedTenantName: null,
    }
  }

  return mergedUser
}

export function sanitizePersistedUser(user: CPOUser | null) {
  if (!user) {
    return null
  }

  if (isPlatformSessionWithoutTenantContext(user)) {
    return {
      ...user,
      activeTenantId: null,
      tenantId: undefined,
      orgId: null,
      selectedTenantId: null,
      selectedTenantName: null,
      actingAsTenant: false,
      sessionScopeType: 'platform' as const,
    }
  }

  return {
    ...user,
    selectedTenantId: user.actingAsTenant ? user.selectedTenantId ?? null : null,
    selectedTenantName: user.actingAsTenant ? user.selectedTenantName ?? null : null,
  }
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
          activeTenantId: resolveTenantIdFromUser(user),
          user: normalizeAuthenticatedUser(user),
          token,
          refreshToken,
          isAuthenticated: true,
        }),
      replaceUser: (user) =>
        set((state) => {
          const resolvedTenantId = resolveTenantIdFromUser(user)
          return {
            activeTenantId:
              resolvedTenantId === null
                ? isPlatformSessionWithoutTenantContext(user)
                  ? null
                  : state.activeTenantId
                : resolvedTenantId,
            user: normalizeAuthenticatedUser(mergeAuthUser(state.user, user)),
            isAuthenticated: true,
          }
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

        const normalizedUser = hydratedState.user
          ? normalizeAuthenticatedUser(hydratedState.user as CPOUser | AuthenticatedApiUser)
          : null

        return {
          ...hydratedState,
          user: sanitizePersistedUser(normalizedUser),
        }
      },
      partialize: (s) => {
        const persistedUser = sanitizePersistedUser(s.user)

        return {
          activeTenantId: isPlatformSessionWithoutTenantContext(persistedUser) ? null : s.activeTenantId,
          user: persistedUser,
          token: s.token,
          refreshToken: s.refreshToken,
          isAuthenticated: s.isAuthenticated,
        }
      },
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
