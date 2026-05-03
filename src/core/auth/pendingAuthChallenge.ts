import type {
  OtpChannel,
  PendingAuthChallengeContext,
} from "@/core/types/authFlows";

const PENDING_AUTH_CHALLENGE_TTL_MS = 10 * 60 * 1000;

let pendingAuthChallenge: PendingAuthChallengeContext | null = null;

interface PendingAuthChallengeInput {
  email: string;
  password: string;
  otpMethodAvailable: boolean;
  suggestedChannel?: OtpChannel | null;
}

export function setPendingAuthChallenge(input: PendingAuthChallengeInput): void {
  const createdAtMs = Date.now();
  pendingAuthChallenge = {
    email: input.email,
    password: input.password,
    otpMethodAvailable: input.otpMethodAvailable,
    suggestedChannel: input.suggestedChannel ?? null,
    createdAtMs,
    expiresAtMs: createdAtMs + PENDING_AUTH_CHALLENGE_TTL_MS,
  };
}

export function getPendingAuthChallenge(): PendingAuthChallengeContext | null {
  if (!pendingAuthChallenge) {
    return null;
  }

  if (Date.now() >= pendingAuthChallenge.expiresAtMs) {
    pendingAuthChallenge = null;
    return null;
  }

  return pendingAuthChallenge;
}

export function clearPendingAuthChallenge(): void {
  pendingAuthChallenge = null;
}

