import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { Bell, Settings } from 'lucide-react'
import { PATHS } from '@/router/paths'

interface Props {
  children: ReactNode
  pageTitle?: string
  actions?: ReactNode
}

export function DashboardLayout({ children, pageTitle, actions }: Props) {
  const { user } = useAuthStore()
  const { activeTenant, availableTenants, canSwitchTenants, isLoading, setActiveTenantId } = useTenant()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
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
              <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[#0d1117] font-bold text-xs ml-1">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page scroll area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
