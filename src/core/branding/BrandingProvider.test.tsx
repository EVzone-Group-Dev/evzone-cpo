import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrandingProvider } from '@/core/branding/BrandingProvider'
import { useBranding } from '@/core/branding/useBranding'
import { fetchRuntimeBranding } from '@/core/api/tenantBranding'

vi.mock('@/core/api/tenantBranding', () => ({
  fetchRuntimeBranding: vi.fn(),
}))

function BrandingConsumer() {
  const { branding } = useBranding()
  return <div>{branding.branding.shortName}</div>
}

describe('BrandingProvider', () => {
  const mockedFetchRuntimeBranding = vi.mocked(fetchRuntimeBranding)

  beforeEach(() => {
    vi.clearAllMocks()
    document.title = 'Initial Title'
    document.documentElement.style.removeProperty('--accent')
  })

  it('bootstraps runtime branding and applies document styles', async () => {
    mockedFetchRuntimeBranding.mockResolvedValue({
      tenantId: 'tenant-acme',
      tenantName: 'Acme Charge',
      resolvedBy: 'host_subdomain',
      config: {
        schemaVersion: 1,
        branding: {
          appName: 'Acme CPO Central',
          shortName: 'Acme',
          logoUrl: null,
          logoIconUrl: null,
          faviconUrl: null,
        },
        theme: {
          primaryColor: '#FF6600',
          accentColor: '#CC5500',
          borderRadiusPx: 14,
          fontFamily: 'Roboto',
        },
        legal: {
          termsUrl: null,
          privacyUrl: null,
          supportUrl: null,
        },
        support: {
          email: null,
          phone: null,
        },
        domain: {
          primaryDomain: null,
          allowedOrigins: [],
        },
        metadata: {
          lastEditedBy: 'tester',
          lastEditedAt: new Date().toISOString(),
        },
      },
    })

    render(
      <BrandingProvider>
        <BrandingConsumer />
      </BrandingProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(document.title).toBe('Acme CPO Central')
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe(
        '#FF6600',
      )
      expect(document.documentElement.style.getPropertyValue('--brand-radius')).toBe(
        '14px',
      )
    })
  })

  it('falls back safely when runtime branding fetch fails', async () => {
    mockedFetchRuntimeBranding.mockRejectedValue(new Error('Network unavailable'))

    render(
      <BrandingProvider>
        <BrandingConsumer />
      </BrandingProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('EVzone')).toBeInTheDocument()
    })

    expect(document.title).toBe('EVzone CPO Central')
  })
})
