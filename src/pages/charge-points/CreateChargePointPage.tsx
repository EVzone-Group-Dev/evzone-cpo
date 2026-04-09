import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AlertCircle, CheckCircle2, Cpu, Zap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCreateChargePoint } from '@/core/hooks/usePlatformData'
import { useStations } from '@/core/hooks/useStations'
import { PATHS } from '@/router/paths'

const chargePointSchema = z.object({
  stationId: z.string().min(1, 'Station is required'),
  ocppId: z.string().min(3, 'OCPP ID must be at least 3 characters'),
  ocppVersion: z.enum(['1.6', '2.0.1', '2.1']),
  power: z.number().min(1, 'Power must be at least 1 kW').max(350, 'Power cannot exceed 350 kW'),
  type: z.string().min(2, 'Connector type is required'),
})

type ChargePointFormValues = z.infer<typeof chargePointSchema>

const FIELD_CONFIG = {
  ocppId: {
    hint: 'Must be unique within station. Used for OCPP protocol communication.',
    placeholder: 'e.g. EVZ-CP-001, STATION-01-01',
  },
  power: {
    hint: 'Maximum continuous output power in kilowatts',
    placeholder: '50',
  },
  type: {
    hint: 'Primary connector type for this charge point',
  },
  ocppVersion: {
    hint: 'OCPP protocol version for this charge point',
  },
}

export function CreateChargePointPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const presetStationId = searchParams.get('stationId') ?? ''
  const returnTo = searchParams.get('returnTo')
  const { data: stations, isLoading: isStationsLoading, error: stationsError } = useStations()
  const createChargePoint = useCreateChargePoint()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ChargePointFormValues>({
    resolver: zodResolver(chargePointSchema),
    mode: 'onBlur',
    defaultValues: {
      stationId: presetStationId,
      type: 'CCS2',
      ocppVersion: '1.6',
      power: 50,
    },
  })

  const selectedStation = watch('stationId')
  const stationName = stations?.find(s => s.id === selectedStation)?.name

  const onSubmit = async (values: ChargePointFormValues) => {
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const created = await createChargePoint.mutateAsync({
        stationId: values.stationId,
        ocppId: values.ocppId.trim(),
        ocppVersion: values.ocppVersion,
        power: values.power,
        type: values.type.trim(),
      })

      setSubmitSuccess(true)
      setTimeout(() => {
        navigate(PATHS.CHARGE_POINT_DETAIL(created.id), {
          state: {
            setupCredentials: created.ocppCredentials ?? null,
            setupStartedAt: new Date().toISOString(),
            returnTo:
              returnTo === 'station-detail'
                ? PATHS.STATION_DETAIL(values.stationId)
                : PATHS.CHARGE_POINTS,
          },
        })
      }, 450)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to provision charge point. Please try again.',
      )
    }
  }

  const fieldsDisabled = isStationsLoading || !!stationsError || isSubmitting || createChargePoint.isPending

  return (
    <DashboardLayout pageTitle="Add Charge Point">
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitSuccess && (
            <div className="rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 flex items-center gap-3 text-ok">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Charge point provisioned. Opening setup workflow...</span>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 flex items-start gap-3 text-danger">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Provisioning failed</p>
                <p className="text-[13px] mt-1 opacity-90">{submitError}</p>
              </div>
            </div>
          )}

          {stationsError && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 flex items-center gap-3 text-danger">
              <AlertCircle size={18} />
              <span className="text-sm">Unable to load stations. Please refresh the page.</span>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={18} className="text-accent" />
              <h2 className="text-lg font-bold">Site Assignment</h2>
            </div>

            <div>
              <label className="form-label">Select Station *</label>
              <select
                {...register('stationId')}
                className={`input ${errors.stationId ? 'border-danger bg-danger/5' : ''} ${fieldsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={fieldsDisabled}
              >
                <option value="">Choose a station...</option>
                {(stations || []).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                    {' · '}
                    {station.city}, {station.country}
                  </option>
                ))}
              </select>
              {errors.stationId && (
                <p className="text-[12px] text-danger mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.stationId.message}
                </p>
              )}
              {selectedStation && stationName && (
                <p className="text-[12px] text-ok mt-1.5">✓ Assigned to: {stationName}</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-accent" />
              <h2 className="text-lg font-bold">Provisioning Identity</h2>
            </div>

            <div>
              <label className="form-label">OCPP ID *</label>
              <input
                {...register('ocppId')}
                className={`input ${errors.ocppId ? 'border-danger bg-danger/5' : ''} ${fieldsDisabled ? 'opacity-60' : ''}`}
                placeholder={FIELD_CONFIG.ocppId.placeholder}
                disabled={fieldsDisabled}
              />
              {errors.ocppId ? (
                <p className="text-[12px] text-danger mt-1.5 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.ocppId.message}
                </p>
              ) : (
                <p className="text-[12px] text-subtle mt-1.5">{FIELD_CONFIG.ocppId.hint}</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold mb-4">Protocol & Connector Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">OCPP Version *</label>
                <select
                  {...register('ocppVersion')}
                  className={`input ${errors.ocppVersion ? 'border-danger bg-danger/5' : ''} ${fieldsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={fieldsDisabled}
                >
                  <option value="1.6">1.6 (Legacy)</option>
                  <option value="2.0.1">2.0.1 (Current)</option>
                  <option value="2.1">2.1 (Latest)</option>
                </select>
                {errors.ocppVersion ? (
                  <p className="text-[12px] text-danger mt-1.5">{errors.ocppVersion.message}</p>
                ) : (
                  <p className="text-[12px] text-subtle mt-1.5">{FIELD_CONFIG.ocppVersion.hint}</p>
                )}
              </div>

              <div>
                <label className="form-label">Connector Type *</label>
                <select
                  {...register('type')}
                  className={`input ${errors.type ? 'border-danger bg-danger/5' : ''} ${fieldsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={fieldsDisabled}
                >
                  <option value="">Select type...</option>
                  <option value="CCS2">CCS2 (EU Standard)</option>
                  <option value="Type 2">Type 2 (AC)</option>
                  <option value="CCS1">CCS1 (US Standard)</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="NACS">NACS (Tesla)</option>
                  <option value="GB/T">GB/T (China)</option>
                </select>
                {errors.type ? (
                  <p className="text-[12px] text-danger mt-1.5 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.type.message}
                  </p>
                ) : (
                  <p className="text-[12px] text-subtle mt-1.5">{FIELD_CONFIG.type.hint}</p>
                )}
              </div>

              <div>
                <label className="form-label">Power Capacity (kW) *</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('power', { valueAsNumber: true })}
                  className={`input ${errors.power ? 'border-danger bg-danger/5' : ''} ${fieldsDisabled ? 'opacity-60' : ''}`}
                  placeholder={FIELD_CONFIG.power.placeholder}
                  disabled={fieldsDisabled}
                />
                {errors.power ? (
                  <p className="text-[12px] text-danger mt-1.5 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.power.message}
                  </p>
                ) : (
                  <p className="text-[12px] text-subtle mt-1.5">{FIELD_CONFIG.power.hint}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate(returnTo === 'station-detail' && presetStationId ? PATHS.STATION_DETAIL(presetStationId) : PATHS.CHARGE_POINTS)}
              disabled={fieldsDisabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn primary flex items-center gap-2 ${fieldsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={fieldsDisabled}
            >
              {isSubmitting || createChargePoint.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Provision Charge Point
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
