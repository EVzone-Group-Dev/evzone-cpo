import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/core/api/fetchJson";
import { useTenant } from "@/core/hooks/useTenant";
import type {
  SuperAdminDashboardResponse,
  SuperAdminRecentAlertRecord,
} from "@/core/types/mockApi";

interface PlatformTenantRecord {
  id: string;
  name: string;
  currency: string;
  stationCount: number;
  chargePointCount: number;
}

interface NormalizedStation {
  id: string;
  status: string;
  embeddedChargePoints: number;
}

interface NormalizedChargePoint {
  id: string;
  status: string;
}

interface NormalizedSession {
  id: string;
  startedAt: Date | null;
  amount: number;
  status: string;
}

interface NormalizedAlert extends SuperAdminRecentAlertRecord {
  tenantId: string;
}

interface TenantSnapshot {
  tenantId: string;
  tenantName: string;
  currency: string;
  tenantStationCount: number;
  tenantChargePointCount: number;
  stations: NormalizedStation[];
  chargePoints: NormalizedChargePoint[];
  sessions: NormalizedSession[];
  alerts: NormalizedAlert[];
  analytics: {
    activeChargers: number;
    activeSessionsToday: number;
    incidents24h: number;
    revenueToday: number;
  };
}

const DEFAULT_CURRENCY = "USD";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCurrencyAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function toDayKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

async function fetchWithFallback<T>(
  paths: readonly string[],
  init?: RequestInit,
): Promise<T | null> {
  for (const path of paths) {
    try {
      return await fetchJson<T>(path, init);
    } catch {
      // Try the next fallback endpoint.
    }
  }

  return null;
}

function normalizeTenantList(value: unknown): PlatformTenantRecord[] {
  const records = asArray<Record<string, unknown>>(value);
  return records
    .map((record, index) => {
      const id = asString(record.id ?? record.tenantId, `tenant-${index + 1}`);
      const name = asString(
        record.name ?? record.organizationName,
        `Tenant ${index + 1}`,
      );
      const currency = asString(
        record.currency ?? record.defaultCurrency,
        DEFAULT_CURRENCY,
      ).toUpperCase();
      const stationCount = asNumber(
        record.stationCount ?? asRecord(record._count).sites,
        0,
      );
      const chargePointCount = asNumber(
        record.chargePointCount ?? asRecord(record._count).chargePoints,
        0,
      );

      return { id, name, currency, stationCount, chargePointCount };
    })
    .filter((tenant) => tenant.id.length > 0);
}

async function fetchPlatformTenants(): Promise<PlatformTenantRecord[]> {
  const payload = await fetchWithFallback<unknown>([
    "/api/v1/platform/tenants",
    "/api/v1/tenants",
  ]);

  if (!payload) {
    return [];
  }

  return normalizeTenantList(payload);
}

function normalizeStationStatus(value: unknown): string {
  return asString(value, "offline").toUpperCase();
}

function normalizeChargePointStatus(value: unknown): string {
  return asString(value, "offline").toUpperCase();
}

function normalizeStations(value: unknown): NormalizedStation[] {
  return asArray<Record<string, unknown>>(value).map((record, index) => {
    const chargePoints = asArray<unknown>(record.chargePoints);
    return {
      id: asString(record.id, `station-${index + 1}`),
      status: normalizeStationStatus(record.status ?? record.operationalStatus),
      embeddedChargePoints: chargePoints.length,
    };
  });
}

function normalizeChargePoints(value: unknown): NormalizedChargePoint[] {
  return asArray<Record<string, unknown>>(value).map((record, index) => ({
    id: asString(record.id ?? record.ocppId, `cp-${index + 1}`),
    status: normalizeChargePointStatus(record.status ?? record.ocppStatus),
  }));
}

function normalizeSessions(value: unknown): NormalizedSession[] {
  return asArray<Record<string, unknown>>(value).map((record, index) => {
    const startedAt = parseDate(
      record.started ?? record.startTime ?? record.start ?? record.createdAt,
    );
    return {
      id: asString(record.id, `session-${index + 1}`),
      startedAt,
      amount: parseCurrencyAmount(record.amount ?? record.totalCost),
      status: asString(record.status, "unknown").toUpperCase(),
    };
  });
}

