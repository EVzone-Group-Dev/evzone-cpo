import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Network, Plus, ShieldCheck, RefreshCw, Trash2, Settings2 } from 'lucide-react'

interface Partner {
  id: string
  name: string
  type: 'EMSP' | 'HUB'
  status: 'Connected' | 'Pending' | 'Suspended'
  country: string
  partyId: string
  lastSync: string
  version: string
}

const INITIAL_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Plugsurfing BV', type: 'EMSP', status: 'Connected', country: 'NL', partyId: 'PLG', lastSync: '2024-03-27 14:20', version: '2.2.1' },
  { id: 'p2', name: 'Hubject Gmbh', type: 'HUB', status: 'Connected', country: 'DE', partyId: 'HBJ', lastSync: '2024-03-27 15:45', version: '2.2.1' },
  { id: 'p3', name: 'New Motion', type: 'EMSP', status: 'Pending', country: 'NL', partyId: 'TNM', lastSync: '-', version: '2.1.1' },
]

export function OCPIPartnersPage() {
  const [partners] = useState<Partner[]>(INITIAL_PARTNERS)
  const [isRegistering, setIsRegistering] = useState(false)

  return (
    <DashboardLayout pageTitle="Roaming Partners">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-subtle">
           Managing <strong>{partners.length}</strong> active interoperability connections.
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
                 <th>ID / Region</th>
                 <th>Protocol</th>
                 <th>Status</th>
                 <th>Last Heartbeat</th>
                 <th className="text-right">Actions</th>
              </tr>
           </thead>
           <tbody>
              {partners.map(p => (
                <tr key={p.id} className="group hover:bg-bg-muted/50 transition-colors">
                   <td>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center border border-accent/20 text-accent font-bold text-[10px]">
                            {p.partyId}
                         </div>
                         <div className="font-semibold">{p.name}</div>
                      </div>
                   </td>
                   <td><span className="text-xs font-mono bg-bg-muted px-2 py-0.5 rounded text-subtle">{p.type}</span></td>
                   <td>
                      <div className="text-xs">{p.country}</div>
                      <div className="text-[10px] text-subtle font-mono">{p.partyId}</div>
                   </td>
                   <td><div className="text-xs font-bold text-accent">v{p.version}</div></td>
                   <td>
                      <span className={`pill ${p.status.toLowerCase()}`}>
                         {p.status === 'Connected' && <ShieldCheck size={10} className="mr-1" />}
                         {p.status}
                      </span>
                   </td>
                   <td className="text-[10px] text-subtle">{p.lastSync}</td>
                   <td className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 hover:text-accent transition-colors" title="Force Sync"><RefreshCw size={14} /></button>
                         <button className="p-2 hover:text-accent transition-colors" title="Handshake Settings"><Settings2 size={14} /></button>
                         <button className="p-2 hover:text-danger transition-colors" title="Terminate Connection"><Trash2 size={14} /></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

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
                        <input type="password" text-security="disc" className="input font-mono" placeholder="••••••••••••••••" />
                        <p className="text-[9px] text-subtle mt-1">The secure bootstrap token for first contact.</p>
                     </div>
                  </div>

                  <div className="p-4 bg-bg-muted rounded-xl border border-border">
                     <div className="flex items-center gap-3 text-warning mb-2">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Protocol Compliance (OCPI 2.2.1)</span>
                     </div>
                     <p className="text-[11px] text-subtle leading-relaxed">
                        Initiating a handshake will trigger a credentials exchange. The system will automatically:
                        <ol className="list-decimal ml-4 mt-2 space-y-1">
                           <li>Fetch supported versions from the endpoint.</li>
                           <li>Select the highest mutually supported version (2.2.1 preferred).</li>
                           <li>Exchange Token B and Token C for secure functional communication.</li>
                        </ol>
                     </p>
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
