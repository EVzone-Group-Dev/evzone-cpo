import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fetchJson } from '@/core/api/fetchJson'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useAuthStore } from '@/core/auth/authStore'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'
import { useTenant } from '@/core/hooks/useTenant'
import { clearSettingsDraft, loadSettingsDraft } from '@/core/settings/settingsPreferences'
import { useTheme } from '@/core/theme/themeContext'
import { theme } from '@/core/theme/theme'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/api/fetchJson', () => ({
  fetchJson: vi.fn(),
}))

vi.mock('@/core/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/core/hooks/useTenant', () => ({
  useTenant: vi.fn(),
}))

vi.mock('@/core/hooks/useGeography', () => ({
  useReferenceStates: vi.fn(),
  useReferenceCities: vi.fn(),
}))

vi.mock('@/core/theme/themeContext', () => ({
  useTheme: vi.fn(),
}))

const translationMap: Record<string, string> = {
  'settings.workspaceSettings': 'Workspace Settings',
  'settings.workspaceDescription': 'Configure workspace identity and controls.',
  'settings.profile': 'Profile & Identity',
  'settings.security': 'Security & Access',
  'settings.notifications': 'Notification Controls',
  'settings.interface': 'Interface',
  'settings.provisioning': 'Provisioning',
  'settings.scope': 'Tenant Scope',
  'settings.health': 'Health',
  'settings.policy': 'Policy',
  'settings.role': 'Role',
  'settings.tenant': 'Tenant',
  'settings.scopeType': 'Scope Type',
  'settings.displayName': 'Display Name',
  'settings.workEmail': 'Work Email',
  'settings.theme': 'Theme',
  'settings.screenDensity': 'Screen Density',
  'settings.language': 'Language',
  'settings.country': 'Country',
  'settings.state': 'State / Province',
  'settings.city': 'City',
  'settings.mfa': 'Multi-factor authentication',
  'common.save': 'Save changes',
  'common.saved': 'All changes saved',
  'common.saving': 'Saving changes...',
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { time?: string }) =>
      key === 'settings.lastSaved'
        ? `Last saved ${options?.time ?? ''}`.trim()
        : (translationMap[key] ?? key),
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}))

