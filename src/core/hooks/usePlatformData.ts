import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/core/api/fetchJson";
import { useTenant } from "@/core/hooks/useTenant";
import type {
  AlertRecord,
  AuditLogRecord,
  BillingResponse,
  ChargePointPublicationResponse,
  ChargePointDetail,
  ChargePointSummary,
  ConfirmChargePointIdentityRequest,
  CreateChargePointRequest,
  DashboardOverviewResponse,
  DeveloperPlatformOverviewResponse,
  DemoUserHint,
  EnterpriseIamOverviewResponse,
  FleetOverviewResponse,
  IncidentCommandResponse,
  IntegrationModuleResponse,
  LoadPolicyRecord,
  NotificationsModuleResponse,
  OCPICdrsResponse,
  OCPICommandsResponse,
  RoamingPartnerObservabilityDetail,
  RoamingPartnerObservabilityResponse,
  PayoutRecord,
  PlatformFeatureFlagRecord,
  PlatformFeatureFlags,
  PncOverviewResponse,
  ProtocolEngineResponse,
  ReportsResponse,
  ReservationsResponse,
  RoamingPartnerRecord,
  RoamingSessionsResponse,
  SessionRecord,
  SettlementResponse,
  SiteOwnerDashboardResponse,
  SmartChargingResponse,
  TariffRecord,
  TeamMember,
  WebhooksModuleResponse,
} from "@/core/types/mockApi";

const FALLBACK_DEMO_USERS: DemoUserHint[] = [
  {
    id: "demo-super-admin",
    name: "Platform Admin",
    email: "admin@evzone.io",
    password: "admin",
    role: "SUPER_ADMIN",
  },
  {
    id: "demo-finance",
    name: "Finance Ops",
    email: "finance@evzone.io",
    password: "admin",
    role: "FINANCE",
  },
  {
    id: "demo-station-manager",
    name: "Station Manager",
    email: "manager@evzone.io",
    password: "admin",
    role: "STATION_MANAGER",
  },
];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asNullableRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCurrencyCode(value: unknown, fallback = "USD"): string {
  const normalized = asString(value, fallback).trim().toUpperCase();
  return normalized.length > 0 ? normalized : fallback;
}

function formatAmount(value: unknown, currencyCode: string): string {
  return `${currencyCode} ${asNumber(value, 0).toFixed(0)}`;
}

const DEFAULT_PLATFORM_FLAGS: PlatformFeatureFlags = {
  commerce_v1: true,
  fleet_v1: true,
  pnc_v1: true,
  enterprise_sso_v1: true,
};

function normalizeFeatureFlags(value: unknown): PlatformFeatureFlags {
  const records = asArray<PlatformFeatureFlagRecord>(value);
  const flags: PlatformFeatureFlags = { ...DEFAULT_PLATFORM_FLAGS };

  for (const record of records) {
    const key = asString(record.key, "");
    if (!key) continue;
    flags[key] = Boolean(record.isEnabled);
  }

  return flags;
}

const DEFAULT_REMOTE_COMMANDS: ChargePointDetail["remoteCommands"] = [
  "Remote Start Session",
  "Remote Stop Session",
  "Soft Reset",
  "Hard Reboot",
  "Unlock Connector",
  "Update Firmware",
];

function normalizeChargePointStatus(
  value: unknown,
): ChargePointSummary["status"] {
  const normalized = asString(value, "OFFLINE").toUpperCase();

  if (
    normalized === "ONLINE" ||
    normalized === "AVAILABLE" ||
    normalized === "ACTIVE" ||
    normalized === "CHARGING"
  ) {
    return "Online";
  }

  if (
    normalized === "DEGRADED" ||
    normalized === "FAULTED" ||
    normalized === "UNAVAILABLE"
  ) {
    return "Degraded";
  }

  return "Offline";
}

function formatHeartbeatLabel(value: unknown): string {
  const raw = asString(value, "");
  if (!raw) {
    return "No heartbeat";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString();
}

function normalizeChargePointSummary(
  value: unknown,
  fallbackIndex = 0,
): ChargePointSummary {
  const record = asRecord(value);
  const station = asRecord(record.station);
  const connectorType = asString(record.connectorType ?? record.type, "CCS2");
  const connectorTypes = asArray<unknown>(record.connectorTypes)
    .map((entry) => asString(entry))
    .filter((entry) => entry.length > 0);
  const status = normalizeChargePointStatus(record.status);
  const id = asString(
    record.id,
    asString(record.ocppId, `charge-point-${fallbackIndex + 1}`),
  );
  const ocppId = asString(record.ocppId, id);
  const lastHeartbeat = record.lastHeartbeatLabel ?? record.lastHeartbeat;

  return {
    id,
    stationId: asString(
      record.stationId,
      asString(station.id, "unknown-station"),
    ),
    stationName: asString(
      record.stationName ?? station.name,
      asString(record.stationId, "Unassigned Station"),
    ),
    model: asString(record.model, ocppId),
    manufacturer: asString(
      record.manufacturer ?? record.vendor,
      "Unknown Manufacturer",
    ),
    serialNumber: asString(record.serialNumber, ocppId),
    firmwareVersion: asString(record.firmwareVersion, "Unknown firmware"),
    connectorType,
    connectorTypes:
      connectorTypes.length > 0 ? connectorTypes : [connectorType],
    ocppId,
    ocppVersion: asString(record.ocppVersion, "1.6"),
    maxCapacityKw: asNumber(record.maxCapacityKw ?? record.power, 0),
    status,
    ocppStatus: asString(record.ocppStatus, status),
    roamingPublished: Boolean(record.roamingPublished),
    bootNotificationAt: asString(record.bootNotificationAt, "") || null,
    identityConfirmedAt: asString(record.identityConfirmedAt, "") || null,
    bootNotificationPayload: asNullableRecord(record.bootNotificationPayload),
    lastHeartbeatLabel: formatHeartbeatLabel(lastHeartbeat),
    stale:
      typeof record.stale === "boolean"
        ? record.stale
        : !asString(record.lastHeartbeat),
  };
}

function normalizeChargePointDetail(value: unknown): ChargePointDetail {
  const record = asRecord(value);
  const base = normalizeChargePointSummary(record);
  const unitHealth = asRecord(record.unitHealth);
  const ocppCredentialsRecord = asRecord(record.ocppCredentials);
  const remoteCommands = asArray<unknown>(record.remoteCommands)
    .map((entry) => asString(entry))
    .filter((entry) => entry.length > 0);

  return {
    ...base,
    ocppCredentials:
      Object.keys(ocppCredentialsRecord).length > 0
        ? {
            username: asString(ocppCredentialsRecord.username, ""),
            password: asString(ocppCredentialsRecord.password, ""),
            wsUrl: asString(ocppCredentialsRecord.wsUrl, ""),
            subprotocol: asString(ocppCredentialsRecord.subprotocol, ""),
            authProfile: asString(ocppCredentialsRecord.authProfile, "") as
              | "basic"
              | "mtls_bootstrap"
              | "mtls"
              | undefined,
            bootstrapExpiresAt: asString(
              ocppCredentialsRecord.bootstrapExpiresAt,
              "",
            ),
            requiresClientCertificate: Boolean(
              ocppCredentialsRecord.requiresClientCertificate,
            ),
            mtlsInstructions: asString(
              ocppCredentialsRecord.mtlsInstructions,
              "",
            ),
          }
        : undefined,
    remoteCommands:
      remoteCommands.length > 0 ? remoteCommands : DEFAULT_REMOTE_COMMANDS,
    unitHealth: {
      ocppConnection: asString(
        unitHealth.ocppConnection,
        base.status === "Online" ? "Connected" : "Disconnected",
      ),
      lastHeartbeat: asString(
        unitHealth.lastHeartbeat,
        base.lastHeartbeatLabel,
      ),
      errorCode: asString(
        unitHealth.errorCode,
        asString(record.errorCode, "None"),
      ),
    },
    smartChargingEnabled: Boolean(record.smartChargingEnabled),
  };
}

function toTimestamp(value: unknown): number {
  const parsed = Date.parse(asString(value, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDashboardIncidentSeverity(
  value: unknown,
): DashboardOverviewResponse["recentIncidents"][number]["severity"] {
  const normalized = asString(value, "LOW").toUpperCase();
  if (normalized === "CRITICAL" || normalized === "HIGH") {
    return "High";
  }
  if (normalized === "MEDIUM") {
    return "Medium";
  }
  return "Low";
}

function normalizeDashboardOverview(
  analyticsValue: unknown,
  sessionsValue: unknown,
  incidentsValue: unknown,
  defaultCurrencyCode: string,
): DashboardOverviewResponse {
  const analytics = asRecord(analyticsValue);
  const realtime = asRecord(analytics.realTime);
  const today = asRecord(analytics.today);
  const totalSessions = asNumber(analytics.totalSessions ?? today.sessions, 0);
  const totalEnergy = asNumber(
    analytics.totalEnergy ?? today.energyDelivered,
    0,
  );
  const revenue = asNumber(analytics.revenue ?? today.revenue, 0);
  const activeChargers = asNumber(
    analytics.activeChargers ?? realtime.onlineChargers,
    0,
  );
  const incidents24h = asNumber(analytics.incidents24h ?? today.incidents, 0);

  const kpis: DashboardOverviewResponse["kpis"] = [
    {
      id: "sessions",
      label: "Sessions Today",
      value: totalSessions.toLocaleString(),
      delta: "Today",
      trend: "up",
      iconKey: "activity",
    },
    {
      id: "energy",
      label: "Energy Delivered",
      value: `${totalEnergy.toFixed(1)} kWh`,
      delta: "Today",
      trend: "up",
      iconKey: "energy",
    },
    {
      id: "revenue",
      label: "Revenue",
      value: `${defaultCurrencyCode} ${Math.round(revenue).toLocaleString()}`,
      delta: "Today",
      trend: "up",
      iconKey: "revenue",
    },
    {
      id: "active-chargers",
      label: "Active Chargers",
      value: activeChargers.toLocaleString(),
      delta: "Live",
      trend: "up",
      iconKey: "charge-points",
    },
    {
      id: "incidents",
      label: "Incidents (24h)",
      value: incidents24h.toLocaleString(),
      delta: "24h",
      trend: incidents24h > 0 ? "down" : "up",
      iconKey: "incidents",
    },
  ];

  const recentSessions = normalizeSessionRecords(
    sessionsValue,
    defaultCurrencyCode,
  )
    .sort((a, b) => toTimestamp(b.started) - toTimestamp(a.started))
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      station: session.station,
      cp: session.cp,
      energy: session.energy,
      amount: session.amount,
      status: session.status,
      method: session.method,
    }));

  const recentIncidents = asArray<Record<string, unknown>>(incidentsValue)
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 5)
    .map((incident) => {
      const status: DashboardOverviewResponse["recentIncidents"][number]["status"] =
        asString(incident.status, "OPEN").toUpperCase() === "OPEN"
          ? "Open"
          : "Acknowledged";

      return {
        id: asString(incident.id, "N/A"),
        station: asString(
          asRecord(incident.station).name ?? incident.stationId,
          "Unknown Station",
        ),
        severity: mapDashboardIncidentSeverity(incident.severity),
        title: asString(incident.title ?? incident.description, "Incident"),
        status,
      };
    });

  return {
    kpis,
    recentIncidents,
    recentSessions,
  };
}

