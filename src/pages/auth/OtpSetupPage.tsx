import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthAlert, AuthCodeInput, AuthHeading, AuthTextField } from "@/components/auth/AuthPrimitives";
import { AuthShell } from "@/components/auth/AuthShell";
import { fetchJson } from "@/core/api/fetchJson";
import { getRoleHomePath, requiresMfaSetup } from "@/core/auth/access";
import { useAuthStore } from "@/core/auth/authStore";
import type { OtpChannel } from "@/core/types/authFlows";
import type { AuthenticatedApiUser } from "@/core/types/mockApi";
import { PATHS } from "@/router/paths";

type OtpSetupSendResponse = {
  success: boolean;
  channel: OtpChannel;
  destination: string;
  expiresAt: string;
};

type GenericSuccessResponse = {
  success: boolean;
  message?: string;
};

export function OtpSetupPage() {
  const user = useAuthStore((state) => state.user);
  const replaceUser = useAuthStore((state) => state.replaceUser);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("email");
  const [setupPhone, setSetupPhone] = useState(user?.phone || "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const hasEmail = Boolean(user?.email?.trim());
  const hasPhone = Boolean(user?.phone?.trim());

  const availableOtpChannels = useMemo(() => {
    const channels: OtpChannel[] = [];
    if (hasEmail) {
      channels.push("email");
    }
    channels.push("sms");
    return channels;
  }, [hasEmail]);

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

  async function sendOtpCode(): Promise<void> {
    setError("");
    setInfo("");
    setOtpSending(true);

    try {
      if (availableOtpChannels.length === 0) {
        throw new Error("No email or phone is available for OTP delivery.");
      }

      if (otpChannel === "sms" && !setupPhone.trim()) {
        throw new Error("Please enter a phone number for SMS delivery.");
      }

      const response = await fetchJson<OtpSetupSendResponse>(
        "/api/v1/auth/mfa/setup/otp/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: otpChannel,
            phone: otpChannel === "sms" ? setupPhone : undefined,
          }),
        },
      );

      setOtpChannel(response.channel);
      setInfo(`OTP sent to ${response.destination}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP.");
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOtpSetup(): Promise<void> {
    setError("");
    setInfo("");
    setOtpVerifying(true);

    try {
      const code = otpCode.trim();
      if (!code) {
        throw new Error("Enter the OTP code sent to you.");
      }

      await fetchJson<GenericSuccessResponse>("/api/v1/auth/mfa/setup/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      setInfo("OTP-based MFA is now enabled.");
      await refreshUserAndContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP.");
    } finally {
      setOtpVerifying(false);
    }
  }

  return (
    <AuthShell
      visualTitle="Set up one-time verification codes."
      visualSubtitle="Use email or SMS delivery for reliable multi-factor sign-in."
      visualBullets={[
        "Choose OTP channel per user profile",
        "Complete setup with 6-digit verification",
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
        badge="Auth Screens - Verify Account"
        title="Set up one-time codes"
        description="Receive verification codes via email or SMS when you sign in."
      />

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Delivery Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                otpChannel === "email"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => setOtpChannel("email")}
              disabled={!hasEmail}
            >
              <Mail size={14} className="mb-0.5 mr-1 inline-block" />
              Email
            </button>
            <button
              type="button"
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                otpChannel === "sms"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => setOtpChannel("sms")}
            >
              <Phone size={14} className="mb-0.5 mr-1 inline-block" />
              SMS
            </button>
          </div>
        </div>

        {otpChannel === "sms" && (
          <AuthTextField
            id="setup-phone"
            label="Phone Number"
            type="tel"
            icon={Phone}
            value={setupPhone}
            onChange={setSetupPhone}
            placeholder="+1234567890"
          />
        )}

        {!hasPhone && otpChannel === "sms" && (
          <p className="text-xs text-slate-500">
            Enter your phone number to receive verification codes via SMS.
          </p>
        )}

        <button
          type="button"
          className="auth-cta-secondary gap-2"
          onClick={() => {
            void sendOtpCode();
          }}
          disabled={otpSending || otpVerifying}
        >
          <Mail size={15} />
          {otpSending ? "Sending code..." : "Send verification code"}
        </button>

        <div>
          <label className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700">
            Enter the code you received
          </label>
          <AuthCodeInput value={otpCode} onChange={setOtpCode} name="setupOtpCode" />
        </div>

        {(info || error) && (
          <>
            {info && <AuthAlert type="success" message={info} />}
            {error && <AuthAlert type="danger" message={error} />}
          </>
        )}

        <button
          type="button"
          className="auth-cta gap-2"
          onClick={() => {
            void verifyOtpSetup();
          }}
          disabled={otpSending || otpVerifying}
        >
          <ShieldCheck size={16} />
          {otpVerifying ? "Verifying..." : "Verify and enable MFA"}
        </button>
      </div>
    </AuthShell>
  );
}
