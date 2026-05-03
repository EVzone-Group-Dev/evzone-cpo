import { Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthHeading } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import { PATHS } from "@/router/paths";

function browserSupportsPasskeys(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

export function MfaSelectionPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const passkeySupported = browserSupportsPasskeys();

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  if (!requiresMfaSetup(user)) {
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return (
    <AuthShell
      visualTitle="Choose your preferred security method."
      visualSubtitle="Set up one verification method now and add more later in account settings."
      visualBullets={[
        "Email/SMS code for straightforward delivery",
        "Authenticator app for offline time-based tokens",
        "Passkeys for biometric sign-in on supported devices",
      ]}
    >
      <AuthHeading
        badge="Auth Screens - Setup Method"
        title="Choose your verification method"
        description="Select how you'd like to verify your identity when signing in."
      />

      <div className="space-y-3">
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => navigate(PATHS.MFA_OTP_SETUP)}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">Email / SMS Code</div>
              <p className="mt-0.5 text-sm text-slate-600">
                Receive a one-time code via email or SMS.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
          onClick={() => navigate(PATHS.MFA_AUTHENTICATOR_SETUP)}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <Smartphone size={20} className="text-emerald-700" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">Authenticator App</div>
              <p className="mt-0.5 text-sm text-slate-600">
                Use rotating 6-digit codes from your authenticator app.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={!passkeySupported}
          className={`w-full rounded-xl border px-4 py-4 text-left transition ${
            passkeySupported
              ? "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
              : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          }`}
          onClick={() => navigate(PATHS.MFA_PASSKEY_SETUP)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2.5 ${
                passkeySupported ? "bg-amber-100" : "bg-slate-200"
              }`}
            >
              <Lock
                size={20}
                className={passkeySupported ? "text-amber-600" : "text-slate-400"}
              />
            </div>
            <div className="flex-1">
              <div
                className={`font-semibold ${
                  passkeySupported ? "text-slate-900" : "text-slate-600"
                }`}
              >
                Passkey
              </div>
              <p
                className={`mt-0.5 text-sm ${
                  passkeySupported ? "text-slate-600" : "text-slate-500"
                }`}
              >
                {passkeySupported
                  ? "Biometric or device-based sign-in."
                  : "Not supported in this browser."}
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} className="text-emerald-600" />
        You can configure additional verification methods later.
      </div>
    </AuthShell>
  );
}

