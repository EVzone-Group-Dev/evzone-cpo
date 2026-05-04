import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Gauge,
  RadioTower,
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
import { PATHS } from "@/router/paths";
import dashboardHeroImage from "@/assets/OrUsethis.jpg";

const KPI_ICONS = {
  "total-tenants": <Building2 size={16} />,
  "active-stations": <RadioTower size={16} />,
  "total-chargers": <Zap size={16} />,
  "active-sessions-today": <Gauge size={16} />,
  "revenue-mtd": <BarChart3 size={16} />,
  "open-alerts": <AlertTriangle size={16} />,
} as const;

const UTILIZATION_COLORS = {
  "in-use": "var(--accent)",
  available: "var(--ok)",
  offline: "var(--danger)",
} as const;

export function SuperAdminDashboard() {
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

  return (
    <DashboardLayout pageTitle="Super Admin Dashboard">
      <div className="mx-auto w-full max-w-[1440px] space-y-6 sm:space-y-7">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card">
            <div className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">
              Platform Command View
            </div>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-[var(--text)]">
              Role Dashboard - Super Admin
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-subtle leading-relaxed">
              Platform-wide oversight across tenants, stations, chargers, sessions,
              revenue, and active operational alerts.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="card h-full overflow-hidden p-0">
              <div className="relative h-full min-h-[148px]">
                <img
                  src={dashboardHeroImage}
                  alt="EV charging station network"
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.42))",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi) => (
            <div key={kpi.id} className="kpi-card">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span style={{ color: "var(--accent)" }}>{KPI_ICONS[kpi.id]}</span>
                <span className="label">{kpi.label}</span>
              </div>
              <div className="value">{kpi.value}</div>
              <div
                className={`text-xs font-semibold ${
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
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="section-title mb-0">Network Growth (Total Sessions)</div>
              <Link className="text-xs font-semibold text-accent" to={PATHS.SESSIONS}>
                View all
              </Link>
            </div>
            {data.networkGrowthSeries.length === 0 ? (
              <div className="mt-6 rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-subtle">
                No session trend data available for the selected 30-day window.
              </div>
            ) : (
              <div className="mt-4 h-[250px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.networkGrowthSeries}>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--text-subtle)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--text-subtle)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      dataKey="sessions"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title mb-0">Charger Utilization</div>
            {data.utilizationBreakdown.every((slice) => slice.value === 0) ? (
              <div className="mt-6 rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-subtle">
                No charger utilization data available.
              </div>
            ) : (
              <div className="mt-4 h-[250px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.utilizationBreakdown}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      innerRadius={58}
                      paddingAngle={2}
                    >
                      {data.utilizationBreakdown.map((slice) => (
                        <Cell
                          key={slice.id}
                          fill={UTILIZATION_COLORS[slice.id]}
                        />
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
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value, entry) => {
                        const payload = entry.payload as {
                          percentage?: number;
                        };
                        return `${value} ${payload.percentage ?? 0}%`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="section-title mb-0">Tenant Performance (Revenue)</div>
              <Link className="text-xs font-semibold text-accent" to={PATHS.TENANTS}>
                View all
              </Link>
            </div>
            {data.tenantRevenueSeries.length === 0 ? (
              <div className="mt-6 rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-subtle">
                No tenant revenue data available.
              </div>
            ) : (
              <div className="mt-4 h-[250px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tenantRevenueSeries}>
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="tenantName"
                      tick={{ fontSize: 11, fill: "var(--text-subtle)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={62}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-subtle)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, _name, payload) => [
                        payload?.payload?.revenueLabel ?? value,
                        "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="section-title mb-0">Recent Alerts</div>
              <Link className="text-xs font-semibold text-accent" to={PATHS.ALERTS}>
                View all
              </Link>
            </div>
            {data.recentAlerts.length === 0 ? (
              <div className="mt-6 rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-subtle">
                No alerts in the current window.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.recentAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={`${alert.tenantName}-${alert.id}`}
                    className="rounded-lg border px-3 py-3"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-muted)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text)]">
                          {alert.tenantName}
                        </div>
                        <div className="text-[11px] text-subtle truncate">
                          {alert.stationName}
                        </div>
                      </div>
                      <span
                        className={`pill ${
                          alert.severity === "Critical"
                            ? "faulted"
                            : alert.severity === "Warning"
                              ? "degraded"
                              : "pending"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--text)]">{alert.message}</div>
                    <div className="mt-2 text-[10px] text-subtle">
                      {alert.status} · {alert.timeLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <div className="section-title mb-0">Top Tenants</div>
            <Link className="text-xs font-semibold text-accent" to={PATHS.TENANTS}>
              View all tenants
            </Link>
          </div>
          {data.topTenants.length === 0 ? (
            <div className="mt-6 rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-subtle">
              No tenant performance records are available.
            </div>
          ) : (
            <div className="table-wrap mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Revenue (MTD)</th>
                    <th>Stations</th>
                    <th>Chargers</th>
                    <th>Open Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTenants.map((tenant) => (
                    <tr key={tenant.tenantId}>
                      <td className="font-semibold">{tenant.tenantName}</td>
                      <td>{tenant.revenueLabel}</td>
                      <td>{tenant.stations}</td>
                      <td>{tenant.chargers}</td>
                      <td>
                        <span
                          className={`pill ${
                            tenant.openAlerts > 0 ? "faulted" : "online"
                          }`}
                        >
                          {tenant.openAlerts}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

