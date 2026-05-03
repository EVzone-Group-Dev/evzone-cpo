import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthenticatorChallengePage } from "@/pages/auth/AuthenticatorChallengePage";
import { PATHS } from "@/router/paths";

const mockLoginWithPassword = vi.fn();
const mockClearPendingAuthChallenge = vi.fn();
const mockGetPendingAuthChallenge = vi.fn();
const mockSetUser = vi.fn();

vi.mock("@/core/api/auth", () => ({
  loginWithPassword: (...args: unknown[]) => mockLoginWithPassword(...args),
}));

vi.mock("@/core/auth/pendingAuthChallenge", () => ({
  getPendingAuthChallenge: () => mockGetPendingAuthChallenge(),
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

describe("AuthenticatorChallengePage", () => {
  beforeEach(() => {
    mockLoginWithPassword.mockReset();
    mockClearPendingAuthChallenge.mockReset();
    mockGetPendingAuthChallenge.mockReset();
    mockSetUser.mockReset();
  });

  it("redirects to login when pending challenge context is missing", async () => {
    mockGetPendingAuthChallenge.mockReturnValueOnce(null);

    render(
      <MemoryRouter initialEntries={[PATHS.MFA_AUTHENTICATOR_CHALLENGE]}>
        <Routes>
          <Route
            path={PATHS.MFA_AUTHENTICATOR_CHALLENGE}
            element={<AuthenticatorChallengePage />}
          />
          <Route path={PATHS.LOGIN} element={<div>Login Route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login Route")).toBeInTheDocument();
  });

  it("submits authenticator code and completes login redirect", async () => {
    mockGetPendingAuthChallenge.mockReturnValue({
      email: "operator@evzone.io",
      password: "secret123",
      otpMethodAvailable: false,
      suggestedChannel: null,
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + 60_000,
    });
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
      <MemoryRouter initialEntries={[PATHS.MFA_AUTHENTICATOR_CHALLENGE]}>
        <Routes>
          <Route
            path={PATHS.MFA_AUTHENTICATOR_CHALLENGE}
            element={<AuthenticatorChallengePage />}
          />
          <Route
            path={PATHS.DASHBOARD_OPERATOR}
            element={<div>Operator Home</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const digitInputs = screen.getAllByRole("textbox", { name: /Digit/i });
    const otp = ["1", "2", "3", "4", "5", "6"];
    otp.forEach((digit, index) => {
      fireEvent.change(digitInputs[index], { target: { value: digit } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Verify & Continue" }));

    expect(await screen.findByText("Operator Home")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledTimes(1);
      expect(mockClearPendingAuthChallenge).toHaveBeenCalledTimes(1);
      expect(mockLoginWithPassword).toHaveBeenCalledWith({
        email: "operator@evzone.io",
        password: "secret123",
        twoFactorToken: "123456",
      });
    });
  });
});
