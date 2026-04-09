import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useEnergyDerProfile,
  useUpsertEnergyDerProfile,
} from "@/core/hooks/useEnergyManagement";
import { useStations } from "@/core/hooks/useStations";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

type DerDraft = {
  status: string;
  maxGridImportKw: string;
  reserveGridKw: string;
  solarEnabled: boolean;
  maxSolarContributionKw: string;
  bessEnabled: boolean;
  maxBessDischargeKw: string;
  bessSocPercent: string;
  bessReserveSocPercent: string;
};

function draftFromProfile(profile: Record<string, unknown> | null): DerDraft {
  if (!profile) {
    return {
      status: "ACTIVE",
      maxGridImportKw: "",
      reserveGridKw: "",
      solarEnabled: false,
      maxSolarContributionKw: "",
      bessEnabled: false,
      maxBessDischargeKw: "",
      bessSocPercent: "",
      bessReserveSocPercent: "",
    };
  }

  const read = (key: string) => {
    const value = profile[key];
    return value === null || value === undefined || value === ""
      ? ""
      : String(value);
  };

  return {
    status: read("status") || "ACTIVE",
    maxGridImportKw: read("maxGridImportKw"),
    reserveGridKw: read("reserveGridKw"),
    solarEnabled: Boolean(profile.solarEnabled),
    maxSolarContributionKw: read("maxSolarContributionKw"),
    bessEnabled: Boolean(profile.bessEnabled),
    maxBessDischargeKw: read("maxBessDischargeKw"),
    bessSocPercent: read("bessSocPercent"),
    bessReserveSocPercent: read("bessReserveSocPercent"),
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DerOrchestrationPage() {
  const stationsQuery = useStations();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );
  const stationId = selectedStationId ?? stationsQuery.data?.[0]?.id ?? "";

  const derProfileQuery = useEnergyDerProfile(stationId || undefined);
  const upsertMutation = useUpsertEnergyDerProfile();

  const profileRecord = useMemo(() => {
    return asRecord(derProfileQuery.data?.profile ?? null);
  }, [derProfileQuery.data?.profile]);

  const [draftByStation, setDraftByStation] = useState<
    Record<string, DerDraft>
  >({});
  const profileSeed = useMemo(
    () =>
      draftFromProfile(
        Object.keys(profileRecord).length > 0 ? profileRecord : null,
      ),
    [profileRecord],
  );
  const draft = stationId
    ? (draftByStation[stationId] ?? profileSeed)
    : profileSeed;

  const updateDraft = (updater: (current: DerDraft) => DerDraft) => {
    if (!stationId) return;
    setDraftByStation((current) => ({
      ...current,
      [stationId]: updater(current[stationId] ?? profileSeed),
    }));
  };

  const constraints = asRecord(derProfileQuery.data?.constraints);

  const handleSave = async () => {
    if (!stationId) return;

    await upsertMutation.mutateAsync({
      stationId,
      input: {
        status: draft.status,
        maxGridImportKw: parseOptionalNumber(draft.maxGridImportKw),
        reserveGridKw: parseOptionalNumber(draft.reserveGridKw),
        solarEnabled: draft.solarEnabled,
        maxSolarContributionKw: parseOptionalNumber(
          draft.maxSolarContributionKw,
        ),
        bessEnabled: draft.bessEnabled,
        maxBessDischargeKw: parseOptionalNumber(draft.maxBessDischargeKw),
        bessSocPercent: parseOptionalNumber(draft.bessSocPercent),
        bessReserveSocPercent: parseOptionalNumber(draft.bessReserveSocPercent),
      },
    });

    setDraftByStation((current) => {
      if (!stationId || !(stationId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[stationId];
      return next;
    });
  };

  if (stationsQuery.isLoading) {
    return (
      <DashboardLayout pageTitle="DER Orchestration">
        <div className="p-8 text-center text-subtle">
          Loading station context...
        </div>
      </DashboardLayout>
    );
  }

  if (stationsQuery.error || !stationsQuery.data) {
    return (
      <DashboardLayout pageTitle="DER Orchestration">
        <div className="p-8 text-center text-danger">
          Unable to load station context.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="DER Orchestration">
      <div className="card mb-6">
        <div className="section-title">Station Selector</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="input"
            value={stationId}
            onChange={(event) => setSelectedStationId(event.target.value)}
          >
            {stationsQuery.data.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn secondary"
            onClick={() => derProfileQuery.refetch()}
            disabled={!stationId || derProfileQuery.isFetching}
          >
            Refresh DER Profile
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={!stationId || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? "Saving..." : "Save DER Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-title">DER Profile</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="form-label">
              Status
              <select
                className="input"
                value={draft.status}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>
            <label className="form-label">
              Max Grid Import (kW)
              <input
                className="input"
                value={draft.maxGridImportKw}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    maxGridImportKw: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-label">
              Reserve Grid (kW)
              <input
                className="input"
                value={draft.reserveGridKw}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    reserveGridKw: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-label">
              Max Solar Contribution (kW)
              <input
                className="input"
                value={draft.maxSolarContributionKw}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    maxSolarContributionKw: event.target.value,
                  }))
                }
                disabled={!draft.solarEnabled}
              />
            </label>
            <label className="form-label">
              Max BESS Discharge (kW)
              <input
                className="input"
                value={draft.maxBessDischargeKw}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    maxBessDischargeKw: event.target.value,
                  }))
                }
                disabled={!draft.bessEnabled}
              />
            </label>
            <label className="form-label">
              BESS SoC (%)
              <input
                className="input"
                value={draft.bessSocPercent}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    bessSocPercent: event.target.value,
                  }))
                }
              />
            </label>
            <label className="form-label">
              BESS Reserve SoC (%)
              <input
                className="input"
                value={draft.bessReserveSocPercent}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    bessReserveSocPercent: event.target.value,
                  }))
                }
              />
            </label>
            <div className="flex items-end gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.solarEnabled}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      solarEnabled: event.target.checked,
                    }))
                  }
                />
                Solar Enabled
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.bessEnabled}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      bessEnabled: event.target.checked,
                    }))
                  }
                />
                BESS Enabled
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Derived Constraints</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">Profile active</span>
              <span className="font-semibold">
                {String(Boolean(constraints.profileActive))}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">Grid headroom (kW)</span>
              <span className="font-semibold">
                {String(constraints.gridHeadroomKw ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">Solar contribution (kW)</span>
              <span className="font-semibold">
                {String(constraints.solarContributionKw ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">BESS contribution (kW)</span>
              <span className="font-semibold">
                {String(constraints.bessContributionKw ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">Total available (kW)</span>
              <span className="font-semibold">
                {String(constraints.totalAvailableKw ?? "-")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-bg-muted/35 px-3 py-2">
              <span className="text-subtle">Max charging limit (A)</span>
              <span className="font-semibold">
                {String(constraints.effectiveMaxChargingAmps ?? "-")}
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle mt-4">
            {derProfileQuery.data?.note ?? "No DER profile loaded yet."}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