function normalizeAnalytics(value: unknown) {
  const record = asRecord(value);
  const today = asRecord(record.today);
  const realtime = asRecord(record.realTime);

  // Supports both /api/v1/analytics/dashboard shape and legacy /api/dashboard/overview KPI shape.
  const fallbackKpis = asArray<Record<string, unknown>>(record.kpis);
  const fallbackRevenue = fallbackKpis.find((kpi) =>
    asString(kpi.label).toLowerCase().includes("revenue"),
  );
  const fallbackSessions = fallbackKpis.find((kpi) =>
    asString(kpi.label).toLowerCase().includes("session"),
  );
  const fallbackChargers = fallbackKpis.find((kpi) =>
    asString(kpi.label).toLowerCase().includes("charger"),
  );
  const fallbackIncidents = fallbackKpis.find((kpi) =>
    asString(kpi.label).toLowerCase().includes("incident"),
  );

  return {
    activeSessionsToday: asNumber(
      today.sessions ?? record.totalSessions ?? fallbackSessions?.value,
      0,
    ),
    revenueToday: parseCurrencyAmount(
      today.revenue ?? record.revenue ?? fallbackRevenue?.value,
    ),
    activeChargers: asNumber(
      realtime.onlineChargers ?? record.activeChargers ?? fallbackChargers?.value,
      0,
    ),
    incidents24h: asNumber(
      today.incidents ?? record.incidents24h ?? fallbackIncidents?.value,
      0,
    ),
  };
}

function normalizeAlertSeverity(value: unknown): "Critical" | "Warning" | "Info" {
  const normalized = asString(value, "info").toUpperCase();
  if (normalized.includes("CRITICAL") || normalized.includes("HIGH")) {
    return "Critical";
  }
  if (normalized.includes("WARN") || normalized.includes("MEDIUM") || normalized.includes("MAJOR")) {
    return "Warning";
  }
  return "Info";
}

function normalizeAlertStatus(value: unknown, ackedValue?: unknown): "Open" | "Acknowledged" | "Closed" {
  if (ackedValue === true) {
    return "Acknowledged";
  }

  const normalized = asString(value, "OPEN").toUpperCase();
  if (normalized.includes("CLOSED") || normalized.includes("RESOLVED")) {
    return "Closed";
  }
  if (normalized.includes("ACK")) {
    return "Acknowledged";
  }
  return "Open";
}

function normalizeAlertTimeLabel(value: unknown): { timestamp: number; label: string } {
  const parsed = parseDate(value);
  if (!parsed) {
    const label = asString(value, "No timestamp");
    return { timestamp: 0, label };
  }

  return {
    timestamp: parsed.getTime(),
    label: parsed.toLocaleString(),
  };
}

function normalizeAlerts(
  alertsValue: unknown,
  incidentsValue: unknown,
  tenant: PlatformTenantRecord,
): NormalizedAlert[] {
  const directAlerts = asArray<Record<string, unknown>>(alertsValue).map(
    (record, index) => {
      const time = normalizeAlertTimeLabel(
        record.ts ?? record.createdAt ?? record.reportedAt,
      );

      return {
        id: asString(record.id, `${tenant.id}-alert-${index + 1}`),
        tenantId: tenant.id,
        tenantName: tenant.name,
        stationName: asString(
          record.station ?? record.stationName,
          "Unassigned Station",
        ),
        severity: normalizeAlertSeverity(record.type ?? record.severity),
        message: asString(
          record.message ?? record.title ?? record.situationAudit,
          "Alert",
        ),
        status: normalizeAlertStatus(record.status, record.acked),
        timeLabel: time.label,
        timestamp: time.timestamp,
      } as NormalizedAlert;
    },
  );

  const incidentRecords = Array.isArray(incidentsValue)
    ? asArray<Record<string, unknown>>(incidentsValue)
    : asArray<Record<string, unknown>>(asRecord(incidentsValue).incidents);

  const incidentAlerts = incidentRecords.map((record, index) => {
    const time = normalizeAlertTimeLabel(
      record.createdAt ?? record.reportedAt ?? record.ts,
    );

    return {
      id: asString(record.id, `${tenant.id}-incident-${index + 1}`),
      tenantId: tenant.id,
      tenantName: tenant.name,
      stationName: asString(
        record.stationName ?? record.station ?? record.stationId,
        "Unassigned Station",
      ),
      severity: normalizeAlertSeverity(record.severity),
      message: asString(
        record.title ?? record.message ?? record.situationAudit ?? record.type,
        "Incident",
      ),
      status: normalizeAlertStatus(record.status),
      timeLabel: time.label,
      timestamp: time.timestamp,
    } as NormalizedAlert;
  });

  return [...directAlerts, ...incidentAlerts];
}

