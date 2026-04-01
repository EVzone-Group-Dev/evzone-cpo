import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type { StationDetail, StationSummary } from '@/core/types/mockApi'

export type Station = StationSummary

export function useStations() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<Station[]>({
    queryKey: ['stations', activeScopeKey],
    queryFn: () => fetchJson<Station[]>('/api/v1/stations'),
    enabled: isReady,
  })
}

export function useStation(id?: string) {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<StationDetail>({
    queryKey: ['stations', activeScopeKey, id],
    queryFn: () => fetchJson<StationDetail>(`/api/v1/stations/${id}`),
    enabled: isReady && !!id,
  })
}