function normalizeSiteOwnerDashboard(
  value: unknown,
): SiteOwnerDashboardResponse {
  const record = asRecord(value);
  return {
    title: asString(record.title, "Site Owner Dashboard"),
    subtitle: asString(record.subtitle, "Backend analytics feed"),
    metrics: asArray<SiteOwnerDashboardResponse["metrics"][number]>(
      record.metrics,
    ),
    revenueData: asArray<SiteOwnerDashboardResponse["revenueData"][number]>(
      record.revenueData,
    ),
    topUnits: asArray<SiteOwnerDashboardResponse["topUnits"][number]>(
      record.topUnits,
    ),
    alerts: asArray<SiteOwnerDashboardResponse["alerts"][number]>(
      record.alerts,
    ),
    optimizationTip:
      (record.optimizationTip as SiteOwnerDashboardResponse["optimizationTip"]) ?? {
        title: "Optimization Insight",
        text: "No optimization hint available from backend yet.",
        cta: "Review station analytics",
      },
  };
}

function normalizeSessionRecords(
  value: unknown,
  defaultCurrencyCode: string,
): SessionRecord[] {
  return asArray<Record<string, unknown>>(value).map((session) => ({
    id: asString(session.id, "N/A"),
    stationId: asString(session.stationId, ""),
    station: asString(
      (session.station as Record<string, unknown>)?.name ?? session.stationId,
      "Unknown Station",
    ),
    cp: asString(session.ocppId, asString(session.chargePointId, "N/A")),
    chargePointId: asString(session.chargePointId, ""),
    started: asString(session.startTime ?? session.createdAt, "N/A"),
    ended: typeof session.endTime === "string" ? session.endTime : null,
    energy: `${asNumber(session.totalEnergy, 0).toFixed(1)} kWh`,
    amount: formatAmount(
      session.amount,
      normalizeCurrencyCode(session.currency, defaultCurrencyCode),
    ),
    status:
      asString(session.status, "COMPLETED").toUpperCase() === "ACTIVE"
        ? "Active"
        : asString(session.status, "COMPLETED").toUpperCase() === "FAILED"
          ? "Failed"
          : "Completed",
    emsp: asString(session.emsp, "Direct"),
    method: asString(session.authMethod, "App"),
    connectorType: asString(session.connectorType, "CCS2"),
  }));
}

function normalizeReservationStatus(
  value: unknown,
): ReservationsResponse["records"][number]["status"] {
  const normalized = asString(value, "PENDING").toUpperCase();
  if (normalized === "CONFIRMED") return "Confirmed";
  if (normalized === "CANCELLED") return "Cancelled";
  if (normalized === "NO_SHOW") return "No Show";
  if (normalized === "EXPIRED") return "Expired";
  return "Pending";
}

function normalizeReservations(value: unknown): ReservationsResponse {
  const records = asArray<Record<string, unknown>>(value).map((booking) => {
    const station = asRecord(booking.station);
    const commandStatusRaw = asString(booking.reservationCommandStatus, "");

    return {
      id: asString(booking.id, "N/A"),
      reservationId: Number.isFinite(Number(booking.reservationId))
        ? Number(booking.reservationId)
        : null,
      customer: asString(
        booking.customerNameSnapshot ?? asRecord(booking.user).name,
        "Unknown Customer",
      ),
      customerRef: asString(
        booking.customerRefSnapshot,
        asString(booking.userId, "N/A"),
      ),
      stationName: asString(
        station.name,
        asString(booking.stationId, "Unknown Station"),
      ),
      chargePointId: asString(booking.chargePointId, "N/A"),
      startAt: asString(booking.startTime, "N/A"),
      endAt: asString(booking.endTime, "N/A"),
      status: normalizeReservationStatus(booking.status),
      commandStatus: commandStatusRaw || "Unassigned",
      source: asString(booking.reservationSource, "LOCAL"),
    };
  });

  const pending = records.filter(
    (record) => record.status === "Pending",
  ).length;
  const confirmed = records.filter(
    (record) => record.status === "Confirmed",
  ).length;
  const cancelled = records.filter(
    (record) => record.status === "Cancelled",
  ).length;
  const exceptions = records.filter(
    (record) =>
      record.commandStatus === "Rejected" ||
      record.commandStatus === "Failed" ||
      record.commandStatus === "Timeout" ||
      record.commandStatus === "DispatchFailed",
  ).length;

  return {
    metrics: [
      {
        id: "pending",
        label: "Pending",
        value: pending.toString(),
        tone: "default",
      },
      {
        id: "confirmed",
        label: "Confirmed",
        value: confirmed.toString(),
        tone: "ok",
      },
      {
        id: "cancelled",
        label: "Cancelled",
        value: cancelled.toString(),
        tone: "warning",
      },
      {
        id: "exceptions",
        label: "Exceptions",
        value: exceptions.toString(),
        tone: exceptions > 0 ? "danger" : "default",
      },
    ],
    records,
    note: "Reservation lifecycle is synchronized with command dispatch and callback states.",
  };
}

