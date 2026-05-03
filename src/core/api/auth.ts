import { fetchJson } from "@/core/api/fetchJson";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResendRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  VerifyAccountRequest,
  VerifyAccountResendRequest,
  AuthActionResponse,
} from "@/core/types/authFlows";
import type {
  LoginResponse,
  PasskeyLoginOptionsResponse,
  PasskeyLoginVerifyRequest,
} from "@/core/types/mockApi";

interface PasswordLoginPayload {
  email: string;
  password: string;
  otpCode?: string;
  otpChannel?: "email" | "sms";
  twoFactorToken?: string;
  recoveryCode?: string;
}

function jsonHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

export function loginWithPassword(payload: PasswordLoginPayload) {
  return fetchJson<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function requestPasskeyLoginOptions(email: string) {
  return fetchJson<PasskeyLoginOptionsResponse>(
    "/api/v1/auth/mfa/passkeys/login/options",
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email }),
    },
  );
}

export function verifyPasskeyLogin(payload: PasskeyLoginVerifyRequest) {
  return fetchJson<LoginResponse>("/api/v1/auth/mfa/passkeys/login/verify", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function requestForgotPassword(payload: ForgotPasswordRequest) {
  return fetchJson<ForgotPasswordResponse>("/api/v1/auth/forgot-password", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function resendForgotPassword(payload: ForgotPasswordResendRequest) {
  return fetchJson<ForgotPasswordResponse>("/api/v1/auth/forgot-password/resend", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function submitResetPassword(payload: ResetPasswordRequest) {
  return fetchJson<AuthActionResponse>("/api/v1/auth/reset-password", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function submitVerifyAccount(payload: VerifyAccountRequest) {
  return fetchJson<AuthActionResponse>("/api/v1/auth/verify-account", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export function resendVerifyAccount(payload: VerifyAccountResendRequest) {
  return fetchJson<AuthActionResponse>("/api/v1/auth/verify-account/resend", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

