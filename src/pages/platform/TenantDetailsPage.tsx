import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  BatteryCharging,
  Building2,
  Cpu,
  Mail,
  MapPin,
  Phone,
  Power,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { PATHS } from "@/router/paths";
import {
  getPlatformTenantDetails,
  reactivatePlatformTenant,
  revokePlatformTenantSubscription,
  suspendPlatformTenant,
  type PlatformTenantDetails,
} from "@/core/api/platformTenants";

type TenantTab =
  | "profile"
  | "stations"
  | "charging"
  | "swapping"
  | "subscription"
  | "applications"
  | "audit";

const TABS: Array<{ key: TenantTab; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "stations", label: "Stations" },
  { key: "charging", label: "Charging" },
  { key: "swapping", label: "Battery Swapping" },
  { key: "subscription", label: "Subscription" },
  { key: "applications", label: "Applications" },
  { key: "audit", label: "Audit" },
];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "Active" || status === "Online" || status === "Healthy") {
    return "online";
  }

  if (
    status === "Suspended" ||
    status === "Revoked" ||
    status === "Offline" ||
    status === "Faulted"
  ) {
    return "danger";
  }

  if (status === "Past Due" || status === "Degraded") {
    return "overdue";
  }

  return "pending";
}

function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subtle">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 py-2 text-sm">
      <div className="text-subtle">{label}</div>
      <div className="font-medium text-[var(--text)]">{value}</div>
    </div>
  );
}