function mapUtilizationBucket(status: string): "in-use" | "available" | "offline" {
  const normalized = status.toUpperCase();
  if (
    normalized.includes("CHARGING") ||
    normalized.includes("IN_USE") ||
    normalized.includes("ACTIVE") ||
    normalized.includes("OCCUPIED")
  ) {
    return "in-use";
  }

  if (normalized.includes("ONLINE") || normalized.includes("AVAILABLE") || normalized.includes("READY")) {
    return "available";
  }

  return "offline";
}

function isActiveStationStatus(status: string) {
  const normalized = status.toUpperCase();
  return (
    normalized.includes("ONLINE") ||
    normalized.includes("ACTIVE") ||
    normalized.includes("AVAILABLE") ||
    normalized.includes("DEGRADED")
  );
}

function isActiveSessionStatus(status: string) {
  return status.includes("ACTIVE") || status.includes("CHARGING");
}

function resolveReportingMonthKey(
  sessions: NormalizedSession[],
  referenceDate: Date,
): string | null {
  const referenceKey = toMonthKey(referenceDate);
  const datedSessions = sessions.filter((session) => session.startedAt);

  if (datedSessions.some((session) => toMonthKey(session.startedAt as Date) === referenceKey)) {
    return referenceKey;
  }

  if (datedSessions.length === 0) {
    return null;
  }

  const latest = datedSessions.reduce((max, session) =>
    (session.startedAt as Date).getTime() > max.getTime()
      ? (session.startedAt as Date)
      : max,
  datedSessions[0].startedAt as Date);

  return toMonthKey(latest);
}

function buildEmptyModel(): SuperAdminDashboardResponse {
  return {
    kpis: [
      {
        id: "total-tenants",
        label: "Total Tenants",
        value: "0",
        delta: "Platform-wide",
        trend: "neutral",
      },
      {
        id: "active-stations",
        label: "Active Stations",
        value: "0",
        delta: "Live",
        trend: "neutral",
      },
      {
        id: "total-chargers",
        label: "Total Chargers",
        value: "0",
        delta: "Provisioned",
        trend: "neutral",
      },
      {
        id: "active-sessions-today",
        label: "Active Sessions Today",
        value: "0",
        delta: "Today",
        trend: "neutral",
      },
      {
        id: "revenue-mtd",
        label: "Revenue (MTD)",
        value: formatCurrency(0, DEFAULT_CURRENCY),
        delta: "MTD",
        trend: "neutral",
      },
      {
        id: "open-alerts",
        label: "Open Alerts",
        value: "0",
        delta: "Needs attention",
        trend: "neutral",
      },
    ],
    networkGrowthSeries: [],
    tenantRevenueSeries: [],
    utilizationBreakdown: [
      { id: "in-use", label: "In Use", value: 0, percentage: 0 },
      { id: "available", label: "Available", value: 0, percentage: 0 },
      { id: "offline", label: "Offline", value: 0, percentage: 0 },
    ],
    topTenants: [],
    recentAlerts: [],
  };
}

