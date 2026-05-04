import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/core/api/fetchJson";
import { loadSuperAdminDashboardData } from "@/core/hooks/useSuperAdminDashboard";

vi.mock("@/core/api/fetchJson", () => ({
  fetchJson: vi.fn(),
}));

function getHeader(init: RequestInit | undefined, name: string) {
  const key = name.toLowerCase();
  const headers = init?.headers;

  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(name);
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([headerName]) => headerName.toLowerCase() === key);
    return entry?.[1] ?? null;
  }

  const record = headers as Record<string, string>;
  for (const [headerName, value] of Object.entries(record)) {
    if (headerName.toLowerCase() === key) {
      return value;
    }
  }

  return null;
}

describe("loadSuperAdminDashboardData", () => {
  const mockedFetchJson = vi.mocked(fetchJson);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a populated dashboard model when v1 endpoints are available", async () => {
    const now = new Date("2026-05-04T10:00:00.000Z");

    mockedFetchJson.mockImplementation(async (path, init) => {
      const tenantId = getHeader(init, "x-tenant-id");

      if (path === "/api/v1/platform/tenants") {
        return [
          { id: "tenant-1", name: "Alpha Mobility", currency: "USD" },
          { id: "tenant-2", name: "Beta Charging", currency: "USD" },
        ] as never;
      }

      if (path === "/api/v1/stations") {
        return tenantId === "tenant-1"
          ? [{ id: "st-a", status: "Online" }, { id: "st-b", status: "Offline" }]
          : [{ id: "st-c", status: "Online" }] as never;
      }

      if (path === "/api/v1/charge-points") {
        return tenantId === "tenant-1"
          ? [{ id: "cp-a", status: "Charging" }, { id: "cp-b", status: "Online" }]
          : [{ id: "cp-c", status: "Offline" }] as never;
      }

      if (path === "/api/v1/sessions/history/all") {
        return tenantId === "tenant-1"
          ? [
              {
                id: "ses-1",
                started: "2026-05-03T08:00:00.000Z",
                amount: "USD 120",
                status: "Completed",
              },
              {
                id: "ses-2",
                started: "2026-05-04T09:00:00.000Z",
                amount: "USD 72",
                status: "Active",
              },
            ]
          : [
              {
                id: "ses-3",
                started: "2026-05-04T06:00:00.000Z",
                amount: "USD 40",
                status: "Completed",
              },
            ] as never;
      }

      if (path === "/api/v1/alerts") {
        return tenantId === "tenant-1"
          ? [
              {
                id: "alert-1",
                type: "Critical",
                message: "Station offline",
                station: "West Yard",
                status: "Open",
                ts: "2026-05-04T09:10:00.000Z",
              },
            ]
          : [] as never;
      }

      if (path === "/api/v1/incidents") {
        return { incidents: [] } as never;
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const result = await loadSuperAdminDashboardData(now);

    expect(result.kpis).toHaveLength(6);
    expect(result.kpis.find((kpi) => kpi.id === "total-tenants")?.value).toBe("2");
    expect(result.kpis.find((kpi) => kpi.id === "total-chargers")?.value).toBe("3");
    expect(result.networkGrowthSeries).toHaveLength(30);
    expect(result.tenantRevenueSeries.length).toBeGreaterThan(0);
    expect(result.topTenants[0]?.tenantName).toBe("Alpha Mobility");
    expect(result.recentAlerts[0]?.severity).toBe("Critical");
  });

  it("falls back to legacy endpoints when v1 endpoints are unavailable", async () => {
    const now = new Date("2026-05-04T10:00:00.000Z");

    mockedFetchJson.mockImplementation(async (path) => {
      if (path === "/api/v1/platform/tenants") {
        return [{ id: "tenant-legacy", name: "Legacy Tenant", currency: "USD" }] as never;
      }

      if (
        path === "/api/v1/stations" ||
        path === "/api/v1/charge-points" ||
        path === "/api/v1/sessions/history/all" ||
        path === "/api/v1/alerts" ||
        path === "/api/v1/incidents"
      ) {
        throw new Error("Not found");
      }

      if (path === "/api/stations") {
        return [{ id: "st-1", status: "Online" }] as never;
      }
      if (path === "/api/charge-points") {
        return [{ id: "cp-1", status: "Online" }] as never;
      }
      if (path === "/api/sessions") {
        return [
          {
            id: "ses-1",
            started: "2026-05-02T00:00:00.000Z",
            amount: "USD 20",
            status: "Completed",
          },
        ] as never;
      }
      if (path === "/api/alerts") {
        return [
          {
            id: "al-1",
            type: "Warning",
            message: "Latency spike",
            station: "Hub 1",
            status: "Open",
            ts: "2026-05-02T04:20:00.000Z",
          },
        ] as never;
      }
      if (path === "/api/incidents") {
        return { incidents: [] } as never;
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const result = await loadSuperAdminDashboardData(now);

    expect(result.kpis.find((kpi) => kpi.id === "total-tenants")?.value).toBe("1");
    expect(result.kpis.find((kpi) => kpi.id === "total-chargers")?.value).toBe("1");
    expect(result.recentAlerts).toHaveLength(1);
    expect(
      mockedFetchJson.mock.calls.some(([path]) => path === "/api/stations"),
    ).toBe(true);
    expect(
      mockedFetchJson.mock.calls.some(([path]) => path === "/api/sessions"),
    ).toBe(true);
  });

  it("returns safe empty states when all data sources are unavailable", async () => {
    mockedFetchJson.mockRejectedValue(new Error("network down"));

    const result = await loadSuperAdminDashboardData(
      new Date("2026-05-04T10:00:00.000Z"),
    );

    expect(result.kpis).toHaveLength(6);
    expect(result.kpis.every((kpi) => kpi.value === "0" || kpi.value.includes("0"))).toBe(true);
    expect(result.networkGrowthSeries).toEqual([]);
    expect(result.tenantRevenueSeries).toEqual([]);
    expect(result.topTenants).toEqual([]);
    expect(result.recentAlerts).toEqual([]);
  });

  it("normalizes malformed numeric and status values safely", async () => {
    mockedFetchJson.mockImplementation(async (path) => {
      if (path === "/api/v1/platform/tenants") {
        return [{ id: "tenant-1", name: "Malformed Tenant", currency: "USD" }] as never;
      }
      if (path === "/api/v1/stations") {
        return [{ id: "st-1", status: "???unknown" }] as never;
      }
      if (path === "/api/v1/charge-points") {
        return [
          { id: "cp-1", status: "mystery" },
          { id: "cp-2", status: "charging" },
        ] as never;
      }
      if (path === "/api/v1/sessions/history/all") {
        return [
          { id: "ses-a", amount: "USD ???", started: "not-a-date", status: 42 },
          { id: "ses-b", amount: -50, started: "2026-05-04T11:00:00.000Z", status: "ACTIVE" },
        ] as never;
      }
      if (path === "/api/v1/alerts") {
        return [
          {
            id: "alert-1",
            type: "odd",
            message: 999,
            station: null,
            status: "Closed",
            ts: "bad",
          },
        ] as never;
      }
      if (path === "/api/v1/incidents") {
        return {
          incidents: [
            {
              id: "inc-1",
              severity: "MAJOR",
              status: "acknowledged",
              stationName: "Downtown Hub",
              situationAudit: "Packet loss detected",
              reportedAt: "2026-05-04T01:00:00.000Z",
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected path ${path}`);
    });

    const result = await loadSuperAdminDashboardData(
      new Date("2026-05-04T10:00:00.000Z"),
    );

    expect(result.kpis.find((kpi) => kpi.id === "revenue-mtd")?.value).toContain("0");
    expect(result.kpis.find((kpi) => kpi.id === "open-alerts")?.value).toBe("1");
    expect(result.utilizationBreakdown.find((slice) => slice.id === "in-use")?.value).toBe(1);
    expect(result.utilizationBreakdown.find((slice) => slice.id === "offline")?.value).toBe(1);
    expect(result.recentAlerts.some((alert) => alert.severity === "Warning")).toBe(true);
    expect(result.recentAlerts.some((alert) => alert.status === "Acknowledged")).toBe(true);
  });
});

