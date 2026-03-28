import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type {
  BatteryInventoryResponse,
  BatterySwapSessionRecord,
  SwapStationDetail,
  SwapStationSummary,
} from '@/core/types/mockApi'

export type SwapStation = SwapStationSummary

export function useSwapStations() {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<SwapStation[]>({
    queryKey: ['swap-stations', activeTenantId ?? 'default'],
    queryFn: () => fetchJson<SwapStation[]>('/api/swapping/stations'),
    enabled: isReady,
  })
}

export function useSwapStation(id?: string) {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<SwapStationDetail>({
    queryKey: ['swap-stations', activeTenantId ?? 'default', id],
    queryFn: () => fetchJson<SwapStationDetail>(`/api/swapping/stations/${id}`),
    enabled: isReady && !!id,
  })
}

export function useSwapSessions() {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<BatterySwapSessionRecord[]>({
    queryKey: ['swapping', 'sessions', activeTenantId ?? 'default'],
    queryFn: () => fetchJson<BatterySwapSessionRecord[]>('/api/swapping/sessions'),
    enabled: isReady,
  })
}

export function useBatteryInventory() {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<BatteryInventoryResponse>({
    queryKey: ['swapping', 'inventory', activeTenantId ?? 'default'],
    queryFn: () => fetchJson<BatteryInventoryResponse>('/api/swapping/inventory'),
    enabled: isReady,
  })
}