function normalizeFleetOverview(
  value: unknown,
  currencyCode: string,
): FleetOverviewResponse {
  const record = asRecord(value);
  const stats = asRecord(record.stats);
  const accountsRaw = asArray<Record<string, unknown>>(record.accounts);
  const groupsRaw = asArray<Record<string, unknown>>(record.groups);
  const driversRaw = asArray<Record<string, unknown>>(record.drivers);

  const accounts = accountsRaw.map((account) => {
    const count = asRecord(account._count);
    return {
      id: asString(account.id, "N/A"),
      name: asString(account.name, "Unnamed Account"),
      status: asString(account.status, "ACTIVE"),
      currency: normalizeCurrencyCode(account.currency, currencyCode),
      driverGroups: asNumber(count.driverGroups, 0),
      drivers: asNumber(count.drivers, 0),
    };
  });

  const groups = groupsRaw.map((group) => {
    const count = asRecord(group._count);
    const fleetAccount = asRecord(group.fleetAccount);
    return {
      id: asString(group.id, "N/A"),
      accountName: asString(fleetAccount.name, "Unknown Account"),
      name: asString(group.name, "Unnamed Group"),
      status: asString(group.status, "ACTIVE"),
      tariffs: asArray<string>(group.tariffIds)
        .map((item) => asString(item))
        .filter(Boolean),
      locations: asArray<string>(group.locationIds)
        .map((item) => asString(item))
        .filter(Boolean),
      drivers: asNumber(count.drivers, 0),
      monthlySpendLimit: formatAmount(
        group.monthlySpendLimit,
        normalizeCurrencyCode(fleetAccount.currency, currencyCode),
      ),
    };
  });

  const drivers = driversRaw.map((driver) => {
    const fleetAccount = asRecord(driver.fleetAccount);
    const group = asRecord(driver.group);
    const tokens = asArray<Record<string, unknown>>(driver.tokens);
    const activeTokenCount = tokens.filter(
      (token) => asString(token.status).toUpperCase() === "ACTIVE",
    ).length;
    return {
      id: asString(driver.id, "N/A"),
      accountName: asString(fleetAccount.name, "Unknown Account"),
      groupName: asString(group.name, "Unassigned"),
      displayName: asString(driver.displayName, "Unknown Driver"),
      contact: asString(driver.email, asString(driver.phone, "N/A")),
      status: asString(driver.status, "ACTIVE"),
      tokenSummary: `${activeTokenCount}/${tokens.length} active`,
      monthlySpendLimit: formatAmount(
        driver.monthlySpendLimit,
        normalizeCurrencyCode(fleetAccount.currency, currencyCode),
      ),
    };
  });

  return {
    metrics: [
      {
        id: "accounts",
        label: "Accounts",
        value: asNumber(stats.accountCount, accounts.length).toString(),
        tone: "default",
      },
      {
        id: "groups",
        label: "Driver Groups",
        value: asNumber(stats.driverGroupCount, groups.length).toString(),
        tone: "default",
      },
      {
        id: "drivers",
        label: "Drivers",
        value: asNumber(stats.driverCount, drivers.length).toString(),
        tone: "ok",
      },
      {
        id: "active-tokens",
        label: "Active Tokens",
        value: asNumber(stats.activeTokenCount, 0).toString(),
        tone: "warning",
      },
    ],
    accounts,
    groups,
    drivers,
    note: "Fleet policies can be linked to tariff calendars and location scopes per driver group.",
  };
}

function normalizePncOverview(value: unknown): PncOverviewResponse {
  const record = asRecord(value);
  const metrics = asRecord(record.metrics);

  const normalizeCertificate = (certificate: Record<string, unknown>) => ({
    id: asString(certificate.id, "N/A"),
    certificateHash: asString(certificate.certificateHash, "N/A"),
    certificateType: asString(certificate.certificateType, "UNKNOWN"),
    status: asString(certificate.status, "UNKNOWN"),
    validFrom: asString(certificate.validFrom, "") || null,
    validTo: asString(certificate.validTo, "") || null,
    revokedAt: asString(certificate.revokedAt, "") || null,
    revocationReason: asString(certificate.revocationReason, "") || null,
    mappedChargePointIds: asArray<string>(certificate.mappedChargePointIds)
      .map((entry) => asString(entry))
      .filter((entry) => entry.length > 0),
  });

  const contracts = asArray<Record<string, unknown>>(record.contracts).map(
    (contract) => ({
      id: asString(contract.id, "N/A"),
      contractRef: asString(contract.contractRef, "N/A"),
      eMobilityAccountId: asString(contract.eMobilityAccountId, "") || null,
      providerPartyId: asString(contract.providerPartyId, "") || null,
      vehicleVin: asString(contract.vehicleVin, "") || null,
      status: asString(contract.status, "UNKNOWN"),
      certificates: asArray<Record<string, unknown>>(contract.certificates).map(
        (certificate) => normalizeCertificate(certificate),
      ),
    }),
  );

  const certificates = asArray<Record<string, unknown>>(
    record.certificates,
  ).map((certificate) => normalizeCertificate(certificate));

  const expiring = asNumber(metrics.expiringCertificates, 0);

  return {
    metrics: [
      {
        id: "contracts",
        label: "Contracts",
        value: asNumber(metrics.contractCount, contracts.length).toString(),
        tone: "default",
      },
      {
        id: "active-contracts",
        label: "Active",
        value: asNumber(metrics.activeContractCount, 0).toString(),
        tone: "ok",
      },
      {
        id: "certificates",
        label: "Certificates",
        value: asNumber(
          metrics.certificateCount,
          certificates.length,
        ).toString(),
        tone: "default",
      },
      {
        id: "active-certificates",
        label: "Active Certs",
        value: asNumber(metrics.activeCertificates, 0).toString(),
        tone: "ok",
      },
      {
        id: "expiring-30d",
        label: "Expiring 30d",
        value: expiring.toString(),
        tone: expiring > 0 ? "warning" : "ok",
      },
    ],
    contracts,
    certificates,
    note: asString(
      record.note,
      "Plug & Charge contracts and certificates are tenant-scoped.",
    ),
  };
}

function normalizeEnterpriseIamOverview(
  value: unknown,
): EnterpriseIamOverviewResponse {
  const record = asRecord(value);
  const metrics = asRecord(record.metrics);
  const providersRaw = asArray<Record<string, unknown>>(record.providers);
  const jobsRaw = asArray<Record<string, unknown>>(record.recentJobs);

  const providers = providersRaw.map((provider) => {
    const roleMappingsRaw = asRecord(provider.roleMappings);
    const roleMappings = Object.entries(roleMappingsRaw).reduce<
      Record<string, string[]>
    >((accumulator, [groupName, rawRoles]) => {
      const roles = Array.isArray(rawRoles)
        ? rawRoles
            .map((role) => asString(role))
            .filter((role) => role.length > 0)
        : [asString(rawRoles)].filter((role) => role.length > 0);
      if (roles.length > 0) {
        accumulator[groupName] = roles;
      }
      return accumulator;
    }, {});

    return {
      id: asString(provider.id, "N/A"),
      name: asString(provider.name, "Unnamed Provider"),
      protocol: asString(provider.protocol, "OIDC"),
      status: asString(provider.status, "UNKNOWN"),
      syncMode: asString(provider.syncMode, "MANUAL_IMPORT"),
      issuerUrl: asString(provider.issuerUrl, "") || null,
      metadataUrl:
        asString(provider.jwksUrl, "") ||
        asString(provider.samlMetadataUrl, "") ||
        null,
      roleMappings,
      lastSyncAt: asString(provider.lastSyncAt, "") || null,
    };
  });

  const syncJobs = jobsRaw.map((job) => {
    const provider = asRecord(job.provider);
    return {
      id: asString(job.id, "N/A"),
      providerId: asString(job.providerId, asString(provider.id, "N/A")),
      providerName: asString(provider.name, "Unknown Provider"),
      status: asString(job.status, "UNKNOWN"),
      trigger: asString(job.triggerType, "MANUAL_IMPORT"),
      requestedAt: asString(job.startedAt ?? job.createdAt, "N/A"),
      completedAt: asString(job.completedAt, "") || null,
      digest: asNullableRecord(job.summary),
    };
  });

  return {
    metrics: [
      {
        id: "providers",
        label: "Providers",
        value: asNumber(metrics.providerCount, providers.length).toString(),
        tone: "default",
      },
      {
        id: "active",
        label: "Active",
        value: asNumber(metrics.activeProviderCount, 0).toString(),
        tone: "ok",
      },
      {
        id: "sync-jobs",
        label: "Sync Jobs",
        value: asNumber(metrics.syncJobCount, syncJobs.length).toString(),
        tone: "default",
      },
      {
        id: "completed-24h",
        label: "Mapped Providers",
        value: asNumber(metrics.mappingCoverageCount, 0).toString(),
        tone: "warning",
      },
    ],
    providers,
    syncJobs,
    note: asString(
      record.note,
      "Enterprise IAM import jobs run in controlled review mode.",
    ),
  };
}

