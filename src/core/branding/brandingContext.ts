import { createContext } from 'react'
import type { BrandingRuntimeResponse, WhiteLabelConfigV1 } from '@/core/types/branding'

export type BrandingContextValue = {
  branding: WhiteLabelConfigV1
  runtimeBranding: BrandingRuntimeResponse
  isBootstrapping: boolean
  lastError: string | null
  refreshBranding: () => Promise<void>
}

export const BrandingContext = createContext<BrandingContextValue | null>(null)
