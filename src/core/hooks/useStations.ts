import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type { StationDetail, StationSummary } from '@/core/types/mockApi'

export type Station = StationSummary

export function useStations() {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<Station[]>({
    queryKey: ['stations', activeTenantId ?? 'default'],
    queryFn: () => fetchJson<Station[]>('/api/v1/stations'),
    enabled: isReady,
  })
}

export function useStation(id?: string) {
  const { activeTenantId, isReady } = useTenant()

  return useQuery<StationDetail>({
    queryKey: ['stations', activeTenantId ?? 'default', id],
    queryFn: () => fetchJson<StationDetail>(`/api/v1/stations/${id}`),
    enabled: isReady && !!id,
  })
}
