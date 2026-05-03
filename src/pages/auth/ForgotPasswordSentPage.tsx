import { CheckCircle2, Mail, RefreshCcw } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { AuthAlert, AuthHeading } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { resendForgotPassword } from "@/core/api/auth";
import { PATHS } from "@/router/paths";

interface LocationState {
  email?: string;
}

export function ForgotPasswordSentPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const queryEmail =
    new URLSearchParams(location.search).get("email")?.trim() ?? "";
  const [email] = useState(state?.email ?? queryEmail);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);

  const canResend = email.trim().length > 0;

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      await resendForgotPassword({ email: email.trim() });
      setSuccess("A new reset email has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      visualTitle="Clear success feedback builds trust."
      visualSubtitle="This confirmation step reassures users and gives a quick retry action."
      visualBullets={[
        "Immediate recovery confirmation",
        "Resend action without leaving flow",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Success"
        title="Check your email"
        description={
          email
            ? `We've sent password reset instructions to ${email}.`
            : "We've sent password reset instructions to your email."
        }
      />

      <div className="space-y-3 px-1 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
          <span>If you don't see the email, check your spam or junk folder.</span>
        </div>
        <div className="flex items-start gap-2">
          <Mail size={16} className="mt-0.5 text-slate-500" />
          <span>The link will expire in 15 minutes.</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Link to={PATHS.LOGIN} className="auth-cta text-center">
          Back to Sign In
        </Link>
        <button
          type="button"
          onClick={handleResend}
          className="auth-cta-secondary gap-2"
          disabled={!canResend || isResending}
        >
          <RefreshCcw size={15} />
          {isResending ? "Resending..." : "Resend email"}
        </button>
      </div>

      {(error || success) && (
        <div className="mt-3">
          {error && <AuthAlert type="danger" message={error} />}
          {success && <AuthAlert type="success" message={success} />}
        </div>
      )}
    </AuthShell>
  );
}
