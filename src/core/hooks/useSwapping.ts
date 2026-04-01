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

type BackendStation = {
  id: string
  name?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  location?: { lat?: number; lng?: number }
  status?: string
  operationalStatus?: string
  type?: string
  chargePoints?: Array<{ id: string }>
}

type BackendSession = {
  id: string
  stationId?: string
  station?: { id?: string; name?: string }
  startTime?: string
  endTime?: string | null
  createdAt?: string
  amount?: number | string
  status?: string
}

type BackendBatteryPack = {
  id: string
  serialNumber?: string
  status?: string
  soc?: number
  soh?: number
  cycleCount?: number
  stationId?: string | null
  lockerBayId?: string | null
  createdAt?: string
  updatedAt?: string
}

type BackendBatteryTelemetry = {
  voltage?: number
  current?: number
  soc?: number
  temps?: unknown
  cells?: unknown
}

const BMS_BASE_PATH = '/api/v1/v1/bms'

function stationStatusToSwapStatus(status?: string): SwapStationSummary['status'] {
  const normalized = (status ?? '').toUpperCase()

  if (normalized === 'ONLINE' || normalized === 'ACTIVE') return 'Online'
  if (normalized === 'DEGRADED') return 'Degraded'
  if (normalized === 'MAINTENANCE') return 'Maintenance'
  if (normalized === 'OFFLINE' || normalized === 'INACTIVE') return 'Offline'

  return 'Degraded'
}

function stationTypeToServiceMode(type?: string): SwapStationSummary['serviceMode'] {
  const normalized = (type ?? '').toUpperCase()

  if (normalized === 'BOTH' || normalized === 'HYBRID') return 'Hybrid'
  return 'Swapping'
}

function bmsStatusToPackStatus(status?: string): BatteryPackRecord['status'] {
  const normalized = (status ?? '').toUpperCase()

  if (normalized === 'READY') return 'Ready'
  if (normalized === 'CHARGING') return 'Charging'
  if (normalized === 'IN_TRANSIT') return 'Reserved'
  if (normalized === 'RETIRED') return 'Retired'
  if (normalized === 'FAULTED' || normalized === 'LOCKED_REMOTE') return 'Quarantined'

  return 'Reserved'
}

