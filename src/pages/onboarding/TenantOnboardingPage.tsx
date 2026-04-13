import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  acceptEnterpriseQuote,
  confirmOnboardingTier,
  createOnboardingApplication,
  createOnboardingPaymentIntent,
  listApplicantTierPricing,
  listMyOnboardingApplications,
  syncOnboardingPaymentIntent,
  type ApplicantTierPricing,
  type BillingCycle,
  type CreateOnboardingApplicationInput,
  type TenantOnboardingApplication,
  type TenantOnboardingStage,
} from '@/core/api/onboarding'

type Notice = {
  kind: 'success' | 'error'
  text: string
} | null

const STAGE_ORDER: TenantOnboardingStage[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED_PENDING_TIER',
  'TIER_CONFIRMED_PENDING_PAYMENT',
  'QUOTE_PENDING',
  'PAYMENT_CONFIRMED_PENDING_ACTIVATION',
  'QUOTE_ACCEPTED_PENDING_ACTIVATION',
  'COMPLETED',
]

const STAGE_LABEL: Record<TenantOnboardingStage, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED_PENDING_TIER: 'Approved Pending Tier',
  REJECTED: 'Rejected',
  TIER_CONFIRMED_PENDING_PAYMENT: 'Tier Confirmed Pending Payment',
  QUOTE_PENDING: 'Quote Pending',
  PAYMENT_CONFIRMED_PENDING_ACTIVATION: 'Payment Confirmed Pending Activation',
  QUOTE_ACCEPTED_PENDING_ACTIVATION: 'Quote Accepted Pending Activation',
  COMPLETED: 'Completed',
}

const EMPTY_FORM: CreateOnboardingApplicationInput = {
  tenantType: 'COMPANY',
  cpoType: 'CHARGE',
  organizationName: '',
  businessRegistrationNumber: '',
  taxComplianceNumber: '',
  contactPersonName: '',
  contactEmail: '',
  contactPhone: '',
  physicalAddress: '',
  companyWebsite: '',
  yearsInEVBusiness: '',
  existingStationsOperated: 0,
  preferredLeaseModel: '',
  businessPlanSummary: '',
  sustainabilityCommitments: '',
  additionalServices: [],
  estimatedStartDate: '',
  message: '',
  applicantPreferredSubdomain: '',
  applicantPreferredDomain: '',
}

function normalizeInput(form: CreateOnboardingApplicationInput): CreateOnboardingApplicationInput {
  return {
    ...form,
    businessRegistrationNumber: form.businessRegistrationNumber?.trim() || undefined,
    taxComplianceNumber: form.taxComplianceNumber?.trim() || undefined,
    companyWebsite: form.companyWebsite?.trim() || undefined,
    yearsInEVBusiness: form.yearsInEVBusiness?.trim() || undefined,
    existingStationsOperated:
      form.existingStationsOperated && form.existingStationsOperated > 0
        ? form.existingStationsOperated
        : undefined,
    preferredLeaseModel: form.preferredLeaseModel?.trim() || undefined,
    businessPlanSummary: form.businessPlanSummary?.trim() || undefined,
    sustainabilityCommitments: form.sustainabilityCommitments?.trim() || undefined,
    estimatedStartDate: form.estimatedStartDate?.trim() || undefined,
    message: form.message?.trim() || undefined,
    applicantPreferredSubdomain: form.applicantPreferredSubdomain?.trim() || undefined,
    applicantPreferredDomain: form.applicantPreferredDomain?.trim() || undefined,
  }
}

