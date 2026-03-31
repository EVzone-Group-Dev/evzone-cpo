import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { Bell, LogOut, Settings } from 'lucide-react'
import { PATHS } from '@/router/paths'

interface Props {
  children: ReactNode
  pageTitle?: string
  actions?: ReactNode
}

export function DashboardLayout({ children, pageTitle, actions }: Props) {
  const { user, logout } = useAuthStore()
  const { activeTenant, availableTenants, canSwitchTenants, isLoading, setActiveTenantId } = useTenant()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', minHeight: 57 }}
        >
          {pageTitle ? (
            <h1 className="text-base font-bold text-[var(--text)]">{pageTitle}</h1>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {activeTenant && (
              <div className="hidden lg:flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                <div className="text-right leading-tight">
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>{activeTenant.scopeLabel}</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{activeTenant.name}</div>
                </div>
                {canSwitchTenants && (
                  <select
                    className="input !h-9 !py-0 !min-w-[220px]"
                    value={activeTenant.id}
                    onChange={(event) => setActiveTenantId(event.target.value)}
                    disabled={isLoading}
                  >
                    {availableTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            {actions}
            <Link to={PATHS.NOTIFICATIONS} className="btn ghost icon" title="Notifications">
              <Bell size={16} />
            </Link>
            <Link to={PATHS.SETTINGS} className="btn ghost icon" title="Settings">
              <Settings size={16} />
            </Link>
            {user && (
              <div className="relative ml-1" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[#0d1117] font-bold text-xs border border-transparent hover:border-[var(--accent)] transition-colors"
                  aria-label="Open profile menu"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-2xl">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <div className="text-sm font-semibold text-[var(--text)]">{user.name}</div>
                      <div className="text-[11px] text-[var(--text-subtle)]">{user.role}</div>
                      {activeTenant && (
                        <div className="text-[11px] text-[var(--accent)] mt-1">{activeTenant.name}</div>
                      )}
                    </div>
                    <div className="pt-2 space-y-1">
                      <Link
                        to={PATHS.SETTINGS}
                        className="nav-item"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings size={16} />
                        <span>Account Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          logout()
                        }}
                        className="nav-item w-full text-left"
                      >
                        <LogOut size={16} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page scroll area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
