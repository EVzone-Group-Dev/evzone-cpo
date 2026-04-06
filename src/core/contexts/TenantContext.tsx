import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'
import { TenantContext } from '@/core/contexts/tenantSessionContext'
import type { TenantContextType } from '@/core/contexts/tenantSessionContext'
import type { AccessScopeType, CPOUser, OrganizationMembershipSummary, StationContextSummary } from '@/core/types/domain'
import type { AuthenticatedApiUser, GeographyCountryReference, LoginResponse, TenantContextResponse, TenantSummary } from '@/core/types/mockApi'

type BackendTenantRecord = {
  id: string
  name?: string
  code?: string
  currency?: string
  description?: string
  region?: string
  scope?: 'platform' | 'tenant' | 'site'
  scopeLabel?: string
  slug?: string
  timeZone?: string
  stationCount?: number
  siteCount?: number
}

const DEFAULT_CURRENCY = 'USD'
const DEFAULT_LANGUAGE = 'English'
const DEFAULT_TIME_ZONE = 'UTC'
const EMPTY_STATION_CONTEXTS: StationContextSummary[] = []

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function resolveBrowserTimeZone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return normalizeNonEmptyString(resolved) ?? DEFAULT_TIME_ZONE
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

function normalizeCurrencyCode(value: unknown, fallback = DEFAULT_CURRENCY): string {
  const normalized = normalizeNonEmptyString(value)
  if (!normalized) {
    return fallback
  }

  return normalized.toUpperCase()
}

function normalizeTimeZone(value: unknown, fallback = DEFAULT_TIME_ZONE): string {
  return normalizeNonEmptyString(value) ?? fallback
}

function readUserCountry(user: CPOUser | null): string | null {
  if (!user) {
    return null
  }

  return normalizeNonEmptyString((user as unknown as Record<string, unknown>).country)
}

function readUserTimeZone(user: CPOUser | null): string | null {
  if (!user) {
    return null
  }

  const raw = user as unknown as Record<string, unknown>
  return normalizeNonEmptyString(raw.timeZone) ?? normalizeNonEmptyString(raw.timezone)
}

function toTenantSummary(raw: BackendTenantRecord): TenantSummary {
  return {
    id: raw.id,
    name: raw.name ?? 'Unnamed Tenant',
    code: raw.code ?? raw.id.slice(0, 8).toUpperCase(),
    currency: normalizeNonEmptyString(raw.currency) ?? '',
    description: raw.description ?? '',
    region: normalizeNonEmptyString(raw.region) ?? 'Unknown',
    scope: raw.scope ?? 'tenant',
    scopeLabel: raw.scopeLabel ?? 'Tenant scope',
    slug: raw.slug ?? raw.id,
    timeZone: normalizeNonEmptyString(raw.timeZone) ?? '',
    stationCount: raw.stationCount ?? 0,
    siteCount: raw.siteCount ?? 0,
    chargePointCount: 0,
  }
}

function toScopeLabel(scopeType: AccessScopeType | TenantSummary['scope'], organizationType?: string) {
  switch (scopeType) {
    case 'platform':
      return 'Platform scope'
    case 'site':
      return 'Site scope'
    case 'station':
      return 'Station scope'
    case 'provider':
      return 'Provider scope'
    case 'fleet_group':
      return 'Fleet scope'
    case 'temporary':
      return 'Temporary scope'
    default:
      return organizationType ? `${organizationType.toLowerCase()} scope` : 'Tenant scope'
  }
}

function toTenantScope(scopeType?: AccessScopeType | null): TenantSummary['scope'] {
  if (scopeType === 'platform') return 'platform'
  if (scopeType === 'site') return 'site'
  return 'tenant'
}

function buildTenantCode(sourceId: string) {
  return sourceId
    .replace(/[^a-z0-9]+/gi, '')
    .slice(0, 8)
    .toUpperCase() || 'TENANT'
}

