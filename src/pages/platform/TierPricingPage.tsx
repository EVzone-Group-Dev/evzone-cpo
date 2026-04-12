import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  createTierPricingDraft,
  listTierPricing,
  publishTierPricingVersion,
  type AccountType,
  type DeploymentModel,
  type TierCode,
  type TierPricingGroup,
} from '@/core/api/tierPricing'

const TIER_ORDER: TierCode[] = ['T1', 'T2', 'T3', 'T4']
const ACCOUNT_TYPE_SET = new Set<AccountType>([
  'INDIVIDUAL',
  'COMPANY',
  'STATE',
  'ORGANIZATION',
])

type DraftForm = {
  tierLabel: string
  deploymentModel: DeploymentModel
  accountTypes: string
  currency: string
  isCustomPricing: boolean
  monthlyPrice: string
  annualPrice: string
  setupFee: string
  whiteLabelAvailable: boolean
  whiteLabelMonthlyAddon: string
  whiteLabelSetupFee: string
  notes: string
}

const EMPTY_FORM: Record<TierCode, DraftForm> = {
  T1: {
    tierLabel: 'T1 Start',
    deploymentModel: 'SHARED_SCHEMA',
    accountTypes: 'INDIVIDUAL,COMPANY',
    currency: 'USD',
    isCustomPricing: false,
    monthlyPrice: '99',
    annualPrice: '1010',
    setupFee: '0',
    whiteLabelAvailable: false,
    whiteLabelMonthlyAddon: '',
    whiteLabelSetupFee: '',
    notes: '',
  },
  T2: {
    tierLabel: 'T2 Growth',
    deploymentModel: 'SHARED_SCHEMA',
    accountTypes: 'COMPANY',
    currency: 'USD',
    isCustomPricing: false,
    monthlyPrice: '299',
    annualPrice: '3050',
    setupFee: '250',
    whiteLabelAvailable: false,
    whiteLabelMonthlyAddon: '',
    whiteLabelSetupFee: '',
    notes: '',
  },
  T3: {
    tierLabel: 'T3 Scale',
    deploymentModel: 'DEDICATED_DB',
    accountTypes: 'COMPANY,ORGANIZATION',
    currency: 'USD',
    isCustomPricing: false,
    monthlyPrice: '1490',
    annualPrice: '15198',
    setupFee: '2000',
    whiteLabelAvailable: true,
    whiteLabelMonthlyAddon: '350',
    whiteLabelSetupFee: '600',
    notes: '',
  },
  T4: {
    tierLabel: 'T4 Enterprise',
    deploymentModel: 'DEDICATED_DB',
    accountTypes: 'STATE,ORGANIZATION,COMPANY',
    currency: 'USD',
    isCustomPricing: true,
    monthlyPrice: '',
    annualPrice: '',
    setupFee: '',
    whiteLabelAvailable: true,
    whiteLabelMonthlyAddon: '',
    whiteLabelSetupFee: '',
    notes: 'Enterprise tier is contract-priced per tenant agreement with EVzone.',
  },
}

function toInputNumber(value: string): number | null | undefined {
  if (value.trim() === '') {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined
  }

  return parsed
}

function toDraftForm(group: TierPricingGroup): DraftForm {
  const source = group.current ?? group.versions[0]
  if (!source) {
    return EMPTY_FORM[group.tierCode]
  }

  return {
    tierLabel: source.tierLabel,
    deploymentModel: source.deploymentModel,
    accountTypes: source.accountTypes.join(','),
    currency: source.currency,
    isCustomPricing: source.isCustomPricing,
    monthlyPrice: source.monthlyPrice == null ? '' : String(source.monthlyPrice),
    annualPrice: source.annualPrice == null ? '' : String(source.annualPrice),
    setupFee: source.setupFee == null ? '' : String(source.setupFee),
    whiteLabelAvailable: source.whiteLabelAvailable,
    whiteLabelMonthlyAddon:
      source.whiteLabelMonthlyAddon == null ? '' : String(source.whiteLabelMonthlyAddon),
    whiteLabelSetupFee:
      source.whiteLabelSetupFee == null ? '' : String(source.whiteLabelSetupFee),
    notes: source.notes ?? '',
  }
}

