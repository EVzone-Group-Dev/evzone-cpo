import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  useRoamingPartnerObservability,
  useRoamingPartnerObservabilityDetail,
  useRoamingPartners,
} from '@/core/hooks/usePlatformData'
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Network,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

const PARTNER_STATUS_CLASS = {
  Connected: 'online',
  Pending: 'pending',
  Suspended: 'offline',
} as const

const DELIVERY_STATUS_CLASS = {
  Healthy: 'online',
  Retrying: 'pending',
  Degraded: 'faulted',
} as const

const EVENT_STATUS_CLASS = {
  Delivered: 'online',
  Retried: 'pending',
  Failed: 'faulted',
} as const

const WARNING_CLASS = {
  Info: 'active',
  Warning: 'pending',
  Critical: 'faulted',
} as const

const METRIC_ICONS = {
  healthy: <ShieldCheck size={20} />,
  attention: <RefreshCw size={20} />,
  events: <Activity size={20} />,
  failures: <AlertTriangle size={20} />,
} as const

const METRIC_STYLES = {
  accent: {
    badge: 'bg-accent/10 text-accent',
    border: 'border-accent/20',
    note: 'text-accent',
  },
  ok: {
    badge: 'bg-ok/10 text-ok',
    border: 'border-ok/20',
    note: 'text-subtle',
  },
  warning: {
    badge: 'bg-warning/10 text-warning',
    border: 'border-warning/20',
    note: 'text-subtle',
  },
  danger: {
    badge: 'bg-danger/10 text-danger',
    border: 'border-danger/20',
    note: 'text-danger',
  },
} as const

