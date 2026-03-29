import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBatteryInventory, useSwapSessions, useSwapStations } from '@/core/hooks/useSwapping'
import { PATHS } from '@/router/paths'
import { AlertTriangle, MapPin, RefreshCw, Search } from 'lucide-react'

type Filter = 'All' | 'Online' | 'Degraded' | 'Offline' | 'Maintenance'

type AlertSeverity = 'Critical' | 'Warning' | 'Info'

interface OperationalAlert {
  id: string
  message: string
  severity: AlertSeverity
  stationId: string
  stationName: string
}

interface StationEconomicsRow {
  avgRevenuePerSwap: number
  completedSwaps: number
  id: string
  packCount: number
  revenue: number
  status: Filter
  stationName: string
  yieldPerPackDay: number
}

const SEVERITY_CLASS: Record<AlertSeverity, string> = {
  Critical: 'text-danger',
  Warning: 'text-warning',
  Info: 'text-subtle',
}

const KPI_TONE_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
} as const

function parseTurnaroundLabel(label: string) {
  const minutesMatch = label.match(/(\d+)m/)
  const secondsMatch = label.match(/(\d+)s/)
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0
  const seconds = secondsMatch ? Number(secondsMatch[1]) : 0

  if (minutes === 0 && seconds === 0) {
    return null
  }

  return minutes * 60 + seconds
}

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) {
    return 'N/A'
  }

  const rounded = Math.max(0, Math.round(seconds))
  const mins = Math.floor(rounded / 60)
  const secs = rounded % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

function calculatePercentile(values: number[], percentile: number) {
  if (!values.length) {
    return null
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentile * sorted.length) - 1))
  return sorted[index]
}

function severityRank(severity: AlertSeverity) {
  if (severity === 'Critical') return 3
  if (severity === 'Warning') return 2
  return 1
}

function parseCurrencyAmount(label: string) {
  const sanitized = label.replace(/[^0-9.-]/g, '')
  const parsed = Number(sanitized)
  return Number.isFinite(parsed) ? parsed : 0
}

function inferCurrencyCode(labels: string[]) {
  for (const label of labels) {
    const match = label.match(/[A-Z]{3}/)
    if (match) {
      return match[0]
    }
  }

  return 'KES'
}

