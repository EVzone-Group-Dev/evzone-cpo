import { startAuthentication } from '@simplewebauthn/browser'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { fetchJson } from '@/core/api/fetchJson'
import type {
  LoginResponse,
  PasskeyLoginOptionsResponse,
  PasskeyLoginVerifyRequest,
} from '@/core/types/mockApi'
import { useBranding } from '@/core/branding/useBranding'
import { PATHS } from '@/router/paths'
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react'

type LoadingMode = 'passkey' | 'password'
type PasswordMfaMethod = 'otp' | 'totp' | 'recovery'
type OtpChannel = 'email' | 'sms'
const DEFAULT_LOGIN_LOGO_PATH = '/assets/logos/evzone-charging-landscape.png'

function browserSupportsPasskeys(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  )
}

function messageIndicatesMfaStep(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('mfa token is required') ||
    normalized.includes('two-factor') ||
    normalized.includes('recovery code')
  )
}

function messageIndicatesPasskey(message: string): boolean {
  return message.toLowerCase().includes('passkey verification is required')
}

function messageIndicatesOtpStep(message: string): boolean {
  return message.toLowerCase().includes('otp verification is required')
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('NotAllowedError')) {
      return 'Passkey request was cancelled or timed out.'
    }
    if (error.message.includes('InvalidStateError')) {
      return 'A passkey action is already in progress. Try again.'
    }
    if (error.message.includes('AbortError')) {
      return 'Passkey request was interrupted. Please try again.'
    }
    return error.message
  }
  return 'Unable to sign in.'
}