function findCountryReference(
  countries: GeographyCountryReference[],
  candidates: Array<string | null | undefined>,
): GeographyCountryReference | null {
  if (countries.length === 0) {
    return null
  }

  const normalizedCandidates = candidates
    .map((candidate) => normalizeNonEmptyString(candidate))
    .filter((candidate): candidate is string => Boolean(candidate))

  if (normalizedCandidates.length === 0) {
    return null
  }

  for (const candidate of normalizedCandidates) {
    const byCode = countries.find((country) => {
      const codeCandidate = candidate.toUpperCase()
      return country.code2.toUpperCase() === codeCandidate || country.code3?.toUpperCase() === codeCandidate
    })

    if (byCode) {
      return byCode
    }

    const token = candidate.toLowerCase()
    const byExactName = countries.find((country) =>
      country.name.toLowerCase() === token || country.officialName?.toLowerCase() === token,
    )

    if (byExactName) {
      return byExactName
    }
  }

  for (const candidate of normalizedCandidates) {
    const token = candidate.toLowerCase()
    const byFuzzyName = countries.find((country) =>
      country.name.toLowerCase().includes(token) || (country.officialName?.toLowerCase().includes(token) ?? false),
    )

    if (byFuzzyName) {
      return byFuzzyName
    }
  }

  return null
}

function deriveAvailableLanguages(countries: GeographyCountryReference[]) {
  const uniqueLanguages = new Set<string>()

  for (const country of countries) {
    for (const language of country.languages ?? []) {
      const normalized = normalizeNonEmptyString(language)
      if (normalized) {
        uniqueLanguages.add(normalized)
      }
    }
  }

  return Array.from(uniqueLanguages).sort((left, right) => left.localeCompare(right))
}

function deriveAvailableCurrencies(countries: GeographyCountryReference[]) {
  const uniqueCurrencies = new Set<string>()

  for (const country of countries) {
    const currencyCode = normalizeNonEmptyString(country.currencyCode)
    if (currencyCode) {
      uniqueCurrencies.add(currencyCode.toUpperCase())
    }
  }

  return Array.from(uniqueCurrencies).sort((left, right) => left.localeCompare(right))
}

function enrichTenantSummary(
  tenant: TenantSummary,
  user: CPOUser | null,
  countries: GeographyCountryReference[],
): TenantSummary {
  const matchedCountry = findCountryReference(countries, [
    tenant.region,
    readUserCountry(user),
    user?.region,
    tenant.name,
    tenant.code,
  ])

  const fallbackCurrency = normalizeNonEmptyString(matchedCountry?.currencyCode) ?? DEFAULT_CURRENCY

  return {
    ...tenant,
    currency: normalizeCurrencyCode(tenant.currency, fallbackCurrency),
    region:
      normalizeNonEmptyString(tenant.region)
      ?? normalizeNonEmptyString(matchedCountry?.name)
      ?? normalizeNonEmptyString(user?.region)
      ?? 'Unknown',
    timeZone: normalizeTimeZone(
      tenant.timeZone,
      readUserTimeZone(user) ?? resolveBrowserTimeZone(),
    ),
  }
}

function buildTenantFromMembership(membership: OrganizationMembershipSummary, user: CPOUser, isActive: boolean): TenantSummary {
  const activeScopeType = isActive ? user.accessProfile?.scope.type : null
  const scope = toTenantScope(activeScopeType)

  return {
    id: membership.tenantId,
    name: membership.tenantName ?? membership.tenantId,
    code: buildTenantCode(membership.tenantId),
    currency: '',
    description: membership.tenantType ? `${membership.tenantType} workspace` : '',
    region: normalizeNonEmptyString(user.region) ?? 'Unknown',
    scope,
    scopeLabel: toScopeLabel(activeScopeType ?? scope, membership.tenantType),
    slug: membership.tenantId,
    timeZone: readUserTimeZone(user) ?? '',
    stationCount: isActive ? user.stationContexts?.length ?? user.assignedStationIds?.length ?? 0 : 0,
    siteCount: scope === 'site' ? 1 : 0,
    chargePointCount: 0,
  }
}