export function TenantDetailsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const user = useAuthStore((state) => state.user);

  const canWriteTenants = canAccessPolicy(user, "platformTenantsWrite");
  const canWriteStations = canAccessPolicy(user, "stationsWrite");

  const [tenant, setTenant] = useState<PlatformTenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TenantTab>("profile");
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const visibleTabs = useMemo(() => {
    if (!tenant) return TABS;

    return TABS.filter((tab) => {
      if (tab.key === "charging") {
        return tenant.cpoType === "CHARGE" || tenant.cpoType === "HYBRID";
      }

      if (tab.key === "swapping") {
        return tenant.cpoType === "SWAP" || tenant.cpoType === "HYBRID";
      }

      return true;
    });
  }, [tenant]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!tenantId) return;

      setLoading(true);
      try {
        const data = await getPlatformTenantDetails(tenantId);
        if (mounted) setTenant(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  async function loadTenant() {
    if (!tenantId) return;
    try {
      const data = await getPlatformTenantDetails(tenantId);
      setTenant(data);
    } catch (error) {
      console.error("Failed to reload tenant:", error);
    }
  }

  async function runTenantAction(action: "suspend" | "revoke" | "reactivate") {
    if (!tenant || !canWriteTenants) return;

    setWorking(true);
    setNotice(null);

    try {
      if (action === "suspend") {
        await suspendPlatformTenant(tenant.id);
        setNotice("Tenant suspended successfully.");
      }

      if (action === "revoke") {
        await revokePlatformTenantSubscription(tenant.id);
        setNotice("Tenant subscription revoked successfully.");
      }

      if (action === "reactivate") {
        await reactivatePlatformTenant(tenant.id);
        setNotice("Tenant reactivated successfully.");
      }

      // Reload data to show updated status
      await loadTenant();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Tenant Details">
        <div className="p-8 text-center text-subtle">Loading tenant details...</div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout pageTitle="Tenant Details">
        <div className="card">
          <div className="section-title">Tenant not found</div>
          <Link className="btn mt-3" to={PATHS.TENANTS}>
            Back to Tenants
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Tenant Details">
      <div className="space-y-6">
        {/* Top KPI Row - Prominent and Premium */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Stations</div>
              <Cpu size={16} className="text-accent" />
            </div>
            <div className="value">{tenant.stationCount}</div>
            <div className="delta-up">Active across {tenant.city}</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Charge Points</div>
              <Zap size={16} className="text-warning" />
            </div>
            <div className="value">{tenant.chargePointCount}</div>
            <div className="delta-up">OCPP Connected</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Swap Cabinets</div>
              <RefreshCw size={16} className="text-info" />
            </div>
            <div className="value">{tenant.swapCabinetCount}</div>
            <div className="text-xs text-subtle">Ready for exchange</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Battery Packs</div>
              <BatteryCharging size={16} className="text-ok" />
            </div>
            <div className="value">{tenant.batteryPackCount}</div>
            <div className="delta-up">Active circulation</div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Open Incidents</div>
              <AlertTriangle size={16} className={tenant.openIncidents > 0 ? "text-danger" : "text-subtle"} />
            </div>
            <div className="value">{tenant.openIncidents}</div>
            <div className={tenant.openIncidents > 0 ? "delta-down" : "text-xs text-subtle"}>
              {tenant.openIncidents > 0 ? "Requires attention" : "System healthy"}
            </div>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <div className="label">Revenue 30d</div>
              <Power size={16} className="text-accent" />
            </div>
            <div className="value">
              {formatMoney(tenant.revenue30d, tenant.currency)}
            </div>
            <div className="delta-up">Growth +12.5%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="card overflow-hidden border-none bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-muted)] shadow-soft">
              <div className="flex flex-col items-center p-2 pt-6">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-2xl font-black text-accent-ink shadow-lg shadow-accent/20">
                    {tenant.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-[var(--bg-card)] bg-ok shadow-sm" title="Tenant Online"></div>
                </div>

                <h1 className="mt-4 text-center text-xl font-bold tracking-tight text-[var(--text)]">
                  {tenant.name}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle">{tenant.tenantType}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className={`pill ${statusClass(tenant.status)}`}>
                    {tenant.status}
                  </span>
                  <span className="pill active">{tenant.cpoType}</span>
                </div>

                {canWriteTenants && (
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <button
                      className="flex items-center justify-center text-subtle hover:text-danger transition-colors"
                      disabled={working}
                      title="Suspend Platform Access"
                      onClick={() => void runTenantAction("suspend")}
                    >
                      <AlertTriangle size={18} />
                    </button>

                    <button
                      className="flex items-center justify-center text-subtle hover:text-accent transition-colors"
                      disabled={working}
                      title="Reactivate Permissions"
                      onClick={() => void runTenantAction("reactivate")}
                    >
                      <ShieldCheck size={18} />
                    </button>

                    <button
                      className="flex items-center justify-center text-subtle hover:text-danger transition-colors"
                      disabled={working}
                      title="Revoke Subscription"
                      onClick={() => void runTenantAction("revoke")}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="divider opacity-50"></div>

              <div className="px-2 pb-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-subtle">
                    <MapPin size={16} className="shrink-0" />
                    <span className="truncate">{tenant.city}, {tenant.country}</span>
                  </div>
                  <div className="flex items-center gap-3 text-subtle">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-subtle">
                    <Phone size={16} className="shrink-0" />
                    <span className="truncate">{tenant.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-subtle">
                    <Building2 size={16} className="shrink-0" />
                    <span className="truncate font-mono text-xs uppercase">Code: {tenant.code}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="btn secondary w-full font-bold">Send Message</button>
                  {canWriteStations && (
                    <Link className="btn primary w-full font-bold" to="/stations/new">
                      Create Station
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-6">
            {notice && <div className="alert success shadow-soft animate-in fade-in slide-in-from-top-4">{notice}</div>}

            <div className="card border-none p-0 shadow-soft overflow-hidden">
              <div className="bg-[var(--bg-card)] px-4 pt-4">
                <div className="flex flex-wrap gap-1">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={`relative px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === tab.key 
                          ? "text-accent" 
                          : "text-subtle hover:text-[var(--text)]"
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-accent animate-in fade-in zoom-in-95 duration-300"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div>
                        <h3 className="section-title border-b border-[var(--border-light)] pb-2 mb-4">Organizational Identity</h3>
                        <div className="space-y-1">
                          <DetailRow label="Full Legal Name" value={tenant.name} />
                          <DetailRow label="Platform Identifier" value={<span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{tenant.code}</span>} />
                          <DetailRow label="Provider Vertical" value={tenant.cpoType} />
                          <DetailRow label="Primary Region" value={tenant.country} />
                          <DetailRow label="System Timezone" value={tenant.timezone} />
                          <DetailRow label="Onboarding Date" value={formatDate(tenant.createdAt)} />
                        </div>
                      </div>

                      <div>
                        <h3 className="section-title border-b border-[var(--border-light)] pb-2 mb-4">Authorized Administrative Contact</h3>
                        <div className="space-y-1">
                          <DetailRow label="Designated Name" value={tenant.primaryAdmin.name} />
                          <DetailRow label="Administrative Role" value={tenant.primaryAdmin.role} />
                          <DetailRow label="Identity Credential" value={tenant.primaryAdmin.email} />
                          <DetailRow label="Contact Endpoint" value={tenant.primaryAdmin.phone} />
                          <DetailRow
                            label="MFA Status"
                            value={
                              <span className={`pill ${tenant.primaryAdmin.mfaEnabled ? "online" : "danger"}`}>
                                {tenant.primaryAdmin.mfaEnabled ? "Secured" : "Unprotected"}
                              </span>
                            }
                          />
                          <DetailRow label="Last Network Activity" value={formatDateTime(tenant.primaryAdmin.lastSeen)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "stations" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="section-title">Infrastructure Deployment</h3>
                      {canWriteStations && (
                        <Link className="btn primary font-bold sm" to="/stations/new">
                          New Deployment
                        </Link>
                      )}
                    </div>

                    <div className="table-wrap border-none">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Station Detail</th>
                            <th>Mode</th>
                            <th>Location</th>
                            <th>Current Status</th>
                            <th>Infrastructure Assets</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenant.stations.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-subtle italic">
                                No infrastructure assets deployed for this tenant.
                              </td>
                            </tr>
                          ) : (
                            tenant.stations.map((station) => (
                              <tr key={station.id}>
                                <td>
                                  <div className="font-bold">{station.name}</div>
                                  <div className="text-[10px] text-subtle uppercase tracking-tight">{station.id}</div>
                                </td>
                                <td className="font-medium">{station.serviceMode}</td>
                                <td className="text-subtle">{station.location}</td>
                                <td>
                                  <span className={`pill ${statusClass(station.status)}`}>
                                    {station.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-xs font-semibold">{station.chargePoints} Charge Points</div>
                                    <div className="text-[10px] text-subtle">
                                      {station.swapCabinets} Cabinets · {station.availableChargedPacks} Packs Ready
                                    </div>
                                  </div>
                                </td>
                                <td className="text-right">
                                  <Link className="btn secondary sm font-bold" to={`/stations/${station.id}`}>
                                    Manage
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "charging" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="card bg-muted/30 border-dashed">
                        <div className="text-[10px] font-bold text-subtle uppercase mb-1">Energy Throughput</div>
                        <div className="text-xl font-black">14,280 <span className="text-sm font-medium">kWh</span></div>
                      </div>
                      <div className="card bg-muted/30 border-dashed">
                        <div className="text-[10px] font-bold text-subtle uppercase mb-1">Transaction Volume</div>
                        <div className="text-xl font-black">{formatMoney(856800, tenant.currency)}</div>
                      </div>
                      <div className="card bg-muted/30 border-dashed">
                        <div className="text-[10px] font-bold text-subtle uppercase mb-1">Active Sessions</div>
                        <div className="text-xl font-black">18</div>
                      </div>
                      <div className="card bg-muted/30 border-dashed">
                        <div className="text-[10px] font-bold text-subtle uppercase mb-1">Utilization</div>
                        <div className="text-xl font-black">84%</div>
                      </div>
                    </div>

                    <div className="table-wrap border-none">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Charge Point</th>
                            <th>Station Context</th>
                            <th>Protocol Config</th>
                            <th>Real-time Status</th>
                            <th className="text-right">Diagnostic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenant.chargePoints.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-subtle italic">
                                No active charge points found.
                              </td>
                            </tr>
                          ) : (
                            tenant.chargePoints.map((cp) => (
                              <tr key={cp.id}>
                                <td className="font-bold">{cp.id}</td>
                                <td className="text-subtle">{cp.stationName}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{cp.ocppId}</span>
                                    <span className="text-[10px] font-bold text-subtle">v{cp.ocppVersion}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`pill ${statusClass(cp.status)}`}>
                                    {cp.status}
                                  </span>
                                  <div className="mt-1 text-[10px] text-subtle">Pulse: {cp.lastHeartbeat}</div>
                                </td>
                                <td className="text-right">
                                  <Link className="btn secondary sm font-bold" to={`/charge-points/${cp.id}`}>
                                    Details
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "swapping" && (
                  <div className="space-y-6">
                    <div className="table-wrap border-none">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Swap Station</th>
                            <th>Hardware</th>
                            <th>Inventory Metrics</th>
                            <th>Operational Stats</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenant.swapping.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-subtle italic">
                                No battery swap infrastructure active.
                              </td>
                            </tr>
                          ) : (
                            tenant.swapping.map((swap) => (
                              <tr key={swap.id}>
                                <td className="font-bold">{swap.stationName}</td>
                                <td className="text-subtle">{swap.cabinetCount} Active Cabinets</td>
                                <td>
                                  <div className="flex gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-subtle uppercase">Ready</span>
                                      <span className="text-sm font-black text-ok">{swap.readyPacks}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-subtle uppercase">Charging</span>
                                      <span className="text-sm font-black text-info">{swap.chargingPacks}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="text-sm font-medium">{swap.avgSwapDurationMinutes.toFixed(1)}m <span className="text-xs text-subtle font-normal">avg swap</span></div>
                                  <div className={`text-[10px] font-bold uppercase ${swap.alert === "Healthy" ? "text-ok" : "text-warning"}`}>{swap.alert}</div>
                                </td>
                                <td className="text-right">
                                  <Link className="btn secondary sm font-bold" to={`/swap-stations/${swap.id}`}>
                                    Optimize
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "subscription" && (
                  <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-accent" size={20} />
                        <h3 className="section-title mb-0">Active Agreement</h3>
                      </div>
                      <div className="space-y-1">
                        <DetailRow label="Plan Level" value={<span className="font-black text-accent">{tenant.subscription.planName}</span>} />
                        <DetailRow label="Service Status" value={tenant.subscription.status} />
                        <DetailRow label="Invoicing Period" value={tenant.subscription.billingCycle} />
                        <DetailRow label="Next Reconciliation" value={formatDate(tenant.subscription.renewalDate)} />
                        <DetailRow
                          label="Consolidated Balance"
                          value={<span className="font-black">{formatMoney(tenant.subscription.outstandingBalance, tenant.subscription.currency)}</span>}
                        />
                      </div>
                      <button className="btn primary w-full font-black mt-4">Manage Billing Subscription</button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                    <Cpu className="text-accent" size={20} />
                        <h3 className="section-title mb-0">Provisioned Resource Quotas</h3>
                      </div>
                      <div className="space-y-1">
                        <DetailRow label="Deployment Limit (Stations)" value={tenant.subscription.limits.maxStations} />
                        <DetailRow label="Component Limit (CPs)" value={tenant.subscription.limits.maxChargePoints} />
                        <DetailRow label="Automation Limit (Swaps)" value={tenant.subscription.limits.maxSwapCabinets} />
                        <DetailRow label="Seat Limit (IAM Users)" value={tenant.subscription.limits.maxUsers} />
                        <DetailRow label="Full API Lifecycle Access" value={tenant.subscription.limits.apiAccess ? "Authorized" : "Unauthorized"} />
                        <DetailRow label="OCPI Roaming Protocol" value={tenant.subscription.limits.ocpiAccess ? "Authorized" : "Unauthorized"} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "applications" && (
                  <div className="space-y-4">
                    <h3 className="section-title">Historical Applications</h3>
                    {tenant.applications.length === 0 ? (
                      <div className="p-12 text-center text-subtle italic bg-muted/20 rounded-xl border border-dashed">
                        No historical onboarding records found.
                      </div>
                    ) : (
                      tenant.applications.map((app) => (
                        <div key={app.id} className="group relative overflow-hidden rounded-xl border border-[var(--border-light)] p-5 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors">
                                <Building2 size={24} />
                              </div>
                              <div>
                                <div className="text-lg font-black">{app.organizationName}</div>
                                <div className="text-xs font-medium text-subtle">
                                  Contact: {app.applicantName} · {app.applicantEmail}
                                </div>
                              </div>
                            </div>
                            <span className={`pill ${statusClass(app.stage)}`}>
                              {app.stage}
                            </span>
                          </div>
                          <div className="divider opacity-30 my-4"></div>
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-subtle md:grid-cols-3">
                            <div className="flex flex-col gap-1">
                              <span>Vertical</span>
                              <span className="text-sm font-black text-[var(--text)]">{app.requestedCpoType}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span>Territory</span>
                              <span className="text-sm font-black text-[var(--text)]">{app.region}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span>Audit Timestamp</span>
                              <span className="text-sm font-black text-[var(--text)]">{formatDate(app.submittedAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="space-y-4">
                    <h3 className="section-title">System Governance Trail</h3>
                    <div className="space-y-3 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-light">
                      {tenant.auditEvents.length === 0 ? (
                        <div className="p-12 text-center text-subtle italic">No governance events recorded.</div>
                      ) : (
                        tenant.auditEvents.map((event) => (
                          <div
                            key={event.id}
                            className="relative flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 transition-all hover:border-accent/30 hover:shadow-sm"
                          >
                            <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-[var(--bg-card)] bg-muted text-subtle">
                              <ShieldCheck size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-black text-[var(--text)]">{event.action}</div>
                              <div className="mt-0.5 text-xs font-medium text-subtle flex items-center gap-2">
                                <span className="text-accent">{event.actorName}</span>
                                <span className="opacity-30">·</span>
                                <span>{formatDateTime(event.createdAt)}</span>
                              </div>
                            </div>
                            <div className="hidden sm:block text-[10px] font-bold text-subtle uppercase opacity-50 font-mono">{event.id.slice(0, 8)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
