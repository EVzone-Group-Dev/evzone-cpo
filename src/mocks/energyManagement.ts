import type {
  EnergyAlertCode,
  EnergyAllocationPlanRecord,
  EnergyCommandResultRecord,
} from "@/core/types/energyManagement";

type TenantId = "tenant-global" | "tenant-evzone-ke" | "tenant-westlands-mall";

type EnergyPhaseTriple = { phase1: number; phase2: number; phase3: number };
type EnergyControlMode = "OBSERVE_ONLY" | "ACTIVE" | "DISABLED";
type EnergyAllocationMethod = "EQUAL" | "PRIORITY";
type EnergyMeterPlacement = "MAIN" | "SUB_FEEDER" | "DERIVED";
type EnergyDecisionState =
  | "APPLIED"
  | "DRY_RUN"
  | "NO_CHANGE"
  | "BLOCKED"
  | "FAILED";
type EnergyAlertSeverity = "INFO" | "WARNING" | "CRITICAL";
type EnergyAlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
type EnergyOverrideStatus = "ACTIVE" | "CLEARED" | "EXPIRED";

interface EnergyMembership {
  id: string;
  chargePointId: string;
  ocppId: string;
  smartChargingEnabled: boolean;
  chargePointOnline: boolean;
  enabled: boolean;
  priority: number;
  maxAmps: number | null;
  lastAppliedAmps: number | null;
  lastCommandAt: string | null;
  lastCommandStatus: string | null;
}

interface EnergyTelemetry {
  id: string;
  sampledAt: string;
  freshnessSec: number;
  meterSource: string | null;
  meterPlacement: EnergyMeterPlacement;
  siteLoadAmps: EnergyPhaseTriple;
  nonEvLoadAmps: EnergyPhaseTriple;
  headroomAmps: EnergyPhaseTriple;
  reasonCode: string | null;
}

