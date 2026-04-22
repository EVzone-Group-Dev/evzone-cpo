import { Link, useParams } from 'react-router-dom'
import { Activity, Clock, Cpu, MapPin, Plus, Shield, Zap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MapComponent } from '@/components/common/MapComponent'
import { canManageStations, useAuthStore } from '@/core/auth/authStore'
import { useSessions } from '@/core/hooks/usePlatformData'
import { useStation, useStationUptime } from '@/core/hooks/useStations'
import { PATHS } from '@/router/paths'

const STATION_CP_STATUS_CLASS = {
  Available: 'active',
  Charging: 'online',
  Faulted: 'faulted',
  Unavailable: 'offline',
} as const

type RecentSignal = {
  description: string
  timeLabel: string
  timestamp: number
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatRelativeTime(value?: string | null) {
  const parsed = parseDateValue(value)
  if (!parsed) {
    return 'N/A'
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

function extractEnergyKwh(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isSameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function heartbeatAgeSeconds(value?: string | null) {
  const parsed = parseDateValue(value)
  if (!parsed) {
    return null
  }

  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 1000))
}

function heartbeatFreshnessScore(value?: string | null) {
  const ageSeconds = heartbeatAgeSeconds(value)
  if (ageSeconds == null) {
    return 8
  }

  return Math.max(8, Math.round(100 - Math.min(ageSeconds, 300) / 3))
}

function summarizeVersions(values: Array<string | undefined>, fallback: string) {
  const unique = Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0 && value !== 'Unknown' && value !== 'Unknown firmware')),
    ),
  )

  return unique.length > 0 ? unique.join(', ') : fallback
}

