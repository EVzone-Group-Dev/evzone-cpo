import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { PATHS } from '@/router/paths'
import {
  LayoutDashboard, Zap, Cpu, Activity, AlertTriangle, Bell,
  DollarSign, BarChart3, Users, Settings, Globe2, FileText,
  Webhook, Puzzle, ShieldCheck, TrendingUp, ChevronLeft,
  ChevronRight, LogOut, BookOpen, Gauge, Network,
} from 'lucide-react'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',    icon: <LayoutDashboard size={16} />, path: PATHS.DASHBOARD },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { label: 'Stations',       icon: <Zap size={16} />,         path: PATHS.STATIONS },
      { label: 'Charge Points',  icon: <Cpu size={16} />,         path: PATHS.CHARGE_POINTS },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Sessions',   icon: <Activity size={16} />,      path: PATHS.SESSIONS },
      { label: 'Incidents',  icon: <AlertTriangle size={16} />, path: PATHS.INCIDENTS },
      { label: 'Alerts',     icon: <Bell size={16} />,          path: PATHS.ALERTS },
    ],
  },
  {
    label: 'Energy',
    items: [
      { label: 'Smart Charging', icon: <Gauge size={16} />,    path: PATHS.SMART_CHARGING },
      { label: 'Load Policy',    icon: <TrendingUp size={16} />, path: PATHS.LOAD_POLICY },
    ],
  },
  {
    label: 'Roaming (OCPI)',
    items: [
      { label: 'Partners',  icon: <Network size={16} />, path: PATHS.OCPI_PARTNERS },
      { label: 'CDR Ledger',  icon: <BookOpen size={16} />, path: PATHS.OCPI_CDRS },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Tariffs',     icon: <DollarSign size={16} />, path: PATHS.TARIFFS },
      { label: 'Billing',     icon: <FileText size={16} />,   path: PATHS.BILLING },
      { label: 'Payouts',     icon: <TrendingUp size={16} />, path: PATHS.PAYOUTS },
      { label: 'Settlement',  icon: <ShieldCheck size={16} />,path: PATHS.SETTLEMENT },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Reports',      icon: <BarChart3 size={16} />,  path: PATHS.REPORTS },
      { label: 'Team',         icon: <Users size={16} />,      path: PATHS.TEAM },
      { label: 'Audit Logs',   icon: <FileText size={16} />,   path: PATHS.AUDIT_LOGS },
      { label: 'Webhooks',     icon: <Webhook size={16} />,    path: PATHS.WEBHOOKS },
      { label: 'Integrations', icon: <Puzzle size={16} />,     path: PATHS.INTEGRATIONS },
      { label: 'Protocols',    icon: <Globe2 size={16} />,     path: PATHS.PROTOCOLS },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { activeTenant } = useTenant()
  const [collapsed, setCollapsed] = useState(false)

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
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto btn ghost icon"
          style={{ flexShrink: 0 }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1">
        {NAV.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div className="nav-group-label">{group.label}</div>
            )}
            {group.items.map(item => {
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
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] px-3 py-3 space-y-1">
        <Link to={PATHS.SETTINGS} className="nav-item" title={collapsed ? 'Settings' : undefined}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button onClick={logout} className="nav-item w-full text-left">
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 pt-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[#0d1117] font-bold text-xs flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</div>
              <div className="text-[10px] text-[var(--text-subtle)] truncate">{user.role}</div>
              {activeTenant && (
                <div className="text-[10px] text-[var(--accent)] truncate">{activeTenant.name}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