function normalizeDeveloperPlatformOverview(
  value: unknown,
): DeveloperPlatformOverviewResponse {
  const record = asRecord(value);
  const metrics = asRecord(record.metrics);
  const appsRaw = asArray<Record<string, unknown>>(record.apps);
  const usageRaw = asArray<Record<string, unknown>>(record.usage);

  const apps = appsRaw.map((app) => ({
    id: asString(app.id, "N/A"),
    name: asString(app.name, "Unnamed App"),
    slug: asString(app.slug, "unnamed-app"),
    status: asString(app.status, "UNKNOWN"),
    defaultRateLimitPerMin: asNumber(app.defaultRateLimitPerMin, 0),
    apiKeys: asArray<Record<string, unknown>>(app.apiKeys).map((key) => ({
      id: asString(key.id, "N/A"),
      appId: asString(key.appId, asString(app.id, "N/A")),
      name: asString(key.name, "Unnamed Key"),
      keyPrefix: asString(key.keyPrefix, "N/A"),
      scopes: asArray<string>(key.scopes)
        .map((scope) => asString(scope))
        .filter(Boolean),
      rateLimitPerMin: asNumber(key.rateLimitPerMin, 0),
      status: asString(key.status, "UNKNOWN"),
      lastUsedAt: asString(key.lastUsedAt, "") || null,
      revokedAt: asString(key.revokedAt, "") || null,
    })),
  }));

  const usage = usageRaw.map((entry) => ({
    windowStart: asString(entry.windowStart, "N/A"),
    route: asString(entry.route, "unknown"),
    method: asString(entry.method, "GET"),
    requestCount: asNumber(entry.requestCount, 0),
    deniedCount: asNumber(entry.deniedCount, 0),
  }));

  return {
    metrics: [
      {
        id: "apps",
        label: "Apps",
        value: asNumber(metrics.appCount, apps.length).toString(),
        tone: "default",
      },
      {
        id: "active-apps",
        label: "Active Apps",
        value: asNumber(metrics.activeAppCount, 0).toString(),
        tone: "ok",
      },
      {
        id: "keys",
        label: "API Keys",
        value: asNumber(metrics.keyCount, 0).toString(),
        tone: "default",
      },
      {
        id: "active-keys",
        label: "Active Keys",
        value: asNumber(metrics.activeKeyCount, 0).toString(),
        tone: "ok",
      },
      {
        id: "requests-24h",
        label: "Requests 24h",
        value: asNumber(metrics.requestsLast24h, 0).toString(),
        tone: "default",
      },
      {
        id: "denied-24h",
        label: "Denied 24h",
        value: asNumber(metrics.deniedLast24h, 0).toString(),
        tone: "warning",
      },
    ],
    apps,
    usage,
    onboarding: asRecord(record.onboarding),
    note: "Versioned API keys and usage analytics are available for partner onboarding.",
  };
}

function normalizeIncidentCommand(value: unknown): IncidentCommandResponse {
  const fromArray = asArray<Record<string, unknown>>(value);
  const sourceIncidents = Array.isArray(
    (value as Record<string, unknown>)?.incidents,
  )
    ? asArray<Record<string, unknown>>(
        (value as Record<string, unknown>).incidents,
      )
    : fromArray;

  const incidents: IncidentCommandResponse["incidents"] = sourceIncidents.map(
    (incident) => {
      const severity: IncidentCommandResponse["incidents"][number]["severity"] =
        asString(incident.severity, "LOW").toUpperCase() === "CRITICAL"
          ? "Critical"
          : asString(incident.severity, "LOW").toUpperCase() === "HIGH"
            ? "Major"
            : "Minor";

      const status: IncidentCommandResponse["incidents"][number]["status"] =
        asString(incident.status, "OPEN").toUpperCase() === "OPEN"
          ? "Open"
          : asString(incident.status, "OPEN").toUpperCase() === "DISPATCHED"
            ? "Dispatched"
            : asString(incident.status, "OPEN").toUpperCase() === "CLOSED"
              ? "Closed"
              : "Resolving";

      const mappedType: IncidentCommandResponse["incidents"][number]["type"] =
        asString(incident.type).toUpperCase().includes("COMM")
          ? "Communication Loss"
          : asString(incident.type).toUpperCase().includes("POWER")
            ? "Power Surge"
            : asString(incident.type).toUpperCase().includes("VAND")
              ? "Vandalism"
              : "Hardware Failure";

      return {
        id: asString(incident.id, "N/A"),
        type: mappedType,
        stationId: asString(incident.stationId, ""),
        stationName: asString(
          (incident.station as Record<string, unknown>)?.name,
          "Unknown Station",
        ),
        severity,
        status,
        reportedAt: asString(incident.createdAt, "N/A"),
        assignedTech: asString(incident.assignedTo, ""),
        situationAudit: asString(
          incident.description,
          "No additional audit details.",
        ),
        serviceLog: [
          {
            title: "Incident Logged",
            note: asString(incident.createdAt, "N/A"),
            active: true,
          },
          {
            title: "Awaiting Dispatch",
            note: "Technician assignment pending.",
            active: false,
          },
        ],
      };
    },
  );

  const openCount = incidents.filter(
    (incident) => incident.status !== "Closed",
  ).length;
  const dispatchedCount = incidents.filter(
    (incident) => incident.status === "Dispatched",
  ).length;

  return {
    incidents,
    stats: [
      {
        id: "open",
        label: "Open Tickets",
        value: openCount.toString(),
        tone: "danger",
      },
      { id: "response", label: "Avg Response", value: "N/A", tone: "default" },
      {
        id: "dispatched",
        label: "Dispatched",
        value: dispatchedCount.toString(),
        tone: "warning",
      },
      { id: "sla", label: "SLA", value: "N/A", tone: "ok" },
    ],
    predictiveAlert: {
      text: "Predictive incident analytics are not exposed by backend yet.",
      cta: "Review incident queue",
    },
  };
}

function normalizeAlerts(value: unknown): AlertRecord[] {
  const source = asArray<Record<string, unknown>>(value);
  return source.map((alert) => ({
    id: asString(alert.id, "N/A"),
    message: asString(alert.title ?? alert.description, "Alert"),
    station: asString(
      (alert.station as Record<string, unknown>)?.name,
      "Unknown Station",
    ),
    ts: asString(alert.createdAt, "N/A"),
    type:
      asString(alert.severity, "LOW").toUpperCase() === "CRITICAL"
        ? "Critical"
        : asString(alert.severity, "LOW").toUpperCase() === "HIGH"
          ? "Warning"
          : "Info",
    acked: asString(alert.status).toUpperCase() === "CLOSED",
  }));
}

function normalizeTeamMembers(value: unknown): TeamMember[] {
  return asArray<Record<string, unknown>>(value).map((member) => ({
    name: asString(member.name, asString(member.email, "Unknown User")),
    email: asString(member.email, "unknown@evzone.io"),
    role: asString(member.role, "STAFF"),
    lastSeen: asString(member.lastSeen ?? member.updatedAt, "N/A"),
    status:
      asString(member.status).toUpperCase() === "ACTIVE" ? "Active" : "Invited",
  }));
}

function normalizeAuditLogs(value: unknown): AuditLogRecord[] {
  return asArray<Record<string, unknown>>(value).map((log) => ({
    actor: asString(log.actor, "system"),
    action: asString(log.action, "UNKNOWN_ACTION"),
    target: asString(log.target ?? log.resource, "N/A"),
    ts: asString(log.ts ?? log.createdAt, "N/A"),
  }));
}

function normalizeBilling(
  value: unknown,
  defaultCurrencyCode: string,
): BillingResponse {
  const rows = asArray<Record<string, unknown>>(value);
  const invoices = rows.map((invoice) => {
    const normalizedStatus = asString(invoice.status, "ISSUED").toUpperCase();
    const status: BillingResponse["invoices"][number]["status"] =
      normalizedStatus === "PAID"
        ? "Paid"
        : normalizedStatus === "OVERDUE"
          ? "Overdue"
          : normalizedStatus === "DRAFT"
            ? "Draft"
            : "Issued";

    return {
      id: asString(invoice.id, "N/A"),
      customer: asString(invoice.customerName ?? invoice.customer, "N/A"),
      scope: asString(invoice.scope ?? invoice.settlementStatus, "General"),
      amount: formatAmount(
        invoice.amount,
        normalizeCurrencyCode(invoice.currency, defaultCurrencyCode),
      ),
      dueDate: asString(
        invoice.dueDate ?? invoice.issuedAt ?? invoice.createdAt,
        "N/A",
      ),
      status,
    };
  });

  const totalAmount = invoices.reduce((sum, invoice) => {
    const parsed = Number(
      (invoice.amount.split(" ").at(-1) || "0").replace(/,/g, ""),
    );
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  const issuedCount = invoices.filter(
    (invoice) => invoice.status === "Issued",
  ).length;
  const paidCount = invoices.filter(
    (invoice) => invoice.status === "Paid",
  ).length;
  const overdueCount = invoices.filter(
    (invoice) => invoice.status === "Overdue",
  ).length;
  const collectionRate =
    invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

  return {
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        value: `${defaultCurrencyCode} ${Math.round(totalAmount).toLocaleString()}`,
        tone: "default",
      },
      {
        id: "collection-rate",
        label: "Collection Rate",
        value: `${collectionRate}%`,
        tone: "ok",
      },
      {
        id: "outstanding",
        label: "Outstanding",
        value: `${issuedCount + overdueCount}`,
        tone: overdueCount > 0 ? "warning" : "default",
      },
      {
        id: "tax",
        label: "Tax",
        value: `${defaultCurrencyCode} 0`,
        tone: "default",
      },
    ],
    invoices,
    aging: [
      { label: "Current", value: `${paidCount}` },
      { label: "Issued", value: `${issuedCount}` },
      { label: "Overdue", value: `${overdueCount}` },
    ],
    note: "Billing data sourced from live backend invoices.",
    totalRevenueThisMonth: `${defaultCurrencyCode} ${Math.round(totalAmount).toLocaleString()}`,
  };
}

