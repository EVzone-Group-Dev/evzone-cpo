import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  canAccessPolicy,
  getUserRoleLabel,
  type AccessPolicyKey,
} from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { useTenant } from "@/core/hooks/useTenant";
import { usePlatformFeatureFlags } from "@/core/hooks/usePlatformData";
import { canAccessTenantCpoScopedNavItem } from "@/core/tenancy/cpoType";
import type { TenantCpoType } from "@/core/types/domain";
import { PATHS } from "@/router/paths";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  AlertTriangle,
  Bell,
  DollarSign,
  BarChart3,
  Users,
  Globe2,
  FileText,
  Webhook,
  Puzzle,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Gauge,
  Network,
  RefreshCw,
  Package,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

interface NavItem {
  policy: AccessPolicyKey;
  featureFlag?: "pnc_v1" | "enterprise_sso_v1";
  tenantCpoTypes?: readonly TenantCpoType[];
  labelKey: string;
  icon: React.ReactNode;
  path: string;
}

const NAV: NavGroup[] = [
  {
    labelKey: "nav.groups.overview",
    items: [
      {
        labelKey: "nav.items.dashboard",
        icon: <LayoutDashboard size={16} />,
        path: PATHS.DASHBOARD,
        policy: "dashboardHome",
      },
    ],
  },
  {
    labelKey: "nav.groups.infrastructure",
    items: [
      {
        labelKey: "nav.items.stations",
        icon: <Cpu size={16} />,
        path: PATHS.STATIONS,
        policy: "stationsRead",
      },
      {
        labelKey: "nav.items.chargePoints",
        icon: <Gauge size={16} />,
        path: PATHS.CHARGE_POINTS,
        policy: "chargePointsRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.swapStations",
        icon: <RefreshCw size={16} />,
        path: PATHS.SWAP_STATIONS,
        policy: "swapStationsRead",
        tenantCpoTypes: ["SWAP", "HYBRID"],
      },
    ],
  },
  {
    labelKey: "nav.groups.operations",
    items: [
      {
        labelKey: "nav.items.sessions",
        icon: <Activity size={16} />,
        path: PATHS.SESSIONS,
        policy: "sessionsRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.reservations",
        icon: <BookOpen size={16} />,
        path: PATHS.RESERVATIONS,
        policy: "reservationsRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.fleet",
        icon: <Users size={16} />,
        path: PATHS.FLEET,
        policy: "fleetRead",
      },
      {
        labelKey: "nav.items.swapSessions",
        icon: <RefreshCw size={16} />,
        path: PATHS.SWAP_SESSIONS,
        policy: "swapSessionsRead",
        tenantCpoTypes: ["SWAP", "HYBRID"],
      },
      {
        labelKey: "nav.items.incidents",
        icon: <AlertTriangle size={16} />,
        path: PATHS.INCIDENTS,
        policy: "incidentsRead",
      },
      {
        labelKey: "nav.items.alerts",
        icon: <Bell size={16} />,
        path: PATHS.ALERTS,
        policy: "alertsRead",
      },
    ],
  },
  {
    labelKey: "nav.groups.energy",
    items: [
      {
        labelKey: "nav.items.smartCharging",
        icon: <Gauge size={16} />,
        path: PATHS.SMART_CHARGING,
        policy: "smartChargingRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.loadPolicy",
        icon: <TrendingUp size={16} />,
        path: PATHS.LOAD_POLICY,
        policy: "loadPoliciesRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.derOrchestration",
        icon: <Activity size={16} />,
        path: PATHS.DER_ORCHESTRATION,
        policy: "derOrchestrationRead",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.batteryInventory",
        icon: <Package size={16} />,
        path: PATHS.BATTERY_INVENTORY,
        policy: "batteryInventoryRead",
        tenantCpoTypes: ["SWAP", "HYBRID"],
      },
    ],
  },
  {
    labelKey: "nav.groups.roaming",
    items: [
      {
        labelKey: "nav.items.partners",
        icon: <Network size={16} />,
        path: PATHS.OCPI_PARTNERS,
        policy: "roamingRead",
      },
      {
        labelKey: "nav.items.sessions",
        icon: <Activity size={16} />,
        path: PATHS.OCPI_SESSIONS,
        policy: "roamingRead",
      },
      {
        labelKey: "nav.items.sessions",
        icon: <RefreshCw size={16} />,
        path: PATHS.OCPI_COMMANDS,
        policy: "roamingRead",
      },
      {
        labelKey: "nav.items.cdrLedger",
        icon: <BookOpen size={16} />,
        path: PATHS.OCPI_CDRS,
        policy: "roamingRead",
      },
    ],
  },
  {
    labelKey: "nav.groups.finance",
    items: [
      {
        labelKey: "nav.items.tariffs",
        icon: <DollarSign size={16} />,
        path: PATHS.TARIFFS,
        policy: "tariffsRead",
      },
      {
        labelKey: "nav.items.billing",
        icon: <FileText size={16} />,
        path: PATHS.BILLING,
        policy: "billingRead",
      },
      {
        labelKey: "nav.items.payouts",
        icon: <TrendingUp size={16} />,
        path: PATHS.PAYOUTS,
        policy: "payoutsRead",
      },
      {
        labelKey: "nav.items.settlement",
        icon: <ShieldCheck size={16} />,
        path: PATHS.SETTLEMENT,
        policy: "settlementRead",
      },
    ],
  },
  {
    labelKey: "nav.groups.platform",
    items: [
      {
        labelKey: "nav.items.reports",
        icon: <BarChart3 size={16} />,
        path: PATHS.REPORTS,
        policy: "reportsRead",
      },
      {
        labelKey: "nav.items.team",
        icon: <Users size={16} />,
        path: PATHS.TEAM,
        policy: "teamRead",
      },
      {
        labelKey: "nav.items.auditLogs",
        icon: <FileText size={16} />,
        path: PATHS.AUDIT_LOGS,
        policy: "auditLogsRead",
      },
      {
        labelKey: "nav.items.webhooks",
        icon: <Webhook size={16} />,
        path: PATHS.WEBHOOKS,
        policy: "platformAdminRead",
      },
      {
        labelKey: "nav.items.integrations",
        icon: <Puzzle size={16} />,
        path: PATHS.INTEGRATIONS,
        policy: "platformAdminRead",
      },
      {
        labelKey: "nav.items.protocols",
        icon: <Globe2 size={16} />,
        path: PATHS.PROTOCOLS,
        policy: "platformAdminRead",
      },
      {
        labelKey: "nav.items.tierPricing",
        icon: <DollarSign size={16} />,
        path: PATHS.TIER_PRICING,
        policy: "tierPricingAdmin",
      },
      {
        labelKey: "nav.items.plugAndCharge",
        icon: <ShieldCheck size={16} />,
        path: PATHS.PLUG_AND_CHARGE,
        policy: "pncRead",
        featureFlag: "pnc_v1",
        tenantCpoTypes: ["CHARGE", "HYBRID"],
      },
      {
        labelKey: "nav.items.vendorBaseline",
        icon: <Puzzle size={16} />,
        path: PATHS.VENDOR_BASELINE,
        policy: "platformAdminRead",
      },
      {
        labelKey: "nav.items.developerApis",
        icon: <BookOpen size={16} />,
        path: PATHS.DEVELOPER_PLATFORM,
        policy: "developerPlatformRead",
      },
      {
        labelKey: "nav.items.enterpriseIam",
        icon: <Users size={16} />,
        path: PATHS.ENTERPRISE_IAM,
        policy: "enterpriseIamRead",
        featureFlag: "enterprise_sso_v1",
      },
    ],
  },
];

