import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fetchJson } from '@/core/api/fetchJson'
import { useChargePoint } from '@/core/hooks/usePlatformData'
import { Cpu, Play, RotateCcw, Unlock, Wifi, WifiOff } from 'lucide-react'

const COMMAND_ICONS = {
  'Remote Start Session': <Play size={14} />,
  'Soft Reset': <RotateCcw size={14} />,
  'Hard Reboot': <RotateCcw size={14} />,
  'Unlock Connector': <Unlock size={14} />,
} as const

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: chargePoint, isLoading, error } = useChargePoint(id)
  const [roamingOverride, setRoamingOverride] = useState<boolean | null>(null)
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null)

  if (isLoading) {
    return <DashboardLayout pageTitle="Loading..."><div className="card text-center py-12 text-muted">Loading charge point details...</div></DashboardLayout>
  }

  if (error || !chargePoint) {
    return <DashboardLayout pageTitle="Not Found"><div className="card text-center py-12 text-muted">Charge point not found.</div></DashboardLayout>
  }

  const roaming = roamingOverride ?? chargePoint.roamingPublished

  const sendCmd = async (command: string) => {
    if (!id) {
      return
    }

    setCmdFeedback(`${command} command sent — awaiting response…`)

    try {
      const response = await fetchJson<{ message: string }>('/api/charge-points/' + id + '/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      setCmdFeedback(`✓ ${response.message}`)
    } catch (err) {
      setCmdFeedback(err instanceof Error ? err.message : 'Command failed.')
    }
  }

  return (
    <DashboardLayout pageTitle={`${chargePoint.model} — ${chargePoint.ocppId}`}>
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
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="section-title">Remote Commands</div>
            {cmdFeedback && (
              <div className={`alert ${cmdFeedback.startsWith('✓') ? 'success' : 'info'} text-xs mb-3`}>{cmdFeedback}</div>
            )}
            <div className="space-y-2">
              {chargePoint.remoteCommands.map((command) => (
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
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>OCPP Connection</span><span style={{ color: 'var(--ok)' }}>{chargePoint.unitHealth.ocppConnection}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Last Heartbeat</span><span>{chargePoint.unitHealth.lastHeartbeat}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Error Code</span><span>{chargePoint.unitHealth.errorCode}</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
