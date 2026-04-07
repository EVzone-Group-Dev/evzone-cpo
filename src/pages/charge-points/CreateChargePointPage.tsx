import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCreateChargePoint } from '@/core/hooks/usePlatformData'
import { useStations } from '@/core/hooks/useStations'
import { PATHS } from '@/router/paths'

const chargePointSchema = z.object({
  stationId: z.string().min(1, 'Station is required'),
  model: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  firmwareVersion: z.string().trim().optional(),
  ocppId: z.string().min(3, 'OCPP ID is required'),
  ocppVersion: z.enum(['1.6', '2.0.1', '2.1']),
  power: z.number().min(1, 'Power must be at least 1 kW'),
  type: z.string().min(2, 'Connector type is required'),
})

type ChargePointFormValues = z.infer<typeof chargePointSchema>

export function CreateChargePointPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const presetStationId = searchParams.get('stationId') ?? ''
  const returnTo = searchParams.get('returnTo')
  const { data: stations, isLoading: isStationsLoading, error: stationsError } = useStations()
  const createChargePoint = useCreateChargePoint()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChargePointFormValues>({
    resolver: zodResolver(chargePointSchema),
    defaultValues: {
      stationId: presetStationId,
      type: 'CCS2',
      ocppVersion: '1.6',
      power: 50,
      model: '',
      manufacturer: '',
      firmwareVersion: '',
    },
  })

  const onSubmit = async (values: ChargePointFormValues) => {
    setSubmitError(null)

    try {
      await createChargePoint.mutateAsync({
        stationId: values.stationId,
        model: values.model?.trim() || undefined,
        manufacturer: values.manufacturer?.trim() || undefined,
        firmwareVersion: values.firmwareVersion?.trim() || undefined,
        ocppId: values.ocppId.trim(),
        ocppVersion: values.ocppVersion,
        power: values.power,
        type: values.type.trim(),
      })

      if (returnTo === 'station-detail') {
        navigate(PATHS.STATION_DETAIL(values.stationId))
        return
      }

      navigate(PATHS.CHARGE_POINTS)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create charge point.')
    }
  }

  return (
    <DashboardLayout pageTitle="Add Charge Point">
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Station</label>
              <select
                {...register('stationId')}
                className={`input ${errors.stationId ? 'border-danger' : ''}`}
                disabled={isStationsLoading || !!stationsError}
              >
                <option value="">Select station</option>
                {(stations || []).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              {errors.stationId && <p className="text-[10px] text-danger mt-1">{errors.stationId.message}</p>}
            </div>

            <div>
              <label className="form-label">Model</label>
              <input {...register('model')} className={`input ${errors.model ? 'border-danger' : ''}`} placeholder="e.g. ABB Terra 184" />
              {errors.model && <p className="text-[10px] text-danger mt-1">{errors.model.message}</p>}
            </div>

            <div>
              <label className="form-label">Manufacturer</label>
              <input {...register('manufacturer')} className={`input ${errors.manufacturer ? 'border-danger' : ''}`} placeholder="e.g. ABB" />
              {errors.manufacturer && <p className="text-[10px] text-danger mt-1">{errors.manufacturer.message}</p>}
            </div>

            <div>
              <label className="form-label">OCPP ID</label>
              <input {...register('ocppId')} className={`input ${errors.ocppId ? 'border-danger' : ''}`} placeholder="e.g. EVZ-WL-101" />
              {errors.ocppId && <p className="text-[10px] text-danger mt-1">{errors.ocppId.message}</p>}
            </div>

            <div>
              <label className="form-label">OCPP Version</label>
              <select {...register('ocppVersion')} className={`input ${errors.ocppVersion ? 'border-danger' : ''}`}>
                <option value="1.6">1.6</option>
                <option value="2.0.1">2.0.1</option>
                <option value="2.1">2.1</option>
              </select>
              {errors.ocppVersion && <p className="text-[10px] text-danger mt-1">{errors.ocppVersion.message}</p>}
            </div>

            <div>
              <label className="form-label">Power (kW)</label>
              <input
                type="number"
                {...register('power', { valueAsNumber: true })}
                className={`input ${errors.power ? 'border-danger' : ''}`}
              />
              {errors.power && <p className="text-[10px] text-danger mt-1">{errors.power.message}</p>}
            </div>

            <div>
              <label className="form-label">Connector Type</label>
              <select {...register('type')} className={`input ${errors.type ? 'border-danger' : ''}`}>
                <option value="CCS2">CCS2</option>
                <option value="Type 2">Type 2</option>
                <option value="CCS1">CCS1</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="NACS">NACS</option>
                <option value="GB/T">GB/T</option>
              </select>
              {errors.type && <p className="text-[10px] text-danger mt-1">{errors.type.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Initial Firmware Version</label>
              <input
                {...register('firmwareVersion')}
                className={`input ${errors.firmwareVersion ? 'border-danger' : ''}`}
                placeholder="e.g. 1.4.2"
              />
              {errors.firmwareVersion && <p className="text-[10px] text-danger mt-1">{errors.firmwareVersion.message}</p>}
            </div>
          </div>

          {submitError && <div className="alert danger text-xs">{submitError}</div>}
          {stationsError && <div className="alert danger text-xs">Unable to load stations.</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate(returnTo === 'station-detail' && presetStationId ? PATHS.STATION_DETAIL(presetStationId) : PATHS.CHARGE_POINTS)}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={createChargePoint.isPending || isStationsLoading || !!stationsError}>
              {createChargePoint.isPending ? 'Creating...' : 'Create Charge Point'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
