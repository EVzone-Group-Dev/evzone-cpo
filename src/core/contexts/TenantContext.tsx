import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'
import { TenantContext } from '@/core/contexts/tenantSessionContext'
import type { TenantContextType } from '@/core/contexts/tenantSessionContext'
import type { AccessScopeType, CPOUser, OrganizationMembershipSummary, StationContextSummary } from '@/core/types/domain'
import type { AuthenticatedApiUser, LoginResponse, TenantContextResponse, TenantSummary } from '@/core/types/mockApi'

type BackendTenantRecord = {
  id: string
  name?: string
  code?: string
  currency?: string
  description?: string
  region?: string
  scope?: 'platform' | 'organization' | 'site'
  scopeLabel?: string
  slug?: string
  timeZone?: string
  stationCount?: number
  siteCount?: number
}

const EMPTY_STATION_CONTEXTS: StationContextSummary[] = []

function toTenantSummary(raw: BackendTenantRecord): TenantSummary {
  return {
    id: raw.id,
    name: raw.name ?? 'Unnamed Tenant',
    code: raw.code ?? raw.id.slice(0, 8).toUpperCase(),
    currency: raw.currency ?? 'KES',
    description: raw.description ?? '',
    region: raw.region ?? 'Unknown',
    scope: raw.scope ?? 'organization',
    scopeLabel: raw.scopeLabel ?? 'Organization scope',
    slug: raw.slug ?? raw.id,
    timeZone: raw.timeZone ?? 'Africa/Nairobi',
    stationCount: raw.stationCount ?? 0,
    siteCount: raw.siteCount ?? 0,
    chargePointCount: 0,
  }
}

function toScopeLabel(scopeType: AccessScopeType | TenantSummary['scope'], organizationType?: string) {
  switch (scopeType) {
    case 'platform':
      return 'Platform scope'
    case 'site':
      return 'Site scope'
    case 'station':
      return 'Station scope'
    case 'provider':
      return 'Provider scope'
    case 'fleet_group':
      return 'Fleet scope'
    case 'temporary':
      return 'Temporary scope'
    default:
      return organizationType ? `${organizationType.toLowerCase()} scope` : 'Organization scope'
  }
}

function toTenantScope(scopeType?: AccessScopeType | null): TenantSummary['scope'] {
  if (scopeType === 'platform') return 'platform'
  if (scopeType === 'site') return 'site'
  return 'organization'
}

function buildTenantCode(sourceId: string) {
  return sourceId
    .replace(/[^a-z0-9]+/gi, '')
    .slice(0, 8)
    .toUpperCase() || 'TENANT'
}

function buildTenantFromMembership(membership: OrganizationMembershipSummary, user: CPOUser, isActive: boolean): TenantSummary {
  const activeScopeType = isActive ? user.accessProfile?.scope.type : null
  const scope = toTenantScope(activeScopeType)

  return {
    id: membership.organizationId,
    name: membership.organizationName ?? membership.organizationId,
    code: buildTenantCode(membership.organizationId),
    currency: 'KES',
    description: membership.organizationType ? `${membership.organizationType} workspace` : '',
    region: user.region ?? 'Unknown',
    scope,
    scopeLabel: toScopeLabel(activeScopeType ?? scope, membership.organizationType),
    slug: membership.organizationId,
    timeZone: 'Africa/Nairobi',
    stationCount: isActive ? user.stationContexts?.length ?? user.assignedStationIds?.length ?? 0 : 0,
    siteCount: scope === 'site' ? 1 : 0,
    chargePointCount: 0,
  }
}

function buildFallbackTenant(user: CPOUser, requestedTenantId: string | null): TenantSummary | null {
  const organizationId =
    user.activeOrganizationId
    ?? user.organizationId
    ?? user.accessProfile?.scope.organizationId
    ?? requestedTenantId
    ?? user.providerId
    ?? null

  if (!organizationId) {
    return null
  }

  const scopeType = user.accessProfile?.scope.type ?? 'organization'

  return {
    id: organizationId,
    name: organizationId,
    code: buildTenantCode(organizationId),
    currency: 'KES',
    description: '',
    region: user.region ?? 'Unknown',
    scope: toTenantScope(scopeType),
    scopeLabel: toScopeLabel(scopeType),
    slug: organizationId,
    timeZone: 'Africa/Nairobi',
    stationCount: user.stationContexts?.length ?? user.assignedStationIds?.length ?? 0,
    siteCount: scopeType === 'site' ? 1 : 0,
    chargePointCount: 0,
  }
}

