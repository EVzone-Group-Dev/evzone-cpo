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
    <div className="flex items-start justify-between gap-4 py-5 first:pt-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-bold text-[var(--text)]">{label}</label>
        <div className="text-[11px] text-[var(--text-subtle)] mt-1 leading-relaxed">{description}</div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center justify-start rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${checked ? 'border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_15px_rgba(63,185,80,0.2)]' : 'border-[var(--border)] bg-[var(--bg-muted)]'}`}
      >
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ease-out ${checked ? 'translate-x-5 bg-white shadow-md' : 'translate-x-0.5 bg-[var(--text-subtle)]/60'}`}
        />
      </button>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: any, title: string, description?: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-dim)] to-transparent border border-[var(--accent)]/10 text-[var(--accent)] shadow-sm">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-black tracking-tight text-[var(--text)]">{title}</h3>
        {description && <p className="text-xs text-[var(--text-subtle)] font-medium">{description}</p>}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { user, replaceUser } = useAuthStore()
  const { i18n, t } = useTranslation()
  const { setThemeMode, themeMode } = useTheme()
  const {
    activeStationContext,
    activeTenant,
    availableCountries,
    availableCurrencies,
    availableLanguages,
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

  const profileCompleteness = useMemo(() => {
    const fields = [draft.name, draft.email, draft.tenantCountryCode, draft.tenantStateCode, draft.tenantCity]
    const filled = fields.filter(f => f && f.trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [draft])

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
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Modern Header - No Card Border */}
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-4">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative flex items-center gap-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-accent/30 group-hover:scale-105 transition-transform duration-500">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-lg animate-bounce-subtle">
                <Sparkles size={14} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-[var(--text)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--text)] to-[var(--text-subtle)]">{t('settings.workspaceSettings')}</h1>
              <p className="text-sm text-[var(--text-subtle)] mt-1.5 max-w-md font-medium leading-relaxed">
                {t('settings.workspaceDescription')}
              </p>
            </div>
          </div>
          
          <div className="relative flex flex-col items-start lg:items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] opacity-70">Cloud Sync</div>
                <div className="text-xs font-bold text-[var(--accent)]">{lastSavedAt ? t('settings.lastSaved', { time: lastSavedAt }) : t('settings.noSaved')}</div>
              </div>
              <button
                className={`btn h-12 px-8 ${hasUnsavedChanges ? 'primary shadow-[0_10px_25px_-5px_rgba(63,185,80,0.4)]' : 'secondary bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md'} transition-all duration-500 font-black flex items-center gap-2 rounded-2xl active:scale-95`}
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
              >
                <Save size={18} />
                {isSaving ? t('common.saving') : hasUnsavedChanges ? t('common.save') : t('common.saved')}
              </button>
            </div>
            {saveError && <p className="text-[11px] text-danger font-bold uppercase tracking-wide">{saveError}</p>}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_340px] px-2">
          <div className="space-y-20">
            {/* Profile Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SectionHeader icon={UserCog} title={t('settings.profile')} description="Identity and organization credentials" />
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="settings-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-subtle)] px-2">{t('settings.displayName')}</label>
                  <input
                    id="settings-name"
                    className="input h-12 rounded-2xl bg-[var(--bg-muted)]/20 border-[var(--border)]/60 focus:bg-[var(--bg-card)] focus:shadow-xl focus:shadow-accent/5 transition-all duration-300 px-5 text-sm font-semibold"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings-email" className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-subtle)] px-2">{t('settings.workEmail')}</label>
                  <input
                    id="settings-email"
                    type="email"
                    className="input h-12 rounded-2xl bg-[var(--bg-muted)]/20 border-[var(--border)]/60 focus:bg-[var(--bg-card)] focus:shadow-xl focus:shadow-accent/5 transition-all duration-300 px-5 text-sm font-semibold"
                    value={draft.email}
                    onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-10 grid gap-5 sm:grid-cols-3">
                {[
                  { label: t('settings.role'), value: getUserRoleLabel(user) },
                  { label: t('settings.tenant'), value: tenantDisplayName },
                  { label: t('settings.scopeType'), value: scopeType ?? 'tenant' }
                ].map((stat, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-muted)]/30 border border-[var(--border)]/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] mb-1.5 opacity-60">{stat.label}</div>
                    <div className="text-sm font-bold text-[var(--text)] truncate leading-tight">{stat.value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <SectionHeader icon={ShieldCheck} title={t('settings.security')} description="Protect your account and session integrity" />
              <div className="rounded-[32px] border border-[var(--border)]/60 bg-[var(--bg-card)]/50 backdrop-blur-xl divide-y divide-[var(--border)]/40 overflow-hidden shadow-2xl shadow-black/5">
                <div className="px-8 py-2">
                  <SettingToggle
                    id="settings-mfa"
                    label={t('settings.mfa')}
                    description={t('settings.mfaDescription')}
                    checked={draft.mfaEnabled}
                    onChange={(next) => setDraft((current) => ({ ...current, mfaEnabled: next }))}
                  />
                </div>
                <div className="px-8 py-2">
                  <SettingToggle
                    id="settings-access-alerts"
                    label={t('settings.accessAlerts')}
                    description={t('settings.accessAlertsDescription')}
                    checked={draft.recentAccessAlerts}
                    onChange={(next) => setDraft((current) => ({ ...current, recentAccessAlerts: next }))}
                  />
                </div>
                <div className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-muted)]/20">
                  <div className="flex-1">
                    <label htmlFor="settings-timeout" className="text-sm font-bold text-[var(--text)]">{t('settings.sessionTimeout')}</label>
                    <div className="text-[11px] text-[var(--text-subtle)] mt-1 font-medium italic opacity-80">Auto-logout after inactivity for security</div>
                  </div>
                  <div className="relative group">
                    <select
                      id="settings-timeout"
                      className="input w-full sm:w-48 h-11 rounded-xl bg-[var(--bg-card)] border-[var(--border)] shadow-sm font-bold text-xs pl-4 pr-10 appearance-none focus:ring-2 focus:ring-accent/20 transition-all"
                      value={draft.sessionTimeout}
                      onChange={(event) => setDraft((current) => ({ ...current, sessionTimeout: event.target.value as SessionTimeout }))}
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[var(--text-subtle)] pointer-events-none group-hover:text-accent transition-colors" size={16} />
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications & Interface */}
            <div className="grid gap-12 sm:grid-cols-2">
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <SectionHeader icon={BellRing} title={t('settings.notifications')} description="Manage automated report delivery" />
                <div className="rounded-3xl border border-[var(--border)]/60 bg-[var(--bg-card)] divide-y divide-[var(--border)]/40 overflow-hidden shadow-xl shadow-black/5">
                  <div className="px-7">
                    <SettingToggle
                      id="settings-digest"
                      label={t('settings.dailyDigest')}
                      description={t('settings.dailyDigestDescription')}
                      checked={draft.dailyDigest}
                      onChange={(next) => setDraft((current) => ({ ...current, dailyDigest: next }))}
                    />
                  </div>
                  <div className="px-7">
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

              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <SectionHeader icon={LayoutGrid} title={t('settings.interface')} description="Personalize your experience" />
                <div className="p-8 rounded-[32px] border border-[var(--border)]/60 bg-[var(--bg-card)] shadow-xl shadow-black/5 space-y-6 h-[calc(100%-76px)]">
                  <div className="space-y-2">
                    <label htmlFor="settings-theme" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] px-2">{t('settings.theme')}</label>
                    <select id="settings-theme" className="input h-11 rounded-xl bg-[var(--bg-muted)]/30 border-[var(--border)]/60 font-bold text-xs px-4 focus:bg-[var(--bg-card)] transition-all" value={themeMode} onChange={(event) => setThemeMode(event.target.value as 'system' | 'light' | 'dark')}>
                      <option value="system">System Default</option>
                      <option value="light">Light Aesthetic</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="settings-density" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] px-2">{t('settings.screenDensity')}</label>
                      <select id="settings-density" className="input h-11 rounded-xl bg-[var(--bg-muted)]/30 border-[var(--border)]/60 font-bold text-xs px-4" value={draft.screenDensity} onChange={(event) => setDraft((current) => ({ ...current, screenDensity: event.target.value as ScreenDensity }))}>
                        <option value="Comfortable">Comfortable</option>
                        <option value="Compact">Compact</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings-language" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] px-2">{t('settings.language')}</label>
                      <select id="settings-language" className="input h-11 rounded-xl bg-[var(--bg-muted)]/30 border-[var(--border)]/60 font-bold text-xs px-4" value={draft.language} onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))}>
                        {languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Provisioning */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <SectionHeader icon={Building2} title={t('settings.provisioning')} description="Geographical and operational placement" />
              <div className="p-10 rounded-[40px] border border-[var(--border)]/60 bg-[var(--bg-card)]/40 shadow-2xl shadow-black/5 grid gap-10 sm:grid-cols-3">
                {[
                  { id: 'settings-tenant-country', label: t('settings.country'), value: draft.tenantCountryCode, options: countryOptions, key: 'code2', onChange: (v: string) => setDraft(c => ({ ...c, tenantCountryCode: v, tenantStateCode: '', tenantCity: '' })) },
                  { id: 'settings-tenant-state', label: t('settings.state'), value: draft.tenantStateCode, options: tenantStates, key: 'code', loading: isTenantStatesLoading, placeholder: 'Select state', type: tenantStates.length > 0 ? 'select' : 'input', onChange: (v: string) => setDraft(c => ({ ...c, tenantStateCode: v, tenantCity: '' })) },
                  { id: 'settings-tenant-city', label: t('settings.city'), value: draft.tenantCity, options: tenantCities, key: 'name', loading: isTenantCitiesLoading, placeholder: 'Select city', type: tenantCities.length > 0 ? 'select' : 'input', onChange: (v: string) => setDraft(c => ({ ...c, tenantCity: v })) }
                ].map((field, i) => (
                  <div key={i} className="space-y-2.5">
                    <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] px-2">{field.label}</label>
                    {field.type === 'select' ? (
                      <select id={field.id} className="input h-12 rounded-2xl bg-[var(--bg-muted)]/20 border-[var(--border)]/60 font-bold text-[13px] px-5 transition-all" value={field.value} onChange={(e) => field.onChange(e.target.value)} disabled={field.id !== 'settings-tenant-country' && (!draft.tenantCountryCode || field.loading)}>
                        <option value="">{field.loading ? 'Loading...' : field.placeholder || 'Select...'}</option>
                        {field.options?.map((opt: any) => <option key={opt[field.key || '']} value={opt[field.key || '']}>{opt.name}</option>)}
                      </select>
                    ) : (
                      <input id={field.id} className="input h-12 rounded-2xl bg-[var(--bg-muted)]/20 border-[var(--border)]/60 font-bold text-[13px] px-5" value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder={draft.tenantCountryCode ? field.placeholder : 'Select country first'} disabled={!draft.tenantCountryCode} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 px-6 py-4 rounded-2xl bg-[var(--bg-muted)]/10 border border-dashed border-[var(--border)]/60 text-[11px] text-[var(--text-subtle)] flex items-center gap-3 font-medium">
                <Globe2 size={16} className="text-accent/60" /> {t('settings.geographyNotes')}
              </div>
            </section>
          </div>

          {/* Right Sidebar - Sticky & Clean */}
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="sticky top-8 space-y-10">
              <div className="p-8 rounded-[32px] bg-gradient-to-br from-[var(--bg-muted)]/40 to-transparent border border-[var(--border)]/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors duration-700" />
                <div className="flex items-center gap-3 mb-8 text-[var(--accent)]">
                  <SlidersHorizontal size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">{t('settings.scope')}</span>
                </div>
                <div className="space-y-7 relative">
                  {[
                    { label: t('settings.activeTenant'), value: activeTenant?.name ?? 'Platform' },
                    { label: t('settings.activeStation'), value: activeStationDisplayName },
                    { label: t('settings.region'), value: activeTenant?.region ?? '-' },
                    { label: t('settings.coverage'), value: dataScopeLabel },
                  ].map((item, idx) => (
                    <div key={idx} className="group/item">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)] mb-1.5 opacity-60 group-hover/item:text-[var(--accent)] transition-colors duration-300">{item.label}</div>
                      <div className="text-[13px] font-bold leading-tight tracking-tight">{item.value}</div>
                    </div>
                  ))}
                  {hasTemporaryScope && (
                    <div className="pt-6 border-t border-[var(--border)]/40">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="h-2 w-2 rounded-full bg-[var(--warning)] shadow-[0_0_8px_rgba(187,128,9,0.5)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)]">{t('settings.temporaryAccess')}</span>
                      </div>
                      <div className="text-sm font-black text-[var(--warning)]">{temporaryAccessStateLabel}</div>
                      <div className="text-[10px] text-[var(--text-subtle)] mt-1.5 font-bold opacity-70 tracking-tight">{temporaryAccessWindowLabel}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-[var(--bg-card)]/60 backdrop-blur-xl border border-[var(--border)]/60 shadow-2xl shadow-black/5">
                <div className="flex items-center gap-3 mb-6 text-[var(--accent)]">
                  <Sparkles size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">{t('settings.health')}</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t('settings.profileCompleteness'), value: `${profileCompleteness}%`, color: profileCompleteness > 80 ? 'text-ok' : 'text-warning' },
                    { label: t('settings.securityPosture'), value: draft.mfaEnabled ? t('settings.hardened') : t('settings.needsMfa'), color: draft.mfaEnabled ? 'text-ok' : 'text-warning' },
                    { label: t('settings.routingHealth'), value: t('settings.operational'), color: 'text-info' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-[var(--border)]/30 last:border-0 hover:translate-x-1 transition-transform duration-300">
                      <span className="text-xs font-bold text-[var(--text-subtle)] opacity-80">{item.label}</span>
                      <span className={`text-[13px] font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-gradient-to-br from-[var(--accent)]/[0.05] to-transparent border border-[var(--accent)]/10">
                <div className="flex items-center gap-3 mb-4 text-[var(--accent)]">
                  <Lock size={18} />
                  <span className="text-[11px] font-black uppercase tracking-[0.25em]">{t('settings.policy')}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-subtle)] font-medium opacity-80 italic">
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
