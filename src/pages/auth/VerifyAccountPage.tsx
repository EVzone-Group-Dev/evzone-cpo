import { Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AuthAlert,
  AuthCodeInput,
  AuthHeading,
  AuthTextField,
} from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { resendVerifyAccount, submitVerifyAccount } from "@/core/api/auth";
import { PATHS } from "@/router/paths";

function getInitialEmail(search: string) {
  const query = new URLSearchParams(search);
  return query.get("email")?.trim() ?? "";
}

export function VerifyAccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const seededEmail = useMemo(() => getInitialEmail(location.search), [location.search]);
  const [email, setEmail] = useState(seededEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setIsVerifying(true);
    try {
      await submitVerifyAccount({
        email: email.trim(),
        code: code.trim(),
      });
      setSuccess("Account verified. Redirecting to sign in...");
      window.setTimeout(() => {
        navigate(PATHS.LOGIN, { replace: true });
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify account.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Enter your email to resend the code.");
      return;
    }

    setIsResending(true);
    try {
      await resendVerifyAccount({ email: email.trim() });
      setSuccess("Verification code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      visualTitle="Protect account access with lightweight verification."
      visualSubtitle="A six-digit check that keeps onboarding secure without adding friction."
      visualBullets={[
        "Fast 6-digit verification step",
        "One-click resend for delivery issues",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Verify Account"
        title="Verify your account"
        description="Enter the 6-digit code sent to your email."
      />

      <form onSubmit={handleVerify} className="space-y-4">
        <AuthTextField
          id="verify-email"
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
          <label className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700">
            Verification Code
          </label>
          <AuthCodeInput
            value={code}
            onChange={setCode}
            name="verifyCode"
            autoFocus
          />
        </div>

        {(error || success) && (
          <>
            {error && <AuthAlert type="danger" message={error} />}
            {success && <AuthAlert type="success" message={success} />}
          </>
        )}

        <button className="auth-cta gap-2" type="submit" disabled={isVerifying}>
          <ShieldCheck size={16} />
          {isVerifying ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          className="auth-cta-secondary gap-2"
          onClick={handleResend}
          disabled={isResending}
        >
          <RefreshCcw size={15} />
          {isResending ? "Resending..." : "Resend code"}
        </button>
        <div className="text-center text-sm text-slate-600">
          <span>Back to </span>
          <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to={PATHS.LOGIN}>
            Sign In
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