function normalizePayouts(
  value: unknown,
  defaultCurrencyCode: string,
): PayoutRecord[] {
  return asArray<Record<string, unknown>>(value).map((payout) => ({
    id: asString(payout.id, "N/A"),
    period: asString(payout.period ?? payout.startedAt, "N/A"),
    sessions: asNumber(payout.sessions, 0),
    amount: formatAmount(
      payout.amount,
      normalizeCurrencyCode(payout.currency, defaultCurrencyCode),
    ),
    fee: formatAmount(
      payout.fee,
      normalizeCurrencyCode(payout.currency, defaultCurrencyCode),
    ),
    net: formatAmount(
      payout.netAmount ?? payout.net ?? payout.amount,
      normalizeCurrencyCode(payout.currency, defaultCurrencyCode),
    ),
    status:
      asString(payout.status).toLowerCase() === "completed"
        ? "Completed"
        : "Processing",
  }));
}

function normalizeSettlement(
  value: unknown,
  defaultCurrencyCode: string,
): SettlementResponse {
  const rows = asArray<Record<string, unknown>>(value);
  const records = rows.map((entry) => {
    const normalizedStatus = asString(
      entry.status,
      "reconciling",
    ).toLowerCase();
    const status: SettlementResponse["records"][number]["status"] =
      normalizedStatus === "completed" || normalizedStatus === "settled"
        ? "Settled"
        : normalizedStatus === "ready"
          ? "Ready"
          : "Reconciling";

    return {
      id: asString(entry.id, "N/A"),
      partner: asString(entry.org ?? entry.partner ?? entry.region, "N/A"),
      period: asString(entry.startedAt ?? entry.period, "N/A"),
      netAmount: formatAmount(
        entry.amount,
        normalizeCurrencyCode(entry.currency, defaultCurrencyCode),
      ),
      status,
    };
  });

  const readyCount = records.filter(
    (record) => record.status === "Ready",
  ).length;
  const reconcilingCount = records.filter(
    (record) => record.status === "Reconciling",
  ).length;
  const settledCount = records.filter(
    (record) => record.status === "Settled",
  ).length;
  const exceptionCount = rows.filter(
    (entry) => asString(entry.status).toLowerCase() === "disputed",
  ).length;

  return {
    metrics: [
      {
        id: "ready",
        label: "Ready",
        value: readyCount.toString(),
        tone: "default",
      },
      {
        id: "reconciling",
        label: "Reconciling",
        value: reconcilingCount.toString(),
        tone: "warning",
      },
      {
        id: "settled",
        label: "Settled",
        value: settledCount.toString(),
        tone: "ok",
      },
      {
        id: "exceptions",
        label: "Exceptions",
        value: exceptionCount.toString(),
        tone: exceptionCount > 0 ? "danger" : "default",
      },
    ],
    records,
    exceptions: [],
    note: "Settlement records sourced from live backend settlement feed.",
  };
}

function normalizeSmartCharging(value: unknown): SmartChargingResponse {
  const record = asRecord(value);
  return {
    metrics: Array.isArray(record.metrics)
      ? asArray<SmartChargingResponse["metrics"][number]>(record.metrics)
      : [],
    distribution: Array.isArray(record.distribution)
      ? asArray<SmartChargingResponse["distribution"][number]>(
          record.distribution,
        )
      : [],
    loadProfile: Array.isArray(record.loadProfile)
      ? asArray<SmartChargingResponse["loadProfile"][number]>(
          record.loadProfile,
        )
      : [],
    activeCurtailments: asNumber(record.activeCurtailments, 0),
    optimizer: (record.optimizer as SmartChargingResponse["optimizer"]) ?? {
      selectedStrategy: "Balanced",
      strategies: ["Balanced"],
      forecastTime: "N/A",
      reductionPercent: 0,
      cta: "Optimizer controls unavailable",
    },
  };
}

function normalizeRoamingPartners(value: unknown): RoamingPartnerRecord[] {
  return asArray<Record<string, unknown>>(value).map((partner) => ({
    id: asString(partner.id, "N/A"),
    name: asString(partner.name, "Unknown Partner"),
    country: asString(partner.countryCode ?? partner.country, "N/A"),
    partyId: asString(partner.partyId, "N/A"),
    status:
      asString(partner.status).toUpperCase() === "ACTIVE"
        ? "Connected"
        : "Pending",
    type: asString(partner.role).toUpperCase() === "HUB" ? "HUB" : "EMSP",
    version: asString(partner.version, "N/A"),
    lastSync: asString(partner.lastSyncAt ?? partner.updatedAt, "N/A"),
  }));
}

function normalizeObservability(
  value: unknown,
): RoamingPartnerObservabilityResponse {
  const partners = normalizeRoamingPartners(value).map((partner) => ({
    id: partner.id,
    deliveryStatus: "Healthy" as const,
    successRate: "N/A",
    callbackFailures24h: 0,
    retryQueueDepth: 0,
    totalEvents24h: 0,
    eventCoverage: [],
    lastEventAt: partner.lastSync,
    lastPartnerActivity: partner.lastSync,
  }));

  return {
    metrics: [],
    note: "Partner observability stream not yet exposed by backend.",
    partners,
  };
}

function normalizeObservabilityDetail(
  value: unknown,
): RoamingPartnerObservabilityDetail {
  const record = asRecord(value);
  return {
    id: asString(record.id, "N/A"),
    deliveryStatus: "Healthy",
    successRate: "N/A",
    callbackFailures24h: 0,
    retryQueueDepth: 0,
    totalEvents24h: 0,
    eventCoverage: [],
    lastEventAt: asString(record.updatedAt, "N/A"),
    lastPartnerActivity: asString(record.updatedAt, "N/A"),
    callbacks: {
      avgLatency: "N/A",
      delivered24h: 0,
      failed24h: 0,
      lastDelivery: "N/A",
      lastHttpStatus: "N/A",
    },
    recentEvents: [],
    warnings: [],
  };
}

function normalizeRoamingSessions(): RoamingSessionsResponse {
  return {
    metrics: [],
    regionalReach: [],
    sessions: [],
    settlementAging: [],
  };
}

type HealthStatus = "Operational" | "Degraded" | "Down";

type HealthServiceSnapshot = {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  lastCheck: string;
  metadata: Record<string, unknown>;
};

function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeHealthStatus(value: unknown): HealthStatus {
  const normalized = asString(value, "").trim().toLowerCase();
  if (normalized === "operational" || normalized === "online" || normalized === "up") {
    return "Operational";
  }
  if (normalized === "down" || normalized === "offline") {
    return "Down";
  }
  return "Degraded";
}

function normalizeProtocolImplementationStage(
  value: unknown,
): ProtocolEngineResponse["implementationStage"] | null {
  const normalized = asString(value, "").trim().toLowerCase();

  if (normalized === "live") return "Live";
  if (normalized === "pilot") return "Pilot";
  if (
    normalized === "mock bench" ||
    normalized === "mock-bench" ||
    normalized === "mock_bench"
  ) {
    return "Mock Bench";
  }

  return null;
}

function parseHealthServices(record: Record<string, unknown>): HealthServiceSnapshot[] {
  return asArray<Record<string, unknown>>(record.services).map((service, index) => {
    return {
      name: asString(service.name, `Service ${index + 1}`),
      status: normalizeHealthStatus(service.status),
      responseTimeMs: asNumber(service.responseTime, 0),
      lastCheck: asString(service.lastCheck, "N/A"),
      metadata: asRecord(service.metadata),
    };
  });
}

function resolveOverallHealthStatus(
  record: Record<string, unknown>,
  services: HealthServiceSnapshot[],
): HealthStatus {
  const explicit = normalizeHealthStatus(record.status);
  if (asString(record.status).trim().length > 0) {
    return explicit;
  }

  if (services.length === 0) {
    return "Degraded";
  }

  const downCount = services.filter((service) => service.status === "Down").length;
  const degradedCount = services.filter((service) => service.status === "Degraded").length;

  if (downCount >= 2) return "Down";
  if (downCount > 0 || degradedCount > 0) return "Degraded";
  return "Operational";
}

function resolveProtocolImplementationStage(
  explicitStage: unknown,
  overallStatus: HealthStatus,
): ProtocolEngineResponse["implementationStage"] {
  const explicit = normalizeProtocolImplementationStage(explicitStage);
  if (explicit) {
    return explicit;
  }

  if (overallStatus === "Operational") return "Live";
  if (overallStatus === "Down") return "Mock Bench";
  return "Pilot";
}

function mapHealthToProtocolEndpointStatus(
  status: HealthStatus,
): ProtocolEngineResponse["endpoints"][number]["status"] {
  return status === "Operational" ? "Online" : "Warning";
}

