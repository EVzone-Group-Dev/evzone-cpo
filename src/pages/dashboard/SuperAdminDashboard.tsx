import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Gauge,
  RadioTower,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSuperAdminDashboard } from "@/core/hooks/useSuperAdminDashboard";
import { useAuthStore } from "@/core/auth/authStore";
import { PATHS } from "@/router/paths";

const KPI_ICONS = {
  "total-tenants": <Building2 size={14} />,
  "active-stations": <RadioTower size={14} />,
  "total-chargers": <Zap size={14} />,
  "active-sessions-today": <Gauge size={14} />,
  "revenue-mtd": <BarChart3 size={14} />,
  "open-alerts": <AlertTriangle size={14} />,
} as const;

const UTILIZATION_COLORS = {
  "in-use": "var(--accent)",
  available: "#6CD9B6",
  offline: "#FF8A5B",
} as const;

function buildCoverageRows(
  topTenants: Array<{ tenantName: string; chargers: number }>,
): Array<{ label: string; percentage: number }> {
  const total = topTenants.reduce((sum, tenant) => sum + tenant.chargers, 0);
  if (total <= 0) {
    return [];
  }

  return topTenants.slice(0, 4).map((tenant) => ({
    label: tenant.tenantName,
    percentage: Math.max(1, Math.round((tenant.chargers / total) * 100)),
  }));
}

function buildGrowthPercentages(
  topTenants: Array<{ tenantId: string; revenue: number }>,
): Record<string, string> {
  const values = topTenants.map((tenant) => tenant.revenue).filter((value) => value > 0);
  const baseline = values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

  const percentages: Record<string, string> = {};
  for (const tenant of topTenants) {
    if (baseline <= 0 || tenant.revenue <= 0) {
      percentages[tenant.tenantId] = "+0.0%";
      continue;
    }

    const delta = ((tenant.revenue - baseline) / baseline) * 100;
    percentages[tenant.tenantId] = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  }

  return percentages;
}

