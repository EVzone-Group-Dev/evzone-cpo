import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthAlert, AuthHeading, AuthTextField } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { submitResetPassword } from "@/core/api/auth";
import { PATHS } from "@/router/paths";

function buildQueryParams(search: string) {
  const query = new URLSearchParams(search);
  return {
    token: query.get("token")?.trim() ?? "",
    code: query.get("code")?.trim() ?? "",
    email: query.get("email")?.trim() ?? "",
  };
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, code: initialCode, email: initialEmail } = useMemo(
    () => buildQueryParams(location.search),
    [location.search],
  );

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsManualCode = token.length === 0;
  const needsManualEmail = needsManualCode && initialEmail.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (needsManualCode && code.trim().length === 0) {
      setError("Reset code is required.");
      return;
    }

    if (needsManualEmail && email.trim().length === 0) {
      setError("Email is required for manual reset.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResetPassword({
        token: token || undefined,
        code: needsManualCode ? code.trim() : undefined,
        email: needsManualCode ? email.trim() || undefined : undefined,
        password,
        confirmPassword,
      });
      setSuccess("Password reset complete. Redirecting to sign in...");
      window.setTimeout(() => {
        navigate(PATHS.LOGIN, { replace: true });
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      visualTitle="Set a strong password with confidence."
      visualSubtitle="Security-focused reset flow optimized for desktop, tablet, and mobile."
      visualBullets={[
        "Guided reset with clear validation",
        "Fast path back to sign in after success",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Reset Password"
        title="Set a new password"
        description="Choose a strong password to secure your EVzone account."
      />

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {needsManualEmail && (
          <AuthTextField
            id="reset-email"
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={setEmail}
            placeholder="example@gmail.com"
            autoComplete="email"
            required
          />
        )}

        {needsManualCode && (
          <AuthTextField
            id="reset-code"
            label="Reset Code"
            icon={KeyRound}
            value={code}
            onChange={setCode}
            placeholder="Enter reset code"
            required
          />
        )}

        <AuthTextField
          id="reset-password"
          label="New Password"
          type={showPassword ? "text" : "password"}
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="********"
          autoComplete="new-password"
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

        <AuthTextField
          id="reset-password-confirm"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          icon={Lock}
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="********"
          autoComplete="new-password"
          required
          rightAddon={
            <button
              type="button"
              className="text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <p className="text-center text-xs text-slate-500">
          Use at least 8 characters with a mix of letters, numbers, and symbols.
        </p>

        {(error || success) && (
          <>
            {error && <AuthAlert type="danger" message={error} />}
            {success && <AuthAlert type="success" message={success} />}
          </>
        )}

        <button className="auth-cta" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save New Password"}
        </button>
      </form>
    </AuthShell>
  );
}

