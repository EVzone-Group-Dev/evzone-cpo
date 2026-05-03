import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
import { PATHS } from "@/router/paths";

const mockLoginWithPassword = vi.fn();
const mockSetPendingAuthChallenge = vi.fn();
const mockClearPendingAuthChallenge = vi.fn();
const mockSetUser = vi.fn();

vi.mock("@/core/api/auth", () => ({
  loginWithPassword: (...args: unknown[]) => mockLoginWithPassword(...args),
  requestPasskeyLoginOptions: vi.fn(),
  verifyPasskeyLogin: vi.fn(),
}));

vi.mock("@/core/auth/pendingAuthChallenge", () => ({
  setPendingAuthChallenge: (...args: unknown[]) =>
    mockSetPendingAuthChallenge(...args),
  clearPendingAuthChallenge: () => mockClearPendingAuthChallenge(),
}));

vi.mock("@/core/auth/authStore", () => ({
  useAuthStore: vi.fn(
    (
      selector?: (state: { setUser: (...args: unknown[]) => void }) => unknown,
    ) => {
      const state = {
        setUser: mockSetUser,
      };
      return selector ? selector(state) : state;
    },
  ),
}));

vi.mock("@/core/branding/useBranding", () => ({
  useBranding: () => ({
    branding: {
      branding: {
        appName: "EVzone CPO Central",
        shortName: "EVzone",
        logoUrl: null,
      },
      legal: {
        termsUrl: null,
        privacyUrl: null,
      },
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockLoginWithPassword.mockReset();
    mockSetPendingAuthChallenge.mockReset();
    mockClearPendingAuthChallenge.mockReset();
    mockSetUser.mockReset();
  });

  it("redirects to authenticator challenge when backend requires OTP/MFA step", async () => {
    mockLoginWithPassword.mockRejectedValueOnce(
      new Error(
        "OTP verification is required. A code has been sent to your email.",
      ),
    );

    render(
      <MemoryRouter initialEntries={[PATHS.LOGIN]}>
        <Routes>
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
          <Route
            path={PATHS.MFA_AUTHENTICATOR_CHALLENGE}
            element={<div>MFA Challenge Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "operator@evzone.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("MFA Challenge Page")).toBeInTheDocument();
    expect(mockSetPendingAuthChallenge).toHaveBeenCalledTimes(1);
  });

  it("applies successful auth and redirects to role home", async () => {
    mockLoginWithPassword.mockResolvedValueOnce({
      accessToken: "demo-token",
      refreshToken: "refresh-token",
      user: {
        id: "u-1",
        name: "Operator User",
        email: "operator@evzone.io",
        role: "OPERATOR",
        status: "Active",
        mfaEnabled: true,
        mfaRequired: true,
        mfaSetupRequired: false,
      },
    });

    render(
      <MemoryRouter initialEntries={[PATHS.LOGIN]}>
        <Routes>
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
          <Route
            path={PATHS.DASHBOARD_OPERATOR}
            element={<div>Operator Home</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "operator@evzone.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Operator Home")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledTimes(1);
      expect(mockClearPendingAuthChallenge).toHaveBeenCalledTimes(1);
    });
  });
});
