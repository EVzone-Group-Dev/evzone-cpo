import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { X, AlertTriangle, Zap, Thermometer, ShieldAlert } from 'lucide-react'
import { usePackTelemetry, useRemoteKillPack } from '@/core/hooks/useSwapping'

interface LiveTelemetryModalProps {
  packId: string
  stationId: string
  onClose: () => void
}

export function LiveTelemetryModal({ packId, stationId, onClose }: LiveTelemetryModalProps) {
  const { data: telemetry, isLoading, refetch } = usePackTelemetry(packId)
  const killPack = useRemoteKillPack()
  const [feedback, setFeedback] = useState<string | null>(null)
  
  // Auto-refresh every 5 seconds to simulate live data
  useEffect(() => {
    const interval = setInterval(refetch, 5000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleKill = async () => {
    if (!confirm('CRITICAL WARNING: You are about to permanently disable this battery pack via Remote Kill. This engages the hardware cutoff switch. Do you wish to proceed?')) {
      return
    }

    try {
      await killPack.mutateAsync({ packId, stationId })
      setFeedback('Remote Kill Command Dispatched successfully.')
      setTimeout(onClose, 3000)
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to dispatch kill command.')
    }
  }

  if (isLoading && !telemetry) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card p-8 animate-pulse text-subtle">Connecting to MQTT Broker...</div>
      </div>
    )
  }

  if (!telemetry) {
    return null
  }

  const { cells, temps, voltage, soc, current } = telemetry
  
  // Prepare recharts data
  const chartData = cells.map((cellVoltage: number, idx: number) => {
    let status = 'normal'
    if (cellVoltage > 3.65) status = 'high'
    if (cellVoltage < 2.90) status = 'low'
    return { name: `C${idx + 1}`, voltage: parseFloat(cellVoltage.toFixed(3)), status }
  })

  // Colors based on status
  const getColor = (status: string) => {
    if (status === 'high') return 'var(--danger)' // Red (Overcharge risk)
    if (status === 'low') return 'var(--warning)' // Orange/Yellow (Undercharge / Imbalance)
    return 'var(--primary)' // Blue/Green
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="text-accent" /> Live Pack Telemetry
            </h2>
            <div className="text-sm text-subtle font-mono mt-1">Pack Serial: {packId}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {feedback && (
          <div className="alert danger mb-6 flex items-center gap-2">
            <ShieldAlert size={16} /> {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card bg-[var(--bg-elevated)] p-4 rounded-xl">
            <div className="text-sm text-subtle">Pack Voltage</div>
            <div className="text-2xl font-bold font-mono">{voltage.toFixed(2)}v</div>
          </div>
          <div className="kpi-card bg-[var(--bg-elevated)] p-4 rounded-xl">
            <div className="text-sm text-subtle">Current Draw</div>
            <div className="text-2xl font-bold font-mono">{current.toFixed(1)}A</div>
          </div>
          <div className="kpi-card bg-[var(--bg-elevated)] p-4 rounded-xl">
            <div className="text-sm text-subtle">State of Charge</div>
            <div className="text-2xl font-bold font-mono">{soc.toFixed(1)}%</div>
          </div>
          <div className="kpi-card bg-[var(--bg-elevated)] p-4 rounded-xl">
            <div className="text-sm text-subtle flex items-center gap-1"><Thermometer size={14}/> Sensors</div>
            <div className="text-xl font-bold font-mono">{temps.map((t: number) => `${t.toFixed(1)}°`).join(' / ')}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-4 text-subtle uppercase tracking-wider flex items-center justify-between">
            <span>Cell Voltages (Balancing)</span>
            <span className="text-xs font-normal bg-[var(--bg-subtle)] px-2 py-1 rounded">Live <span className="inline-block w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse ml-1"></span></span>
          </h3>
          <div className="h-64 w-full bg-[var(--bg-elevated)] rounded-xl pt-6 pr-4 shadow-sm border border-[var(--border)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} stroke="var(--border)" tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} tick={{ fontSize: 12, fill: 'var(--text-subtle)' }} stroke="var(--border)" tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(2)} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-card)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: 'var(--text-subtle)', marginBottom: '4px' }}
                />
                <Bar dataKey="voltage" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-[var(--border)] pt-5 mt-2">
          <div className="text-sm text-subtle flex items-center gap-2">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-[var(--primary)]"></div> Balanced</div>
            <div className="flex items-center gap-1 ml-3"><div className="w-3 h-3 rounded-sm bg-[var(--warning)]"></div> Under Volts</div>
            <div className="flex items-center gap-1 ml-3"><div className="w-3 h-3 rounded-sm bg-[var(--danger)]"></div> Risk</div>
          </div>
          <button 
            onClick={handleKill}
            className="btn outline danger flex items-center gap-2 group hover:bg-[var(--danger)] hover:text-white"
            disabled={killPack.isPending}
          >
            <AlertTriangle size={16} className="text-[var(--danger)] group-hover:text-white" />
            {killPack.isPending ? 'Executing...' : 'Remote Kill Command'}
          </button>
        </div>
      </div>
    </div>
  )
}
