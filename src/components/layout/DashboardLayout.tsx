import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sidebar } from '@/components/layout/Sidebar'
import { getTemporaryAccessState, getTemporaryAccessWindowLabel, getUserRoleLabel, isTemporaryScopeUser } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { useBranding } from '@/core/branding/useBranding'
import { Bell, Globe2, LogOut, Menu, Search, Settings } from 'lucide-react'
import { PATHS } from '@/router/paths'
import { LOGO_PATHS } from '@/utils/assets'
import { LocalizationPopover } from '@/components/layout/LocalizationPopover'

interface Props {
  children: ReactNode
  pageTitle?: string
  actions?: ReactNode
}

export function DashboardLayout({ children, pageTitle, actions }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const {
    activeTenant,
    activeStationContext,
    availableStationContexts,
    canSwitchStationContexts,
    isLoading,
    setActiveStationContextId,
  } = useTenant()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const temporaryAccessState = getTemporaryAccessState(user)
  const temporaryAccessLabel = getTemporaryAccessWindowLabel(user)
  const hasTemporaryScope = isTemporaryScopeUser(user)
  const hasActiveAssistedProxySession = Boolean(
    user?.assistedProxySessionId
    && user.assistedProxyStatus === 'ACTIVE'
    && user.assistedProxyTenantId,
  )
  const { branding } = useBranding()
  const [isLocalizationOpen, setIsLocalizationOpen] = useState(false)
  const headerLogoUrl = branding.branding.logoUrl || branding.branding.logoIconUrl || LOGO_PATHS.cpms

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', minHeight: 57 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="btn ghost icon lg:hidden"
            aria-label="Open navigation"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          <img src={headerLogoUrl} alt={branding.branding.shortName} className="h-6 w-auto max-w-[148px] object-contain" />
          <span className="sr-only">{pageTitle ?? branding.branding.appName}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <label
              className="hidden lg:flex items-center gap-2 rounded-xl border px-3 h-9 min-w-[220px] xl:min-w-[280px]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <Search size={14} style={{ color: 'var(--text-subtle)' }} />
              <input
                type="search"
                className="w-full bg-transparent text-sm outline-none border-0 p-0"
                placeholder={t('common.search')}
                aria-label={t('common.search')}
              />
            </label>
            {(activeStationContext || canSwitchStationContexts) && (
              <div className="hidden xl:flex flex-wrap items-center justify-end gap-2 min-w-0">
                {(activeStationContext || canSwitchStationContexts) && (
                  <div className="flex items-center gap-3 rounded-xl border px-3 py-2 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="text-right leading-tight shrink-0">
                      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{t('dashboard.stationContext')}</div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {activeStationContext?.stationName ?? t('dashboard.assignedStations')}
                      </div>
                    </div>
                    {canSwitchStationContexts ? (
                      <select
                        className="input !h-9 !py-0 min-w-[220px] xl:min-w-[260px]"
                        value={activeStationContext?.assignmentId ?? ''}
                        onChange={(event) => setActiveStationContextId(event.target.value)}
                        disabled={isLoading}
                        aria-label="Switch station context"
                      >
                        {availableStationContexts.map((context) => (
                          <option key={context.assignmentId} value={context.assignmentId}>
                            {(context.stationName ?? 'Unassigned station')} · {context.role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[11px] text-subtle max-w-[220px] truncate">
                        {activeStationContext?.role ?? 'Scoped access'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {actions}
            <div className="relative">
              <button 
                type="button" 
                className={`btn icon ${isLocalizationOpen ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]' : 'ghost'}`}
                title={t('common.localization')}
                onClick={() => setIsLocalizationOpen(!isLocalizationOpen)}
              >
                <Globe2 size={16} />
              </button>
              <LocalizationPopover 
                isOpen={isLocalizationOpen} 
                onClose={() => setIsLocalizationOpen(false)} 
              />
            </div>
            <Link to={PATHS.NOTIFICATIONS} className="btn ghost icon" title={t('common.notifications')}>
              <Bell size={16} />
            </Link>
            {user && (
              <div className="relative ml-1" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-xs border border-transparent hover:border-[var(--accent)] transition-colors"
                  aria-label="Open profile menu"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-2xl">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <div className="text-sm font-semibold text-[var(--text)]">{user.name}</div>
                      <div className="text-[11px] text-[var(--text-subtle)]">{getUserRoleLabel(user)}</div>
                      {activeTenant && (
                        <div className="text-[11px] text-[var(--accent)] mt-1">{activeTenant.name}</div>
                      )}
                      {activeStationContext && (
                        <div className="text-[11px] text-[var(--text-subtle)] mt-1">
                          {activeStationContext.stationName ?? 'Unassigned station'}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 space-y-1">
                      <Link
                        to={PATHS.SETTINGS}
                        className="nav-item"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings size={16} />
                        <span>{t('nav.items.accountSettings')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          logout()
                        }}
                        className="nav-item w-full text-left"
                      >
                        <LogOut size={16} />
                        <span>{t('common.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </header>

      {hasTemporaryScope && (
        <div
          className="border-b px-4 sm:px-6 py-3"
          style={{
            borderColor: temporaryAccessState === 'expired' ? 'var(--danger)' : temporaryAccessState === 'upcoming' ? 'var(--warning)' : 'var(--border)',
            background: temporaryAccessState === 'expired'
              ? 'rgba(248, 81, 73, 0.08)'
              : temporaryAccessState === 'upcoming'
                ? 'rgba(187, 128, 9, 0.12)'
                : 'rgba(63, 185, 80, 0.08)',
          }}
        >
          <div className="flex flex-col gap-1 text-sm">
            <div className="font-semibold" style={{ color: temporaryAccessState === 'expired' ? 'var(--danger)' : 'var(--text)' }}>
              {temporaryAccessState === 'expired'
                ? 'Temporary station access expired'
                : temporaryAccessState === 'upcoming'
                  ? 'Temporary station access scheduled'
                  : 'Temporary station access active'}
            </div>
            <div style={{ color: 'var(--text-subtle)' }}>
              {activeStationContext?.stationName ?? 'Assigned station scope'} · {temporaryAccessLabel}
            </div>
          </div>
        </div>
      )}

      {hasActiveAssistedProxySession && (
        <div
          className="border-b px-4 sm:px-6 py-3"
          style={{
            borderColor: 'var(--accent)',
            background: 'rgba(58, 130, 246, 0.1)',
          }}
        >
          <div className="flex flex-col gap-1 text-sm">
            <div className="font-semibold" style={{ color: 'var(--text)' }}>
              Assisted Onboarding Mode Active
            </div>
            <div style={{ color: 'var(--text-subtle)' }}>
              You are configuring tenant {user?.assistedProxyTenantId} under session {user?.assistedProxySessionId}.
            </div>
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 z-20 bg-black/40 transition-opacity duration-200 lg:hidden ${isMobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          aria-hidden="true"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        <div className="hidden h-full lg:block">
          <Sidebar mode="desktop" />
        </div>
        <div
          className={`absolute inset-y-0 left-0 z-30 transform transition-transform duration-200 lg:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar mode="mobile" onRequestClose={() => setIsMobileSidebarOpen(false)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Page scroll area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