function formatCurrency(value: number, currencyCode: string, digits = 0) {
  return `${currencyCode} ${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function SwapStationsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const { data: stations, isLoading: stationsLoading, error: stationsError } = useSwapStations()
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSwapSessions()
  const { data: inventory, isLoading: inventoryLoading, error: inventoryError } = useBatteryInventory()

  const filtered = (stations ?? []).filter((station) =>
    (filter === 'All' || station.status === filter) &&
    (station.name.toLowerCase().includes(search.toLowerCase()) || station.city.toLowerCase().includes(search.toLowerCase())),
  )

  const totals = useMemo(() => ({
    cabinets: (stations ?? []).reduce((sum, station) => sum + station.cabinetCount, 0),
    readyPacks: (stations ?? []).reduce((sum, station) => sum + station.readyPacks, 0),
    chargingPacks: (stations ?? []).reduce((sum, station) => sum + station.chargingPacks, 0),
  }), [stations])

  const completedSessions = useMemo(
    () => (sessions ?? []).filter((session) => session.status === 'Completed'),
    [sessions],
  )

  const packCountByStation = useMemo(() => {
    const map = new Map<string, number>()

    for (const pack of inventory?.packs ?? []) {
      map.set(pack.stationName, (map.get(pack.stationName) ?? 0) + 1)
    }

    return map
  }, [inventory?.packs])

  const stationSessionStats = useMemo(() => {
    const map = new Map<string, { completed: number; failed: number; finalized: number; turnarounds: number[] }>()

    for (const session of sessions ?? []) {
      const stat = map.get(session.stationName) ?? { completed: 0, failed: 0, finalized: 0, turnarounds: [] }
      const turnaroundSeconds = parseTurnaroundLabel(session.turnaroundLabel)

      if (session.status === 'Completed') {
        stat.completed += 1
      }

      if (session.status === 'Flagged') {
        stat.failed += 1
      }

      if (session.status !== 'In Progress') {
        stat.finalized += 1
        if (turnaroundSeconds !== null) {
          stat.turnarounds.push(turnaroundSeconds)
        }
      }

      map.set(session.stationName, stat)
    }

    return map
  }, [sessions])

  const operationsMetrics = useMemo(() => {
    const finalized = Array.from(stationSessionStats.values()).reduce((sum, stat) => sum + stat.finalized, 0)
    const completed = Array.from(stationSessionStats.values()).reduce((sum, stat) => sum + stat.completed, 0)
    const failed = Array.from(stationSessionStats.values()).reduce((sum, stat) => sum + stat.failed, 0)
    const allTurnarounds = Array.from(stationSessionStats.values()).flatMap((stat) => stat.turnarounds)
    const medianTurnaround = calculatePercentile(allTurnarounds, 0.5)
    const p95Turnaround = calculatePercentile(allTurnarounds, 0.95)
    const successRate = finalized > 0 ? (completed / finalized) * 100 : 0
    const swapsPerHour = finalized > 0 ? finalized / 24 : 0
    const runwayHours = swapsPerHour > 0 ? totals.readyPacks / swapsPerHour : null

    return [
      {
        id: 'success-rate',
        label: 'Swap Success (24h)',
        value: `${successRate.toFixed(1)}%`,
        note: `${completed}/${finalized || 0} finalized`,
        tone: successRate >= 95 ? 'ok' : successRate >= 85 ? 'warning' : 'danger',
      },
      {
        id: 'median-turnaround',
        label: 'Median Turnaround',
        value: formatDuration(medianTurnaround),
        note: 'Completed + flagged swaps',
        tone: 'default',
      },
      {
        id: 'p95-turnaround',
        label: 'P95 Turnaround',
        value: formatDuration(p95Turnaround),
        note: 'Tail performance risk',
        tone: p95Turnaround !== null && p95Turnaround > 360 ? 'warning' : 'default',
      },
      {
        id: 'runway',
        label: 'Ready-Pack Runway',
        value: runwayHours === null ? 'N/A' : `${runwayHours.toFixed(1)}h`,
        note: 'At current swap velocity',
        tone: runwayHours !== null && runwayHours < 6 ? 'warning' : 'ok',
      },
      {
        id: 'failed-swaps',
        label: 'Failed Swaps (24h)',
        value: failed.toString(),
        note: 'Flagged sessions',
        tone: failed > 0 ? 'danger' : 'ok',
      },
    ] as const
  }, [stationSessionStats, totals.readyPacks])

  const stationOperationalSummary = useMemo(() => {
    const output = new Map<string, { failed: number; readyRunwayHours: number | null; successRate: number }>()

    for (const station of stations ?? []) {
      const stats = stationSessionStats.get(station.name) ?? { completed: 0, failed: 0, finalized: 0, turnarounds: [] }
      const successRate = stats.finalized > 0 ? (stats.completed / stats.finalized) * 100 : 100
      const swapsPerHour = stats.finalized > 0 ? stats.finalized / 24 : 0
      const readyRunwayHours = swapsPerHour > 0 ? station.readyPacks / swapsPerHour : null

      output.set(station.id, {
        failed: stats.failed,
        readyRunwayHours,
        successRate,
      })
    }

    return output
  }, [stationSessionStats, stations])

  const economicsMetrics = useMemo(() => {
    const totalRevenue = completedSessions.reduce((sum, session) => sum + parseCurrencyAmount(session.revenue), 0)
    const stationCount = stations?.length ?? 0
    const totalPacks = inventory?.packs.length ?? 0
    const yieldPerPackDay = totalPacks > 0 ? totalRevenue / totalPacks : 0
    const revenuePerStationDay = stationCount > 0 ? totalRevenue / stationCount : 0
    const swapsPerPackDay = totalPacks > 0 ? completedSessions.length / totalPacks : 0
    const currencyCode = inferCurrencyCode(completedSessions.map((session) => session.revenue))

    return {
      cards: [
        {
          id: 'economics-revenue-station',
          label: 'Revenue / Station / Day',
          value: formatCurrency(revenuePerStationDay, currencyCode),
          note: `${stationCount} active station${stationCount === 1 ? '' : 's'}`,
          tone: revenuePerStationDay >= 1500 ? 'ok' : revenuePerStationDay >= 800 ? 'warning' : 'default',
        },
        {
          id: 'economics-yield-pack',
          label: 'Yield / Pack / Day',
          value: formatCurrency(yieldPerPackDay, currencyCode, 1),
          note: `${totalPacks} tracked pack${totalPacks === 1 ? '' : 's'}`,
          tone: yieldPerPackDay >= 120 ? 'ok' : yieldPerPackDay >= 70 ? 'warning' : 'default',
        },
        {
          id: 'economics-swaps-pack',
          label: 'Swaps / Pack / Day',
          value: swapsPerPackDay.toFixed(2),
          note: `${completedSessions.length} completed swaps`,
          tone: swapsPerPackDay >= 0.7 ? 'ok' : swapsPerPackDay >= 0.4 ? 'warning' : 'default',
        },
      ] as const,
      currencyCode,
    }
  }, [completedSessions, inventory?.packs.length, stations?.length])

  const stationEconomics = useMemo<StationEconomicsRow[]>(() => {
    const revenueByStation = new Map<string, number>()
    const completedByStation = new Map<string, number>()

    for (const session of completedSessions) {
      completedByStation.set(session.stationName, (completedByStation.get(session.stationName) ?? 0) + 1)
      revenueByStation.set(
        session.stationName,
        (revenueByStation.get(session.stationName) ?? 0) + parseCurrencyAmount(session.revenue),
      )
    }

    return (stations ?? [])
      .map((station) => {
        const completedSwaps = completedByStation.get(station.name) ?? 0
        const revenue = revenueByStation.get(station.name) ?? 0
        const packCount = packCountByStation.get(station.name) ?? (station.readyPacks + station.chargingPacks)
        const yieldPerPackDay = packCount > 0 ? revenue / packCount : 0
        const avgRevenuePerSwap = completedSwaps > 0 ? revenue / completedSwaps : 0

        return {
          avgRevenuePerSwap,
          completedSwaps,
          id: station.id,
          packCount,
          revenue,
          status: station.status,
          stationName: station.name,
          yieldPerPackDay,
        }
      })
      .sort((left, right) => right.revenue - left.revenue)
  }, [completedSessions, packCountByStation, stations])

  const operationalAlerts = useMemo<OperationalAlert[]>(() => {
    const alerts: OperationalAlert[] = []

    for (const station of stations ?? []) {
      const stats = stationSessionStats.get(station.name) ?? { completed: 0, failed: 0, finalized: 0, turnarounds: [] }

      if (station.readyPacks < 8) {
        alerts.push({
          id: `${station.id}-ready-floor`,
          stationId: station.id,
          stationName: station.name,
          severity: station.readyPacks < 5 ? 'Critical' : 'Warning',
          message: `Ready pack reserve is low (${station.readyPacks} packs).`,
        })
      }

      if (station.chargingPacks > station.readyPacks) {
        alerts.push({
          id: `${station.id}-imbalance`,
          stationId: station.id,
          stationName: station.name,
          severity: 'Warning',
          message: `Charging packs (${station.chargingPacks}) exceed ready packs (${station.readyPacks}).`,
        })
      }

      if (station.status === 'Degraded' || station.status === 'Offline') {
        alerts.push({
          id: `${station.id}-status`,
          stationId: station.id,
          stationName: station.name,
          severity: 'Critical',
          message: `Station health is ${station.status.toLowerCase()} and requires attention.`,
        })
      }

      if (stats.failed > 0) {
        alerts.push({
          id: `${station.id}-failed-swaps`,
          stationId: station.id,
          stationName: station.name,
          severity: stats.failed > 1 ? 'Critical' : 'Warning',
          message: `${stats.failed} failed swap${stats.failed > 1 ? 's' : ''} detected in the last 24h.`,
        })
      }
    }

    return alerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 6)
  }, [stationSessionStats, stations])

  if (stationsLoading || sessionsLoading || inventoryLoading) {
    return <DashboardLayout pageTitle="Swap Stations"><div className="p-8 text-center text-subtle">Loading swap infrastructure...</div></DashboardLayout>
  }

  if (stationsError || sessionsError || inventoryError) {
    return <DashboardLayout pageTitle="Swap Stations"><div className="p-8 text-center text-danger">Unable to load swap stations.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Swap Stations">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {operationsMetrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${KPI_TONE_CLASS[metric.tone]}`}>{metric.value}</div>
            <div className="text-[10px] text-subtle">{metric.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card"><div className="label">Sites</div><div className="value">{stations?.length ?? 0}</div></div>
        <div className="kpi-card"><div className="label">Cabinets</div><div className="value">{totals.cabinets}</div></div>
        <div className="kpi-card"><div className="label">Ready Packs</div><div className="value text-ok">{totals.readyPacks}</div></div>
        <div className="kpi-card"><div className="label">Charging Packs</div><div className="value text-warning">{totals.chargingPacks}</div></div>
      </div>

      <div className="card mb-6">
        <div className="section-title">Swap Economics Dashboard</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {economicsMetrics.cards.map((metric) => (
            <div key={metric.id} className="kpi-card">
              <div className="label">{metric.label}</div>
              <div className={`value ${KPI_TONE_CLASS[metric.tone]}`}>{metric.value}</div>
              <div className="text-[10px] text-subtle">{metric.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <div className="section-title">Station-Level Performance</div>
        <div className="table-wrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Completed Swaps / Day</th>
                <th>Revenue / Day</th>
                <th>Packs</th>
                <th>Yield / Pack / Day</th>
                <th>Avg Revenue / Swap</th>
              </tr>
            </thead>
            <tbody>
              {stationEconomics.map((station) => (
                <tr key={station.id}>
                  <td>
                    <div className="font-semibold">{station.stationName}</div>
                    <div className="text-[11px] text-subtle">{station.status}</div>
                  </td>
                  <td>{station.completedSwaps}</td>
                  <td>{formatCurrency(station.revenue, economicsMetrics.currencyCode)}</td>
                  <td>{station.packCount}</td>
                  <td>{formatCurrency(station.yieldPerPackDay, economicsMetrics.currencyCode, 1)}</td>
                  <td>{formatCurrency(station.avgRevenuePerSwap, economicsMetrics.currencyCode, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-6">
        <div className="section-title"><AlertTriangle size={16} className="text-warning" />Operational Alerts</div>
        {operationalAlerts.length === 0 ? (
          <div className="text-sm text-subtle mt-4">No operational alerts right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {operationalAlerts.map((alert) => (
              <Link
                key={alert.id}
                to={PATHS.SWAP_STATION_DETAIL(alert.stationId)}
                className="rounded-lg border border-border bg-bg-muted/40 px-3 py-3 hover:border-accent transition-colors"
              >
                <div className={`text-[11px] uppercase tracking-wide font-semibold ${SEVERITY_CLASS[alert.severity]}`}>{alert.severity}</div>
                <div className="text-sm mt-1">{alert.message}</div>
                <div className="text-[11px] text-subtle mt-2">{alert.stationName}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Search swap stations..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Online', 'Degraded', 'Offline', 'Maintenance'] as Filter[]).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((station) => {
          const stationOps = stationOperationalSummary.get(station.id) ?? { failed: 0, readyRunwayHours: null, successRate: 100 }

          return (
            <Link key={station.id} to={PATHS.SWAP_STATION_DETAIL(station.id)} className="card hover:border-accent transition-all group">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-base group-hover:text-accent transition-colors">{station.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-subtle mt-1">
                    <MapPin size={12} /> {station.address}, {station.city}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-accent mt-2">{station.serviceMode} Swap Site</div>
                </div>
                <span className={`pill ${station.status === 'Online' ? 'online' : station.status === 'Degraded' ? 'degraded' : station.status === 'Maintenance' ? 'maintenance' : 'offline'}`}>{station.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Cabinets</div>
                  <div className="text-lg font-bold">{station.cabinetCount}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Avg Turnaround</div>
                  <div className="text-lg font-bold">{station.avgSwapDurationLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Ready Packs</div>
                  <div className="text-lg font-bold text-ok">{station.readyPacks}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Charging Packs</div>
                  <div className="text-lg font-bold text-warning">{station.chargingPacks}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">24h Success</div>
                  <div className={`text-sm font-semibold ${stationOps.successRate >= 95 ? 'text-ok' : stationOps.successRate >= 85 ? 'text-warning' : 'text-danger'}`}>
                    {stationOps.successRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Failed 24h</div>
                  <div className={`text-sm font-semibold ${stationOps.failed > 0 ? 'text-danger' : 'text-ok'}`}>{stationOps.failed}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Runway</div>
                  <div className={`text-sm font-semibold ${stationOps.readyRunwayHours !== null && stationOps.readyRunwayHours < 6 ? 'text-warning' : 'text-ok'}`}>
                    {stationOps.readyRunwayHours === null ? 'N/A' : `${stationOps.readyRunwayHours.toFixed(1)}h`}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-subtle flex items-center gap-2">
                <RefreshCw size={12} className="text-accent" />
                Cabinet, battery pack, and rider turnaround controls
              </div>
            </Link>
          )
        })}
      </div>
    </DashboardLayout>
  )
}
