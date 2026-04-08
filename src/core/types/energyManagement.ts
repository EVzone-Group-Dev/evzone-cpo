export type EnergyControlMode = "OBSERVE_ONLY" | "ACTIVE" | "DISABLED";

export type EnergyAllocationMethod = "EQUAL" | "PRIORITY";

export type EnergyMeterPlacement = "MAIN" | "SUB_FEEDER" | "DERIVED";

export type EnergyDecisionState =
  | "APPLIED"
  | "DRY_RUN"
  | "NO_CHANGE"
  | "BLOCKED"
  | "FAILED";

export type EnergyAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type EnergyAlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type EnergyOverrideStatus = "ACTIVE" | "CLEARED" | "EXPIRED";

export type EnergyAlertCode =
  | "METER_STALE"
  | "METER_FAILSAFE"
  | "MANUAL_OVERRIDE"
  | "CHARGER_EXCLUDED"
  | "NO_ACTIVE_CHARGERS"
  | "GROUP_DISABLED";

export interface EnergyPhaseTriple {
  phase1: number;
  phase2: number;
  phase3: number;
}

export interface EnergyActiveOverrideSummary {
  id: string;
  status: EnergyOverrideStatus;
  reason: string;
  capAmps: number;
  expiresAt: string;
}

export interface EnergyLoadGroupSummary {
  id: string;
  tenantId: string;
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
  activeOverride: EnergyActiveOverrideSummary | null;
}

export interface EnergyLoadGroupMembershipSummary {
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

export interface EnergyTelemetrySnapshotRecord {
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

export interface EnergyAllocationPlanMemberRecord {
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

export interface EnergyAllocationPlanRecord {
  decisionHash: string;
  state: EnergyDecisionState;
  reasonCode: string;
  alerts: EnergyAlertCode[];
  telemetryAgeSec: number | null;
  isTelemetryStale: boolean;
  isTelemetryFailSafe: boolean;
  siteLimitAmps: EnergyPhaseTriple;
  nonEvLoadAmps: EnergyPhaseTriple;
  dynamicBufferAmps: EnergyPhaseTriple;
  headroomAmps: EnergyPhaseTriple;
  failSafeCeilingAmps: EnergyPhaseTriple;
  overrideCapAmps: number | null;
  effectiveLimitAmps: number;
  activeChargePointCount: number;
  allocations: EnergyAllocationPlanMemberRecord[];
}

export interface EnergyCommandResultRecord {
  commandId: string;
  status: string;
  chargePointId: string;
  targetAmps: number;
}

export interface EnergyDecisionInputSnapshot {
  group: Record<string, unknown>;
  telemetry: Record<string, unknown> | null;
  override: Record<string, unknown> | null;
  memberships: Array<Record<string, unknown>>;
}

export interface EnergyAllocationDecisionRecord {
  id: string;
  createdAt: string;
  appliedAt: string | null;
  decisionHash: string;
  reasonCode: string;
  state: EnergyDecisionState;
  commandCount: number;
  triggeredBy: string;
  inputSnapshot: EnergyDecisionInputSnapshot | Record<string, unknown>;
  outputSnapshot: Record<string, unknown>;
}

export interface EnergyAlertRecord {
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

export interface EnergyManualOverrideRecord {
  id: string;
  status: EnergyOverrideStatus;
  reason: string;
  requestedBy: string | null;
  capAmps: number;
  expiresAt: string;
  clearedAt: string | null;
  createdAt: string;
}

export interface EnergyLoadGroupDetail extends EnergyLoadGroupSummary {
  currentDecisionId: string | null;
  currentDecision: {
    plan: EnergyAllocationPlanRecord;
    commandResults: EnergyCommandResultRecord[];
  } | null;
  memberships: EnergyLoadGroupMembershipSummary[];
  telemetry: EnergyTelemetrySnapshotRecord[];
  decisions: EnergyAllocationDecisionRecord[];
  alerts: EnergyAlertRecord[];
  manualOverrides: EnergyManualOverrideRecord[];
}

export interface EnergyLoadGroupMembershipInput {
  chargePointId: string;
  enabled?: boolean;
  priority?: number;
  smartChargingEnabled?: boolean;
  maxAmps?: number | null;
}

export interface EnergyLoadGroupUpsertInput {
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
  activateNow?: boolean;
  activationReason?: string;
  recalculateNow?: boolean;
  memberships?: EnergyLoadGroupMembershipInput[];
}

export interface EnergyTelemetryIngestInput {
  sampledAt?: string;
  meterSource?: string | null;
  freshnessSec?: number;
  siteLoad: EnergyPhaseTriple;
  nonEvLoad: EnergyPhaseTriple;
  rawTelemetry?: Record<string, unknown>;
}

export interface EnergyRecalculateInput {
  dryRun?: boolean;
  trigger?: string;
  reason?: string;
}

export interface EnergyOverrideInput {
  reason: string;
  capAmps: number;
  expiresAt: string;
}

export interface EnergyAlertSummary {
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
