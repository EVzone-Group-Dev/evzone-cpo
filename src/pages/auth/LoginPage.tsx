import { startAuthentication } from '@simplewebauthn/browser'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleHomePath } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { fetchJson } from '@/core/api/fetchJson'
import type {
  LoginResponse,
  PasskeyLoginOptionsResponse,
  PasskeyLoginVerifyRequest,
} from '@/core/types/mockApi'
import { useBranding } from '@/core/branding/useBranding'
import { LOGO_PATHS } from '@/utils/assets'
import { ShieldCheck, Zap } from 'lucide-react'

type LoginMode = 'passkey' | 'password'
type PasswordMfaMethod = 'totp' | 'recovery'

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
  const [loginMode, setLoginMode] = useState<LoginMode>(
    passkeySupported ? 'passkey' : 'password',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [passwordMfaMethod, setPasswordMfaMethod] =
    useState<PasswordMfaMethod>('totp')
  const [showPasswordMfaFields, setShowPasswordMfaFields] = useState(false)
  const [error, setError] = useState('')
  const [loadingMode, setLoadingMode] = useState<LoginMode | null>(null)
  const { setUser } = useAuthStore()
  const { branding } = useBranding()
  const navigate = useNavigate()
  const logoUrl = branding.branding.logoUrl || LOGO_PATHS.cpms

  const applySuccessfulAuth = (auth: LoginResponse) => {
    const bearerToken = auth.accessToken ?? auth.token
    if (!bearerToken) {
      throw new Error('Login response missing access token.')
    }

    setUser(auth.user, bearerToken, auth.refreshToken ?? null)
    navigate(getRoleHomePath(auth.user), { replace: true })
  }

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoadingMode('password')

    try {
      const payload: {
        email: string
        password: string
        twoFactorToken?: string
        recoveryCode?: string
      } = {
        email,
        password,
      }

      if (showPasswordMfaFields) {
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
      if (messageIndicatesMfaStep(message)) {
        setShowPasswordMfaFields(true)
      }
      if (messageIndicatesPasskey(message) && passkeySupported) {
        setLoginMode('passkey')
      }
      setError(message)
    } finally {
      setLoadingMode(null)
    }
  }

  const handlePasskeyLogin = async (e: FormEvent) => {
    e.preventDefault()
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, var(--accent), transparent)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--info), transparent)' }}
        />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          {branding.branding.logoUrl ? (
            <img
              src={logoUrl}
              alt={branding.branding.shortName}
              className="h-14 mx-auto mb-4 object-contain"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'var(--accent)' }}
            >
              <Zap size={28} color="var(--accent-ink)" />
            </div>
          )}
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
            {branding.branding.appName}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {branding.support.email
              ? `Support: ${branding.support.email}`
              : 'Charge Point Operator Platform'}
          </p>
        </div>

        <div className="card space-y-4">
          <div className="rounded-xl border border-border/70 bg-bg-muted/35 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                className={`btn ${loginMode === 'passkey' ? 'primary' : 'secondary'} h-9 text-xs`}
                onClick={() => setLoginMode('passkey')}
                disabled={!passkeySupported}
              >
                Passkey
              </button>
              <button
                type="button"
                className={`btn ${loginMode === 'password' ? 'primary' : 'secondary'} h-9 text-xs`}
                onClick={() => setLoginMode('password')}
              >
                Password + MFA
              </button>
            </div>
          </div>

          <form
            onSubmit={loginMode === 'passkey' ? handlePasskeyLogin : handlePasswordLogin}
            className="space-y-4"
          >
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>

            {loginMode === 'password' && (
              <>
                <div>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                {showPasswordMfaFields && (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-bg-muted/25 p-3">
                    <div className="flex items-center gap-2 text-xs text-subtle">
                      <ShieldCheck size={14} />
                      Additional verification is required
                    </div>
                    <div className="flex gap-2">
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

                    {passwordMfaMethod === 'totp' ? (
                      <div>
                        <label className="form-label">Authenticator Code</label>
                        <input
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
                        <label className="form-label">Recovery Code</label>
                        <input
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
              </>
            )}

            {error && <div className="alert danger text-sm">{error}</div>}

            <button
              type="submit"
              className="btn primary w-full"
              disabled={loadingMode !== null}
            >
              {loadingMode === 'passkey'
                ? 'Verifying passkey...'
                : loadingMode === 'password'
                  ? 'Signing in...'
                  : loginMode === 'passkey'
                    ? 'Sign in with passkey'
                    : 'Sign in with password'}
            </button>

            {loginMode === 'passkey' && !passkeySupported && (
              <div className="text-xs text-warning">
                Passkeys are not available in this browser. Use Password + MFA.
              </div>
            )}
          </form>
        </div>

        {(branding.legal.termsUrl || branding.legal.privacyUrl) && (
          <div
            className="mt-4 flex items-center justify-center gap-3 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
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