function buildFallbackTenant(user: CPOUser, requestedTenantId: string | null): TenantSummary | null {
  const tenantIdProp =
    user.activeTenantId
    ?? user.tenantId
    ?? user.accessProfile?.scope.tenantId
    ?? requestedTenantId
    ?? user.providerId
    ?? null

  if (!tenantIdProp) {
    return null
  }

  const scopeType = user.accessProfile?.scope.type ?? 'tenant'

  return {
    id: tenantIdProp,
    name: tenantIdProp,
    code: buildTenantCode(tenantIdProp),
    currency: '',
    description: '',
    region: normalizeNonEmptyString(user.region) ?? 'Unknown',
    scope: toTenantScope(scopeType),
    scopeLabel: toScopeLabel(scopeType),
    slug: tenantIdProp,
    timeZone: readUserTimeZone(user) ?? '',
    stationCount: user.stationContexts?.length ?? user.assignedStationIds?.length ?? 0,
    siteCount: scopeType === 'site' ? 1 : 0,
    chargePointCount: 0,
  }
}

function inferDashboardMode(user: CPOUser, activeTenant: TenantSummary): TenantContextResponse['dashboardMode'] {
  return user.accessProfile?.scope.type === 'site' || activeTenant.scope === 'site' ? 'site' : 'operations'
}

function buildDataScopeLabel(user: CPOUser, activeTenant: TenantSummary) {
  const scopeType = user.accessProfile?.scope.type ?? activeTenant.scope
  const stationCount = user.accessProfile?.scope.stationIds.length ?? user.assignedStationIds?.length ?? 0

  switch (scopeType) {
    case 'platform':
      return 'Platform-wide visibility across assigned organizations and operational domains.'
    case 'site':
      return `Site-hosted visibility limited to ${activeTenant.name}.`
    case 'station':
      return stationCount > 0
        ? `Station-scoped visibility limited to ${stationCount} assigned station${stationCount === 1 ? '' : 's'} in ${activeTenant.name}.`
        : `Station-scoped visibility limited to ${activeTenant.name}.`
    case 'provider':
      return `Provider-scoped visibility limited to roaming and partner workflows for ${activeTenant.name}.`
    case 'fleet_group':
      return 'Fleet-group visibility limited to assigned vehicles and dispatch operations.'
    case 'temporary':
      return 'Temporary commissioning scope with time-bound operational access.'
    default:
      return `Tenant-scoped visibility for ${activeTenant.name}.`
  }
}