function sessionStatusToSwapStatus(status?: string): BatterySwapSessionRecord['status'] {
  const normalized = (status ?? '').toUpperCase()

  if (normalized === 'COMPLETED') return 'Completed'
  if (normalized === 'ACTIVE' || normalized === 'PENDING') return 'In Progress'

  return 'Flagged'
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatDateLabel(dateValue?: string | null): string {
  if (!dateValue) return 'N/A'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

function formatDurationLabel(start?: string, end?: string | null): string {
  if (!start || !end) return 'N/A'
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 'N/A'
  const seconds = Math.round((endMs - startMs) / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder.toString().padStart(2, '0')}s`
}

function formatCurrency(value: number | string | undefined): string {
  const amount = asNumber(value, 0)
  return `KES ${amount.toFixed(0)}`
}

function toPackRecord(pack: BackendBatteryPack, stationName: string): BatteryPackRecord {
  const soc = asNumber(pack.soc, 0)
  const soh = asNumber(pack.soh, 0)

  return {
    id: pack.serialNumber || pack.id,
    chemistry: 'LFP',
    cycleCount: asNumber(pack.cycleCount, 0),
    healthLabel: `${soh.toFixed(1)}%`,
    lastSeenLabel: formatDateLabel(pack.updatedAt || pack.createdAt),
    slotLabel: pack.lockerBayId ? `Bay ${pack.lockerBayId}` : 'Unassigned',
    socLabel: `${soc.toFixed(1)}%`,
    stationName,
    status: bmsStatusToPackStatus(pack.status),
  }
}

function normalizeNumericArray(input: unknown): number[] {
  if (Array.isArray(input)) {
    return input.map((entry) => asNumber(entry, 0))
  }

  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>).map((entry) => asNumber(entry, 0))
  }

  return []
}

function normalizeTelemetry(payload: BackendBatteryTelemetry | undefined): PackTelemetryResponse {
  if (!payload) {
    return {
      voltage: 0,
      current: 0,
      soc: 0,
      temps: [],
      cells: [],
    }
  }

  return {
    voltage: asNumber(payload.voltage, 0),
    current: asNumber(payload.current, 0),
    soc: asNumber(payload.soc, 0),
    temps: normalizeNumericArray(payload.temps),
    cells: normalizeNumericArray(payload.cells),
  }
}

function summarizeInventoryMetrics(packs: BatteryPackRecord[]): BatteryInventoryResponse['metrics'] {
  const byStatus = {
    Ready: packs.filter((pack) => pack.status === 'Ready').length,
    Charging: packs.filter((pack) => pack.status === 'Charging').length,
    Reserved: packs.filter((pack) => pack.status === 'Reserved').length,
    Quarantined: packs.filter((pack) => pack.status === 'Quarantined').length,
    Retired: packs.filter((pack) => pack.status === 'Retired').length,
  }

  return [
    { id: 'ready', label: 'Ready Packs', value: byStatus.Ready.toString(), tone: 'ok' },
    { id: 'charging', label: 'Charging Packs', value: byStatus.Charging.toString(), tone: 'warning' },
    { id: 'reserved', label: 'Reserved Packs', value: byStatus.Reserved.toString(), tone: 'default' },
    { id: 'quarantined', label: 'Quarantined Packs', value: byStatus.Quarantined.toString(), tone: 'danger' },
    { id: 'retired', label: 'Retired Packs', value: byStatus.Retired.toString(), tone: 'default' },
  ]
}

function unsupportedSwapActionMessage(action: string) {
  return `Backend endpoint for "${action}" is not available yet.`
}

export type SwapStation = SwapStationSummary

export function useSwapStations() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<SwapStation[]>({
    queryKey: ['swap-stations', activeScopeKey],
    queryFn: async () => {
      const [stations, packs] = await Promise.all([
        fetchJson<BackendStation[]>('/api/v1/stations'),
        fetchJson<BackendBatteryPack[]>(`${BMS_BASE_PATH}/packs`).catch(() => []),
      ])

      const stationRecords = Array.isArray(stations) ? stations : []
      const packRecords = Array.isArray(packs) ? packs : []
      const packCounts = new Map<string, { ready: number; charging: number }>()

      for (const pack of packRecords) {
        if (!pack.stationId) continue
        const count = packCounts.get(pack.stationId) ?? { ready: 0, charging: 0 }
        const status = bmsStatusToPackStatus(pack.status)
        if (status === 'Ready') count.ready += 1
        if (status === 'Charging') count.charging += 1
        packCounts.set(pack.stationId, count)
      }

      const swapStations = stationRecords.filter((station) => {
        const stationType = (station.type ?? '').toUpperCase()
        return stationType === 'SWAP' || stationType === 'BOTH' || stationType === 'HYBRID'
      })

      const sourceStations = swapStations.length > 0 ? swapStations : stationRecords

      return sourceStations.map((station) => {
        const counts = packCounts.get(station.id) ?? { ready: 0, charging: 0 }
        const lat = asNumber(station.latitude ?? station.location?.lat, 0)
        const lng = asNumber(station.longitude ?? station.location?.lng, 0)
        const cabinetCount = Math.max(1, station.chargePoints?.length ?? 1)

        return {
          id: station.id,
          name: station.name ?? station.id,
          address: station.address ?? 'Unknown address',
          city: station.city ?? 'Unknown city',
          country: station.country ?? 'Unknown country',
          lat,
          lng,
          serviceMode: stationTypeToServiceMode(station.type),
          status: stationStatusToSwapStatus(station.operationalStatus ?? station.status),
          cabinetCount,
          readyPacks: counts.ready,
          chargingPacks: counts.charging,
          avgSwapDurationLabel: 'N/A',
        }
      })
    },
    enabled: isReady,
  })
}

export function useSwapStation(id?: string) {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<SwapStationDetail>({
    queryKey: ['swap-stations', activeScopeKey, id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Station id is required')
      }

      const [station, packs, sessions] = await Promise.all([
        fetchJson<BackendStation>(`/api/v1/stations/${id}`),
        fetchJson<BackendBatteryPack[]>(`${BMS_BASE_PATH}/packs`).catch(() => []),
        fetchJson<BackendSession[]>('/api/v1/sessions/history/all').catch(() => []),
      ])

      const stationName = station?.name ?? id
      const stationPacks = (Array.isArray(packs) ? packs : []).filter((pack) => pack.stationId === id)
      const fallbackPacks = stationPacks.length > 0 ? stationPacks : (Array.isArray(packs) ? packs : [])
      const mappedPacks = fallbackPacks.map((pack) => toPackRecord(pack, stationName))

      const readyPacks = mappedPacks.filter((pack) => pack.status === 'Ready').length
      const chargingPacks = mappedPacks.filter((pack) => pack.status === 'Charging').length
      const lat = asNumber(station.latitude ?? station.location?.lat, 0)
      const lng = asNumber(station.longitude ?? station.location?.lng, 0)
      const stationStatus = stationStatusToSwapStatus(station.operationalStatus ?? station.status)
      const cabinetCount = Math.max(1, station.chargePoints?.length ?? 1)

      const stationSessions: SwapStationDetail['recentSwaps'] = (Array.isArray(sessions) ? sessions : [])
        .filter((session) => (session.stationId ?? session.station?.id) === id)
        .slice(0, 5)
        .map((session) => {
          const rawStatus = sessionStatusToSwapStatus(session.status)
          const status: SwapStationDetail['recentSwaps'][number]['status'] = rawStatus === 'Completed'
            ? 'Completed'
            : rawStatus === 'Flagged'
              ? 'Flagged'
              : 'In Progress'

          return {
            id: session.id,
            riderLabel: `Rider ${session.id.slice(0, 6)}`,
            returnedPackId: 'N/A',
            durationLabel: formatDurationLabel(session.startTime ?? session.createdAt, session.endTime),
            timeLabel: formatDateLabel(session.startTime ?? session.createdAt),
            status,
          }
        })

      const alerts: SwapStationDetail['alerts'] = []
      if (stationStatus === 'Offline' || stationStatus === 'Degraded') {
        alerts.push({
          level: 'Critical',
          message: `Station status is ${stationStatus}.`,
        })
      }
      if (readyPacks < 5) {
        alerts.push({
          level: 'Warning',
          message: `Ready pack reserve is low (${readyPacks} packs).`,
        })
      }
      if (alerts.length === 0) {
        alerts.push({
          level: 'Info',
          message: 'Station operating within expected thresholds.',
        })
      }

      return {
        id,
        name: stationName,
        address: station?.address ?? 'Unknown address',
        city: station?.city ?? 'Unknown city',
        country: station?.country ?? 'Unknown country',
        lat,
        lng,
        serviceMode: stationTypeToServiceMode(station?.type),
        status: stationStatus,
        cabinetCount,
        readyPacks,
        chargingPacks,
        avgSwapDurationLabel: 'N/A',
        gridBufferLabel: 'Grid buffering telemetry not available from backend yet.',
        packs: mappedPacks,
        cabinets: [
          {
            id: `${id}-cabinet-1`,
            model: 'EVzone Cabinet',
            status: stationStatus,
            availableChargedPacks: readyPacks,
            chargingPacks,
            reservedPacks: mappedPacks.filter((pack) => pack.status === 'Reserved').length,
            slotCount: Math.max(mappedPacks.length, 12),
            lastHeartbeatLabel: 'N/A',
          },
        ],
        recentSwaps: stationSessions,
        alerts,
      }
    },
    enabled: isReady && !!id,
  })
}

export function useSwapSessions() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<BatterySwapSessionRecord[]>({
    queryKey: ['swapping', 'sessions', activeScopeKey],
    queryFn: async () => {
      const [sessions, stations] = await Promise.all([
        fetchJson<BackendSession[]>('/api/v1/sessions/history/all'),
        fetchJson<BackendStation[]>('/api/v1/stations').catch(() => []),
      ])

      const stationLookup = new Map<string, string>()
      for (const station of Array.isArray(stations) ? stations : []) {
        stationLookup.set(station.id, station.name ?? station.id)
      }

      return (Array.isArray(sessions) ? sessions : []).map((session) => {
        const stationId = session.stationId ?? session.station?.id ?? 'unknown'
        const stationName =
          session.station?.name
          ?? stationLookup.get(stationId)
          ?? stationId

        const status = sessionStatusToSwapStatus(session.status)
        return {
          id: session.id,
          stationName,
          cabinetId: `${stationId}-cabinet-1`,
          outgoingPackId: `PK-${session.id.slice(0, 6)}`,
          returnedPackId: `PK-${session.id.slice(-6)}`,
          initiatedAt: formatDateLabel(session.startTime ?? session.createdAt),
          turnaroundLabel: formatDurationLabel(session.startTime ?? session.createdAt, session.endTime),
          riderLabel: `Rider ${session.id.slice(0, 4)}`,
          healthCheck: status === 'Flagged' ? 'Failed' : 'Passed',
          status,
          revenue: formatCurrency(session.amount),
        }
      })
    },
    enabled: isReady,
  })
}

export function useBatteryInventory() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<BatteryInventoryResponse>({
    queryKey: ['swapping', 'inventory', activeScopeKey],
    queryFn: async () => {
      const [packs, stations] = await Promise.all([
        fetchJson<BackendBatteryPack[]>(`${BMS_BASE_PATH}/packs`),
        fetchJson<BackendStation[]>('/api/v1/stations').catch(() => []),
      ])

      const stationLookup = new Map<string, string>()
      for (const station of Array.isArray(stations) ? stations : []) {
        stationLookup.set(station.id, station.name ?? station.id)
      }

      const mappedPacks = (Array.isArray(packs) ? packs : []).map((pack) =>
        toPackRecord(pack, stationLookup.get(pack.stationId ?? '') ?? 'Unassigned'),
      )

      return {
        balancingNote: 'Inventory is sourced from backend BMS pack telemetry.',
        packs: mappedPacks,
        metrics: summarizeInventoryMetrics(mappedPacks),
      }
    },
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

function useSwapMutationInvalidation(scopeKey: string) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['swap-stations', scopeKey] })
    queryClient.invalidateQueries({ queryKey: ['swapping', 'inventory', scopeKey] })
    queryClient.invalidateQueries({ queryKey: ['swapping', 'rebalancing', scopeKey] })
  }
}

export function useTransitionSwapPack() {
  const { activeScopeKey } = useTenant()
  const invalidate = useSwapMutationInvalidation(activeScopeKey)

  return useMutation({
    mutationFn: async (payload: TransitionPackPayload): Promise<SwapPackMutationResponse> => {
      void payload
      throw new Error(unsupportedSwapActionMessage('pack transition'))
    },
    onSuccess: invalidate,
  })
}

export function useInspectSwapPack() {
  const { activeScopeKey } = useTenant()
  const invalidate = useSwapMutationInvalidation(activeScopeKey)

  return useMutation({
    mutationFn: async (payload: InspectPackPayload): Promise<SwapPackMutationResponse> => {
      void payload
      throw new Error(unsupportedSwapActionMessage('pack inspection'))
    },
    onSuccess: invalidate,
  })
}

export function useRetireSwapPack() {
  const { activeScopeKey } = useTenant()
  const invalidate = useSwapMutationInvalidation(activeScopeKey)

  return useMutation({
    mutationFn: async (payload: RetirementPackPayload): Promise<SwapPackMutationResponse> => {
      void payload
      throw new Error(unsupportedSwapActionMessage('pack retirement'))
    },
    onSuccess: invalidate,
  })
}

export function useSwapRebalancing() {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<SwapRebalancingResponse>({
    queryKey: ['swapping', 'rebalancing', activeScopeKey],
    queryFn: async () => ({
      generatedAtLabel: formatDateLabel(new Date().toISOString()),
      recommendations: [],
      dispatches: [],
    }),
    enabled: isReady,
  })
}

export function useSwapDispatchAction() {
  const { activeScopeKey } = useTenant()
  const invalidate = useSwapMutationInvalidation(activeScopeKey)

  return useMutation({
    mutationFn: async (payload: DispatchActionPayload): Promise<SwapDispatchActionResponse> => {
      void payload
      throw new Error(unsupportedSwapActionMessage('dispatch action'))
    },
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

export interface PackTelemetryResponse {
  voltage: number
  current: number
  soc: number
  temps: number[]
  cells: number[]
}

export function usePackTelemetry(packId: string) {
  const { activeScopeKey, isReady } = useTenant()

  return useQuery<PackTelemetryResponse>({
    queryKey: ['swapping', 'telemetry', activeScopeKey, packId],
    queryFn: async () => {
      const telemetry = await fetchJson<BackendBatteryTelemetry[]>(
        `${BMS_BASE_PATH}/packs/${packId}/telemetry?limit=1`,
      )
      const latest = Array.isArray(telemetry) ? telemetry[0] : undefined
      return normalizeTelemetry(latest)
    },
    enabled: isReady && !!packId,
  })
}

export function useRemoteKillPack() {
  const { activeScopeKey } = useTenant()
  const invalidate = useSwapMutationInvalidation(activeScopeKey)

  return useMutation({
    mutationFn: ({ packId, stationId }: { packId: string, stationId: string }) =>
      fetchJson<SwapPackMutationResponse>(`${BMS_BASE_PATH}/packs/${packId}/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          adminToken: import.meta.env.VITE_BMS_ADMIN_TOKEN ?? 'EVZONE_SECURE_ADMIN_TOKEN',
        }),
      }),
    onSuccess: invalidate,
  })
}
