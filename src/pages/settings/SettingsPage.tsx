import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getTemporaryAccessState, getTemporaryAccessWindowLabel, getUserRoleLabel, getUserScopeType, isTemporaryScopeUser } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { BellRing, Building2, Globe2, LayoutGrid, Lock, Save, ShieldCheck, SlidersHorizontal, Sparkles, UserCog } from 'lucide-react'

type ScreenDensity = 'Comfortable' | 'Compact'
type LanguagePreference = 'English' | 'Swahili'
type SessionTimeout = '15 minutes' | '30 minutes' | '1 hour'

interface SettingsDraft {
  dailyDigest: boolean
  email: string
  language: LanguagePreference
  mfaEnabled: boolean
  name: string
  recentAccessAlerts: boolean
  screenDensity: ScreenDensity
  sessionTimeout: SessionTimeout
  weeklyOpsReport: boolean
}

function buildInitialDraft(userName: string, userEmail: string, mfaEnabled: boolean): SettingsDraft {
  return {
    dailyDigest: true,
    email: userEmail,
    language: 'English',
    mfaEnabled,
    name: userName,
    recentAccessAlerts: true,
    screenDensity: 'Comfortable',
    sessionTimeout: '30 minutes',
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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-bg-muted border border-border'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { user } = useAuthStore()
  const { activeStationContext, activeTenant, availableStationContexts, availableTenants, dataScopeLabel } = useTenant()
  const userName = user?.name ?? ''
  const userEmail = user?.email ?? ''
  const mfaEnabled = user?.mfaEnabled ?? false
  const [draft, setDraft] = useState<SettingsDraft>(() => buildInitialDraft(userName, userEmail, mfaEnabled))
  const [baseline, setBaseline] = useState<SettingsDraft>(() => buildInitialDraft(userName, userEmail, mfaEnabled))
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

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

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(baseline)

  const handleSaveChanges = () => {
    if (!hasUnsavedChanges || isSaving) {
      return
    }

    setIsSaving(true)
    window.setTimeout(() => {
      setBaseline(draft)
      setLastSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
      setIsSaving(false)
    }, 900)
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
                      <div className="form-label">Organization</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{user?.activeOrganizationId ?? user?.organizationId ?? 'Platform-wide access'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="form-label">Scope Type</div>
                      <div className="rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2 text-sm">{scopeType ?? 'organization'}</div>
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
              <div className="grid gap-3 md:grid-cols-2">
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
                    onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as LanguagePreference }))}
                  >
                    <option value="English">English</option>
                    <option value="Swahili">Swahili</option>
                  </select>
                </div>
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
                Tenant governance, role restrictions, and scope isolation remain policy-driven. UI changes here update local user preferences and
                are intended for operator workflow optimization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
