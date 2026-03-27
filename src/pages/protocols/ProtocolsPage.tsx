import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Activity, Shield, Code, Send, CheckCircle2 } from 'lucide-react'

export function ProtocolsPage() {
  return (
    <DashboardLayout pageTitle="Protocol Engine">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OCPI Card */}
        <div className="card border-l-4 border-l-accent space-y-6">
           <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">OCPI 2.2.1 / 2.3 Ready</h3>
                <p className="text-xs text-subtle">Global Interoperability Layer</p>
              </div>
              <Activity className="text-accent animate-pulse" size={20} />
           </div>

           <div className="space-y-4">
              <div className="section-title text-[10px] uppercase tracking-widest text-subtle">Active Endpoints</div>
              <div className="space-y-2">
                 {[
                   { module: 'Credentials', url: '/ocpi/cpo/2.2.1/credentials', status: 'Online' },
                   { module: 'Locations', url: '/ocpi/cpo/2.2.1/locations', status: 'Online' },
                   { module: 'Sessions', url: '/ocpi/cpo/2.2.1/sessions', status: 'Online' },
                   { module: 'CDRs', url: '/ocpi/cpo/2.2.1/cdrs', status: 'Online' },
                   { module: 'Tariffs', url: '/ocpi/cpo/2.2.1/tariffs', status: 'Warning' },
                 ].map(ep => (
                   <div key={ep.module} className="flex justify-between items-center bg-bg-muted/50 p-2 rounded-lg border border-border/50">
                      <div>
                         <div className="text-xs font-bold">{ep.module}</div>
                         <div className="text-[9px] font-mono text-subtle">{ep.url}</div>
                      </div>
                      <span className={`pill ${ep.status.toLowerCase()} border-none py-0 px-1.5`}>{ep.status}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex gap-4">
              <button className="flex-1 py-2 bg-bg-muted rounded-lg text-xs font-bold hover:border-accent border border-border transition-all flex items-center justify-center gap-2">
                <Code size={14} /> Open Swagger
              </button>
              <button className="flex-1 py-2 bg-bg-muted rounded-lg text-xs font-bold hover:border-accent border border-border transition-all flex items-center justify-center gap-2">
                <Shield size={14} /> Audit Trail
              </button>
           </div>
        </div>

        {/* Handshake Simulator */}
        <div className="card space-y-6">
           <h3 className="text-lg font-bold flex items-center gap-2"><Send size={20} className="text-accent" /> Handshake Test-Bench</h3>
           
           <div className="bg-bg/50 rounded-xl p-4 border border-border font-mono text-[11px] h-[300px] overflow-y-auto space-y-2">
              <div className="text-subtle">[14:20:01] INFO: Initializing test for endpoint https://test-msp.com/versions</div>
              <div className="text-ok">[14:20:02] SENT: GET /versions (Auth: Token-A)</div>
              <div className="text-warning">[14:20:03] RCV: 200 OK - Versions: [2.0, 2.1.1, 2.2.1]</div>
              <div className="text-ok">[14:20:04] INFO: Selecting v2.2.1 for handshake...</div>
              <div className="text-ok">[14:20:05] SENT: POST /2.2.1/credentials (Body: Token-B, Roles: CPO)</div>
              <div className="text-ok">[14:20:06] RCV: 201 Created (Token-C received)</div>
              <div className="text-accent font-bold">[14:20:07] SUCCESS: Handshake complete. Connection established.</div>
              <div className="animate-pulse inline-block w-2 h-4 bg-accent ml-1" />
           </div>

           <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
              <CheckCircle2 className="text-ok" size={24} />
              <div>
                 <div className="text-xs font-bold">Platform Compliance</div>
                 <p className="text-[10px] text-subtle">Core registration modules passed OCPI-Validator v1.2</p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
