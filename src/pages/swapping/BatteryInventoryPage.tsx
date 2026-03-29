import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useBatteryInventory, useInspectSwapPack, useTransitionSwapPack } from '@/core/hooks/useSwapping'
import { Package, Search } from 'lucide-react'

type Filter = 'All' | 'Ready' | 'Charging' | 'Reserved' | 'Installed' | 'Quarantined'

const METRIC_CLASS = {
  default: 'text-[var(--text)]',
  ok: 'text-[var(--ok)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
} as const

const PACK_STATUS_CLASS = {
  Ready: 'online',
  Charging: 'pending',
  Reserved: 'maintenance',
  Installed: 'active',
  Quarantined: 'faulted',
} as const

const INSPECTION_CLASS = {
  Passed: 'online',
  Review: 'pending',
  Failed: 'faulted',
} as const

export function BatteryInventoryPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [feedback, setFeedback] = useState<string | null>(null)
  const { data, isLoading, error } = useBatteryInventory()
  const transitionPack = useTransitionSwapPack()
  const inspectPack = useInspectSwapPack()

  const filtered = (data?.packs ?? []).filter((pack) =>
    (filter === 'All' || pack.status === filter) &&
    (
      pack.id.toLowerCase().includes(search.toLowerCase()) ||
      pack.stationName.toLowerCase().includes(search.toLowerCase())
    ),
  )

  const handleQuarantine = async (packId: string) => {
    try {
      const response = await transitionPack.mutateAsync({
        packId,
        toStatus: 'Quarantined',
        note: 'Manual quarantine from inventory workflow.',
      })
      setFeedback(`✓ ${response.message}`)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : 'Failed to quarantine battery pack.')
    }
  }

  const handleRelease = async (packId: string) => {
    try {
      const response = await inspectPack.mutateAsync({
        packId,
        result: 'Passed',
        note: 'Released from quarantine after successful inspection.',
      })
      setFeedback(`✓ ${response.message}`)
    } catch (mutationError) {
      setFeedback(mutationError instanceof Error ? mutationError.message : 'Failed to release battery pack.')
    }
  }

  if (isLoading) {
    return <DashboardLayout pageTitle="Battery Inventory"><div className="p-8 text-center text-subtle">Loading pack inventory...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Battery Inventory"><div className="p-8 text-center text-danger">Unable to load battery inventory.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Battery Inventory">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      {feedback && (
        <div className={`alert ${feedback.startsWith('✓') ? 'success' : 'danger'} text-xs mb-5`}>
          {feedback}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input className="input pl-9" placeholder="Search packs or stations..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Ready', 'Charging', 'Reserved', 'Installed', 'Quarantined'] as Filter[]).map((value) => (
            <button key={value} onClick={() => setFilter(value)} className={`btn sm ${filter === value ? 'primary' : 'secondary'}`}>{value}</button>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <div className="section-title"><Package size={16} className="text-accent" />Battery Fleet</div>
        <div className="table-wrap mt-4">
          <table className="table">
            <thead>
              <tr><th>Pack</th><th>Station</th><th>Status</th><th>Inspection</th><th>SoC</th><th>Health</th><th>Cycles</th><th>Slot</th><th>Seen</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map((pack) => (
                <tr key={pack.id}>
                  <td className="font-mono text-xs">{pack.id}</td>
                  <td>{pack.stationName}</td>
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
                  <td>
                    {pack.status === 'Quarantined' ? (
                      <button className="btn secondary sm" onClick={() => handleRelease(pack.id)} disabled={inspectPack.isPending}>Release Ready</button>
                    ) : (
                      <button className="btn secondary sm" onClick={() => handleQuarantine(pack.id)} disabled={transitionPack.isPending}>Quarantine</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Balancing Note</div>
        <p className="text-sm text-subtle">{data.balancingNote}</p>
      </div>
    </DashboardLayout>
  )
}
