import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MapComponent } from '@/components/common/MapComponent'
import { PACK_STATUS_FLOW, useInspectSwapPack, useRetireSwapPack, useSwapStation, useTransitionSwapPack } from '@/core/hooks/useSwapping'
import type { BatteryPackRecord } from '@/core/types/mockApi'
import { AlertTriangle, Clock, MapPin, Package, RefreshCw, Shield } from 'lucide-react'

const CABINET_STATUS_CLASS = {
  Online: 'online',
  Degraded: 'degraded',
  Offline: 'offline',
  Maintenance: 'maintenance',
} as const

const PACK_STATUS_CLASS = {
  Ready: 'online',
  Charging: 'pending',
  Reserved: 'maintenance',
  Installed: 'active',
  Quarantined: 'faulted',
  Retired: 'offline',
} as const

const INSPECTION_CLASS = {
  Passed: 'online',
  Review: 'pending',
  Failed: 'faulted',
} as const

const RETIREMENT_CLASS = {
  None: 'online',
  Monitor: 'pending',
  Retire: 'faulted',
} as const

const ALERT_CLASS = {
  Critical: 'text-danger',
  Warning: 'text-warning',
  Info: 'text-subtle',
} as const

export function SwapStationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: station, isLoading, error } = useSwapStation(id)
  const transitionPack = useTransitionSwapPack()
  const inspectPack = useInspectSwapPack()
  const retirePack = useRetireSwapPack()
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [transitionTarget, setTransitionTarget] = useState<'' | BatteryPackRecord['status']>('')
  const [transitionNote, setTransitionNote] = useState('')
  const [inspectionResult, setInspectionResult] = useState<'Passed' | 'Review' | 'Failed'>('Passed')
  const [inspectionNote, setInspectionNote] = useState('')
  const [retirementNote, setRetirementNote] = useState('')
  const [workflowFeedback, setWorkflowFeedback] = useState<string | null>(null)

  const resolvedPackId = station?.packs.some((pack) => pack.id === selectedPackId)
    ? selectedPackId
    : (station?.packs[0]?.id ?? '')

  const selectedPack = useMemo(
    () => station?.packs.find((pack) => pack.id === resolvedPackId),
    [resolvedPackId, station?.packs],
  )

  const availableTransitions = selectedPack ? PACK_STATUS_FLOW[selectedPack.status] : []
  const resolvedTransitionTarget = availableTransitions.includes(transitionTarget as BatteryPackRecord['status'])
    ? transitionTarget
    : (availableTransitions[0] ?? '')

  if (isLoading) {
    return <DashboardLayout pageTitle="Swap Station"><div className="p-8 text-center text-subtle">Loading swap telemetry...</div></DashboardLayout>
  }

  if (error || !station) {
    return <DashboardLayout pageTitle="Swap Station"><div className="p-8 text-center text-danger">Swap station not found.</div></DashboardLayout>
  }

  const handleTransition = async () => {
    if (!selectedPack || !resolvedTransitionTarget) {
      return
    }

    try {
      const response = await transitionPack.mutateAsync({
        packId: selectedPack.id,
        toStatus: resolvedTransitionTarget as BatteryPackRecord['status'],
        note: transitionNote.trim() || undefined,
      })

      setWorkflowFeedback(`✓ ${response.message}`)
      setTransitionNote('')
    } catch (mutationError) {
      setWorkflowFeedback(mutationError instanceof Error ? mutationError.message : 'Failed to transition battery pack.')
    }
  }

  const handleInspection = async () => {
    if (!selectedPack) {
      return
    }

    try {
      const response = await inspectPack.mutateAsync({
        packId: selectedPack.id,
        result: inspectionResult,
        note: inspectionNote.trim() || undefined,
      })

      setWorkflowFeedback(`✓ ${response.message}`)
      setInspectionNote('')
    } catch (mutationError) {
      setWorkflowFeedback(mutationError instanceof Error ? mutationError.message : 'Failed to record inspection.')
    }
  }

  const handleRetirementAction = async (action: 'ApproveRetirement' | 'DeferRetirement') => {
    if (!selectedPack) {
      return
    }

    try {
      const response = await retirePack.mutateAsync({
        packId: selectedPack.id,
        action,
        note: retirementNote.trim() || undefined,
      })
      setWorkflowFeedback(`✓ ${response.message}`)
      setRetirementNote('')
    } catch (mutationError) {
      setWorkflowFeedback(mutationError instanceof Error ? mutationError.message : 'Failed to apply retirement action.')
    }
  }

  return (
    <DashboardLayout pageTitle={station.name}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 text-sm text-subtle flex-wrap">
          <div className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {station.address}, {station.city}</div>
          <span className={`pill ${CABINET_STATUS_CLASS[station.status]}`}>{station.status}</span>
          <span className="pill pending">{station.serviceMode}</span>
        </div>
        <div className="text-xs text-subtle">{station.gridBufferLabel}</div>
      </div>

      <div className="kpi-row mb-6">
        <div className="kpi-card"><div className="label">Cabinets</div><div className="value">{station.cabinetCount}</div></div>
        <div className="kpi-card"><div className="label">Ready Packs</div><div className="value text-ok">{station.readyPacks}</div></div>
        <div className="kpi-card"><div className="label">Charging Packs</div><div className="value text-warning">{station.chargingPacks}</div></div>
        <div className="kpi-card"><div className="label">Avg Turnaround</div><div className="value">{station.avgSwapDurationLabel}</div></div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7">
            <div className="card p-0 h-[340px] overflow-hidden relative border-accent/10 shadow-xl">
              <MapComponent
                center={{ lat: station.lat, lng: station.lng }}
                zoom={15}
                markers={[{
                  id: station.id,
                  lat: station.lat,
                  lng: station.lng,
                  title: station.name,
                  status: station.status === 'Maintenance' ? 'Offline' : station.status,
                }]}
              />
            </div>
          </div>

          <div className="xl:col-span-5">
            <div className="card">
              <div className="section-title"><Shield size={16} className="text-accent" />Battery Lifecycle Workflow</div>
              {workflowFeedback && (
                <div className={`alert ${workflowFeedback.startsWith('✓') ? 'success' : 'danger'} text-xs mt-3`}>{workflowFeedback}</div>
              )}
              <div className="space-y-4 mt-4">
                <div>
                  <label className="form-label">Select Pack</label>
                  <select className="input" value={resolvedPackId} onChange={(event) => setSelectedPackId(event.target.value)}>
                    {station.packs.map((pack) => (
                      <option key={pack.id} value={pack.id}>{pack.id}</option>
                    ))}
                  </select>
                </div>

                {selectedPack && (
                  <div className="rounded-lg border border-border bg-bg-muted/40 px-3 py-3 text-xs space-y-2">
                    <div className="flex justify-between"><span className="text-subtle">Current Status</span><span className={`pill ${PACK_STATUS_CLASS[selectedPack.status]}`}>{selectedPack.status}</span></div>
                    <div className="flex justify-between"><span className="text-subtle">Last Inspection</span><span>{selectedPack.lastInspectionLabel ?? 'Never'}</span></div>
                    {selectedPack.retirementDecision && (
                      <div className="flex justify-between">
                        <span className="text-subtle">Retirement Action</span>
                        <span>{selectedPack.retirementDecision.action} ({selectedPack.retirementDecision.timeLabel})</span>
                      </div>
                    )}
                    {selectedPack.inspectionNote && <div className="text-subtle">Note: {selectedPack.inspectionNote}</div>}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-subtle">State Transition</div>
                  <select className="input" value={resolvedTransitionTarget} onChange={(event) => setTransitionTarget(event.target.value as BatteryPackRecord['status'])}>
                    {availableTransitions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <input className="input" placeholder="Transition note (optional)" value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} />
                  <button className="btn secondary w-full" onClick={handleTransition} disabled={!selectedPack || !resolvedTransitionTarget || transitionPack.isPending}>
                    {transitionPack.isPending ? 'Applying...' : 'Apply Transition'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-subtle">Inspection</div>
                  <select className="input" value={inspectionResult} onChange={(event) => setInspectionResult(event.target.value as 'Passed' | 'Review' | 'Failed')}>
                    <option value="Passed">Passed</option>
                    <option value="Review">Review</option>
                    <option value="Failed">Failed (Quarantine)</option>
                  </select>
                  <input className="input" placeholder="Inspection note" value={inspectionNote} onChange={(event) => setInspectionNote(event.target.value)} />
                  <button className="btn secondary w-full" onClick={handleInspection} disabled={!selectedPack || inspectPack.isPending}>
                    {inspectPack.isPending ? 'Recording...' : 'Record Inspection'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-subtle">Retirement Policy</div>
                  <div className="rounded-lg border border-border bg-bg-muted/40 px-3 py-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-subtle">Recommendation</span>
                      <span className={`pill ${RETIREMENT_CLASS[selectedPack?.retirementAssessment?.action ?? 'None']}`}>
                        {selectedPack?.retirementAssessment?.action ?? 'None'}
                      </span>
                    </div>
                    <div className="text-subtle">
                      {selectedPack?.retirementAssessment?.reason ?? 'Retirement policy evaluation not available.'}
                    </div>
                    <div className="text-subtle">
                      Rules: retire at {`>= 320`} cycles or {`<= 88%`} SoH, monitor at {`>= 280`} cycles or {`<= 92%`} SoH.
                    </div>
                  </div>
                  <input className="input" placeholder="Retirement decision note" value={retirementNote} onChange={(event) => setRetirementNote(event.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn secondary w-full"
                      onClick={() => handleRetirementAction('DeferRetirement')}
                      disabled={!selectedPack || selectedPack.status === 'Retired' || !selectedPack.retirementAssessment || selectedPack.retirementAssessment.action === 'None' || retirePack.isPending}
                    >
                      Defer
                    </button>
                    <button
                      className="btn secondary w-full"
                      onClick={() => handleRetirementAction('ApproveRetirement')}
                      disabled={!selectedPack || !selectedPack.retirementAssessment || selectedPack.retirementAssessment.action !== 'Retire' || selectedPack.status === 'Retired' || retirePack.isPending}
                    >
                      {retirePack.isPending ? 'Applying...' : 'Approve Retirement'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title"><Package size={16} className="text-accent" />Battery Packs</div>
          <div className="table-wrap mt-4">
            <table className="table">
              <thead>
                <tr><th>Pack</th><th>Status</th><th>Inspection</th><th>SoC</th><th>Health</th><th>Cycles</th><th>Slot</th><th>Seen</th></tr>
              </thead>
              <tbody>
                {station.packs.map((pack) => (
                  <tr key={pack.id}>
                    <td className="font-mono text-xs">{pack.id}</td>
                    <td><span className={`pill ${PACK_STATUS_CLASS[pack.status]}`}>{pack.status}</span></td>
                    <td>
                      {pack.inspectionStatus
                        ? <span className={`pill ${INSPECTION_CLASS[pack.inspectionStatus]}`}>{pack.inspectionStatus}</span>
                        : <span className="text-xs text-subtle">Not inspected</span>}
                    </td>
                    <td>{pack.socLabel}</td>
                    <td>{pack.healthLabel}</td>
                    <td>{pack.cycleCount}</td>
                    <td className="text-xs text-subtle">{pack.slotLabel}</td>
                    <td className="text-xs text-subtle">{pack.lastSeenLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title"><RefreshCw size={16} className="text-accent" />Swap Cabinets</div>
          <div className="table-wrap mt-4">
            <table className="table">
              <thead>
                <tr><th>Cabinet</th><th>Model</th><th>Status</th><th>Ready</th><th>Charging</th><th>Reserved</th><th>Heartbeat</th></tr>
              </thead>
              <tbody>
                {station.cabinets.map((cabinet) => (
                  <tr key={cabinet.id}>
                    <td className="font-mono text-xs">{cabinet.id}</td>
                    <td>{cabinet.model}</td>
                    <td><span className={`pill ${CABINET_STATUS_CLASS[cabinet.status]}`}>{cabinet.status}</span></td>
                    <td className="font-semibold text-ok">{cabinet.availableChargedPacks}</td>
                    <td>{cabinet.chargingPacks}</td>
                    <td>{cabinet.reservedPacks}</td>
                    <td className="text-xs text-subtle">{cabinet.lastHeartbeatLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="section-title"><AlertTriangle size={16} className="text-warning" />Operational Alerts</div>
            <div className="space-y-3 mt-4">
              {station.alerts.map((alert) => (
                <div key={alert.message} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className={`text-[11px] uppercase tracking-wide font-semibold ${ALERT_CLASS[alert.level]}`}>{alert.level}</div>
                  <div className="text-sm mt-1">{alert.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Clock size={16} className="text-accent" />Recent Swaps</div>
            <div className="space-y-4 mt-4">
              {station.recentSwaps.map((swap) => (
                <div key={swap.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{swap.riderLabel}</div>
                      <div className="text-[11px] text-subtle">{swap.id} · Returned {swap.returnedPackId}</div>
                    </div>
                    <span className={`pill ${swap.status === 'Completed' ? 'online' : swap.status === 'Flagged' ? 'faulted' : 'active'}`}>{swap.status}</span>
                  </div>
                  <div className="flex justify-between mt-3 text-[11px] text-subtle">
                    <span>{swap.durationLabel}</span>
                    <span>{swap.timeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title"><Clock size={16} className="text-accent" />Pack Timeline</div>
          <div className="space-y-3 mt-4">
            {(selectedPack?.timeline ?? []).length === 0 ? (
              <div className="text-sm text-subtle">No lifecycle events recorded for this pack yet.</div>
            ) : (
              (selectedPack?.timeline ?? []).map((event) => (
                <div key={event.id} className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="flex justify-between items-center gap-2">
                    <span className={`pill ${event.type === 'Retirement' ? 'faulted' : event.type === 'Inspection' ? 'pending' : event.type === 'Swap' ? 'active' : 'online'}`}>
                      {event.type}
                    </span>
                    <span className="text-[11px] text-subtle">{event.timeLabel}</span>
                  </div>
                  <div className="text-sm mt-2">{event.summary}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

