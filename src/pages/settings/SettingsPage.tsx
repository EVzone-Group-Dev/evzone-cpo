import { useEffect, useMemo, useState } from 'react'
import { fetchJson } from '@/core/api/fetchJson'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getTemporaryAccessState, getTemporaryAccessWindowLabel, getUserRoleLabel, getUserScopeType, isTemporaryScopeUser } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'
import { useTenant } from '@/core/hooks/useTenant'
import { applySavedSettings, loadSettingsDraft, saveSettingsDraft, type ScreenDensity, type SessionTimeout, type SettingsDraft } from '@/core/settings/settingsPreferences'
import { useTheme } from '@/core/theme/themeContext'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { BellRing, Building2, Globe2, LayoutGrid, Lock, Save, ShieldCheck, SlidersHorizontal, Sparkles, UserCog } from 'lucide-react'

function buildInitialDraft(
  userName: string,
  userEmail: string,
  mfaEnabled: boolean,
  language: string,
  currency: string,
  tenantCountryCode: string,
  tenantStateCode: string,
  tenantCity: string,
): SettingsDraft {
  return {
    currency,
    dailyDigest: true,
    email: userEmail,
    language,
    mfaEnabled,
    name: userName,
    recentAccessAlerts: true,
    screenDensity: 'Comfortable',
    sessionTimeout: '30 minutes',
    tenantCity,
    tenantCountryCode,
    tenantStateCode,
    weeklyOpsReport: true,
  }
}

