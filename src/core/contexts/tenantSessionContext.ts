import { createContext } from 'react'
import type { StationContextSummary } from '@/core/types/domain'
import type { DashboardMode, TenantSummary } from '@/core/types/mockApi'

export interface TenantContextType {
  activeTenant: TenantSummary | null
  activeTenantId: string | null
  activeStationContext: StationContextSummary | null
  activeScopeKey: string
  availableTenants: TenantSummary[]
  availableStationContexts: StationContextSummary[]
  canSwitchTenants: boolean
  canSwitchStationContexts: boolean
  dashboardMode: DashboardMode
  dataScopeLabel: string
  isLoading: boolean
  isReady: boolean
  setActiveTenantId: (tenantId: string) => void
  setActiveStationContextId: (assignmentId: string) => void
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined)
