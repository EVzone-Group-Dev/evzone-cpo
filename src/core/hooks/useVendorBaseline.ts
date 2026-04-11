import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/core/hooks/useTenant";
import {
  applyVendorLoyaltyTransaction,
  createVendorTerminalCheckoutIntent,
  enrollVendorAutocharge,
  getVendorBaselineOverview,
  getVendorDriverWorkflow,
  getVendorSmartQueue,
  ingestVendorOpenAdrEvent,
  reconcileVendorTerminalCheckoutIntent,
  registerVendorPaymentTerminal,
  updateVendorRoamingPartnerProtocols,
  upsertVendorOpenAdrSettings,
  upsertVendorV2xProfile,
} from "@/core/api/vendorBaseline";
import type {
  VendorBaselineAutochargeEnrollmentInput,
  VendorBaselineDriverWorkflowQuery,
  VendorBaselineLoyaltyTransactionInput,
  VendorBaselineOpenAdrEventInput,
  VendorBaselineOpenAdrSettingsInput,
  VendorBaselineRoamingProtocolsInput,
  VendorBaselineTerminalCheckoutIntentInput,
  VendorBaselineTerminalIntentReconcileInput,
  VendorBaselineTerminalRegistrationInput,
  VendorBaselineV2xProfileInput,
} from "@/core/types/vendorBaseline";

function useVendorBaselineScope(enabled = true) {
  const { activeScopeKey, isReady } = useTenant();
  return {
    scopeKey: activeScopeKey,
    enabled: enabled && isReady,
  };
}

function useInvalidateVendorBaseline() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["vendor-baseline"] });
}

export function useVendorBaselineOverview() {
  const { enabled, scopeKey } = useVendorBaselineScope();

  return useQuery({
    queryKey: ["vendor-baseline", "overview", scopeKey],
    queryFn: getVendorBaselineOverview,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useVendorSmartQueue(query?: { stationId?: string; limit?: number }) {
  const { enabled, scopeKey } = useVendorBaselineScope();

  return useQuery({
    queryKey: ["vendor-baseline", "smart-queue", scopeKey, query?.stationId ?? null, query?.limit ?? null],
    queryFn: () => getVendorSmartQueue(query),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useVendorDriverWorkflow(
  driverId?: string,
  query?: VendorBaselineDriverWorkflowQuery,
) {
  const { enabled, scopeKey } = useVendorBaselineScope(Boolean(driverId));

  return useQuery({
    queryKey: ["vendor-baseline", "driver-workflow", scopeKey, driverId ?? null, query?.includeHistory ?? null],
    queryFn: () => getVendorDriverWorkflow(driverId ?? "", query),
    enabled,
  });
}

export function useUpsertVendorOpenAdrSettings() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineOpenAdrSettingsInput) =>
      upsertVendorOpenAdrSettings(input),
    onSuccess: invalidate,
  });
}

export function useIngestVendorOpenAdrEvent() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineOpenAdrEventInput) =>
      ingestVendorOpenAdrEvent(input),
    onSuccess: invalidate,
  });
}

export function useUpdateVendorRoamingProtocols() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: ({ partnerId, input }: { partnerId: string; input: VendorBaselineRoamingProtocolsInput }) =>
      updateVendorRoamingPartnerProtocols(partnerId, input),
    onSuccess: invalidate,
  });
}

export function useUpsertVendorV2xProfile() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: ({ stationId, input }: { stationId: string; input: VendorBaselineV2xProfileInput }) =>
      upsertVendorV2xProfile(stationId, input),
    onSuccess: invalidate,
  });
}

export function useEnrollVendorAutocharge() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineAutochargeEnrollmentInput) =>
      enrollVendorAutocharge(input),
    onSuccess: invalidate,
  });
}

export function useRegisterVendorPaymentTerminal() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineTerminalRegistrationInput) =>
      registerVendorPaymentTerminal(input),
    onSuccess: invalidate,
  });
}

export function useCreateVendorTerminalCheckoutIntent() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineTerminalCheckoutIntentInput) =>
      createVendorTerminalCheckoutIntent(input),
    onSuccess: invalidate,
  });
}

export function useReconcileVendorTerminalCheckoutIntent() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: ({ intentId, input }: { intentId: string; input: VendorBaselineTerminalIntentReconcileInput }) =>
      reconcileVendorTerminalCheckoutIntent(intentId, input),
    onSuccess: invalidate,
  });
}

export function useApplyVendorLoyaltyTransaction() {
  const invalidate = useInvalidateVendorBaseline();

  return useMutation({
    mutationFn: (input: VendorBaselineLoyaltyTransactionInput) =>
      applyVendorLoyaltyTransaction(input),
    onSuccess: invalidate,
  });
}