function mapHealthToIntegrationStatus(
  status: HealthStatus,
): IntegrationModuleResponse["connections"][number]["status"] {
  if (status === "Operational") return "Connected";
  if (status === "Down") return "Pending";
  return "Degraded";
}

function mapServiceCategory(
  serviceName: string,
): IntegrationModuleResponse["connections"][number]["category"] {
  const normalized = serviceName.trim().toLowerCase();
  if (normalized.includes("payment")) return "Payments";
  if (
    normalized.includes("ocpi") ||
    normalized.includes("ocpp") ||
    normalized.includes("roaming")
  ) {
    return "Roaming";
  }
  if (normalized.includes("database") || normalized.includes("cache")) {
    return "ERP";
  }
  return "CRM";
}

function normalizeCdrStatus(
  value: unknown,
): OCPICdrsResponse["records"][number]["status"] {
  const normalized = asString(value, "").trim().toUpperCase();

  if (normalized === "RECEIVED") return "Received";
  if (normalized === "ACCEPTED") return "Accepted";
  if (normalized === "REJECTED") return "Rejected";
  if (normalized === "SETTLED" || normalized === "FINALIZED") return "Settled";
  if (normalized === "DISPUTED" || normalized === "VOIDED") return "Rejected";
  if (normalized === "PENDING") return "Received";
  return "Sent";
}

function normalizeCdrs(
  value: unknown,
  defaultCurrencyCode: string,
): OCPICdrsResponse {
  const record = asRecord(value);
  const sourceRecords = Array.isArray(record.items)
    ? asArray<Record<string, unknown>>(record.items)
    : Array.isArray(record.records)
      ? asArray<Record<string, unknown>>(record.records)
      : asArray<Record<string, unknown>>(value);

  const records = sourceRecords.map((cdr) => {
    const amount = asNumber(cdr.totalCost ?? cdr.amount ?? cdr.amt, 0);
    const partnerId = asString(cdr.partnerId ?? cdr.partner, "N/A");

    return {
      id: asString(cdr.id ?? cdr.cdrId ?? cdr.cdr, "N/A"),
      partnerId,
      emspName: asString(cdr.emspName ?? cdr.partnerName ?? cdr.partner, partnerId),
      partyId: asString(cdr.partyId ?? cdr.partner, "N/A"),
      sessionId: asString(cdr.sessionId ?? cdr.session, "N/A"),
      start: asString(cdr.startTime ?? cdr.start, "N/A"),
      end: asString(cdr.endTime ?? cdr.end, "N/A"),
      kwh: asNumber(cdr.kwh ?? cdr.totalEnergy, 0),
      totalCost: amount.toFixed(0),
      currency: normalizeCurrencyCode(cdr.currency ?? cdr.cur, defaultCurrencyCode),
      country: asString(cdr.country ?? cdr.countryCode, "N/A"),
      status: normalizeCdrStatus(cdr.status),
    };
  });

  const providedMetrics = asArray<OCPICdrsResponse["metrics"][number]>(record.metrics);
  const settledCount = records.filter((entry) => entry.status === "Settled").length;
  const rejectedCount = records.filter((entry) => entry.status === "Rejected").length;
  const totalCount = records.length;
  const awaitingCount = Math.max(0, totalCount - settledCount);
  const revenueTotal = records.reduce(
    (sum, entry) => sum + asNumber(entry.totalCost, 0),
    0,
  );
  const revenueCurrency = records[0]?.currency || defaultCurrencyCode;
  const errorRate = totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0;

  const metrics =
    providedMetrics.length > 0
      ? providedMetrics
      : [
          {
            id: "total" as const,
            label: "Total CDRs",
            value: totalCount.toString(),
            tone: "default" as const,
          },
          {
            id: "awaiting" as const,
            label: "Awaiting Settlement",
            value: awaitingCount.toString(),
            tone: awaitingCount > 0 ? ("warning" as const) : ("ok" as const),
          },
          {
            id: "revenue" as const,
            label: "Total Revenue",
            value: `${revenueCurrency} ${Math.round(revenueTotal)}`,
            tone: "default" as const,
          },
          {
            id: "error-rate" as const,
            label: "Error Rate",
            value: `${errorRate.toFixed(1)}%`,
            tone: rejectedCount > 0 ? ("warning" as const) : ("ok" as const),
          },
        ];

  const automationRecord = asRecord(record.automation);
  const hasRecords = records.length > 0;

  return {
    metrics,
    records,
    automation: {
      cta: asString(
        automationRecord.cta,
        hasRecords ? "Review Settlement Rules" : "View Sync Settings",
      ),
      text: asString(
        automationRecord.text,
        hasRecords
          ? "CDR settlement automation is active for current roaming traffic."
          : "No CDR settlements are currently queued in this tenant scope.",
      ),
    },
  };
}

function normalizeOcpiCommands(value: unknown): OCPICommandsResponse {
  const logs = asArray<Record<string, unknown>>(value).map((command) => ({
    id: asString(command.id, "N/A"),
    command: asString(command.commandType, "COMMAND"),
    partner: asString(command.partnerName, "N/A"),
    partnerId: asString(command.partnerId, "N/A"),
    time: asString(command.createdAt, "N/A"),
    status: "Accepted" as const,
    payload: JSON.stringify(command.payload ?? {}, null, 0),
  }));

  return {
    logs,
    partners: [],
  };
}

function normalizeReports(value: unknown): ReportsResponse {
  const record = asRecord(value);
  return {
    templates: Array.isArray(record.templates)
      ? asArray<ReportsResponse["templates"][number]>(record.templates)
      : [],
    periods: Array.isArray(record.periods)
      ? asArray<string>(record.periods)
      : [],
    recentExports: Array.isArray(record.recentExports)
      ? asArray<ReportsResponse["recentExports"][number]>(record.recentExports)
      : [],
    scheduledEmails: Array.isArray(record.scheduledEmails)
      ? asArray<ReportsResponse["scheduledEmails"][number]>(
          record.scheduledEmails,
        )
      : [],
  };
}

function normalizeProtocolEngine(value: unknown): ProtocolEngineResponse {
  const record = asRecord(value);
  const services = parseHealthServices(record);
  const overallStatus = resolveOverallHealthStatus(record, services);
  const implementationStage = resolveProtocolImplementationStage(
    record.implementationStage,
    overallStatus,
  );
  const liveServicesDeployed =
    typeof record.liveServicesDeployed === "boolean"
      ? record.liveServicesDeployed
      : implementationStage !== "Mock Bench";
  const supportedVersions = asArray<string>(record.supportedVersions).filter(
    (version) => asString(version).trim().length > 0,
  );
  const plannedVersions = asArray<string>(record.plannedVersions).filter(
    (version) => asString(version).trim().length > 0,
  );
  const providedEndpoints = asArray<ProtocolEngineResponse["endpoints"][number]>(
    record.endpoints,
  );
  const endpoints =
    providedEndpoints.length > 0
      ? providedEndpoints
      : services.map((service, index) => {
          const syntheticId = toKebabCase(service.name) || `service-${index + 1}`;
          return {
            module: service.name,
            status: mapHealthToProtocolEndpointStatus(service.status),
            url: asString(
              service.metadata.url ??
                service.metadata.endpoint ??
                service.metadata.healthUrl,
              `/health/${syntheticId}`,
            ),
          };
        });
  const providedHandshakeLogs = asArray<ProtocolEngineResponse["handshakeLogs"][number]>(
    record.handshakeLogs,
  );
  const handshakeLogs =
    providedHandshakeLogs.length > 0
      ? providedHandshakeLogs
      : services.length > 0
        ? [
            ...services.map((service) => ({
              level:
                service.status === "Operational"
                  ? ("success" as const)
                  : ("warning" as const),
              message: `${service.name} ${service.status.toLowerCase()} (${Math.round(service.responseTimeMs)} ms)`,
            })),
            {
              level: "accent" as const,
              message: `${services.filter((service) => service.status === "Operational").length}/${services.length} services operational`,
            },
          ]
        : [{ level: "info" as const, message: "No service checks reported." }];
  const uptime = asNumber(record.uptime, NaN);
  const defaultStatusNote = Number.isFinite(uptime)
    ? `${overallStatus} health across ${services.length} monitored services (${uptime.toFixed(2)}% uptime).`
    : `${overallStatus} health across ${services.length} monitored services.`;
  const degradedOrDownCount = services.filter(
    (service) => service.status !== "Operational",
  ).length;

  return {
    headline: asString(record.headline, `Protocol engine health: ${overallStatus}`),
    implementationStage,
    liveServicesDeployed,
    supportedVersions,
    plannedVersions,
    statusNote: asString(record.statusNote, defaultStatusNote),
    endpoints,
    handshakeLogs,
    complianceNote: asString(
      record.complianceNote,
      degradedOrDownCount > 0
        ? `${degradedOrDownCount} monitored services require compliance follow-up.`
        : "All monitored protocol services are currently within compliance thresholds.",
    ),
  };
}