interface EnergyAlert {
  id: string;
  code: string;
  severity: EnergyAlertSeverity;
  status: EnergyAlertStatus;
  title: string;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

interface EnergyOverride {
  id: string;
  status: EnergyOverrideStatus;
  reason: string;
  requestedBy: string | null;
  capAmps: number;
  expiresAt: string;
  clearedAt: string | null;
  createdAt: string;
}

interface EnergyDecision {
  id: string;
  createdAt: string;
  appliedAt: string | null;
  decisionHash: string;
  reasonCode: string;
  state: EnergyDecisionState;
  commandCount: number;
  triggeredBy: string;
  inputSnapshot: Record<string, unknown>;
  outputSnapshot: Record<string, unknown>;
}

interface EnergyPlanAllocation {
  chargePointId: string;
  enabled: boolean;
  priority: number;
  smartChargingEnabled: boolean;
  previousAmps: number | null;
  targetAmps: number;
  commandType: "ApplyChargingLimit" | "ClearChargingLimit" | "None";
  shouldSendCommand: boolean;
  reasonCode: string;
}

interface EnergyGroup {
  id: string;
  tenantId: TenantId;
  stationId: string;
  stationName: string;
  stationStatus: string;
  name: string;
  description: string | null;
  controlMode: EnergyControlMode;
  allocationMethod: EnergyAllocationMethod;
  meterSource: string | null;
  meterPlacement: EnergyMeterPlacement;
  observeOnly: boolean;
  isActive: boolean;
  siteLimit: EnergyPhaseTriple;
  dynamicBuffer: EnergyPhaseTriple;
  failSafe: EnergyPhaseTriple;
  nonEvLoad: EnergyPhaseTriple;
  headroom: EnergyPhaseTriple;
  effectiveLimitAmps: number;
  currentLoadAmps: number;
  activeSessions: number;
  activeMembers: number;
  telemetryAgeSec: number | null;
  telemetryStatus: string;
  latestDecisionHash: string | null;
  latestDecisionAt: string | null;
  latestAppliedAt: string | null;
  latestReasonCode: string | null;
  commandRefreshSec: number;
  deadbandAmps: number;
  alertCount: number;
  activeAlertCount: number;
  activeOverride: EnergyOverride | null;
  currentDecisionId: string | null;
  currentDecision: {
    plan: EnergyAllocationPlanRecord;
    commandResults: EnergyCommandResultRecord[];
  } | null;
  memberships: EnergyMembership[];
  telemetry: EnergyTelemetry[];
  decisions: EnergyDecision[];
  alerts: EnergyAlert[];
  manualOverrides: EnergyOverride[];
}

interface EnergyGroupSeed {
  id: string;
  tenantId: TenantId;
  stationId: string;
  stationName: string;
  stationStatus: string;
  name: string;
  description: string;
  controlMode: EnergyControlMode;
  allocationMethod: EnergyAllocationMethod;
  meterSource: string | null;
  meterPlacement: EnergyMeterPlacement;
  observeOnly: boolean;
  isActive: boolean;
  siteLimit: EnergyPhaseTriple;
  dynamicBuffer: EnergyPhaseTriple;
  failSafe: EnergyPhaseTriple;
  nonEvLoad: EnergyPhaseTriple;
  activeSessions: number;
  telemetryAgeSec: number | null;
  telemetryStatus: string;
  latestReasonCode: string;
  commandRefreshSec: number;
  deadbandAmps: number;
  memberships: EnergyMembership[];
  alerts: EnergyAlert[];
  manualOverrides: EnergyOverride[];
  telemetry: EnergyTelemetry[];
  currentDecisionState: EnergyDecisionState;
}

function phaseTriple(
  phase1: number,
  phase2: number,
  phase3: number,
): EnergyPhaseTriple {
  return { phase1, phase2, phase3 };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sumPhaseTriple(value: EnergyPhaseTriple): number {
  return value.phase1 + value.phase2 + value.phase3;
}

function subtractPhaseTriple(
  left: EnergyPhaseTriple,
  right: EnergyPhaseTriple,
): EnergyPhaseTriple {
  return {
    phase1: Math.max(0, left.phase1 - right.phase1),
    phase2: Math.max(0, left.phase2 - right.phase2),
    phase3: Math.max(0, left.phase3 - right.phase3),
  };
}

function minPhaseTriple(
  left: EnergyPhaseTriple,
  right: EnergyPhaseTriple,
): EnergyPhaseTriple {
  return {
    phase1: Math.min(left.phase1, right.phase1),
    phase2: Math.min(left.phase2, right.phase2),
    phase3: Math.min(left.phase3, right.phase3),
  };
}

function resolveScalarLimit(value: EnergyPhaseTriple): number {
  const positive = [value.phase1, value.phase2, value.phase3].filter(
    (phase) => phase > 0,
  );
  return positive.length > 0 ? Math.min(...positive) : 0;
}

function createMembership(
  input: Omit<
    EnergyMembership,
    "id" | "ocppId" | "lastCommandStatus" | "lastCommandAt" | "lastAppliedAmps"
  > &
    Partial<
      Pick<
        EnergyMembership,
        "lastAppliedAmps" | "lastCommandAt" | "lastCommandStatus"
      >
    >,
  index: number,
): EnergyMembership {
  return {
    id: `${input.chargePointId}-${index + 1}`,
    ocppId: input.chargePointId.toUpperCase(),
    lastAppliedAmps: input.lastAppliedAmps ?? null,
    lastCommandAt: input.lastCommandAt ?? null,
    lastCommandStatus: input.lastCommandStatus ?? null,
    ...input,
  };
}

function createAlert(
  groupId: string,
  code: string,
  severity: EnergyAlertSeverity,
  title: string,
  message: string,
  status: EnergyAlertStatus = "OPEN",
): EnergyAlert {
  return {
    id: `${groupId}-${code}-${Date.now()}`,
    code,
    severity,
    status,
    title,
    message,
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null,
  };
}

function createOverride(
  input: { reason: string; capAmps: number; expiresAt: string },
  requestedBy: string | null,
): EnergyOverride {
  return {
    id: `override-${Date.now()}`,
    status: "ACTIVE",
    reason: input.reason,
    requestedBy,
    capAmps: input.capAmps,
    expiresAt: input.expiresAt,
    clearedAt: null,
    createdAt: new Date().toISOString(),
  };
}

function createTelemetry(
  groupId: string,
  stationId: string,
  meterSource: string | null,
  meterPlacement: EnergyMeterPlacement,
  siteLoad: EnergyPhaseTriple,
  nonEvLoad: EnergyPhaseTriple,
  freshnessSec: number,
  reasonCode: string,
): EnergyTelemetry {
  return {
    id: `${groupId}-${stationId}-${Date.now()}`,
    sampledAt: new Date().toISOString(),
    freshnessSec,
    meterSource,
    meterPlacement,
    siteLoadAmps: siteLoad,
    nonEvLoadAmps: nonEvLoad,
    headroomAmps: subtractPhaseTriple(siteLoad, nonEvLoad),
    reasonCode,
  };
}

function buildPlan(group: EnergyGroup) {
  const headroom = subtractPhaseTriple(
    subtractPhaseTriple(group.siteLimit, group.nonEvLoad),
    group.dynamicBuffer,
  );
  const failSafeCeiling = minPhaseTriple(headroom, group.failSafe);
  const effectiveLimitAmps = resolveScalarLimit(failSafeCeiling);
  const activeMembers = group.memberships.filter(
    (member) =>
      member.enabled && member.smartChargingEnabled && member.chargePointOnline,
  );
  const share =
    activeMembers.length > 0
      ? Math.floor(effectiveLimitAmps / activeMembers.length)
      : 0;

  const allocations: EnergyPlanAllocation[] = group.memberships.map(
    (member) => {
      const targetAmps =
        member.enabled &&
        member.smartChargingEnabled &&
        member.chargePointOnline
          ? Math.max(0, Math.min(member.maxAmps ?? share, share))
          : 0;
      return {
        chargePointId: member.chargePointId,
        enabled: member.enabled,
        priority: member.priority,
        smartChargingEnabled: member.smartChargingEnabled,
        previousAmps: member.lastAppliedAmps,
        targetAmps,
        commandType:
          targetAmps > 0 ? "ApplyChargingLimit" : "ClearChargingLimit",
        shouldSendCommand: group.controlMode === "ACTIVE" && !group.observeOnly,
        reasonCode: member.smartChargingEnabled
          ? member.enabled
            ? member.chargePointOnline
              ? targetAmps > 0
                ? "LIMIT_CHANGED"
                : "NO_HEADROOM"
              : "CHARGER_OFFLINE"
            : "MEMBERSHIP_DISABLED"
          : "CHARGER_EXCLUDED",
      };
    },
  );

  return {
    decisionHash: `${group.id}-${Date.now()}`,
    state: (group.observeOnly || group.controlMode !== "ACTIVE"
      ? "DRY_RUN"
      : "APPLIED") as EnergyDecisionState,
    reasonCode: group.latestReasonCode ?? "NORMAL_OPERATION",
    alerts: [
      ...new Set(group.alerts.map((alert) => alert.code)),
    ] as EnergyAlertCode[],
    telemetryAgeSec: group.telemetryAgeSec,
    isTelemetryStale: (group.telemetryAgeSec ?? 0) >= 30,
    isTelemetryFailSafe: (group.telemetryAgeSec ?? 0) >= 60,
    siteLimitAmps: group.siteLimit,
    nonEvLoadAmps: group.nonEvLoad,
    dynamicBufferAmps: group.dynamicBuffer,
    headroomAmps: headroom,
    failSafeCeilingAmps: failSafeCeiling,
    overrideCapAmps: group.activeOverride?.capAmps ?? null,
    effectiveLimitAmps,
    activeChargePointCount: activeMembers.length,
    allocations,
  };
}

function addDecision(group: EnergyGroup, reasonCode: string, dryRun = false) {
  group.latestReasonCode = reasonCode;
  const plan = buildPlan(group);
  const decisionId = `${group.id}-decision-${Date.now()}`;
  const commandResults = plan.allocations
    .filter((allocation) => allocation.shouldSendCommand)
    .map((allocation) => ({
      commandId: `${group.id}-${allocation.chargePointId}-${Date.now()}`,
      status: dryRun ? "DRY_RUN" : "QUEUED",
      chargePointId: allocation.chargePointId,
      targetAmps: allocation.targetAmps,
    }));

  group.currentDecisionId = decisionId;
  group.currentDecision = { plan, commandResults };
  group.latestDecisionHash = plan.decisionHash;
  group.latestDecisionAt = new Date().toISOString();
  group.latestAppliedAt =
    dryRun || group.observeOnly || group.controlMode !== "ACTIVE"
      ? group.latestAppliedAt
      : group.latestDecisionAt;
  group.decisions.unshift({
    id: decisionId,
    createdAt: group.latestDecisionAt,
    appliedAt: group.latestAppliedAt ?? null,
    decisionHash: plan.decisionHash,
    reasonCode,
    state: (dryRun ? "DRY_RUN" : plan.state) as EnergyDecisionState,
    commandCount: commandResults.length,
    triggeredBy: dryRun ? "dry-run" : "manual",
    inputSnapshot: { reasonCode },
    outputSnapshot: { plan, commandResults },
  });

  group.memberships = group.memberships.map((member, index) => ({
    ...member,
    lastAppliedAmps:
      plan.allocations[index]?.targetAmps ?? member.lastAppliedAmps,
    lastCommandAt: group.latestAppliedAt ?? member.lastCommandAt,
    lastCommandStatus: commandResults.some(
      (result) => result.chargePointId === member.chargePointId,
    )
      ? "QUEUED"
      : member.lastCommandStatus,
  }));
}

function seedGroup(seed: EnergyGroupSeed): EnergyGroup {
  const group: EnergyGroup = {
    id: seed.id,
    tenantId: seed.tenantId,
    stationId: seed.stationId,
    stationName: seed.stationName,
    stationStatus: seed.stationStatus,
    name: seed.name,
    description: seed.description,
    controlMode: seed.controlMode,
    allocationMethod: seed.allocationMethod,
    meterSource: seed.meterSource,
    meterPlacement: seed.meterPlacement,
    observeOnly: seed.observeOnly,
    isActive: seed.isActive,
    siteLimit: seed.siteLimit,
    dynamicBuffer: seed.dynamicBuffer,
    failSafe: seed.failSafe,
    nonEvLoad: seed.nonEvLoad,
    headroom: subtractPhaseTriple(
      subtractPhaseTriple(seed.siteLimit, seed.nonEvLoad),
      seed.dynamicBuffer,
    ),
    effectiveLimitAmps: resolveScalarLimit(
      minPhaseTriple(
        subtractPhaseTriple(
          subtractPhaseTriple(seed.siteLimit, seed.nonEvLoad),
          seed.dynamicBuffer,
        ),
        seed.failSafe,
      ),
    ),
    currentLoadAmps: sumPhaseTriple(seed.nonEvLoad),
    activeSessions: seed.activeSessions,
    activeMembers: seed.memberships.filter(
      (member) =>
        member.enabled &&
        member.smartChargingEnabled &&
        member.chargePointOnline,
    ).length,
    telemetryAgeSec: seed.telemetryAgeSec,
    telemetryStatus: seed.telemetryStatus,
    latestDecisionHash: null,
    latestDecisionAt: null,
    latestAppliedAt: null,
    latestReasonCode: seed.latestReasonCode,
    commandRefreshSec: seed.commandRefreshSec,
    deadbandAmps: seed.deadbandAmps,
    alertCount: seed.alerts.length,
    activeAlertCount: seed.alerts.filter((alert) => alert.status === "OPEN")
      .length,
    activeOverride:
      seed.manualOverrides.find((override) => override.status === "ACTIVE") ??
      null,
    currentDecisionId: null,
    currentDecision: null,
    memberships: seed.memberships,
    telemetry: seed.telemetry,
    decisions: [],
    alerts: seed.alerts,
    manualOverrides: seed.manualOverrides,
  };

  addDecision(
    group,
    seed.latestReasonCode,
    seed.currentDecisionState === "DRY_RUN",
  );
  return group;
}

const initialEnergyGroupsByTenant: Record<TenantId, EnergyGroup[]> = {
  "tenant-global": [
    seedGroup({
      id: "ems-global-westlands",
      tenantId: "tenant-global",
      stationId: "st-1",
      stationName: "Westlands Hub",
      stationStatus: "Online",
      name: "Westlands DLM",
      description: "Primary site cap with active operator control.",
      controlMode: "ACTIVE",
      allocationMethod: "PRIORITY",
      meterSource: "MDB Meter",
      meterPlacement: "MAIN",
      observeOnly: false,
      isActive: true,
      siteLimit: phaseTriple(120, 120, 120),
      dynamicBuffer: phaseTriple(8, 8, 8),
      failSafe: phaseTriple(92, 92, 92),
      nonEvLoad: phaseTriple(54, 51, 49),
      activeSessions: 6,
      telemetryAgeSec: 18,
      telemetryStatus: "NORMAL_OPERATION",
      latestReasonCode: "MANUAL_OVERRIDE",
      commandRefreshSec: 300,
      deadbandAmps: 1,
      memberships: [
        createMembership(
          {
            chargePointId: "cp-1",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 48,
            lastAppliedAmps: 24,
          },
          0,
        ),
        createMembership(
          {
            chargePointId: "cp-2",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 2,
            maxAmps: 32,
            lastAppliedAmps: 18,
          },
          1,
        ),
        createMembership(
          {
            chargePointId: "cp-3",
            smartChargingEnabled: false,
            chargePointOnline: false,
            enabled: true,
            priority: 3,
            maxAmps: 16,
            lastAppliedAmps: 0,
          },
          2,
        ),
      ],
      alerts: [
        createAlert(
          "ems-global-westlands",
          "METER_STALE",
          "WARNING",
          "Meter telemetry is approaching stale",
          "Telemetry age is close to the fail-safe threshold.",
        ),
        createAlert(
          "ems-global-westlands",
          "CHARGER_EXCLUDED",
          "INFO",
          "Charge point excluded",
          "EVZ-CBD-001 is offline and excluded from allocation.",
          "ACKNOWLEDGED",
        ),
      ],
      manualOverrides: [
        {
          id: "ems-global-westlands-override",
          status: "ACTIVE",
          reason: "Evening site load protection",
          requestedBy: "u2",
          capAmps: 84,
          expiresAt: "2026-04-07T18:00:00.000Z",
          clearedAt: null,
          createdAt: "2026-04-07T09:40:00.000Z",
        },
      ],
      telemetry: [
        createTelemetry(
          "ems-global-westlands",
          "st-1",
          "MDB Meter",
          "MAIN",
          phaseTriple(108, 106, 101),
          phaseTriple(54, 51, 49),
          18,
          "TELEMETRY_INGEST",
        ),
      ],
      currentDecisionState: "APPLIED",
    }),
    seedGroup({
      id: "ems-global-cbd",
      tenantId: "tenant-global",
      stationId: "st-2",
      stationName: "CBD Charging Station",
      stationStatus: "Degraded",
      name: "CBD Observe-Only Guardrail",
      description: "Passive monitoring at the constrained city-centre site.",
      controlMode: "OBSERVE_ONLY",
      allocationMethod: "EQUAL",
      meterSource: "Branch Meter",
      meterPlacement: "SUB_FEEDER",
      observeOnly: true,
      isActive: false,
      siteLimit: phaseTriple(80, 80, 80),
      dynamicBuffer: phaseTriple(6, 6, 6),
      failSafe: phaseTriple(68, 68, 68),
      nonEvLoad: phaseTriple(28, 26, 25),
      activeSessions: 2,
      telemetryAgeSec: 44,
      telemetryStatus: "STALE_TELEMETRY",
      latestReasonCode: "STALE_TELEMETRY",
      commandRefreshSec: 300,
      deadbandAmps: 1,
      memberships: [
        createMembership(
          {
            chargePointId: "cp-3",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 24,
            lastAppliedAmps: 12,
          },
          0,
        ),
      ],
      alerts: [
        createAlert(
          "ems-global-cbd",
          "METER_STALE",
          "WARNING",
          "Stale telemetry",
          "Branch meter updates are lagging behind the fail-safe window.",
        ),
      ],
      manualOverrides: [],
      telemetry: [
        createTelemetry(
          "ems-global-cbd",
          "st-2",
          "Branch Meter",
          "SUB_FEEDER",
          phaseTriple(56, 54, 52),
          phaseTriple(28, 26, 25),
          44,
          "TELEMETRY_INGEST",
        ),
      ],
      currentDecisionState: "DRY_RUN",
    }),
  ],
  "tenant-evzone-ke": [
    seedGroup({
      id: "ems-ke-westlands",
      tenantId: "tenant-evzone-ke",
      stationId: "st-1",
      stationName: "Westlands Hub",
      stationStatus: "Online",
      name: "Westlands Fleet Priority",
      description: "Operational fleet loading for morning departures.",
      controlMode: "ACTIVE",
      allocationMethod: "PRIORITY",
      meterSource: "Smart MDB",
      meterPlacement: "MAIN",
      observeOnly: false,
      isActive: true,
      siteLimit: phaseTriple(140, 140, 140),
      dynamicBuffer: phaseTriple(10, 10, 10),
      failSafe: phaseTriple(110, 110, 110),
      nonEvLoad: phaseTriple(62, 60, 58),
      activeSessions: 7,
      telemetryAgeSec: 15,
      telemetryStatus: "NORMAL_OPERATION",
      latestReasonCode: "MANUAL_OVERRIDE",
      commandRefreshSec: 300,
      deadbandAmps: 1,
      memberships: [
        createMembership(
          {
            chargePointId: "cp-1",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 48,
            lastAppliedAmps: 30,
          },
          0,
        ),
        createMembership(
          {
            chargePointId: "cp-2",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 40,
            lastAppliedAmps: 26,
          },
          1,
        ),
        createMembership(
          {
            chargePointId: "cp-3",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 3,
            maxAmps: 24,
            lastAppliedAmps: 14,
          },
          2,
        ),
      ],
      alerts: [
        createAlert(
          "ems-ke-westlands",
          "MANUAL_OVERRIDE",
          "INFO",
          "Temporary cap in effect",
          "Fleet operators are limited to 96A until the afternoon peak passes.",
        ),
      ],
      manualOverrides: [
        {
          id: "ems-ke-westlands-override",
          status: "ACTIVE",
          reason: "Fleet readiness window",
          requestedBy: "u4",
          capAmps: 96,
          expiresAt: "2026-04-07T16:00:00.000Z",
          clearedAt: null,
          createdAt: "2026-04-07T08:15:00.000Z",
        },
      ],
      telemetry: [
        createTelemetry(
          "ems-ke-westlands",
          "st-1",
          "Smart MDB",
          "MAIN",
          phaseTriple(124, 120, 118),
          phaseTriple(62, 60, 58),
          15,
          "TELEMETRY_INGEST",
        ),
      ],
      currentDecisionState: "APPLIED",
    }),
    seedGroup({
      id: "ems-ke-airport",
      tenantId: "tenant-evzone-ke",
      stationId: "st-2",
      stationName: "CBD Charging Station",
      stationStatus: "Online",
      name: "CBD Equal Share",
      description: "Fallback equal-share policy for the city centre station.",
      controlMode: "OBSERVE_ONLY",
      allocationMethod: "EQUAL",
      meterSource: "Branch Meter",
      meterPlacement: "SUB_FEEDER",
      observeOnly: true,
      isActive: false,
      siteLimit: phaseTriple(100, 100, 100),
      dynamicBuffer: phaseTriple(5, 5, 5),
      failSafe: phaseTriple(85, 85, 85),
      nonEvLoad: phaseTriple(34, 32, 30),
      activeSessions: 3,
      telemetryAgeSec: 28,
      telemetryStatus: "NORMAL_OPERATION",
      latestReasonCode: "NORMAL_OPERATION",
      commandRefreshSec: 300,
      deadbandAmps: 1,
      memberships: [
        createMembership(
          {
            chargePointId: "cp-3",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 24,
            lastAppliedAmps: 18,
          },
          0,
        ),
      ],
      alerts: [
        createAlert(
          "ems-ke-airport",
          "CHARGER_EXCLUDED",
          "INFO",
          "Degraded connector excluded",
          "One connector is offline and excluded from this group.",
        ),
      ],
      manualOverrides: [],
      telemetry: [
        createTelemetry(
          "ems-ke-airport",
          "st-2",
          "Branch Meter",
          "SUB_FEEDER",
          phaseTriple(72, 69, 66),
          phaseTriple(34, 32, 30),
          28,
          "TELEMETRY_INGEST",
        ),
      ],
      currentDecisionState: "DRY_RUN",
    }),
  ],
  "tenant-westlands-mall": [
    seedGroup({
      id: "ems-mall-westlands",
      tenantId: "tenant-westlands-mall",
      stationId: "st-1",
      stationName: "Westlands Hub",
      stationStatus: "Online",
      name: "Mall Hosted Guardrail",
      description: "Hosted-site cap for the retail portfolio.",
      controlMode: "ACTIVE",
      allocationMethod: "PRIORITY",
      meterSource: "Hosted Site Meter",
      meterPlacement: "MAIN",
      observeOnly: false,
      isActive: true,
      siteLimit: phaseTriple(90, 90, 90),
      dynamicBuffer: phaseTriple(6, 6, 6),
      failSafe: phaseTriple(72, 72, 72),
      nonEvLoad: phaseTriple(30, 29, 28),
      activeSessions: 2,
      telemetryAgeSec: 12,
      telemetryStatus: "NORMAL_OPERATION",
      latestReasonCode: "NORMAL_OPERATION",
      commandRefreshSec: 300,
      deadbandAmps: 1,
      memberships: [
        createMembership(
          {
            chargePointId: "cp-1",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 1,
            maxAmps: 32,
            lastAppliedAmps: 22,
          },
          0,
        ),
        createMembership(
          {
            chargePointId: "cp-2",
            smartChargingEnabled: true,
            chargePointOnline: true,
            enabled: true,
            priority: 2,
            maxAmps: 24,
            lastAppliedAmps: 14,
          },
          1,
        ),
      ],
      alerts: [
        createAlert(
          "ems-mall-westlands",
          "METER_FAILSAFE",
          "WARNING",
          "Meter fallback guardrail active",
          "Hosted meter freshness is being watched closely.",
        ),
      ],
      manualOverrides: [],
      telemetry: [
        createTelemetry(
          "ems-mall-westlands",
          "st-1",
          "Hosted Site Meter",
          "MAIN",
          phaseTriple(64, 60, 58),
          phaseTriple(30, 29, 28),
          12,
          "TELEMETRY_INGEST",
        ),
      ],
      currentDecisionState: "APPLIED",
    }),
  ],
};

let energyGroupsByTenant: Record<TenantId, EnergyGroup[]> = clone(
  initialEnergyGroupsByTenant,
);

function findGroup(tenantId: TenantId, id: string) {
  return energyGroupsByTenant[tenantId].find((group) => group.id === id);
}

function toSummary(group: EnergyGroup) {
  return {
    id: group.id,
    tenantId: group.tenantId,
    stationId: group.stationId,
    stationName: group.stationName,
    stationStatus: group.stationStatus,
    name: group.name,
    description: group.description,
    controlMode: group.controlMode,
    allocationMethod: group.allocationMethod,
    meterSource: group.meterSource,
    meterPlacement: group.meterPlacement,
    observeOnly: group.observeOnly,
    isActive: group.isActive,
    siteLimit: group.siteLimit,
    dynamicBuffer: group.dynamicBuffer,
    failSafe: group.failSafe,
    nonEvLoad: group.nonEvLoad,
    headroom: group.headroom,
    effectiveLimitAmps: group.effectiveLimitAmps,
    currentLoadAmps: group.currentLoadAmps,
    activeSessions: group.activeSessions,
    activeMembers: group.activeMembers,
    telemetryAgeSec: group.telemetryAgeSec,
    telemetryStatus: group.telemetryStatus,
    latestDecisionHash: group.latestDecisionHash,
    latestDecisionAt: group.latestDecisionAt,
    latestAppliedAt: group.latestAppliedAt,
    latestReasonCode: group.latestReasonCode,
    commandRefreshSec: group.commandRefreshSec,
    deadbandAmps: group.deadbandAmps,
    alertCount: group.alertCount,
    activeAlertCount: group.activeAlertCount,
    activeOverride: group.activeOverride,
  };
}

function touchDecision(group: EnergyGroup, reasonCode: string, dryRun = false) {
  const plan = buildPlan(group);
  const decisionId = `${group.id}-decision-${Date.now()}`;
  const commandResults = plan.allocations
    .filter((allocation) => allocation.shouldSendCommand)
    .map((allocation) => ({
      commandId: `${group.id}-${allocation.chargePointId}-${Date.now()}`,
      status: dryRun ? "DRY_RUN" : "QUEUED",
      chargePointId: allocation.chargePointId,
      targetAmps: allocation.targetAmps,
    }));

  group.currentDecisionId = decisionId;
  group.currentDecision = { plan, commandResults };
  group.latestReasonCode = reasonCode;
  group.latestDecisionHash = plan.decisionHash;
  group.latestDecisionAt = new Date().toISOString();
  group.latestAppliedAt =
    dryRun || group.observeOnly || group.controlMode !== "ACTIVE"
      ? group.latestAppliedAt
      : group.latestDecisionAt;
  group.decisions.unshift({
    id: decisionId,
    createdAt: group.latestDecisionAt,
    appliedAt: group.latestAppliedAt ?? null,
    decisionHash: plan.decisionHash,
    reasonCode,
    state: (dryRun ? "DRY_RUN" : plan.state) as EnergyDecisionState,
    commandCount: commandResults.length,
    triggeredBy: dryRun ? "dry-run" : "manual",
    inputSnapshot: { reasonCode },
    outputSnapshot: { plan, commandResults },
  });
  group.memberships = group.memberships.map((member, index) => ({
    ...member,
    lastAppliedAmps:
      plan.allocations[index]?.targetAmps ?? member.lastAppliedAmps,
    lastCommandAt: group.latestAppliedAt ?? member.lastCommandAt,
    lastCommandStatus: commandResults.some(
      (result) => result.chargePointId === member.chargePointId,
    )
      ? "QUEUED"
      : member.lastCommandStatus,
  }));
}

export function resetEnergyManagementFixtures() {
  energyGroupsByTenant = clone(initialEnergyGroupsByTenant);
}

export function listEnergyManagementGroups(
  tenantId: TenantId,
  query?: { stationId?: string; status?: string },
) {
  return energyGroupsByTenant[tenantId]
    .filter((group) => {
      if (query?.stationId && group.stationId !== query.stationId) {
        return false;
      }
      if (query?.status && group.controlMode !== query.status) {
        return false;
      }
      return true;
    })
    .map((group) => toSummary(group));
}

export function listEnergyStationLiveStatus(
  tenantId: TenantId,
  stationId: string,
) {
  return listEnergyManagementGroups(tenantId, { stationId });
}

export function getEnergyManagementGroup(tenantId: TenantId, id: string) {
  const group = findGroup(tenantId, id);
  return group
    ? clone({
        ...toSummary(group),
        currentDecisionId: group.currentDecisionId,
        currentDecision: group.currentDecision,
        memberships: group.memberships,
        telemetry: group.telemetry,
        decisions: group.decisions,
        alerts: group.alerts,
        manualOverrides: group.manualOverrides,
      })
    : undefined;
}

export function getEnergyManagementHistory(
  tenantId: TenantId,
  id: string,
  limit = 25,
) {
  const group = findGroup(tenantId, id);
  return group
    ? clone(group.decisions.slice(0, Math.min(Math.max(limit, 1), 100)))
    : [];
}

export function createEnergyManagementGroup(
  tenantId: TenantId,
  input: {
    stationId: string;
    name: string;
    description?: string | null;
    controlMode?: EnergyControlMode;
    allocationMethod?: EnergyAllocationMethod;
    meterSource?: string | null;
    meterPlacement?: EnergyMeterPlacement;
    siteLimitAmpsPhase1?: number;
    siteLimitAmpsPhase2?: number;
    siteLimitAmpsPhase3?: number;
    dynamicBufferAmpsPhase1?: number;
    dynamicBufferAmpsPhase2?: number;
    dynamicBufferAmpsPhase3?: number;
    failSafeAmpsPhase1?: number;
    failSafeAmpsPhase2?: number;
    failSafeAmpsPhase3?: number;
    deadbandAmps?: number;
    staleWarningAfterSec?: number;
    failSafeAfterSec?: number;
    commandRefreshSec?: number;
    observeOnly?: boolean;
    isActive?: boolean;
    memberships?: Array<{
      chargePointId: string;
      enabled?: boolean;
      priority?: number;
      smartChargingEnabled?: boolean;
      maxAmps?: number | null;
    }>;
  },
) {
  const group: EnergyGroup = {
    id: `ems-${tenantId}-${Date.now()}`,
    tenantId,
    stationId: input.stationId,
    stationName:
      input.stationId === "st-2"
        ? "CBD Charging Station"
        : input.stationId === "st-4"
          ? "Garden City Mall"
          : "Westlands Hub",
    stationStatus: "Online",
    name: input.name,
    description: input.description ?? null,
    controlMode: input.controlMode ?? "OBSERVE_ONLY",
    allocationMethod: input.allocationMethod ?? "EQUAL",
    meterSource: input.meterSource ?? null,
    meterPlacement: input.meterPlacement ?? "MAIN",
    observeOnly: input.observeOnly ?? true,
    isActive: input.isActive ?? false,
    siteLimit: phaseTriple(
      input.siteLimitAmpsPhase1 ?? 0,
      input.siteLimitAmpsPhase2 ?? 0,
      input.siteLimitAmpsPhase3 ?? 0,
    ),
    dynamicBuffer: phaseTriple(
      input.dynamicBufferAmpsPhase1 ?? 0,
      input.dynamicBufferAmpsPhase2 ?? 0,
      input.dynamicBufferAmpsPhase3 ?? 0,
    ),
    failSafe: phaseTriple(
      input.failSafeAmpsPhase1 ?? 0,
      input.failSafeAmpsPhase2 ?? 0,
      input.failSafeAmpsPhase3 ?? 0,
    ),
    nonEvLoad: phaseTriple(0, 0, 0),
    headroom: phaseTriple(0, 0, 0),
    effectiveLimitAmps: 0,
    currentLoadAmps: 0,
    activeSessions: 0,
    activeMembers: 0,
    telemetryAgeSec: null,
    telemetryStatus:
      input.staleWarningAfterSec && input.staleWarningAfterSec > 30
        ? "STALE_TELEMETRY"
        : "NO_TELEMETRY",
    latestDecisionHash: null,
    latestDecisionAt: null,
    latestAppliedAt: null,
    latestReasonCode: "NORMAL_OPERATION",
    commandRefreshSec: input.commandRefreshSec ?? 300,
    deadbandAmps: input.deadbandAmps ?? 1,
    alertCount: 0,
    activeAlertCount: 0,
    activeOverride: null,
    currentDecisionId: null,
    currentDecision: null,
    memberships: (input.memberships ?? []).map((membership, index) =>
      createMembership(
        {
          chargePointId: membership.chargePointId,
          smartChargingEnabled: membership.smartChargingEnabled ?? true,
          chargePointOnline: true,
          enabled: membership.enabled ?? true,
          priority: membership.priority ?? index + 1,
          maxAmps: membership.maxAmps ?? null,
          lastAppliedAmps: null,
        },
        index,
      ),
    ),
    telemetry: [],
    decisions: [],
    alerts: [],
    manualOverrides: [],
  };

  touchDecision(group, "GROUP_CREATED", true);
  energyGroupsByTenant[tenantId].unshift(group);
  return clone(group);
}

export function updateEnergyManagementGroup(
  tenantId: TenantId,
  id: string,
  input: Record<string, unknown>,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;

  if (typeof input.name === "string") group.name = input.name;
  if (typeof input.description === "string" || input.description === null)
    group.description = input.description as string | null;
  if (
    input.controlMode === "OBSERVE_ONLY" ||
    input.controlMode === "ACTIVE" ||
    input.controlMode === "DISABLED"
  )
    group.controlMode = input.controlMode;
  if (
    input.allocationMethod === "EQUAL" ||
    input.allocationMethod === "PRIORITY"
  )
    group.allocationMethod = input.allocationMethod;
  if (typeof input.meterSource === "string" || input.meterSource === null)
    group.meterSource = input.meterSource as string | null;
  if (
    input.meterPlacement === "MAIN" ||
    input.meterPlacement === "SUB_FEEDER" ||
    input.meterPlacement === "DERIVED"
  )
    group.meterPlacement = input.meterPlacement;
  if (typeof input.observeOnly === "boolean")
    group.observeOnly = input.observeOnly;
  if (typeof input.isActive === "boolean") group.isActive = input.isActive;
  if (typeof input.siteLimitAmpsPhase1 === "number")
    group.siteLimit.phase1 = input.siteLimitAmpsPhase1;
  if (typeof input.siteLimitAmpsPhase2 === "number")
    group.siteLimit.phase2 = input.siteLimitAmpsPhase2;
  if (typeof input.siteLimitAmpsPhase3 === "number")
    group.siteLimit.phase3 = input.siteLimitAmpsPhase3;
  if (typeof input.dynamicBufferAmpsPhase1 === "number")
    group.dynamicBuffer.phase1 = input.dynamicBufferAmpsPhase1;
  if (typeof input.dynamicBufferAmpsPhase2 === "number")
    group.dynamicBuffer.phase2 = input.dynamicBufferAmpsPhase2;
  if (typeof input.dynamicBufferAmpsPhase3 === "number")
    group.dynamicBuffer.phase3 = input.dynamicBufferAmpsPhase3;
  if (typeof input.failSafeAmpsPhase1 === "number")
    group.failSafe.phase1 = input.failSafeAmpsPhase1;
  if (typeof input.failSafeAmpsPhase2 === "number")
    group.failSafe.phase2 = input.failSafeAmpsPhase2;
  if (typeof input.failSafeAmpsPhase3 === "number")
    group.failSafe.phase3 = input.failSafeAmpsPhase3;
  if (typeof input.deadbandAmps === "number")
    group.deadbandAmps = input.deadbandAmps;
  if (typeof input.commandRefreshSec === "number")
    group.commandRefreshSec = input.commandRefreshSec;
  if (Array.isArray(input.memberships)) {
    group.memberships = input.memberships.map((membership, index) =>
      createMembership(
        {
          chargePointId: membership.chargePointId,
          smartChargingEnabled: membership.smartChargingEnabled ?? true,
          chargePointOnline: true,
          enabled: membership.enabled ?? true,
          priority: membership.priority ?? index + 1,
          maxAmps: membership.maxAmps ?? null,
          lastAppliedAmps: null,
        },
        index,
      ),
    );
  }

  group.telemetryStatus =
    input.staleWarningAfterSec && Number(input.staleWarningAfterSec) > 30
      ? "STALE_TELEMETRY"
      : group.telemetryStatus;

  touchDecision(group, "CONFIG_UPDATED");
  return clone(group);
}

export function deleteEnergyManagementGroup(tenantId: TenantId, id: string) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.controlMode = "DISABLED";
  group.observeOnly = true;
  group.isActive = false;
  touchDecision(group, "GROUP_DISABLED", true);
  return clone(group);
}

export function activateEnergyManagementGroup(tenantId: TenantId, id: string) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.controlMode = "ACTIVE";
  group.observeOnly = false;
  group.isActive = true;
  touchDecision(group, "MANUAL_ACTIVATION");
  return clone(group);
}

