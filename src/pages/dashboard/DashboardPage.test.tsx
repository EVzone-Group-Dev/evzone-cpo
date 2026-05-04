import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { useAuthStore } from "@/core/auth/authStore";
import { useTenant } from "@/core/hooks/useTenant";
import { useDashboardOverview } from "@/core/hooks/usePlatformData";

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

vi.mock("@/core/auth/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/core/hooks/useTenant", () => ({
  useTenant: vi.fn(),
}));

vi.mock("@/core/hooks/usePlatformData", () => ({
  useDashboardOverview: vi.fn(),
}));

vi.mock("@/pages/dashboard/FinanceDashboard", () => ({
  FinanceDashboard: () => <div>Mock Finance Dashboard</div>,
}));

vi.mock("@/pages/dashboard/StationManagerDashboard", () => ({
  StationManagerDashboard: () => <div>Mock Station Manager Dashboard</div>,
}));

vi.mock("@/pages/dashboard/TechnicianDashboard", () => ({
  TechnicianDashboard: () => <div>Mock Technician Dashboard</div>,
}));

vi.mock("@/pages/dashboard/SiteOwnerDashboard", () => ({
  SiteOwnerDashboard: () => <div>Mock Site Owner Dashboard</div>,
}));

vi.mock("@/pages/dashboard/SuperAdminDashboard", () => ({
  SuperAdminDashboard: () => <div>Mock Super Admin Dashboard</div>,
}));

const overviewData = {
  kpis: [
    {
      id: "sessions",
      label: "Sessions Today",
      value: "3",
      delta: "Today",
      trend: "up" as const,
      iconKey: "activity" as const,
    },
  ],
  recentSessions: [
    {
      id: "s-1",
      station: "Central Hub",
      cp: "CP-001",
      energy: "12.4 kWh",
      amount: "USD 22",
      status: "Completed" as const,
      method: "RFID",
    },
  ],
  recentIncidents: [],
};

describe("DashboardPage role routing", () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore);
  const mockedUseTenant = vi.mocked(useTenant);
  const mockedUseDashboardOverview = vi.mocked(useDashboardOverview);

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseTenant.mockReturnValue({
      activeTenant: {
        id: "tenant-1",
        code: "TN1",
        slug: "tenant-1",
        name: "Tenant One",
        description: "Tenant",
        scope: "tenant",
        scopeLabel: "Tenant",
        region: "KE",
        timeZone: "Africa/Nairobi",
        currency: "USD",
        siteCount: 0,
        stationCount: 0,
        chargePointCount: 0,
      },
      dashboardMode: "operations",
      isLoading: false,
    } as unknown as ReturnType<typeof useTenant>);

    mockedUseDashboardOverview.mockReturnValue({
      data: overviewData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useDashboardOverview>);
  });

  it("renders the dedicated Super Admin dashboard for SUPER_ADMIN users", () => {
    mockedUseAuthStore.mockReturnValue({
      user: {
        id: "user-super",
        name: "Super Admin",
        email: "super@evzone.io",
        role: "SUPER_ADMIN",
        status: "Active",
        mfaEnabled: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as ReturnType<typeof useAuthStore>);

    render(<DashboardPage />);

    expect(screen.getByText("Mock Super Admin Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Recent Sessions")).not.toBeInTheDocument();
    expect(mockedUseDashboardOverview).toHaveBeenCalledWith({ enabled: false });
  });

  it("keeps CPO Admin on the shared operations dashboard", () => {
    mockedUseAuthStore.mockReturnValue({
      user: {
        id: "user-cpo",
        name: "CPO Admin",
        email: "cpo@evzone.io",
        role: "CPO_ADMIN",
        status: "Active",
        mfaEnabled: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as ReturnType<typeof useAuthStore>);

    render(<DashboardPage />);

    expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
    expect(screen.queryByText("Mock Super Admin Dashboard")).not.toBeInTheDocument();
    expect(mockedUseDashboardOverview).toHaveBeenCalledWith({ enabled: true });
  });

  it("keeps Operator users on the shared operations dashboard", () => {
    mockedUseAuthStore.mockReturnValue({
      user: {
        id: "user-ops",
        name: "Operations User",
        email: "ops@evzone.io",
        role: "OPERATOR",
        status: "Active",
        mfaEnabled: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as ReturnType<typeof useAuthStore>);

    render(<DashboardPage />);

    expect(screen.getByText("Active Incidents")).toBeInTheDocument();
    expect(screen.queryByText("Mock Super Admin Dashboard")).not.toBeInTheDocument();
    expect(mockedUseDashboardOverview).toHaveBeenCalledWith({ enabled: true });
  });
});