function inferDashboardMode(user: CPOUser, activeTenant: TenantSummary): TenantContextResponse['dashboardMode'] {
  return user.accessProfile?.scope.type === 'site' || activeTenant.scope === 'site' ? 'site' : 'operations'
}

function buildDataScopeLabel(user: CPOUser, activeTenant: TenantSummary) {
  const scopeType = user.accessProfile?.scope.type ?? activeTenant.scope
  const stationCount = user.accessProfile?.scope.stationIds.length ?? user.assignedStationIds?.length ?? 0

  switch (scopeType) {
    case 'platform':
      return 'Platform-wide visibility across assigned organizations and operational domains.'
    case 'site':
      return `Site-hosted visibility limited to ${activeTenant.name}.`
    case 'station':
      return stationCount > 0
        ? `Station-scoped visibility limited to ${stationCount} assigned station${stationCount === 1 ? '' : 's'} in ${activeTenant.name}.`
        : `Station-scoped visibility limited to ${activeTenant.name}.`
    case 'provider':
      return `Provider-scoped visibility limited to roaming and partner workflows for ${activeTenant.name}.`
    case 'fleet_group':
      return 'Fleet-group visibility limited to assigned vehicles and dispatch operations.'
    case 'temporary':
      return 'Temporary commissioning scope with time-bound operational access.'
    default:
      return `Organization-scoped visibility for ${activeTenant.name}.`
  }
}

