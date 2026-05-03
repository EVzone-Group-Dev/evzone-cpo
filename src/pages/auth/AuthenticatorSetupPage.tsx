import { ArrowLeft, Lock, Smartphone } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthAlert, AuthCodeInput, AuthHeading, AuthTextField } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { fetchJson } from "@/core/api/fetchJson";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import type { AuthenticatedApiUser } from "@/core/types/mockApi";
import { PATHS } from "@/router/paths";

type AuthenticatorSetupResponse = {
  qrCodeUrl: string;
  secret: string;
};

type GenericSuccessResponse = {
  success: boolean;
  message?: string;
};

export function AuthenticatorSetupPage() {
  const user = useAuthStore((state) => state.user);
  const replaceUser = useAuthStore((state) => state.replaceUser);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [authenticatorToken, setAuthenticatorToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [authenticatorGenerating, setAuthenticatorGenerating] = useState(false);
  const [authenticatorVerifying, setAuthenticatorVerifying] = useState(false);

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  if (!requiresMfaSetup(user)) {
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  async function refreshUserAndContinue(): Promise<void> {
    const refreshedUser = await fetchJson<AuthenticatedApiUser>("/api/v1/users/me");
    replaceUser(refreshedUser);
    navigate(getRoleHomePath(refreshedUser), { replace: true });
  }

  async function generateAuthenticator(): Promise<void> {
    setError("");
    setInfo("");
    setAuthenticatorGenerating(true);

    try {
      const password = currentPassword.trim();
      if (!password) {
        throw new Error("Current password is required to set up authenticator MFA.");
      }

      const setup = await fetchJson<AuthenticatorSetupResponse>(
        "/api/v1/auth/2fa/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword: password }),
        },
      );

      setQrCodeUrl(setup.qrCodeUrl);
      setManualSecret(setup.secret);
      setInfo("Scan the QR code, then enter the 6-digit code from your authenticator app.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate authenticator secret.",
      );
    } finally {
      setAuthenticatorGenerating(false);
    }
  }

  async function verifyAuthenticatorSetup(): Promise<void> {
    setError("");
    setInfo("");
    setAuthenticatorVerifying(true);

    try {
      const token = authenticatorToken.trim();
      if (!token) {
        throw new Error("Enter the authenticator app code to finish setup.");
      }

      await fetchJson<GenericSuccessResponse>("/api/v1/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      setInfo("Authenticator MFA is now enabled.");
      await refreshUserAndContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify authenticator code.");
    } finally {
      setAuthenticatorVerifying(false);
    }
  }

  return (
    <AuthShell
      visualTitle="Set up your authenticator app."
      visualSubtitle="Scan a QR code or enter a manual key to secure your account with time-based verification."
      visualBullets={[
        "Compatible with Google, Microsoft, and TOTP apps",
        "Manual secret fallback when QR scanning is unavailable",
      ]}
    >
      <div className="mb-3">
        <button
          type="button"
          onClick={() => navigate(PATHS.MFA_SELECTION)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to options
        </button>
      </div>

      <AuthHeading
        badge="Auth Screens - Set Up Authenticator"
        title="Set up your authenticator app"
        description="Scan the QR code with Google Authenticator, Microsoft Authenticator, or any TOTP app."
      />

      <div className="space-y-4">
        {!qrCodeUrl ? (
          <>
            <AuthTextField
              id="setup-current-password"
              label="Current Password"
              type="password"
              icon={Lock}
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-cta-secondary gap-2"
              onClick={() => {
                void generateAuthenticator();
              }}
              disabled={authenticatorGenerating || authenticatorVerifying}
            >
              <Smartphone size={16} />
              {authenticatorGenerating ? "Generating..." : "Generate QR Code"}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-center text-xs font-semibold text-slate-700">
                Scan this code with your authenticator app
              </p>
              <img
                src={qrCodeUrl}
                alt="Authenticator QR code"
                className="mx-auto h-52 w-52 rounded-lg border border-slate-200 bg-white p-2"
              />
              <div className="mt-4 rounded-lg bg-slate-100 p-3">
                <p className="text-center text-xs font-semibold text-slate-600">
                  Manual setup key
                </p>
                <p className="mt-1 text-center font-mono text-sm font-bold text-slate-900">
                  {manualSecret}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700">
                Enter the 6-digit code from your app
              </label>
              <AuthCodeInput
                value={authenticatorToken}
                onChange={setAuthenticatorToken}
                name="authenticatorToken"
                autoFocus
              />
            </div>

            <button
              type="button"
              className="auth-cta gap-2"
              onClick={() => {
                void verifyAuthenticatorSetup();
              }}
              disabled={authenticatorGenerating || authenticatorVerifying}
            >
              {authenticatorVerifying ? "Verifying..." : "I've added the account"}
            </button>
          </>
        )}

        {(info || error) && (
          <>
            {info && <AuthAlert type="success" message={info} />}
            {error && <AuthAlert type="danger" message={error} />}
          </>
        )}
      </div>
    </AuthShell>
  );
}
