import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/core/hooks/useTenant";
import {
  acknowledgeEnergyAlert,
  activateEnergyGroup,
  clearEnergyOverride,
  createEnergyGroup,
  createEnergyOverride,
  deleteEnergyGroup,
  getEnergyDerProfile,
  getEnergyGroup,
  getEnergyGroupHistory,
  ingestEnergyTelemetry,
  listEnergyGroups,
  listEnergyStationLiveStatus,
  recalculateEnergyGroup,
  recalculateEnergyStation,
  replaceEnergyGroupMemberships,
  simulateEnergyMeterLoss,
  upsertEnergyDerProfile,
  disableEnergyGroup,
  updateEnergyGroup,
  type EnergyAllocationDecisionRecord,
  type EnergyDerProfilePayload,
  type EnergyGroupQuery,
  type EnergyLoadGroupDetail,
  type EnergyLoadGroupMembershipInput,
  type EnergyLoadGroupSummary,
  type EnergyLoadGroupUpsertInput,
  type EnergyOverrideInput,
  type EnergyRecalculateInput,
  type EnergyTelemetryIngestInput,
} from "@/core/api/energyManagement";

function useEnergyTenantQueryContext(enabled = true) {
  const { activeScopeKey, isReady } = useTenant();

  return {
    enabled: enabled && isReady,
    scopeKey: activeScopeKey,
  };
}

function useInvalidateEnergyQueries() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({ queryKey: ["energy-management"] });
}

export function useEnergyLoadGroups(query?: EnergyGroupQuery) {
  const { enabled, scopeKey } = useEnergyTenantQueryContext();

  return useQuery<EnergyLoadGroupSummary[]>({
    queryKey: [
      "energy-management",
      "groups",
      scopeKey,
      query?.stationId ?? null,
      query?.status ?? null,
    ],
    queryFn: () => listEnergyGroups(query),
    enabled,
  });
}

export function useEnergyStationLiveStatus(stationId?: string) {
  const { enabled, scopeKey } = useEnergyTenantQueryContext(Boolean(stationId));

  return useQuery<EnergyLoadGroupSummary[]>({
    queryKey: [
      "energy-management",
      "station-live-status",
      scopeKey,
      stationId ?? null,
    ],
    queryFn: () => listEnergyStationLiveStatus(stationId ?? ""),
    enabled,
  });
}

export function useEnergyLoadGroup(id?: string) {
  const { enabled, scopeKey } = useEnergyTenantQueryContext(Boolean(id));

  return useQuery<EnergyLoadGroupDetail>({
    queryKey: ["energy-management", "group", scopeKey, id ?? null],
    queryFn: () => getEnergyGroup(id ?? ""),
    enabled,
  });
}

export function useEnergyLoadGroupHistory(id?: string, limit = 25) {
  const { enabled, scopeKey } = useEnergyTenantQueryContext(Boolean(id));

  return useQuery<EnergyAllocationDecisionRecord[]>({
    queryKey: [
      "energy-management",
      "group-history",
      scopeKey,
      id ?? null,
      limit,
    ],
    queryFn: () => getEnergyGroupHistory(id ?? "", limit),
    enabled,
  });
}

export function useEnergyDerProfile(stationId?: string) {
  const { enabled, scopeKey } = useEnergyTenantQueryContext(Boolean(stationId));

  return useQuery<EnergyDerProfilePayload>({
    queryKey: ["energy-management", "der-profile", scopeKey, stationId ?? null],
    queryFn: () => getEnergyDerProfile(stationId ?? ""),
    enabled,
  });
}

export function useCreateEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: (input: EnergyLoadGroupUpsertInput) => createEnergyGroup(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<EnergyLoadGroupUpsertInput>;
    }) => updateEnergyGroup(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: (id: string) => deleteEnergyGroup(id),
    onSuccess: invalidate,
  });
}

export function useActivateEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      activateEnergyGroup(id, reason),
    onSuccess: invalidate,
  });
}

export function useDisableEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      disableEnergyGroup(id, reason),
    onSuccess: invalidate,
  });
}

export function useReplaceEnergyGroupMemberships() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      id,
      memberships,
    }: {
      id: string;
      memberships: EnergyLoadGroupMembershipInput[];
    }) => replaceEnergyGroupMemberships(id, memberships),
    onSuccess: invalidate,
  });
}

export function useIngestEnergyTelemetry() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: EnergyTelemetryIngestInput;
    }) => ingestEnergyTelemetry(id, input),
    onSuccess: invalidate,
  });
}

export function useRecalculateEnergyGroup() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input?: EnergyRecalculateInput;
    }) => recalculateEnergyGroup(id, input ?? {}),
    onSuccess: invalidate,
  });
}

export function useRecalculateEnergyStation() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      stationId,
      reason,
    }: {
      stationId: string;
      reason?: string;
    }) => recalculateEnergyStation(stationId, reason),
    onSuccess: invalidate,
  });
}

export function useCreateEnergyOverride() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EnergyOverrideInput }) =>
      createEnergyOverride(id, input),
    onSuccess: invalidate,
  });
}

export function useClearEnergyOverride() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({ id, overrideId }: { id: string; overrideId: string }) =>
      clearEnergyOverride(id, overrideId),
    onSuccess: invalidate,
  });
}

export function useAcknowledgeEnergyAlert() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({ id, alertId }: { id: string; alertId: string }) =>
      acknowledgeEnergyAlert(id, alertId),
    onSuccess: invalidate,
  });
}

export function useSimulateEnergyMeterLoss() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: (id: string) => simulateEnergyMeterLoss(id),
    onSuccess: invalidate,
  });
}

export function useUpsertEnergyDerProfile() {
  const invalidate = useInvalidateEnergyQueries();

  return useMutation({
    mutationFn: ({
      stationId,
      input,
    }: {
      stationId: string;
      input: Record<string, unknown>;
    }) => upsertEnergyDerProfile(stationId, input),
    onSuccess: invalidate,
  });
}
