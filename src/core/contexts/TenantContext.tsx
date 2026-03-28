import { useEffect, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'
import { TenantContext } from '@/core/contexts/tenantSessionContext'
import type { TenantContextType } from '@/core/contexts/tenantSessionContext'
import type { TenantContextResponse } from '@/core/types/mockApi'

export function TenantProvider({ children }: { children: ReactNode }) {
  const { activeTenantId, isAuthenticated, setActiveTenantId, token } = useAuthStore((state) => ({
    activeTenantId: state.activeTenantId,
    isAuthenticated: state.isAuthenticated,
    setActiveTenantId: state.setActiveTenantId,
    token: state.token,
  }))

  const { data, isLoading, isSuccess } = useQuery<TenantContextResponse>({
    queryKey: ['tenancy', 'context', token, activeTenantId],
    queryFn: () => fetchJson<TenantContextResponse>('/api/tenancy/context'),
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
