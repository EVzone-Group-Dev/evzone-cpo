import {
  ACCESS_POLICY,
  canAccessPolicy,
  type AccessPolicyKey,
} from "@/core/auth/access";
import type { AuthenticatedApiUser } from "@/core/types/mockApi";
import { http, HttpResponse } from "msw";
import {
  applySwapPackRetirementDecision,
  applySwapDispatchAction,
  approveAssistedSessionConsent,
  authenticateDemoUser,
  authenticateDemoUserByEmail,
  completeAssistedSession,
  createAssistedSession,
  createChargePoint,
  extendAssistedSession,
  getAssistedHandoverReport,
  getAssistedSession,
  getBatteryInventory,
  getBilling,
  getChargePointById,
  getDashboardOverview,
  getDemoUserHints,
  getIncidentCommand,
  getIntegrationsModule,
  getNotificationsModule,
  getOCPICommands,
  getOCPICdrs,
  getProtocolEngine,
  getSwapRebalancing,
  getRoamingPartnerObservability,
  getRoamingPartnerObservabilityDetail,
  getReports,
  getRoamingSessions,
  getSettlement,
  getSiteOwnerDashboard,
  getSmartCharging,
  getStationById,
  getSwapStationById,
  getWebhooksModule,
  isDemoLoginBlockedByCredentials,
  isDemoLoginBlockedByEmail,
  // Legacy analytics mocks remain for backward compatibility.
  inspectSwapPack,
  listAlerts,
  listAssistedAuditEvents,
  listAssistedSessions,
  listAuditLogs,
  listBatterySwapSessions,
  listChargePoints,
  listLoadPolicies,
  listPayouts,
  listRoamingPartners,
  listSessions,
  listStations,
  listSwapStations,
  listTariffs,
  listTeamMembers,
  listDemoTenants,
  refreshDemoUserSession,
  resetDemoAuthSessions,
  resolveDemoAccess,
  recordAssistedScopedAction,
  rejectAssistedSessionConsent,
  requestAssistedSessionConsent,
  startAssistedSession,
  stopSessionById,
  updateDemoUserProfile,
  validateAssistedScopedWrite,
  transitionSwapPack,
  revokeAssistedSession,
  switchDemoTenant,
  switchDemoStationContext,
  updateDemoUserMfaRequirement,
  type ResolvedDemoAccess,
} from "./data";
import {
  acknowledgeEnergyManagementAlert,
  activateEnergyManagementGroup,
  clearEnergyManagementOverride,
  createEnergyManagementGroup,
  createEnergyManagementOverride,
  deleteEnergyManagementGroup,
  getEnergyManagementGroup,
  getEnergyManagementHistory,
  ingestEnergyManagementTelemetry,
  listEnergyManagementGroups,
  listEnergyStationLiveStatus,
  recalculateEnergyManagementGroup,
  recalculateEnergyManagementStation,
  replaceEnergyManagementMemberships,
  resetEnergyManagementFixtures,
  simulateEnergyMeterLoss,
  disableEnergyManagementGroup,
  updateEnergyManagementGroup,
} from "./energyManagement";

type RequestAccess = ResolvedDemoAccess;

type AccessResult =
  | { ok: true; access: RequestAccess }
  | { ok: false; response: Response };

const TENANT_NOT_ACTIVATED_MESSAGE = "Account Not Activated---- contact Admin.";

function getRequestAccess(request: Request): RequestAccess | null {
  return resolveDemoAccess(
    request.headers.get("authorization"),
    request.headers.get("x-tenant-id"),
  );
}

function unauthorized() {
  return HttpResponse.json({ message: "Unauthorized." }, { status: 401 });
}

function forbidden(user: AuthenticatedApiUser, policy: AccessPolicyKey) {
  return HttpResponse.json(
    {
      message: "Forbidden.",
      role: user.role,
      allowedRoles: ACCESS_POLICY[policy],
      policy,
    },
    { status: 403 },
  );
}

function authorize(request: Request, policy: AccessPolicyKey): AccessResult {
  const access = getRequestAccess(request);
  if (!access) {
    return { ok: false, response: unauthorized() };
  }

  if (!canAccessPolicy(access.user, policy)) {
    return { ok: false, response: forbidden(access.user, policy) };
  }

  return { ok: true, access };
}

function resolveAccessTenantExternalId(access: RequestAccess): string | null {
  return (
    access.user.activeTenantId
    ?? access.user.selectedTenantId
    ?? access.user.tenantId
    ?? null
  )
}