describe('SettingsPage', () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedFetchJson = vi.mocked(fetchJson)
  const mockedUseReferenceCities = vi.mocked(useReferenceCities)
  const mockedUseReferenceStates = vi.mocked(useReferenceStates)
  const mockedUseTenant = vi.mocked(useTenant)
  const mockedUseTheme = vi.mocked(useTheme)
  let replaceUser: ReturnType<typeof vi.fn>

  function renderPage() {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    clearSettingsDraft('usr-1')
    replaceUser = vi.fn()

    mockedUseAuthStore.mockReturnValue({
        user: {
          id: 'usr-1',
          name: 'Station Manager',
          email: 'stationmanager@evzone.io',
          role: 'STATION_MANAGER',
          status: 'Active',
          tenantId: 'org-evzone-ke',
          assignedStationIds: ['st-1', 'st-2', 'st-3'],
          createdAt: '2026-01-01 09:00',
          mfaEnabled: true,
        },
        replaceUser,
      } as unknown as ReturnType<typeof useAuthStore>)

    mockedFetchJson.mockResolvedValue({
      id: 'usr-1',
      name: 'Olimi Brave',
      email: 'stationmanager@evzone.io',
      role: 'STATION_MANAGER',
      status: 'Active',
      tenantId: 'org-evzone-ke',
      country: 'Kenya',
      mfaEnabled: true,
    } as AuthenticatedApiUser)

    mockedUseTenant.mockReturnValue({
      activeTenant: {
        id: 'tenant-evzone-ke',
        code: 'EVZKE',
        slug: 'evzone-ke',
        name: 'EVzone Kenya',
        description: 'Kenya operating company',
        scope: 'tenant',
        scopeLabel: 'Operating Company',
        region: 'Kenya',
        timeZone: 'Africa/Nairobi',
        currency: 'KES',
        siteCount: 12,
        stationCount: 38,
        chargePointCount: 124,
      },
      availableTenants: [
        {
          id: 'tenant-evzone-ke',
          code: 'EVZKE',
          slug: 'evzone-ke',
          name: 'EVzone Kenya',
          description: 'Kenya operating company',
          scope: 'tenant',
          scopeLabel: 'Operating Company',
          region: 'Kenya',
          timeZone: 'Africa/Nairobi',
          currency: 'KES',
          siteCount: 12,
          stationCount: 38,
          chargePointCount: 124,
        },
      ],
      activeStationContext: null,
      activeScopeKey: 'tenant-evzone-ke:all',
      availableStationContexts: [],
      dataScopeLabel: 'Operating company scope for EVzone Kenya public infrastructure.',
      activeTenantId: 'tenant-evzone-ke',
      dashboardMode: 'operations',
      canSwitchStationContexts: false,
      canSwitchTenants: true,
      setActiveStationContextId: vi.fn(),
      setActiveTenantId: vi.fn(),
      isLoading: false,
      isReady: true,
      availableCountries: [
        {
          code2: 'KE',
          code3: 'KEN',
          name: 'Kenya',
          officialName: 'Republic of Kenya',
          flagUrl: null,
          currencyCode: 'KES',
          currencyName: 'Kenyan shilling',
          currencySymbol: 'KES',
          languages: ['English', 'Swahili'],
        },
        {
          code2: 'UG',
          code3: 'UGA',
          name: 'Uganda',
          officialName: 'Republic of Uganda',
          flagUrl: null,
          currencyCode: 'UGX',
          currencyName: 'Ugandan shilling',
          currencySymbol: 'UGX',
          languages: ['English'],
        },
      ],
      availableCurrencies: ['KES', 'UGX'],
      availableLanguages: ['English', 'Swahili'],
    })

    mockedUseReferenceStates.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useReferenceStates>)

    mockedUseReferenceCities.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useReferenceCities>)

    mockedUseTheme.mockReturnValue({
      theme,
      themeMode: 'system',
      resolvedTheme: 'dark',
      isDark: true,
      isLight: false,
      setThemeMode: vi.fn(),
      toggleTheme: vi.fn(),
    } as unknown as ReturnType<typeof useTheme>)
  })

  it('renders premium settings sections and save flow', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile & Identity')).toBeInTheDocument()
    expect(screen.getByText('Security & Access')).toBeInTheDocument()
    expect(screen.getByText('Notification Controls')).toBeInTheDocument()
    expect(screen.getByLabelText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Tenant Scope')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All changes saved' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Ops Controller' } })

    const saveButton = screen.getByRole('button', { name: 'Save changes' })
    expect(saveButton).toBeEnabled()

    fireEvent.click(saveButton)
    await waitFor(() => expect(replaceUser).toHaveBeenCalled())
    expect(mockedFetchJson).toHaveBeenCalledWith(
      '/api/v1/users/me',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Ops Controller',
          country: 'Kenya',
        }),
      }),
    )
    expect(replaceUser).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Olimi Brave',
    }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'All changes saved' })).toBeDisabled())
  })

  it('loads tenant provisioning states and cities from geography references', async () => {
    mockedUseReferenceStates.mockImplementation((countryCode?: string | null) => ({
      data:
        countryCode === 'KE'
          ? [
              { countryCode: 'KE', code: 'NA', name: 'Nairobi County' },
              { countryCode: 'KE', code: 'MU', name: 'Mombasa County' },
            ]
          : [],
      isLoading: false,
    }) as unknown as ReturnType<typeof useReferenceStates>)

    mockedUseReferenceCities.mockImplementation((countryCode?: string | null, stateCode?: string | null) => ({
      data:
        countryCode === 'KE' && stateCode === 'NA'
          ? [
              { countryCode: 'KE', stateCode: 'NA', name: 'Nairobi' },
              { countryCode: 'KE', stateCode: 'NA', name: 'Westlands' },
            ]
          : [],
      isLoading: false,
    }) as unknown as ReturnType<typeof useReferenceCities>)

    renderPage()

    const countrySelect = screen.getByLabelText('Country')
    fireEvent.change(countrySelect, { target: { value: 'KE' } })

    await waitFor(() => {
      const stateSelect = screen.getByLabelText('State / Province') as HTMLSelectElement
      expect(stateSelect.tagName).toBe('SELECT')
      expect(screen.getByRole('option', { name: 'Nairobi County' })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('State / Province'), { target: { value: 'NA' } })

    await waitFor(() => {
      const citySelect = screen.getByLabelText('City') as HTMLSelectElement
      expect(citySelect.tagName).toBe('SELECT')
      expect(screen.getByRole('option', { name: 'Nairobi' })).toBeInTheDocument()
      expect(citySelect).toHaveValue('')
    })

    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Nairobi' } })
    expect(screen.getByLabelText('City')).toHaveValue('Nairobi')

    await waitFor(() => {
      const lastStateCall = mockedUseReferenceStates.mock.calls.at(-1)
      const lastCityCall = mockedUseReferenceCities.mock.calls.at(-1)
      expect(lastStateCall?.[0]).toBe('KE')
      expect(lastCityCall?.[0]).toBe('KE')
      expect(lastCityCall?.[1]).toBe('NA')
    })
  })

  it('persists MFA requirement changes to backend policy endpoint', async () => {
    renderPage()

    const mfaSwitch = screen.getByRole('switch', { name: 'Multi-factor authentication' })
    fireEvent.click(mfaSwitch)

    const saveButton = screen.getByRole('button', { name: 'Save changes' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockedFetchJson).toHaveBeenCalledWith(
        '/api/v1/users/usr-1/mfa-requirement',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            required: false,
          }),
        }),
      )
    })

    expect(replaceUser).toHaveBeenCalledWith(
      expect.objectContaining({
        mfaEnabled: false,
        mfaRequired: false,
      }),
    )
  })

  it('restores saved language and country selections after reload', async () => {
    const { unmount } = render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'Swahili' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'UG' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(replaceUser).toHaveBeenCalled())

    const storedDraft = loadSettingsDraft('usr-1')
    expect(storedDraft?.language).toBe('Swahili')
    expect(storedDraft?.tenantCountryCode).toBe('UG')

    unmount()
    renderPage()

    expect(screen.getByLabelText('Language')).toHaveValue('Swahili')
    expect(screen.getByLabelText('Country')).toHaveValue('UG')
  })
})
