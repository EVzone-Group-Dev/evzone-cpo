import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEnterpriseIamOverview } from "@/core/hooks/usePlatformData";

const METRIC_CLASS = {
  default: "text-[var(--text)]",
  ok: "text-[var(--ok)]",
  warning: "text-[var(--warning)]",
} as const;

export function EnterpriseIamPage() {
  const { data, isLoading, error } = useEnterpriseIamOverview();

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Enterprise IAM">
        <div className="p-8 text-center text-subtle">
          Loading enterprise IAM controls...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Enterprise IAM">
        <div className="p-8 text-center text-danger">
          Unable to load enterprise IAM controls.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Enterprise IAM">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          <div className="section-title">Identity Providers</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Protocol</th>
                  <th>Status</th>
                  <th>Sync Mode</th>
                  <th>Mapped Groups</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((provider) => (
                  <tr key={provider.id}>
                    <td>
                      <div className="font-semibold">{provider.name}</div>
                      <div className="text-[11px] text-subtle">
                        {provider.issuerUrl ??
                          provider.metadataUrl ??
                          "Endpoint pending"}
                      </div>
                    </td>
                    <td>{provider.protocol}</td>
                    <td>
                      <span
                        className={`pill ${provider.status === "ACTIVE" ? "online" : provider.status === "DRAFT" ? "pending" : "faulted"}`}
                      >
                        {provider.status}
                      </span>
                    </td>
                    <td>{provider.syncMode}</td>
                    <td>{Object.keys(provider.roleMappings).length}</td>
                  </tr>
                ))}
                {data.providers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">
                      No identity providers configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Sync Import Jobs</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Trigger</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {data.syncJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="font-mono text-xs">{job.id.slice(0, 10)}</td>
                    <td>{job.providerName}</td>
                    <td>
                      <span
                        className={`pill ${job.status === "COMPLETED" ? "online" : job.status === "REVIEW_REQUIRED" ? "pending" : "faulted"}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>{job.trigger}</td>
                    <td>{job.completedAt ?? "-"}</td>
                  </tr>
                ))}
                {data.syncJobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">
                      No sync jobs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">IAM Note</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  );
}
