import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEnergyLoadGroups } from "@/core/hooks/useEnergyManagement";
import { PATHS } from "@/router/paths";
import { ArrowRight, Layers3 } from "lucide-react";

export function LoadPolicyPage() {
  const { data: groups, isLoading } = useEnergyLoadGroups();

  return (
    <DashboardLayout
      pageTitle="Load Policy"
      actions={
        <Link className="btn ghost sm" to={PATHS.SMART_CHARGING}>
          <Layers3 size={14} /> EMS console
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                Projection view
              </div>
              <h1 className="mt-1 text-2xl font-black text-[var(--text)]">
                Load policy is now an EMS group projection
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-subtle)]">
                This page mirrors the backend EMS state. It does not manage a
                separate write model.
              </p>
            </div>
            <span className="pill active">{groups?.length ?? 0} group(s)</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-subtle)]">
            Loading EMS group projection...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Station</th>
                  <th>Mode</th>
                  <th>Headroom</th>
                  <th>Members</th>
                  <th>Alerts</th>
                  <th>Telemetry</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(groups ?? []).map((group) => (
                  <tr key={group.id}>
                    <td className="font-semibold text-sm">
                      <div>{group.name}</div>
                      <div className="text-xs text-[var(--text-subtle)]">
                        {group.description ?? "No description"}
                      </div>
                    </td>
                    <td className="text-sm">
                      <div>{group.stationName}</div>
                      <div className="text-xs text-[var(--text-subtle)]">
                        {group.stationId}
                      </div>
                    </td>
                    <td className="text-sm">
                      <span
                        className={`pill ${group.observeOnly ? "pending" : group.controlMode === "ACTIVE" ? "active" : "offline"}`}
                      >
                        {group.controlMode}
                      </span>
                    </td>
                    <td className="text-sm">
                      {group.headroom.phase1} / {group.headroom.phase2} /{" "}
                      {group.headroom.phase3} A
                    </td>
                    <td className="text-sm">{group.activeMembers}</td>
                    <td className="text-sm">{group.activeAlertCount}</td>
                    <td className="text-sm">{group.telemetryStatus}</td>
                    <td className="text-right">
                      <Link
                        className="btn ghost sm"
                        to={PATHS.SMART_CHARGING}
                        state={{ energyGroupId: group.id }}
                      >
                        Open <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
