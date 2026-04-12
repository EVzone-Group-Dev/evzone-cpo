import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WhiteLabelPage } from '@/pages/settings/WhiteLabelPage'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { useBranding } from '@/core/branding/useBranding'
import {
  fetchTenantBrandingState,
  listPlatformTenants,
  publishTenantBrandingDraft,
  rollbackTenantBranding,
  saveTenantBrandingDraft,
  uploadTenantBrandingAsset,
} from '@/core/api/tenantBranding'
import type { BrandingDraftResponse, WhiteLabelConfigV1 } from '@/core/types/branding'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/core/hooks/useTenant', () => ({
  useTenant: vi.fn(),
}))

vi.mock('@/core/branding/useBranding', () => ({
  useBranding: vi.fn(),
}))

vi.mock('@/core/api/tenantBranding', () => ({
  fetchTenantBrandingState: vi.fn(),
  listPlatformTenants: vi.fn(),
  publishTenantBrandingDraft: vi.fn(),
  rollbackTenantBranding: vi.fn(),
  saveTenantBrandingDraft: vi.fn(),
  uploadTenantBrandingAsset: vi.fn(),
}))

function createBrandingConfig(): WhiteLabelConfigV1 {
  return {
    schemaVersion: 1,
    branding: {
      appName: 'Acme CPO Central',
      shortName: 'Acme',
      logoUrl: null,
      logoIconUrl: null,
      faviconUrl: null,
    },
    theme: {
      primaryColor: '#14C78B',
      accentColor: '#0EA672',
      borderRadiusPx: 8,
      fontFamily: 'Inter',
    },
    legal: {
      termsUrl: null,
      privacyUrl: null,
      supportUrl: null,
    },
    support: {
      email: 'ops@acme.test',
      phone: null,
    },
    domain: {
      primaryDomain: 'portal.acme.com',
      allowedOrigins: ['https://portal.acme.com'],
    },
    metadata: {
      lastEditedBy: 'user-1',
      lastEditedAt: new Date().toISOString(),
    },
  }
}

function createBrandingState(config: WhiteLabelConfigV1): BrandingDraftResponse {
  return {
    tenantId: 'tenant-1',
    tenantName: 'Acme Charge',
    activeConfig: config,
    draft: {
      id: 'draft-1',
      version: 2,
      config,
      createdAt: new Date('2026-04-12T09:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-04-12T10:00:00.000Z').toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
    },
    revisions: [
      {
        id: 'rev-2',
        version: 2,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-04-12T08:00:00.000Z').toISOString(),
        rolledBackFromVersion: null,
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: new Date('2026-04-12T08:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-12T08:00:00.000Z').toISOString(),
      },
    ],
  }
}

describe('WhiteLabelPage', () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedUseTenant = vi.mocked(useTenant)
  const mockedUseBranding = vi.mocked(useBranding)
  const mockedFetchTenantBrandingState = vi.mocked(fetchTenantBrandingState)
  const mockedListPlatformTenants = vi.mocked(listPlatformTenants)
  const mockedSaveTenantBrandingDraft = vi.mocked(saveTenantBrandingDraft)

  beforeEach(() => {
    vi.clearAllMocks()

    const config = createBrandingConfig()
    const state = createBrandingState(config)

    mockedUseAuthStore.mockReturnValue({
      user: {
        id: 'user-1',
        role: 'CPO_ADMIN',
        accessProfile: {
          permissions: ['tenant.branding.write'],
        },
      },
    } as unknown as ReturnType<typeof useAuthStore>)

    mockedUseTenant.mockReturnValue({
      activeTenant: {
        id: 'tenant-1',
        name: 'Acme Charge',
      },
    } as unknown as ReturnType<typeof useTenant>)

    mockedUseBranding.mockReturnValue({
      branding: config,
      refreshBranding: vi.fn(),
    } as unknown as ReturnType<typeof useBranding>)

    mockedFetchTenantBrandingState.mockResolvedValue(state)
    mockedSaveTenantBrandingDraft.mockResolvedValue(state)
    vi.mocked(publishTenantBrandingDraft).mockResolvedValue(state)
    vi.mocked(rollbackTenantBranding).mockResolvedValue(state)
    vi.mocked(uploadTenantBrandingAsset).mockResolvedValue({
      assetKind: 'logo',
      assetUrl: 'https://cdn.acme.test/logo.png',
      source: 'url',
      mimeType: null,
      sizeBytes: null,
      uploadedAt: new Date().toISOString(),
    })
    mockedListPlatformTenants.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'Acme Charge',
      },
    ])
  })

  it('loads draft state, tracks unsaved edits, and saves draft', async () => {
    render(<WhiteLabelPage />)

    await waitFor(() => {
      expect(mockedFetchTenantBrandingState).toHaveBeenCalledWith({ tenantId: null })
    })

    const appNameInput = await screen.findByDisplayValue('Acme CPO Central')
    fireEvent.change(appNameInput, { target: { value: 'Acme Prime CPO' } })

    expect(await screen.findByText('You have unsaved branding changes.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Save Draft/i }))

    await waitFor(() => {
      expect(mockedSaveTenantBrandingDraft).toHaveBeenCalled()
    })
  })

  it('shows platform tenant selector and fetches selected tenant branding', async () => {
    mockedUseAuthStore.mockReturnValue({
      user: {
        id: 'admin-1',
        role: 'SUPER_ADMIN',
        accessProfile: {
          permissions: ['platform.tenants.read', 'platform.tenants.write'],
        },
      },
    } as unknown as ReturnType<typeof useAuthStore>)

    mockedListPlatformTenants.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Charge' },
      { id: 'tenant-2', name: 'Beta Charge' },
    ])

    render(<WhiteLabelPage />)

    await waitFor(() => {
      expect(mockedListPlatformTenants).toHaveBeenCalled()
    })

    const tenantSelect = await screen.findByDisplayValue('Acme Charge')
    fireEvent.change(tenantSelect, { target: { value: 'tenant-2' } })

    await waitFor(() => {
      expect(mockedFetchTenantBrandingState).toHaveBeenCalledWith({ tenantId: 'tenant-2' })
    })
  })
})
