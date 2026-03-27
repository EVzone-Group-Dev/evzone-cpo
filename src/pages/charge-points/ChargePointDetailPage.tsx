import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Cpu, Play, RotateCcw, Unlock, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

const MOCK_CPS: Record<string, { model: string; manufacturer: string; serialNumber: string; firmwareVersion: string; ocppId: string; ocppVersion: string; status: string; maxCapacityKw: number; roamingPublished: boolean }> = {
  'cp-1': { model: 'ABB Terra 184', manufacturer: 'ABB', serialNumber: 'SN-001A', firmwareVersion: '1.4.2', ocppId: 'EVZ-WL-001', ocppVersion: '2.0.1', status: 'Online', maxCapacityKw: 75, roamingPublished: true },
  'cp-3': { model: 'Alfen Eve Pro', manufacturer: 'Alfen', serialNumber: 'SN-002A', firmwareVersion: '3.1.0', ocppId: 'EVZ-CBD-001', ocppVersion: '1.6J', status: 'Degraded', maxCapacityKw: 22, roamingPublished: false },
  'cp-4': { model: 'Tritium RT175', manufacturer: 'Tritium', serialNumber: 'SN-003A', firmwareVersion: '2.7.1', ocppId: 'EVZ-AP-001', ocppVersion: '2.0.1', status: 'Online', maxCapacityKw: 175, roamingPublished: true },
}

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const cp = MOCK_CPS[id ?? '']
  const [roaming, setRoaming] = useState(cp?.roamingPublished ?? false)
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null)

  if (!cp) return <DashboardLayout pageTitle="Not Found"><div className="card text-center py-12 text-muted">Charge point not found.</div></DashboardLayout>

  const sendCmd = (label: string) => {
    setCmdFeedback(`${label} command sent — awaiting response…`)
    setTimeout(() => setCmdFeedback(`✓ ${label} completed successfully`), 2200)
  }

  return (
    <DashboardLayout pageTitle={`${cp.model} — ${cp.ocppId}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="section-title"><Cpu size={16} style={{ color: 'var(--accent)' }} />Device Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Model', cp.model],
                ['Manufacturer', cp.manufacturer],
                ['Serial Number', cp.serialNumber],
                ['Firmware', cp.firmwareVersion],
                ['OCPP ID', cp.ocppId],
                ['OCPP Version', cp.ocppVersion],
                ['Max Power', `${cp.maxCapacityKw} kW`],
                ['Status', cp.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{k}</div>
                  <div style={{ color: 'var(--text)' }}>{v}</div>
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
              <button className={`btn sm ${roaming ? 'secondary' : 'primary'}`} onClick={() => setRoaming(r => !r)}>
                {roaming ? 'Disable Roaming' : 'Enable Roaming'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: remote commands */}
        <div className="space-y-5">
          <div className="card">
            <div className="section-title">Remote Commands</div>
            {cmdFeedback && (
              <div className={`alert ${cmdFeedback.startsWith('✓') ? 'success' : 'info'} text-xs mb-3`}>{cmdFeedback}</div>
            )}
            <div className="space-y-2">
              <button className="btn secondary w-full flex items-center gap-2" onClick={() => sendCmd('Remote Start')}>
                <Play size={14} /> Remote Start Session
              </button>
              <button className="btn secondary w-full flex items-center gap-2" onClick={() => sendCmd('Soft Reset')}>
                <RotateCcw size={14} /> Soft Reset
              </button>
              <button className="btn secondary w-full flex items-center gap-2" onClick={() => sendCmd('Hard Reboot')}>
                <RotateCcw size={14} /> Hard Reboot
              </button>
              <button className="btn secondary w-full flex items-center gap-2" onClick={() => sendCmd('Unlock Connector')}>
                <Unlock size={14} /> Unlock Connector
              </button>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Unit Health</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>OCPP Connection</span><span style={{ color: 'var(--ok)' }}>Connected</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Last Heartbeat</span><span>12s ago</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Error Code</span><span>NoError</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
