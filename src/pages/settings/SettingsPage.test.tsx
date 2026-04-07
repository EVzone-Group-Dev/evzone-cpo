import type { ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useAuthStore } from '@/core/auth/authStore'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'
import { useTenant } from '@/core/hooks/useTenant'
import { useTheme } from '@/core/theme/themeContext'
import { theme } from '@/core/theme/theme'

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

vi.mock('@/core/hooks/useGeography', () => ({
  useReferenceStates: vi.fn(),
  useReferenceCities: vi.fn(),
}))

vi.mock('@/core/theme/themeContext', () => ({
  useTheme: vi.fn(),
}))

describe('SettingsPage', () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore)
  const mockedUseReferenceCities = vi.mocked(useReferenceCities)
  const mockedUseReferenceStates = vi.mocked(useReferenceStates)
  const mockedUseTenant = vi.mocked(useTenant)
  const mockedUseTheme = vi.mocked(useTheme)

  beforeEach(() => {
    vi.useFakeTimers()

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
      } as unknown as ReturnType<typeof useAuthStore>)

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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders premium settings sections and save flow', () => {
    render(<SettingsPage />)

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
    expect(screen.getByRole('button', { name: 'Saving changes...' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(screen.getByRole('button', { name: 'All changes saved' })).toBeDisabled()
  })

  it('loads tenant provisioning states and cities from geography references', async () => {
    vi.useRealTimers()

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

    render(<SettingsPage />)

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
})
