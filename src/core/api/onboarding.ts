import { fetchJson } from '@/core/api/fetchJson'

export type TenantAccountType = 'INDIVIDUAL' | 'COMPANY' | 'STATE' | 'ORGANIZATION'
export type TenantOnboardingStage =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED_PENDING_TIER'
  | 'REJECTED'
  | 'TIER_CONFIRMED_PENDING_PAYMENT'
  | 'QUOTE_PENDING'
  | 'PAYMENT_CONFIRMED_PENDING_ACTIVATION'
  | 'QUOTE_ACCEPTED_PENDING_ACTIVATION'
  | 'COMPLETED'
export type TierCode = 'T1' | 'T2' | 'T3' | 'T4'
export type BillingCycle = 'MONTHLY' | 'ANNUAL'

export interface TenantOnboardingApplication {
  id: string
  applicantId: string
  tenantType: TenantAccountType
  organizationName: string
  businessRegistrationNumber: string | null
  taxComplianceNumber: string | null
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  companyWebsite: string | null
  yearsInEVBusiness: string | null
  existingStationsOperated: number | null
  preferredLeaseModel: string | null
  businessPlanSummary: string | null
  sustainabilityCommitments: string | null
  additionalServices: string[]
  estimatedStartDate: string | null
  message: string | null
  applicantPreferredSubdomain: string | null
  applicantPreferredDomain: string | null
  confirmedSubdomain: string | null
  confirmedDomain: string | null
  onboardingStage: TenantOnboardingStage
  status: string
  selectedTierCode: TierCode | null
  selectedPricingVersion: number | null
  selectedBillingCycle: BillingCycle | null
  pricingSnapshot: PricingSnapshot | null
  tierConfirmedAt: string | null
  paymentIntentId: string | null
  paymentStatus: string | null
  paymentSettledAt: string | null
  enterpriseQuoteStatus: string | null
  enterpriseQuoteReference: string | null
  enterpriseContractSignedAt: string | null
  reviewerCanonicalRoleKey: string | null
  approvedAt: string | null
  rejectedAt: string | null
  provisionedOrganizationId: string | null
  provisionedAt: string | null
  activatedBy: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PricingSnapshot {
  tierCode: string
  tierLabel: string
  pricingVersion: number
  currency: string
  billingCycle: string | null
  isCustomPricing: boolean
  recurringAmount: number | null
  setupFee: number | null
  whiteLabelRequested: boolean
  whiteLabelMonthlyAddon: number | null
  whiteLabelSetupFee: number | null
  dueNowAmount: number | null
  publishedAt: string | null
  effectiveFrom: string | null
}

export interface ApplicantTierPricing {
  tierCode: TierCode
  tierLabel: string
  deploymentModel: string
  accountTypes: TenantAccountType[]
  currency: string
  isCustomPricing: boolean
  monthlyPrice: number | null
  annualPrice: number | null
  setupFee: number | null
  whiteLabelAvailable: boolean
  whiteLabelMonthlyAddon: number | null
  whiteLabelSetupFee: number | null
  version: number
  effectiveFrom: string | null
  publishedAt: string | null
}

export interface TenantScopedCanonicalRole {
  key: string
  label: string
  description: string
  family: string
  scopeType: string
}

export interface CreateOnboardingApplicationInput {
  tenantType: TenantAccountType
  organizationName: string
  businessRegistrationNumber?: string
  taxComplianceNumber?: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  companyWebsite?: string
  yearsInEVBusiness?: string
  existingStationsOperated?: number
  preferredLeaseModel?: string
  businessPlanSummary?: string
  sustainabilityCommitments?: string
  additionalServices?: string[]
  estimatedStartDate?: string
  message?: string
  applicantPreferredSubdomain?: string
  applicantPreferredDomain?: string
}

export interface ReviewOnboardingApplicationInput {
  action: 'UNDER_REVIEW' | 'APPROVE' | 'REJECT'
  notes?: string
  rejectionReason?: string
  confirmedSubdomain?: string
  confirmedDomain?: string
  canonicalRoleKey?: string
}

export interface ConfirmTierInput {
  tierCode: TierCode
  billingCycle?: BillingCycle
  requestWhiteLabel?: boolean
}

export interface ApplicationPaymentIntentInput {
  idempotencyKey?: string
  correlationId?: string
  ttlMinutes?: number
}

export interface SyncApplicationPaymentInput {
  paymentIntentId?: string
  status?: string
  providerReference?: string
  note?: string
  markSettled?: boolean
}

export interface AcceptEnterpriseQuoteInput {
  quoteReference: string
  note?: string
}

export interface ActivateApplicationInput {
  canonicalRoleKey?: string
  confirmedSubdomain?: string
  confirmedDomain?: string
}

type PaymentIntentSummary = {
  id: string
  status: string
  amount: number
  currency: string
  checkoutUrl: string | null
  checkoutQrPayload: string | null
  providerReference: string | null
  settledAt: string | null
}

type PaymentResult = {
  application: TenantOnboardingApplication
  paymentIntent: PaymentIntentSummary
}

export function listMyOnboardingApplications() {
  return fetchJson<TenantOnboardingApplication[]>('/api/v1/applications/me')
}

export function createOnboardingApplication(input: CreateOnboardingApplicationInput) {
  return fetchJson<TenantOnboardingApplication>('/api/v1/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateOnboardingApplication(
  id: string,
  input: Partial<CreateOnboardingApplicationInput>,
) {
  return fetchJson<TenantOnboardingApplication>(`/api/v1/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getOnboardingApplication(id: string) {
  return fetchJson<TenantOnboardingApplication>(`/api/v1/applications/${id}`)
}

export function listOnboardingApplicationsForAdmin(filters?: {
  onboardingStage?: string
  status?: string
  applicantId?: string
}) {
  const query = new URLSearchParams()
  if (filters?.onboardingStage) query.set('onboardingStage', filters.onboardingStage)
  if (filters?.status) query.set('status', filters.status)
  if (filters?.applicantId) query.set('applicantId', filters.applicantId)
  const queryString = query.toString()
  return fetchJson<TenantOnboardingApplication[]>(
    `/api/v1/applications${queryString ? `?${queryString}` : ''}`,
  )
}

export function reviewOnboardingApplication(
  id: string,
  input: ReviewOnboardingApplicationInput,
) {
  return fetchJson<TenantOnboardingApplication>(`/api/v1/applications/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listApplicantTierPricing() {
  return fetchJson<ApplicantTierPricing[]>('/api/v1/applications/onboarding/tiers')
}

export function listTenantScopedCanonicalRoles() {
  return fetchJson<TenantScopedCanonicalRole[]>(
    '/api/v1/applications/onboarding/canonical-roles',
  )
}

export function confirmOnboardingTier(id: string, input: ConfirmTierInput) {
  return fetchJson<TenantOnboardingApplication>(
    `/api/v1/applications/${id}/tier-confirmation`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export function createOnboardingPaymentIntent(
  id: string,
  input: ApplicationPaymentIntentInput,
) {
  return fetchJson<PaymentResult>(`/api/v1/applications/${id}/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function syncOnboardingPaymentIntent(
  id: string,
  input: SyncApplicationPaymentInput,
) {
  return fetchJson<PaymentResult>(`/api/v1/applications/${id}/payment-intent/sync`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function acceptEnterpriseQuote(
  id: string,
  input: AcceptEnterpriseQuoteInput,
) {
  return fetchJson<TenantOnboardingApplication>(`/api/v1/applications/${id}/quote/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function activateOnboardingApplication(
  id: string,
  input: ActivateApplicationInput,
) {
  return fetchJson<TenantOnboardingApplication>(`/api/v1/applications/${id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