export function disableEnergyManagementGroup(tenantId: TenantId, id: string) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.controlMode = "DISABLED";
  group.observeOnly = true;
  group.isActive = false;
  touchDecision(group, "MANUAL_DISABLE", true);
  return clone(group);
}

export function replaceEnergyManagementMemberships(
  tenantId: TenantId,
  id: string,
  memberships: Array<{
    chargePointId: string;
    enabled?: boolean;
    priority?: number;
    smartChargingEnabled?: boolean;
    maxAmps?: number | null;
  }>,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.memberships = memberships.map((membership, index) =>
    createMembership(
      {
        chargePointId: membership.chargePointId,
        smartChargingEnabled: membership.smartChargingEnabled ?? true,
        chargePointOnline: true,
        enabled: membership.enabled ?? true,
        priority: membership.priority ?? index + 1,
        maxAmps: membership.maxAmps ?? null,
        lastAppliedAmps: null,
      },
      index,
    ),
  );
  touchDecision(group, "MEMBERSHIPS_UPDATED");
  return clone(group);
}

export function ingestEnergyManagementTelemetry(
  tenantId: TenantId,
  id: string,
  input: {
    sampledAt?: string;
    meterSource?: string | null;
    freshnessSec?: number;
    siteLoad: EnergyPhaseTriple;
    nonEvLoad: EnergyPhaseTriple;
    rawTelemetry?: Record<string, unknown>;
  },
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.nonEvLoad = input.nonEvLoad;
  group.telemetryAgeSec = input.freshnessSec ?? 0;
  group.currentLoadAmps = sumPhaseTriple(input.nonEvLoad);
  group.telemetry.unshift(
    createTelemetry(
      group.id,
      group.stationId,
      input.meterSource ?? group.meterSource,
      group.meterPlacement,
      input.siteLoad,
      input.nonEvLoad,
      input.freshnessSec ?? 0,
      "TELEMETRY_INGEST",
    ),
  );
  touchDecision(group, "TELEMETRY_INGEST");
  return clone(group);
}

