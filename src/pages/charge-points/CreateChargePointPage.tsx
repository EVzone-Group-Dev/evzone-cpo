import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCreateChargePoint } from '@/core/hooks/usePlatformData'
import { useStations } from '@/core/hooks/useStations'
import { PATHS } from '@/router/paths'

const chargePointSchema = z.object({
  stationId: z.string().min(1, 'Station is required'),
  model: z.string().min(2, 'Model is required'),
  manufacturer: z.string().min(2, 'Manufacturer is required'),
  serialNumber: z.string().min(2, 'Serial number is required'),
  ocppId: z.string().min(3, 'OCPP ID is required'),
  ocppVersion: z.string().min(3, 'OCPP version is required'),
  maxCapacityKw: z.number().min(1, 'Capacity must be at least 1 kW'),
  connectorType: z.string().min(2, 'Connector type is required'),
})

type ChargePointFormValues = z.infer<typeof chargePointSchema>

export function CreateChargePointPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: stations, isLoading: isStationsLoading, error: stationsError } = useStations()
  const createChargePoint = useCreateChargePoint()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChargePointFormValues>({
    resolver: zodResolver(chargePointSchema),
    defaultValues: {
      connectorType: 'Type 2',
      ocppVersion: '1.6J',
      maxCapacityKw: 22,
    },
  })

  const onSubmit = async (values: ChargePointFormValues) => {
    setSubmitError(null)

    try {
      await createChargePoint.mutateAsync(values)
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
              <label className="form-label">Serial Number</label>
              <input {...register('serialNumber')} className={`input ${errors.serialNumber ? 'border-danger' : ''}`} placeholder="e.g. SN-9001" />
              {errors.serialNumber && <p className="text-[10px] text-danger mt-1">{errors.serialNumber.message}</p>}
            </div>

            <div>
              <label className="form-label">OCPP ID</label>
              <input {...register('ocppId')} className={`input ${errors.ocppId ? 'border-danger' : ''}`} placeholder="e.g. EVZ-WL-101" />
              {errors.ocppId && <p className="text-[10px] text-danger mt-1">{errors.ocppId.message}</p>}
            </div>

            <div>
              <label className="form-label">OCPP Version</label>
              <input {...register('ocppVersion')} className={`input ${errors.ocppVersion ? 'border-danger' : ''}`} placeholder="e.g. 1.6J" />
              {errors.ocppVersion && <p className="text-[10px] text-danger mt-1">{errors.ocppVersion.message}</p>}
            </div>

            <div>
              <label className="form-label">Max Capacity (kW)</label>
              <input
                type="number"
                {...register('maxCapacityKw', { valueAsNumber: true })}
                className={`input ${errors.maxCapacityKw ? 'border-danger' : ''}`}
              />
              {errors.maxCapacityKw && <p className="text-[10px] text-danger mt-1">{errors.maxCapacityKw.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Connector Type</label>
              <select {...register('connectorType')} className={`input ${errors.connectorType ? 'border-danger' : ''}`}>
                <option value="Type 2">Type 2</option>
                <option value="CCS 2">CCS 2</option>
                <option value="CCS 1">CCS 1</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="NACS">NACS</option>
                <option value="GB/T">GB/T</option>
              </select>
              {errors.connectorType && <p className="text-[10px] text-danger mt-1">{errors.connectorType.message}</p>}
            </div>
          </div>

          {submitError && <div className="alert danger text-xs">{submitError}</div>}
          {stationsError && <div className="alert danger text-xs">Unable to load stations.</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn secondary" onClick={() => navigate(PATHS.CHARGE_POINTS)}>
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