export function TierPricingPage() {
  const [groups, setGroups] = useState<TierPricingGroup[]>([])
  const [forms, setForms] = useState<Record<TierCode, DraftForm>>(EMPTY_FORM)
  const [selectedVersion, setSelectedVersion] = useState<Record<TierCode, number>>({
    T1: 1,
    T2: 1,
    T3: 1,
    T4: 1,
  })
  const [loading, setLoading] = useState(true)
  const [savingTier, setSavingTier] = useState<TierCode | null>(null)
  const [publishingTier, setPublishingTier] = useState<TierCode | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const orderedGroups = useMemo(() => {
    const byTier = new Map(groups.map((group) => [group.tierCode, group]))
    return TIER_ORDER.map((tierCode) => byTier.get(tierCode)).filter(
      (group): group is TierPricingGroup => Boolean(group),
    )
  }, [groups])

  const reload = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextGroups = await listTierPricing(true)
      setGroups(nextGroups)
      setForms((current) => {
        const next = { ...current }
        for (const group of nextGroups) {
          next[group.tierCode] = toDraftForm(group)
        }
        return next
      })
      setSelectedVersion((current) => {
        const next = { ...current }
        for (const group of nextGroups) {
          if (group.versions.length > 0) {
            next[group.tierCode] = group.versions[0].version
          }
        }
        return next
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tier pricing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const updateForm = (tierCode: TierCode, patch: Partial<DraftForm>) => {
    setForms((current) => ({
      ...current,
      [tierCode]: {
        ...current[tierCode],
        ...patch,
      },
    }))
  }

  const saveDraft = async (tierCode: TierCode) => {
    const form = forms[tierCode]
    const accountTypes = form.accountTypes
      .split(',')
      .map((entry) => entry.trim().toUpperCase())
      .filter((entry): entry is AccountType => ACCOUNT_TYPE_SET.has(entry as AccountType))

    if (accountTypes.length === 0) {
      setError('At least one valid account type is required.')
      return
    }

    const monthlyPrice = toInputNumber(form.monthlyPrice)
    const annualPrice = toInputNumber(form.annualPrice)
    const setupFee = toInputNumber(form.setupFee)
    const whiteLabelMonthlyAddon = toInputNumber(form.whiteLabelMonthlyAddon)
    const whiteLabelSetupFee = toInputNumber(form.whiteLabelSetupFee)

    if (monthlyPrice === undefined || annualPrice === undefined || setupFee === undefined) {
      setError('Prices and setup fee must be valid non-negative numbers.')
      return
    }

    if (whiteLabelMonthlyAddon === undefined || whiteLabelSetupFee === undefined) {
      setError('White-label add-ons must be valid non-negative numbers.')
      return
    }

    setSavingTier(tierCode)
    setError(null)
    setMessage(null)

    try {
      await createTierPricingDraft(tierCode, {
        tierLabel: form.tierLabel,
        deploymentModel: form.deploymentModel,
        accountTypes,
        currency: form.currency.trim() || 'USD',
        isCustomPricing: form.isCustomPricing,
        monthlyPrice,
        annualPrice,
        setupFee,
        whiteLabelAvailable: form.whiteLabelAvailable,
        whiteLabelMonthlyAddon,
        whiteLabelSetupFee,
        notes: form.notes,
      })
      setMessage(`${tierCode} draft saved.`)
      await reload()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save draft')
    } finally {
      setSavingTier(null)
    }
  }

  const publishSelected = async (tierCode: TierCode) => {
    setPublishingTier(tierCode)
    setError(null)
    setMessage(null)

    try {
      await publishTierPricingVersion(tierCode, selectedVersion[tierCode])
      setMessage(`${tierCode} version ${selectedVersion[tierCode]} published.`)
      await reload()
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish version')
    } finally {
      setPublishingTier(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Tier Pricing">
        <div className="p-8 text-center text-subtle">Loading tier pricing...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Tier Pricing">
      <div className="space-y-4">
        <div className="card">
          <div className="section-title">Platform Tier Pricing</div>
          <p className="text-sm text-subtle mt-2">
            Super admins can create draft prices and publish a new active version per tier.
            T4 Enterprise remains custom-priced by contract.
          </p>
        </div>

        {error && <div className="alert danger">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {orderedGroups.map((group) => {
          const form = forms[group.tierCode]
          const activeVersion = group.current

          return (
            <div key={group.tierCode} className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="section-title">{group.tierCode} Pricing</div>
                  <div className="text-xs text-subtle mt-1">
                    Active: {activeVersion ? `v${activeVersion.version} (${activeVersion.status})` : 'None'}
                  </div>
                </div>
                <span className="pill active">{form.deploymentModel}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Tier Label</label>
                  <input
                    className="input"
                    value={form.tierLabel}
                    onChange={(event) => updateForm(group.tierCode, { tierLabel: event.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Currency</label>
                  <input
                    className="input"
                    value={form.currency}
                    onChange={(event) => updateForm(group.tierCode, { currency: event.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="form-label">Deployment</label>
                  <select
                    className="input"
                    value={form.deploymentModel}
                    onChange={(event) =>
                      updateForm(group.tierCode, {
                        deploymentModel: event.target.value as DeploymentModel,
                      })
                    }
                  >
                    <option value="SHARED_SCHEMA">SHARED_SCHEMA</option>
                    <option value="DEDICATED_DB">DEDICATED_DB</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Account Types (comma-separated)</label>
                <input
                  className="input"
                  value={form.accountTypes}
                  onChange={(event) => updateForm(group.tierCode, { accountTypes: event.target.value })}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Monthly Price (USD)</label>
                  <input
                    className="input"
                    value={form.monthlyPrice}
                    disabled={form.isCustomPricing}
                    onChange={(event) => updateForm(group.tierCode, { monthlyPrice: event.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Annual Price (USD)</label>
                  <input
                    className="input"
                    value={form.annualPrice}
                    disabled={form.isCustomPricing}
                    onChange={(event) => updateForm(group.tierCode, { annualPrice: event.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Setup Fee (USD)</label>
                  <input
                    className="input"
                    value={form.setupFee}
                    onChange={(event) => updateForm(group.tierCode, { setupFee: event.target.value })}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isCustomPricing}
                    onChange={(event) =>
                      updateForm(group.tierCode, { isCustomPricing: event.target.checked })
                    }
                  />
                  Contract custom pricing
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.whiteLabelAvailable}
                    onChange={(event) =>
                      updateForm(group.tierCode, {
                        whiteLabelAvailable: event.target.checked,
                      })
                    }
                  />
                  White-label optional add-on
                </label>
              </div>

              {form.whiteLabelAvailable && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">White-label Monthly Add-on (USD)</label>
                    <input
                      className="input"
                      value={form.whiteLabelMonthlyAddon}
                      onChange={(event) =>
                        updateForm(group.tierCode, {
                          whiteLabelMonthlyAddon: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">White-label Setup Fee (USD)</label>
                    <input
                      className="input"
                      value={form.whiteLabelSetupFee}
                      onChange={(event) =>
                        updateForm(group.tierCode, {
                          whiteLabelSetupFee: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="mt-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="input min-h-[82px]"
                  value={form.notes}
                  onChange={(event) => updateForm(group.tierCode, { notes: event.target.value })}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <button
                  className="btn primary"
                  disabled={savingTier === group.tierCode}
                  onClick={() => void saveDraft(group.tierCode)}
                >
                  {savingTier === group.tierCode ? 'Saving...' : 'Save Draft'}
                </button>

                <div>
                  <label className="form-label">Publish Version</label>
                  <select
                    className="input"
                    value={selectedVersion[group.tierCode]}
                    onChange={(event) =>
                      setSelectedVersion((current) => ({
                        ...current,
                        [group.tierCode]: Number(event.target.value),
                      }))
                    }
                  >
                    {group.versions.map((version) => (
                      <option key={version.id} value={version.version}>
                        v{version.version} ({version.status})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn"
                  disabled={publishingTier === group.tierCode || group.versions.length === 0}
                  onClick={() => void publishSelected(group.tierCode)}
                >
                  {publishingTier === group.tierCode ? 'Publishing...' : 'Publish Selected'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}