export function OCPIPartnersPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const { data: partners, isLoading: partnersLoading, error: partnersError } = useRoamingPartners()
  const { data: observability, isLoading: observabilityLoading, error: observabilityError } = useRoamingPartnerObservability()

  const selectedPartnerId = activePartnerId ?? partners?.[0]?.id
  const {
    data: activeObservability,
    isLoading: activeObservabilityLoading,
    error: activeObservabilityError,
  } = useRoamingPartnerObservabilityDetail(selectedPartnerId)

  if (partnersLoading || observabilityLoading) {
    return <DashboardLayout pageTitle="Roaming Partners"><div className="p-8 text-center text-subtle">Loading roaming partner observability...</div></DashboardLayout>
  }

  if (partnersError || observabilityError || !partners || !observability) {
    return <DashboardLayout pageTitle="Roaming Partners"><div className="p-8 text-center text-danger">Unable to load roaming partner observability.</div></DashboardLayout>
  }

  const observabilityByPartnerId = new Map(observability.partners.map((partner) => [partner.id, partner]))
  const activePartner = partners.find((partner) => partner.id === selectedPartnerId) ?? partners[0]

  return (
    <DashboardLayout pageTitle="Roaming Partners">
      <div className="card relative overflow-hidden mb-6 border-accent/20 bg-accent/5">
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="section-title text-[10px] text-accent"><Network size={14} /> OCPI Partner Observability</div>
            <h2 className="mt-4 text-xl font-bold">Live delivery health for every roaming partner feed</h2>
            <p className="text-sm text-subtle mt-2 leading-relaxed">{observability.note}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="pill online">{partners.length} Active Peers</span>
            <span className="pill pending">{observability.partners.reduce((sum, partner) => sum + partner.eventCoverage.length, 0)} Instrumented Feeds</span>
            <span className="pill active">Kafka + Callback Trace</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {observability.metrics.map((metric) => {
          const styles = METRIC_STYLES[metric.tone]

          return (
            <div key={metric.id} className={`card border ${styles.border}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="label">{metric.label}</div>
                  <div className="value mt-1">{metric.value}</div>
                  <div className={`text-[10px] mt-2 ${styles.note}`}>{metric.note}</div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.badge}`}>
                  {METRIC_ICONS[metric.id]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-subtle">
          Managing <strong>{partners.length}</strong> active interoperability connections with live delivery telemetry.
        </div>
        <button
          onClick={() => setIsRegistering(true)}
          className="px-4 py-2 bg-accent text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 transition-all"
        >
          <Plus size={16} /> New Handshake
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Role</th>
              <th>Connection</th>
              <th>Event Surface</th>
              <th>Delivery</th>
              <th>Recent Activity</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => {
              const partnerObservability = observabilityByPartnerId.get(partner.id)
              const previewCoverage = partnerObservability?.eventCoverage.slice(0, 3) ?? []
              const extraCoverageCount = Math.max((partnerObservability?.eventCoverage.length ?? 0) - previewCoverage.length, 0)
              const isActive = activePartner?.id === partner.id

              return (
                <tr
                  key={partner.id}
                  onClick={() => setActivePartnerId(partner.id)}
                  className={`group transition-colors cursor-pointer ${isActive ? 'bg-accent/5' : 'hover:bg-bg-muted/50'}`}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center border border-accent/20 text-accent font-bold text-[10px]">
                        {partner.partyId}
                      </div>
                      <div>
                        <div className="font-semibold">{partner.name}</div>
                        <div className="text-[10px] text-subtle font-mono">{partner.partyId} · {partner.country}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono bg-bg-muted px-2 py-0.5 rounded text-subtle w-fit">{partner.type}</span>
                      <span className="text-[10px] text-subtle">OCPI v{partner.version}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`pill ${PARTNER_STATUS_CLASS[partner.status]}`}>
                        {partner.status === 'Connected' && <ShieldCheck size={10} className="mr-1" />}
                        {partner.status}
                      </span>
                      <div className="text-[10px] text-subtle">Last sync {partner.lastSync}</div>
                    </div>
                  </td>
                  <td>
                    {partnerObservability ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {previewCoverage.map((coverage) => (
                            <span key={coverage} className="rounded-full border border-border bg-bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-subtle">
                              {coverage}
                            </span>
                          ))}
                          {extraCoverageCount > 0 && (
                            <span className="rounded-full border border-border bg-bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-subtle">
                              +{extraCoverageCount} more
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-subtle">{partnerObservability.totalEvents24h.toLocaleString()} events in 24h</div>
                      </div>
                    ) : (
                      <div className="text-xs text-subtle">Observability feed pending</div>
                    )}
                  </td>
                  <td>
                    {partnerObservability ? (
                      <div className="space-y-1">
                        <span className={`pill ${DELIVERY_STATUS_CLASS[partnerObservability.deliveryStatus]}`}>
                          {partnerObservability.deliveryStatus}
                        </span>
                        <div className="text-[10px] text-subtle">{partnerObservability.successRate} success rate</div>
                        <div className="text-[10px] text-subtle">
                          {partnerObservability.callbackFailures24h} failed callbacks · {partnerObservability.retryQueueDepth} queued retries
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-subtle">No delivery telemetry yet</div>
                    )}
                  </td>
                  <td>
                    {partnerObservability ? (
                      <div className="space-y-1 text-[10px] text-subtle">
                        <div>Event {partnerObservability.lastEventAt}</div>
                        <div>Partner activity {partnerObservability.lastPartnerActivity}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-subtle">Awaiting first event</div>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(event) => event.stopPropagation()}
                        className="p-2 hover:text-accent transition-colors"
                        title="Force Sync"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={(event) => event.stopPropagation()}
                        className="p-2 hover:text-accent transition-colors"
                        title="Handshake Settings"
                      >
                        <Settings2 size={14} />
                      </button>
                      <button
                        onClick={(event) => event.stopPropagation()}
                        className="p-2 hover:text-danger transition-colors"
                        title="Terminate Connection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {activePartner && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6 mt-8">
          <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="section-title text-[10px] text-accent"><Activity size={14} /> Selected Partner Feed</div>
                <h3 className="text-lg font-bold mt-3">{activePartner.name}</h3>
                <div className="text-xs text-subtle mt-1">{activePartner.partyId} · {activePartner.country} · {activePartner.type} · OCPI v{activePartner.version}</div>
              </div>
              {activeObservability && (
                <div className="flex flex-wrap gap-2">
                  <span className={`pill ${PARTNER_STATUS_CLASS[activePartner.status]}`}>{activePartner.status}</span>
                  <span className={`pill ${DELIVERY_STATUS_CLASS[activeObservability.deliveryStatus]}`}>{activeObservability.deliveryStatus}</span>
                </div>
              )}
            </div>

            {activeObservabilityLoading ? (
              <div className="mt-6 text-sm text-subtle">Loading partner telemetry…</div>
            ) : activeObservabilityError || !activeObservability ? (
              <div className="mt-6 rounded-xl border border-danger/20 bg-danger/5 px-4 py-5 text-sm text-danger">
                Unable to load detailed partner observability.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                  <div className="rounded-xl border border-border bg-bg-muted/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Callback Delivery</div>
                    <div className="text-2xl font-bold mt-2">{activeObservability.callbacks.delivered24h}</div>
                    <div className="text-[11px] text-subtle mt-1">Delivered over the last 24 hours</div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-muted/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Retry Queue</div>
                    <div className="text-2xl font-bold mt-2">{activeObservability.retryQueueDepth}</div>
                    <div className="text-[11px] text-subtle mt-1">Pending deliveries waiting for peer recovery</div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-muted/40 px-4 py-4">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Feed Coverage</div>
                    <div className="text-2xl font-bold mt-2">{activeObservability.eventCoverage.length}</div>
                    <div className="text-[11px] text-subtle mt-1">Instrumented OCPI modules for this partner</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs font-bold uppercase tracking-wide text-subtle mb-3">Instrumented Modules</div>
                  <div className="flex flex-wrap gap-2">
                    {activeObservability.eventCoverage.map((coverage) => (
                      <span key={coverage} className="rounded-full border border-border bg-bg-muted/50 px-3 py-1 text-[10px] font-semibold text-subtle">
                        {coverage}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-bg-muted/30 px-4 py-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-subtle">Success rate</span><span className="font-semibold">{activeObservability.successRate}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Average callback latency</span><span className="font-semibold">{activeObservability.callbacks.avgLatency}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Last delivery status</span><span className="font-semibold">{activeObservability.callbacks.lastHttpStatus}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Last callback delivery</span><span className="font-semibold">{activeObservability.callbacks.lastDelivery}</span></div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-muted/30 px-4 py-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-subtle">Events in last 24h</span><span className="font-semibold">{activeObservability.totalEvents24h.toLocaleString()}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Callback failures in 24h</span><span className="font-semibold">{activeObservability.callbackFailures24h}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Last event observed</span><span className="font-semibold">{activeObservability.lastEventAt}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-subtle">Last partner activity</span><span className="font-semibold">{activeObservability.lastPartnerActivity}</span></div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="section-title text-[10px] text-warning"><RefreshCw size={14} /> Recent Event Timeline</div>
              {activeObservabilityLoading ? (
                <div className="mt-4 text-sm text-subtle">Loading recent event timeline…</div>
              ) : activeObservabilityError || !activeObservability ? (
                <div className="mt-4 text-sm text-danger">Recent partner events are unavailable.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {activeObservability.recentEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-border bg-bg-muted/30 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`pill ${EVENT_STATUS_CLASS[event.status]}`}>{event.status}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{event.module}</span>
                          </div>
                          <div className="text-sm mt-2 leading-relaxed">{event.summary}</div>
                        </div>
                        <div className="text-[11px] text-subtle whitespace-nowrap">{event.time}</div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-subtle mt-3">
                        {event.direction === 'Inbound' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {event.direction} traffic
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="section-title text-[10px] text-danger"><AlertTriangle size={14} /> Delivery Signals</div>
              {activeObservabilityLoading ? (
                <div className="mt-4 text-sm text-subtle">Loading delivery signals…</div>
              ) : activeObservabilityError || !activeObservability ? (
                <div className="mt-4 text-sm text-danger">Partner delivery signals are unavailable.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {activeObservability.warnings.map((warning) => (
                    <div key={warning.id} className="rounded-xl border border-border bg-bg-muted/30 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm">{warning.title}</div>
                          <div className="text-[11px] text-subtle mt-2 leading-relaxed">{warning.detail}</div>
                        </div>
                        <span className={`pill ${WARNING_CLASS[warning.severity]}`}>{warning.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRegistering && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Network size={20} className="text-accent" /> Initiate OCPI Handshake</h3>
              <button onClick={() => setIsRegistering(false)} className="text-subtle hover:text-text">&times;</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">HANDSHAKE URL</label>
                  <input type="text" className="input" placeholder="https://emsp.com/ocpi/versions" />
                  <p className="text-[9px] text-subtle mt-1">The versions endpoint provided by the partner.</p>
                </div>
                <div>
                  <label className="form-label">INITIAL TOKEN (TOKEN_A)</label>
                  <input type="password" className="input font-mono" placeholder="••••••••••••••••" />
                  <p className="text-[9px] text-subtle mt-1">The secure bootstrap token for first contact.</p>
                </div>
              </div>

              <div className="p-4 bg-bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3 text-warning mb-2">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Protocol Compliance (OCPI 2.2.1)</span>
                </div>
                <div className="text-[11px] text-subtle leading-relaxed">
                  Initiating a handshake will trigger a credentials exchange. The system will automatically:
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Fetch supported versions from the endpoint.</li>
                    <li>Select the highest mutually supported version (2.2.1 preferred).</li>
                    <li>Exchange Token B and Token C for secure functional communication.</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setIsRegistering(false)} className="px-5 py-2 text-sm font-semibold text-subtle hover:text-text transition-colors">Cancel</button>
                <button className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 flex items-center gap-2 transition-all">
                  <RefreshCw size={14} className="animate-spin" /> Verify & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
