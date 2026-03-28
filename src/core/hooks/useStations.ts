import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import type { StationDetail, StationSummary } from '@/core/types/mockApi'

export type Station = StationSummary

export function useStations() {
  return useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: () => fetchJson<Station[]>('/api/stations'),
  })
}

export function useStation(id?: string) {
  return useQuery<StationDetail>({
    queryKey: ['stations', id],
    queryFn: () => fetchJson<StationDetail>(`/api/stations/${id}`),
    enabled: !!id,
  })
}