function loginResolver(request: Request) {
  return request.json().then(({ email, password, otpCode, otpChannel }) => {
    const auth = authenticateDemoUser(email, password);
    if (!auth) {
      if (isDemoLoginBlockedByCredentials(email, password)) {
        return HttpResponse.json(
          { message: TENANT_NOT_ACTIVATED_MESSAGE },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    auth.user.mfaSetupRequired = Boolean(
      auth.user.mfaSetupRequired
      ?? (!auth.user.mfaRequired && !auth.user.twoFactorEnabled),
    );

    const otpBackedMfa =
      auth.user.mfaRequired === true && auth.user.twoFactorEnabled !== true;
    if (otpBackedMfa) {
      const providedOtpCode =
        typeof otpCode === "string" ? otpCode.trim() : "";
      const requestedChannel: "email" | "sms" =
        otpChannel === "sms" ? "sms" : "email";

      if (!providedOtpCode) {
        if (requestedChannel === "email" && !auth.user.email) {
          return HttpResponse.json(
            { message: "Email OTP is unavailable for this account." },
            { status: 400 },
          );
        }

        if (requestedChannel === "sms" && !auth.user.phone) {
          return HttpResponse.json(
            { message: "SMS OTP is unavailable for this account." },
            { status: 400 },
          );
        }

        demoMfaSetupOtpChallenges.set(auth.user.id, {
          code: "123456",
          channel: requestedChannel,
          expiresAtMs: Date.now() + 5 * 60 * 1000,
        });

        return HttpResponse.json(
          {
            message: `OTP verification is required. A code has been sent to your ${requestedChannel}.`,
          },
          { status: 401 },
        );
      }

      const activeChallenge = demoMfaSetupOtpChallenges.get(auth.user.id);
      if (!activeChallenge || activeChallenge.expiresAtMs < Date.now()) {
        return HttpResponse.json(
          { message: "OTP Expired" },
          { status: 401 },
        );
      }

      if (activeChallenge.code !== providedOtpCode) {
        return HttpResponse.json(
          { message: "Invalid OTP" },
          { status: 401 },
        );
      }

      demoMfaSetupOtpChallenges.delete(auth.user.id);
    }

    return HttpResponse.json(auth);
  });
}

const demoPasskeyLoginChallenges = new Map<
  string,
  { email: string; expiresAtMs: number }
>();
const demoMfaSetupOtpChallenges = new Map<
  string,
  { code: string; channel: "email" | "sms"; expiresAtMs: number }
>();

function createDemoPasskeyChallengeId() {
  return `demo-passkey-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDemoWebAuthnChallenge() {
  return `demo-webauthn-${Math.random().toString(36).slice(2, 14)}`;
}

function maskOtpDestination(
  channel: "email" | "sms",
  destination: string,
): string {
  const value = destination.trim();

  if (channel === "email") {
    const [localPartRaw, domainRaw] = value.split("@");
    const localPart = localPartRaw || "";
    const domain = domainRaw || "";
    const visibleLocal = localPart.slice(0, 2);
    return domain ? `${visibleLocal}***@${domain}` : `${visibleLocal}***`;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : `***${digits}`;
}

const REFERENCE_COUNTRIES = [
  {
    code2: "DE",
    code3: "DEU",
    name: "Germany",
    officialName: "Federal Republic of Germany",
    flagUrl: "https://flagcdn.com/de.svg",
    currencyCode: "EUR",
    currencyName: "Euro",
    currencySymbol: "EUR",
    languages: ["German"],
  },
  {
    code2: "KE",
    code3: "KEN",
    name: "Kenya",
    officialName: "Republic of Kenya",
    flagUrl: "https://flagcdn.com/ke.svg",
    currencyCode: "KES",
    currencyName: "Kenyan shilling",
    currencySymbol: "KSh",
    languages: ["English", "Swahili"],
  },
  {
    code2: "NL",
    code3: "NLD",
    name: "Netherlands",
    officialName: "Kingdom of the Netherlands",
    flagUrl: "https://flagcdn.com/nl.svg",
    currencyCode: "EUR",
    currencyName: "Euro",
    currencySymbol: "EUR",
    languages: ["Dutch"],
  },
  {
    code2: "UG",
    code3: "UGA",
    name: "Uganda",
    officialName: "Republic of Uganda",
    flagUrl: "https://flagcdn.com/ug.svg",
    currencyCode: "UGX",
    currencyName: "Ugandan shilling",
    currencySymbol: "USh",
    languages: ["English", "Swahili"],
  },
  {
    code2: "US",
    code3: "USA",
    name: "United States",
    officialName: "United States of America",
    flagUrl: "https://flagcdn.com/us.svg",
    currencyCode: "USD",
    currencyName: "United States dollar",
    currencySymbol: "$",
    languages: ["English"],
  },
];

const REFERENCE_STATES: Record<
  string,
  Array<{ countryCode: string; code: string; name: string }>
> = {
  DE: [
    { countryCode: "DE", code: "BE", name: "Berlin" },
    { countryCode: "DE", code: "BW", name: "Baden-Wurttemberg" },
    { countryCode: "DE", code: "BY", name: "Bavaria" },
  ],
  KE: [
    { countryCode: "KE", code: "NA", name: "Nairobi County" },
    { countryCode: "KE", code: "MU", name: "Mombasa County" },
    { countryCode: "KE", code: "KI", name: "Kiambu County" },
  ],
  NL: [
    { countryCode: "NL", code: "NH", name: "North Holland" },
    { countryCode: "NL", code: "ZH", name: "South Holland" },
  ],
  UG: [
    { countryCode: "UG", code: "C", name: "Central Region" },
    { countryCode: "UG", code: "E", name: "Eastern Region" },
    { countryCode: "UG", code: "N", name: "Northern Region" },
    { countryCode: "UG", code: "W", name: "Western Region" },
  ],
  US: [
    { countryCode: "US", code: "CA", name: "California" },
    { countryCode: "US", code: "NY", name: "New York" },
    { countryCode: "US", code: "TX", name: "Texas" },
  ],
};

const REFERENCE_CITIES: Record<
  string,
  Array<{ countryCode: string; stateCode: string; name: string }>
> = {
  "DE:BE": [{ countryCode: "DE", stateCode: "BE", name: "Berlin" }],
  "DE:BW": [
    { countryCode: "DE", stateCode: "BW", name: "Stuttgart" },
    { countryCode: "DE", stateCode: "BW", name: "Mannheim" },
  ],
  "DE:BY": [
    { countryCode: "DE", stateCode: "BY", name: "Munich" },
    { countryCode: "DE", stateCode: "BY", name: "Nuremberg" },
  ],
  "KE:NA": [
    { countryCode: "KE", stateCode: "NA", name: "Nairobi" },
    { countryCode: "KE", stateCode: "NA", name: "Westlands" },
  ],
  "KE:MU": [{ countryCode: "KE", stateCode: "MU", name: "Mombasa" }],
  "KE:KI": [
    { countryCode: "KE", stateCode: "KI", name: "Kiambu" },
    { countryCode: "KE", stateCode: "KI", name: "Thika" },
  ],
  "NL:NH": [
    { countryCode: "NL", stateCode: "NH", name: "Amsterdam" },
    { countryCode: "NL", stateCode: "NH", name: "Haarlem" },
  ],
  "NL:ZH": [
    { countryCode: "NL", stateCode: "ZH", name: "Rotterdam" },
    { countryCode: "NL", stateCode: "ZH", name: "The Hague" },
  ],
  "UG:C": [
    { countryCode: "UG", stateCode: "C", name: "Kampala" },
    { countryCode: "UG", stateCode: "C", name: "Entebbe" },
  ],
  "UG:E": [
    { countryCode: "UG", stateCode: "E", name: "Jinja" },
    { countryCode: "UG", stateCode: "E", name: "Mbale" },
  ],
  "UG:N": [{ countryCode: "UG", stateCode: "N", name: "Gulu" }],
  "UG:W": [{ countryCode: "UG", stateCode: "W", name: "Mbarara" }],
  "US:CA": [
    { countryCode: "US", stateCode: "CA", name: "San Francisco" },
    { countryCode: "US", stateCode: "CA", name: "Los Angeles" },
  ],
  "US:NY": [
    { countryCode: "US", stateCode: "NY", name: "New York" },
    { countryCode: "US", stateCode: "NY", name: "Buffalo" },
  ],
  "US:TX": [
    { countryCode: "US", stateCode: "TX", name: "Austin" },
    { countryCode: "US", stateCode: "TX", name: "Houston" },
  ],
};

function normalizeGeographyToken(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export const handlers = [
  http.get("/api/v1/auth/demo-users", () =>
    HttpResponse.json(getDemoUserHints()),
  ),
  http.get("/api/auth/demo-users", () => HttpResponse.json(getDemoUserHints())),

  http.post("/api/v1/auth/login", ({ request }) => loginResolver(request)),
  http.post("/api/auth/login", ({ request }) => loginResolver(request)),
  http.post("/api/v1/auth/mfa/setup/otp/send", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ channel?: "email" | "sms" }>(request);
    const requestedChannel = body.channel === "sms" ? "sms" : "email";

    if (requestedChannel === "email" && !access.user.email) {
      return HttpResponse.json(
        { message: "Email OTP is unavailable for this account." },
        { status: 400 },
      );
    }

    if (requestedChannel === "sms" && !access.user.phone) {
      return HttpResponse.json(
        { message: "SMS OTP is unavailable for this account." },
        { status: 400 },
      );
    }

    demoMfaSetupOtpChallenges.set(access.user.id, {
      code: "123456",
      channel: requestedChannel,
      expiresAtMs: Date.now() + 5 * 60 * 1000,
    });

    const destination =
      requestedChannel === "email" ? access.user.email ?? "" : access.user.phone ?? "";

    return HttpResponse.json({
      success: true,
      channel: requestedChannel,
      destination: maskOtpDestination(requestedChannel, destination),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),
  http.post("/api/auth/mfa/setup/otp/send", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ channel?: "email" | "sms" }>(request);
    const requestedChannel = body.channel === "sms" ? "sms" : "email";

    if (requestedChannel === "email" && !access.user.email) {
      return HttpResponse.json(
        { message: "Email OTP is unavailable for this account." },
        { status: 400 },
      );
    }

    if (requestedChannel === "sms" && !access.user.phone) {
      return HttpResponse.json(
        { message: "SMS OTP is unavailable for this account." },
        { status: 400 },
      );
    }

    demoMfaSetupOtpChallenges.set(access.user.id, {
      code: "123456",
      channel: requestedChannel,
      expiresAtMs: Date.now() + 5 * 60 * 1000,
    });

    const destination =
      requestedChannel === "email" ? access.user.email ?? "" : access.user.phone ?? "";

    return HttpResponse.json({
      success: true,
      channel: requestedChannel,
      destination: maskOtpDestination(requestedChannel, destination),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),
  http.post("/api/v1/auth/mfa/setup/otp/verify", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ code?: string }>(request);
    const code = body.code?.trim() ?? "";
    if (!code) {
      return HttpResponse.json({ message: "OTP code is required." }, { status: 400 });
    }

    const challenge = demoMfaSetupOtpChallenges.get(access.user.id);
    if (!challenge || challenge.expiresAtMs < Date.now()) {
      return HttpResponse.json({ message: "OTP Expired" }, { status: 401 });
    }

    if (challenge.code !== code) {
      return HttpResponse.json({ message: "Invalid OTP" }, { status: 401 });
    }

    demoMfaSetupOtpChallenges.delete(access.user.id);
    updateDemoUserMfaRequirement(access, true, {
      mfaSetupRequired: false,
      twoFactorEnabled: false,
    });

    return HttpResponse.json({
      success: true,
      message: "OTP-based MFA is now enabled",
    });
  }),
  http.post("/api/auth/mfa/setup/otp/verify", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ code?: string }>(request);
    const code = body.code?.trim() ?? "";
    if (!code) {
      return HttpResponse.json({ message: "OTP code is required." }, { status: 400 });
    }

    const challenge = demoMfaSetupOtpChallenges.get(access.user.id);
    if (!challenge || challenge.expiresAtMs < Date.now()) {
      return HttpResponse.json({ message: "OTP Expired" }, { status: 401 });
    }

    if (challenge.code !== code) {
      return HttpResponse.json({ message: "Invalid OTP" }, { status: 401 });
    }

    demoMfaSetupOtpChallenges.delete(access.user.id);
    updateDemoUserMfaRequirement(access, true, {
      mfaSetupRequired: false,
      twoFactorEnabled: false,
    });

    return HttpResponse.json({
      success: true,
      message: "OTP-based MFA is now enabled",
    });
  }),
  http.post("/api/v1/auth/2fa/generate", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ currentPassword?: string }>(request);
    const currentPassword = body.currentPassword?.trim() ?? "";
    if (!currentPassword || currentPassword !== access.demoUser.password) {
      return HttpResponse.json(
        { message: "Invalid current password" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      qrCodeUrl:
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2Y4ZmFmYyIvPjx0ZXh0IHg9IjgwIiB5PSI4MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzNDI1NSI+REVNTyBRUjwvdGV4dD48L3N2Zz4=",
      secret: "DEMO-2FA-SECRET",
    });
  }),
  http.post("/api/auth/2fa/generate", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ currentPassword?: string }>(request);
    const currentPassword = body.currentPassword?.trim() ?? "";
    if (!currentPassword || currentPassword !== access.demoUser.password) {
      return HttpResponse.json(
        { message: "Invalid current password" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      qrCodeUrl:
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2Y4ZmFmYyIvPjx0ZXh0IHg9IjgwIiB5PSI4MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzNDI1NSI+REVNTyBRUjwvdGV4dD48L3N2Zz4=",
      secret: "DEMO-2FA-SECRET",
    });
  }),
  http.post("/api/v1/auth/2fa/verify", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ token?: string }>(request);
    const token = body.token?.trim() ?? "";
    if (token !== "123456") {
      return HttpResponse.json(
        { message: "Invalid 2FA token" },
        { status: 400 },
      );
    }

    updateDemoUserMfaRequirement(access, true, {
      mfaSetupRequired: false,
      twoFactorEnabled: true,
    });

    return HttpResponse.json({
      success: true,
      message: "2FA enabled successfully",
    });
  }),
  http.post("/api/auth/2fa/verify", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ token?: string }>(request);
    const token = body.token?.trim() ?? "";
    if (token !== "123456") {
      return HttpResponse.json(
        { message: "Invalid 2FA token" },
        { status: 400 },
      );
    }

    updateDemoUserMfaRequirement(access, true, {
      mfaSetupRequired: false,
      twoFactorEnabled: true,
    });

    return HttpResponse.json({
      success: true,
      message: "2FA enabled successfully",
    });
  }),

  http.post("/api/v1/auth/mfa/passkeys/login/options", async ({ request }) => {
    const body = await readJsonBody<{ email?: string }>(request);
    const email = body.email?.trim() ?? "";

    if (!email) {
      return HttpResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const auth = authenticateDemoUserByEmail(email);
    if (!auth) {
      if (isDemoLoginBlockedByEmail(email)) {
        return HttpResponse.json(
          { message: TENANT_NOT_ACTIVATED_MESSAGE },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const challengeId = createDemoPasskeyChallengeId();
    demoPasskeyLoginChallenges.set(challengeId, {
      email,
      expiresAtMs: Date.now() + 5 * 60 * 1000,
    });

    return HttpResponse.json({
      challengeId,
      options: {
        challenge: createDemoWebAuthnChallenge(),
        rpId: "localhost",
        timeout: 60000,
        userVerification: "required",
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),
  http.post("/api/auth/mfa/passkeys/login/options", async ({ request }) => {
    const body = await readJsonBody<{ email?: string }>(request);
    const email = body.email?.trim() ?? "";

    if (!email) {
      return HttpResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const auth = authenticateDemoUserByEmail(email);
    if (!auth) {
      if (isDemoLoginBlockedByEmail(email)) {
        return HttpResponse.json(
          { message: TENANT_NOT_ACTIVATED_MESSAGE },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const challengeId = createDemoPasskeyChallengeId();
    demoPasskeyLoginChallenges.set(challengeId, {
      email,
      expiresAtMs: Date.now() + 5 * 60 * 1000,
    });

    return HttpResponse.json({
      challengeId,
      options: {
        challenge: createDemoWebAuthnChallenge(),
        rpId: "localhost",
        timeout: 60000,
        userVerification: "required",
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),

  http.post("/api/v1/auth/mfa/passkeys/login/verify", async ({ request }) => {
    const body = await readJsonBody<{
      challengeId?: string;
      response?: Record<string, unknown>;
    }>(request);
    const challengeId = body.challengeId?.trim() ?? "";
    if (!challengeId) {
      return HttpResponse.json(
        { message: "challengeId is required" },
        { status: 400 },
      );
    }

    const challenge = demoPasskeyLoginChallenges.get(challengeId);
    if (!challenge || challenge.expiresAtMs < Date.now()) {
      return HttpResponse.json(
        { message: "MFA challenge has expired" },
        { status: 400 },
      );
    }

    const auth = authenticateDemoUserByEmail(challenge.email);
    demoPasskeyLoginChallenges.delete(challengeId);

    if (!auth) {
      if (isDemoLoginBlockedByEmail(challenge.email)) {
        return HttpResponse.json(
          { message: TENANT_NOT_ACTIVATED_MESSAGE },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    return HttpResponse.json(auth);
  }),
  http.post("/api/auth/mfa/passkeys/login/verify", async ({ request }) => {
    const body = await readJsonBody<{
      challengeId?: string;
      response?: Record<string, unknown>;
    }>(request);
    const challengeId = body.challengeId?.trim() ?? "";
    if (!challengeId) {
      return HttpResponse.json(
        { message: "challengeId is required" },
        { status: 400 },
      );
    }

    const challenge = demoPasskeyLoginChallenges.get(challengeId);
    if (!challenge || challenge.expiresAtMs < Date.now()) {
      return HttpResponse.json(
        { message: "MFA challenge has expired" },
        { status: 400 },
      );
    }

    const auth = authenticateDemoUserByEmail(challenge.email);
    demoPasskeyLoginChallenges.delete(challengeId);

    if (!auth) {
      if (isDemoLoginBlockedByEmail(challenge.email)) {
        return HttpResponse.json(
          { message: TENANT_NOT_ACTIVATED_MESSAGE },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    return HttpResponse.json(auth);
  }),

  http.post("/api/v1/auth/refresh", async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string | null };
    const auth = refreshDemoUserSession(body.refreshToken ?? null);

    if (!auth) {
      return HttpResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return HttpResponse.json(auth);
  }),

  http.patch("/api/v1/auth/me", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ country?: string; name?: string }>(
      request,
    );
    const updatedUser = updateDemoUserProfile(access, body);

    if (!updatedUser) {
      return unauthorized();
    }

    return HttpResponse.json(updatedUser);
  }),
  http.patch("/api/v1/users/me", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ country?: string; name?: string }>(
      request,
    );
    const updatedUser = updateDemoUserProfile(access, body);

    if (!updatedUser) {
      return unauthorized();
    }

    return HttpResponse.json(updatedUser);
  }),
  http.patch("/api/auth/me", async ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const body = await readJsonBody<{ country?: string; name?: string }>(
      request,
    );
    const updatedUser = updateDemoUserProfile(access, body);

    if (!updatedUser) {
      return unauthorized();
    }

    return HttpResponse.json(updatedUser);
  }),

  http.post("/api/v1/users/:id/mfa-requirement", async ({ request, params }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const targetUserId = String(params.id ?? "");
    if (!targetUserId) {
      return HttpResponse.json(
        { message: "User id is required." },
        { status: 400 },
      );
    }

    if (targetUserId !== access.user.id) {
      return HttpResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await readJsonBody<{ required?: boolean }>(request);
    if (typeof body.required !== "boolean") {
      return HttpResponse.json(
        { message: "required must be a boolean." },
        { status: 400 },
      );
    }

    const updated = updateDemoUserMfaRequirement(access, body.required);
    if (!updated) {
      return unauthorized();
    }

    return HttpResponse.json({
      success: true,
      user: updated,
    });
  }),

  http.get("/api/v1/users/me", ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }
    return HttpResponse.json(access.user);
  }),

  http.get("/api/v1/auth/access-profile", ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }
    return HttpResponse.json(access.user.accessProfile ?? null);
  }),

  http.post("/api/v1/auth/switch-tenant", async ({ request }) => {
    const authorization = request.headers.get("authorization");
    const { tenantId } = (await request.json()) as { tenantId?: string | null };
    const auth = switchDemoTenant(authorization, tenantId);

    if (!auth) {
      return HttpResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return HttpResponse.json(auth);
  }),

  http.get("/api/v1/users/me/station-contexts", ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    return HttpResponse.json({
      stationContexts: access.user.stationContexts ?? [],
      activeStationContext: access.user.activeStationContext ?? null,
    });
  }),

  http.post("/api/v1/users/me/station-context", async ({ request }) => {
    const authorization = request.headers.get("authorization");
    const { assignmentId } = (await request.json()) as { assignmentId: string };
    const stationContext = switchDemoStationContext(
      authorization,
      assignmentId,
    );

    if (!stationContext) {
      return HttpResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    return HttpResponse.json(stationContext);
  }),

  http.get("/api/v1/tenants", ({ request }) => {
    const tenants = listDemoTenants(request.headers.get("authorization"));
    if (tenants.length === 0) {
      return unauthorized();
    }
    return HttpResponse.json(tenants);
  }),

  http.get("/api/v1/platform/tenants", ({ request }) => {
    const tenants = listDemoTenants(request.headers.get("authorization"));
    if (tenants.length === 0) {
      return unauthorized();
    }
    return HttpResponse.json(tenants);
  }),

  http.get("/api/v1/platform/assisted-sessions", ({ request }) => {
    const access = getRequestAccess(request);
    if (!access) {
      return unauthorized();
    }

    const url = new URL(request.url);
    return HttpResponse.json(
      listAssistedSessions(request.headers.get("authorization"), {
        tenantId: url.searchParams.get("tenantId"),
        status: url.searchParams.get("status"),
        applicationId: url.searchParams.get("applicationId"),
      }),
    );
  }),

  http.post("/api/v1/platform/assisted-sessions", async ({ request }) => {
    const created = createAssistedSession(
      request.headers.get("authorization"),
      await readJsonBody(request),
    );

    if (!created.ok) {
      return HttpResponse.json({ message: created.message }, { status: created.status });
    }

    return HttpResponse.json(created.value, { status: 201 });
  }),

  http.get("/api/v1/platform/assisted-sessions/:id", ({ params, request }) => {
    const session = getAssistedSession(
      request.headers.get("authorization"),
      String(params.id),
    );

    if (!session) {
      return HttpResponse.json({ message: "Assisted session not found." }, { status: 404 });
    }

    return HttpResponse.json(session);
  }),

  http.post(
    "/api/v1/platform/assisted-sessions/:id/request-consent",
    ({ params, request }) => {
      const result = requestAssistedSessionConsent(
        request.headers.get("authorization"),
        String(params.id),
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value.receipt, { status: 202 });
    },
  ),

  http.post(
    "/api/v1/tenant/assisted-sessions/:id/consent/approve",
    ({ params, request }) => {
      const result = approveAssistedSessionConsent(
        request.headers.get("authorization"),
        String(params.id),
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.post(
    "/api/v1/tenant/assisted-sessions/:id/consent/reject",
    async ({ params, request }) => {
      const body = await readJsonBody<{ reason?: string }>(request);
      const result = rejectAssistedSessionConsent(
        request.headers.get("authorization"),
        String(params.id),
        body.reason,
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.post(
    "/api/v1/platform/assisted-sessions/:id/start",
    async ({ params, request }) => {
      const result = startAssistedSession(
        request.headers.get("authorization"),
        String(params.id),
        await readJsonBody(request),
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.post(
    "/api/v1/platform/assisted-sessions/:id/extend",
    async ({ params, request }) => {
      const result = extendAssistedSession(
        request.headers.get("authorization"),
        String(params.id),
        await readJsonBody(request),
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.post(
    "/api/v1/platform/assisted-sessions/:id/complete",
    async ({ params, request }) => {
      const result = completeAssistedSession(
        request.headers.get("authorization"),
        String(params.id),
        await readJsonBody(request),
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.post(
    "/api/v1/platform/assisted-sessions/:id/revoke",
    async ({ params, request }) => {
      const body = await readJsonBody<{ reason?: string }>(request);
      const result = revokeAssistedSession(
        request.headers.get("authorization"),
        String(params.id),
        body.reason,
      );

      if (!result.ok) {
        return HttpResponse.json({ message: result.message }, { status: result.status });
      }

      return HttpResponse.json(result.value);
    },
  ),

  http.get("/api/v1/platform/assisted-sessions/:id/audit-events", ({ params, request }) => {
    const result = listAssistedAuditEvents(
      request.headers.get("authorization"),
      String(params.id),
    );

    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: result.status });
    }

    return HttpResponse.json(result.value);
  }),

  http.get("/api/v1/tenant/assisted-sessions/:id/handover-report", ({ params, request }) => {
    const result = getAssistedHandoverReport(
      request.headers.get("authorization"),
      String(params.id),
    );

    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: result.status });
    }

    return HttpResponse.json(result.value);
  }),

  http.get("/api/v1/geography/reference/countries", () =>
    HttpResponse.json(REFERENCE_COUNTRIES),
  ),
  http.get(
    "/api/v1/geography/reference/countries/:countryCode/states",
    ({ params }) => {
      const countryCode = normalizeGeographyToken(params.countryCode);
      return HttpResponse.json(REFERENCE_STATES[countryCode] ?? []);
    },
  ),
  http.get(
    "/api/v1/geography/reference/countries/:countryCode/states/:stateCode/cities",
    ({ params }) => {
      const countryCode = normalizeGeographyToken(params.countryCode);
      const stateCode = normalizeGeographyToken(params.stateCode);
      return HttpResponse.json(
        REFERENCE_CITIES[`${countryCode}:${stateCode}`] ?? [],
      );
    },
  ),

  http.get("/api/tenancy/context", ({ request }) => {
    const result = authorize(request, "tenancyContext");
    if (!result.ok) return result.response;
    return HttpResponse.json(result.access.context);
  }),

  http.get("/api/dashboard/overview", ({ request }) => {
    const result = authorize(request, "dashboardHome");
    if (!result.ok) return result.response;
    return HttpResponse.json(getDashboardOverview(result.access.tenantId));
  }),

  http.get("/api/dashboard/site-owner", ({ request }) => {
    const result = authorize(request, "siteDashboard");
    if (!result.ok) return result.response;
    return HttpResponse.json(getSiteOwnerDashboard(result.access.tenantId));
  }),

  http.get("/api/v1/analytics/owner/dashboard", ({ request }) => {
    const result = authorize(request, "siteDashboard");
    if (!result.ok) return result.response;
    return HttpResponse.json(getSiteOwnerDashboard(result.access.tenantId));
  }),

  http.get("/api/stations", ({ request }) => {
    const result = authorize(request, "stationsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listStations(result.access.tenantId));
  }),

  http.get("/api/v1/stations", ({ request }) => {
    const result = authorize(request, "stationsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listStations(result.access.tenantId));
  }),

  http.get("/api/stations/:id", ({ params, request }) => {
    const result = authorize(request, "stationsRead");
    if (!result.ok) return result.response;

    const station = getStationById(String(params.id), result.access.tenantId);
    if (!station) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(station);
  }),

  http.get("/api/v1/stations/:id", ({ params, request }) => {
    const result = authorize(request, "stationsRead");
    if (!result.ok) return result.response;

    const station = getStationById(String(params.id), result.access.tenantId);
    if (!station) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(station);
  }),

  http.get("/api/swapping/stations", ({ request }) => {
    const result = authorize(request, "swapStationsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listSwapStations(result.access.tenantId));
  }),

  http.get("/api/swapping/stations/:id", ({ params, request }) => {
    const result = authorize(request, "swapStationsRead");
    if (!result.ok) return result.response;

    const station = getSwapStationById(
      String(params.id),
      result.access.tenantId,
    );
    if (!station)
      return HttpResponse.json(
        { message: "Swap station not found." },
        { status: 404 },
      );
    return HttpResponse.json(station);
  }),

  http.get("/api/charge-points", ({ request }) => {
    const result = authorize(request, "chargePointsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listChargePoints(result.access.tenantId));
  }),

  http.get("/api/charge-points/:id", ({ params, request }) => {
    const result = authorize(request, "chargePointsRead");
    if (!result.ok) return result.response;

    const chargePoint = getChargePointById(
      String(params.id),
      result.access.tenantId,
    );
    if (!chargePoint)
      return HttpResponse.json(
        { message: "Charge point not found." },
        { status: 404 },
      );
    return HttpResponse.json(chargePoint);
  }),

  http.post("/api/charge-points", async ({ request }) => {
    const result = authorize(request, "chargePointsWrite");
    if (!result.ok) return result.response;

    const assistedSessionId = request.headers.get("x-assisted-session-id");
    if (assistedSessionId) {
      const tenantExternalId = resolveAccessTenantExternalId(result.access);
      if (!tenantExternalId) {
        return HttpResponse.json(
          { message: "Unable to resolve tenant context for assisted session." },
          { status: 400 },
        );
      }

      const validation = validateAssistedScopedWrite(
        request.headers.get("authorization"),
        assistedSessionId,
        tenantExternalId,
        "CHARGE_POINT_SETUP",
      );

      if (!validation.ok) {
        return HttpResponse.json({ message: validation.message }, { status: validation.status });
      }
    }

    const payload =
      await readJsonBody<Parameters<typeof createChargePoint>[0]>(request);
    const chargePoint = createChargePoint(payload, result.access.tenantId);

    if (!chargePoint) {
      return HttpResponse.json(
        { message: "Station not found for active tenant." },
        { status: 400 },
      );
    }

    if (assistedSessionId) {
      const tenantExternalId = resolveAccessTenantExternalId(result.access);
      if (!tenantExternalId) {
        return HttpResponse.json(
          { message: "Unable to resolve tenant context for assisted session." },
          { status: 400 },
        );
      }

      const audit = recordAssistedScopedAction(
        request.headers.get("authorization"),
        assistedSessionId,
        tenantExternalId,
        "CHARGE_POINT_SETUP",
        {
          action: "CHARGE_POINT_CREATED",
          resourceType: "charge_point",
          resourceId: chargePoint.id,
          after: chargePoint as unknown as Record<string, unknown>,
        },
      );

      if (!audit.ok) {
        return HttpResponse.json({ message: audit.message }, { status: audit.status });
      }
    }

    return HttpResponse.json(chargePoint, { status: 201 });
  }),

  http.post(
    "/api/v1/charge-points/:id/commands/remote-start",
    async ({ params, request }) => {
      const result = authorize(request, "remoteCommandStart");
      if (!result.ok) return result.response;

      const chargePoint = getChargePointById(
        String(params.id),
        result.access.tenantId,
      );
      if (!chargePoint) {
        return HttpResponse.json(
          { message: "Charge point not found." },
          { status: 404 },
        );
      }

      const body = await readJsonBody<{
        idTag?: string;
        connectorId?: number;
        evseId?: number;
      }>(request);
      const idTag =
        typeof body.idTag === "string" && body.idTag.trim().length > 0
          ? body.idTag.trim()
          : "EVZONE_REMOTE";
      return HttpResponse.json({
        message: `Remote start command queued for ${chargePoint.ocppId} with ${idTag}.`,
        status: "Queued",
      });
    },
  ),

  http.post(
    "/api/v1/charge-points/:id/commands/soft-reset",
    async ({ params, request }) => {
      const result = authorize(request, "chargePointCommands");
      if (!result.ok) return result.response;

      const chargePoint = getChargePointById(
        String(params.id),
        result.access.tenantId,
      );
      if (!chargePoint) {
        return HttpResponse.json(
          { message: "Charge point not found." },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        message: `Soft reset command queued for ${chargePoint.ocppId}.`,
        status: "Queued",
      });
    },
  ),

  http.post("/api/v1/charge-points/:id/reboot", async ({ params, request }) => {
    const result = authorize(request, "chargePointCommands");
    if (!result.ok) return result.response;

    const chargePoint = getChargePointById(
      String(params.id),
      result.access.tenantId,
    );
    if (!chargePoint) {
      return HttpResponse.json(
        { message: "Charge point not found." },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      message: `Hard reboot command queued for ${chargePoint.ocppId}.`,
      status: "Queued",
    });
  }),

  http.post(
    "/api/v1/charge-points/:id/commands/unlock",
    async ({ params, request }) => {
      const result = authorize(request, "chargePointCommands");
      if (!result.ok) return result.response;

      const chargePoint = getChargePointById(
        String(params.id),
        result.access.tenantId,
      );
      if (!chargePoint) {
        return HttpResponse.json(
          { message: "Charge point not found." },
          { status: 404 },
        );
      }

      const body = await readJsonBody<{
        connectorId?: number;
        evseId?: number;
      }>(request);
      const connectorId =
        typeof body.connectorId === "number" ? body.connectorId : 1;
      return HttpResponse.json({
        message: `Unlock connector command queued for ${chargePoint.ocppId} on connector ${connectorId}.`,
        status: "Queued",
      });
    },
  ),

  http.post(
    "/api/v1/charge-points/:id/commands/update-firmware",
    async ({ params, request }) => {
      const result = authorize(request, "chargePointCommands");
      if (!result.ok) return result.response;

      const chargePoint = getChargePointById(
        String(params.id),
        result.access.tenantId,
      );
      if (!chargePoint) {
        return HttpResponse.json(
          { message: "Charge point not found." },
          { status: 404 },
        );
      }

      const body = await readJsonBody<{ location?: string }>(request);
      const location =
        typeof body.location === "string" && body.location.trim().length > 0
          ? body.location.trim()
          : "firmware.bin";
      return HttpResponse.json({
        message: `Firmware update command queued for ${chargePoint.ocppId} using ${location}.`,
        status: "Queued",
      });
    },
  ),

  http.post("/api/charge-points/:id/commands", async ({ params, request }) => {
    const result = authorize(request, "chargePointCommands");
    if (!result.ok) return result.response;

    const chargePoint = getChargePointById(
      String(params.id),
      result.access.tenantId,
    );
    if (!chargePoint)
      return HttpResponse.json(
        { message: "Charge point not found." },
        { status: 404 },
      );

    const { command } = (await request.json()) as { command: string };
    const scopeName =
      result.access.context.activeTenant?.name ??
      result.access.user.displayScopeName ??
      "Platform";

    return HttpResponse.json({
      message: `${command} command accepted for ${chargePoint.ocppId} in ${scopeName}.`,
      status: "Accepted",
    });
  }),

  http.post("/api/v1/sessions/:id/stop", async ({ params, request }) => {
    const result = authorize(request, "remoteCommandStart");
    if (!result.ok) return result.response;

    const stoppedSession = stopSessionById(
      String(params.id),
      result.access.tenantId,
    );
    if (!stoppedSession) {
      return HttpResponse.json(
        { message: "Session not found." },
        { status: 404 },
      );
    }

    const body = await readJsonBody<{ reason?: string }>(request);
    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : null;

    return HttpResponse.json({
      message: reason
        ? `Remote stop request accepted for session ${stoppedSession.id} with reason: ${reason}.`
        : `Remote stop request accepted for session ${stoppedSession.id}.`,
      status: "Completed",
      session: stoppedSession,
    });
  }),

  http.get("/api/sessions", ({ request }) => {
    const result = authorize(request, "sessionsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listSessions(result.access.tenantId));
  }),

  http.get("/api/swapping/sessions", ({ request }) => {
    const result = authorize(request, "swapSessionsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listBatterySwapSessions(result.access.tenantId));
  }),

  http.get("/api/swapping/inventory", ({ request }) => {
    const result = authorize(request, "batteryInventoryRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getBatteryInventory(result.access.tenantId));
  }),

  http.get("/api/swapping/rebalancing", ({ request }) => {
    const result = authorize(request, "swapStationsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getSwapRebalancing(result.access.tenantId));
  }),

  http.post(
    "/api/swapping/rebalancing/:id/action",
    async ({ params, request }) => {
      const result = authorize(request, "swapDispatchWrite");
      if (!result.ok) return result.response;

      const payload = (await request.json()) as Parameters<
        typeof applySwapDispatchAction
      >[1];
      const dispatch = applySwapDispatchAction(
        String(params.id),
        payload,
        result.access.tenantId,
      );

      if (!dispatch.ok) {
        return HttpResponse.json(
          { message: dispatch.message },
          { status: dispatch.notFound ? 404 : 400 },
        );
      }

      return HttpResponse.json({
        message: dispatch.message,
        dispatch: dispatch.dispatch,
      });
    },
  ),

  http.post(
    "/api/swapping/packs/:id/transition",
    async ({ params, request }) => {
      const result = authorize(request, "swapLifecycleWrite");
      if (!result.ok) return result.response;

      const payload = (await request.json()) as Parameters<
        typeof transitionSwapPack
      >[1];
      const transition = transitionSwapPack(
        String(params.id),
        payload,
        result.access.tenantId,
      );

      if (!transition.ok) {
        return HttpResponse.json(
          { message: transition.message },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        message: transition.message,
        pack: transition.pack,
      });
    },
  ),

  http.post(
    "/api/swapping/packs/:id/inspection",
    async ({ params, request }) => {
      const result = authorize(request, "swapLifecycleWrite");
      if (!result.ok) return result.response;

      const payload = (await request.json()) as Parameters<
        typeof inspectSwapPack
      >[1];
      const inspection = inspectSwapPack(
        String(params.id),
        payload,
        result.access.tenantId,
      );

      if (!inspection.ok) {
        return HttpResponse.json(
          { message: inspection.message },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        message: inspection.message,
        pack: inspection.pack,
      });
    },
  ),

  http.post(
    "/api/swapping/packs/:id/retirement",
    async ({ params, request }) => {
      const result = authorize(request, "swapLifecycleWrite");
      if (!result.ok) return result.response;

      const payload = (await request.json()) as Parameters<
        typeof applySwapPackRetirementDecision
      >[1];
      const retirement = applySwapPackRetirementDecision(
        String(params.id),
        payload,
        result.access.tenantId,
      );

      if (!retirement.ok) {
        return HttpResponse.json(
          { message: retirement.message },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        message: retirement.message,
        pack: retirement.pack,
      });
    },
  ),

  http.get("/api/incidents", ({ request }) => {
    const result = authorize(request, "incidentsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getIncidentCommand(result.access.tenantId));
  }),

  http.get("/api/alerts", ({ request }) => {
    const result = authorize(request, "alertsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listAlerts(result.access.tenantId));
  }),

  http.get("/api/tariffs", ({ request }) => {
    const result = authorize(request, "tariffsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listTariffs(result.access.tenantId));
  }),

  http.get("/api/v1/energy-management/groups", ({ request }) => {
    const result = authorize(request, "smartChargingRead");
    if (!result.ok) return result.response;
    const url = new URL(request.url);
    return HttpResponse.json(
      listEnergyManagementGroups(result.access.tenantId, {
        stationId: url.searchParams.get("stationId") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
      }),
    );
  }),

  http.get(
    "/api/v1/energy-management/stations/:stationId/live-status",
    ({ params, request }) => {
      const result = authorize(request, "smartChargingRead");
      if (!result.ok) return result.response;
      return HttpResponse.json(
        listEnergyStationLiveStatus(
          result.access.tenantId,
          String(params.stationId),
        ),
      );
    },
  ),

  http.get("/api/v1/energy-management/groups/:id", ({ params, request }) => {
    const result = authorize(request, "smartChargingRead");
    if (!result.ok) return result.response;
    const group = getEnergyManagementGroup(
      result.access.tenantId,
      String(params.id),
    );
    if (!group) {
      return HttpResponse.json(
        { message: "Energy group not found." },
        { status: 404 },
      );
    }
    return HttpResponse.json(group);
  }),

  http.get(
    "/api/v1/energy-management/groups/:id/history",
    ({ params, request }) => {
      const result = authorize(request, "smartChargingRead");
      if (!result.ok) return result.response;
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get("limit") ?? 25);
      return HttpResponse.json(
        getEnergyManagementHistory(
          result.access.tenantId,
          String(params.id),
          Number.isFinite(limit) ? limit : 25,
        ),
      );
    },
  ),

  http.post("/api/v1/energy-management/groups", async ({ request }) => {
    const result = authorize(request, "smartChargingWrite");
    if (!result.ok) return result.response;
    const body = await readJsonBody<Record<string, unknown>>(request);
    return HttpResponse.json(
      createEnergyManagementGroup(
        result.access.tenantId as never,
        body as never,
      ),
      { status: 201 },
    );
  }),

  http.patch(
    "/api/v1/energy-management/groups/:id",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<Record<string, unknown>>(request);
      const group = updateEnergyManagementGroup(
        result.access.tenantId as never,
        String(params.id),
        body,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.delete("/api/v1/energy-management/groups/:id", ({ params, request }) => {
    const result = authorize(request, "smartChargingWrite");
    if (!result.ok) return result.response;
    const group = deleteEnergyManagementGroup(
      result.access.tenantId as never,
      String(params.id),
    );
    if (!group) {
      return HttpResponse.json(
        { message: "Energy group not found." },
        { status: 404 },
      );
    }
    return HttpResponse.json(group);
  }),

  http.post(
    "/api/v1/energy-management/groups/:id/activate",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const group = activateEnergyManagementGroup(
        result.access.tenantId as never,
        String(params.id),
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/disable",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const group = disableEnergyManagementGroup(
        result.access.tenantId as never,
        String(params.id),
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.put(
    "/api/v1/energy-management/groups/:id/memberships",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<{
        memberships?: Array<Record<string, unknown>>;
      }>(request);
      const memberships = (body.memberships ?? []).map((membership, index) => ({
        chargePointId: String(membership.chargePointId ?? ""),
        enabled:
          typeof membership.enabled === "boolean"
            ? membership.enabled
            : undefined,
        priority:
          typeof membership.priority === "number"
            ? membership.priority
            : index + 1,
        smartChargingEnabled:
          typeof membership.smartChargingEnabled === "boolean"
            ? membership.smartChargingEnabled
            : undefined,
        maxAmps:
          typeof membership.maxAmps === "number" || membership.maxAmps === null
            ? membership.maxAmps
            : undefined,
      }));
      const group = replaceEnergyManagementMemberships(
        result.access.tenantId as never,
        String(params.id),
        memberships,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/telemetry",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<Record<string, unknown>>(request);
      const group = ingestEnergyManagementTelemetry(
        result.access.tenantId as never,
        String(params.id),
        body as never,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/recalculate",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<{
        dryRun?: boolean;
        trigger?: string;
        reason?: string;
      }>(request);
      const group = recalculateEnergyManagementGroup(
        result.access.tenantId as never,
        String(params.id),
        body ?? {},
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/stations/:stationId/recalculate",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<{ reason?: string }>(request);
      return HttpResponse.json(
        recalculateEnergyManagementStation(
          result.access.tenantId as never,
          String(params.stationId),
          body.reason ?? "MANUAL_RECALCULATE",
        ),
      );
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/overrides",
    async ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const body = await readJsonBody<{
        reason?: string;
        capAmps?: number;
        expiresAt?: string;
      }>(request);
      const group = createEnergyManagementOverride(
        result.access.tenantId as never,
        String(params.id),
        {
          reason:
            typeof body.reason === "string" ? body.reason : "Temporary cap",
          capAmps: Number(body.capAmps ?? 0),
          expiresAt:
            typeof body.expiresAt === "string"
              ? body.expiresAt
              : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        result.access.user.id,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/overrides/:overrideId/clear",
    ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const group = clearEnergyManagementOverride(
        result.access.tenantId as never,
        String(params.id),
        String(params.overrideId),
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/alerts/:alertId/acknowledge",
    ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const group = acknowledgeEnergyManagementAlert(
        result.access.tenantId as never,
        String(params.id),
        String(params.alertId),
        result.access.user.id,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.post(
    "/api/v1/energy-management/groups/:id/simulate-meter-loss",
    ({ params, request }) => {
      const result = authorize(request, "smartChargingWrite");
      if (!result.ok) return result.response;
      const group = simulateEnergyMeterLoss(
        result.access.tenantId as never,
        String(params.id),
        result.access.user.id,
      );
      if (!group) {
        return HttpResponse.json(
          { message: "Energy group not found." },
          { status: 404 },
        );
      }
      return HttpResponse.json(group);
    },
  ),

  http.get("/api/energy/smart-charging", ({ request }) => {
    const result = authorize(request, "smartChargingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getSmartCharging(result.access.tenantId));
  }),

  http.get("/api/energy/load-policies", ({ request }) => {
    const result = authorize(request, "loadPoliciesRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listLoadPolicies(result.access.tenantId));
  }),

  http.get("/api/roaming/partners", ({ request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listRoamingPartners(result.access.tenantId));
  }),

  http.get("/api/roaming/partners/observability", ({ request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(
      getRoamingPartnerObservability(result.access.tenantId),
    );
  }),

  http.get("/api/roaming/partners/:id/observability", ({ params, request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;

    const observability = getRoamingPartnerObservabilityDetail(
      String(params.id),
      result.access.tenantId,
    );
    if (!observability)
      return HttpResponse.json(
        { message: "Roaming partner observability not found." },
        { status: 404 },
      );
    return HttpResponse.json(observability);
  }),

  http.get("/api/roaming/sessions", ({ request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getRoamingSessions(result.access.tenantId));
  }),

  http.get("/api/roaming/cdrs", ({ request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getOCPICdrs(result.access.tenantId));
  }),

  http.get("/api/roaming/commands", ({ request }) => {
    const result = authorize(request, "roamingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getOCPICommands(result.access.tenantId));
  }),

  http.get("/api/finance/billing", ({ request }) => {
    const result = authorize(request, "billingRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getBilling(result.access.tenantId));
  }),

  http.get("/api/finance/payouts", ({ request }) => {
    const result = authorize(request, "payoutsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listPayouts(result.access.tenantId));
  }),

  http.get("/api/finance/settlement", ({ request }) => {
    const result = authorize(request, "settlementRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getSettlement(result.access.tenantId));
  }),

  http.get("/api/team", ({ request }) => {
    const result = authorize(request, "teamRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listTeamMembers(result.access.tenantId));
  }),

  http.get("/api/audit-logs", ({ request }) => {
    const result = authorize(request, "auditLogsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(listAuditLogs(result.access.tenantId));
  }),

  http.get("/api/reports", ({ request }) => {
    const result = authorize(request, "reportsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getReports(result.access.tenantId));
  }),

  http.get("/api/protocols", ({ request }) => {
    const result = authorize(request, "platformAdminRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getProtocolEngine(result.access.tenantId));
  }),

  http.get("/api/platform/integrations", ({ request }) => {
    const result = authorize(request, "platformAdminRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getIntegrationsModule(result.access.tenantId));
  }),

  http.get("/api/platform/webhooks", ({ request }) => {
    const result = authorize(request, "platformAdminRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getWebhooksModule(result.access.tenantId));
  }),

  http.get("/api/platform/notifications", ({ request }) => {
    const result = authorize(request, "notificationsRead");
    if (!result.ok) return result.response;
    return HttpResponse.json(getNotificationsModule(result.access.tenantId));
  }),

  http.post("/api/commands/start", async ({ request }) => {
    const result = authorize(request, "remoteCommandStart");
    if (!result.ok) return result.response;

    const { chargePointId } = (await request.json()) as {
      chargePointId: string;
    };

    return HttpResponse.json({
      status: "Accepted",
      sessionId: `ses-${Math.random().toString(36).slice(2, 9)}`,
      tenant:
        result.access.context.activeTenant?.name ??
        result.access.user.displayTenantName ??
        "Platform",
      chargePointId,
    });
  }),
  http.get("/api/swapping/packs/:id/telemetry", () => {
    // Generate mock cell voltages near 3.2V
    const generateCell = () => 3.2 + (Math.random() * 0.1 - 0.05);
    const cells = Array(16).fill(0).map(generateCell);

    // Create an artificial imbalance for visual demo purposes
    if (Math.random() > 0.5) {
      cells[5] = 2.85; // Low voltage
    } else {
      cells[10] = 3.68; // High voltage
    }

    return HttpResponse.json({
      voltage: cells.reduce((sum, c) => sum + c, 0),
      current: 12.5 + Math.random(),
      soc: 85 - Math.random() * 2,
      temps: [24.5 + Math.random(), 25.1 + Math.random()],
      cells,
    });
  }),

  http.post("/api/swapping/packs/:id/kill", () => {
    return HttpResponse.json({ message: "Kill command dispatched" });
  }),
];

resetDemoAuthSessions();
resetEnergyManagementFixtures();