function buildNetworkGrowthSeries(
  sessions: NormalizedSession[],
  referenceDate: Date,
) {
  const datedSessions = sessions.filter((session) => session.startedAt);
  const anchorDate =
    datedSessions.some(
      (session) =>
        (referenceDate.getTime() - (session.startedAt as Date).getTime()) /
          (1000 * 60 * 60 * 24) <=
        29,
    ) || datedSessions.length === 0
      ? referenceDate
      : datedSessions.reduce((max, session) =>
          (session.startedAt as Date).getTime() > max.getTime()
            ? (session.startedAt as Date)
            : max,
        datedSessions[0].startedAt as Date);

  const start = startOfDay(anchorDate);
  start.setDate(start.getDate() - 29);

  const counts = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    counts.set(toDayKey(day), 0);
  }

  for (const session of datedSessions) {
    const dayKey = toDayKey(startOfDay(session.startedAt as Date));
    if (counts.has(dayKey)) {
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([key, value]) => {
    const day = new Date(`${key}T00:00:00`);
    return {
      label: day.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      sessions: value,
    };
  });
}

function resolveChargePoints(snapshot: TenantSnapshot) {
  if (snapshot.chargePoints.length > 0) {
    return snapshot.chargePoints;
  }

  const derived: NormalizedChargePoint[] = [];
  snapshot.stations.forEach((station, stationIndex) => {
    for (let i = 0; i < station.embeddedChargePoints; i += 1) {
      derived.push({
        id: `${snapshot.tenantId}-${station.id}-embedded-${stationIndex}-${i + 1}`,
        status: station.status,
      });
    }
  });

  if (derived.length === 0 && snapshot.tenantChargePointCount > 0) {
    const active = Math.min(
      snapshot.tenantChargePointCount,
      Math.max(snapshot.analytics.activeChargers, snapshot.analytics.activeSessionsToday),
    );
    const available = Math.max(
      0,
      snapshot.tenantChargePointCount - active,
    );

    for (let i = 0; i < active; i += 1) {
      derived.push({
        id: `${snapshot.tenantId}-synthetic-active-${i + 1}`,
        status: "ACTIVE",
      });
    }
    for (let i = 0; i < available; i += 1) {
      derived.push({
        id: `${snapshot.tenantId}-synthetic-available-${i + 1}`,
        status: "AVAILABLE",
      });
    }
  }

  return derived;
}

