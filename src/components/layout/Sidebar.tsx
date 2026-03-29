import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ACCESS_POLICY,
  canAccessRole,
} from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import type { CPORole } from '@/core/types/domain'
import { PATHS } from '@/router/paths'
import {
  LayoutDashboard, Zap, Cpu, Activity, AlertTriangle, Bell,
  DollarSign, BarChart3, Users, Globe2, FileText,
  Webhook, Puzzle, ShieldCheck, TrendingUp, ChevronLeft,
  ChevronRight, BookOpen, Gauge, Network, RefreshCw, Package, Settings, LogOut,
} from 'lucide-react'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  allowedRoles: readonly CPORole[]
  label: string
  icon: React.ReactNode
  path: string
}

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={16} />, path: PATHS.DASHBOARD, allowedRoles: ACCESS_POLICY.dashboardHome },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Stations', icon: <Zap size={16} />, path: PATHS.STATIONS, allowedRoles: ACCESS_POLICY.stationsRead },
      { label: 'Charge Points', icon: <Cpu size={16} />, path: PATHS.CHARGE_POINTS, allowedRoles: ACCESS_POLICY.chargePointsRead },
      { label: 'Swap Stations', icon: <RefreshCw size={16} />, path: PATHS.SWAP_STATIONS, allowedRoles: ACCESS_POLICY.swapStationsRead },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Sessions', icon: <Activity size={16} />, path: PATHS.SESSIONS, allowedRoles: ACCESS_POLICY.sessionsRead },
      { label: 'Swap Sessions', icon: <RefreshCw size={16} />, path: PATHS.SWAP_SESSIONS, allowedRoles: ACCESS_POLICY.swapSessionsRead },
      { label: 'Incidents', icon: <AlertTriangle size={16} />, path: PATHS.INCIDENTS, allowedRoles: ACCESS_POLICY.incidentsRead },
      { label: 'Alerts', icon: <Bell size={16} />, path: PATHS.ALERTS, allowedRoles: ACCESS_POLICY.alertsRead },
    ],
  },
  {
    label: 'Energy',
    items: [
      { label: 'Smart Charging', icon: <Gauge size={16} />, path: PATHS.SMART_CHARGING, allowedRoles: ACCESS_POLICY.smartChargingRead },
      { label: 'Load Policy', icon: <TrendingUp size={16} />, path: PATHS.LOAD_POLICY, allowedRoles: ACCESS_POLICY.loadPoliciesRead },
      { label: 'Battery Inventory', icon: <Package size={16} />, path: PATHS.BATTERY_INVENTORY, allowedRoles: ACCESS_POLICY.batteryInventoryRead },
    ],
  },
  {
    label: 'Roaming (OCPI)',
    items: [
      { label: 'Partners', icon: <Network size={16} />, path: PATHS.OCPI_PARTNERS, allowedRoles: ACCESS_POLICY.roamingRead },
      { label: 'CDR Ledger', icon: <BookOpen size={16} />, path: PATHS.OCPI_CDRS, allowedRoles: ACCESS_POLICY.roamingRead },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Tariffs', icon: <DollarSign size={16} />, path: PATHS.TARIFFS, allowedRoles: ACCESS_POLICY.tariffsRead },
      { label: 'Billing', icon: <FileText size={16} />, path: PATHS.BILLING, allowedRoles: ACCESS_POLICY.billingRead },
      { label: 'Payouts', icon: <TrendingUp size={16} />, path: PATHS.PAYOUTS, allowedRoles: ACCESS_POLICY.payoutsRead },
      { label: 'Settlement', icon: <ShieldCheck size={16} />, path: PATHS.SETTLEMENT, allowedRoles: ACCESS_POLICY.settlementRead },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Reports', icon: <BarChart3 size={16} />, path: PATHS.REPORTS, allowedRoles: ACCESS_POLICY.reportsRead },
      { label: 'Team', icon: <Users size={16} />, path: PATHS.TEAM, allowedRoles: ACCESS_POLICY.teamRead },
      { label: 'Audit Logs', icon: <FileText size={16} />, path: PATHS.AUDIT_LOGS, allowedRoles: ACCESS_POLICY.auditLogsRead },
      { label: 'Webhooks', icon: <Webhook size={16} />, path: PATHS.WEBHOOKS, allowedRoles: ACCESS_POLICY.platformAdminRead },
      { label: 'Integrations', icon: <Puzzle size={16} />, path: PATHS.INTEGRATIONS, allowedRoles: ACCESS_POLICY.platformAdminRead },
      { label: 'Protocols', icon: <Globe2 size={16} />, path: PATHS.PROTOCOLS, allowedRoles: ACCESS_POLICY.platformAdminRead },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { activeTenant } = useTenant()
  const [collapsed, setCollapsed] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const userRole = user?.role

  return (
    <aside
      className={`flex flex-col h-screen bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
      style={{ flexShrink: 0 }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)] min-h-[57px]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-[#0d1117]" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-sm tracking-tight text-[var(--text)]">
            EVzone <span className="text-[var(--accent)]">CPO</span>
          </span>
        )}
        <button
          onClick={() => {
            setIsProfileMenuOpen(false)
            setCollapsed((c) => !c)
          }}
          className="ml-auto btn ghost icon"
          style={{ flexShrink: 0 }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto py-2 space-y-1">
        {NAV.map(group => {
          const visibleItems = group.items.filter((item) => canAccessRole(userRole, item.allowedRoles))
          if (visibleItems.length === 0) return null

          return (
          <div key={group.label}>
            {!collapsed && (
              <div className="nav-group-label">{group.label}</div>
            )}
            {visibleItems.map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] px-3 py-3 relative">
        {user && (
          <>
            <button
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className={`w-full flex items-center gap-2 rounded-lg border border-transparent hover:border-[var(--border)] transition-colors ${collapsed ? 'justify-center px-0 py-1' : 'px-2 py-1.5'}`}
              aria-label="Open sidebar profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[#0d1117] font-bold text-xs flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</div>
                  <div className="text-[10px] text-[var(--text-subtle)] truncate">{user.role}</div>
                  {activeTenant && (
                    <div className="text-[10px] text-[var(--accent)] truncate">{activeTenant.name}</div>
                  )}
                </div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className={`mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 ${collapsed ? 'absolute right-3 bottom-14 w-44 z-50 shadow-2xl' : ''}`}>
                {canAccessRole(userRole, ACCESS_POLICY.settingsRead) && (
                  <Link
                    to={PATHS.SETTINGS}
                    className="nav-item"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="nav-item w-full text-left"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
