import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type {
  BatteryInventoryResponse,
  BatteryPackRecord,
  BatterySwapSessionRecord,
  SwapDispatchActionRequest,
  SwapDispatchActionResponse,
  SwapPackInspectionRequest,
  SwapPackMutationResponse,
  SwapPackRetirementRequest,
  SwapPackTransitionRequest,
  SwapRebalancingResponse,
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

interface TransitionPackPayload extends SwapPackTransitionRequest {
  packId: string
}

interface InspectPackPayload extends SwapPackInspectionRequest {
  packId: string
}

interface RetirementPackPayload extends SwapPackRetirementRequest {
  packId: string
}

interface DispatchActionPayload extends SwapDispatchActionRequest {
  recommendationId: string
}

function useSwapMutationInvalidation(tenantKey: string) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['swap-stations', tenantKey] })
    queryClient.invalidateQueries({ queryKey: ['swapping', 'inventory', tenantKey] })
    queryClient.invalidateQueries({ queryKey: ['swapping', 'rebalancing', tenantKey] })
  }
}

export function useTransitionSwapPack() {
  const { activeTenantId } = useTenant()
  const tenantKey = activeTenantId ?? 'default'
  const invalidate = useSwapMutationInvalidation(tenantKey)

  return useMutation({
    mutationFn: ({ packId, ...payload }: TransitionPackPayload) =>
      fetchJson<SwapPackMutationResponse>(`/api/swapping/packs/${packId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  })
}

export function useInspectSwapPack() {
  const { activeTenantId } = useTenant()
  const tenantKey = activeTenantId ?? 'default'
  const invalidate = useSwapMutationInvalidation(tenantKey)

  return useMutation({
    mutationFn: ({ packId, ...payload }: InspectPackPayload) =>
      fetchJson<SwapPackMutationResponse>(`/api/swapping/packs/${packId}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  })
}

export function useRetireSwapPack() {
  const { activeTenantId } = useTenant()
  const tenantKey = activeTenantId ?? 'default'
  const invalidate = useSwapMutationInvalidation(tenantKey)

  return useMutation({
    mutationFn: ({ packId, ...payload }: RetirementPackPayload) =>
      fetchJson<SwapPackMutationResponse>(`/api/swapping/packs/${packId}/retirement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  })
}

export function useSwapRebalancing() {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<SwapRebalancingResponse>({
    queryKey: ['swapping', 'rebalancing', activeTenantId ?? 'default'],
    queryFn: () => fetchJson<SwapRebalancingResponse>('/api/swapping/rebalancing'),
    enabled: isReady,
  })
}

export function useSwapDispatchAction() {
  const { activeTenantId } = useTenant()
  const tenantKey = activeTenantId ?? 'default'
  const invalidate = useSwapMutationInvalidation(tenantKey)

  return useMutation({
    mutationFn: ({ recommendationId, ...payload }: DispatchActionPayload) =>
      fetchJson<SwapDispatchActionResponse>(`/api/swapping/rebalancing/${recommendationId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  })
}

export const PACK_STATUS_FLOW: Record<BatteryPackRecord['status'], BatteryPackRecord['status'][]> = {
  Ready: ['Charging', 'Reserved', 'Installed', 'Quarantined'],
  Charging: ['Ready', 'Reserved', 'Quarantined'],
  Reserved: ['Ready', 'Installed', 'Quarantined'],
  Installed: ['Ready', 'Charging', 'Quarantined'],
  Quarantined: ['Ready', 'Charging', 'Reserved', 'Retired'],
  Retired: [],
}
