import { Lock, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AuthAlert,
  AuthCodeInput,
  AuthHeading,
  AuthSeparator,
} from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { loginWithPassword } from "@/core/api/auth";
import {
  clearPendingAuthChallenge,
  getPendingAuthChallenge,
} from "@/core/auth/pendingAuthChallenge";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { PATHS } from "@/router/paths";
import type { LoginResponse } from "@/core/types/mockApi";
import type { OtpChannel } from "@/core/types/authFlows";

type Method = "totp" | "recovery" | "otp";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to verify sign-in challenge.";
}

function messageIndicatesOtpStep(message: string): boolean {
  return message.toLowerCase().includes("otp verification is required");
}

export function AuthenticatorChallengePage() {
  const pending = useMemo(() => getPendingAuthChallenge(), []);
  const [method, setMethod] = useState<Method>(
    pending?.otpMethodAvailable ? "otp" : "totp",
  );
  const [otpCode, setOtpCode] = useState("");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>(
    pending?.suggestedChannel ?? "email",
  );
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  if (!pending) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      const payload: {
        email: string;
        password: string;
        otpCode?: string;
        otpChannel?: OtpChannel;
        twoFactorToken?: string;
        recoveryCode?: string;
      } = {
        email: pending.email,
        password: pending.password,
      };

      if (method === "totp") {
        if (totpCode.trim().length !== 6) {
          throw new Error("Enter a 6-digit authenticator code.");
        }
        payload.twoFactorToken = totpCode.trim();
      }

      if (method === "recovery") {
        if (!recoveryCode.trim()) {
          throw new Error("Enter your recovery code.");
        }
        payload.recoveryCode = recoveryCode.trim();
      }

      if (method === "otp") {
        payload.otpChannel = otpChannel;
        if (otpCode.trim()) {
          payload.otpCode = otpCode.trim();
        }
      }

      const auth = await loginWithPassword(payload);
      applySuccessfulAuth(auth);
    } catch (err) {
      const message = extractErrorMessage(err);
      if (method === "otp" && messageIndicatesOtpStep(message) && !otpCode.trim()) {
        setInfo(`A code has been sent via ${otpChannel}. Enter it to continue.`);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      visualTitle="Layered MFA challenge with clear fallback paths."
      visualSubtitle="Users can verify with authenticator code, recovery code, or OTP without restarting sign-in."
      visualBullets={[
        "Authenticator + recovery pathways",
        "Optional OTP path when backend requires it",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Authenticator App"
        title="Enter authentication code"
        description="Use your authenticator app code to complete sign in."
      />

      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2 text-[0.78rem] font-semibold">
          <button
            type="button"
            className={`rounded-lg px-2.5 py-2 ${method === "totp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            onClick={() => setMethod("totp")}
          >
            Authenticator
          </button>
          <button
            type="button"
            className={`rounded-lg px-2.5 py-2 ${method === "recovery" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            onClick={() => setMethod("recovery")}
          >
            Recovery code
          </button>
          <button
            type="button"
            className={`rounded-lg px-2.5 py-2 ${method === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            onClick={() => setMethod("otp")}
            disabled={!pending.otpMethodAvailable}
          >
            OTP
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {method === "totp" && (
          <div>
            <label className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700">
              Authenticator Code
            </label>
            <AuthCodeInput value={totpCode} onChange={setTotpCode} name="totpCode" autoFocus />
          </div>
        )}

        {method === "recovery" && (
          <div>
            <label
              htmlFor="recovery-code"
              className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700"
            >
              Recovery Code
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="recovery-code"
                type="text"
                className="input h-11 rounded-xl border-slate-300 bg-slate-100/90 pl-10 text-[0.84rem] text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                placeholder="ABCDE-12345"
                autoFocus
              />
            </div>
          </div>
        )}

        {method === "otp" && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="otp-channel"
                className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700"
              >
                OTP Delivery Channel
              </label>
              <select
                id="otp-channel"
                value={otpChannel}
                onChange={(event) => setOtpChannel(event.target.value as OtpChannel)}
                className="input h-11 rounded-xl border-slate-300 bg-slate-100/90 text-[0.84rem] text-slate-700"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700">
                OTP Code
              </label>
              <AuthCodeInput value={otpCode} onChange={setOtpCode} name="otpCode" autoFocus />
            </div>
            <p className="text-xs text-slate-500">
              Leave code blank and submit once to request an OTP, then submit again with the code.
            </p>
          </div>
        )}

        {(error || info) && (
          <>
            {error && <AuthAlert type="danger" message={error} />}
            {info && <AuthAlert type="info" message={info} />}
          </>
        )}

        <button className="auth-cta gap-2" type="submit" disabled={isSubmitting}>
          <ShieldCheck size={16} />
          {isSubmitting ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>

      <div className="mt-4">
        <AuthSeparator />
      </div>

      <div className="mt-3 space-y-2 text-center text-sm">
        <Link
          to={PATHS.LOGIN}
          className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-slate-900"
          onClick={() => clearPendingAuthChallenge()}
        >
          <RefreshCcw size={14} />
          Try another method
        </Link>
        <div>
          <span className="text-slate-500">Need a password reset? </span>
          <Link
            to={PATHS.FORGOT_PASSWORD}
            className="font-semibold text-emerald-700 transition hover:text-emerald-800"
            onClick={() => clearPendingAuthChallenge()}
          >
            Use recovery flow
          </Link>
        </div>
        <div className="inline-flex items-center gap-2 text-slate-500">
          <Mail size={14} />
          <span>Signed in as {pending.email}</span>
        </div>
      </div>
    </AuthShell>
  );
}
