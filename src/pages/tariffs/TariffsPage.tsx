import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  useActivateTariffCalendar,
  useArchiveTariffCalendar,
  useCreateTariffCalendar,
  useTariffCalendars,
  useUpdateTariffCalendar,
} from '@/core/hooks/useEnergyPlanner'
import type { TariffCalendar } from '@/core/types/energyPlanner'

type TariffFormState = {
  name: string
  siteId: string
  currency: string
  timezone: string
  effectiveFrom: string
  flatPricePerKwh: string
}

function toDatetimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

const DEFAULT_FORM: TariffFormState = {
  name: '',
  siteId: '',
  currency: 'USD',
  timezone: 'Africa/Kampala',
  effectiveFrom: toDatetimeLocal(new Date()),
  flatPricePerKwh: '0.28',
}

function resolveEditablePrice(tariff: TariffCalendar) {
  const firstBand = tariff.bands[0]
  return firstBand?.pricePerKwh ?? tariff.pricePerKwh
}

export function TariffsPage() {
  const { data: tariffs, isLoading, error } = useTariffCalendars()
  const createMutation = useCreateTariffCalendar()
  const updateMutation = useUpdateTariffCalendar()
  const activateMutation = useActivateTariffCalendar()
  const archiveMutation = useArchiveTariffCalendar()

  const [form, setForm] = useState<TariffFormState>(DEFAULT_FORM)
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState('Create or edit tariff calendars for optimizer input.')

  if (isLoading) {
    return <DashboardLayout pageTitle="Tariffs"><div className="p-8 text-center text-subtle">Loading tariff calendars...</div></DashboardLayout>
  }

  if (error || !tariffs) {
    return <DashboardLayout pageTitle="Tariffs"><div className="p-8 text-center text-danger">Unable to load tariff calendars.</div></DashboardLayout>
  }

  const onCreateTariff = async () => {
    const name = form.name.trim()
    const price = Number(form.flatPricePerKwh)
    if (!name) {
      setStatusMessage('Tariff name is required.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setStatusMessage('Flat price must be a non-negative number.')
      return
    }

    await createMutation.mutateAsync({
      name,
      siteId: form.siteId.trim() || undefined,
      currency: form.currency.trim().toUpperCase() || 'USD',
      timezone: form.timezone.trim() || 'UTC',
      effectiveFrom: new Date(form.effectiveFrom).toISOString(),
      status: 'DRAFT',
      bands: [
        {
          id: 'all-day',
          label: 'All day',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startHour: 0,
          endHour: 24,
          pricePerKwh: price,
        },
      ],
    })

    setForm({
      ...DEFAULT_FORM,
      currency: form.currency.trim().toUpperCase() || 'USD',
      timezone: form.timezone.trim() || 'UTC',
    })
    setStatusMessage(`Created tariff calendar "${name}".`)
  }

  const onUpdatePrice = async (tariff: TariffCalendar) => {
    const inputValue = draftPrices[tariff.id]
    const nextPrice = Number(inputValue ?? resolveEditablePrice(tariff))
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setStatusMessage('Updated price must be a non-negative number.')
      return
    }

    await updateMutation.mutateAsync({
      id: tariff.id,
      input: {
        bands: [
          {
            id: 'all-day',
            label: 'All day',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startHour: 0,
            endHour: 24,
            pricePerKwh: nextPrice,
            currency: tariff.currency,
          },
        ],
      },
    })

    setStatusMessage(`Updated flat price for "${tariff.name}" to ${nextPrice} ${tariff.currency}/kWh.`)
  }

  const onActivate = async (id: string) => {
    await activateMutation.mutateAsync(id)
    setStatusMessage('Tariff calendar activated. Planner will pick this version for optimization.')
  }

  const onArchive = async (id: string) => {
    await archiveMutation.mutateAsync(id)
    setStatusMessage('Tariff calendar archived.')
  }

  return (
    <DashboardLayout pageTitle="Tariffs">
      <div className="space-y-6">
        <section className="card border-accent/20 bg-accent/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Tariff Calendar Editor</h2>
              <p className="text-sm text-subtle mt-1">Versioned tariff windows feed the Phase 2 optimization planner. EMS safety limits still apply in real time.</p>
            </div>
            <span className="text-xs text-subtle">{statusMessage}</span>
          </div>

          <div className="grid gap-3 mt-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1">
              <span className="form-label">Calendar Name</span>
              <input
                className="input"
                value={form.name}
                placeholder="Weekday TOU"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="form-label">Site ID (Optional)</span>
              <input
                className="input"
                value={form.siteId}
                placeholder="site-123"
                onChange={(event) => setForm((current) => ({ ...current, siteId: event.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="form-label">Currency</span>
              <input
                className="input"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
              />
            </label>

            <label className="space-y-1">
              <span className="form-label">Timezone</span>
              <input
                className="input"
                value={form.timezone}
                onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="form-label">Effective From</span>
              <input
                className="input"
                type="datetime-local"
                value={form.effectiveFrom}
                onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))}
              />
            </label>

            <label className="space-y-1">
              <span className="form-label">Flat Price / kWh</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.flatPricePerKwh}
                onChange={(event) => setForm((current) => ({ ...current, flatPricePerKwh: event.target.value }))}
              />
            </label>
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="btn primary sm"
              onClick={onCreateTariff}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Tariff Calendar'}
            </button>
          </div>
        </section>

        <section className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tariff</th>
                <th>Version</th>
                <th>Scope</th>
                <th>Window</th>
                <th>Price / kWh</th>
                <th>Integrity</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tariffs.map((tariff) => {
                const draftPrice = draftPrices[tariff.id]
                const effectivePrice = draftPrice ?? String(resolveEditablePrice(tariff))

                return (
                  <tr key={tariff.id}>
                    <td>
                      <div className="font-semibold">{tariff.name}</div>
                      <div className="text-[11px] text-subtle">{tariff.id}</div>
                    </td>
                    <td className="text-sm">v{tariff.version}</td>
                    <td className="text-sm">{tariff.siteId ?? 'Tenant-wide'}</td>
                    <td className="text-xs text-subtle">
                      <div>{new Date(tariff.effectiveFrom).toLocaleString()}</div>
                      <div>{tariff.effectiveTo ? new Date(tariff.effectiveTo).toLocaleString() : 'No expiry'}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input
                          className="input h-9 w-24"
                          type="number"
                          min="0"
                          step="0.01"
                          value={effectivePrice}
                          onChange={(event) =>
                            setDraftPrices((current) => ({
                              ...current,
                              [tariff.id]: event.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn secondary sm"
                          onClick={() => onUpdatePrice(tariff)}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </button>
                      </div>
                      <div className="text-[11px] text-subtle mt-1">{tariff.currency} / kWh</div>
                    </td>
                    <td>
                      {tariff.inconsistent ? (
                        <span className="pill faulted">Inconsistent</span>
                      ) : (
                        <span className="pill active">Valid</span>
                      )}
                      {tariff.stale && <span className="pill pending ml-2">Stale</span>}
                    </td>
                    <td>
                      <span className={`pill ${tariff.active ? 'active' : tariff.status === 'ARCHIVED' ? 'offline' : 'pending'}`}>
                        {tariff.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {!tariff.active && tariff.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            className="btn secondary sm"
                            onClick={() => onActivate(tariff.id)}
                            disabled={activateMutation.isPending}
                          >
                            Activate
                          </button>
                        )}
                        {tariff.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => onArchive(tariff.id)}
                            disabled={archiveMutation.isPending}
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {tariffs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-subtle">
                    No tariff calendars found. Create one to unlock tariff-aware planning.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  )
}
