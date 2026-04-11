import { fetchJson } from "@/core/api/fetchJson";
import type {
  VendorBaselineAutochargeEnrollmentInput,
  VendorBaselineDriverWorkflowQuery,
  VendorBaselineLoyaltyTransactionInput,
  VendorBaselineOpenAdrEventInput,
  VendorBaselineOpenAdrSettingsInput,
  VendorBaselineOverviewResponse,
  VendorBaselineRoamingProtocolsInput,
  VendorBaselineSmartQueueResponse,
  VendorBaselineTerminalCheckoutIntentInput,
  VendorBaselineTerminalIntentReconcileInput,
  VendorBaselineTerminalRegistrationInput,
  VendorBaselineV2xProfileInput,
} from "@/core/types/vendorBaseline";

const BASE_PATH = "/api/v1/vendor-baseline";

function requestJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(`${BASE_PATH}${path}`, init);
}

function buildQuery<T extends object>(query?: T) {
  if (!query) return "";

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.append(key, String(value));
  }

  const payload = params.toString();
  return payload.length > 0 ? `?${payload}` : "";
}

function jsonRequest<T>(path: string, body: unknown, method = "POST") {
  return requestJson<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getVendorBaselineOverview() {
  return requestJson<VendorBaselineOverviewResponse>("/overview");
}

export function upsertVendorOpenAdrSettings(input: VendorBaselineOpenAdrSettingsInput) {
  return jsonRequest<Record<string, unknown>>("/openadr", input, "PUT");
}

export function ingestVendorOpenAdrEvent(input: VendorBaselineOpenAdrEventInput) {
  return jsonRequest<Record<string, unknown>>("/openadr/events", input);
}

export function updateVendorRoamingPartnerProtocols(
  partnerId: string,
  input: VendorBaselineRoamingProtocolsInput,
) {
  return jsonRequest<Record<string, unknown>>(
    `/roaming/protocols/partners/${encodeURIComponent(partnerId)}`,
    input,
    "PATCH",
  );
}

export function upsertVendorV2xProfile(
  stationId: string,
  input: VendorBaselineV2xProfileInput,
) {
  return jsonRequest<Record<string, unknown>>(
    `/stations/${encodeURIComponent(stationId)}/v2x`,
    input,
    "PUT",
  );
}

export function enrollVendorAutocharge(input: VendorBaselineAutochargeEnrollmentInput) {
  return jsonRequest<Record<string, unknown>>("/autocharge/enrollments", input);
}

export function getVendorSmartQueue(query?: { stationId?: string; limit?: number }) {
  return requestJson<VendorBaselineSmartQueueResponse>(
    `/smart-queue${buildQuery(query)}`,
  );
}

export function registerVendorPaymentTerminal(
  input: VendorBaselineTerminalRegistrationInput,
) {
  return jsonRequest<Record<string, unknown>>("/payment-terminals/register", input);
}

export function createVendorTerminalCheckoutIntent(
  input: VendorBaselineTerminalCheckoutIntentInput,
) {
  return jsonRequest<Record<string, unknown>>(
    "/payment-terminals/checkout-intents",
    input,
  );
}

export function reconcileVendorTerminalCheckoutIntent(
  intentId: string,
  input: VendorBaselineTerminalIntentReconcileInput,
) {
  return jsonRequest<Record<string, unknown>>(
    `/payment-terminals/checkout-intents/${encodeURIComponent(intentId)}/reconcile`,
    input,
  );
}

export function applyVendorLoyaltyTransaction(
  input: VendorBaselineLoyaltyTransactionInput,
) {
  return jsonRequest<Record<string, unknown>>("/loyalty/transactions", input);
}

export function getVendorDriverWorkflow(
  driverId: string,
  query?: VendorBaselineDriverWorkflowQuery,
) {
  return requestJson<Record<string, unknown>>(
    `/driver-app/workflows/${encodeURIComponent(driverId)}${buildQuery(query)}`,
  );
}
