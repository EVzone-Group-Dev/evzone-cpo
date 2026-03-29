import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  useOCPICommands,
  useRoamingPartnerObservability,
  useRoamingPartners,
} from '@/core/hooks/usePlatformData'
import { AlertTriangle, Play, RefreshCw, Send, ShieldAlert, Smartphone, Square, Unlock } from 'lucide-react'
import {
  buildRoamingPartnerTelemetry,
  DELIVERY_STATUS_CLASS,
} from './partnerObservability'

export function OCPICommandsPage() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedPartnerOverride, setSelectedPartnerOverride] = useState<string | null>(null)
  const { data, isLoading, error } = useOCPICommands()
  const { data: partners } = useRoamingPartners()
  const { data: observability } = useRoamingPartnerObservability()

  if (isLoading) {
    return <DashboardLayout pageTitle="eMSP Command Simulator"><div className="p-8 text-center text-subtle">Loading command pipeline...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="eMSP Command Simulator"><div className="p-8 text-center text-danger">Unable to load command pipeline.</div></DashboardLayout>
  }

  const telemetry = buildRoamingPartnerTelemetry(partners, observability)
  const hasTelemetry = telemetry.views.length > 0
  const selectedPartner = selectedPartnerOverride ?? data.partners[0]?.id ?? ''
  const selectedPartnerHealth = telemetry.byPartnerId.get(selectedPartner)

  return (
    <DashboardLayout pageTitle="eMSP Command Simulator">
      {hasTelemetry && telemetry.attentionPartners.length > 0 && (
        <div className="card mb-6 border-warning/20 bg-warning/5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="section-title text-[10px] text-warning"><AlertTriangle size={14} /> Command Delivery Watch</div>
              <h2 className="text-lg font-bold mt-3">Partner health now sits next to the command pipeline</h2>
              <p className="text-sm text-subtle mt-2">
                {telemetry.attentionPartners.length} partners are currently retrying or degraded, which helps explain whether command issues come from peer transport or platform-side decisioning.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="pill pending">{telemetry.totalRetryQueueDepth} queued retries</span>
              <span className={`pill ${telemetry.totalFailures24h > 0 ? 'faulted' : 'online'}`}>{telemetry.totalFailures24h} failed callbacks</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card border-l-4 border-l-accent">
            <div className="section-title flex items-center gap-2"><Smartphone size={16} className="text-accent" /> Inbound Simulation</div>
            <p className="text-[11px] text-subtle mb-6">Test the platform's response to incoming OCPI 2.2.1 commands from remote eMSP applications.</p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Target Partner</label>
                <select className="input h-10" value={selectedPartner} onChange={(e) => setSelectedPartnerOverride(e.target.value)}>
                  {data.partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>{partner.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Remote Command Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 bg-accent/10 text-accent text-[10px] font-bold rounded-lg border border-accent/20 hover:bg-accent/20 transition-all flex items-center justify-center gap-2">
                    <Play size={12} /> START
                  </button>
                  <button className="py-2 bg-danger/10 text-danger text-[10px] font-bold rounded-lg border border-danger/20 hover:bg-danger/20 transition-all flex items-center justify-center gap-2">
                    <Square size={12} /> STOP
                  </button>
                  <button className="py-2 bg-bg-muted text-text text-[10px] font-bold rounded-lg border border-border hover:border-accent transition-all flex items-center justify-center gap-2">
                    <Unlock size={12} /> UNLOCK
                  </button>
                  <button className="py-2 bg-bg-muted text-text text-[10px] font-bold rounded-lg border border-border hover:border-accent transition-all flex items-center justify-center gap-2">
                    <ShieldAlert size={12} /> RESERVE
                  </button>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => { setIsSimulating(true); setTimeout(() => setIsSimulating(false), 2000) }}
                  className="w-full py-3 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
                >
                  {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  Fire OCPI Command
                </button>
              </div>
            </div>
          </div>

          {selectedPartnerHealth && (
            <div className="card bg-bg-muted/30">
              <div className="section-title text-[10px] text-accent"><RefreshCw size={14} /> Selected Partner Telemetry</div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{selectedPartnerHealth.name}</div>
                  <div className="text-[10px] text-subtle font-mono">{selectedPartnerHealth.partyId} · {selectedPartnerHealth.country}</div>
                </div>
                <span className={`pill ${DELIVERY_STATUS_CLASS[selectedPartnerHealth.deliveryStatus]}`}>{selectedPartnerHealth.deliveryStatus}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-border bg-bg-card/60 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Success Rate</div>
                  <div className="text-lg font-bold mt-1">{selectedPartnerHealth.successRate}</div>
                </div>
                <div className="rounded-xl border border-border bg-bg-card/60 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Retry Queue</div>
                  <div className="text-lg font-bold mt-1">{selectedPartnerHealth.retryQueueDepth}</div>
                </div>
                <div className="rounded-xl border border-border bg-bg-card/60 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Failed Callbacks</div>
                  <div className="text-lg font-bold mt-1">{selectedPartnerHealth.callbackFailures24h}</div>
                </div>
                <div className="rounded-xl border border-border bg-bg-card/60 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-subtle">Feeds</div>
                  <div className="text-lg font-bold mt-1">{selectedPartnerHealth.eventCoverage.length}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card bg-warning/5 border-warning/20">
            <div className="section-title text-warning">Safety Protocol</div>
            <p className="text-[10px] leading-relaxed text-subtle">
              Remote commands bypass local RFID validation. Ensure the eMSP token is whitelisted or real-time authorized before execution.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col h-[560px]">
          <div className="p-4 border-b border-border bg-bg-muted/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm">Real-time Command Pipeline</h3>
              {selectedPartnerHealth && (
                <div className="text-[10px] text-subtle mt-1">
                  {selectedPartnerHealth.name}: {selectedPartnerHealth.successRate} success rate · {selectedPartnerHealth.retryQueueDepth} queued retries
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              <span className="text-[9px] uppercase font-bold text-subtle tracking-widest">Listening...</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[11px] p-0">
            <table className="table border-none">
              <thead className="sticky top-0 bg-bg-card shadow-sm z-10">
                <tr className="border-b border-border/50">
                  <th className="py-2 pl-4">Timestamp</th>
                  <th className="py-2">Command</th>
                  <th className="py-2">Partner</th>
                  <th className="py-2">Delivery</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right pr-4">Payload</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => {
                  const partnerHealth = telemetry.byPartnerId.get(log.partnerId)

                  return (
                    <tr key={log.id} className="border-b border-border/20 last:border-b-0 hover:bg-bg-muted/20 transition-all">
                      <td className="py-3 pl-4 text-subtle">{log.time}</td>
                      <td><span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[10px] font-bold">{log.command}</span></td>
                      <td>
                        <div className="font-semibold">{log.partner}</div>
                        {partnerHealth && <div className="text-[10px] text-subtle">{partnerHealth.partyId} · {partnerHealth.successRate} success</div>}
                      </td>
                      <td>
                        {partnerHealth ? (
                          <div className="space-y-1">
                            <span className={`pill ${DELIVERY_STATUS_CLASS[partnerHealth.deliveryStatus]}`}>{partnerHealth.deliveryStatus}</span>
                            <div className="text-[10px] text-subtle">{partnerHealth.retryQueueDepth} retries queued</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-subtle">No telemetry</span>
                        )}
                      </td>
                      <td><span className={`text-[10px] font-bold ${log.status === 'Accepted' ? 'text-ok' : 'text-danger'}`}>{log.status}</span></td>
                      <td className="text-right pr-4 text-subtle truncate max-w-[200px]" title={log.payload}>{log.payload}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
