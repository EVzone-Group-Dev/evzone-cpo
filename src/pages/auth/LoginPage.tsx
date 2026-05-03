import { startAuthentication } from "@simplewebauthn/browser";
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthHeading, AuthAlert, AuthSeparator, AuthTextField } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  loginWithPassword,
  requestPasskeyLoginOptions,
  verifyPasskeyLogin,
} from "@/core/api/auth";
import {
  clearPendingAuthChallenge,
  setPendingAuthChallenge,
} from "@/core/auth/pendingAuthChallenge";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { useBranding } from "@/core/branding/useBranding";
import type { LoginResponse } from "@/core/types/mockApi";
import { PATHS } from "@/router/paths";

type LoadingMode = "passkey" | "password";

function browserSupportsPasskeys(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("NotAllowedError")) {
      return "Passkey request was cancelled or timed out.";
    }
    if (error.message.includes("InvalidStateError")) {
      return "A passkey action is already in progress. Try again.";
    }
    if (error.message.includes("AbortError")) {
      return "Passkey request was interrupted. Please try again.";
    }
    return error.message;
  }
  return "Unable to sign in.";
}

function messageIndicatesMfaStep(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("mfa token is required") ||
    normalized.includes("two-factor") ||
    normalized.includes("recovery code")
  );
}

function messageIndicatesOtpStep(message: string): boolean {
  return message.toLowerCase().includes("otp verification is required");
}

function messageIndicatesPasskey(message: string): boolean {
  return message.toLowerCase().includes("passkey verification is required");
}

function detectOtpChannel(message: string): "email" | "sms" | null {
  const normalized = message.toLowerCase();
  if (normalized.includes("sms")) {
    return "sms";
  }
  if (normalized.includes("email")) {
    return "email";
  }
  return null;
}

export function LoginPage() {
  const passkeySupported = browserSupportsPasskeys();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingMode, setLoadingMode] = useState<LoadingMode | null>(null);
  const { setUser } = useAuthStore();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const shortBrandName =
    branding.branding.shortName?.trim() || branding.branding.appName;
  const submittingPassword = loadingMode === "password";
  const submittingPasskey = loadingMode === "passkey";

  const applySuccessfulAuth = (auth: LoginResponse): void => {
    const bearerToken = auth.accessToken ?? auth.token;
    if (!bearerToken) {
      throw new Error("Login response missing access token.");
    }

    clearPendingAuthChallenge();
    setUser(auth.user, bearerToken, auth.refreshToken ?? null);
    navigate(
      requiresMfaSetup(auth.user)
        ? PATHS.MFA_SELECTION
        : getRoleHomePath(auth.user),
      { replace: true },
    );
  };

  const handlePasswordLogin = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError("");
    setLoadingMode("password");

    try {
      const auth = await loginWithPassword({
        email: email.trim(),
        password,
      });
      applySuccessfulAuth(auth);
    } catch (err) {
      const message = extractErrorMessage(err);
      const otpRequested = messageIndicatesOtpStep(message);
      const mfaRequested = messageIndicatesMfaStep(message);

      if (otpRequested || mfaRequested) {
        setPendingAuthChallenge({
          email: email.trim(),
          password,
          otpMethodAvailable: otpRequested,
          suggestedChannel: detectOtpChannel(message),
        });
        navigate(PATHS.MFA_AUTHENTICATOR_CHALLENGE, { replace: true });
        return;
      }

      if (messageIndicatesPasskey(message) && passkeySupported) {
        setError('Passkey verification is required. Use "Sign in with Passkey".');
      } else {
        setError(message);
      }
    } finally {
      setLoadingMode(null);
    }
  };

  const handlePasskeyLogin = async (): Promise<void> => {
    setError("");
    setLoadingMode("passkey");

    try {
      if (!passkeySupported) {
        throw new Error(
          "This browser does not support passkeys. Use password + MFA.",
        );
      }
      if (!email.trim()) {
        throw new Error("Email is required for passkey sign-in.");
      }

      const options = await requestPasskeyLoginOptions(email.trim());
      const credentialResponse = await startAuthentication({
        optionsJSON: options.options,
      });

      const auth = await verifyPasskeyLogin({
        challengeId: options.challengeId,
        response: credentialResponse,
      });

      applySuccessfulAuth(auth);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <AuthShell
      visualTitle="Secure access to your charging operations."
      visualSubtitle="A responsive, multi-step sign-in built for EVzone teams across desktop, tablet, and mobile."
      visualBullets={[
        "Password + passkey sign-in support",
        "Authenticator and recovery challenge flow",
        "Consistent brand experience across all auth states",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Login"
        title={`Sign in to ${shortBrandName} Hub`}
        description="Manage your charging stations anywhere."
      />

      <form onSubmit={handlePasswordLogin} className="space-y-3.5">
        <AuthTextField
          id="login-email"
          label="Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="example@gmail.com"
          autoComplete="email"
          required
        />

        <div>
          <AuthTextField
            id="login-password"
            label="Password"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={password}
            onChange={setPassword}
            placeholder="********"
            autoComplete="current-password"
            required
            rightAddon={
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <div className="mt-2 text-right">
            <Link
              to={PATHS.FORGOT_PASSWORD}
              className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {error && <AuthAlert type="danger" message={error} />}

        <button type="submit" className="auth-cta" disabled={loadingMode !== null}>
          {submittingPassword ? "Signing in..." : "Login"}
        </button>

        <AuthSeparator />

        <button
          type="button"
          className="auth-cta-secondary gap-2"
          onClick={() => {
            void handlePasskeyLogin();
          }}
          disabled={loadingMode !== null || !passkeySupported}
        >
          {submittingPasskey ? (
            "Verifying passkey..."
          ) : (
            <>
              <KeyRound size={16} />
              Sign in with Passkey
            </>
          )}
        </button>

        {!passkeySupported && (
          <p className="text-[0.76rem] text-amber-700">
            Passkeys are not available in this browser. Use email and password.
          </p>
        )}
      </form>
    </AuthShell>
  );
}

