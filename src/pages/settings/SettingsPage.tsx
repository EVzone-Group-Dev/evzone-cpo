import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchJson } from '@/core/api/fetchJson'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getTemporaryAccessState, getTemporaryAccessWindowLabel, getUserRoleLabel, getUserScopeType, isTemporaryScopeUser } from '@/core/auth/access'
import { resolveDisplayLabel } from '@/core/auth/displayLabel'
import { useAuthStore } from '@/core/auth/authStore'
import { useReferenceCities, useReferenceStates } from '@/core/hooks/useGeography'
import { useTenant } from '@/core/hooks/useTenant'
import { applySavedSettings, loadSettingsDraft, saveSettingsDraft, type ScreenDensity, type SessionTimeout, type SettingsDraft } from '@/core/settings/settingsPreferences'
import { useTheme } from '@/core/theme/themeContext'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { BellRing, Building2, ChevronRight, Globe2, LayoutGrid, Lock, Save, ShieldCheck, SlidersHorizontal, Sparkles, UserCog } from 'lucide-react'

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
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">{label}</label>
        <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">{description}</div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-start rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)] bg-[var(--bg-muted)]'}`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-200 ${checked ? 'translate-x-4 bg-white shadow-sm' : 'translate-x-0.5 bg-[var(--text-subtle)]'}`}
        />
      </button>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)]">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
        {description && <p className="text-xs text-[var(--text-subtle)]">{description}</p>}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { user, replaceUser } = useAuthStore()
  const { i18n, t } = useTranslation()
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
    if (activeCurrency && !defaults.includes(activeCurrency)) defaults.unshift(activeCurrency)
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
    if (!regionToken) return countryOptions[0]?.code2 ?? ''
    const matchedCountry = countryOptions.find((country) =>
      country.name.toLowerCase() === regionToken || country.code2.toLowerCase() === regionToken || country.code3?.toLowerCase() === regionToken
    )
    return matchedCountry?.code2 ?? countryOptions[0]?.code2 ?? ''
  }, [activeTenant?.region, countryOptions])

  const baseDraft = useMemo(() => buildInitialDraft(userName, userEmail, mfaEnabled, initialLanguage, initialCurrency, initialTenantCountryCode, '', ''), [initialCurrency, initialLanguage, initialTenantCountryCode, mfaEnabled, userEmail, userName])
  const savedDraft = useMemo(() => loadSettingsDraft(user?.id ?? null), [user?.id])
  const [draft, setDraft] = useState<SettingsDraft>(() => applySavedSettings(baseDraft, savedDraft))
  const [baseline, setBaseline] = useState<SettingsDraft>(() => applySavedSettings(baseDraft, savedDraft))
  
  const { data: tenantStates = [], isLoading: isTenantStatesLoading } = useReferenceStates(draft.tenantCountryCode)
  const { data: tenantCities = [], isLoading: isTenantCitiesLoading } = useReferenceCities(draft.tenantCountryCode, draft.tenantStateCode)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initials = useMemo(() => userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'EV', [userName])
  const assignedStations = user?.assignedStationIds?.length ? user.assignedStationIds.join(', ') : user?.accessProfile?.scope.stationIds.length ? user.accessProfile.scope.stationIds.join(', ') : t('dashboard.assignedStations')
  const tenantDisplayName = resolveDisplayLabel({ primary: user?.displayTenantName ?? user?.activeTenantName ?? user?.organizationName ?? user?.selectedTenantName ?? activeTenant?.name ?? null, secondary: null, fallback: 'Platform-wide access' })
  const activeStationDisplayName = resolveDisplayLabel({ primary: activeStationContext?.stationName ?? user?.displayStationName ?? user?.activeStationName ?? null, secondary: null, fallback: t('dashboard.assignedStations') })
  const scopeType = getUserScopeType(user)
  
  const temporaryAccessStateLabel = useMemo(() => {
    const state = getTemporaryAccessState(user)
    if (state === 'active') return t('settings.operational')
    if (state === 'expired') return 'Expired'
    if (state === 'upcoming') return 'Upcoming'
    return '-'
  }, [user, t])
  const temporaryAccessWindowLabel = getTemporaryAccessWindowLabel(user)
  const hasTemporaryScope = isTemporaryScopeUser(user)
  
  const selectedTenantCountryName = useMemo(() => (countryOptions.find((country) => country.code2 === draft.tenantCountryCode)?.name ?? draft.tenantCountryCode) || '-', [countryOptions, draft.tenantCountryCode])
  const selectedTenantStateName = useMemo(() => (tenantStates.find((state) => state.code === draft.tenantStateCode)?.name ?? draft.tenantStateCode) || '-', [draft.tenantStateCode, tenantStates])

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(baseline)

  useEffect(() => {
    if (hasUnsavedChanges || isSaving || availableCountryCount === 0) return
    const normalizeDraft = (current: SettingsDraft): SettingsDraft => {
      const normalizedLanguage = languageOptions.includes(current.language) ? current.language : initialLanguage
      const normalizedCurrency = currencyOptions.includes(current.currency) ? current.currency : initialCurrency
      const normalizedTenantCountryCode = countryOptions.some((country) => country.code2 === current.tenantCountryCode) ? current.tenantCountryCode : initialTenantCountryCode
      const normalizedTenantStateCode = tenantStates.length > 0 && current.tenantStateCode && !tenantStates.some((state) => state.code === current.tenantStateCode) ? '' : normalizedTenantCountryCode !== current.tenantCountryCode ? '' : current.tenantStateCode
      const normalizedTenantCity = tenantCities.length > 0 && current.tenantCity && !tenantCities.some((city) => city.name === current.tenantCity) ? '' : (normalizedTenantCountryCode !== current.tenantCountryCode || normalizedTenantStateCode !== current.tenantStateCode) ? '' : current.tenantCity
      if (normalizedLanguage === current.language && normalizedCurrency === current.currency && normalizedTenantCountryCode === current.tenantCountryCode && normalizedTenantStateCode === current.tenantStateCode && normalizedTenantCity === current.tenantCity) return current
      return { ...current, language: normalizedLanguage, currency: normalizedCurrency, tenantCountryCode: normalizedTenantCountryCode, tenantStateCode: normalizedTenantStateCode, tenantCity: normalizedTenantCity }
    }
    queueMicrotask(() => { setDraft((current) => normalizeDraft(current)); setBaseline((current) => normalizeDraft(current)); })
  }, [countryOptions, currencyOptions, availableCountryCount, hasUnsavedChanges, initialCurrency, initialLanguage, initialTenantCountryCode, isSaving, languageOptions, tenantCities, tenantStates])

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges || isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const normalizedName = draft.name.trim() || userName
      const selectedCountry = countryOptions.find((country) => country.code2 === draft.tenantCountryCode)?.name?.trim() ?? ''
      const profilePatch: Record<string, string> = {}
      let latestUserPayload: AuthenticatedApiUser | null = null
      if (normalizedName !== userName) profilePatch.name = normalizedName
      if (selectedCountry && selectedCountry !== currentUserCountry) profilePatch.country = selectedCountry
      const nextDraft: SettingsDraft = { ...draft, name: normalizedName }
      if (Object.keys(profilePatch).length > 0) {
        const updatedUser = await fetchJson<AuthenticatedApiUser>('/api/v1/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profilePatch) })
        replaceUser(updatedUser); latestUserPayload = updatedUser; nextDraft.name = updatedUser.name?.trim() || normalizedName
      }
      if (user?.id && draft.mfaEnabled !== currentMfaEnabled) {
        await fetchJson<{ success: boolean; message?: string }>(`/api/v1/users/${user.id}/mfa-requirement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ required: draft.mfaEnabled }) })
        const mergedUser = { ...(latestUserPayload ?? (user as unknown as AuthenticatedApiUser)), mfaEnabled: draft.mfaEnabled, mfaRequired: draft.mfaEnabled }
        replaceUser(mergedUser)
      }
      saveSettingsDraft(user?.id ?? null, nextDraft)
      if (nextDraft.language) i18n.changeLanguage(nextDraft.language)
      setDraft(nextDraft); setBaseline(nextDraft); setLastSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to sync changes right now.') } finally { setIsSaving(false) }
  }

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Modern Header - No Card Border */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-accent/20">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                <Sparkles size={12} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">{t('settings.workspaceSettings')}</h1>
              <p className="text-sm text-[var(--text-subtle)] mt-1 max-w-md">
                {t('settings.workspaceDescription')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">Status</div>
                <div className="text-xs font-semibold text-[var(--accent)]">{lastSavedAt ? t('settings.lastSaved', { time: lastSavedAt }) : t('settings.noSaved')}</div>
              </div>
              <button
                className={`btn h-11 px-6 ${hasUnsavedChanges ? 'primary' : 'secondary shadow-sm'} transition-all duration-300 font-bold flex items-center gap-2 rounded-xl`}
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
              >
                <Save size={16} />
                {isSaving ? t('common.saving') : hasUnsavedChanges ? t('common.save') : t('common.saved')}
              </button>
            </div>
            {saveError && <p className="text-xs text-danger font-medium">{saveError}</p>}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-16">
            {/* Profile Section */}
            <section>
              <SectionHeader icon={UserCog} title={t('settings.profile')} description="Identity and organization credentials" />
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="settings-name" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] px-1">{t('settings.displayName')}</label>
                  <input
                    id="settings-name"
                    className="input h-11 rounded-xl bg-[var(--bg-card)] border-[var(--border)] focus:border-[var(--accent)] transition-all"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settings-email" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)] px-1">{t('settings.workEmail')}</label>
                  <input
                    id="settings-email"
                    type="email"
                    className="input h-11 rounded-xl bg-[var(--bg-card)] border-[var(--border)] focus:border-[var(--accent)] transition-all"
                    value={draft.email}
                    onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/50">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-1">{t('settings.role')}</div>
                  <div className="text-sm font-semibold truncate">{getUserRoleLabel(user)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/50">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-1">{t('settings.tenant')}</div>
                  <div className="text-sm font-semibold truncate">{tenantDisplayName}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--bg-muted)]/30 border border-[var(--border)]/50">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-1">{t('settings.scopeType')}</div>
                  <div className="text-sm font-semibold truncate capitalize">{scopeType ?? 'tenant'}</div>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section>
              <SectionHeader icon={ShieldCheck} title={t('settings.security')} description="Protect your account and session integrity" />
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]/50 overflow-hidden shadow-sm">
                <div className="px-6">
                  <SettingToggle
                    id="settings-mfa"
                    label={t('settings.mfa')}
                    description={t('settings.mfaDescription')}
                    checked={draft.mfaEnabled}
                    onChange={(next) => setDraft((current) => ({ ...current, mfaEnabled: next }))}
                  />
                </div>
                <div className="px-6">
                  <SettingToggle
                    id="settings-access-alerts"
                    label={t('settings.accessAlerts')}
                    description={t('settings.accessAlertsDescription')}
                    checked={draft.recentAccessAlerts}
                    onChange={(next) => setDraft((current) => ({ ...current, recentAccessAlerts: next }))}
                  />
                </div>
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="settings-timeout" className="text-sm font-semibold text-[var(--text)]">{t('settings.sessionTimeout')}</label>
                    <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">Auto-logout after inactivity</div>
                  </div>
                  <select
                    id="settings-timeout"
                    className="input sm w-40 h-10 rounded-lg bg-[var(--bg-muted)]/50 border-[var(--border)]"
                    value={draft.sessionTimeout}
                    onChange={(event) => setDraft((current) => ({ ...current, sessionTimeout: event.target.value as SessionTimeout }))}
                  >
                    <option value="15 minutes">15 minutes</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Notifications & Interface */}
            <div className="grid gap-12 sm:grid-cols-2">
              <section>
                <SectionHeader icon={BellRing} title={t('settings.notifications')} />
                <div className="space-y-2">
                  <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
                    <SettingToggle
                      id="settings-digest"
                      label={t('settings.dailyDigest')}
                      description={t('settings.dailyDigestDescription')}
                      checked={draft.dailyDigest}
                      onChange={(next) => setDraft((current) => ({ ...current, dailyDigest: next }))}
                    />
                    <div className="my-4 h-px bg-[var(--border)]/50" />
                    <SettingToggle
                      id="settings-weekly"
                      label={t('settings.weeklyReport')}
                      description={t('settings.weeklyReportDescription')}
                      checked={draft.weeklyOpsReport}
                      onChange={(next) => setDraft((current) => ({ ...current, weeklyOpsReport: next }))}
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader icon={LayoutGrid} title={t('settings.interface')} />
                <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="settings-theme" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.theme')}</label>
                    <select id="settings-theme" className="input h-10 rounded-lg bg-[var(--bg-muted)]/50" value={themeMode} onChange={(event) => setThemeMode(event.target.value as 'system' | 'light' | 'dark')}>
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="settings-density" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.screenDensity')}</label>
                      <select id="settings-density" className="input h-10 rounded-lg bg-[var(--bg-muted)]/50" value={draft.screenDensity} onChange={(event) => setDraft((current) => ({ ...current, screenDensity: event.target.value as ScreenDensity }))}>
                        <option value="Comfortable">Comfortable</option>
                        <option value="Compact">Compact</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="settings-language" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.language')}</label>
                      <select id="settings-language" className="input h-10 rounded-lg bg-[var(--bg-muted)]/50" value={draft.language} onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))}>
                        {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Provisioning */}
            <section>
              <SectionHeader icon={Building2} title={t('settings.provisioning')} description="Geographical and operational placement" />
              <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm grid gap-8 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="settings-tenant-country" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.country')}</label>
                  <select id="settings-tenant-country" className="input h-11 rounded-xl" value={draft.tenantCountryCode} onChange={(e) => setDraft(c => ({ ...c, tenantCountryCode: e.target.value, tenantStateCode: '', tenantCity: '' }))}>
                    <option value="">Select country</option>
                    {countryOptions.map(c => <option key={c.code2} value={c.code2}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings-tenant-state" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.state')}</label>
                  {tenantStates.length > 0 ? (
                    <select id="settings-tenant-state" className="input h-11 rounded-xl" value={draft.tenantStateCode} onChange={e => setDraft(c => ({ ...c, tenantStateCode: e.target.value, tenantCity: '' }))} disabled={!draft.tenantCountryCode || isTenantStatesLoading}>
                      <option value="">{isTenantStatesLoading ? 'Loading...' : 'Select state'}</option>
                      {tenantStates.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                  ) : (
                    <input id="settings-tenant-state" className="input h-11 rounded-xl" value={draft.tenantStateCode} onChange={e => setDraft(c => ({ ...c, tenantStateCode: e.target.value }))} placeholder={draft.tenantCountryCode ? 'Type state' : 'Select country'} disabled={!draft.tenantCountryCode} />
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings-tenant-city" className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.city')}</label>
                  {tenantCities.length > 0 ? (
                    <select id="settings-tenant-city" className="input h-11 rounded-xl" value={draft.tenantCity} onChange={e => setDraft(c => ({ ...c, tenantCity: e.target.value }))} disabled={!draft.tenantCountryCode || Boolean(tenantStates.length > 0 && !draft.tenantStateCode) || isTenantCitiesLoading}>
                      <option value="">{isTenantCitiesLoading ? 'Loading...' : 'Select city'}</option>
                      {tenantCities.map(ci => <option key={ci.name} value={ci.name}>{ci.name}</option>)}
                    </select>
                  ) : (
                    <input id="settings-tenant-city" className="input h-11 rounded-xl" value={draft.tenantCity} onChange={e => setDraft(c => ({ ...c, tenantCity: e.target.value }))} placeholder={draft.tenantCountryCode ? 'Type city' : 'Select country'} disabled={!draft.tenantCountryCode} />
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--text-subtle)] flex items-center gap-2 italic">
                <Globe2 size={12} /> {t('settings.geographyNotes')}
              </p>
            </section>
          </div>

          {/* Right Sidebar - Sticky & Clean */}
          <div className="space-y-8">
            <div className="sticky top-6 space-y-8">
              <div className="p-6 rounded-2xl bg-[var(--bg-muted)]/20 border border-[var(--border)]/60">
                <div className="flex items-center gap-2 mb-6 text-[var(--accent)]">
                  <SlidersHorizontal size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('settings.scope')}</span>
                </div>
                <div className="space-y-6">
                  {[
                    { label: t('settings.activeTenant'), value: activeTenant?.name ?? 'Platform' },
                    { label: t('settings.activeStation'), value: activeStationDisplayName },
                    { label: t('settings.region'), value: activeTenant?.region ?? '-' },
                    { label: t('settings.coverage'), value: dataScopeLabel },
                  ].map((item, idx) => (
                    <div key={idx} className="group">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-subtle)] mb-1 group-hover:text-[var(--accent)] transition-colors">{item.label}</div>
                      <div className="text-sm font-semibold leading-snug">{item.value}</div>
                    </div>
                  ))}
                  {hasTemporaryScope && (
                    <div className="pt-4 border-t border-[var(--border)]/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--warning)] animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-subtle)]">{t('settings.temporaryAccess')}</span>
                      </div>
                      <div className="text-sm font-semibold text-[var(--warning)]">{temporaryAccessStateLabel}</div>
                      <div className="text-[10px] text-[var(--text-subtle)] mt-1">{temporaryAccessWindowLabel}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[var(--accent)]">
                  <Sparkles size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('settings.health')}</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: t('settings.profileCompleteness'), value: '92%', color: 'text-ok' },
                    { label: t('settings.securityPosture'), value: draft.mfaEnabled ? t('settings.hardened') : t('settings.needsMfa'), color: draft.mfaEnabled ? 'text-ok' : 'text-warning' },
                    { label: t('settings.routingHealth'), value: t('settings.operational'), color: 'text-info' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--border)]/30 last:border-0">
                      <span className="text-xs text-[var(--text-subtle)]">{item.label}</span>
                      <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--accent)]/[0.03] border border-[var(--accent)]/10">
                <div className="flex items-center gap-2 mb-3 text-[var(--accent)]">
                  <Lock size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{t('settings.policy')}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-subtle)]">
                  {t('settings.policyNotes')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
