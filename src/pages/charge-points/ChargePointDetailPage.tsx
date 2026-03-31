import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fetchJson } from '@/core/api/fetchJson'
import { useChargePoint, useSessions } from '@/core/hooks/usePlatformData'
import { PATHS } from '@/router/paths'
import { ArrowLeft, Cpu, Play, RotateCcw, Unlock, Wifi, WifiOff } from 'lucide-react'

const COMMAND_ICONS = {
  'Remote Start Session': <Play size={14} />,
  'Soft Reset': <RotateCcw size={14} />,
  'Hard Reboot': <RotateCcw size={14} />,
  'Unlock Connector': <Unlock size={14} />,
} as const

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: chargePoint, isLoading, error } = useChargePoint(id)
  const { data: sessions, isLoading: isSessionsLoading } = useSessions()
  const [roamingOverride, setRoamingOverride] = useState<boolean | null>(null)
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null)
  const [sessionConnectorFilter, setSessionConnectorFilter] = useState('All')

  const recentSessions = useMemo(() => {
    if (!chargePoint) {
      return []
    }

    return (sessions || [])
      .filter((session) => session.chargePointId === chargePoint.id || session.cp === chargePoint.ocppId)
      .sort((a, b) => b.started.localeCompare(a.started))
      .slice(0, 5)
  }, [chargePoint, sessions])

  const connectorFilterOptions = useMemo(
    () => ['All', ...Array.from(new Set(recentSessions.map((session) => session.connectorType))).sort((a, b) => a.localeCompare(b))],
    [recentSessions],
  )

  const effectiveSessionConnectorFilter = connectorFilterOptions.includes(sessionConnectorFilter) ? sessionConnectorFilter : 'All'

  const visibleRecentSessions = recentSessions.filter(
    (session) => effectiveSessionConnectorFilter === 'All' || session.connectorType === effectiveSessionConnectorFilter,
  )

  if (isLoading) {
    return <DashboardLayout pageTitle="Loading..."><div className="card text-center py-12 text-muted">Loading charge point details...</div></DashboardLayout>
  }

  if (error || !chargePoint) {
    return <DashboardLayout pageTitle="Not Found"><div className="card text-center py-12 text-muted">Charge point not found.</div></DashboardLayout>
  }

  const roaming = roamingOverride ?? chargePoint.roamingPublished
  const connectorTypes = chargePoint.connectorTypes?.length
    ? chargePoint.connectorTypes
    : (chargePoint.connectorType ? [chargePoint.connectorType] : ['N/A'])
  const remoteCommands = Array.isArray(chargePoint.remoteCommands) && chargePoint.remoteCommands.length > 0
    ? chargePoint.remoteCommands
    : ['Remote Start Session', 'Soft Reset', 'Hard Reboot', 'Unlock Connector']
  const unitHealth = chargePoint.unitHealth ?? {
    ocppConnection: chargePoint.status === 'Online' ? 'Connected' : 'Disconnected',
    lastHeartbeat: chargePoint.lastHeartbeatLabel ?? 'No heartbeat',
    errorCode: 'None',
  }

  const sendCmd = async (command: string) => {
    if (!id) {
      return
    }

    setCmdFeedback(`${command} command sent — awaiting response…`)

    try {
      const commandRequest = (() => {
        if (command === 'Remote Start Session') {
          return {
            path: `/api/v1/charge-points/${id}/commands/remote-start`,
            payload: { idTag: 'EVZONE_REMOTE' },
          }
        }
        if (command === 'Soft Reset') {
          return {
            path: `/api/v1/charge-points/${id}/commands/soft-reset`,
            payload: undefined,
          }
        }
        if (command === 'Hard Reboot') {
          return {
            path: `/api/v1/charge-points/${id}/reboot`,
            payload: undefined,
          }
        }
        if (command === 'Unlock Connector') {
          return {
            path: `/api/v1/charge-points/${id}/commands/unlock`,
            payload: { connectorId: 1 },
          }
        }

        throw new Error(`Unsupported command: ${command}`)
      })()

      const response = await fetchJson<{ message?: string }>(commandRequest.path, {
        method: 'POST',
        headers: commandRequest.payload ? { 'Content-Type': 'application/json' } : undefined,
        body: commandRequest.payload ? JSON.stringify(commandRequest.payload) : undefined,
      })

      setCmdFeedback(`✓ ${response.message ?? 'Command queued successfully.'}`)
    } catch (err) {
      setCmdFeedback(err instanceof Error ? err.message : 'Command failed.')
    }
  }

  return (
    <DashboardLayout pageTitle={`${chargePoint.model} — ${chargePoint.ocppId}`}>
      <div className="mb-4">
        <Link to={PATHS.CHARGE_POINTS} className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">
          <ArrowLeft size={14} />
          Back to Charge Points
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="section-title"><Cpu size={16} style={{ color: 'var(--accent)' }} />Device Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Model', chargePoint.model],
                ['Manufacturer', chargePoint.manufacturer],
                ['Serial Number', chargePoint.serialNumber],
                ['Firmware', chargePoint.firmwareVersion],
                ['Connector Types', connectorTypes.join(', ')],
                ['OCPP ID', chargePoint.ocppId],
                ['OCPP Version', chargePoint.ocppVersion],
                ['Max Power', `${chargePoint.maxCapacityKw} kW`],
                ['Status', chargePoint.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">OCPI Roaming Publication</div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${roaming ? 'text-ok' : 'text-muted'}`}>
                {roaming ? <Wifi size={14} /> : <WifiOff size={14} />}
                {roaming ? 'Published to roaming network' : 'Not published'}
              </span>
              <button className={`btn sm ${roaming ? 'secondary' : 'primary'}`} onClick={() => setRoamingOverride((value) => !(value ?? chargePoint.roamingPublished))}>
                {roaming ? 'Disable Roaming' : 'Enable Roaming'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="section-title">Recent Sessions</div>
              <select className="input !h-9 !py-0 w-[180px]" value={effectiveSessionConnectorFilter} onChange={(event) => setSessionConnectorFilter(event.target.value)}>
                {connectorFilterOptions.map((option) => (
                  <option key={option} value={option}>{option === 'All' ? 'All Connector Types' : option}</option>
                ))}
              </select>
            </div>

            {isSessionsLoading ? (
              <div className="mt-4 text-sm text-subtle">Loading recent sessions...</div>
            ) : visibleRecentSessions.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 px-4 py-5 text-sm text-subtle">
                No recent sessions found for this connector selection.
              </div>
            ) : (
              <div className="table-wrap mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Started</th>
                      <th>Connector Type</th>
                      <th>Energy</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="font-mono text-xs">{session.id}</td>
                        <td className="text-xs">{session.started}</td>
                        <td className="text-xs">{session.connectorType}</td>
                        <td className="text-sm">{session.energy}</td>
                        <td className="text-sm">{session.amount}</td>
                        <td>
                          <span className={`pill ${session.status === 'Active' ? 'active' : session.status === 'Completed' ? 'online' : 'faulted'}`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="section-title">Remote Commands</div>
            {cmdFeedback && (
              <div className={`alert ${cmdFeedback.startsWith('✓') ? 'success' : 'info'} text-xs mb-3`}>{cmdFeedback}</div>
            )}
            <div className="space-y-2">
              {remoteCommands.map((command) => (
                <button key={command} className="btn secondary w-full flex items-center gap-2" onClick={() => sendCmd(command)}>
                  {COMMAND_ICONS[command as keyof typeof COMMAND_ICONS]}
                  {command}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="section-title">Unit Health</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>OCPP Connection</span><span style={{ color: 'var(--ok)' }}>{unitHealth.ocppConnection}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Last Heartbeat</span><span>{unitHealth.lastHeartbeat}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Error Code</span><span>{unitHealth.errorCode}</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
