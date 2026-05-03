import { Mail, Send, ArrowLeft } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAlert, AuthHeading, AuthTextField } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { requestForgotPassword } from "@/core/api/auth";
import { PATHS } from "@/router/paths";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await requestForgotPassword({ email: email.trim() });
      const normalizedEmail = email.trim();
      navigate(
        {
          pathname: PATHS.FORGOT_PASSWORD_SENT,
          search: `?email=${encodeURIComponent(normalizedEmail)}`,
        },
        {
          replace: true,
          state: { email: normalizedEmail },
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      visualTitle="Recover access without support delays."
      visualSubtitle="Users can request a reset link from any device and safely return to sign in."
      visualBullets={[
        "Secure email-driven recovery flow",
        "Guided next steps after request submission",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Forgot Password"
        title="Forgot your password?"
        description="Enter your email and we'll send you a secure reset link."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="forgot-email"
          label="Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="example@gmail.com"
          autoComplete="email"
          required
        />

        {error && <AuthAlert type="danger" message={error} />}

        <button className="auth-cta gap-2" type="submit" disabled={isSubmitting}>
          <Send size={16} />
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          to={PATHS.LOGIN}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
}
