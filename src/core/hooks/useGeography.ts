import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import type { GeographyCityReference, GeographyCountryReference, GeographyStateReference } from '@/core/types/mockApi'

function normalizeCountryCode(countryCode?: string | null) {
  const normalized = countryCode?.trim().toUpperCase()
  return normalized && normalized.length > 0 ? normalized : null
}

function normalizeStateCode(stateCode?: string | null) {
  const normalized = stateCode?.trim().toUpperCase()
  return normalized && normalized.length > 0 ? normalized : null
}

export function useReferenceCountries(enabled = true) {
  return useQuery<GeographyCountryReference[]>({
    queryKey: ['geography', 'reference', 'countries'],
    queryFn: async () => {
      try {
        return await fetchJson<GeographyCountryReference[]>('/api/v1/geography/reference/countries')
      } catch {
        return []
      }
    },
    enabled,
    staleTime: 21_600_000,
  })
}

export function useReferenceStates(countryCode?: string | null, enabled = true) {
  const normalizedCountryCode = normalizeCountryCode(countryCode)

  return useQuery<GeographyStateReference[]>({
    queryKey: ['geography', 'reference', 'states', normalizedCountryCode],
    queryFn: async () => {
      if (!normalizedCountryCode) {
        return []
      }

      try {
        return await fetchJson<GeographyStateReference[]>(
          `/api/v1/geography/reference/countries/${encodeURIComponent(normalizedCountryCode)}/states`,
        )
      } catch {
        return []
      }
    },
    enabled: enabled && Boolean(normalizedCountryCode),
    staleTime: 21_600_000,
  })
}

export function useReferenceCities(
  countryCode?: string | null,
  stateCode?: string | null,
  enabled = true,
) {
  const normalizedCountryCode = normalizeCountryCode(countryCode)
  const normalizedStateCode = normalizeStateCode(stateCode)

  return useQuery<GeographyCityReference[]>({
    queryKey: ['geography', 'reference', 'cities', normalizedCountryCode, normalizedStateCode],
    queryFn: async () => {
      if (!normalizedCountryCode || !normalizedStateCode) {
        return []
      }

      try {
        return await fetchJson<GeographyCityReference[]>(
          `/api/v1/geography/reference/countries/${encodeURIComponent(normalizedCountryCode)}/states/${encodeURIComponent(normalizedStateCode)}/cities`,
        )
      } catch {
        return []
      }
    },
    enabled: enabled && Boolean(normalizedCountryCode) && Boolean(normalizedStateCode),
    staleTime: 21_600_000,
  })
}

