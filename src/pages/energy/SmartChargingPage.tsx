import { useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { canAccessPolicy } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { useTenant } from "@/core/hooks/useTenant";
import {
  useActivateEnergyGroup,
  useAcknowledgeEnergyAlert,
  useClearEnergyOverride,
  useCreateEnergyGroup,
  useCreateEnergyOverride,
  useDeleteEnergyGroup,
  useDisableEnergyGroup,
  useEnergyLoadGroups,
  useEnergyLoadGroup,
  useEnergyLoadGroupHistory,
  useEnergyStationLiveStatus,
  useIngestEnergyTelemetry,
  useRecalculateEnergyGroup,
  useRecalculateEnergyStation,
  useSimulateEnergyMeterLoss,
  useUpdateEnergyGroup,
} from "@/core/hooks/useEnergyManagement";
import {
  useApproveEnergyOptimizationPlan,
  useApproveEnergySchedule,
  useCreateEnergyOptimizationPlan,
  useCreateEnergySchedule,
  useEnergyOptimizationPlans,
  useEnergyPlanRuns,
  useEnergySchedules,
} from "@/core/hooks/useEnergyPlanner";
import type {
  EnergyAllocationMethod,
  EnergyControlMode,
  EnergyLoadGroupDetail,
  EnergyLoadGroupMembershipInput,
  EnergyLoadGroupUpsertInput,
  EnergyMeterPlacement,
  EnergyPhaseTriple,
} from "@/core/types/energyManagement";
import { PATHS } from "@/router/paths";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Gauge,
  History,
  Layers3,
  Plus,
  Power,
  RefreshCcw,
  ShieldAlert,
  Square,
  TestTubes,
  Trash2,
  TriangleAlert,
  Wifi,
  Zap,
} from "lucide-react";

type WizardStep = "group" | "limit" | "meter" | "buffer" | "chargers" | "test";
type TripleDraft = { phase1: string; phase2: string; phase3: string };
type MembershipDraft = {
  chargePointId: string;
  enabled: boolean;
  priority: string;
  smartChargingEnabled: boolean;
  maxAmps: string;
};
type DraftState = {
  stationId: string;
  name: string;
  description: string;
  controlMode: EnergyControlMode;
  observeOnly: boolean;
  allocationMethod: EnergyAllocationMethod;
  meterSource: string;
  meterPlacement: EnergyMeterPlacement;
  siteLimit: TripleDraft;
  dynamicBuffer: TripleDraft;
  failSafe: TripleDraft;
  siteLoad: TripleDraft;
  nonEvLoad: TripleDraft;
  freshnessSec: string;
  deadbandAmps: string;
  commandRefreshSec: string;
  memberships: MembershipDraft[];
  overrideReason: string;
  overrideCapAmps: string;
  overrideExpiresAt: string;
};

const STEPS: Array<{ id: WizardStep; label: string; helper: string }> = [
  {
    id: "group",
    label: "Group",
    helper: "Choose the site scope and control mode.",
  },
  {
    id: "limit",
    label: "Limit",
    helper: "Set site caps and the allocation method.",
  },
  {
    id: "meter",
    label: "Meter",
    helper: "Bind the meter and feed live readings.",
  },
  {
    id: "buffer",
    label: "Buffer",
    helper: "Reserve a safety margin before dispatch.",
  },
  {
    id: "chargers",
    label: "Chargers",
    helper: "Assign priorities and charger limits.",
  },
  {
    id: "test",
    label: "Test",
    helper: "Dry-run, activate, and validate the result.",
  },
];

const DEV_MODE = import.meta.env.DEV;

