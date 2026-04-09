import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePncOverview } from "@/core/hooks/usePlatformData";

const METRIC_CLASS = {
  default: "text-[var(--text)]",
  ok: "text-[var(--ok)]",
  warning: "text-[var(--warning)]",
} as const;

export function PlugAndChargePage() {
  const { data, isLoading, error } = usePncOverview();

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Plug & Charge">
        <div className="p-8 text-center text-subtle">
          Loading Plug & Charge operations...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout pageTitle="Plug & Charge">
        <div className="p-8 text-center text-danger">
          Unable to load Plug & Charge operations.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Plug & Charge">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
          <div className="section-title">Contract Ledger</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Contract Ref</th>
                  <th>EMA ID</th>
                  <th>Provider</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="font-mono text-xs">
                      {contract.contractRef}
                    </td>
                    <td>{contract.eMobilityAccountId ?? "-"}</td>
                    <td>{contract.providerPartyId ?? "-"}</td>
                    <td>{contract.vehicleVin ?? "-"}</td>
                    <td>
                      <span
                        className={`pill ${contract.status === "ACTIVE" ? "online" : contract.status === "SUSPENDED" ? "pending" : "faulted"}`}
                      >
                        {contract.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.contracts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">
                      No Plug & Charge contracts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Certificate Diagnostics</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fingerprint</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Valid To</th>
                  <th>Mapped CPs</th>
                </tr>
              </thead>
              <tbody>
                {data.certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="font-mono text-xs">
                      {certificate.certificateHash.slice(0, 16)}...
                    </td>
                    <td>{certificate.certificateType}</td>
                    <td>
                      <span
                        className={`pill ${certificate.status === "ACTIVE" ? "online" : certificate.status === "PENDING" ? "pending" : "faulted"}`}
                      >
                        {certificate.status}
                      </span>
                    </td>
                    <td>{certificate.validTo ?? "-"}</td>
                    <td>{certificate.mappedChargePointIds.length}</td>
                  </tr>
                ))}
                {data.certificates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-subtle py-8">
                      No certificates available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Operational Note</div>
        <p className="text-sm text-subtle">{data.note}</p>
      </div>
    </DashboardLayout>
  );
}
