import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Shield, Info } from 'lucide-react'
import { useTenant } from '@/core/hooks/useTenant'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'

const stationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  address: z.string().min(5, 'Address is required'),
  countryCode: z.string().min(2, 'Country is required'),
  stateCode: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  serviceMode: z.enum(['Charging', 'Swapping', 'Hybrid']),
  capacity: z.number().min(10, 'Capacity must be at least 10kW'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  swapCabinets: z.number().min(0).max(24),
  type: z.enum(['AC', 'DC', 'Mixed']),
})

type StationFormValues = z.infer<typeof stationSchema>

function resolveDefaultCountryCode(
  availableCountries: Array<{ code2: string; code3: string | null; name: string }>,
  tenantRegion: string | null | undefined,
) {
  const normalizedRegion = tenantRegion?.trim().toLowerCase()

  if (!normalizedRegion) {
    return availableCountries[0]?.code2 ?? ''
  }

  const matched = availableCountries.find((country) => {
    const code2 = country.code2.toLowerCase()
    const code3 = country.code3?.toLowerCase()
    const name = country.name.toLowerCase()

    return code2 === normalizedRegion || code3 === normalizedRegion || name === normalizedRegion
  })

  return matched?.code2 ?? availableCountries[0]?.code2 ?? ''
}

export function CreateStationPage() {
  const navigate = useNavigate()
  const { activeTenant, availableCountries } = useTenant()
  const countries = useMemo(
    () => (availableCountries ?? []).map((country) => ({
      code2: country.code2,
      code3: country.code3,
      name: country.name,
    })),
    [availableCountries],
  )

  const defaultCountryCode = useMemo(
    () => resolveDefaultCountryCode(countries, activeTenant?.region),
    [activeTenant?.region, countries],
  )

  const {
    control,
    getValues,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      countryCode: defaultCountryCode,
      stateCode: '',
      city: '',
      serviceMode: 'Charging',
      swapCabinets: 0,
      type: 'AC',
      capacity: 50,
    },
  })

  const serviceMode = useWatch({ control, name: 'serviceMode' }) ?? 'Charging'
  const countryCode = useWatch({ control, name: 'countryCode' })
  const stateCode = useWatch({ control, name: 'stateCode' })

  const { data: states = [], isLoading: isStatesLoading } = useReferenceStates(countryCode)
  const { data: cities = [], isLoading: isCitiesLoading } = useReferenceCities(countryCode, stateCode)

  useEffect(() => {
    if (!getValues('countryCode') && defaultCountryCode) {
      setValue('countryCode', defaultCountryCode, { shouldValidate: true })
    }
  }, [defaultCountryCode, getValues, setValue])

  useEffect(() => {
    if (!stateCode) {
      return
    }

    if (states.length > 0 && !states.some((state) => state.code === stateCode)) {
      setValue('stateCode', '', { shouldValidate: true })
      setValue('city', '', { shouldValidate: true })
    }
  }, [setValue, stateCode, states])

  useEffect(() => {
    const currentCity = getValues('city')

    if (!currentCity || cities.length === 0) {
      return
    }

    if (!cities.some((city) => city.name === currentCity)) {
      setValue('city', '', { shouldValidate: true })
    }
  }, [cities, getValues, setValue])

  const onSubmit = async (data: StationFormValues) => {
    const selectedCountry = countries.find((country) => country.code2 === data.countryCode)
    const selectedState = states.find((state) => state.code === data.stateCode)

    console.log('[CreateStation] Data:', {
      ...data,
      country: selectedCountry?.name ?? data.countryCode,
      state: selectedState?.name ?? data.stateCode,
    })

    await new Promise((resolve) => setTimeout(resolve, 1500))
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
                  <label className="form-label">Service Mode</label>
                  <select {...register('serviceMode')} className="input transition-all">
                    <option value="Charging">Charging</option>
                    <option value="Swapping">Swapping</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              {serviceMode !== 'Swapping' && (
                <div>
                  <label className="form-label">Primary Charge Type</label>
                  <select {...register('type')} className="input transition-all">
                    <option value="AC">AC (Destination)</option>
                    <option value="DC">DC (Fast Charging)</option>
                    <option value="Mixed">Mixed Portfolio</option>
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Full Address</label>
                <input {...register('address')} className="input" placeholder="e.g. 123 Westlands Ave" />
                {errors.address && <p className="text-[10px] text-danger mt-1">{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Country</label>
                  <select
                    {...register('countryCode', {
                      onChange: () => {
                        setValue('stateCode', '', { shouldValidate: true })
                        setValue('city', '', { shouldValidate: true })
                      },
                    })}
                    className={`input ${errors.countryCode ? 'border-danger' : ''}`}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code2} value={country.code2}>{country.name}</option>
                    ))}
                  </select>
                  {errors.countryCode && <p className="text-[10px] text-danger mt-1">{errors.countryCode.message}</p>}
                </div>
                <div>
                  <label className="form-label">State / Province</label>
                  {states.length > 0 ? (
                    <select
                      {...register('stateCode', {
                        onChange: () => {
                          setValue('city', '', { shouldValidate: true })
                        },
                      })}
                      className="input"
                      disabled={!countryCode || isStatesLoading}
                    >
                      <option value="">{isStatesLoading ? 'Loading states...' : 'Select state'}</option>
                      {states.map((state) => (
                        <option key={state.code} value={state.code}>{state.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register('stateCode')}
                      className="input"
                      placeholder={countryCode ? 'Type state/province' : 'Select country first'}
                      disabled={!countryCode}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="form-label">City</label>
                {cities.length > 0 ? (
                  <select
                    {...register('city')}
                    className={`input ${errors.city ? 'border-danger' : ''}`}
                    disabled={!countryCode || Boolean(states.length > 0 && !stateCode) || isCitiesLoading}
                  >
                    <option value="">
                      {isCitiesLoading
                        ? 'Loading cities...'
                        : states.length > 0 && !stateCode
                          ? 'Select state first'
                          : 'Select city'}
                    </option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...register('city')}
                    className={`input ${errors.city ? 'border-danger' : ''}`}
                    placeholder={countryCode ? 'Enter city' : 'Select country first'}
                    disabled={!countryCode}
                  />
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{serviceMode === 'Swapping' ? 'Recharge Backbone (kW)' : 'Grid Capacity (kW)'}</label>
                  <input type="number" {...register('capacity', { valueAsNumber: true })} className="input" />
                  {errors.capacity && <p className="text-[10px] text-danger mt-1">{errors.capacity.message}</p>}
                </div>
                <div>
                  <label className="form-label">Initial Swap Cabinets</label>
                  <input type="number" {...register('swapCabinets', { valueAsNumber: true })} className="input" />
                  {errors.swapCabinets && <p className="text-[10px] text-danger mt-1">{errors.swapCabinets.message}</p>}
                </div>
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
                Charging sites require OCPP verification, while swap sites require cabinet heartbeat and battery safety checks before going **Online**.
              </p>
           </div>

           <div className="card">
              <div className="section-title">Deployment Steps</div>
              <div className="mt-4 space-y-4">
                 {[
                    { step: 1, text: 'Register asset metadata', done: true },
                    { step: 2, text: 'Physical installation & wiring', done: false },
                    { step: 3, text: serviceMode === 'Swapping' ? 'Cabinet telemetry onboarding' : 'Endpoint configuration (WS/WSS)', done: false },
                    { step: 4, text: serviceMode === 'Swapping' ? 'Battery safety and inventory check' : 'OCPP authorization check', done: false },
                  ].map((s) => (
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
