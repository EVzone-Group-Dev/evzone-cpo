import { useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'
import { TenantContext } from '@/core/contexts/tenantSessionContext'
import type { TenantContextType } from '@/core/contexts/tenantSessionContext'
import type { DashboardMode, TenantContextResponse, TenantSummary } from '@/core/types/mockApi'

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

function inferDashboardMode(scope: TenantSummary['scope']): DashboardMode {
  return scope === 'site' ? 'site' : 'operations'
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const activeTenantId = useAuthStore((state) => state.activeTenantId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setActiveTenantId = useAuthStore((state) => state.setActiveTenantId)
  const token = useAuthStore((state) => state.token)

  const { data, isLoading, isSuccess } = useQuery<TenantContextResponse>({
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
        dashboardMode: inferDashboardMode(activeTenant.scope),
        dataScopeLabel: activeTenant.scopeLabel || `${activeTenant.name} scope`,
      }
    },
    enabled: isAuthenticated && !!token,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (data?.activeTenant.id && data.activeTenant.id !== activeTenantId) {
      setActiveTenantId(data.activeTenant.id)
    }
  }, [activeTenantId, data?.activeTenant.id, setActiveTenantId])

  const value = useMemo<TenantContextType>(() => ({
    activeTenant: data?.activeTenant ?? null,
    activeTenantId: data?.activeTenant.id ?? activeTenantId,
    availableTenants: data?.availableTenants ?? [],
    canSwitchTenants: data?.canSwitchTenants ?? false,
    dashboardMode: data?.dashboardMode ?? 'operations',
    dataScopeLabel: data?.dataScopeLabel ?? 'Tenant scope loading',
    isLoading: isAuthenticated ? isLoading : false,
    isReady: !isAuthenticated || isSuccess || !isLoading,
    setActiveTenantId: (tenantId: string) => setActiveTenantId(tenantId),
  }), [activeTenantId, data, isAuthenticated, isLoading, isSuccess, setActiveTenantId])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