export function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useSuperAdminDashboard();

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Super Admin Dashboard">
        <div className="p-8 text-center text-subtle">
          Loading platform command view...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Super Admin Dashboard">
        <div className="p-8 text-center text-danger">
          Unable to load Super Admin dashboard.
        </div>
      </DashboardLayout>
    );
  }

  const coverageRows = buildCoverageRows(data.topTenants);
  const growthPercentages = buildGrowthPercentages(data.topTenants);
  const greetingName =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.name?.trim() || "Super Admin";

  return (
    <DashboardLayout pageTitle="Super Admin Dashboard">
      <div className="mx-auto w-full max-w-[1440px]">
        <section className="mb-5">
          <h2 className="text-[27px] font-extrabold tracking-tight text-[var(--text)] leading-tight">
            Welcome back, <span style={{ color: "var(--accent)" }}>{greetingName}</span>
          </h2>
          <p className="mt-1.5 text-sm text-subtle">
            Here's what's happening across your platform today.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 mb-4">
          {data.kpis.map((kpi) => (
            <article
              key={kpi.id}
              className="rounded-xl border bg-[var(--bg-card)] px-3.5 py-3 shadow-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--text-muted)]">
                <span style={{ color: "var(--accent)" }}>{KPI_ICONS[kpi.id]}</span>
                <span>{kpi.label}</span>
              </div>
              <div className="mt-2 text-[33px] leading-none font-extrabold tracking-tight text-[var(--text)]">
                {kpi.value}
              </div>
              <div
                className={`mt-2 text-[11px] font-semibold ${
                  kpi.trend === "up"
                    ? "text-ok"
                    : kpi.trend === "down"
                      ? "text-danger"
                      : "text-subtle"
                }`}
              >
                {kpi.trend === "up" ? "↑ " : kpi.trend === "down" ? "↓ " : ""}
                {kpi.delta}
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 mb-4">
          <article className="card xl:col-span-5 !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Network Growth (Total Sessions)</h3>
              <span className="rounded-md border px-2 py-0.5 text-[10px] font-semibold text-subtle" style={{ borderColor: "var(--border)" }}>
                Last 30 Days
              </span>
            </div>
            {data.networkGrowthSeries.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                No session trend data available.
              </div>
            ) : (
              <div className="h-[222px] px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.networkGrowthSeries}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-subtle)" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--text-subtle)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Line dataKey="sessions" stroke="var(--accent)" strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="card xl:col-span-4 !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Tenant Performance (Revenue)</h3>
              <span className="rounded-md border px-2 py-0.5 text-[10px] font-semibold text-subtle" style={{ borderColor: "var(--border)" }}>
                MTD
              </span>
            </div>
            {data.tenantRevenueSeries.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                No tenant revenue data available.
              </div>
            ) : (
              <div className="h-[222px] px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tenantRevenueSeries}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="tenantName"
                      tick={{ fontSize: 9, fill: "var(--text-subtle)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-subtle)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, _name, payload) => [payload?.payload?.revenueLabel ?? value, "Revenue"]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>

          <article className="card xl:col-span-3 !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Charger Utilization</h3>
              <span className="rounded-md border px-2 py-0.5 text-[10px] font-semibold text-subtle" style={{ borderColor: "var(--border)" }}>
                Today
              </span>
            </div>
            {data.utilizationBreakdown.every((slice) => slice.value === 0) ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                No charger utilization data available.
              </div>
            ) : (
              <div className="h-[222px] px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.utilizationBreakdown}
                      dataKey="value"
                      nameKey="label"
                      cx="34%"
                      cy="52%"
                      outerRadius={56}
                      innerRadius={38}
                      paddingAngle={2}
                    >
                      {data.utilizationBreakdown.map((slice) => (
                        <Cell key={slice.id} fill={UTILIZATION_COLORS[slice.id]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, payload) => {
                        const percentage = payload?.payload?.percentage ?? 0;
                        return [`${value} (${percentage}%)`, "Chargers"];
                      }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      formatter={(value, entry) => {
                        const payload = entry.payload as { percentage?: number };
                        return `${value} ${payload.percentage ?? 0}%`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <article className="card xl:col-span-5 !p-0 overflow-hidden">
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Network Coverage</h3>
            </div>
            {coverageRows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                Coverage data is not available yet.
              </div>
            ) : (
              <div className="grid grid-cols-[minmax(0,1fr)_170px] gap-3 p-4">
                <div
                  className="relative min-h-[160px] rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
                >
                  <div className="absolute inset-0 opacity-80" style={{ background: "linear-gradient(140deg, rgba(20, 199, 139, 0.18), rgba(59, 130, 246, 0.08))" }} />
                  <div className="absolute left-[16%] top-[32%] h-3.5 w-3.5 rounded-full bg-[var(--accent)] border border-white" />
                  <div className="absolute left-[45%] top-[28%] h-3.5 w-3.5 rounded-full bg-[var(--accent)] border border-white" />
                  <div className="absolute left-[55%] top-[58%] h-3.5 w-3.5 rounded-full bg-[var(--accent)] border border-white" />
                  <div className="absolute left-[28%] top-[65%] h-3.5 w-3.5 rounded-full bg-[var(--accent)] border border-white" />
                </div>
                <div className="space-y-2">
                  {coverageRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-[var(--text-muted)]">{row.label}</span>
                      <span className="font-bold text-[var(--text)]">{row.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className="card xl:col-span-4 !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Top Tenants by Revenue</h3>
              <Link className="text-[11px] font-semibold text-accent" to={PATHS.TENANTS}>
                View all tenants
              </Link>
            </div>
            {data.topTenants.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                No tenant performance records are available.
              </div>
            ) : (
              <div className="px-4 py-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      <th className="py-1 text-left">#</th>
                      <th className="py-1 text-left">Tenant</th>
                      <th className="py-1 text-left">Revenue (MTD)</th>
                      <th className="py-1 text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topTenants.slice(0, 5).map((tenant, index) => (
                      <tr key={tenant.tenantId} className="border-t" style={{ borderColor: "var(--border-light)" }}>
                        <td className="py-2 text-subtle">{index + 1}</td>
                        <td className="py-2 font-semibold text-[var(--text)]">{tenant.tenantName}</td>
                        <td className="py-2 text-[var(--text)]">{tenant.revenueLabel}</td>
                        <td className="py-2 text-right font-semibold text-ok">{growthPercentages[tenant.tenantId]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="card xl:col-span-3 !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold text-[var(--text)]">Recent Alerts</h3>
              <Link className="text-[11px] font-semibold text-accent" to={PATHS.ALERTS}>
                View all
              </Link>
            </div>
            {data.recentAlerts.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-subtle">
                No alerts in the current window.
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {data.recentAlerts.slice(0, 4).map((alert) => (
                  <div key={`${alert.tenantName}-${alert.id}`} className="flex items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}>
                    <TriangleAlert
                      size={14}
                      className={
                        alert.severity === "Critical"
                          ? "text-danger mt-0.5"
                          : alert.severity === "Warning"
                            ? "text-warning mt-0.5"
                            : "text-info mt-0.5"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-[var(--text)]">
                        {alert.message}
                      </div>
                      <div className="truncate text-[10px] text-subtle">
                        {alert.stationName}
                      </div>
                    </div>
                    <div className="text-[10px] text-subtle whitespace-nowrap">
                      {alert.timeLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
