import { createContext } from 'react'
import type { DashboardMode, TenantSummary } from '@/core/types/mockApi'

export interface TenantContextType {
  activeTenant: TenantSummary | null
  activeTenantId: string | null
  availableTenants: TenantSummary[]
  canSwitchTenants: boolean
  dashboardMode: DashboardMode
  dataScopeLabel: string
  isLoading: boolean
  isReady: boolean
  setActiveTenantId: (tenantId: string) => void
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined)
