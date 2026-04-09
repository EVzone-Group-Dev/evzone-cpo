import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useTenant } from '@/core/hooks/useTenant'
import type {
  StationChargePointSummary,
  StationDetail,
  StationSummary,
} from '@/core/types/mockApi'

type BackendZone = {
  name?: string
  type?: string
  parent?: BackendZone | null
}

type BackendSite = {
  address?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  powerCapacityKw?: number | null
}

type BackendChargePoint = {
  firmwareVersion?: string | null
  id?: string
  lastHeartbeat?: string | null
  model?: string | null
  ocppId?: string | null
  ocppVersion?: string | null
  power?: number | null
  status?: string | null
  type?: string | null
  vendor?: string | null
}

type BackendStation = {
  address?: string | null
  chargePoints?: BackendChargePoint[] | null
  id?: string
  latitude?: number | null
  location?: {
    lat?: number | null
    lng?: number | null
  } | null
  longitude?: number | null
  name?: string | null
  operationalStatus?: string | null
  site?: BackendSite | null
  status?: string | null
  type?: string | null
  zone?: BackendZone | null
}

type BackendStationUptime = {
  downtime?: number | null
  uptime?: number | null
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function toRelativeTimeLabel(value?: string | null): string {
  const raw = asString(value)
  if (!raw) {
    return 'No heartbeat'
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }

  const diffMs = Math.max(0, Date.now() - parsed.getTime())
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function collectZoneChain(zone?: BackendZone | null) {
  const chain: BackendZone[] = []
  let current = zone ?? null

  while (current) {
    chain.push(current)
    current = current.parent ?? null
  }

  return chain
}

function deriveStationCity(station: BackendStation): string {
  const zoneChain = collectZoneChain(station.zone)
  const locality =
    zoneChain.find((zone) => asString(zone.type).toUpperCase() === 'CITY')
    ?? zoneChain.find((zone) => ['ADM1', 'ADM2', 'ADM3'].includes(asString(zone.type).toUpperCase()))

  return asString(locality?.name, asString(station.site?.city, 'Unknown city'))
}

function deriveStationCountry(station: BackendStation): string {
  const zoneChain = collectZoneChain(station.zone)
  const country = zoneChain.find((zone) => asString(zone.type).toUpperCase() === 'COUNTRY')
  return asString(country?.name, 'Unknown country')
}

function normalizeStationStatus(value: unknown): StationSummary['status'] {
  const normalized = asString(value, 'OFFLINE').toUpperCase()

  if (normalized === 'ONLINE' || normalized === 'ACTIVE') return 'Online'
  if (normalized === 'FAULTED' || normalized === 'ERROR') return 'Faulted'
  if (normalized === 'DEGRADED' || normalized === 'MAINTENANCE' || normalized === 'PAUSED') return 'Degraded'

  return 'Offline'
}

function normalizeServiceMode(value: unknown): StationSummary['serviceMode'] {
  const normalized = asString(value, 'CHARGING').toUpperCase()

  if (normalized === 'BOTH' || normalized === 'HYBRID') return 'Hybrid'
  if (normalized === 'SWAP' || normalized === 'SWAPPING') return 'Swapping'

  return 'Charging'
}

function normalizeChargePointStatus(value: unknown): StationChargePointSummary['status'] {
  const normalized = asString(value, 'UNAVAILABLE').toUpperCase()

  if (normalized === 'CHARGING' || normalized === 'IN_USE' || normalized === 'ACTIVE') return 'Charging'
  if (normalized === 'AVAILABLE' || normalized === 'ONLINE') return 'Available'
  if (normalized === 'FAULTED' || normalized === 'ERROR') return 'Faulted'

  return 'Unavailable'
}

function normalizeStationChargePoint(value: BackendChargePoint, fallbackIndex = 0): StationChargePointSummary {
  const id = asString(value.id, `cp-${fallbackIndex + 1}`)

  return {
    id,
    ocppId: asString(value.ocppId, id),
    model: asString(value.model, asString(value.ocppId, id)),
    manufacturer: asString(value.vendor, 'Unknown Manufacturer'),
    firmwareVersion: asString(value.firmwareVersion, 'Unknown firmware'),
    ocppVersion: asString(value.ocppVersion, 'Unknown'),
    type: asString(value.type, 'CCS2'),
    maxPowerKw: asNumber(value.power, 0),
    status: normalizeChargePointStatus(value.status),
    lastHeartbeatAt: asString(value.lastHeartbeat, ''),
    lastHeartbeatLabel: toRelativeTimeLabel(value.lastHeartbeat),
  }
}

function normalizeStationBase(value: BackendStation, fallbackIndex = 0): StationSummary {
  const chargePoints = Array.isArray(value.chargePoints)
    ? value.chargePoints.map((chargePoint, index) => normalizeStationChargePoint(chargePoint, index))
    : []
  const summedCapacity = chargePoints.reduce((sum, chargePoint) => sum + asNumber(chargePoint.maxPowerKw, 0), 0)
  const lat = asNumber(value.latitude ?? value.location?.lat ?? value.site?.latitude, 0)
  const lng = asNumber(value.longitude ?? value.location?.lng ?? value.site?.longitude, 0)

  const latestHeartbeat =
    [...chargePoints]
      .map((chargePoint) => chargePoint.lastHeartbeatAt)
      .filter((timestamp): timestamp is string => Boolean(timestamp))
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
    ?? null

  const connectivityPoints = chargePoints.length > 0
    ? chargePoints.map((chargePoint) => {
      const timestamp = chargePoint.lastHeartbeatAt
      if (!timestamp) return 8
      const ageSeconds = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 1000)
      return Math.max(8, Math.round(100 - Math.min(ageSeconds, 300) / 3))
    })
    : [8, 8, 8, 8, 8, 8]

  return {
    id: asString(value.id, `station-${fallbackIndex + 1}`),
    name: asString(value.name, `Station ${fallbackIndex + 1}`),
    address: asString(value.address, asString(value.site?.address, 'Unknown address')),
    city: deriveStationCity(value),
    country: deriveStationCountry(value),
    lat,
    lng,
    capacity: summedCapacity > 0 ? summedCapacity : asNumber(value.site?.powerCapacityKw, 0),
    status: normalizeStationStatus(value.operationalStatus ?? value.status),
    serviceMode: normalizeServiceMode(value.type),
    chargePoints,
    networkLatency: {
      averageLabel: latestHeartbeat ? toRelativeTimeLabel(latestHeartbeat) : 'No telemetry',
      modeLabel: latestHeartbeat ? 'Derived from charge point heartbeats' : 'Unavailable',
      points: connectivityPoints,
    },
  }
}

function normalizeStationDetail(value: BackendStation): StationDetail {
  const base = normalizeStationBase(value)
  const firmwareVersions = Array.from(
    new Set(
      base.chargePoints
        .map((chargePoint) => chargePoint.firmwareVersion)
        .filter((version): version is string => Boolean(version && version !== 'Unknown firmware')),
    ),
  )
  const ocppVersions = Array.from(
    new Set(
      base.chargePoints
        .map((chargePoint) => chargePoint.ocppVersion)
        .filter((version): version is string => Boolean(version && version !== 'Unknown')),
    ),
  )

  return {
    ...base,
    dailyAverageKwh: 'N/A',
    geofenceStatus:
      base.lat !== 0 || base.lng !== 0
        ? `${base.lat.toFixed(4)}, ${base.lng.toFixed(4)}`
        : 'Coordinates unavailable',
    recentEvents: [],
    systemIntegrity: {
      firmwareVersion: firmwareVersions.length > 0 ? firmwareVersions.join(', ') : 'Unavailable at station level',
      ocppVersion: ocppVersions.length > 0 ? ocppVersions.join(', ') : 'Unavailable at station level',
      slaCompliance: 'N/A',
    },
    uptimePercent30d: 'N/A',
  }
}

function normalizeUptimeSummary(value: BackendStationUptime) {
  const uptime = typeof value.uptime === 'number' ? value.uptime : null
  const downtime = typeof value.downtime === 'number' ? value.downtime : null

  return {
    uptimePercent: uptime,
    downtimePercent: downtime,
    uptimeLabel: uptime == null ? 'N/A' : `${uptime.toFixed(1)}%`,
  }
}

export type Station = StationSummary
export type StationUptimeSummary = ReturnType<typeof normalizeUptimeSummary>

export function useStations() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<Station[]>({
    queryKey: ['stations', activeScopeKey],
    queryFn: async () => {
      const stations = await fetchJson<BackendStation[]>('/api/v1/stations')
      return (Array.isArray(stations) ? stations : []).map((station, index) => normalizeStationBase(station, index))
    },
    enabled: isReady,
  })
}

export function useStation(id?: string) {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<StationDetail>({
    queryKey: ['stations', activeScopeKey, id],
    queryFn: async () => normalizeStationDetail(await fetchJson<BackendStation>(`/api/v1/stations/${id}`)),
    enabled: isReady && !!id,
  })
}

export function useStationUptime(id?: string) {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<StationUptimeSummary>({
    queryKey: ['stations', 'uptime', activeScopeKey, id],
    queryFn: async () =>
      normalizeUptimeSummary(
        await fetchJson<BackendStationUptime>(`/api/v1/analytics/uptime?stationId=${encodeURIComponent(id ?? '')}`),
      ),
    enabled: isReady && !!id,
  })
}
