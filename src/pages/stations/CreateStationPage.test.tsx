import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CreateStationPage } from '@/pages/stations/CreateStationPage'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'
import { useTenant } from '@/core/hooks/useTenant'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@/core/hooks/useTenant', () => ({
  useTenant: vi.fn(),
}))

vi.mock('@/core/hooks/useGeography', () => ({
  useReferenceStates: vi.fn(),
  useReferenceCities: vi.fn(),
}))

describe('CreateStationPage', () => {
  const mockedUseReferenceCities = vi.mocked(useReferenceCities)
  const mockedUseReferenceStates = vi.mocked(useReferenceStates)
  const mockedUseTenant = vi.mocked(useTenant)

  beforeEach(() => {
    mockNavigate.mockReset()

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
      activeTenantId: 'tenant-evzone-ke',
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
    } as unknown as ReturnType<typeof useTenant>)

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
  })

  function renderPage() {
    render(
      <MemoryRouter>
        <CreateStationPage />
      </MemoryRouter>,
    )
  }

  function getSelectContainingOption(optionLabel: string): HTMLSelectElement {
    const matched = screen.getAllByRole('combobox').find((element) =>
      Array.from((element as HTMLSelectElement).options).some(
        (option) => option.textContent?.trim() === optionLabel,
      ),
    )

    if (!matched) {
      throw new Error(`Unable to find select containing option "${optionLabel}"`)
    }

    return matched as HTMLSelectElement
  }

  it('uses geography reference states and cities when available', async () => {
    renderPage()

    const countrySelect = getSelectContainingOption('Select country')
    expect(countrySelect.value).toBe('KE')

    await waitFor(() => {
      const stateSelect = getSelectContainingOption('Select state')
      expect(stateSelect.tagName).toBe('SELECT')
      expect(screen.getByRole('option', { name: 'Nairobi County' })).toBeInTheDocument()
    })

    fireEvent.change(getSelectContainingOption('Select state'), { target: { value: 'NA' } })

    await waitFor(() => {
      const citySelect = getSelectContainingOption('Select city')
      expect(citySelect.tagName).toBe('SELECT')
      expect(screen.getByRole('option', { name: 'Nairobi' })).toBeInTheDocument()
    })

    const citySelect = getSelectContainingOption('Select city')
    fireEvent.change(citySelect, { target: { value: 'Nairobi' } })
    expect(citySelect).toHaveValue('Nairobi')

    const lastCityCall = mockedUseReferenceCities.mock.calls.at(-1)
    expect(lastCityCall?.[0]).toBe('KE')
    expect(lastCityCall?.[1]).toBe('NA')
  }, 15000)

  it('falls back to text state and city fields when references are unavailable', async () => {
    renderPage()

    fireEvent.change(getSelectContainingOption('Select country'), { target: { value: 'UG' } })

    await waitFor(() => {
      const stateInput = screen.getByPlaceholderText('Type state/province') as HTMLInputElement
      const cityInput = screen.getByPlaceholderText('Enter city') as HTMLInputElement
      expect(stateInput.value).toBe('')
      expect(cityInput.value).toBe('')
    })
  })
})
