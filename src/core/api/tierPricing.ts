import { fetchJson } from '@/core/api/fetchJson'

export type TierCode = 'T1' | 'T2' | 'T3' | 'T4'

export type DeploymentModel = 'SHARED_SCHEMA' | 'DEDICATED_DB'

export type AccountType = 'INDIVIDUAL' | 'COMPANY' | 'STATE' | 'ORGANIZATION'

export interface TierPricingVersion {
  id: string
  tierCode: TierCode
  tierLabel: string
  deploymentModel: DeploymentModel
  accountTypes: AccountType[]
  currency: string
  isCustomPricing: boolean
  monthlyPrice: number | null
  annualPrice: number | null
  setupFee: number | null
  swapMonthlyAddon: number | null
  swapAnnualAddon: number | null
  swapSetupAddon: number | null
  hybridMonthlyAddon: number | null
  hybridAnnualAddon: number | null
  hybridSetupAddon: number | null
  whiteLabelAvailable: boolean
  whiteLabelMonthlyAddon: number | null
  whiteLabelSetupFee: number | null
  status: string
  version: number
  notes: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  createdBy: string | null
  publishedBy: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TierPricingGroup {
  tierCode: TierCode
  current: TierPricingVersion | null
  versions: TierPricingVersion[]
}

export interface CreateTierPricingDraftInput {
  tierLabel?: string
  deploymentModel?: DeploymentModel
  accountTypes?: AccountType[]
  currency?: string
  isCustomPricing?: boolean
  monthlyPrice?: number | null
  annualPrice?: number | null
  setupFee?: number | null
  swapMonthlyAddon?: number | null
  swapAnnualAddon?: number | null
  swapSetupAddon?: number | null
  hybridMonthlyAddon?: number | null
  hybridAnnualAddon?: number | null
  hybridSetupAddon?: number | null
  whiteLabelAvailable?: boolean
  whiteLabelMonthlyAddon?: number | null
  whiteLabelSetupFee?: number | null
  notes?: string
}

export async function listTierPricing(includeHistory = true): Promise<TierPricingGroup[]> {
  return fetchJson<TierPricingGroup[]>(
    `/api/v1/platform/tier-pricing?includeHistory=${includeHistory ? 'true' : 'false'}`,
  )
}

export async function createTierPricingDraft(
  tierCode: TierCode,
  input: CreateTierPricingDraftInput,
): Promise<TierPricingVersion> {
  return fetchJson<TierPricingVersion>(`/api/v1/platform/tier-pricing/${tierCode}/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function publishTierPricingVersion(
  tierCode: TierCode,
  version: number,
): Promise<TierPricingVersion> {
  return fetchJson<TierPricingVersion>(`/api/v1/platform/tier-pricing/${tierCode}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version }),
  })
}