function normalizeIntegrations(value: unknown): IntegrationModuleResponse {
  const record = asRecord(value);
  const services = parseHealthServices(record);
  const providedConnections = asArray<
    IntegrationModuleResponse["connections"][number]
  >(record.connections);
  const connections =
    providedConnections.length > 0
      ? providedConnections
      : services.map((service, index) => {
          const idFallback = toKebabCase(service.name) || `integration-${index + 1}`;
          const integrationId = asString(
            service.metadata.integrationId ?? service.metadata.id,
            idFallback,
          );
          return {
            id: integrationId,
            name: service.name,
            category: mapServiceCategory(service.name),
            authMode: asString(
              service.metadata.authMode ?? service.metadata.protocol,
              "Managed Credential",
            ),
            lastSync: service.lastCheck,
            latency: `${Math.round(service.responseTimeMs)} ms`,
            status: mapHealthToIntegrationStatus(service.status),
          };
        });
  const providedMetrics = asArray<IntegrationModuleResponse["metrics"][number]>(
    record.metrics,
  );
  const connectedCount = connections.filter(
    (connection) => connection.status === "Connected",
  ).length;
  const degradedCount = connections.filter(
    (connection) => connection.status === "Degraded",
  ).length;
  const pendingCount = connections.filter(
    (connection) => connection.status === "Pending",
  ).length;
  const coverage =
    connections.length > 0
      ? Math.round((connectedCount / connections.length) * 100)
      : 0;
  const metrics =
    providedMetrics.length > 0
      ? providedMetrics
      : [
          {
            id: "connected" as const,
            label: "Connected",
            value: connectedCount.toString(),
            tone: connectedCount > 0 ? ("ok" as const) : ("default" as const),
          },
          {
            id: "degraded" as const,
            label: "Degraded",
            value: degradedCount.toString(),
            tone: degradedCount > 0 ? ("warning" as const) : ("default" as const),
          },
          {
            id: "pending" as const,
            label: "Pending",
            value: pendingCount.toString(),
            tone: pendingCount > 0 ? ("warning" as const) : ("default" as const),
          },
          {
            id: "coverage" as const,
            label: "Coverage",
            value: `${coverage}%`,
            tone: coverage >= 80 ? ("ok" as const) : ("default" as const),
          },
        ];

  return {
    metrics,
    connections,
    note: asString(
      record.note,
      `Integration control-plane telemetry sourced from ${connections.length} monitored services.`,
    ),
  };
}

function normalizeWebhooks(value: unknown): WebhooksModuleResponse {
  const record = asRecord(value);
  const endpoints = Array.isArray(record.endpoints)
    ? asArray<WebhooksModuleResponse["endpoints"][number]>(record.endpoints)
    : asArray<Record<string, unknown>>(value).map((webhook) => ({
        id: asString(webhook.id, "N/A"),
        target: asString(webhook.url, "N/A"),
        eventGroup: asString(webhook.eventType, "General"),
        lastDelivery: asString(webhook.lastTriggeredAt, "N/A"),
        signingStatus: asString(webhook.signingStatus, "Unknown"),
        successRate: asString(webhook.successRate, "N/A"),
        status: "Healthy" as const,
      }));

  return {
    metrics: asArray<WebhooksModuleResponse["metrics"][number]>(record.metrics),
    endpoints,
    recentDeliveries: asArray<
      WebhooksModuleResponse["recentDeliveries"][number]
    >(record.recentDeliveries),
    note: asString(
      record.note,
      "Webhook diagnostics sourced from backend webhook registry.",
    ),
  };
}

function normalizeNotifications(value: unknown): NotificationsModuleResponse {
  const record = asRecord(value);
  return {
    metrics: asArray<NotificationsModuleResponse["metrics"][number]>(
      record.metrics,
    ),
    channels: asArray<NotificationsModuleResponse["channels"][number]>(
      record.channels,
    ),
    recentDispatches: asArray<
      NotificationsModuleResponse["recentDispatches"][number]
    >(record.recentDispatches),
    note: asString(
      record.note,
      "Notification channel analytics are not provided by backend yet.",
    ),
  };
}

function useTenantQueryContext(enabled = true) {
  const { activeScopeKey, isReady, activeTenant } = useTenant();

  return {
    enabled: enabled && isReady,
    currencyCode: normalizeCurrencyCode(activeTenant?.currency),
    scopeKey: activeScopeKey,
  };
}

function isAuthorizationFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("forbidden") ||
    message.includes("unauthorized") ||
    message.includes("status 401") ||
    message.includes("status 403") ||
    message.includes("session expired")
  );
}

export function useDemoUsers() {
  return useQuery<DemoUserHint[]>({
    queryKey: ["auth", "demo-users"],
    // Backend has no public demo-users endpoint; keep frontend login hints local.
    queryFn: async () => FALLBACK_DEMO_USERS,
  });
}

export function useDashboardOverview(options?: { enabled?: boolean }) {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext(
    options?.enabled ?? true,
  );

  return useQuery<DashboardOverviewResponse>({
    queryKey: ["dashboard", "overview", scopeKey],
    queryFn: async () => {
      const [analytics, sessions, incidents] = await Promise.all([
        fetchJson<unknown>("/api/v1/analytics/dashboard").catch((error) => {
          if (isAuthorizationFailure(error)) {
            return {};
          }

          throw error;
        }),
        fetchJson<unknown>("/api/v1/sessions/history/all").catch(() => []),
        fetchJson<unknown>("/api/v1/incidents").catch(() => []),
      ]);

      return normalizeDashboardOverview(
        analytics,
        sessions,
        incidents,
        currencyCode,
      );
    },
    enabled,
  });
}

export function useSiteOwnerDashboard(options?: { enabled?: boolean }) {
  const { enabled, scopeKey } = useTenantQueryContext(options?.enabled ?? true);

  return useQuery<SiteOwnerDashboardResponse>({
    queryKey: ["dashboard", "site-owner", scopeKey],
    queryFn: async () =>
      normalizeSiteOwnerDashboard(
        await fetchJson<unknown>("/api/v1/analytics/owner/dashboard"),
      ),
    enabled,
  });
}

export function useChargePoints() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<ChargePointSummary[]>({
    queryKey: ["charge-points", scopeKey],
    queryFn: async () => {
      const seen = new Set<string>();
      const records = asArray<unknown>(
        await fetchJson<unknown>("/api/v1/charge-points"),
      );

      return records.map((record, index) => {
        const normalized = normalizeChargePointSummary(record, index);
        let stableId = normalized.id || `charge-point-${index + 1}`;

        if (seen.has(stableId)) {
          stableId = `${stableId}-${index + 1}`;
        }
        seen.add(stableId);

        return { ...normalized, id: stableId };
      });
    },
    enabled,
  });
}

export function useChargePoint(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id);

  return useQuery<ChargePointDetail>({
    queryKey: ["charge-points", scopeKey, id],
    queryFn: async () =>
      normalizeChargePointDetail(
        await fetchJson<unknown>(`/api/v1/charge-points/${id}`),
      ),
    enabled,
  });
}

export function useCreateChargePoint() {
  const { scopeKey } = useTenantQueryContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChargePointRequest) =>
      fetchJson<unknown>("/api/v1/charge-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((value) => normalizeChargePointDetail(value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-points", scopeKey] });
      queryClient.invalidateQueries({ queryKey: ["stations", scopeKey] });
    },
  });
}