function blankTriple(value = "0"): TripleDraft {
  return { phase1: value, phase2: value, phase3: value };
}
function tripleFrom(value?: EnergyPhaseTriple | null): TripleDraft {
  return {
    phase1: String(value?.phase1 ?? 0),
    phase2: String(value?.phase2 ?? 0),
    phase3: String(value?.phase3 ?? 0),
  };
}
function toTriple(value: TripleDraft): EnergyPhaseTriple {
  return {
    phase1: Math.max(0, Number(value.phase1) || 0),
    phase2: Math.max(0, Number(value.phase2) || 0),
    phase3: Math.max(0, Number(value.phase3) || 0),
  };
}
function formatTriple(value: EnergyPhaseTriple | TripleDraft) {
  return `${Number(value.phase1)} / ${Number(value.phase2)} / ${Number(value.phase3)} A`;
}
function formatAge(value: number | null | undefined) {
  return value === null || value === undefined
    ? "Unknown"
    : value < 60
      ? `${value}s`
      : `${Math.round(value / 60)}m`;
}
function asDataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function toDatetimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
function blankDraft(defaultStationId = ""): DraftState {
  return {
    stationId: defaultStationId,
    name: "",
    description: "",
    controlMode: "OBSERVE_ONLY",
    observeOnly: true,
    allocationMethod: "EQUAL",
    meterSource: "",
    meterPlacement: "MAIN",
    siteLimit: blankTriple("0"),
    dynamicBuffer: blankTriple("0"),
    failSafe: blankTriple("0"),
    siteLoad: blankTriple("0"),
    nonEvLoad: blankTriple("0"),
    freshnessSec: "",
    deadbandAmps: "1",
    commandRefreshSec: "300",
    memberships: [
      {
        chargePointId: "",
        enabled: true,
        priority: "1",
        smartChargingEnabled: true,
        maxAmps: "",
      },
    ],
    overrideReason: "",
    overrideCapAmps: "0",
    overrideExpiresAt: toDatetimeLocal(
      new Date(Date.now() + 2 * 60 * 60 * 1000),
    ),
  };
}
function draftFromGroup(group: EnergyLoadGroupDetail): DraftState {
  const latest = group.telemetry[0] ?? null;
  return {
    stationId: group.stationId,
    name: group.name,
    description: group.description ?? "",
    controlMode: group.controlMode,
    observeOnly: group.observeOnly,
    allocationMethod: group.allocationMethod,
    meterSource: group.meterSource ?? "",
    meterPlacement: group.meterPlacement,
    siteLimit: tripleFrom(group.siteLimit),
    dynamicBuffer: tripleFrom(group.dynamicBuffer),
    failSafe: tripleFrom(group.failSafe),
    siteLoad: tripleFrom(latest?.siteLoadAmps ?? group.siteLimit),
    nonEvLoad: tripleFrom(latest?.nonEvLoadAmps ?? group.nonEvLoad),
    freshnessSec: String(latest?.freshnessSec ?? group.telemetryAgeSec ?? ""),
    deadbandAmps: String(group.deadbandAmps),
    commandRefreshSec: String(group.commandRefreshSec),
    memberships:
      group.memberships.length > 0
        ? group.memberships.map((m) => ({
            chargePointId: m.chargePointId,
            enabled: m.enabled,
            priority: String(m.priority),
            smartChargingEnabled: m.smartChargingEnabled,
            maxAmps: m.maxAmps === null ? "" : String(m.maxAmps),
          }))
        : [
            {
              chargePointId: "",
              enabled: true,
              priority: "1",
              smartChargingEnabled: true,
              maxAmps: "",
            },
          ],
    overrideReason: "",
    overrideCapAmps: String(group.activeOverride?.capAmps ?? 0),
    overrideExpiresAt: toDatetimeLocal(
      new Date(Date.now() + 2 * 60 * 60 * 1000),
    ),
  };
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--text)]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-subtle)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-[var(--text-subtle)]">{hint}</span>
        )}
      </div>
      {children}
    </label>
  );
}
function TripleEditor({
  title,
  value,
  onChange,
  disabled,
}: {
  title: string;
  value: TripleDraft;
  onChange: (next: TripleDraft) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {title}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["phase1", "phase2", "phase3"] as const).map((phase) => (
          <label key={phase} className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-subtle)]">
              {phase}
            </span>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              value={value[phase]}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...value, [phase]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/65">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}
function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[var(--text-subtle)]">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function WizardPane({
  step,
  canWrite,
  mode,
  draft,
  setDraft,
  currentPlan,
  headroom,
  activeOverride,
  saveGroup,
  recalculate,
  activateGroup,
  disableGroup,
  deleteGroup,
  clearOverride,
  applyOverride,
  ingestTelemetry,
  simulateMeterLoss,
}: {
  step: WizardStep;
  canWrite: boolean;
  mode: "edit" | "create";
  draft: DraftState;
  setDraft: (value: DraftState | ((current: DraftState) => DraftState)) => void;
  currentPlan:
    | NonNullable<EnergyLoadGroupDetail["currentDecision"]>["plan"]
    | null;
  headroom: EnergyPhaseTriple;
  activeOverride: EnergyLoadGroupDetail["activeOverride"];
  saveGroup: () => Promise<void>;
  recalculate: (dryRun?: boolean) => Promise<void>;
  activateGroup: () => Promise<void>;
  disableGroup: () => Promise<void>;
  deleteGroup: () => Promise<void>;
  clearOverride: () => Promise<void>;
  applyOverride: () => Promise<void>;
  ingestTelemetry: () => Promise<void>;
  simulateMeterLoss: () => Promise<void>;
}) {
  const updateMembership = (index: number, next: Partial<MembershipDraft>) =>
    setDraft((current) => {
      const memberships = [...current.memberships];
      memberships[index] = { ...memberships[index], ...next };
      return { ...current, memberships };
    });

  if (step === "group") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Station ID"
          hint={mode === "edit" ? "Fixed after creation" : "Required"}
        >
          <input
            className="input"
            value={draft.stationId}
            disabled={mode === "edit" || !canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                stationId: event.target.value,
              }))
            }
            placeholder="st-1"
          />
        </Field>
        <Field label="Group name">
          <input
            className="input"
            value={draft.name}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Westlands DLM"
          />
        </Field>
        <Field label="Description" hint="Optional">
          <textarea
            className="input min-h-[96px]"
            value={draft.description}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Constrained office site with priority charging."
          />
        </Field>
        <Field
          label="Control mode"
          hint={
            mode === "edit" ? "Use activate/disable actions" : "New group only"
          }
        >
          <select
            className="input"
            value={draft.controlMode}
            disabled={!canWrite || mode === "edit"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                controlMode: event.target.value as EnergyControlMode,
              }))
            }
          >
            <option value="OBSERVE_ONLY">Observe only</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </Field>
        <Field label="Observe only">
          <select
            className="input"
            value={draft.observeOnly ? "yes" : "no"}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                observeOnly: event.target.value === "yes",
              }))
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Allocation method">
          <select
            className="input"
            value={draft.allocationMethod}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                allocationMethod: event.target.value as EnergyAllocationMethod,
              }))
            }
          >
            <option value="EQUAL">Equal share</option>
            <option value="PRIORITY">Priority weighted</option>
          </select>
        </Field>
      </div>
    );
  }

  if (step === "limit") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <TripleEditor
          title="Site cap"
          value={draft.siteLimit}
          onChange={(next) =>
            setDraft((current) => ({ ...current, siteLimit: next }))
          }
          disabled={!canWrite}
        />
        <TripleEditor
          title="Fail-safe cap"
          value={draft.failSafe}
          onChange={(next) =>
            setDraft((current) => ({ ...current, failSafe: next }))
          }
          disabled={!canWrite}
        />
        <Field label="Deadband amps">
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={draft.deadbandAmps}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadbandAmps: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="Command refresh" hint="Seconds">
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={draft.commandRefreshSec}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                commandRefreshSec: event.target.value,
              }))
            }
          />
        </Field>
        <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-subtle)]">
          The allocator computes `available = siteLimit - nonEvLoad - buffer`,
          then clamps the result against the fail-safe ceiling before charger
          limits are distributed.
        </div>
      </div>
    );
  }

  if (step === "meter") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Meter source">
          <input
            className="input"
            value={draft.meterSource}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                meterSource: event.target.value,
              }))
            }
            placeholder="MDB meter"
          />
        </Field>
        <Field label="Meter placement">
          <select
            className="input"
            value={draft.meterPlacement}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                meterPlacement: event.target.value as EnergyMeterPlacement,
              }))
            }
          >
            <option value="MAIN">Main</option>
            <option value="SUB_FEEDER">Sub feeder</option>
            <option value="DERIVED">Derived</option>
          </select>
        </Field>
        <TripleEditor
          title="Site load"
          value={draft.siteLoad}
          onChange={(next) =>
            setDraft((current) => ({ ...current, siteLoad: next }))
          }
          disabled={!canWrite}
        />
        <TripleEditor
          title="Non-EV load"
          value={draft.nonEvLoad}
          onChange={(next) =>
            setDraft((current) => ({ ...current, nonEvLoad: next }))
          }
          disabled={!canWrite}
        />
        <Field label="Freshness seconds">
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={draft.freshnessSec}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                freshnessSec: event.target.value,
              }))
            }
          />
        </Field>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-subtle)]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text)]">
            <Wifi size={16} /> Metering guidance
          </div>
          <p>
            When meter telemetry ages past the fail-safe threshold, the backend
            clamps charger limits conservatively and marks the decision trace
            accordingly.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="btn secondary sm"
              type="button"
              onClick={ingestTelemetry}
              disabled={!canWrite || mode !== "edit"}
            >
              <CheckCircle2 size={14} /> Ingest telemetry
            </button>
            <button
              className="btn secondary sm"
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  freshnessSec: String(Math.floor(Date.now() / 1000)),
                }))
              }
              disabled={!canWrite}
            >
              <Clock3 size={14} /> Refresh draft
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "buffer") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <TripleEditor
          title="Dynamic buffer"
          value={draft.dynamicBuffer}
          onChange={(next) =>
            setDraft((current) => ({ ...current, dynamicBuffer: next }))
          }
          disabled={!canWrite}
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-subtle)]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text)]">
            <TriangleAlert size={16} /> Safety view
          </div>
          <p>
            Buffer is reserved before EMS dispatch. A larger buffer lowers
            headroom but gives the site more protection during sudden load
            spikes.
          </p>
          <div className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--text-subtle)]">
            Live headroom preview
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text)]">
            {formatTriple(
              mode === "edit" ? headroom : toTriple(draft.siteLimit),
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "chargers") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--text-subtle)]">
            One active membership per charge point keeps the first-phase control
            loop conservative.
          </div>
          <button
            className="btn secondary sm"
            type="button"
            disabled={!canWrite}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                memberships: [
                  ...current.memberships,
                  {
                    chargePointId: "",
                    enabled: true,
                    priority: String(current.memberships.length + 1),
                    smartChargingEnabled: true,
                    maxAmps: "",
                  },
                ],
              }))
            }
          >
            <Plus size={14} /> Add charger
          </button>
        </div>
        <div className="space-y-3">
          {draft.memberships.map((membership, index) => (
            <div
              key={`${index}-${membership.chargePointId}`}
              className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 md:grid-cols-5"
            >
              <Field label="Charge point">
                <input
                  className="input"
                  value={membership.chargePointId}
                  disabled={!canWrite}
                  onChange={(event) =>
                    updateMembership(index, {
                      chargePointId: event.target.value,
                    })
                  }
                  placeholder="cp-1"
                />
              </Field>
              <Field label="Priority">
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={membership.priority}
                  disabled={!canWrite}
                  onChange={(event) =>
                    updateMembership(index, { priority: event.target.value })
                  }
                />
              </Field>
              <Field label="Max amps">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  value={membership.maxAmps}
                  disabled={!canWrite}
                  onChange={(event) =>
                    updateMembership(index, { maxAmps: event.target.value })
                  }
                />
              </Field>
              <Field label="Enabled">
                <select
                  className="input"
                  value={membership.enabled ? "yes" : "no"}
                  disabled={!canWrite}
                  onChange={(event) =>
                    updateMembership(index, {
                      enabled: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field label="Smart charging">
                <div className="flex items-center gap-2">
                  <select
                    className="input"
                    value={membership.smartChargingEnabled ? "yes" : "no"}
                    disabled={!canWrite}
                    onChange={(event) =>
                      updateMembership(index, {
                        smartChargingEnabled: event.target.value === "yes",
                      })
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <button
                    className="btn ghost icon"
                    type="button"
                    disabled={!canWrite || draft.memberships.length === 1}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        memberships: current.memberships.filter(
                          (_, rowIndex) => rowIndex !== index,
                        ),
                      }))
                    }
                    title="Remove charger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Field>
            </div>
          ))}{" "}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-subtle)]">
          The gateway will only apply a charger limit when
          `smartChargingEnabled` is true and the charge point reports
          smart-charging support.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <div className="space-y-3">
        <button
          className="btn primary w-full justify-center"
          type="button"
          onClick={saveGroup}
          disabled={!canWrite}
        >
          <CheckCircle2 size={14} /> Save draft
        </button>
        <button
          className="btn secondary w-full justify-center"
          type="button"
          onClick={() => recalculate(true)}
          disabled={!canWrite || mode !== "edit"}
        >
          <TestTubes size={14} /> Dry-run allocation
        </button>
        <button
          className="btn secondary w-full justify-center"
          type="button"
          onClick={() => recalculate(false)}
          disabled={!canWrite || mode !== "edit"}
        >
          <RefreshCcw size={14} /> Recalculate now
        </button>
        <button
          className="btn secondary w-full justify-center"
          type="button"
          onClick={activateGroup}
          disabled={!canWrite || mode !== "edit"}
        >
          <Power size={14} /> Enable EMS control
        </button>
        <button
          className="btn secondary w-full justify-center"
          type="button"
          onClick={disableGroup}
          disabled={!canWrite || mode !== "edit"}
        >
          <Square size={14} /> Disable EMS control
        </button>
        <button
          className="btn danger w-full justify-center"
          type="button"
          onClick={deleteGroup}
          disabled={!canWrite || mode !== "edit"}
        >
          <Trash2 size={14} /> Disable via delete action
        </button>
        {DEV_MODE && (
          <button
            className="btn ghost w-full justify-center"
            type="button"
            onClick={simulateMeterLoss}
            disabled={!canWrite || mode !== "edit"}
          >
            <TriangleAlert size={14} /> Simulate meter loss
          </button>
        )}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-xs text-[var(--text-subtle)]">
          The backend persists every decision trace, input snapshot, and command
          result so operator actions remain auditable.
        </div>
      </div>
      <div className="space-y-4">
        <Panel title="Temporary cap" subtitle="Manual override with expiry">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Reason">
              <input
                className="input"
                value={draft.overrideReason}
                disabled={!canWrite || mode !== "edit"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    overrideReason: event.target.value,
                  }))
                }
                placeholder="Evening site protection"
              />
            </Field>
            <Field label="Cap amps">
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={draft.overrideCapAmps}
                disabled={!canWrite || mode !== "edit"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    overrideCapAmps: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Expires at">
              <input
                className="input"
                type="datetime-local"
                value={draft.overrideExpiresAt}
                disabled={!canWrite || mode !== "edit"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    overrideExpiresAt: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="btn primary sm"
              type="button"
              onClick={applyOverride}
              disabled={!canWrite || mode !== "edit"}
            >
              <ShieldAlert size={14} /> Apply cap
            </button>
            <button
              className="btn secondary sm"
              type="button"
              onClick={clearOverride}
              disabled={!canWrite || mode !== "edit" || !activeOverride}
            >
              <Eye size={14} /> Clear override
            </button>
          </div>
        </Panel>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-xs text-[var(--text-subtle)]">
          Current decision hash:{" "}
          <span className="font-mono text-[var(--text)]">
            {currentPlan?.decisionHash ?? "No decision yet"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SmartChargingPage() {
  const user = useAuthStore((state) => state.user);
  const { activeStationContext } = useTenant();
  const location = useLocation();
  const canWrite = canAccessPolicy(user, "smartChargingWrite");
  const locationGroupId =
    (location.state as { energyGroupId?: string } | null)?.energyGroupId ??
    null;
  const [step, setStep] = useState<WizardStep>("group");
  const [mode, setMode] = useState<"edit" | "create">("edit");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    () => locationGroupId,
  );
  const previousGroupIdRef = useRef<string | null>(null);
  const [draftsByGroupId, setDraftsByGroupId] = useState<
    Record<string, DraftState>
  >({});
  const [createDraft, setCreateDraft] = useState<DraftState>(() =>
    blankDraft(activeStationContext?.stationId ?? ""),
  );
  const [statusMessage, setStatusMessage] = useState("Ready for EMS control.");

  const groupsQuery = useEnergyLoadGroups();
  const groups = groupsQuery.data ?? [];
  const resolvedSelectedGroupId =
    mode === "edit" ? (selectedGroupId ?? groups[0]?.id ?? null) : null;
  const selectedGroupQuery = useEnergyLoadGroup(
    resolvedSelectedGroupId ?? undefined,
  );
  const historyQuery = useEnergyLoadGroupHistory(
    resolvedSelectedGroupId ?? undefined,
    6,
  );
  const liveStationId =
    mode === "edit"
      ? (selectedGroupQuery.data?.stationId ?? "")
      : createDraft.stationId;
  const stationLiveQuery = useEnergyStationLiveStatus(
    liveStationId.trim() || undefined,
  );
  const selectedGroup =
    mode === "edit" ? (selectedGroupQuery.data ?? null) : null;
  const currentStationGroups = stationLiveQuery.data ?? [];
  const draft =
    mode === "edit"
      ? selectedGroup
        ? (draftsByGroupId[selectedGroup.id] ?? draftFromGroup(selectedGroup))
        : createDraft
      : createDraft;
  const setDraft = (
    value: DraftState | ((current: DraftState) => DraftState),
  ) => {
    if (mode === "edit" && selectedGroup) {
      setDraftsByGroupId((current) => {
        const baseDraft =
          current[selectedGroup.id] ?? draftFromGroup(selectedGroup);
        const nextDraft =
          typeof value === "function" ? value(baseDraft) : value;
        return { ...current, [selectedGroup.id]: nextDraft };
      });
      return;
    }

    setCreateDraft((current) =>
      typeof value === "function" ? value(current) : value,
    );
  };
  const currentPlan = selectedGroup?.currentDecision?.plan ?? null;
  const activeOverride = selectedGroup?.activeOverride ?? null;

  const createMutation = useCreateEnergyGroup();
  const updateMutation = useUpdateEnergyGroup();
  const deleteMutation = useDeleteEnergyGroup();
  const activateMutation = useActivateEnergyGroup();
  const disableMutation = useDisableEnergyGroup();
  const recalcGroupMutation = useRecalculateEnergyGroup();
  const recalcStationMutation = useRecalculateEnergyStation();
  const ingestTelemetryMutation = useIngestEnergyTelemetry();
  const overrideMutation = useCreateEnergyOverride();
  const clearOverrideMutation = useClearEnergyOverride();
  const alertMutation = useAcknowledgeEnergyAlert();
  const meterLossMutation = useSimulateEnergyMeterLoss();
  const plannerEnabled = mode === "edit" && Boolean(selectedGroup);
  const optimizationPlansQuery = useEnergyOptimizationPlans(
    plannerEnabled
      ? {
          stationId: selectedGroup?.stationId,
          groupId: selectedGroup?.id,
        }
      : undefined,
    { enabled: plannerEnabled },
  );
  const schedulesQuery = useEnergySchedules(
    plannerEnabled
      ? {
          stationId: selectedGroup?.stationId,
          groupId: selectedGroup?.id,
        }
      : undefined,
    { enabled: plannerEnabled },
  );
  const planRunsQuery = useEnergyPlanRuns(
    plannerEnabled
      ? {
          stationId: selectedGroup?.stationId,
          groupId: selectedGroup?.id,
        }
      : undefined,
    { enabled: plannerEnabled },
  );
  const createOptimizationPlanMutation = useCreateEnergyOptimizationPlan();
  const approveOptimizationPlanMutation = useApproveEnergyOptimizationPlan();
  const createScheduleMutation = useCreateEnergySchedule();
  const approveScheduleMutation = useApproveEnergySchedule();
  const optimizationPlans = optimizationPlansQuery.data ?? [];
  const scheduleItems = schedulesQuery.data ?? [];
  const planRuns = planRunsQuery.data ?? [];

  const saveGroup = async () => {
    if (!draft.name.trim() || (mode === "create" && !draft.stationId.trim())) {
      setStatusMessage("Station ID and group name are required.");
      return;
    }

    const memberships: EnergyLoadGroupMembershipInput[] = draft.memberships
      .filter((membership) => membership.chargePointId.trim().length > 0)
      .map((membership) => ({
        chargePointId: membership.chargePointId.trim(),
        enabled: membership.enabled,
        priority: Number(membership.priority) || 1,
        smartChargingEnabled: membership.smartChargingEnabled,
        maxAmps:
          membership.maxAmps.trim().length > 0
            ? Number(membership.maxAmps) || 0
            : null,
      }));

    const payload: Partial<EnergyLoadGroupUpsertInput> = {
      stationId: draft.stationId.trim(),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      controlMode: draft.controlMode,
      allocationMethod: draft.allocationMethod,
      meterSource: draft.meterSource.trim() || null,
      meterPlacement: draft.meterPlacement,
      siteLimitAmpsPhase1: Number(draft.siteLimit.phase1) || 0,
      siteLimitAmpsPhase2: Number(draft.siteLimit.phase2) || 0,
      siteLimitAmpsPhase3: Number(draft.siteLimit.phase3) || 0,
      dynamicBufferAmpsPhase1: Number(draft.dynamicBuffer.phase1) || 0,
      dynamicBufferAmpsPhase2: Number(draft.dynamicBuffer.phase2) || 0,
      dynamicBufferAmpsPhase3: Number(draft.dynamicBuffer.phase3) || 0,
      failSafeAmpsPhase1: Number(draft.failSafe.phase1) || 0,
      failSafeAmpsPhase2: Number(draft.failSafe.phase2) || 0,
      failSafeAmpsPhase3: Number(draft.failSafe.phase3) || 0,
      deadbandAmps: Number(draft.deadbandAmps) || 1,
      commandRefreshSec: Number(draft.commandRefreshSec) || 300,
      observeOnly: draft.observeOnly,
      isActive: mode === "create" ? draft.controlMode === "ACTIVE" : undefined,
      activateNow:
        mode === "create"
          ? draft.controlMode === "ACTIVE" && !draft.observeOnly
          : undefined,
      memberships,
    };

    if (mode === "create") {
      const created = await createMutation.mutateAsync(
        payload as EnergyLoadGroupUpsertInput,
      );
      setMode("edit");
      setSelectedGroupId(created.id);
      setStatusMessage(`Created ${created.name}.`);
      return;
    }

    if (!resolvedSelectedGroupId) {
      return;
    }

    await updateMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      input: payload,
    });
    setStatusMessage(`Saved ${draft.name}.`);
  };

  const startCreate = () => {
    previousGroupIdRef.current = resolvedSelectedGroupId;
    setMode("create");
    setSelectedGroupId(null);
    setCreateDraft(
      blankDraft(
        selectedGroup?.stationId ??
          currentStationGroups[0]?.stationId ??
          activeStationContext?.stationId ??
          "",
      ),
    );
    setStep("group");
    setStatusMessage("Creating a new EMS group.");
  };

  const cancelCreate = () => {
    setMode("edit");
    setSelectedGroupId(previousGroupIdRef.current ?? groups[0]?.id ?? null);
    previousGroupIdRef.current = null;
    setStatusMessage("Returned to the selected group.");
  };

  const recalculate = async (dryRun = false) => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await recalcGroupMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      input: {
        dryRun,
        trigger: dryRun ? "dry-run" : "manual",
        reason: dryRun
          ? "Dry run from portal"
          : "Manual recalculate from portal",
      },
    });
    setStatusMessage(
      dryRun
        ? "Dry run completed."
        : "Recalculated and queued commands if needed.",
    );
  };

  const recalculateStation = async () => {
    const stationId = (
      mode === "edit" ? (selectedGroup?.stationId ?? "") : createDraft.stationId
    ).trim();
    if (!stationId) return;
    await recalcStationMutation.mutateAsync({
      stationId,
      reason: "Station-level recalc from portal",
    });
    setStatusMessage(`Station ${stationId} recalculated.`);
  };

  const ingestTelemetry = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await ingestTelemetryMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      input: {
        sampledAt: new Date().toISOString(),
        meterSource: draft.meterSource.trim() || null,
        freshnessSec: Number(draft.freshnessSec) || 0,
        siteLoad: toTriple(draft.siteLoad),
        nonEvLoad: toTriple(draft.nonEvLoad),
        rawTelemetry: {
          origin: "portal-dev-injector",
          stationId: selectedGroup?.stationId,
        },
      },
    });
    setStatusMessage("Telemetry ingested and recalc requested.");
  };

  const applyOverride = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await overrideMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      input: {
        reason: draft.overrideReason.trim() || "Temporary operator cap",
        capAmps: Math.max(0, Number(draft.overrideCapAmps) || 0),
        expiresAt: new Date(draft.overrideExpiresAt).toISOString(),
      },
    });
    setStatusMessage("Temporary cap applied.");
  };

  const clearOverride = async () => {
    if (mode !== "edit" || !selectedGroup?.activeOverride) return;
    await clearOverrideMutation.mutateAsync({
      id: selectedGroup.id,
      overrideId: selectedGroup.activeOverride.id,
    });
    setStatusMessage("Override cleared.");
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await alertMutation.mutateAsync({ id: resolvedSelectedGroupId, alertId });
    setStatusMessage("Alert acknowledged.");
  };

  const simulateMeterLoss = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await meterLossMutation.mutateAsync(resolvedSelectedGroupId);
    setStatusMessage("Meter loss simulation applied.");
  };

  const activateGroup = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await activateMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      reason: "Activated from EMS portal",
    });
    setStatusMessage("Group activated.");
  };

  const disableGroup = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await disableMutation.mutateAsync({
      id: resolvedSelectedGroupId,
      reason: "Disabled from EMS portal",
    });
    setStatusMessage("Group disabled.");
  };

  const deleteGroup = async () => {
    if (mode !== "edit" || !resolvedSelectedGroupId) return;
    await deleteMutation.mutateAsync(resolvedSelectedGroupId);
    setSelectedGroupId(
      groups.find((group) => group.id !== resolvedSelectedGroupId)?.id ?? null,
    );
    setStatusMessage("Group disabled via delete action.");
  };

  const generateTariffPlan = async () => {
    if (!selectedGroup) return;
    const result = await createOptimizationPlanMutation.mutateAsync({
      stationId: selectedGroup.stationId,
      groupId: selectedGroup.id,
      windowStart: new Date().toISOString(),
      windowEnd: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      targetEnergyKwh: 60,
      dryRun: true,
    });
    setStatusMessage(
      result.state === "FALLBACK_DLM"
        ? `Planner fallback: ${result.fallbackReason ?? "DLM only"}`
        : "Tariff-aware plan generated in dry-run mode.",
    );
  };

  const approveTariffPlan = async (planId: string) => {
    const approved = await approveOptimizationPlanMutation.mutateAsync(planId);
    setStatusMessage(
      approved.state === "APPROVED"
        ? "Optimization plan approved."
        : `Plan state updated to ${approved.state}.`,
    );
  };

  const stageSchedule = async (planId: string) => {
    const staged = await createScheduleMutation.mutateAsync({
      planId,
      notes: "Staged from EMS SmartChargingPage",
    });
    setStatusMessage(
      staged.fallbackToDlm
        ? "Schedule staged in fallback mode (DLM only)."
        : "Schedule staged and awaiting approval.",
    );
  };

  const approveStagedSchedule = async (scheduleId: string) => {
    const approved = await approveScheduleMutation.mutateAsync({
      id: scheduleId,
      input: { notes: "Approved from EMS SmartChargingPage" },
    });
    setStatusMessage(
      approved.status === "ACTIVE"
        ? "Schedule approved and activated."
        : "Schedule approved in fallback mode.",
    );
  };

  const membershipCount =
    mode === "edit"
      ? (selectedGroup?.memberships.length ?? 0)
      : draft.memberships.filter(
          (membership) => membership.chargePointId.trim().length > 0,
        ).length;
  const activeLimit =
    currentPlan?.effectiveLimitAmps ?? (Number(draft.siteLimit.phase1) || 0);
  const headroom = currentPlan?.headroomAmps ?? toTriple(draft.siteLimit);
  const currentDecisionItems =
    historyQuery.data ?? selectedGroup?.decisions ?? [];
  const groupPillTone =
    mode === "create"
      ? "pending"
      : selectedGroup?.observeOnly
        ? "pending"
        : selectedGroup?.controlMode === "ACTIVE"
          ? "active"
          : "offline";

  if (groupsQuery.isLoading) {
    return (
      <DashboardLayout pageTitle="EMS / DLM">
        <div className="p-8 text-center text-subtle">Loading EMS groups...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="EMS / DLM"
      actions={
        <Link className="btn ghost sm" to={PATHS.LOAD_POLICY}>
          <Layers3 size={14} /> Load policy
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,118,110,0.95))] px-6 py-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/70">
                <span className="pill active">EMS CONTROL</span>
                <span className="pill pending">DLM</span>
                {mode === "create" ? (
                  <span className="pill pending">NEW GROUP</span>
                ) : (
                  <span className="pill active">
                    {selectedGroup?.stationName ?? "Station scope"}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Energy orchestration for live charging sites
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/75">
                This console owns the site load-control loop. It keeps charger
                limits inside the EMS envelope, applies safe buffer and
                fail-safe caps, and records every decision for auditability.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn primary sm"
                  onClick={saveGroup}
                  disabled={!canWrite}
                >
                  <Zap size={14} /> Save setup
                </button>
                <button
                  className="btn secondary sm"
                  onClick={startCreate}
                  disabled={!canWrite}
                >
                  <Plus size={14} /> New group
                </button>
                <button
                  className="btn secondary sm"
                  onClick={recalculateStation}
                  disabled={!canWrite}
                >
                  <RefreshCcw size={14} /> Recalculate station
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Groups"
                value={groups.length.toString()}
                icon={<Layers3 size={16} />}
              />
              <MiniMetric
                label="Active load"
                value={`${activeLimit} A`}
                icon={<Gauge size={16} />}
              />
              <MiniMetric
                label="Members"
                value={membershipCount.toString()}
                icon={<Activity size={16} />}
              />
              <MiniMetric
                label="Alerts"
                value={(mode === "edit"
                  ? (selectedGroup?.activeAlertCount ?? 0)
                  : 0
                ).toString()}
                icon={<AlertTriangle size={16} />}
              />
            </div>
          </div>
        </div>
        {!canWrite && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-subtle)]">
            Read-only access is active. You can inspect the EMS state, but write
            actions are hidden until `smart_charging.write` is granted.
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Panel
            title="Setup wizard"
            subtitle={
              mode === "create"
                ? "Draft a new EMS group."
                : "Tune the selected site and keep the live cap in sync."
            }
            action={
              mode === "create" ? (
                <button className="btn ghost sm" onClick={cancelCreate}>
                  <Square size={14} /> Cancel
                </button>
              ) : (
                <span className="text-xs text-[var(--text-subtle)]">
                  {statusMessage}
                </span>
              )
            }
          >
            <div className="flex flex-wrap gap-2">
              {STEPS.map((item) => (
                <button
                  key={item.id}
                  className={`btn sm ${step === item.id ? "primary" : "secondary"}`}
                  onClick={() => setStep(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <ShieldAlert size={16} />{" "}
                {STEPS.find((item) => item.id === step)?.helper}
              </div>
              <WizardPane
                step={step}
                canWrite={canWrite}
                mode={mode}
                draft={draft}
                setDraft={setDraft}
                currentPlan={currentPlan}
                headroom={headroom}
                activeOverride={activeOverride}
                saveGroup={saveGroup}
                recalculate={recalculate}
                activateGroup={activateGroup}
                disableGroup={disableGroup}
                deleteGroup={deleteGroup}
                clearOverride={clearOverride}
                applyOverride={applyOverride}
                ingestTelemetry={ingestTelemetry}
                simulateMeterLoss={simulateMeterLoss}
              />
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel
              title="Live site status"
              subtitle={
                selectedGroup
                  ? `${selectedGroup.stationName} · ${selectedGroup.stationId}`
                  : "Select a group to inspect its EMS state."
              }
              action={
                selectedGroup ? (
                  <span className={`pill ${groupPillTone}`}>
                    {selectedGroup.controlMode}
                  </span>
                ) : undefined
              }
            >
              {selectedGroup ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat
                      label="Site cap"
                      value={formatTriple(selectedGroup.siteLimit)}
                    />
                    <Stat
                      label="Headroom"
                      value={formatTriple(selectedGroup.headroom)}
                    />
                    <Stat
                      label="Telemetry age"
                      value={formatAge(selectedGroup.telemetryAgeSec)}
                    />
                    <Stat
                      label="Effective limit"
                      value={`${selectedGroup.effectiveLimitAmps} A`}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryRow
                      icon={<Zap size={14} />}
                      label="Current load"
                      value={`${selectedGroup.currentLoadAmps} A`}
                    />
                    <SummaryRow
                      icon={<Gauge size={14} />}
                      label="Active members"
                      value={`${selectedGroup.activeMembers} / ${selectedGroup.memberships.length}`}
                    />
                    <SummaryRow
                      icon={
                        selectedGroup.telemetryStatus.includes("FAILSAFE") ? (
                          <TriangleAlert size={14} />
                        ) : (
                          <Wifi size={14} />
                        )
                      }
                      label="Telemetry status"
                      value={selectedGroup.telemetryStatus}
                    />
                    <SummaryRow
                      icon={
                        activeOverride ? (
                          <ShieldAlert size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )
                      }
                      label="Override"
                      value={
                        activeOverride ? `${activeOverride.capAmps} A` : "None"
                      }
                    />
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Charge Point</th>
                          <th>Priority</th>
                          <th>Enabled</th>
                          <th>Limit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(currentPlan?.allocations ?? []).map((allocation) => {
                          const membership = selectedGroup.memberships.find(
                            (item) =>
                              item.chargePointId === allocation.chargePointId,
                          );
                          return (
                            <tr key={allocation.chargePointId}>
                              <td className="font-semibold text-sm">
                                {allocation.chargePointId}
                              </td>
                              <td className="text-sm">
                                {membership?.priority ?? allocation.priority}
                              </td>
                              <td>
                                {allocation.enabled ? (
                                  <span className="pill active">Yes</span>
                                ) : (
                                  <span className="pill offline">No</span>
                                )}
                              </td>
                              <td className="text-sm">
                                {allocation.targetAmps} A
                              </td>
                              <td className="text-sm text-[var(--text-subtle)]">
                                {allocation.reasonCode}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--text-subtle)]">
                  No EMS group is selected yet.
                </div>
              )}
            </Panel>

            <Panel
              title="Tariff-aware schedule"
              subtitle="Phase 2 planner output staged above the EMS/DLM safety loop."
              action={<Clock3 size={16} className="text-[var(--text-subtle)]" />}
            >
              {!selectedGroup ? (
                <div className="text-sm text-[var(--text-subtle)]">
                  Select an EMS group to generate optimization plans.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="btn secondary sm"
                      type="button"
                      onClick={generateTariffPlan}
                      disabled={!canWrite || createOptimizationPlanMutation.isPending}
                    >
                      <TestTubes size={14} /> Generate dry-run plan
                    </button>
                    <span className="text-xs text-[var(--text-subtle)]">
                      {optimizationPlansQuery.isFetching
                        ? "Refreshing planner output..."
                        : `${optimizationPlans.length} plan(s), ${scheduleItems.length} staged schedule(s)`}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {optimizationPlans.slice(0, 3).map((plan) => {
                      const summary = asDataRecord(plan.summary);
                      const projectedEnergy =
                        typeof summary.projectedEnergyKwh === "number"
                          ? summary.projectedEnergyKwh
                          : null;
                      const projectedCost =
                        typeof summary.projectedCost === "number"
                          ? summary.projectedCost
                          : null;

                      return (
                        <div
                          key={plan.id}
                          className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-[var(--text)]">
                              Plan {plan.id.slice(0, 8)}
                            </div>
                            <span
                              className={`pill ${plan.state === "APPROVED" || plan.state === "SCHEDULED" ? "active" : plan.state === "FALLBACK_DLM" ? "offline" : "pending"}`}
                            >
                              {plan.state}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-[var(--text-subtle)]">
                            {new Date(plan.windowStart).toLocaleString()} -{" "}
                            {new Date(plan.windowEnd).toLocaleString()}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-subtle)]">
                            <span>
                              Energy:{" "}
                              {projectedEnergy === null
                                ? "N/A"
                                : `${projectedEnergy.toFixed(1)} kWh`}
                            </span>
                            <span>
                              Cost:{" "}
                              {projectedCost === null
                                ? "N/A"
                                : `${projectedCost.toFixed(2)}`}
                            </span>
                            {plan.fallbackReason && (
                              <span>Fallback: {plan.fallbackReason}</span>
                            )}
                          </div>
                          {canWrite && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {plan.state !== "FALLBACK_DLM" &&
                                plan.state !== "APPROVED" &&
                                plan.state !== "SCHEDULED" && (
                                  <button
                                    type="button"
                                    className="btn secondary sm"
                                    onClick={() => approveTariffPlan(plan.id)}
                                    disabled={approveOptimizationPlanMutation.isPending}
                                  >
                                    <CheckCircle2 size={14} /> Approve plan
                                  </button>
                                )}
                              {plan.state !== "FALLBACK_DLM" && (
                                <button
                                  type="button"
                                  className="btn ghost sm"
                                  onClick={() => stageSchedule(plan.id)}
                                  disabled={createScheduleMutation.isPending}
                                >
                                  <Plus size={14} /> Stage schedule
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!optimizationPlans.length && (
                      <div className="text-sm text-[var(--text-subtle)]">
                        No optimization plans yet. Generate a dry-run plan to preview tariff-aware scheduling.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                      <div className="text-sm font-semibold text-[var(--text)]">
                        Staged schedules
                      </div>
                      <div className="mt-2 space-y-2">
                        {scheduleItems.slice(0, 4).map((schedule) => (
                          <div
                            key={schedule.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--text)]">
                                {schedule.id.slice(0, 8)}
                              </span>
                              <span
                                className={`pill ${schedule.status === "ACTIVE" ? "active" : schedule.status === "FALLBACK_DLM" ? "offline" : "pending"}`}
                              >
                                {schedule.status}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-subtle)]">
                              {new Date(schedule.startsAt).toLocaleString()} -{" "}
                              {new Date(schedule.endsAt).toLocaleString()}
                            </div>
                            {canWrite && schedule.status === "PENDING_APPROVAL" && (
                              <button
                                type="button"
                                className="btn secondary sm mt-2"
                                onClick={() => approveStagedSchedule(schedule.id)}
                                disabled={approveScheduleMutation.isPending}
                              >
                                <Power size={14} /> Approve schedule
                              </button>
                            )}
                          </div>
                        ))}
                        {!scheduleItems.length && (
                          <div className="text-xs text-[var(--text-subtle)]">
                            No schedules staged from planner output.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                      <div className="text-sm font-semibold text-[var(--text)]">
                        Plan run history
                      </div>
                      <div className="mt-2 space-y-2">
                        {planRuns.slice(0, 4).map((run) => (
                          <div
                            key={run.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--text)]">
                                {run.trigger}
                              </span>
                              <span
                                className={`pill ${run.state === "APPLIED" ? "active" : run.state === "FALLBACK_DLM" || run.state === "FAILED" ? "offline" : "pending"}`}
                              >
                                {run.state}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--text-subtle)]">
                              {new Date(run.startedAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {!planRuns.length && (
                          <div className="text-xs text-[var(--text-subtle)]">
                            No plan runs recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            <Panel
              title="Decision trace"
              subtitle="Latest allocation decisions and command results."
              action={
                <History size={16} className="text-[var(--text-subtle)]" />
              }
            >
              <div className="space-y-3">
                {currentDecisionItems.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--text)]">
                        {decision.reasonCode}
                      </div>
                      <span
                        className={`pill ${decision.state === "APPLIED" ? "active" : decision.state === "DRY_RUN" ? "pending" : "offline"}`}
                      >
                        {decision.state}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-subtle)]">
                      <span>{decision.commandCount} command(s)</span>
                      <span>{decision.triggeredBy}</span>
                      <span>
                        {new Date(decision.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {!currentDecisionItems.length && (
                  <div className="text-sm text-[var(--text-subtle)]">
                    No decisions recorded yet.
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Alerts"
              subtitle="Open EMS events that need operator attention."
              action={
                <AlertTriangle
                  size={16}
                  className="text-[var(--text-subtle)]"
                />
              }
            >
              <div className="space-y-3">
                {(selectedGroup?.alerts ?? []).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--text)]">
                          {alert.title}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-subtle)]">
                          {alert.message}
                        </div>
                      </div>
                      <span
                        className={`pill ${alert.severity === "CRITICAL" ? "offline" : alert.severity === "WARNING" ? "pending" : "active"}`}
                      >
                        {alert.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-subtle)]">
                      <span>{alert.code}</span>
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.status === "OPEN" && canWrite && (
                        <button
                          className="btn secondary sm"
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle2 size={14} /> Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!(selectedGroup?.alerts ?? []).length && (
                  <div className="text-sm text-[var(--text-subtle)]">
                    No open alerts.
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Station siblings"
              subtitle="Other EMS groups bound to the same station."
              action={
                <Activity size={16} className="text-[var(--text-subtle)]" />
              }
            >
              <div className="space-y-2">
                {currentStationGroups.map((group) => (
                  <button
                    key={group.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${group.id === selectedGroup?.id ? "border-[var(--accent)] bg-[var(--accent-dim)]" : "border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-muted)]"}`}
                    onClick={() => {
                      setMode("edit");
                      setSelectedGroupId(group.id);
                    }}
                    type="button"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">
                        {group.name}
                      </div>
                      <div className="text-xs text-[var(--text-subtle)]">
                        {group.stationName} · {group.stationStatus}
                      </div>
                    </div>
                    <div className="text-right text-xs text-[var(--text-subtle)]">
                      <div>{group.effectiveLimitAmps} A</div>
                      <div>{group.activeMembers} members</div>
                    </div>
                  </button>
                ))}
                {!currentStationGroups.length && (
                  <div className="text-sm text-[var(--text-subtle)]">
                    No station data loaded yet.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