function buildTenantContextFromUser(user: CPOUser | null, requestedTenantId: string | null): TenantContextResponse | null {
  if (!user) {
    return null
  }

  const activeTenantIdProp =
    user.activeTenantId
    ?? user.tenantId
    ?? user.accessProfile?.scope.tenantId
    ?? requestedTenantId
    ?? null

  const membershipTenants = (user.memberships ?? []).map((membership) =>
    buildTenantFromMembership(membership, user, membership.tenantId === activeTenantIdProp),
  )

  const fallbackTenant = buildFallbackTenant(user, requestedTenantId)
  const availableTenants = membershipTenants.length > 0
    ? membershipTenants
    : fallbackTenant
      ? [fallbackTenant]
      : []

  if (availableTenants.length === 0) {
    return null
  }

  const activeTenant =
    availableTenants.find((tenant) => tenant.id === activeTenantIdProp)
    ?? availableTenants.find((tenant) => tenant.id === requestedTenantId)
    ?? availableTenants[0]

  return {
    activeTenant,
    availableTenants,
    canSwitchTenants: (user.memberships?.length ?? 0) > 1,
    dashboardMode: inferDashboardMode(user, activeTenant),
    dataScopeLabel: buildDataScopeLabel(user, activeTenant),
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const activeTenantId = useAuthStore((state) => state.activeTenantId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setActiveTenantId = useAuthStore((state) => state.setActiveTenantId)
  const setTokens = useAuthStore((state) => state.setTokens)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const token = useAuthStore((state) => state.token)
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false)
  const [isSwitchingStationContext, setIsSwitchingStationContext] = useState(false)

  const authDerivedContext = useMemo(
    () => buildTenantContextFromUser(user, activeTenantId),
    [activeTenantId, user],
  )

  const activeStationContext = user?.activeStationContext ?? null
  const availableStationContexts = user?.stationContexts ?? EMPTY_STATION_CONTEXTS
  const canSwitchStationContexts = availableStationContexts.length > 1

  const { data: referenceCountriesData } = useQuery<GeographyCountryReference[]>({
    queryKey: ['geography', 'reference', 'countries'],
    queryFn: async () => {
      try {
        return await fetchJson<GeographyCountryReference[]>('/api/v1/geography/reference/countries')
      } catch {
        return []
      }
    },
    enabled: isAuthenticated && !!token,
    staleTime: 21_600_000,
  })

  const availableCountries = useMemo(() => {
    const source = Array.isArray(referenceCountriesData) ? referenceCountriesData : []

    return source
      .filter((country) => Boolean(normalizeNonEmptyString(country.code2)) && Boolean(normalizeNonEmptyString(country.name)))
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [referenceCountriesData])

  const availableLanguages = useMemo(() => {
    const options = deriveAvailableLanguages(availableCountries)
    return options.length > 0 ? options : [DEFAULT_LANGUAGE]
  }, [availableCountries])

  const availableCurrencies = useMemo(() => {
    const options = deriveAvailableCurrencies(availableCountries)
    return options.length > 0 ? options : [DEFAULT_CURRENCY]
  }, [availableCountries])

  const { data: fallbackContext, isLoading: isFallbackLoading, isSuccess: isFallbackSuccess } = useQuery<TenantContextResponse>({
    queryKey: ['tenancy', 'context', token, activeTenantId],
    queryFn: async () => {
      const tenantRecords = await fetchJson<BackendTenantRecord[]>('/api/v1/tenants')
      const availableTenants = (Array.isArray(tenantRecords) ? tenantRecords : []).map(toTenantSummary)

      const fallbackTenant: TenantSummary = {
        id: 'default',
        name: 'Default Tenant',
        code: 'DEFAULT',
        currency: '',
        description: '',
        region: 'Unknown',
        scope: 'tenant',
        scopeLabel: 'Tenant scope',
        slug: 'default',
        timeZone: '',
        stationCount: 0,
        siteCount: 0,
        chargePointCount: 0,
      }

      const activeTenant =
        availableTenants.find((tenant) => tenant.id === activeTenantId)
        ?? availableTenants[0]
        ?? fallbackTenant

      return {
        activeTenant,
        availableTenants: availableTenants.length > 0 ? availableTenants : [activeTenant],
        canSwitchTenants: availableTenants.length > 1,
        dashboardMode: activeTenant.scope === 'site' ? 'site' : 'operations',
        dataScopeLabel: activeTenant.scopeLabel || `${activeTenant.name} scope`,
      }
    },
    enabled: isAuthenticated && !!token && !authDerivedContext,
    staleTime: 60_000,
  })

  const contextData = useMemo(() => {
    const rawContext = authDerivedContext ?? fallbackContext ?? null

    if (!rawContext) {
      return null
    }

    const normalizedTenants = rawContext.availableTenants.map((tenant) =>
      enrichTenantSummary(tenant, user, availableCountries),
    )

    const fallbackActiveTenant = enrichTenantSummary(rawContext.activeTenant, user, availableCountries)

    const activeTenant =
      normalizedTenants.find((tenant) => tenant.id === fallbackActiveTenant.id)
      ?? fallbackActiveTenant

    return {
      ...rawContext,
      activeTenant,
      availableTenants: normalizedTenants.length > 0 ? normalizedTenants : [activeTenant],
      dataScopeLabel: rawContext.dataScopeLabel || `${activeTenant.name} scope`,
    }
  }, [authDerivedContext, availableCountries, fallbackContext, user])

  const resolvedTenantScopeId = contextData?.activeTenant.id
    ?? user?.activeTenantId
    ?? user?.tenantId
    ?? activeTenantId
    ?? 'default'
  const activeScopeKey = `${resolvedTenantScopeId}:${activeStationContext?.assignmentId ?? 'all'}`

  const refreshCurrentUser = useCallback(async () => {
    const refreshedUser = await fetchJson<AuthenticatedApiUser>('/api/v1/users/me')
    replaceUser(refreshedUser)
  }, [replaceUser])

  useEffect(() => {
    const synchronizedTenantId = user?.activeTenantId ?? contextData?.activeTenant.id
    if (synchronizedTenantId && synchronizedTenantId !== activeTenantId) {
      setActiveTenantId(synchronizedTenantId)
    }
  }, [activeTenantId, contextData?.activeTenant.id, setActiveTenantId, user?.activeTenantId])

  const handleTenantSwitch = useCallback((tenantId: string) => {
    void (async () => {
      if (!tenantId || tenantId === activeTenantId) {
        return
      }

      const canSwitchViaBackend = Boolean(
        token
        && user?.memberships?.some((membership) => membership.tenantId === tenantId),
      )

      if (!canSwitchViaBackend) {
        setActiveTenantId(tenantId)
        return
      }

      setIsSwitchingTenant(true)

      try {
        const auth = await fetchJson<LoginResponse>('/api/v1/auth/switch-tenant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tenantId }),
        })

        const bearerToken = auth.accessToken ?? auth.token
        if (bearerToken) {
          setTokens(bearerToken, auth.refreshToken ?? null)
        }

        if (auth.user) {
          replaceUser(auth.user)
        } else {
          setActiveTenantId(tenantId)
        }
      } catch (error) {
        console.error('Failed to switch organization context.', error)
      } finally {
        setIsSwitchingTenant(false)
      }
    })()
  }, [activeTenantId, replaceUser, setActiveTenantId, setTokens, token, user?.memberships])

  const handleStationContextSwitch = useCallback((assignmentId: string) => {
    void (async () => {
      if (!assignmentId || assignmentId === activeStationContext?.assignmentId || !token) {
        return
      }

      setIsSwitchingStationContext(true)

      try {
        await fetchJson<{ stationContexts: StationContextSummary[]; activeStationContext: StationContextSummary | null }>(
          '/api/v1/users/me/station-context',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ assignmentId }),
          },
        )

        await refreshCurrentUser()
      } catch (error) {
        console.error('Failed to switch station context.', error)
      } finally {
        setIsSwitchingStationContext(false)
      }
    })()
  }, [activeStationContext?.assignmentId, refreshCurrentUser, token])

  const value = useMemo<TenantContextType>(() => ({
    activeTenant: contextData?.activeTenant ?? null,
    activeTenantId: contextData?.activeTenant.id ?? activeTenantId,
    activeStationContext,
    activeScopeKey,
    availableTenants: contextData?.availableTenants ?? [],
    availableStationContexts,
    canSwitchTenants: contextData?.canSwitchTenants ?? false,
    canSwitchStationContexts,
    dashboardMode: contextData?.dashboardMode ?? 'operations',
    dataScopeLabel: contextData?.dataScopeLabel ?? 'Tenant scope loading',
    availableCountries,
    availableLanguages,
    availableCurrencies,
    isLoading: isAuthenticated ? isSwitchingTenant || isSwitchingStationContext || (!authDerivedContext && isFallbackLoading) : false,
    isReady: !isAuthenticated || Boolean(authDerivedContext) || isFallbackSuccess || !isFallbackLoading,
    setActiveTenantId: handleTenantSwitch,
    setActiveStationContextId: handleStationContextSwitch,
  }), [
    activeTenantId,
    activeScopeKey,
    activeStationContext,
    authDerivedContext,
    availableCountries,
    availableCurrencies,
    availableLanguages,
    availableStationContexts,
    canSwitchStationContexts,
    contextData,
    handleStationContextSwitch,
    handleTenantSwitch,
    isAuthenticated,
    isFallbackLoading,
    isFallbackSuccess,
    isSwitchingStationContext,
    isSwitchingTenant,
  ])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