export function useConfirmChargePointIdentity(id?: string) {
  const { scopeKey } = useTenantQueryContext(!!id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmChargePointIdentityRequest) =>
      fetchJson<unknown>(`/api/v1/charge-points/${id}/identity/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((value) => normalizeChargePointDetail(value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-points", scopeKey] });
      queryClient.invalidateQueries({
        queryKey: ["charge-points", scopeKey, id],
      });
      queryClient.invalidateQueries({ queryKey: ["stations", scopeKey] });
    },
  });
}

export function useChargePointPublication(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id);

  return useQuery<ChargePointPublicationResponse>({
    queryKey: ["charge-points", scopeKey, id, "publication"],
    queryFn: async () =>
      fetchJson<ChargePointPublicationResponse>(
        `/api/v1/charge-points/${id}/publication`,
      ),
    enabled,
  });
}

export function useSetChargePointPublication(id?: string) {
  const { scopeKey } = useTenantQueryContext(!!id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (published: boolean) =>
      fetchJson<ChargePointPublicationResponse>(
        `/api/v1/charge-points/${id}/publication`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-points", scopeKey] });
      queryClient.invalidateQueries({
        queryKey: ["charge-points", scopeKey, id],
      });
      queryClient.invalidateQueries({
        queryKey: ["charge-points", scopeKey, id, "publication"],
      });
      queryClient.invalidateQueries({ queryKey: ["stations", scopeKey] });
    },
  });
}

export function useSessions() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<SessionRecord[]>({
    queryKey: ["sessions", scopeKey],
    queryFn: async () =>
      normalizeSessionRecords(
        await fetchJson<unknown>("/api/v1/sessions/history/all"),
        currencyCode,
      ),
    enabled,
  });
}

export function useReservations() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<ReservationsResponse>({
    queryKey: ["operations", "reservations", scopeKey],
    queryFn: async () =>
      normalizeReservations(await fetchJson<unknown>("/api/v1/bookings")),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useFleetOverview() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<FleetOverviewResponse>({
    queryKey: ["operations", "fleet", scopeKey],
    queryFn: async () =>
      normalizeFleetOverview(
        await fetchJson<unknown>("/api/v1/fleet/overview"),
        currencyCode,
      ),
    enabled,
    refetchInterval: 15_000,
  });
}

export function usePncOverview() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<PncOverviewResponse>({
    queryKey: ["platform", "pnc", scopeKey],
    queryFn: async () =>
      normalizePncOverview(await fetchJson<unknown>("/api/v1/pnc/overview")),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useEnterpriseIamOverview() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<EnterpriseIamOverviewResponse>({
    queryKey: ["platform", "enterprise-iam", scopeKey],
    queryFn: async () =>
      normalizeEnterpriseIamOverview(
        await fetchJson<unknown>("/api/v1/enterprise-iam/overview"),
      ),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useDeveloperPlatformOverview() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<DeveloperPlatformOverviewResponse>({
    queryKey: ["platform", "developer-platform", scopeKey],
    queryFn: async () =>
      normalizeDeveloperPlatformOverview(
        await fetchJson<unknown>("/api/v1/platform/developer/v1/overview"),
      ),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useReservationAction() {
  const { scopeKey } = useTenantQueryContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      reservationId: string;
      action:
        | "checkin"
        | "cancel"
        | "no-show"
        | "expire"
        | "dispatch-reserve"
        | "dispatch-cancel";
      reason?: string;
    }) =>
      fetchJson<unknown>(
        `/api/v1/bookings/${input.reservationId}/${input.action}`,
        {
          method: input.action === "cancel" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.reason ? { reason: input.reason } : {}),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["operations", "reservations", scopeKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["operations", "fleet", scopeKey],
      });
    },
  });
}

export function useIncidentCommand() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<IncidentCommandResponse>({
    queryKey: ["incidents", "command", scopeKey],
    queryFn: async () =>
      normalizeIncidentCommand(await fetchJson<unknown>("/api/v1/incidents")),
    enabled,
  });
}

export function useAlerts() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<AlertRecord[]>({
    queryKey: ["alerts", scopeKey],
    queryFn: async () =>
      normalizeAlerts(await fetchJson<unknown>("/api/v1/incidents")),
    enabled,
  });
}

export function useTariffs() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<TariffRecord[]>({
    queryKey: ["tariffs", scopeKey],
    queryFn: async () =>
      asArray<TariffRecord>(await fetchJson<unknown>("/api/v1/tariffs")),
    enabled,
  });
}

export function useSmartCharging() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<SmartChargingResponse>({
    queryKey: ["energy", "smart-charging", scopeKey],
    queryFn: async () =>
      normalizeSmartCharging(
        await fetchJson<unknown>("/api/v1/analytics/realtime"),
      ),
    enabled,
  });
}

export function useLoadPolicies() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<LoadPolicyRecord[]>({
    queryKey: ["energy", "load-policies", scopeKey],
    queryFn: async () =>
      asArray<LoadPolicyRecord>(
        await fetchJson<unknown>("/api/v1/analytics/usage"),
      ),
    enabled,
  });
}

export function useRoamingPartners() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<RoamingPartnerRecord[]>({
    queryKey: ["roaming", "partners", scopeKey],
    queryFn: async () =>
      normalizeRoamingPartners(
        await fetchJson<unknown>("/api/v1/ocpi/partners"),
      ),
    enabled,
  });
}

export function useRoamingPartnerObservability() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<RoamingPartnerObservabilityResponse>({
    queryKey: ["roaming", "partners", "observability", scopeKey],
    queryFn: async () =>
      normalizeObservability(await fetchJson<unknown>("/api/v1/ocpi/partners")),
    enabled,
  });
}

export function useRoamingPartnerObservabilityDetail(id?: string) {
  const { enabled, scopeKey } = useTenantQueryContext(!!id);

  return useQuery<RoamingPartnerObservabilityDetail>({
    queryKey: ["roaming", "partners", "observability", scopeKey, id],
    queryFn: async () =>
      normalizeObservabilityDetail(
        await fetchJson<unknown>(`/api/v1/ocpi/partners/${id}`),
      ),
    enabled,
  });
}

export function useRoamingSessions() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<RoamingSessionsResponse>({
    queryKey: ["roaming", "sessions", scopeKey],
    queryFn: async () => {
      await fetchJson<unknown>("/api/v1/ocpi/actions/roaming-sessions");
      return normalizeRoamingSessions();
    },
    enabled,
  });
}

export function useOCPICdrs() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<OCPICdrsResponse>({
    queryKey: ["roaming", "cdrs", scopeKey],
    queryFn: async () =>
      normalizeCdrs(
        await fetchJson<unknown>("/api/v1/ocpi/actions/roaming-cdrs"),
        currencyCode,
      ),
    enabled,
  });
}

export function useOCPICommands() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<OCPICommandsResponse>({
    queryKey: ["roaming", "commands", scopeKey],
    queryFn: async () =>
      normalizeOcpiCommands(await fetchJson<unknown>("/api/v1/commands")),
    enabled,
  });
}

export function usePlatformFeatureFlags() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<PlatformFeatureFlags>({
    queryKey: ["platform", "feature-flags", scopeKey],
    queryFn: async () =>
      normalizeFeatureFlags(
        await fetchJson<unknown>("/api/v1/feature-flags").catch(() => []),
      ),
    enabled,
  });
}

export function useBilling() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<BillingResponse>({
    queryKey: ["finance", "billing", scopeKey],
    queryFn: async () =>
      normalizeBilling(
        await fetchJson<unknown>("/api/v1/billing/invoices"),
        currencyCode,
      ),
    enabled,
  });
}

export function usePayouts() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<PayoutRecord[]>({
    queryKey: ["finance", "payouts", scopeKey],
    queryFn: async () =>
      normalizePayouts(
        await fetchJson<unknown>("/api/v1/finance/payments"),
        currencyCode,
      ),
    enabled,
  });
}

export function useSettlement() {
  const { currencyCode, enabled, scopeKey } = useTenantQueryContext();

  return useQuery<SettlementResponse>({
    queryKey: ["finance", "settlement", scopeKey],
    queryFn: async () =>
      normalizeSettlement(
        await fetchJson<unknown>("/api/v1/settlements"),
        currencyCode,
      ),
    enabled,
  });
}

export function useTeamMembers() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<TeamMember[]>({
    queryKey: ["team", scopeKey],
    queryFn: async () =>
      normalizeTeamMembers(await fetchJson<unknown>("/api/v1/users/team")),
    enabled,
  });
}

export function useAuditLogs() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<AuditLogRecord[]>({
    queryKey: ["audit-logs", scopeKey],
    queryFn: async () =>
      normalizeAuditLogs(await fetchJson<unknown>("/api/v1/audit-logs")),
    enabled,
  });
}

export function useReports() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<ReportsResponse>({
    queryKey: ["reports", scopeKey],
    queryFn: async () =>
      normalizeReports(await fetchJson<unknown>("/api/v1/analytics/usage")),
    enabled,
  });
}

export function useProtocolEngine() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<ProtocolEngineResponse>({
    queryKey: ["protocols", scopeKey],
    queryFn: async () =>
      normalizeProtocolEngine(
        await fetchJson<unknown>("/api/v1/analytics/system-health"),
      ),
    enabled,
  });
}

export function useIntegrationsModule() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<IntegrationModuleResponse>({
    queryKey: ["platform", "integrations", scopeKey],
    queryFn: async () =>
      normalizeIntegrations(
        await fetchJson<unknown>("/api/v1/analytics/system-health"),
      ),
    enabled,
  });
}

export function useWebhooksModule() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<WebhooksModuleResponse>({
    queryKey: ["platform", "webhooks", scopeKey],
    queryFn: async () =>
      normalizeWebhooks(await fetchJson<unknown>("/api/v1/webhooks")),
    enabled,
  });
}

export function useNotificationsModule() {
  const { enabled, scopeKey } = useTenantQueryContext();

  return useQuery<NotificationsModuleResponse>({
    queryKey: ["platform", "notifications", scopeKey],
    queryFn: async () =>
      normalizeNotifications(await fetchJson<unknown>("/api/v1/notifications")),
    enabled,
  });
}