export function recalculateEnergyManagementGroup(
  tenantId: TenantId,
  id: string,
  input: { dryRun?: boolean; trigger?: string; reason?: string } = {},
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  touchDecision(
    group,
    input.reason ?? input.trigger ?? "MANUAL_RECALCULATE",
    input.dryRun ?? false,
  );
  return clone(group);
}

export function recalculateEnergyManagementStation(
  tenantId: TenantId,
  stationId: string,
  reason = "MANUAL_RECALCULATE",
) {
  return energyGroupsByTenant[tenantId]
    .filter((group) => group.stationId === stationId)
    .map((group) => {
      touchDecision(group, reason);
      return clone(group);
    });
}

export function createEnergyManagementOverride(
  tenantId: TenantId,
  id: string,
  input: { reason: string; capAmps: number; expiresAt: string },
  requestedBy: string | null,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.manualOverrides.unshift(createOverride(input, requestedBy));
  group.activeOverride =
    group.manualOverrides.find((override) => override.status === "ACTIVE") ??
    null;
  touchDecision(group, "MANUAL_OVERRIDE");
  return clone(group);
}

export function clearEnergyManagementOverride(
  tenantId: TenantId,
  id: string,
  overrideId: string,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  const override = group.manualOverrides.find(
    (entry) => entry.id === overrideId,
  );
  if (!override) return undefined;
  override.status = "CLEARED";
  override.clearedAt = new Date().toISOString();
  group.activeOverride =
    group.manualOverrides.find((entry) => entry.status === "ACTIVE") ?? null;
  touchDecision(group, "MANUAL_OVERRIDE_CLEARED");
  return clone(group);
}