interface SidebarProps {
  mode?: "desktop" | "mobile";
  onRequestClose?: () => void;
}

export function Sidebar({ mode = "desktop", onRequestClose }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeTenant } = useTenant();
  const { data: featureFlags } = usePlatformFeatureFlags();
  const tenantCpoType = activeTenant?.cpoType ?? null;
  const [collapsed, setCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isMobile = mode === "mobile";
  const isCollapsed = isMobile ? false : collapsed;

  return (
    <aside
      className={`relative flex flex-col h-full bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-200 ${isCollapsed ? "w-[60px]" : isMobile ? "w-[84vw] max-w-[320px]" : "w-[220px]"}`}
      style={{ flexShrink: 0 }}
    >
      {isMobile ? (
        <button
          onClick={() => {
            setIsProfileMenuOpen(false);
            onRequestClose?.();
          }}
          className="btn ghost icon absolute right-2 top-2 z-10"
          style={{ flexShrink: 0 }}
          title={t("common.cancel")}
          aria-label="Close navigation"
        >
          <X size={14} />
        </button>
      ) : (
        <button
          onClick={() => {
            setIsProfileMenuOpen(false);
            setCollapsed((c) => !c);
          }}
          className="btn ghost icon absolute right-2 top-2 z-10"
          style={{ flexShrink: 0 }}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto py-2 space-y-1">
        {NAV.map((group) => {
          const visibleItems = group.items.filter((item) => {
            const flagEnabled = item.featureFlag
              ? (featureFlags?.[item.featureFlag] ?? true)
              : true;
            return (
              flagEnabled &&
              canAccessPolicy(user, item.policy) &&
              canAccessTenantCpoScopedNavItem(
                {
                  accessScopeType: user?.accessProfile?.scope.type ?? null,
                  sessionScopeType: user?.sessionScopeType ?? null,
                  tenantCpoType,
                },
                item.tenantCpoTypes,
              )
            );
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.labelKey}>
              {!isCollapsed && (
                <div className="nav-group-label">{t(group.labelKey)}</div>
              )}
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");
                const label = t(item.labelKey);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={isCollapsed ? label : undefined}
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onRequestClose?.();
                    }}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && <span>{label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] px-3 py-3 relative">
        {user && (
          <>
            <button
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              className={`w-full flex items-center gap-2 rounded-lg border border-transparent hover:border-[var(--border)] transition-colors ${isCollapsed ? "justify-center px-0 py-1" : "px-2 py-1.5"}`}
              aria-label="Open sidebar profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent-ink)] font-bold text-xs flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-[var(--text)] truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)] truncate">
                    {getUserRoleLabel(user)}
                  </div>
                  {activeTenant && (
                    <div className="text-[10px] text-[var(--accent)] truncate">
                      {activeTenant.name}
                    </div>
                  )}
                </div>
              )}
            </button>
            {isProfileMenuOpen && (
              <div
                className={`mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 ${isCollapsed ? "absolute right-3 bottom-14 w-44 z-50 shadow-2xl" : ""}`}
              >
                {canAccessPolicy(user, "settingsRead") && (
                  <Link
                    to={PATHS.SETTINGS}
                    className="nav-item"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onRequestClose?.();
                    }}
                  >
                    <Settings size={16} />
                    <span>{t("nav.items.accountSettings")}</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    onRequestClose?.();
                  }}
                  className="nav-item w-full text-left"
                >
                  <LogOut size={16} />
                  <span>{t("common.signOut")}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
