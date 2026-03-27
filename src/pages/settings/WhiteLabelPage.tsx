import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Palette, Image as ImageIcon, Layout, Save, RefreshCw, Type } from 'lucide-react'

export function WhiteLabelPage() {
  const [primaryColor, setPrimaryColor] = useState('#3fb950')
  const [borderRadius, setBorderRadius] = useState('8px')
  const [isSaving, setIsSaving] = useState(false)

  return (
    <DashboardLayout pageTitle="White-label Config">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="card">
              <div className="section-title flex items-center gap-2"><Palette size={16} className="text-accent" /> Visual Identity</div>
              <div className="space-y-6 mt-6">
                 <div>
                    <label className="form-label">Primary Brand Color</label>
                    <div className="flex gap-4 items-center">
                       <input 
                         type="color" 
                         value={primaryColor} 
                         onChange={(e) => setPrimaryColor(e.target.value)}
                         className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border border-border"
                       />
                       <input 
                         type="text" 
                         value={primaryColor} 
                         onChange={(e) => setPrimaryColor(e.target.value)}
                         className="input flex-1 font-mono"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="form-label">Container Radius</label>
                    <select 
                      value={borderRadius} 
                      onChange={(e) => setBorderRadius(e.target.value)}
                      className="input"
                    >
                       <option value="0px">Sharp (0px)</option>
                       <option value="4px">Slight (4px)</option>
                       <option value="8px">Standard (8px)</option>
                       <option value="16px">Rounded (16px)</option>
                       <option value="999px">Pill (999px)</option>
                    </select>
                 </div>

                 <div>
                    <label className="form-label">Platform Logo (SVG/PNG)</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent transition-all cursor-pointer bg-bg-muted/30">
                       <ImageIcon size={32} className="mx-auto mb-2 text-subtle" />
                       <div className="text-xs font-bold">Upload Custom Logo</div>
                       <p className="text-[9px] text-subtle mt-1">Recommended: 512x128px with transparency</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card">
              <div className="section-title flex items-center gap-2"><Type size={16} className="text-accent" /> Typography</div>
              <div className="space-y-4 mt-6">
                 <label className="form-label">System Font Family</label>
                 <select className="input">
                    <option>Inter (Default)</option>
                    <option>Roboto</option>
                    <option>Outfit</option>
                    <option>Plus Jakarta Sans</option>
                 </select>
              </div>
           </div>

           <button 
              onClick={() => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1500); }}
              className="w-full py-3 bg-accent text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:brightness-110 transition-all"
           >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save Configuration
           </button>
        </div>

        <div className="space-y-6">
           <div className="bg-bg-muted/30 rounded-2xl border border-border p-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-[10px] uppercase font-bold text-subtle tracking-[0.2em] mb-8">Platform Preview</div>
              
              <div 
                 className="w-full max-w-sm bg-bg-card border border-border shadow-2xl overflow-hidden transition-all duration-300"
                 style={{ borderRadius }}
              >
                 <div className="h-12 border-b border-border px-4 flex items-center justify-between">
                    <div className="w-20 h-4 bg-bg-muted rounded" />
                    <div className="flex gap-2">
                       <div className="w-2 h-2 rounded-full bg-bg-muted" />
                       <div className="w-2 h-2 rounded-full bg-bg-muted" />
                    </div>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors duration-300" style={{ backgroundColor: primaryColor, borderRadius: `calc(${borderRadius} * 0.75)` }}>
                          <Layout size={20} />
                       </div>
                       <div className="space-y-1">
                          <div className="w-32 h-3 bg-text rounded" />
                          <div className="w-20 h-2 bg-subtle rounded" />
                       </div>
                    </div>
                    <div className="space-y-2 pt-4">
                       <div className="w-full h-2 bg-bg-muted rounded text-[1px]">.</div>
                       <div className="w-full h-2 bg-bg-muted rounded text-[1px]">.</div>
                       <div className="w-2/3 h-2 bg-bg-muted rounded text-[1px]">.</div>
                    </div>
                    <button 
                       className="w-full py-2 text-white text-xs font-bold transition-all duration-300"
                       style={{ backgroundColor: primaryColor, borderRadius: `calc(${borderRadius} * 0.5)` }}
                    >
                       Action Button
                    </button>
                 </div>
              </div>

              <div className="mt-8 p-4 bg-bg-card border border-border rounded-xl flex items-center gap-4 animate-pulse">
                 <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center"><Layout size={16} /></div>
                 <div>
                    <div className="text-[10px] font-bold">Live CSS Injection</div>
                    <p className="text-[9px] text-subtle">Changes apply instantly to the tenant sub-domain.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