export function acknowledgeEnergyManagementAlert(
  tenantId: TenantId,
  id: string,
  alertId: string,
  actorId?: string,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  const alert = group.alerts.find((entry) => entry.id === alertId);
  if (!alert) return undefined;
  alert.status = "ACKNOWLEDGED";
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = actorId ?? "system";
  group.activeAlertCount = group.alerts.filter(
    (entry) => entry.status === "OPEN",
  ).length;
  return clone(group);
}

export function simulateEnergyMeterLoss(
  tenantId: TenantId,
  id: string,
  actorId?: string,
) {
  const group = findGroup(tenantId, id);
  if (!group) return undefined;
  group.telemetryAgeSec = (group.telemetryAgeSec ?? 0) + 120;
  group.telemetry.unshift(
    createTelemetry(
      group.id,
      group.stationId,
      group.meterSource,
      group.meterPlacement,
      phaseTriple(0, 0, 0),
      phaseTriple(0, 0, 0),
      group.telemetryAgeSec,
      "METER_LOSS_SIMULATION",
    ),
  );
  group.alerts.unshift(
    createAlert(
      group.id,
      "METER_FAILSAFE",
      "WARNING",
      "Meter telemetry lost",
      actorId
        ? `No fresh meter telemetry is available. Simulated by ${actorId}.`
        : "No fresh meter telemetry is available.",
    ),
  );
  group.alertCount = group.alerts.length;
  group.activeAlertCount = group.alerts.filter(
    (entry) => entry.status === "OPEN",
  ).length;
  touchDecision(group, "METER_LOSS_SIMULATION");
  return clone(group);
}
