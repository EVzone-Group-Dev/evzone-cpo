import { useQuery } from '@tanstack/react-query'

export interface Station {
  id: string
  name: string
  status: 'Online' | 'Offline' | 'Degraded' | 'Faulted'
  address: string
  city: string
  country: string
  capacity: number
  chargePoints: any[]
  lat: number
  lng: number
}

export function useStations() {
  return useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/api/stations')
      if (!res.ok) throw new Error('Failed to fetch stations')
      return res.json()
    },
  })
}

export function useStation(id?: string) {
  return useQuery<Station>({
    queryKey: ['stations', id],
    queryFn: async () => {
      const res = await fetch(`/api/stations/${id}`)
      if (!res.ok) throw new Error('Station not found')
      return res.json()
    },
    enabled: !!id,
  })
}
