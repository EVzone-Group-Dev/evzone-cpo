import {
  canAccessTenantCpoScopedNavItem,
  normalizeTenantCpoType,
  resolveTenantCpoTypeFromCandidates,
} from "@/core/tenancy/cpoType";
import { describe, expect, it } from "vitest";

describe("normalizeTenantCpoType", () => {
  it("normalizes charge, swap, and hybrid tokens", () => {
    expect(normalizeTenantCpoType("charge")).toBe("CHARGE");
    expect(normalizeTenantCpoType("SWAP")).toBe("SWAP");
    expect(normalizeTenantCpoType("Hybrid")).toBe("HYBRID");
    expect(normalizeTenantCpoType("charge + swap")).toBe("HYBRID");
    expect(normalizeTenantCpoType("swapping")).toBe("SWAP");
    expect(normalizeTenantCpoType("charging")).toBe("CHARGE");
  });

  it("returns null for unknown values", () => {
    expect(normalizeTenantCpoType("company")).toBeNull();
    expect(normalizeTenantCpoType("")).toBeNull();
    expect(normalizeTenantCpoType(null)).toBeNull();
  });
});

describe("resolveTenantCpoTypeFromCandidates", () => {
  it("returns the first recognized tenant cpo type", () => {
    expect(
      resolveTenantCpoTypeFromCandidates(["COMPANY", undefined, "swap"]),
    ).toBe("SWAP");
  });

  it("returns null when none of the candidates are recognized", () => {
    expect(resolveTenantCpoTypeFromCandidates(["COMPANY", "STATE"])).toBeNull();
  });
});

describe("canAccessTenantCpoScopedNavItem", () => {
  it("allows all items when item has no tenant cpo constraint", () => {
    expect(
      canAccessTenantCpoScopedNavItem(
        { sessionScopeType: "tenant", tenantCpoType: "SWAP" },
        undefined,
      ),
    ).toBe(true);
  });

  it("blocks charge-only items for swap tenants", () => {
    expect(
      canAccessTenantCpoScopedNavItem(
        { sessionScopeType: "tenant", tenantCpoType: "SWAP" },
        ["CHARGE", "HYBRID"],
      ),
    ).toBe(false);
  });

  it("allows hybrid items for hybrid tenants", () => {
    expect(
      canAccessTenantCpoScopedNavItem(
        { sessionScopeType: "tenant", tenantCpoType: "HYBRID" },
        ["CHARGE", "HYBRID"],
      ),
    ).toBe(true);
  });

  it("does not constrain platform sessions", () => {
    expect(
      canAccessTenantCpoScopedNavItem(
        { sessionScopeType: "platform", tenantCpoType: "SWAP" },
        ["CHARGE"],
      ),
    ).toBe(true);
  });

  it("fails open when tenant cpo type is unknown", () => {
    expect(
      canAccessTenantCpoScopedNavItem(
        { sessionScopeType: "tenant", tenantCpoType: null },
        ["SWAP"],
      ),
    ).toBe(true);
  });
});