function buildSuperAdminDashboardModel(
  snapshots: TenantSnapshot[],
  referenceDate: Date,
): SuperAdminDashboardResponse {
  const model = buildEmptyModel();
  if (snapshots.length === 0) {
    return model;
  }

  const allSessions = snapshots.flatMap((snapshot) => snapshot.sessions);
  const allAlerts = snapshots.flatMap((snapshot) => snapshot.alerts);
  const allChargePoints = snapshots.flatMap((snapshot) => resolveChargePoints(snapshot));
  const stationRows = snapshots.flatMap((snapshot) =>
    snapshot.stations.map((station) => ({
      ...station,
      uniqueId: `${snapshot.tenantId}:${station.id}`,
    })),
  );

  const reportingMonthKey = resolveReportingMonthKey(allSessions, referenceDate);
  const sessionsForRevenue =
    reportingMonthKey === null
      ? allSessions
      : allSessions.filter(
          (session) =>
            session.startedAt && toMonthKey(session.startedAt) === reportingMonthKey,
        );

  const totalRevenue =
    sessionsForRevenue.length > 0
      ? sessionsForRevenue.reduce((sum, session) => sum + session.amount, 0)
      : allSessions.length > 0
        ? allSessions.reduce((sum, session) => sum + session.amount, 0)
        : snapshots.reduce((sum, snapshot) => sum + snapshot.analytics.revenueToday, 0);

  const openAlerts = allAlerts.length > 0
    ? allAlerts.filter((alert) => alert.status !== "Closed").length
    : snapshots.reduce((sum, snapshot) => sum + snapshot.analytics.incidents24h, 0);
  const activeSessionsToday = allSessions.filter((session) => {
    if (isActiveSessionStatus(session.status)) {
      return true;
    }
    if (!session.startedAt) {
      return false;
    }
    return (
      startOfDay(session.startedAt).getTime() ===
      startOfDay(referenceDate).getTime()
    );
  }).length || snapshots.reduce(
    (sum, snapshot) => sum + snapshot.analytics.activeSessionsToday,
    0,
  );

  const uniqueStationCount = stationRows.length > 0
    ? new Set(stationRows.map((station) => station.uniqueId)).size
    : snapshots.reduce((sum, snapshot) => sum + snapshot.tenantStationCount, 0);

  const activeStations = stationRows.length > 0
    ? stationRows.filter((station) => isActiveStationStatus(station.status)).length
    : uniqueStationCount;

  const uniqueChargePointCount = allChargePoints.length;

  const revenueCurrency = snapshots[0]?.currency ?? DEFAULT_CURRENCY;
  model.kpis = [
    {
      id: "total-tenants",
      label: "Total Tenants",
      value: formatNumber(snapshots.length),
      delta: "Platform-wide",
      trend: "up",
    },
    {
      id: "active-stations",
      label: "Active Stations",
      value: formatNumber(activeStations),
      delta: "Live",
      trend: activeStations > 0 ? "up" : "neutral",
    },
    {
      id: "total-chargers",
      label: "Total Chargers",
      value: formatNumber(uniqueChargePointCount),
      delta: "Provisioned",
      trend: uniqueChargePointCount > 0 ? "up" : "neutral",
    },
    {
      id: "active-sessions-today",
      label: "Active Sessions Today",
      value: formatNumber(activeSessionsToday),
      delta: "Today",
      trend: activeSessionsToday > 0 ? "up" : "neutral",
    },
    {
      id: "revenue-mtd",
      label: "Revenue (MTD)",
      value: formatCurrency(totalRevenue, revenueCurrency),
      delta: "MTD",
      trend: totalRevenue > 0 ? "up" : "neutral",
    },
    {
      id: "open-alerts",
      label: "Open Alerts",
      value: formatNumber(openAlerts),
      delta: "Needs attention",
      trend: openAlerts > 0 ? "down" : "up",
    },
  ];

  model.networkGrowthSeries = buildNetworkGrowthSeries(allSessions, referenceDate);

  const utilizationTotals = {
    "in-use": 0,
    available: 0,
    offline: 0,
  };
  allChargePoints.forEach((chargePoint) => {
    const bucket = mapUtilizationBucket(chargePoint.status);
    utilizationTotals[bucket] += 1;
  });
  const totalUtilization = Math.max(
    1,
    utilizationTotals["in-use"] + utilizationTotals.available + utilizationTotals.offline,
  );
  model.utilizationBreakdown = [
    {
      id: "in-use",
      label: "In Use",
      value: utilizationTotals["in-use"],
      percentage: Math.round((utilizationTotals["in-use"] / totalUtilization) * 100),
    },
    {
      id: "available",
      label: "Available",
      value: utilizationTotals.available,
      percentage: Math.round((utilizationTotals.available / totalUtilization) * 100),
    },
    {
      id: "offline",
      label: "Offline",
      value: utilizationTotals.offline,
      percentage: Math.round((utilizationTotals.offline / totalUtilization) * 100),
    },
  ];

  const topTenants = snapshots
    .map((snapshot) => {
      const snapshotChargePoints = resolveChargePoints(snapshot);
      const snapshotOpenAlerts = snapshot.alerts.filter(
        (alert) => alert.status !== "Closed",
      ).length;
      const snapshotSessions =
        reportingMonthKey === null
          ? snapshot.sessions
          : snapshot.sessions.filter(
              (session) =>
                session.startedAt &&
                toMonthKey(session.startedAt) === reportingMonthKey,
            );
      const revenue =
        snapshotSessions.length > 0
          ? snapshotSessions.reduce((sum, session) => sum + session.amount, 0)
          : snapshot.sessions.reduce((sum, session) => sum + session.amount, 0);

      return {
        tenantId: snapshot.tenantId,
        tenantName: snapshot.tenantName,
        revenue,
        revenueLabel: formatCurrency(revenue, snapshot.currency),
        stations:
          snapshot.stations.length > 0
            ? snapshot.stations.length
            : snapshot.tenantStationCount,
        chargers:
          snapshotChargePoints.length > 0
            ? snapshotChargePoints.length
            : snapshot.tenantChargePointCount,
        openAlerts: snapshotOpenAlerts,
      };
    })
    .sort((left, right) => right.revenue - left.revenue || right.stations - left.stations)
    .slice(0, 5);

  model.topTenants = topTenants;
  model.tenantRevenueSeries = topTenants.map((tenant) => ({
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    revenue: tenant.revenue,
    revenueLabel: tenant.revenueLabel,
  }));

  model.recentAlerts = allAlerts
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 8);

  model.kpis = model.kpis.map((kpi) =>
    kpi.id === "active-stations" && uniqueStationCount > 0
      ? {
          ...kpi,
          delta: `${formatNumber(uniqueStationCount)} total`,
        }
      : kpi,
  );

  return model;
}

