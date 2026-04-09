import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDeveloperPlatformOverview } from "@/core/hooks/usePlatformData";

const METRIC_CLASS = {
  default: "text-[var(--text)]",
  ok: "text-[var(--ok)]",
  warning: "text-[var(--warning)]",
} as const;

export function DeveloperPlatformPage() {
  const { data, isLoading, error } = useDeveloperPlatformOverview();

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Developer Platform">
        <div className="p-8 text-center text-subtle">
          Loading developer platform...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Developer Platform">
        <div className="p-8 text-center text-danger">
          Unable to load developer platform data.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Developer Platform">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="kpi-card">
            <div className="label">{metric.label}</div>
            <div className={`value ${METRIC_CLASS[metric.tone]}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="section-title">Registered Apps</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Status</th>
                  <th>Rate Limit</th>
                  <th>Keys</th>
                </tr>
              </thead>
              <tbody>
                {data.apps.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="font-semibold">{app.name}</div>
                      <div className="text-[11px] text-subtle">{app.slug}</div>
                    </td>
                    <td>
                      <span
                        className={`pill ${app.status === "ACTIVE" ? "online" : app.status === "DISABLED" ? "pending" : "faulted"}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>{app.defaultRateLimitPerMin}/min</td>
                    <td>{app.apiKeys.length}</td>
                  </tr>
                ))}
                {data.apps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-subtle py-8">
                      No developer apps yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Usage Windows</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Window</th>
                  <th>Route</th>
                  <th>Method</th>
                  <th>Requests</th>
                  <th>Denied</th>
                </tr>
              </thead>
              <tbody>
                {data.usage.slice(0, 30).map((usage, index) => (
                  <tr key={`${usage.windowStart}-${usage.route}-${index}`}>
                    <td>{usage.windowStart}</td>
                    <td className="font-mono text-xs">{usage.route}</td>
                    <td>{usage.method}</td>
                    <td>{usage.requestCount}</td>
                    <td>{usage.deniedCount}</td>
                  </tr>
                ))}
                {data.usage.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">
                      No usage metrics available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Onboarding Checklist</div>
        <ul className="list-disc pl-5 text-sm text-subtle space-y-1">
          {(Array.isArray(data.onboarding.checklist)
            ? data.onboarding.checklist
            : []
          ).map((item, index) => (
            <li key={`${index}-${String(item)}`}>{String(item)}</li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