function resolveCpoAddons(
  tier: ApplicantTierPricing,
  cpoType: 'CHARGE' | 'SWAP' | 'HYBRID',
  billingCycle: BillingCycle,
) {
  if (cpoType === 'CHARGE') {
    return { recurringAddon: 0, setupAddon: 0 }
  }

  if (cpoType === 'SWAP') {
    return {
      recurringAddon: billingCycle === 'ANNUAL' ? tier.swapAnnualAddon || 0 : tier.swapMonthlyAddon || 0,
      setupAddon: tier.swapSetupAddon || 0,
    }
  }

  return {
    recurringAddon: billingCycle === 'ANNUAL' ? tier.hybridAnnualAddon || 0 : tier.hybridMonthlyAddon || 0,
    setupAddon: tier.hybridSetupAddon || 0,
  }
}

export function TenantOnboardingPage() {
  const [applications, setApplications] = useState<TenantOnboardingApplication[]>([])
  const [tiers, setTiers] = useState<ApplicantTierPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [form, setForm] = useState<CreateOnboardingApplicationInput>(EMPTY_FORM)
  const [selectedTier, setSelectedTier] = useState<'T1' | 'T2' | 'T3' | 'T4'>('T1')
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [requestWhiteLabel, setRequestWhiteLabel] = useState(false)
  const [quoteReference, setQuoteReference] = useState('')

  const activeApplication = applications[0] || null

  const availableTiers = useMemo(() => {
    if (!activeApplication) {
      return tiers
    }
    return tiers.filter((tier) => tier.accountTypes.includes(activeApplication.tenantType))
  }, [activeApplication, tiers])

  const selectedTierConfig = useMemo(
    () => availableTiers.find((tier) => tier.tierCode === selectedTier) || null,
    [availableTiers, selectedTier],
  )

  const tierPricingPreview = useMemo(() => {
    if (!activeApplication || !selectedTierConfig || selectedTierConfig.isCustomPricing) {
      return null
    }

    const baseRecurring =
      selectedBillingCycle === 'ANNUAL' ? selectedTierConfig.annualPrice : selectedTierConfig.monthlyPrice
    if (baseRecurring == null) {
      return null
    }

    const { recurringAddon, setupAddon } = resolveCpoAddons(
      selectedTierConfig,
      activeApplication.cpoType,
      selectedBillingCycle,
    )
    const whiteLabelRecurring = requestWhiteLabel ? selectedTierConfig.whiteLabelMonthlyAddon || 0 : 0
    const whiteLabelSetup = requestWhiteLabel ? selectedTierConfig.whiteLabelSetupFee || 0 : 0
    const setupBase = selectedTierConfig.setupFee || 0
    const recurringTotal = Number((baseRecurring + recurringAddon + whiteLabelRecurring).toFixed(2))
    const setupTotal = Number((setupBase + setupAddon + whiteLabelSetup).toFixed(2))
    const dueNow = Number((recurringTotal + setupTotal).toFixed(2))

    return {
      currency: selectedTierConfig.currency || 'USD',
      baseRecurring: Number(baseRecurring.toFixed(2)),
      recurringAddon: Number(recurringAddon.toFixed(2)),
      whiteLabelRecurring: Number(whiteLabelRecurring.toFixed(2)),
      recurringTotal,
      setupBase: Number(setupBase.toFixed(2)),
      setupAddon: Number(setupAddon.toFixed(2)),
      whiteLabelSetup: Number(whiteLabelSetup.toFixed(2)),
      setupTotal,
      dueNow,
    }
  }, [
    activeApplication,
    requestWhiteLabel,
    selectedBillingCycle,
    selectedTierConfig,
  ])

  async function reload() {
    setLoading(true)
    setNotice(null)
    try {
      const [apps, publishedTiers] = await Promise.all([
        listMyOnboardingApplications(),
        listApplicantTierPricing(),
      ])
      setApplications(apps)
      setTiers(publishedTiers)
      if (apps[0]?.selectedTierCode) {
        setSelectedTier(apps[0].selectedTierCode)
      }
      if (apps[0]?.selectedBillingCycle) {
        setSelectedBillingCycle(apps[0].selectedBillingCycle)
      }
      if (apps[0]?.pricingSnapshot?.whiteLabelRequested) {
        setRequestWhiteLabel(true)
      }
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to load onboarding state.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleCreateApplication() {
    setWorking(true)
    setNotice(null)
    try {
      await createOnboardingApplication(normalizeInput(form))
      setForm(EMPTY_FORM)
      setNotice({ kind: 'success', text: 'Application submitted successfully.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit application.',
      })
    } finally {
      setWorking(false)
    }
  }

  async function handleConfirmTier() {
    if (!activeApplication) return
    setWorking(true)
    setNotice(null)
    try {
      await confirmOnboardingTier(activeApplication.id, {
        tierCode: selectedTier,
        billingCycle: selectedTierConfig?.isCustomPricing ? undefined : selectedBillingCycle,
        requestWhiteLabel,
      })
      setNotice({ kind: 'success', text: 'Tier selection confirmed and price locked.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to confirm tier selection.',
      })
    } finally {
      setWorking(false)
    }
  }

  async function handleCreatePaymentIntent() {
    if (!activeApplication) return
    setWorking(true)
    setNotice(null)
    try {
      await createOnboardingPaymentIntent(activeApplication.id, {})
      setNotice({ kind: 'success', text: 'Checkout intent created.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to create payment intent.',
      })
    } finally {
      setWorking(false)
    }
  }

  async function handleSyncPayment(markSettled = false) {
    if (!activeApplication) return
    setWorking(true)
    setNotice(null)
    try {
      await syncOnboardingPaymentIntent(activeApplication.id, markSettled
        ? { status: 'SETTLED', markSettled: true }
        : {})
      setNotice({
        kind: 'success',
        text: markSettled
          ? 'Payment marked as settled.'
          : 'Payment status synchronized.',
      })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to sync payment status.',
      })
    } finally {
      setWorking(false)
    }
  }

  async function handleAcceptQuote() {
    if (!activeApplication) return
    setWorking(true)
    setNotice(null)
    try {
      await acceptEnterpriseQuote(activeApplication.id, {
        quoteReference: quoteReference.trim(),
      })
      setQuoteReference('')
      setNotice({ kind: 'success', text: 'Enterprise quote accepted.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to accept enterprise quote.',
      })
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Tenant Onboarding">
        <div className="p-8 text-center text-subtle">Loading onboarding status...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Tenant Onboarding">
      <div className="space-y-4">
        <div className="card">
          <div className="section-title">Single-Source Tenant Onboarding</div>
          <p className="mt-2 text-sm text-subtle">
            Submit your tenant profile once, track the canonical status timeline, then complete tier confirmation and payment or enterprise quote acceptance.
          </p>
        </div>

        {notice && (
          <div className={`alert ${notice.kind === 'error' ? 'danger' : 'success'}`}>
            {notice.text}
          </div>
        )}

        {!activeApplication && (
          <div className="card space-y-3">
            <div className="section-title">Submit Application</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Tenant Type</label>
                <select
                  className="input"
                  value={form.tenantType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tenantType: event.target.value as CreateOnboardingApplicationInput['tenantType'] }))
                  }
                >
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="COMPANY">COMPANY</option>
                  <option value="STATE">STATE</option>
                  <option value="ORGANIZATION">ORGANIZATION</option>
                </select>
              </div>
              <div>
                <label className="form-label">CPO Type</label>
                <select
                  className="input"
                  value={form.cpoType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cpoType: event.target.value as CreateOnboardingApplicationInput['cpoType'] }))
                  }
                >
                  <option value="CHARGE">CHARGE</option>
                  <option value="SWAP">SWAP</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </div>
              <div>
                <label className="form-label">Organization / Applicant Name</label>
                <input
                  className="input"
                  value={form.organizationName}
                  onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Contact Person</label>
                <input
                  className="input"
                  value={form.contactPersonName}
                  onChange={(event) => setForm((current) => ({ ...current, contactPersonName: event.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Contact Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Contact Phone</label>
                <input
                  className="input"
                  value={form.contactPhone}
                  onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Physical Address</label>
                <input
                  className="input"
                  value={form.physicalAddress}
                  onChange={(event) => setForm((current) => ({ ...current, physicalAddress: event.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Preferred Subdomain</label>
                <input
                  className="input"
                  value={form.applicantPreferredSubdomain}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, applicantPreferredSubdomain: event.target.value }))
                  }
                  placeholder="example-tenant"
                />
              </div>
              <div>
                <label className="form-label">Preferred Primary Domain</label>
                <input
                  className="input"
                  value={form.applicantPreferredDomain}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, applicantPreferredDomain: event.target.value }))
                  }
                  placeholder="tenant.example.com"
                />
              </div>
            </div>
            <button
              className="btn primary"
              disabled={
                working ||
                !form.organizationName.trim() ||
                !form.contactPersonName.trim() ||
                !form.contactEmail.trim() ||
                !form.contactPhone.trim() ||
                !form.physicalAddress.trim()
              }
              onClick={() => void handleCreateApplication()}
            >
              {working ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        )}

        {activeApplication && (
          <>
            <div className="card">
              <div className="section-title">Application Timeline</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STAGE_ORDER.map((stage) => {
                  const reached =
                    STAGE_ORDER.indexOf(stage) <= STAGE_ORDER.indexOf(activeApplication.onboardingStage)
                  const isActive = activeApplication.onboardingStage === stage
                  return (
                    <span
                      key={stage}
                      className={`pill ${isActive ? 'active' : reached ? 'online' : 'pending'}`}
                    >
                      {STAGE_LABEL[stage]}
                    </span>
                  )
                })}
                {activeApplication.onboardingStage === 'REJECTED' && (
                  <span className="pill faulted">Rejected</span>
                )}
              </div>
              <div className="mt-3 text-xs text-subtle">
                Current stage: <span className="font-semibold text-[var(--text)]">{STAGE_LABEL[activeApplication.onboardingStage]}</span>
              </div>
            </div>

            {activeApplication.onboardingStage === 'APPROVED_PENDING_TIER' && (
              <div className="card space-y-3">
                <div className="section-title">Select Tier</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Tier</label>
                    <select
                      className="input"
                      value={selectedTier}
                      onChange={(event) => setSelectedTier(event.target.value as typeof selectedTier)}
                    >
                      {availableTiers.map((tier) => (
                        <option key={tier.tierCode} value={tier.tierCode}>
                          {tier.tierCode} - {tier.tierLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Billing Cycle</label>
                    <select
                      className="input"
                      value={selectedBillingCycle}
                      onChange={(event) => setSelectedBillingCycle(event.target.value as BillingCycle)}
                      disabled={Boolean(selectedTierConfig?.isCustomPricing)}
                    >
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="ANNUAL">ANNUAL</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={requestWhiteLabel}
                        disabled={!selectedTierConfig?.whiteLabelAvailable}
                        onChange={(event) => setRequestWhiteLabel(event.target.checked)}
                      />
                      Request white-label
                    </label>
                  </div>
                </div>
                <div className="text-xs text-subtle">
                  Selected CPO type for this application: <strong>{activeApplication.cpoType}</strong>
                </div>
                {tierPricingPreview && (
                  <div className="rounded border border-[color:var(--border)] p-3 text-sm space-y-1">
                    <div className="font-semibold">Pricing Preview ({tierPricingPreview.currency})</div>
                    <div>
                      Recurring: {tierPricingPreview.baseRecurring.toFixed(2)} base + {tierPricingPreview.recurringAddon.toFixed(2)} CPO add-on + {tierPricingPreview.whiteLabelRecurring.toFixed(2)} white-label = <strong>{tierPricingPreview.recurringTotal.toFixed(2)}</strong>
                    </div>
                    <div>
                      Setup: {tierPricingPreview.setupBase.toFixed(2)} base + {tierPricingPreview.setupAddon.toFixed(2)} CPO add-on + {tierPricingPreview.whiteLabelSetup.toFixed(2)} white-label = <strong>{tierPricingPreview.setupTotal.toFixed(2)}</strong>
                    </div>
                    <div>
                      Due now: <strong>{tierPricingPreview.dueNow.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
                <button className="btn primary" disabled={working} onClick={() => void handleConfirmTier()}>
                  {working ? 'Saving...' : 'Confirm Tier & Lock Price'}
                </button>
              </div>
            )}

            {activeApplication.onboardingStage === 'TIER_CONFIRMED_PENDING_PAYMENT' && (
              <div className="card space-y-3">
                <div className="section-title">Checkout</div>
                <div className="text-sm text-subtle">
                  Locked tier: <strong>{activeApplication.selectedTierCode}</strong>{' '}
                  {activeApplication.selectedBillingCycle ? `(${activeApplication.selectedBillingCycle})` : ''}
                </div>
                <div className="text-sm text-subtle">
                  CPO type: <strong>{activeApplication.pricingSnapshot?.cpoType || activeApplication.cpoType}</strong>
                </div>
                <div className="text-sm text-subtle">
                  Amount due now:{' '}
                  <strong>
                    {activeApplication.pricingSnapshot?.currency || 'USD'}{' '}
                    {(activeApplication.pricingSnapshot?.dueNowAmount || 0).toFixed(2)}
                  </strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn primary" disabled={working} onClick={() => void handleCreatePaymentIntent()}>
                    {working ? 'Processing...' : 'Create Checkout Intent'}
                  </button>
                  <button className="btn" disabled={working} onClick={() => void handleSyncPayment(false)}>
                    Refresh Payment Status
                  </button>
                  <button className="btn" disabled={working} onClick={() => void handleSyncPayment(true)}>
                    Mark Payment Settled
                  </button>
                </div>
                {activeApplication.paymentStatus && (
                  <div className="pill pending">Payment: {activeApplication.paymentStatus}</div>
                )}
              </div>
            )}

            {activeApplication.onboardingStage === 'QUOTE_PENDING' && (
              <div className="card space-y-3">
                <div className="section-title">Enterprise Quote Acceptance</div>
                <p className="text-sm text-subtle">
                  Tier T4 is custom-priced by agreement. Enter the quote or contract reference shared by EVzone.
                </p>
                <input
                  className="input"
                  value={quoteReference}
                  placeholder="Quote reference"
                  onChange={(event) => setQuoteReference(event.target.value)}
                />
                <button
                  className="btn primary"
                  disabled={working || !quoteReference.trim()}
                  onClick={() => void handleAcceptQuote()}
                >
                  {working ? 'Submitting...' : 'Accept Quote'}
                </button>
              </div>
            )}

            {(activeApplication.onboardingStage === 'PAYMENT_CONFIRMED_PENDING_ACTIVATION' ||
              activeApplication.onboardingStage === 'QUOTE_ACCEPTED_PENDING_ACTIVATION') && (
              <div className="card">
                <div className="section-title">Pending Activation</div>
                <p className="mt-2 text-sm text-subtle">
                  Your onboarding gates are complete. A platform super admin will provision and activate your tenant.
                </p>
              </div>
            )}

            {activeApplication.onboardingStage === 'COMPLETED' && (
              <div className="card">
                <div className="section-title">Tenant Activated</div>
                <p className="mt-2 text-sm text-subtle">
                  Provisioning completed on {new Date(activeApplication.provisionedAt || activeApplication.updatedAt).toLocaleString()}.
                </p>
                {activeApplication.provisionedOrganizationId && (
                  <div className="mt-3 pill online">
                    Organization ID: {activeApplication.provisionedOrganizationId}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
