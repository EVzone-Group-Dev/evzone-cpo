import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  canAccessPolicy,
  getUserRoleLabel,
  type AccessPolicyKey,
} from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { PATHS } from '@/router/paths'
import {
  LayoutDashboard, Cpu, Activity, AlertTriangle, Bell,
  DollarSign, BarChart3, Users, Globe2, FileText,
  Webhook, Puzzle, ShieldCheck, TrendingUp, ChevronLeft,
  ChevronRight, BookOpen, Gauge, Network, RefreshCw, Package, Settings, LogOut,
} from 'lucide-react'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  policy: AccessPolicyKey
  label: string
  icon: React.ReactNode
  path: string
}

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={16} />, path: PATHS.DASHBOARD, policy: 'dashboardHome' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Stations', icon: <Cpu size={16} />, path: PATHS.STATIONS, policy: 'stationsRead' },
      { label: 'Charge Points', icon: <Gauge size={16} />, path: PATHS.CHARGE_POINTS, policy: 'chargePointsRead' },
      { label: 'Swap Stations', icon: <RefreshCw size={16} />, path: PATHS.SWAP_STATIONS, policy: 'swapStationsRead' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Sessions', icon: <Activity size={16} />, path: PATHS.SESSIONS, policy: 'sessionsRead' },
      { label: 'Reservations', icon: <BookOpen size={16} />, path: PATHS.RESERVATIONS, policy: 'reservationsRead' },
      { label: 'Fleet', icon: <Users size={16} />, path: PATHS.FLEET, policy: 'fleetRead' },
      { label: 'Swap Sessions', icon: <RefreshCw size={16} />, path: PATHS.SWAP_SESSIONS, policy: 'swapSessionsRead' },
      { label: 'Incidents', icon: <AlertTriangle size={16} />, path: PATHS.INCIDENTS, policy: 'incidentsRead' },
      { label: 'Alerts', icon: <Bell size={16} />, path: PATHS.ALERTS, policy: 'alertsRead' },
    ],
  },
  {
    label: 'Energy',
    items: [
      { label: 'Smart Charging', icon: <Gauge size={16} />, path: PATHS.SMART_CHARGING, policy: 'smartChargingRead' },
      { label: 'Load Policy', icon: <TrendingUp size={16} />, path: PATHS.LOAD_POLICY, policy: 'loadPoliciesRead' },
      { label: 'Battery Inventory', icon: <Package size={16} />, path: PATHS.BATTERY_INVENTORY, policy: 'batteryInventoryRead' },
    ],
  },
  {
    label: 'Roaming (OCPI)',
    items: [
      { label: 'Partners', icon: <Network size={16} />, path: PATHS.OCPI_PARTNERS, policy: 'roamingRead' },
      { label: 'Sessions', icon: <Activity size={16} />, path: PATHS.OCPI_SESSIONS, policy: 'roamingRead' },
      { label: 'Commands', icon: <RefreshCw size={16} />, path: PATHS.OCPI_COMMANDS, policy: 'roamingRead' },
      { label: 'CDR Ledger', icon: <BookOpen size={16} />, path: PATHS.OCPI_CDRS, policy: 'roamingRead' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Tariffs', icon: <DollarSign size={16} />, path: PATHS.TARIFFS, policy: 'tariffsRead' },
      { label: 'Billing', icon: <FileText size={16} />, path: PATHS.BILLING, policy: 'billingRead' },
      { label: 'Payouts', icon: <TrendingUp size={16} />, path: PATHS.PAYOUTS, policy: 'payoutsRead' },
      { label: 'Settlement', icon: <ShieldCheck size={16} />, path: PATHS.SETTLEMENT, policy: 'settlementRead' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Reports', icon: <BarChart3 size={16} />, path: PATHS.REPORTS, policy: 'reportsRead' },
      { label: 'Team', icon: <Users size={16} />, path: PATHS.TEAM, policy: 'teamRead' },
      { label: 'Audit Logs', icon: <FileText size={16} />, path: PATHS.AUDIT_LOGS, policy: 'auditLogsRead' },
      { label: 'Webhooks', icon: <Webhook size={16} />, path: PATHS.WEBHOOKS, policy: 'platformAdminRead' },
      { label: 'Integrations', icon: <Puzzle size={16} />, path: PATHS.INTEGRATIONS, policy: 'platformAdminRead' },
      { label: 'Protocols', icon: <Globe2 size={16} />, path: PATHS.PROTOCOLS, policy: 'platformAdminRead' },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { activeTenant } = useTenant()
  const [collapsed, setCollapsed] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  return (
    <aside
      className={`flex flex-col h-screen bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
      style={{ flexShrink: 0 }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)] min-h-[57px]">
        <img
          src="/assets/logos/cpms.png"
          alt="EVzone CPO"
          className="w-7 h-7 flex-shrink-0 object-contain"
          //title="EVzone CPO Platform"
        />
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
          const visibleItems = group.items.filter((item) => canAccessPolicy(user, item.policy))
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
              <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-xs flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</div>
                  <div className="text-[10px] text-[var(--text-subtle)] truncate">{getUserRoleLabel(user)}</div>
                  {activeTenant && (
                    <div className="text-[10px] text-[var(--accent)] truncate">{activeTenant.name}</div>
                  )}
                </div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div className={`mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 ${collapsed ? 'absolute right-3 bottom-14 w-44 z-50 shadow-2xl' : ''}`}>
                {canAccessPolicy(user, 'settingsRead') && (
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