export function StationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((state) => state.user)
  const canConfigureAssets = canManageStations(user)
  const { data: station, isLoading, error } = useStation(id)
  const { data: uptime, isLoading: isUptimeLoading } = useStationUptime(id)
  const { data: sessions, isLoading: isSessionsLoading } = useSessions()

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading...">
        <div className="p-12 text-center text-subtle font-mono animate-pulse">Retrieving station telemetry...</div>
      </DashboardLayout>
    )
  }

  if (error || !station) {
    return (
      <DashboardLayout pageTitle="Station Not Found">
        <div className="card text-center py-12 border-danger/30" style={{ color: 'var(--danger)' }}>
          <div className="text-lg font-bold">Error 404</div>
          <div className="text-sm opacity-70">Station not found or telemetry stream interrupted.</div>
        </div>
      </DashboardLayout>
    )
  }

  const chargePoints = Array.isArray(station.chargePoints) ? station.chargePoints : []
  const stationSessions = (sessions || []).filter((session) => session.stationId === station.id || session.station === station.name)
  const now = new Date()
  const todayThroughputKwh = stationSessions.reduce((sum, session) => {
    const startedAt = parseDateValue(session.started)
    if (!startedAt || !isSameLocalDay(startedAt, now)) {
      return sum
    }

    return sum + extractEnergyKwh(session.energy)
  }, 0)

  const latestHeartbeat =
    [...chargePoints]
      .map((chargePoint) => chargePoint.lastHeartbeatAt)
      .filter((timestamp): timestamp is string => Boolean(timestamp))
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null

  const connectivityPoints = chargePoints.length > 0
    ? chargePoints.map((chargePoint) => heartbeatFreshnessScore(chargePoint.lastHeartbeatAt))
    : [8, 8, 8, 8, 8, 8]

  const heartbeatAges = chargePoints
    .map((chargePoint) => heartbeatAgeSeconds(chargePoint.lastHeartbeatAt))
    .filter((value): value is number => value != null)
  const averageHeartbeatAgeSeconds = heartbeatAges.length > 0
    ? Math.round(heartbeatAges.reduce((sum, value) => sum + value, 0) / heartbeatAges.length)
    : null
  const liveChargePoints = chargePoints.filter((chargePoint) => {
    const ageSeconds = heartbeatAgeSeconds(chargePoint.lastHeartbeatAt)
    return ageSeconds != null && ageSeconds <= 120
  }).length
  const staleChargePoints = chargePoints.length - liveChargePoints

  const chargePointSignals = chargePoints
    .map((chargePoint) => {
      const timestamp = parseDateValue(chargePoint.lastHeartbeatAt)
      if (!timestamp) {
        return null
      }

      return {
        description: `Heartbeat from ${chargePoint.ocppId ?? chargePoint.id} (${chargePoint.status})`,
        timeLabel: formatRelativeTime(chargePoint.lastHeartbeatAt),
        timestamp: timestamp.getTime(),
      }
    })
    .filter((signal): signal is RecentSignal => Boolean(signal))

  const sessionSignals = stationSessions
    .map((session) => {
      const sourceTime = session.ended ?? session.started
      const timestamp = parseDateValue(sourceTime)
      if (!timestamp) {
        return null
      }

      return {
        description: `Session ${session.id} ${session.status.toLowerCase()} on ${session.cp}`,
        timeLabel: formatRelativeTime(sourceTime),
        timestamp: timestamp.getTime(),
      }
    })
    .filter((signal): signal is RecentSignal => Boolean(signal))

  const recentSignals = [...chargePointSignals, ...sessionSignals]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 6)

  const firmwareSummary = summarizeVersions(
    chargePoints.map((chargePoint) => chargePoint.firmwareVersion),
    'Reported per charge point only',
  )
  const ocppVersionSummary = summarizeVersions(
    chargePoints.map((chargePoint) => chargePoint.ocppVersion),
    'Reported per charge point only',
  )

  const addChargePointHref = `${PATHS.CHARGE_POINT_NEW}?stationId=${encodeURIComponent(station.id)}&returnTo=station-detail`
  const manageChargePointsHref = `${PATHS.CHARGE_POINTS}?stationId=${encodeURIComponent(station.id)}`
  const coordinateLabel = `${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`

  return (
    <DashboardLayout pageTitle={station.name}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-accent" />
            {station.address}, {station.city}, {station.country}
          </div>
          <span className={`pill ${station.status.toLowerCase()}`}>{station.status}</span>
          <span className="pill pending">{station.serviceMode}</span>
        </div>
        {canConfigureAssets && (
          <div className="flex gap-2 flex-wrap">
            <Link to={addChargePointHref} className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-semibold shadow-lg shadow-accent/20 hover:brightness-110 transition-all inline-flex items-center gap-2">
              <Plus size={14} />
              Add Charge Point
            </Link>
            <Link to={manageChargePointsHref} className="px-4 py-2 bg-bg-muted border border-border rounded-lg text-xs font-semibold hover:border-accent transition-all">
              Manage Charge Points
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="kpi-row">
            <div className="kpi-card group hover:border-accent transition-all cursor-default">
              <div className="label">Nominal Power</div>
              <div className="value flex items-center gap-2">{station.capacity.toFixed(0)} kW <Zap size={14} className="text-ok" /></div>
            </div>
            <div className="kpi-card">
              <div className="label">Charging Assets</div>
              <div className="value">{chargePoints.length}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Uptime</div>
              <div className="value">{isUptimeLoading ? 'Loading...' : (uptime?.uptimeLabel ?? 'N/A')}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Today's Throughput</div>
              <div className="value text-accent">
                {isSessionsLoading ? 'Loading...' : `${todayThroughputKwh.toFixed(1)} kWh`}
              </div>
            </div>
          </div>

          <div className="card p-0 h-[400px] overflow-hidden relative border-accent/10 shadow-xl group">
            <MapComponent
              center={{ lat: station.lat, lng: station.lng }}
              zoom={15}
              markers={[{
                id: station.id,
                lat: station.lat,
                lng: station.lng,
                title: station.name,
                status: station.status,
              }]}
            />
            <div className="absolute top-4 right-4 bg-bg/80 backdrop-blur-md border border-border p-2 rounded-lg text-[10px] uppercase tracking-tighter text-subtle pointer-events-none">
              {coordinateLabel}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="section-title"><Cpu size={16} className="text-accent" />Charge Points</div>
              {canConfigureAssets && (
                <Link to={addChargePointHref} className="btn secondary sm inline-flex items-center gap-2">
                  <Plus size={12} />
                  Add Charge Point
                </Link>
              )}
            </div>

            {chargePoints.length > 0 ? (
              <div className="table-wrap mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Charge Point</th>
                      <th>Connector</th>
                      <th>Firmware</th>
                      <th>OCPP</th>
                      <th>Status</th>
                      <th>Last Heartbeat</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargePoints.map((chargePoint) => (
                      <tr key={chargePoint.id}>
                        <td>
                          <div className="font-mono text-xs">{chargePoint.ocppId ?? chargePoint.id}</div>
                          <div className="text-[11px] text-subtle">
                            {chargePoint.model ?? chargePoint.id}
                            {' · '}
                            {chargePoint.manufacturer ?? 'Unknown Manufacturer'}
                          </div>
                        </td>
                        <td className="text-xs">
                          {chargePoint.type}
                          {' · '}
                          {chargePoint.maxPowerKw?.toFixed(0) ?? '0'} kW
                        </td>
                        <td className="text-xs font-mono">{chargePoint.firmwareVersion ?? 'Unknown firmware'}</td>
                        <td className="text-xs font-mono">{chargePoint.ocppVersion ?? 'Unknown'}</td>
                        <td>
                          <span className={`pill ${STATION_CP_STATUS_CLASS[chargePoint.status]}`}>{chargePoint.status}</span>
                        </td>
                        <td className="text-[10px] text-subtle">{chargePoint.lastHeartbeatLabel ?? 'No heartbeat'}</td>
                        <td>
                          <Link to={PATHS.CHARGE_POINT_DETAIL(chargePoint.id)} className="btn secondary sm">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 px-4 py-5 text-sm text-subtle">
                No charging assets are configured for this site.
                {canConfigureAssets && (
                  <>
                    {' '}
                    <Link to={addChargePointHref} className="text-accent hover:underline">Add the first charge point</Link>
                    {' '}to start managing this station.
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card border-l-4 border-l-ok">
            <div className="section-title"><Shield size={16} className="text-ok" />Charge Point Telemetry</div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-subtle">Firmware Versions</span>
                <span className="font-mono bg-bg-muted px-2 py-0.5 rounded text-right">{firmwareSummary}</span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-subtle">OCPP Versions</span>
                <span className="font-mono px-2 py-0.5 rounded border border-border text-right">{ocppVersionSummary}</span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-subtle">Latest Heartbeat</span>
                <span className="text-ok font-bold">{latestHeartbeat ? formatRelativeTime(latestHeartbeat) : 'No telemetry'}</span>
              </div>
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-subtle">Live Units</span>
                <span className="text-ok font-bold">{liveChargePoints}/{chargePoints.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Activity size={16} className="text-accent" />Connectivity</div>
            <div className="mt-4 h-24 flex items-end gap-1 px-2">
              {connectivityPoints.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="flex-1 bg-accent/20 rounded-t-sm hover:bg-accent transition-all cursor-help"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-subtle uppercase">
              <span>
                {averageHeartbeatAgeSeconds == null
                  ? 'No live heartbeat telemetry'
                  : `${averageHeartbeatAgeSeconds}s avg heartbeat age`}
              </span>
              <span>{`${liveChargePoints} live / ${staleChargePoints} stale`}</span>
            </div>
          </div>

          <div className="card border-l-4 border-l-accent/50">
            <div className="section-title"><Clock size={16} className="text-accent" />Recent Signals</div>
            {recentSignals.length > 0 ? (
              <div className="mt-4 space-y-4">
                {recentSignals.map((signal) => (
                  <div key={`${signal.description}-${signal.timestamp}`} className="flex justify-between items-start gap-4">
                    <div className="text-[11px] leading-tight">{signal.description}</div>
                    <div className="text-[9px] text-subtle whitespace-nowrap">{signal.timeLabel}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 px-4 py-5 text-sm text-subtle">
                No recent station telemetry has been reported by the backend yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