function SettingToggle({
  checked,
  description,
  id,
  label,
  onChange,
}: {
  checked: boolean
  description: string
  id: string
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-bg-muted/35 px-3 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        <div className="text-[11px] text-subtle mt-1">{description}</div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center justify-start rounded-full border p-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] ${checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-card)]'}`}
      >
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-transform duration-200 ${checked ? 'translate-x-5 border-[var(--accent)] bg-[var(--bg-card)] shadow-sm' : 'translate-x-0 border-[var(--border)] bg-[var(--bg-card)] shadow-[0_1px_2px_rgba(15,23,42,0.12)]'}`}
        />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { user, replaceUser } = useAuthStore()
  const { resolvedTheme, setThemeMode, themeMode } = useTheme()
  const {
    activeStationContext,
    activeTenant,
    availableCountries,
    availableCurrencies,
    availableLanguages,
    availableStationContexts,
    availableTenants,
    dataScopeLabel,
  } = useTenant()
  const userName = user?.name ?? ''
  const userEmail = user?.email ?? ''
  const mfaEnabled = user?.mfaEnabled ?? false
  const currentMfaEnabled = user?.mfaEnabled ?? false
  const currentUserCountry = useMemo(() => {
    const country = (user as unknown as Record<string, unknown> | null)?.country
    return typeof country === 'string' ? country.trim() : ''
  }, [user])
  const availableCountryCount = availableCountries?.length ?? 0
  const countryOptions = useMemo(
    () => (availableCountries ?? []).slice().sort((left, right) => left.name.localeCompare(right.name)),
    [availableCountries],
  )
  const languageOptions = useMemo(() => availableLanguages?.length ? availableLanguages : ['English'], [availableLanguages])
  const currencyOptions = useMemo(() => {
    const defaults = availableCurrencies?.length ? [...availableCurrencies] : []
    const activeCurrency = activeTenant?.currency?.trim()

    if (activeCurrency && !defaults.includes(activeCurrency)) {
      defaults.unshift(activeCurrency)
    }

    return defaults.length > 0 ? defaults : ['USD']
  }, [activeTenant?.currency, availableCurrencies])
  const initialLanguage = useMemo(
    () => languageOptions.find((language) => language.toLowerCase() === 'english') ?? languageOptions[0] ?? 'English',
    [languageOptions],
  )
  const initialCurrency = useMemo(
    () => activeTenant?.currency?.trim() || currencyOptions[0] || 'USD',
    [activeTenant?.currency, currencyOptions],
  )
  const initialTenantCountryCode = useMemo(() => {
    const regionToken = activeTenant?.region?.trim().toLowerCase()
    if (!regionToken) {
      return countryOptions[0]?.code2 ?? ''
    }

    const matchedCountry = countryOptions.find((country) =>
      country.name.toLowerCase() === regionToken
      || country.code2.toLowerCase() === regionToken
      || country.code3?.toLowerCase() === regionToken,
    )

    return matchedCountry?.code2 ?? countryOptions[0]?.code2 ?? ''
  }, [activeTenant?.region, countryOptions])
  const baseDraft = useMemo(() => buildInitialDraft(
    userName,
    userEmail,
    mfaEnabled,
    initialLanguage,
    initialCurrency,
    initialTenantCountryCode,
    '',
    '',
  ), [
    initialCurrency,
    initialLanguage,
    initialTenantCountryCode,
    mfaEnabled,
    userEmail,
    userName,
  ])
  const savedDraft = useMemo(() => loadSettingsDraft(user?.id ?? null), [user?.id])
  const [draft, setDraft] = useState<SettingsDraft>(() => applySavedSettings(baseDraft, savedDraft))
  const [baseline, setBaseline] = useState<SettingsDraft>(() => applySavedSettings(baseDraft, savedDraft))
  const {
    data: tenantStates = [],
    isLoading: isTenantStatesLoading,
  } = useReferenceStates(draft.tenantCountryCode)
  const {
    data: tenantCities = [],
    isLoading: isTenantCitiesLoading,
  } = useReferenceCities(draft.tenantCountryCode, draft.tenantStateCode)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initials = useMemo(
    () => userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'EV',
    [userName],
  )
  const assignedStations = user?.assignedStationIds?.length
    ? user.assignedStationIds.join(', ')
    : user?.accessProfile?.scope.stationIds.length
      ? user.accessProfile.scope.stationIds.join(', ')
      : 'All tenant stations'
  const scopeType = getUserScopeType(user)
  const temporaryAccessState = getTemporaryAccessState(user)
  const temporaryAccessWindowLabel = getTemporaryAccessWindowLabel(user)
  const hasTemporaryScope = isTemporaryScopeUser(user)
  const selectedTenantCountryName = useMemo(
    () => {
      const countryName = countryOptions.find((country) => country.code2 === draft.tenantCountryCode)?.name
      const fallbackCountry = draft.tenantCountryCode || '-'
      return countryName ?? fallbackCountry
    },
    [countryOptions, draft.tenantCountryCode],
  )
  const selectedTenantStateName = useMemo(
    () => {
      const stateName = tenantStates.find((state) => state.code === draft.tenantStateCode)?.name
      const fallbackState = draft.tenantStateCode || '-'
      return stateName ?? fallbackState
    },
    [draft.tenantStateCode, tenantStates],
  )

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(baseline)

  useEffect(() => {
    if (hasUnsavedChanges || isSaving || availableCountryCount === 0) {
      return
    }

    const normalizeDraft = (current: SettingsDraft): SettingsDraft => {
      const normalizedLanguage = languageOptions.includes(current.language) ? current.language : initialLanguage
      const normalizedCurrency = currencyOptions.includes(current.currency) ? current.currency : initialCurrency
      const normalizedTenantCountryCode = countryOptions.some((country) => country.code2 === current.tenantCountryCode)
        ? current.tenantCountryCode
        : initialTenantCountryCode

      const normalizedTenantStateCode =
        tenantStates.length > 0 && current.tenantStateCode && !tenantStates.some((state) => state.code === current.tenantStateCode)
          ? ''
          : normalizedTenantCountryCode !== current.tenantCountryCode
            ? ''
            : current.tenantStateCode

      const normalizedTenantCity =
        tenantCities.length > 0 && current.tenantCity && !tenantCities.some((city) => city.name === current.tenantCity)
          ? ''
          : (normalizedTenantCountryCode !== current.tenantCountryCode || normalizedTenantStateCode !== current.tenantStateCode)
            ? ''
            : current.tenantCity

      if (
        normalizedLanguage === current.language
        && normalizedCurrency === current.currency
        && normalizedTenantCountryCode === current.tenantCountryCode
        && normalizedTenantStateCode === current.tenantStateCode
        && normalizedTenantCity === current.tenantCity
      ) {
        return current
      }

      return {
        ...current,
        language: normalizedLanguage,
        currency: normalizedCurrency,
        tenantCountryCode: normalizedTenantCountryCode,
        tenantStateCode: normalizedTenantStateCode,
        tenantCity: normalizedTenantCity,
      }
    }

    queueMicrotask(() => {
      setDraft((current) => normalizeDraft(current))
      setBaseline((current) => normalizeDraft(current))
    })
  }, [
    countryOptions,
    currencyOptions,
    availableCountryCount,
    hasUnsavedChanges,
    initialCurrency,
    initialLanguage,
    initialTenantCountryCode,
    isSaving,
    languageOptions,
    tenantCities,
    tenantStates,
  ])

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const normalizedName = draft.name.trim() || userName
      const selectedCountry = countryOptions.find((country) => country.code2 === draft.tenantCountryCode)?.name?.trim() ?? ''
      const profilePatch: Record<string, string> = {}
      let latestUserPayload: AuthenticatedApiUser | null = null

      if (normalizedName !== userName) {
        profilePatch.name = normalizedName
      }

      if (selectedCountry && selectedCountry !== currentUserCountry) {
        profilePatch.country = selectedCountry
      }

      const nextDraft: SettingsDraft = {
        ...draft,
        name: normalizedName,
      }

      if (Object.keys(profilePatch).length > 0) {
        const updatedUser = await fetchJson<AuthenticatedApiUser>('/api/v1/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profilePatch),
        })

        replaceUser(updatedUser)
        latestUserPayload = updatedUser
        nextDraft.name = updatedUser.name?.trim() || normalizedName
      }

      if (user?.id && draft.mfaEnabled !== currentMfaEnabled) {
        await fetchJson<{ success: boolean; message?: string }>(
          `/api/v1/users/${user.id}/mfa-requirement`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ required: draft.mfaEnabled }),
          },
        )

        const mergedUser = {
          ...(latestUserPayload ?? (user as unknown as AuthenticatedApiUser)),
          mfaEnabled: draft.mfaEnabled,
          mfaRequired: draft.mfaEnabled,
        }
        replaceUser(mergedUser)
      }

      saveSettingsDraft(user?.id ?? null, nextDraft)
      setDraft(nextDraft)
      setBaseline(nextDraft)
      setLastSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to sync changes right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6">
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(63,185,80,0.14),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(56,139,253,0.12),transparent_35%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl border border-accent/25 bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                {initials}
              </div>
              <div>
                <div className="text-xl font-bold leading-tight">Workspace Settings</div>
                <div className="text-sm text-subtle mt-1">
                  Manage account identity, security posture, alerts, and tenant controls from one place.
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
                  <span className="pill active"><Sparkles size={10} /> Premium UX</span>
                  <span className="pill pending"><Globe2 size={10} /> {activeTenant?.region ?? 'Region pending'}</span>
                  <span className="pill maintenance"><Building2 size={10} /> {activeTenant?.scopeLabel ?? 'Scope pending'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2">
              <button
                className={`btn ${hasUnsavedChanges ? 'primary' : 'secondary'} w-full lg:w-auto`}
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
              >
                <Save size={14} />
                {isSaving ? 'Saving changes...' : hasUnsavedChanges ? 'Save changes' : 'All changes saved'}
              </button>
              <div className="text-xs text-subtle">
                {lastSavedAt ? `Last saved at ${lastSavedAt}` : 'No saved updates in this session'}
              </div>
              {saveError && (
                <div className="text-xs text-danger max-w-sm text-left lg:text-right">
                  {saveError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card">
                <div className="section-title"><UserCog size={16} className="text-accent" />Profile & Identity</div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="settings-name" className="form-label">Display Name</label>
                    <input
                      id="settings-name"
                      className="input"
                      value={draft.name}
                      onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-email" className="form-label">Work Email</label>
                    <input
                      id="settings-email"
                      type="email"
                      className="input"
                      value={draft.email}
                      onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="form-label">Role</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{getUserRoleLabel(user)}</div>
                    </div>
                    <div>
                      <div className="form-label">Tenant</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{user?.activeTenantId ?? user?.tenantId ?? 'Platform-wide access'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="form-label">Scope Type</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{scopeType ?? 'tenant'}</div>
                    </div>
                    <div>
                      <div className="form-label">Memberships</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{user?.memberships?.length ?? 0}</div>
                    </div>
                  </div>
                  <div>
                    <div className="form-label">Assigned Stations</div>
                    <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">
                      {assignedStations}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="section-title"><ShieldCheck size={16} className="text-accent" />Security & Access</div>
                <div className="space-y-3">
                  <SettingToggle
                    id="settings-mfa"
                    label="Multi-factor authentication"
                    description="Require an additional verification challenge during login."
                    checked={draft.mfaEnabled}
                    onChange={(next) => setDraft((current) => ({ ...current, mfaEnabled: next }))}
                  />
                  <SettingToggle
                    id="settings-access-alerts"
                    label="Access anomaly alerts"
                    description="Notify account owners on unusual geolocation or device access."
                    checked={draft.recentAccessAlerts}
                    onChange={(next) => setDraft((current) => ({ ...current, recentAccessAlerts: next }))}
                  />
                  <div>
                    <label htmlFor="settings-timeout" className="form-label">Session Timeout</label>
                    <select
                      id="settings-timeout"
                      className="input"
                      value={draft.sessionTimeout}
                      onChange={(event) => setDraft((current) => ({ ...current, sessionTimeout: event.target.value as SessionTimeout }))}
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                    </select>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-3 text-xs text-subtle">
                    Security baseline follows tenant policy and will enforce stronger controls for elevated roles.
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title"><BellRing size={16} className="text-accent" />Notification Controls</div>
              <div className="grid gap-3 lg:grid-cols-2">
                <SettingToggle
                  id="settings-digest"
                  label="Daily operational digest"
                  description="Receive system summary with incidents, uptime, and charging throughput."
                  checked={draft.dailyDigest}
                  onChange={(next) => setDraft((current) => ({ ...current, dailyDigest: next }))}
                />
                <SettingToggle
                  id="settings-weekly"
                  label="Weekly executive report"
                  description="Send weekly tenant-wide trends and settlement highlights."
                  checked={draft.weeklyOpsReport}
                  onChange={(next) => setDraft((current) => ({ ...current, weeklyOpsReport: next }))}
                />
              </div>
            </div>

            <div className="card">
              <div className="section-title"><LayoutGrid size={16} className="text-accent" />Interface Preferences</div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label htmlFor="settings-theme" className="form-label">Theme</label>
                  <select
                    id="settings-theme"
                    className="input"
                    value={themeMode}
                    onChange={(event) => setThemeMode(event.target.value as 'system' | 'light' | 'dark')}
                  >
                    <option value="system">System default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <div className="text-[11px] text-subtle mt-1">
                    Following {themeMode === 'system' ? 'your OS preference' : `the ${resolvedTheme} palette`} right now.
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-density" className="form-label">Screen Density</label>
                  <select
                    id="settings-density"
                    className="input"
                    value={draft.screenDensity}
                    onChange={(event) => setDraft((current) => ({ ...current, screenDensity: event.target.value as ScreenDensity }))}
                  >
                    <option value="Comfortable">Comfortable</option>
                    <option value="Compact">Compact</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-language" className="form-label">Language</label>
                  <select
                    id="settings-language"
                    className="input"
                    value={draft.language}
                    onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))}
                  >
                    {languageOptions.map((language) => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-currency" className="form-label">Currency</label>
                  <select
                    id="settings-currency"
                    className="input"
                    value={draft.currency}
                    onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value }))}
                  >
                    {currencyOptions.map((currencyCode) => (
                      <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title"><Building2 size={16} className="text-accent" />Tenant Provisioning</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label htmlFor="settings-tenant-country" className="form-label">Country</label>
                  <select
                    id="settings-tenant-country"
                    className="input"
                    value={draft.tenantCountryCode}
                    onChange={(event) => {
                      const nextCountryCode = event.target.value
                      setDraft((current) => ({
                        ...current,
                        tenantCountryCode: nextCountryCode,
                        tenantStateCode: '',
                        tenantCity: '',
                      }))
                    }}
                  >
                    <option value="">Select country</option>
                    {countryOptions.map((country) => (
                      <option key={country.code2} value={country.code2}>{country.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-tenant-state" className="form-label">State / Province</label>
                  {tenantStates.length > 0 ? (
                    <select
                      id="settings-tenant-state"
                      className="input"
                      value={draft.tenantStateCode}
                      onChange={(event) => {
                        const nextStateCode = event.target.value
                        setDraft((current) => ({
                          ...current,
                          tenantStateCode: nextStateCode,
                          tenantCity: '',
                        }))
                      }}
                      disabled={!draft.tenantCountryCode || isTenantStatesLoading}
                    >
                      <option value="">{isTenantStatesLoading ? 'Loading states...' : 'Select state'}</option>
                      {tenantStates.map((state) => (
                        <option key={state.code} value={state.code}>{state.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="settings-tenant-state"
                      className="input"
                      value={draft.tenantStateCode}
                      onChange={(event) => setDraft((current) => ({ ...current, tenantStateCode: event.target.value }))}
                      placeholder={draft.tenantCountryCode ? 'Type state/province' : 'Select country first'}
                      disabled={!draft.tenantCountryCode}
                    />
                  )}
                </div>
                <div>
                  <label htmlFor="settings-tenant-city" className="form-label">City</label>
                  {tenantCities.length > 0 ? (
                    <select
                      id="settings-tenant-city"
                      className="input"
                      value={draft.tenantCity}
                      onChange={(event) => setDraft((current) => ({ ...current, tenantCity: event.target.value }))}
                      disabled={!draft.tenantCountryCode || Boolean(tenantStates.length > 0 && !draft.tenantStateCode) || isTenantCitiesLoading}
                    >
                      <option value="">
                        {isTenantCitiesLoading
                          ? 'Loading cities...'
                          : tenantStates.length > 0 && !draft.tenantStateCode
                            ? 'Select state first'
                            : 'Select city'}
                      </option>
                      {tenantCities.map((city) => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="settings-tenant-city"
                      className="input"
                      value={draft.tenantCity}
                      onChange={(event) => setDraft((current) => ({ ...current, tenantCity: event.target.value }))}
                      placeholder={draft.tenantCountryCode ? 'Type city' : 'Select country first'}
                      disabled={!draft.tenantCountryCode}
                    />
                  )}
                </div>
              </div>
              <div className="text-xs text-subtle mt-3">
                Country, state, and city options are loaded from geography reference APIs.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="section-title"><Building2 size={16} className="text-accent" />Tenant Scope</div>
              <div className="space-y-3 text-sm">
                <div><div className="form-label">Active Tenant</div><div>{activeTenant?.name ?? 'Loading...'}</div></div>
                <div><div className="form-label">Scope</div><div>{activeTenant?.scopeLabel ?? '-'}</div></div>
                <div><div className="form-label">Active Station</div><div>{activeStationContext?.stationName ?? activeStationContext?.stationId ?? 'All assigned stations'}</div></div>
                <div><div className="form-label">Region</div><div>{activeTenant?.region ?? '-'}</div></div>
                <div><div className="form-label">Provisioning Country</div><div>{selectedTenantCountryName}</div></div>
                <div><div className="form-label">Provisioning State</div><div>{selectedTenantStateName}</div></div>
                <div><div className="form-label">Provisioning City</div><div>{draft.tenantCity || '-'}</div></div>
                <div><div className="form-label">Coverage</div><div>{dataScopeLabel}</div></div>
                {hasTemporaryScope && <div><div className="form-label">Temporary Access</div><div>{temporaryAccessState}</div></div>}
                {hasTemporaryScope && <div><div className="form-label">Access Window</div><div>{temporaryAccessWindowLabel}</div></div>}
                <div><div className="form-label">Station Contexts</div><div>{availableStationContexts.length}</div></div>
                <div><div className="form-label">Available Tenants</div><div>{availableTenants.length}</div></div>
              </div>
            </div>

            <div className="card">
              <div className="section-title"><SlidersHorizontal size={16} className="text-accent" />Configuration Health</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
                  <span className="text-subtle">Profile completeness</span>
                  <span className="text-ok font-semibold">92%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
                  <span className="text-subtle">Security posture</span>
                  <span className={draft.mfaEnabled ? 'text-ok font-semibold' : 'text-warning font-semibold'}>
                    {draft.mfaEnabled ? 'Hardened' : 'Needs MFA'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
                  <span className="text-subtle">Notification routing</span>
                  <span className="text-info font-semibold">Operational</span>
                </div>
              </div>
            </div>

            <div className="card border-accent/20 bg-accent/5">
              <div className="section-title"><Lock size={16} className="text-accent" />Policy Notes</div>
              <p className="text-xs text-subtle leading-relaxed">
                Tenant governance, role restrictions, and scope isolation remain policy-driven. Profile changes sync through the PATCH endpoint,
                while workspace preferences stay local to this browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
