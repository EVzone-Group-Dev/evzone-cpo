import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSuperAdminDashboard } from "@/core/hooks/useSuperAdminDashboard";
import { SuperAdminDashboard } from "@/pages/dashboard/SuperAdminDashboard";

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({
    children,
    pageTitle,
  }: {
    children: ReactNode;
    pageTitle?: string;
  }) => (
    <div>
      <h1>{pageTitle}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/core/hooks/useSuperAdminDashboard", () => ({
  useSuperAdminDashboard: vi.fn(),
}));

describe("SuperAdminDashboard", () => {
  const mockedUseSuperAdminDashboard = vi.mocked(useSuperAdminDashboard);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading state", () => {
    mockedUseSuperAdminDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useSuperAdminDashboard>);

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading platform command view...")).toBeInTheDocument();
  });

  it("renders graceful empty states when there is no analytics data", () => {
    mockedUseSuperAdminDashboard.mockReturnValue({
      data: {
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
            value: "$0",
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
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSuperAdminDashboard>);

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("No session trend data available for the selected 30-day window."),
    ).toBeInTheDocument();
    expect(screen.getByText("No tenant revenue data available.")).toBeInTheDocument();
    expect(screen.getByText("No alerts in the current window.")).toBeInTheDocument();
    expect(screen.getByText("No tenant performance records are available.")).toBeInTheDocument();
  });

  it("renders populated charts and tables", () => {
    mockedUseSuperAdminDashboard.mockReturnValue({
      data: {
        kpis: [
          {
            id: "total-tenants",
            label: "Total Tenants",
            value: "2",
            delta: "Platform-wide",
            trend: "up",
          },
          {
            id: "active-stations",
            label: "Active Stations",
            value: "4",
            delta: "4 total",
            trend: "up",
          },
          {
            id: "total-chargers",
            label: "Total Chargers",
            value: "12",
            delta: "Provisioned",
            trend: "up",
          },
          {
            id: "active-sessions-today",
            label: "Active Sessions Today",
            value: "3",
            delta: "Today",
            trend: "up",
          },
          {
            id: "revenue-mtd",
            label: "Revenue (MTD)",
            value: "$1,420",
            delta: "MTD",
            trend: "up",
          },
          {
            id: "open-alerts",
            label: "Open Alerts",
            value: "1",
            delta: "Needs attention",
            trend: "down",
          },
        ],
        networkGrowthSeries: [
          { label: "May 1", sessions: 4 },
          { label: "May 2", sessions: 6 },
        ],
        tenantRevenueSeries: [
          {
            tenantId: "tenant-a",
            tenantName: "Alpha Mobility",
            revenue: 920,
            revenueLabel: "$920",
          },
        ],
        utilizationBreakdown: [
          { id: "in-use", label: "In Use", value: 7, percentage: 58 },
          { id: "available", label: "Available", value: 4, percentage: 33 },
          { id: "offline", label: "Offline", value: 1, percentage: 8 },
        ],
        topTenants: [
          {
            tenantId: "tenant-a",
            tenantName: "Alpha Mobility",
            revenue: 920,
            revenueLabel: "$920",
            stations: 3,
            chargers: 9,
            openAlerts: 1,
          },
        ],
        recentAlerts: [
          {
            id: "alert-1",
            tenantName: "Alpha Mobility",
            stationName: "West Hub",
            severity: "Critical",
            message: "Connector 2 fault",
            status: "Open",
            timeLabel: "5/4/2026, 10:20:00 AM",
            timestamp: 1_777_875_600_000,
          },
        ],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSuperAdminDashboard>);

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Role Dashboard - Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Network Growth (Total Sessions)")).toBeInTheDocument();
    expect(screen.getByText("Tenant Performance (Revenue)")).toBeInTheDocument();
    expect(screen.getAllByText("Alpha Mobility").length).toBeGreaterThan(0);
    expect(screen.getByText("Connector 2 fault")).toBeInTheDocument();
  });
});
