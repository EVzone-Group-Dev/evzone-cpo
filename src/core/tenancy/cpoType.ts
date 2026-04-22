import type { AccessScopeType, TenantCpoType } from "@/core/types/domain";

export interface TenantCpoVisibilityContext {
  accessScopeType?: AccessScopeType | null;
  sessionScopeType?: "platform" | "tenant" | null;
  tenantCpoType?: TenantCpoType | null;
}

const EXPLICIT_HYBRID_TOKENS = new Set<string>([
  "HYBRID",
  "BOTH",
  "CHARGE_SWAP",
  "SWAP_CHARGE",
]);

function isTenantScopedSession(context: TenantCpoVisibilityContext) {
  if (context.sessionScopeType) {
    return context.sessionScopeType === "tenant";
  }

  return Boolean(context.accessScopeType && context.accessScopeType !== "platform");
}

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function normalizeTenantCpoType(value: unknown): TenantCpoType | null {
  const token = normalizeToken(value);
  if (!token) {
    return null;
  }

  if (EXPLICIT_HYBRID_TOKENS.has(token)) {
    return "HYBRID";
  }

  const hasSwap = token.includes("SWAP");
  const hasCharge = token.includes("CHARGE") || token.includes("CHARGING");

  if (hasSwap && hasCharge) {
    return "HYBRID";
  }

  if (hasSwap) {
    return "SWAP";
  }

  if (hasCharge) {
    return "CHARGE";
  }

  return null;
}

export function resolveTenantCpoTypeFromCandidates(
  candidates: ReadonlyArray<unknown>,
): TenantCpoType | null {
  for (const candidate of candidates) {
    const normalized = normalizeTenantCpoType(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function canAccessTenantCpoScopedNavItem(
  context: TenantCpoVisibilityContext,
  allowedTenantCpoTypes?: readonly TenantCpoType[],
): boolean {
  if (!allowedTenantCpoTypes || allowedTenantCpoTypes.length === 0) {
    return true;
  }

  if (!isTenantScopedSession(context)) {
    return true;
  }

  const resolvedCpoType = context.tenantCpoType ?? null;
  if (!resolvedCpoType) {
    return true;
  }

  return allowedTenantCpoTypes.includes(resolvedCpoType);
}
