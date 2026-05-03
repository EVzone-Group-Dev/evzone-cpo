export type OtpChannel = "email" | "sms";

export interface AuthActionResponse {
  success: boolean;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse extends AuthActionResponse {
  email?: string;
  expiresAt?: string;
}

export interface ForgotPasswordResendRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token?: string;
  code?: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyAccountRequest {
  email: string;
  code: string;
}

export interface VerifyAccountResendRequest {
  email: string;
}

export interface PendingAuthChallengeContext {
  email: string;
  password: string;
  otpMethodAvailable: boolean;
  suggestedChannel: OtpChannel | null;
  createdAtMs: number;
  expiresAtMs: number;
}