export function LoginPage() {
  const passkeySupported = browserSupportsPasskeys()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [otpMethodAvailable, setOtpMethodAvailable] = useState(false)
  const [passwordMfaMethod, setPasswordMfaMethod] =
    useState<PasswordMfaMethod>('totp')
  const [showPasswordMfaFields, setShowPasswordMfaFields] = useState(false)
  const [error, setError] = useState('')
  const [loadingMode, setLoadingMode] = useState<LoadingMode | null>(null)
  const { setUser } = useAuthStore()
  const { branding } = useBranding()
  const navigate = useNavigate()
  const logoUrl = branding.branding.logoUrl || DEFAULT_LOGIN_LOGO_PATH

  const applySuccessfulAuth = (auth: LoginResponse): void => {
    const bearerToken = auth.accessToken ?? auth.token
    if (!bearerToken) {
      throw new Error('Login response missing access token.')
    }

    setUser(auth.user, bearerToken, auth.refreshToken ?? null)
    navigate(
      requiresMfaSetup(auth.user) ? PATHS.MFA_SETUP : getRoleHomePath(auth.user),
      { replace: true },
    )
  }

  const handlePasswordLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoadingMode('password')

    try {
      const payload: {
        email: string
        password: string
        otpCode?: string
        otpChannel?: OtpChannel
        twoFactorToken?: string
        recoveryCode?: string
      } = {
        email,
        password,
      }

      if (showPasswordMfaFields) {
        if (passwordMfaMethod === 'otp') {
          payload.otpChannel = otpChannel
          if (otpCode.trim().length > 0) {
            payload.otpCode = otpCode.trim()
          }
        }

        if (passwordMfaMethod === 'totp' && twoFactorToken.trim().length > 0) {
          payload.twoFactorToken = twoFactorToken.trim()
        }

        if (
          passwordMfaMethod === 'recovery' &&
          recoveryCode.trim().length > 0
        ) {
          payload.recoveryCode = recoveryCode.trim()
        }
      }

      const auth = await fetchJson<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      applySuccessfulAuth(auth)
    } catch (err) {
      const message = extractErrorMessage(err)
      if (messageIndicatesOtpStep(message)) {
        setOtpMethodAvailable(true)
        setPasswordMfaMethod('otp')
        setShowPasswordMfaFields(true)
      }
      if (messageIndicatesMfaStep(message)) {
        setOtpMethodAvailable(false)
        if (passwordMfaMethod === 'otp') {
          setPasswordMfaMethod('totp')
        }
        setShowPasswordMfaFields(true)
      }
      if (messageIndicatesPasskey(message) && passkeySupported) {
        setError('Passkey verification is required. Use "Sign in with Passkey".')
      } else {
        setError(message)
      }
    } finally {
      setLoadingMode(null)
    }
  }

  const handlePasskeyLogin = async (): Promise<void> => {
    setError('')
    setLoadingMode('passkey')

    try {
      if (!passkeySupported) {
        throw new Error(
          'This browser does not support passkeys. Use password + MFA.',
        )
      }
      if (!email.trim()) {
        throw new Error('Email is required for passkey sign-in.')
      }

      const options = await fetchJson<PasskeyLoginOptionsResponse>(
        '/api/v1/auth/mfa/passkeys/login/options',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        },
      )

      const credentialResponse = await startAuthentication({
        optionsJSON: options.options,
      })

      const verifyPayload: PasskeyLoginVerifyRequest = {
        challengeId: options.challengeId,
        response: credentialResponse,
      }

      const auth = await fetchJson<LoginResponse>(
        '/api/v1/auth/mfa/passkeys/login/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        },
      )

      applySuccessfulAuth(auth)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingMode(null)
    }
  }

  const shortBrandName = branding.branding.shortName?.trim() || branding.branding.appName
  const supportEmail = branding.support.email?.trim() ?? ''
  const forgotPasswordHref =
    supportEmail.length > 0
      ? `mailto:${supportEmail}?subject=${encodeURIComponent('Password reset request')}`
      : null
  const submittingPassword = loadingMode === 'password'
  const submittingPasskey = loadingMode === 'passkey'

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#f4f6f8] px-3 py-5 sm:items-center sm:px-4 sm:py-8">
      <div className="w-full max-w-[26rem]">
        <div className="mb-6 text-center sm:mb-8">
          <img
            src={logoUrl}
            alt={shortBrandName}
            className="mx-auto mb-4 h-auto w-full max-w-[260px] object-contain sm:mb-5 sm:max-w-[340px]"
          />
          <h1 className="text-[clamp(2rem,7vw,2.3rem)] font-extrabold leading-tight text-slate-900">
            Sign into {shortBrandName} Hub
          </h1>
          <p className="mx-auto mt-1 max-w-[32ch] text-[0.8rem] text-slate-500 sm:text-sm">
            Manage your charging stations anywhere
          </p>
        </div>

        <form onSubmit={handlePasswordLogin} className="space-y-3.5 sm:space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-2 block text-[0.84rem] font-semibold text-slate-700 sm:text-sm">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-email"
                type="email"
                className="input h-11 rounded-xl border-slate-300 bg-slate-100/90 pl-10 text-[0.84rem] text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white sm:text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="mb-2">
              <label htmlFor="login-password" className="block text-[0.84rem] font-semibold text-slate-700 sm:text-sm">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input h-11 rounded-xl border-slate-300 bg-slate-100/90 pl-10 pr-11 text-[0.84rem] text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white sm:text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              {forgotPasswordHref ? (
                <a
                  href={forgotPasswordHref}
                  className="text-[0.72rem] font-semibold text-amber-500 transition hover:text-amber-600 sm:text-xs"
                >
                  Forgot Password
                </a>
              ) : (
                <span className="text-[0.72rem] font-semibold text-slate-400 sm:text-xs">Forgot Password</span>
              )}
            </div>
          </div>

          {showPasswordMfaFields && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={14} />
                Additional verification is required
              </div>
              <div className="flex gap-2">
                {otpMethodAvailable && (
                  <button
                    type="button"
                    className={`btn ${passwordMfaMethod === 'otp' ? 'primary' : 'secondary'} h-8 text-xs`}
                    onClick={() => setPasswordMfaMethod('otp')}
                  >
                    OTP code
                  </button>
                )}
                <button
                  type="button"
                  className={`btn ${passwordMfaMethod === 'totp' ? 'primary' : 'secondary'} h-8 text-xs`}
                  onClick={() => setPasswordMfaMethod('totp')}
                >
                  Authenticator code
                </button>
                <button
                  type="button"
                  className={`btn ${passwordMfaMethod === 'recovery' ? 'primary' : 'secondary'} h-8 text-xs`}
                  onClick={() => setPasswordMfaMethod('recovery')}
                >
                  Recovery code
                </button>
              </div>

              {passwordMfaMethod === 'otp' ? (
                <div className="space-y-2">
                  <div>
                    <label htmlFor="login-otp-channel" className="mb-1 block text-xs font-semibold text-slate-600">
                      OTP Delivery Channel
                    </label>
                    <select
                      id="login-otp-channel"
                      className="input"
                      value={otpChannel}
                      onChange={(event) => setOtpChannel(event.target.value as OtpChannel)}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="login-otp-code" className="mb-1 block text-xs font-semibold text-slate-600">
                      OTP Code
                    </label>
                    <input
                      id="login-otp-code"
                      type="text"
                      className="input"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="123456"
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Submit login once to request a code, then submit again with the code.
                  </p>
                </div>
              ) : passwordMfaMethod === 'totp' ? (
                <div>
                  <label htmlFor="login-otp" className="mb-1 block text-xs font-semibold text-slate-600">
                    Authenticator Code
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    className="input"
                    value={twoFactorToken}
                    onChange={(event) => setTwoFactorToken(event.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="login-recovery-code"
                    className="mb-1 block text-xs font-semibold text-slate-600"
                  >
                    Recovery Code
                  </label>
                  <input
                    id="login-recovery-code"
                    type="text"
                    className="input"
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value)}
                    placeholder="ABCDE-12345"
                  />
                </div>
              )}
            </div>
          )}

          {error && <div className="alert danger text-sm">{error}</div>}

          <button
            type="submit"
            className="mt-1 h-11 w-full rounded-xl text-[0.84rem] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            style={{
              background: 'linear-gradient(135deg, #14C78B 0%, #12C197 100%)',
              boxShadow: '0 12px 20px -14px rgba(20, 199, 139, 0.95)',
            }}
            disabled={loadingMode !== null}
          >
            {submittingPassword ? 'Signing in...' : 'Login'}
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-xs">OR</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-[0.84rem] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            onClick={() => {
              void handlePasskeyLogin()
            }}
            disabled={loadingMode !== null || !passkeySupported}
          >
            {submittingPasskey ? (
              'Verifying passkey...'
            ) : (
              <>
                <KeyRound size={16} />
                Sign in with Passkey
              </>
            )}
          </button>

          {!passkeySupported && (
            <div className="text-[0.72rem] font-medium text-amber-600 sm:text-xs">
              Passkeys are not available in this browser. Use email and password instead.
            </div>
          )}
        </form>

        {(branding.legal.termsUrl || branding.legal.privacyUrl) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[0.72rem] text-slate-500 sm:mt-6 sm:text-xs">
            {branding.legal.termsUrl && (
              <a
                href={branding.legal.termsUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Terms
              </a>
            )}
            {branding.legal.privacyUrl && (
              <a
                href={branding.legal.privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Privacy
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
