import { useContext } from 'react'
import { BrandingContext } from '@/core/branding/brandingContext'

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider.')
  }

  return context
}
