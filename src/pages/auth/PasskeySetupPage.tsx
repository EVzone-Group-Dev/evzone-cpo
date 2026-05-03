import { startRegistration } from "@simplewebauthn/browser";
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthAlert, AuthHeading } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { fetchJson } from "@/core/api/fetchJson";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import type { AuthenticatedApiUser } from "@/core/types/mockApi";
import { PATHS } from "@/router/paths";

type PasskeyRegistrationOptionsResponse = {
  options: unknown;
  challengeId: string;
  expiresAt: string;
};

type PasskeyRegistrationVerifyRequest = {
  challengeId: string;
  response: unknown;
};

type GenericSuccessResponse = {
  success: boolean;
  message?: string;
};

export function PasskeySetupPage() {
  const user = useAuthStore((state) => state.user);
  const replaceUser = useAuthStore((state) => state.replaceUser);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

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

  async function startPasskeySetup(): Promise<void> {
    setError("");
    setInfo("");
    setIsRegistering(true);

    try {
      const options = await fetchJson<PasskeyRegistrationOptionsResponse>(
        "/api/v1/auth/mfa/passkeys/registration/options",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const credentialResponse = await startRegistration({
        optionsJSON: options.options as Parameters<typeof startRegistration>[0]["optionsJSON"],
      });

      const verifyPayload: PasskeyRegistrationVerifyRequest = {
        challengeId: options.challengeId,
        response: credentialResponse,
      };

      await fetchJson<GenericSuccessResponse>(
        "/api/v1/auth/mfa/passkeys/registration/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verifyPayload),
        },
      );

      setIsSetupComplete(true);
      setInfo("Passkey has been registered successfully.");
      window.setTimeout(() => {
        void refreshUserAndContinue();
      }, 1200);
    } catch (err) {
      let errorMessage = "Unable to register passkey.";
      if (err instanceof Error) {
        if (err.message.includes("NotAllowedError")) {
          errorMessage = "Passkey registration was cancelled or timed out.";
        } else if (err.message.includes("InvalidStateError")) {
          errorMessage = "A passkey action is already in progress. Try again.";
        } else if (err.message.includes("AbortError")) {
          errorMessage = "Passkey registration was interrupted. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <AuthShell
      visualTitle="Enable passwordless sign-in with passkeys."
      visualSubtitle="Create a passkey using biometrics or device PIN for secure, fast authentication."
      visualBullets={[
        "Supports Face ID, Touch ID, Windows Hello, and security keys",
        "Stored securely on your trusted device or password manager",
      ]}
    >
      <div className="mb-3">
        <button
          type="button"
          onClick={() => navigate(PATHS.MFA_SELECTION)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          disabled={isRegistering || isSetupComplete}
        >
          <ArrowLeft size={15} />
          Back to options
        </button>
      </div>

      <AuthHeading
        badge="Auth Screens - Set Up Passkey"
        title={isSetupComplete ? "Passkey registered" : "Set up your passkey"}
        description={
          isSetupComplete
            ? "You can now use your passkey to sign in securely."
            : "Use biometrics or your device PIN for faster and safer sign in."
        }
      />

      {!isSetupComplete ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Follow the device prompts to register your passkey. This enables passwordless sign-in.
          </div>
          <button
            type="button"
            className="auth-cta gap-2"
            onClick={() => {
              void startPasskeySetup();
            }}
            disabled={isRegistering}
          >
            <Lock size={16} />
            {isRegistering ? "Registering passkey..." : "Create Passkey"}
          </button>
          <button
            type="button"
            className="auth-cta-secondary"
            onClick={() => navigate(getRoleHomePath(user))}
            disabled={isRegistering}
          >
            Not now
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="mb-3 text-center">
            <CheckCircle size={48} className="mx-auto text-green-600" />
          </div>
          <p className="text-center text-sm font-medium text-green-900">
            Your passkey has been set up successfully. Redirecting to your dashboard.
          </p>
        </div>
      )}

      {(info || error) && (
        <div className="mt-4">
          {info && <AuthAlert type="success" message={info} />}
          {error && <AuthAlert type="danger" message={error} />}
        </div>
      )}
    </AuthShell>
  );
}
