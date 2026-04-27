import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PATHS } from "@/router/paths";
import {
  listPlatformTenants,
  type PlatformTenantSummary,
} from "@/core/api/platformTenants";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: PlatformTenantSummary["status"]) {
  if (status === "Active") return "online";
  if (status === "Suspended" || status === "Revoked") return "danger";
  if (status === "Past Due") return "overdue";
  return "pending";
}

export function TenantsPage() {
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await listPlatformTenants();
        if (mounted) setTenants(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTenants = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return tenants;

    return tenants.filter((tenant) => {
      return [
        tenant.name,
        tenant.code,
        tenant.city,
        tenant.country,
        tenant.email,
        tenant.status,
        tenant.cpoType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, tenants]);

  return (
    <DashboardLayout pageTitle="Tenants">
      <div className="space-y-4">
        <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="section-title">Tenant Management</div>
            <p className="mt-1 text-sm text-subtle">
              Review tenant applications, manage subscriptions, view tenant details,
              and manage stations on behalf of tenants.
            </p>
          </div>

          <input
            className="input md:w-72"
            placeholder="Search tenants..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-subtle">Loading tenants...</div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-8 text-center text-subtle">No tenants found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Stations</th>
                    <th className="px-4 py-3">Charge Points</th>
                    <th className="px-4 py-3">Swap Cabinets</th>
                    <th className="px-4 py-3">Revenue 30d</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-[var(--border)] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--text)]">
                          {tenant.name}
                        </div>
                        <div className="text-xs text-subtle">
                          {tenant.code} · {tenant.city}, {tenant.country}
                        </div>
                      </td>
                      <td className="px-4 py-3">{tenant.cpoType}</td>
                      <td className="px-4 py-3">
                        <span className={`pill ${statusClass(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{tenant.stationCount}</td>
                      <td className="px-4 py-3">{tenant.chargePointCount}</td>
                      <td className="px-4 py-3">{tenant.swapCabinetCount}</td>
                      <td className="px-4 py-3">
                        {formatMoney(tenant.revenue30d, tenant.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="btn"
                          to={PATHS.TENANT_DETAIL(tenant.id)}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