async function fetchTenantSnapshot(
  tenant: PlatformTenantRecord,
): Promise<TenantSnapshot> {
  const headers = {
    "x-tenant-id": tenant.id,
  };

  const [analyticsValue, stationsValue, chargePointsValue, sessionsValue, alertsValue, incidentsValue] =
    await Promise.all([
      fetchWithFallback<unknown>(
        ["/api/v1/analytics/dashboard", "/api/dashboard/overview"],
        { headers },
      ),
      fetchWithFallback<unknown>(["/api/v1/stations", "/api/stations"], { headers }),
      fetchWithFallback<unknown>(
        ["/api/v1/charge-points", "/api/charge-points"],
        { headers },
      ),
      fetchWithFallback<unknown>(
        ["/api/v1/sessions/history/all", "/api/sessions"],
        { headers },
      ),
      fetchWithFallback<unknown>(["/api/v1/alerts", "/api/alerts"], { headers }),
      fetchWithFallback<unknown>(["/api/v1/incidents", "/api/incidents"], {
        headers,
      }),
    ]);

  const stations = normalizeStations(stationsValue ?? []);
  const chargePoints = normalizeChargePoints(chargePointsValue ?? []);
  const sessions = normalizeSessions(sessionsValue ?? []);
  const alerts = normalizeAlerts(alertsValue ?? [], incidentsValue ?? [], tenant);
  const analytics = normalizeAnalytics(analyticsValue ?? {});

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    currency: tenant.currency || DEFAULT_CURRENCY,
    tenantStationCount: tenant.stationCount,
    tenantChargePointCount: tenant.chargePointCount,
    stations,
    chargePoints,
    sessions,
    alerts,
    analytics,
  };
}

export async function loadSuperAdminDashboardData(
  referenceDate = new Date(),
): Promise<SuperAdminDashboardResponse> {
  const tenants = await fetchPlatformTenants();
  if (tenants.length === 0) {
    return buildEmptyModel();
  }

  const snapshots = await Promise.all(
    tenants.map((tenant) => fetchTenantSnapshot(tenant)),
  );

  return buildSuperAdminDashboardModel(snapshots, referenceDate);
}

export function useSuperAdminDashboard() {
  const { isReady } = useTenant();

  return useQuery<SuperAdminDashboardResponse>({
    queryKey: ["dashboard", "super-admin"],
    queryFn: () => loadSuperAdminDashboardData(),
    enabled: isReady,
    staleTime: 30_000,
  });
}

export const superAdminDashboardTestUtils = {
  buildEmptyModel,
  buildSuperAdminDashboardModel,
  normalizeAlerts,
  normalizeChargePoints,
  normalizeSessions,
  normalizeStations,
  mapUtilizationBucket,
  normalizeAlertSeverity,
};
