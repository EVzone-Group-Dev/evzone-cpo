import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useProtocolEngine } from '@/core/hooks/usePlatformData'
import { useTenant } from '@/core/hooks/useTenant'
import { Activity, Shield, Code, Send, CheckCircle2 } from 'lucide-react'

const LOG_LEVEL_CLASS = {
  info: 'text-subtle',
  success: 'text-ok',
  warning: 'text-warning',
  accent: 'text-accent font-bold',
} as const

const ENDPOINT_STATUS_CLASS = {
  Online: 'online',
  Warning: 'degraded',
} as const

export function ProtocolsPage() {
  const { activeTenant } = useTenant()
  const { data, isLoading, error } = useProtocolEngine()

  if (isLoading) {
    return <DashboardLayout pageTitle="Protocol Engine"><div className="p-8 text-center text-subtle">Loading protocol engine...</div></DashboardLayout>
  }

  if (error || !data) {
    return <DashboardLayout pageTitle="Protocol Engine"><div className="p-8 text-center text-danger">Unable to load protocol engine.</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Protocol Engine">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card border-l-4 border-l-accent space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold">{data.headline}</h3>
              <p className="text-xs text-subtle">{data.implementationStage} · {activeTenant?.name ?? 'Tenant Scope'}</p>
            </div>
            <Activity className="text-accent animate-pulse" size={20} />
          </div>

          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`pill ${data.liveServicesDeployed ? 'online' : 'pending'}`}>
                {data.liveServicesDeployed ? 'Live Services' : 'Mock Validation Only'}
              </span>
              {data.supportedVersions.map((version) => (
                <span key={version} className="pill online">OCPI {version}</span>
              ))}
              {data.plannedVersions.map((version) => (
                <span key={version} className="pill pending">Planned {version}</span>
              ))}
            </div>
            <p className="text-xs text-subtle">{data.statusNote}</p>
          </div>

          <div className="space-y-4">
            <div className="section-title text-[10px] uppercase tracking-widest text-subtle">Active Endpoints</div>
            <div className="space-y-2">
              {data.endpoints.map((endpoint) => (
                <div key={endpoint.module} className="flex justify-between items-center bg-bg-muted/50 p-2 rounded-lg border border-border/50">
                  <div>
                    <div className="text-xs font-bold">{endpoint.module}</div>
                    <div className="text-[9px] font-mono text-subtle">{endpoint.url}</div>
                  </div>
                  <span className={`pill ${ENDPOINT_STATUS_CLASS[endpoint.status]} border-none py-0 px-1.5`}>{endpoint.status}</span>
                </div>
              ))}
            </div>
          </div>

          {activeTenant && (
            <div className="space-y-2">
              <div className="section-title text-[10px] uppercase tracking-widest text-subtle">Tenant Context</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-subtle">Region</div>
                  <div className="font-semibold">{activeTenant.region}</div>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                  <div className="text-subtle">Time Zone</div>
                  <div className="font-semibold">{activeTenant.timeZone}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${data.liveServicesDeployed ? 'bg-bg-muted hover:border-accent' : 'opacity-70 cursor-not-allowed'}`}
              style={{ borderColor: 'var(--border)' }}
              disabled={!data.liveServicesDeployed}
              title={data.liveServicesDeployed ? 'Open protocol docs' : 'Live API docs are not available in mock bench mode.'}
            >
              <Code size={14} /> {data.liveServicesDeployed ? 'Open Swagger' : 'Contracts Only'}
            </button>
            <button className="flex-1 py-2 bg-bg-muted rounded-lg text-xs font-bold hover:border-accent border border-border transition-all flex items-center justify-center gap-2">
              <Shield size={14} /> Bench Logs
            </button>
          </div>
        </div>

        <div className="card space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Send size={20} className="text-accent" /> Handshake Test-Bench</h3>

          <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-[11px] h-[300px] overflow-y-auto space-y-2">
            {data.handshakeLogs.map((entry) => (
              <div key={entry.message} className={LOG_LEVEL_CLASS[entry.level]}>{entry.message}</div>
            ))}
            <div className="animate-pulse inline-block w-2 h-4 bg-accent ml-1" />
          </div>

          <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
            <CheckCircle2 className="text-ok" size={24} />
            <div>
              <div className="text-xs font-bold">Platform Compliance</div>
              <p className="text-[10px] text-subtle">{data.complianceNote}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
