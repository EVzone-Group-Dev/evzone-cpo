import { fetchJson } from "@/core/api/fetchJson";
import type {
  EnergyAllocationDecisionRecord,
  EnergyAllocationPlanRecord,
  EnergyAlertRecord,
  EnergyLoadGroupDetail,
  EnergyLoadGroupMembershipInput,
  EnergyLoadGroupSummary,
  EnergyLoadGroupUpsertInput,
  EnergyOverrideInput,
  EnergyRecalculateInput,
  EnergyTelemetryIngestInput,
} from "@/core/types/energyManagement";

const ENERGY_BASE_PATH = "/api/v1/energy-management";

export interface EnergyGroupQuery {
  stationId?: string;
  status?: string;
}

function buildQueryString(query?: EnergyGroupQuery) {
  if (!query) {
    return "";
  }

  const search = new URLSearchParams();
  if (query.stationId?.trim()) {
    search.set("stationId", query.stationId.trim());
  }
  if (query.status?.trim()) {
    search.set("status", query.status.trim());
  }

  const value = search.toString();
  return value ? `?${value}` : "";
}

function requestJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(`${ENERGY_BASE_PATH}${path}`, init);
}

export function listEnergyGroups(query?: EnergyGroupQuery) {
  return requestJson<EnergyLoadGroupSummary[]>(
    `/groups${buildQueryString(query)}`,
  );
}

export function listEnergyStationLiveStatus(stationId: string) {
  return requestJson<EnergyLoadGroupSummary[]>(
    `/stations/${encodeURIComponent(stationId)}/live-status`,
  );
}

export function getEnergyGroup(id: string) {
  return requestJson<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}`,
  );
}

export function getEnergyGroupHistory(id: string, limit = 25) {
  return requestJson<EnergyAllocationDecisionRecord[]>(
    `/groups/${encodeURIComponent(id)}/history?limit=${encodeURIComponent(String(limit))}`,
  );
}

function jsonRequest<T>(path: string, body?: unknown, method = "POST") {
  return requestJson<T>(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function createEnergyGroup(input: EnergyLoadGroupUpsertInput) {
  return jsonRequest<EnergyLoadGroupDetail>("/groups", input, "POST");
}

export function updateEnergyGroup(
  id: string,
  input: Partial<EnergyLoadGroupUpsertInput>,
) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}`,
    input,
    "PATCH",
  );
}

export function deleteEnergyGroup(id: string) {
  return requestJson<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function activateEnergyGroup(id: string, reason?: string) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/activate`,
    { reason: reason ?? "Manual activation" },
    "POST",
  );
}

export function disableEnergyGroup(id: string, reason?: string) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/disable`,
    { reason: reason ?? "Manual disable" },
    "POST",
  );
}

export function replaceEnergyGroupMemberships(
  id: string,
  memberships: EnergyLoadGroupMembershipInput[],
) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/memberships`,
    { memberships },
    "PUT",
  );
}

export function ingestEnergyTelemetry(
  id: string,
  input: EnergyTelemetryIngestInput,
) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/telemetry`,
    input,
    "POST",
  );
}

export function recalculateEnergyGroup(
  id: string,
  input: EnergyRecalculateInput = {},
) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/recalculate`,
    input,
    "POST",
  );
}

export function recalculateEnergyStation(stationId: string, reason?: string) {
  return jsonRequest<EnergyLoadGroupDetail[]>(
    `/stations/${encodeURIComponent(stationId)}/recalculate`,
    { reason: reason ?? "Manual station recalculate" },
    "POST",
  );
}

export function createEnergyOverride(id: string, input: EnergyOverrideInput) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/overrides`,
    input,
    "POST",
  );
}

export function clearEnergyOverride(id: string, overrideId: string) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/overrides/${encodeURIComponent(overrideId)}/clear`,
    {},
    "POST",
  );
}

export function acknowledgeEnergyAlert(id: string, alertId: string) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/alerts/${encodeURIComponent(alertId)}/acknowledge`,
    {},
    "POST",
  );
}

export function simulateEnergyMeterLoss(id: string) {
  return jsonRequest<EnergyLoadGroupDetail>(
    `/groups/${encodeURIComponent(id)}/simulate-meter-loss`,
    {},
    "POST",
  );
}

export type {
  EnergyAllocationDecisionRecord,
  EnergyAllocationPlanRecord,
  EnergyAlertRecord,
  EnergyLoadGroupDetail,
  EnergyLoadGroupMembershipInput,
  EnergyLoadGroupSummary,
  EnergyLoadGroupUpsertInput,
  EnergyOverrideInput,
  EnergyRecalculateInput,
  EnergyTelemetryIngestInput,
};
