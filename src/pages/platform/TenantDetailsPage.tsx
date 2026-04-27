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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="card text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-dim)] text-xl font-bold text-[var(--accent-ink)]">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="mt-3 text-lg font-bold text-[var(--text)]">
              {tenant.name}
            </div>
            <div className="text-sm text-subtle">{tenant.tenantType}</div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={`pill ${statusClass(tenant.status)}`}>
                {tenant.status}
              </span>
              <span className="pill active">{tenant.cpoType}</span>
            </div>

            <div className="mt-5 space-y-2 text-left text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>
                  {tenant.city}, {tenant.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>{tenant.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{tenant.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} />
                <span>Tenant Code: {tenant.code}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button className="btn">Send message</button>
              {canWriteStations && (
                <Link className="btn primary" to="/stations/new">
                  Create Station
                </Link>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-title">Subscription</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-sm font-semibold">
                  {tenant.subscription.planName}
                </div>
                <div className="text-xs text-subtle">
                  Renewal: {formatDate(tenant.subscription.renewalDate)}
                </div>
              </div>
              <span className={`pill ${statusClass(tenant.subscription.status)}`}>
                {tenant.subscription.status}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Platform Fees</div>
            <div className="mt-2 text-2xl font-bold">
              {formatMoney(
                tenant.subscription.platformFeesDue,
                tenant.subscription.currency,
              )}
            </div>
            <div className="text-xs text-subtle">Current billing cycle</div>
          </div>

          <div className="card">
            <div className="section-title">Outstanding Balance</div>
            <div className="mt-2 text-2xl font-bold">
              {formatMoney(
                tenant.subscription.outstandingBalance,
                tenant.subscription.currency,
              )}
            </div>
            <div className="text-xs text-subtle">Due balance</div>
          </div>

          {canWriteTenants && (
            <div className="card space-y-2">
              <div className="section-title">Admin Actions</div>
              <button
                className="btn w-full"
                disabled={working}
                onClick={() => void runTenantAction("suspend")}
              >
                Suspend Tenant
              </button>
              <button
                className="btn w-full"
                disabled={working}
                onClick={() => void runTenantAction("reactivate")}
              >
                Reactivate Tenant
              </button>
              <button
                className="btn w-full"
                disabled={working}
                onClick={() => void runTenantAction("revoke")}
              >
                Revoke Subscription
              </button>
            </div>
          )}
        </aside>

        <main className="space-y-4">
          {notice && <div className="alert success">{notice}</div>}

          <div className="card">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`btn ${activeTab === tab.key ? "primary" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-4">
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="section-title">Tenant Information</div>
                      <div className="mt-3 divide-y divide-[var(--border)]">
                        <DetailRow label="Tenant Name" value={tenant.name} />
                        <DetailRow label="Tenant Code" value={tenant.code} />
                        <DetailRow label="CPO Type" value={tenant.cpoType} />
                        <DetailRow label="Region" value={tenant.country} />
                        <DetailRow label="Timezone" value={tenant.timezone} />
                        <DetailRow label="Status" value={tenant.status} />
                        <DetailRow
                          label="Created"
                          value={formatDate(tenant.createdAt)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="section-title">Primary Admin Contact</div>
                      <div className="mt-3 divide-y divide-[var(--border)]">
                        <DetailRow label="Name" value={tenant.primaryAdmin.name} />
                        <DetailRow label="Role" value={tenant.primaryAdmin.role} />
                        <DetailRow
                          label="Email"
                          value={tenant.primaryAdmin.email}
                        />
                        <DetailRow
                          label="Mobile"
                          value={tenant.primaryAdmin.phone}
                        />
                        <DetailRow
                          label="MFA"
                          value={tenant.primaryAdmin.mfaEnabled ? "Enabled" : "Disabled"}
                        />
                        <DetailRow
                          label="Last Seen"
                          value={formatDateTime(tenant.primaryAdmin.lastSeen)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <StatCard label="Stations" value={tenant.stationCount} icon={<Cpu size={14} />} />
                    <StatCard label="Charge Points" value={tenant.chargePointCount} icon={<Zap size={14} />} />
                    <StatCard label="Swap Cabinets" value={tenant.swapCabinetCount} icon={<RefreshCw size={14} />} />
                    <StatCard label="Battery Packs" value={tenant.batteryPackCount} icon={<BatteryCharging size={14} />} />
                    <StatCard label="Open Incidents" value={tenant.openIncidents} icon={<AlertTriangle size={14} />} />
                    <StatCard
                      label="Revenue 30d"
                      value={formatMoney(tenant.revenue30d, tenant.currency)}
                      icon={<Power size={14} />}
                    />
                  </div>
                </div>
              )}

              {activeTab === "stations" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="section-title">Tenant Stations</div>
                    {canWriteStations && (
                      <Link className="btn primary" to="/stations/new">
                        Create Station
                      </Link>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-subtle">
                          <th className="px-3 py-2">Station</th>
                          <th className="px-3 py-2">Mode</th>
                          <th className="px-3 py-2">Location</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Charging Assets</th>
                          <th className="px-3 py-2">Swap Assets</th>
                          <th className="px-3 py-2">Health</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenant.stations.map((station) => (
                          <tr
                            key={station.id}
                            className="border-b border-[var(--border)] last:border-b-0"
                          >
                            <td className="px-3 py-3 font-semibold">{station.name}</td>
                            <td className="px-3 py-3">{station.serviceMode}</td>
                            <td className="px-3 py-3">{station.location}</td>
                            <td className="px-3 py-3">
                              <span className={`pill ${statusClass(station.status)}`}>
                                {station.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">{station.chargePoints} CPs</td>
                            <td className="px-3 py-3">
                              {station.swapCabinets} cabinets · {station.availableChargedPacks} ready
                            </td>
                            <td className="px-3 py-3">
                              {station.uptimePercent}% · {station.healthNote}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Link className="btn" to={`/stations/${station.id}`}>
                                {canWriteStations ? "View / Edit" : "View"}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "charging" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <StatCard label="Energy Delivered" value="14,280 kWh" icon={<Zap size={14} />} hint="Last 30 days" />
                    <StatCard label="Charging Revenue" value={formatMoney(856800, tenant.currency)} icon={<Power size={14} />} hint="Last 30 days" />
                    <StatCard label="Active Sessions" value={18} icon={<RefreshCw size={14} />} hint="Now" />
                    <StatCard label="Online Charge Points" value={`${tenant.chargePointCount - 6}/${tenant.chargePointCount}`} icon={<Cpu size={14} />} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-subtle">
                          <th className="px-3 py-2">Charge Point</th>
                          <th className="px-3 py-2">Station</th>
                          <th className="px-3 py-2">OCPP ID</th>
                          <th className="px-3 py-2">Version</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Heartbeat</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenant.chargePoints.map((chargePoint) => (
                          <tr key={chargePoint.id} className="border-b border-[var(--border)] last:border-b-0">
                            <td className="px-3 py-3 font-semibold">{chargePoint.id}</td>
                            <td className="px-3 py-3">{chargePoint.stationName}</td>
                            <td className="px-3 py-3">{chargePoint.ocppId}</td>
                            <td className="px-3 py-3">{chargePoint.ocppVersion}</td>
                            <td className="px-3 py-3">
                              <span className={`pill ${statusClass(chargePoint.status)}`}>
                                {chargePoint.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">{chargePoint.lastHeartbeat}</td>
                            <td className="px-3 py-3 text-right">
                              <Link className="btn" to={`/charge-points/${chargePoint.id}`}>
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "swapping" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <StatCard label="Ready Packs" value={38} icon={<BatteryCharging size={14} />} />
                    <StatCard label="Charging Packs" value={17} icon={<RefreshCw size={14} />} />
                    <StatCard label="Average Swap Time" value="3m 24s" icon={<Power size={14} />} />
                    <StatCard label="Flagged Packs" value={4} icon={<AlertTriangle size={14} />} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-subtle">
                          <th className="px-3 py-2">Swap Station</th>
                          <th className="px-3 py-2">Cabinets</th>
                          <th className="px-3 py-2">Ready Packs</th>
                          <th className="px-3 py-2">Charging Packs</th>
                          <th className="px-3 py-2">Avg Duration</th>
                          <th className="px-3 py-2">Alert</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenant.swapping.map((swap) => (
                          <tr key={swap.id} className="border-b border-[var(--border)] last:border-b-0">
                            <td className="px-3 py-3 font-semibold">{swap.stationName}</td>
                            <td className="px-3 py-3">{swap.cabinetCount}</td>
                            <td className="px-3 py-3">{swap.readyPacks}</td>
                            <td className="px-3 py-3">{swap.chargingPacks}</td>
                            <td className="px-3 py-3">{swap.avgSwapDurationMinutes.toFixed(1)}m</td>
                            <td className="px-3 py-3">{swap.alert}</td>
                            <td className="px-3 py-3 text-right">
                              <Link className="btn" to={`/swap-stations/${swap.id}`}>
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "subscription" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="section-title">Current Plan</div>
                    <div className="mt-3 divide-y divide-[var(--border)]">
                      <DetailRow label="Plan" value={tenant.subscription.planName} />
                      <DetailRow label="Status" value={tenant.subscription.status} />
                      <DetailRow label="Billing Cycle" value={tenant.subscription.billingCycle} />
                      <DetailRow label="Renewal" value={formatDate(tenant.subscription.renewalDate)} />
                      <DetailRow
                        label="Outstanding"
                        value={formatMoney(
                          tenant.subscription.outstandingBalance,
                          tenant.subscription.currency,
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="section-title">Limits</div>
                    <div className="mt-3 divide-y divide-[var(--border)]">
                      <DetailRow label="Max Stations" value={tenant.subscription.limits.maxStations} />
                      <DetailRow label="Max Charge Points" value={tenant.subscription.limits.maxChargePoints} />
                      <DetailRow label="Max Swap Cabinets" value={tenant.subscription.limits.maxSwapCabinets} />
                      <DetailRow label="Max Users" value={tenant.subscription.limits.maxUsers} />
                      <DetailRow label="API Access" value={tenant.subscription.limits.apiAccess ? "Enabled" : "Disabled"} />
                      <DetailRow label="OCPI Access" value={tenant.subscription.limits.ocpiAccess ? "Enabled" : "Disabled"} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "applications" && (
                <div className="space-y-3">
                  <div className="section-title">Tenant Applications</div>
                  {tenant.applications.map((application) => (
                    <div key={application.id} className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold">{application.organizationName}</div>
                          <div className="text-xs text-subtle">
                            {application.applicantName} · {application.applicantEmail}
                          </div>
                        </div>
                        <span className={`pill ${statusClass(application.stage)}`}>
                          {application.stage}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                        <div>Requested Type: {application.requestedCpoType}</div>
                        <div>Region: {application.region}</div>
                        <div>Submitted: {formatDate(application.submittedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "audit" && (
                <div className="space-y-3">
                  <div className="section-title">Audit Trail</div>
                  {tenant.auditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3"
                    >
                      <ShieldCheck size={16} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold">{event.action}</div>
                        <div className="text-xs text-subtle">
                          {event.actorName} · {formatDateTime(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
