import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireGuest } from "@/router/guards";
import { useAuthStore } from "@/core/auth/authStore";
import { PATHS } from "@/router/paths";
import type { CPOUser } from "@/core/types/domain";

vi.mock("@/core/auth/authStore", () => ({
  useAuthStore: vi.fn(),
}));

function buildUser(overrides: Partial<CPOUser> = {}): CPOUser {
  return {
    id: "user-operator",
    name: "Operator User",
    email: "operator@evzone.io",
    role: "OPERATOR",
    status: "Active",
    mfaEnabled: true,
    mfaRequired: true,
    mfaSetupRequired: false,
    ...overrides,
  };
}

describe("RequireGuest", () => {
  const mockedUseAuthStore = vi.mocked(useAuthStore);

  function mockAuthState(state: {
    isAuthenticated: boolean;
    user: CPOUser | null;
  }) {
    mockedUseAuthStore.mockImplementation(
      ((selector: (store: { isAuthenticated: boolean; user: CPOUser | null }) => unknown) =>
        selector(state)) as typeof useAuthStore,
    );
  }

  beforeEach(() => {
    mockAuthState({
      isAuthenticated: false,
      user: null,
    });
  });

  it("renders guest content when not authenticated", async () => {
    render(
      <MemoryRouter initialEntries={[PATHS.LOGIN]}>
        <Routes>
          <Route
            path={PATHS.LOGIN}
            element={
              <RequireGuest>
                <div>Guest Route Content</div>
              </RequireGuest>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Guest Route Content")).toBeInTheDocument();
  });

  it("redirects authenticated users needing setup to legacy MFA setup route", async () => {
    mockAuthState({
      isAuthenticated: true,
      user: buildUser({ mfaSetupRequired: true }),
    });

    render(
      <MemoryRouter initialEntries={[PATHS.LOGIN]}>
        <Routes>
          <Route
            path={PATHS.LOGIN}
            element={
              <RequireGuest>
                <div>Guest Route Content</div>
              </RequireGuest>
            }
          />
          <Route path={PATHS.MFA_SETUP} element={<div>Legacy MFA Setup</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Legacy MFA Setup")).toBeInTheDocument();
  });

  it("redirects authenticated users to role home when setup is complete", async () => {
    mockAuthState({
      isAuthenticated: true,
      user: buildUser({ mfaSetupRequired: false }),
    });

    render(
      <MemoryRouter initialEntries={[PATHS.LOGIN]}>
        <Routes>
          <Route
            path={PATHS.LOGIN}
            element={
              <RequireGuest>
                <div>Guest Route Content</div>
              </RequireGuest>
            }
          />
          <Route
            path={PATHS.DASHBOARD_OPERATOR}
            element={<div>Operator Dashboard Home</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Operator Dashboard Home")).toBeInTheDocument();
  });
});

