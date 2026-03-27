import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Shield, Info } from 'lucide-react'

const stationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  capacity: z.number().min(10, 'Capacity must be at least 10kW'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(['AC', 'DC', 'Mixed']),
})

type StationFormValues = z.infer<typeof stationSchema>

export function CreateStationPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      type: 'AC',
      capacity: 50,
    }
  })

  const onSubmit = async (data: StationFormValues) => {
    console.log('[CreateStation] Data:', data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    navigate('/stations')
  }

  return (
    <DashboardLayout pageTitle="Provision New Asset">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card space-y-4">
              <div className="section-title flex items-center gap-2"><Info size={16} className="text-accent" /> Essential Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Station Name</label>
                  <input {...register('name')} className={`input ${errors.name ? 'border-danger' : ''}`} placeholder="e.g. Westlands Hub" />
                  {errors.name && <p className="text-[10px] text-danger mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Primary Charge Type</label>
                  <select {...register('type')} className="input transition-all">
                    <option value="AC">AC (Destination)</option>
                    <option value="DC">DC (Fast Charging)</option>
                    <option value="Mixed">Mixed Portfolio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Full Address</label>
                <input {...register('address')} className="input" placeholder="e.g. 123 Westlands Ave" />
                {errors.address && <p className="text-[10px] text-danger mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <label className="form-label">City</label>
                <input {...register('city')} className="input" placeholder="Nairobi" />
                {errors.city && <p className="text-[10px] text-danger mt-1">{errors.city.message}</p>}
              </div>
            </div>

            <div className="card space-y-4">
              <div className="section-title flex items-center gap-2"><MapPin size={16} className="text-accent" /> Spatial Coordinates</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Latitude</label>
                  <input type="number" step="any" {...register('lat', { valueAsNumber: true })} className="input" />
                  {errors.lat && <p className="text-[10px] text-danger mt-1">{errors.lat.message}</p>}
                </div>
                <div>
                  <label className="form-label">Longitude</label>
                  <input type="number" step="any" {...register('lng', { valueAsNumber: true })} className="input" />
                  {errors.lng && <p className="text-[10px] text-danger mt-1">{errors.lng.message}</p>}
                </div>
              </div>
              <p className="text-[10px] text-subtle italic">These coordinates are used for Google Maps visualization and OCPI location sharing.</p>
            </div>

            <div className="card space-y-4">
              <div className="section-title flex items-center gap-2"><Zap size={16} className="text-accent" /> Power Specifications</div>
              <div>
                <label className="form-label">Grid Capacity (kW)</label>
                <input type="number" {...register('capacity', { valueAsNumber: true })} className="input" />
                {errors.capacity && <p className="text-[10px] text-danger mt-1">{errors.capacity.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => navigate('/stations')} className="px-6 py-2 bg-bg-muted border border-border rounded-lg text-sm transition-all hover:bg-border">Cancel</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Provisioning...' : 'Provision Station'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
           <div className="card border-accent/20 bg-accent/5">
              <div className="section-title flex items-center gap-2"><Shield size={16} className="text-accent" /> Security Protocol</div>
              <p className="text-xs text-subtle leading-relaxed mt-2">
                New assets are initially provisioned in **Maintenance** mode.
                OCPP communication must be verified before the station can transition to **Online**.
              </p>
           </div>
           
           <div className="card">
              <div className="section-title">Deployment Steps</div>
              <div className="mt-4 space-y-4">
                 {[
                   { step: 1, text: 'Register asset metadata', done: true },
                   { step: 2, text: 'Physical installation & wiring', done: false },
                   { step: 3, text: 'Endpoint configuration (WS/WSS)', done: false },
                   { step: 4, text: 'OCPP authorization check', done: false },
                 ].map(s => (
                   <div key={s.step} className="flex gap-3 items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.done ? 'bg-ok/20 text-ok' : 'bg-bg-muted text-subtle border border-border'}`}>
                        {s.step}
                      </div>
                      <div className={`text-xs ${s.done ? 'text-text' : 'text-subtle'}`}>{s.text}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