function buildTenantContextFromUser(user: CPOUser | null, requestedTenantId: string | null): TenantContextResponse | null {
  if (!user) {
    return null
  }

  const activeOrganizationId =
    user.activeOrganizationId
    ?? user.organizationId
    ?? user.accessProfile?.scope.organizationId
    ?? requestedTenantId
    ?? null

  const membershipTenants = (user.memberships ?? []).map((membership) =>
    buildTenantFromMembership(membership, user, membership.organizationId === activeOrganizationId),
  )

  const fallbackTenant = buildFallbackTenant(user, requestedTenantId)
  const availableTenants = membershipTenants.length > 0
    ? membershipTenants
    : fallbackTenant
      ? [fallbackTenant]
      : []

  if (availableTenants.length === 0) {
    return null
  }

  const activeTenant =
    availableTenants.find((tenant) => tenant.id === activeOrganizationId)
    ?? availableTenants.find((tenant) => tenant.id === requestedTenantId)
    ?? availableTenants[0]

  return {
    activeTenant,
    availableTenants,
    canSwitchTenants: (user.memberships?.length ?? 0) > 1,
    dashboardMode: inferDashboardMode(user, activeTenant),
    dataScopeLabel: buildDataScopeLabel(user, activeTenant),
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const activeTenantId = useAuthStore((state) => state.activeTenantId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setActiveTenantId = useAuthStore((state) => state.setActiveTenantId)
  const setTokens = useAuthStore((state) => state.setTokens)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const token = useAuthStore((state) => state.token)
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false)
  const [isSwitchingStationContext, setIsSwitchingStationContext] = useState(false)

  const authDerivedContext = useMemo(
    () => buildTenantContextFromUser(user, activeTenantId),
    [activeTenantId, user],
  )

  const activeStationContext = user?.activeStationContext ?? null
  const availableStationContexts = user?.stationContexts ?? EMPTY_STATION_CONTEXTS
  const canSwitchStationContexts = availableStationContexts.length > 1

  const { data: fallbackContext, isLoading: isFallbackLoading, isSuccess: isFallbackSuccess } = useQuery<TenantContextResponse>({
    queryKey: ['tenancy', 'context', token, activeTenantId],
    queryFn: async () => {
      const tenantRecords = await fetchJson<BackendTenantRecord[]>('/api/v1/tenants')
      const availableTenants = (Array.isArray(tenantRecords) ? tenantRecords : []).map(toTenantSummary)

      const fallbackTenant: TenantSummary = {
        id: 'default',
        name: 'Default Tenant',
        code: 'DEFAULT',
        currency: 'KES',
        description: '',
        region: 'Unknown',
        scope: 'organization',
        scopeLabel: 'Organization scope',
        slug: 'default',
        timeZone: 'Africa/Nairobi',
        stationCount: 0,
        siteCount: 0,
        chargePointCount: 0,
      }

      const activeTenant =
        availableTenants.find((tenant) => tenant.id === activeTenantId)
        ?? availableTenants[0]
        ?? fallbackTenant

      return {
        activeTenant,
        availableTenants: availableTenants.length > 0 ? availableTenants : [activeTenant],
        canSwitchTenants: availableTenants.length > 1,
        dashboardMode: activeTenant.scope === 'site' ? 'site' : 'operations',
        dataScopeLabel: activeTenant.scopeLabel || `${activeTenant.name} scope`,
      }
    },
    enabled: isAuthenticated && !!token && !authDerivedContext,
    staleTime: 60_000,
  })

  const contextData = authDerivedContext ?? fallbackContext ?? null
  const resolvedTenantScopeId = contextData?.activeTenant.id
    ?? user?.activeOrganizationId
    ?? user?.organizationId
    ?? activeTenantId
    ?? 'default'
  const activeScopeKey = `${resolvedTenantScopeId}:${activeStationContext?.assignmentId ?? 'all'}`

  const refreshCurrentUser = useCallback(async () => {
    const refreshedUser = await fetchJson<AuthenticatedApiUser>('/api/v1/users/me')
    replaceUser(refreshedUser)
  }, [replaceUser])

  useEffect(() => {
    const synchronizedTenantId = user?.activeOrganizationId ?? contextData?.activeTenant.id
    if (synchronizedTenantId && synchronizedTenantId !== activeTenantId) {
      setActiveTenantId(synchronizedTenantId)
    }
  }, [activeTenantId, contextData?.activeTenant.id, setActiveTenantId, user?.activeOrganizationId])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    void (async () => {
      if (!tenantId || tenantId === activeTenantId) {
        return
      }

      const canSwitchViaBackend = Boolean(
        token
        && user?.memberships?.some((membership) => membership.organizationId === tenantId),
      )

      if (!canSwitchViaBackend) {
        setActiveTenantId(tenantId)
        return
      }

      setIsSwitchingTenant(true)

      try {
        const auth = await fetchJson<LoginResponse>('/api/v1/auth/switch-organization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId: tenantId }),
        })

        const bearerToken = auth.accessToken ?? auth.token
        if (bearerToken) {
          setTokens(bearerToken, auth.refreshToken ?? null)
        }

        if (auth.user) {
          replaceUser(auth.user)
        } else {
          setActiveTenantId(tenantId)
        }
      } catch (error) {
        console.error('Failed to switch organization context.', error)
      } finally {
        setIsSwitchingTenant(false)
      }
    })()
  }, [activeTenantId, replaceUser, setActiveTenantId, setTokens, token, user?.memberships])

  const handleStationContextSwitch = useCallback((assignmentId: string) => {
    void (async () => {
      if (!assignmentId || assignmentId === activeStationContext?.assignmentId || !token) {
        return
      }

      setIsSwitchingStationContext(true)

      try {
        await fetchJson<{ stationContexts: StationContextSummary[]; activeStationContext: StationContextSummary | null }>(
          '/api/v1/users/me/station-context',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ assignmentId }),
          },
        )

        await refreshCurrentUser()
      } catch (error) {
        console.error('Failed to switch station context.', error)
      } finally {
        setIsSwitchingStationContext(false)
      }
    })()
  }, [activeStationContext?.assignmentId, refreshCurrentUser, token])

  const value = useMemo<TenantContextType>(() => ({
    activeTenant: contextData?.activeTenant ?? null,
    activeTenantId: contextData?.activeTenant.id ?? activeTenantId,
    activeStationContext,
    activeScopeKey,
    availableTenants: contextData?.availableTenants ?? [],
    availableStationContexts,
    canSwitchTenants: contextData?.canSwitchTenants ?? false,
    canSwitchStationContexts,
    dashboardMode: contextData?.dashboardMode ?? 'operations',
    dataScopeLabel: contextData?.dataScopeLabel ?? 'Tenant scope loading',
    isLoading: isAuthenticated ? isSwitchingTenant || isSwitchingStationContext || (!authDerivedContext && isFallbackLoading) : false,
    isReady: !isAuthenticated || Boolean(authDerivedContext) || isFallbackSuccess || !isFallbackLoading,
    setActiveTenantId: handleTenantSwitch,
    setActiveStationContextId: handleStationContextSwitch,
  }), [
    activeTenantId,
    activeScopeKey,
    activeStationContext,
    authDerivedContext,
    availableStationContexts,
    canSwitchStationContexts,
    contextData,
    handleStationContextSwitch,
    handleTenantSwitch,
    isAuthenticated,
    isFallbackLoading,
    isFallbackSuccess,
    isSwitchingStationContext,
    isSwitchingTenant,
  ])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
