import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { fetchJson } from '@/core/api/fetchJson'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { Lock, Mail, ShieldCheck, Smartphone } from 'lucide-react'

type SetupMethod = 'otp' | 'authenticator'
type OtpChannel = 'email' | 'sms'

type OtpSetupSendResponse = {
  success: boolean
  channel: OtpChannel
  destination: string
  expiresAt: string
}

type AuthenticatorSetupResponse = {
  qrCodeUrl: string
  secret: string
}

type GenericSuccessResponse = {
  success: boolean
  message?: string
}

export function MfaSetupPage() {
  const user = useAuthStore((state) => state.user)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const navigate = useNavigate()
  const [method, setMethod] = useState<SetupMethod>('otp')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email')
  const [otpCode, setOtpCode] = useState('')
  const [setupPhone, setSetupPhone] = useState(user?.phone || '')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [authenticatorToken, setAuthenticatorToken] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [manualSecret, setManualSecret] = useState('')
  const [authenticatorGenerating, setAuthenticatorGenerating] = useState(false)
  const [authenticatorVerifying, setAuthenticatorVerifying] = useState(false)

  const hasEmail = Boolean(user?.email?.trim())
  const hasPhone = Boolean(user?.phone?.trim())

  const availableOtpChannels = useMemo(() => {
    const channels: OtpChannel[] = []
    if (hasEmail) {
      channels.push('email')
    }
    // Always allow SMS option so user can provide a phone number if missing
    channels.push('sms')
    return channels
  }, [hasEmail])

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  if (!requiresMfaSetup(user)) {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  async function refreshUserAndContinue(): Promise<void> {
    const refreshedUser = await fetchJson<AuthenticatedApiUser>('/api/v1/users/me')
    replaceUser(refreshedUser)
    navigate(getRoleHomePath(refreshedUser), { replace: true })
  }

  async function sendOtpCode(): Promise<void> {
    setError('')
    setInfo('')
    setOtpSending(true)

    try {
      if (availableOtpChannels.length === 0) {
        throw new Error('No email or phone is available for OTP delivery on this account.')
      }

      const resolvedChannel = otpChannel

      if (resolvedChannel === 'sms' && !setupPhone.trim()) {
        throw new Error('Please enter a phone number for SMS delivery.')
      }

      const response = await fetchJson<OtpSetupSendResponse>(
        '/api/v1/auth/mfa/setup/otp/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            channel: resolvedChannel,
            phone: resolvedChannel === 'sms' ? setupPhone : undefined 
          }),
        },
      )

      setOtpChannel(response.channel)
      setInfo(`OTP sent to ${response.destination}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP.')
    } finally {
      setOtpSending(false)
    }
  }

  async function verifyOtpSetup(): Promise<void> {
    setError('')
    setInfo('')
    setOtpVerifying(true)

    try {
      const code = otpCode.trim()
      if (!code) {
        throw new Error('Enter the OTP code sent to you.')
      }

      await fetchJson<GenericSuccessResponse>('/api/v1/auth/mfa/setup/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      setInfo('OTP-based MFA is now enabled.')
      await refreshUserAndContinue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify OTP.')
    } finally {
      setOtpVerifying(false)
    }
  }

  async function generateAuthenticator(): Promise<void> {
    setError('')
    setInfo('')
    setAuthenticatorGenerating(true)

    try {
      const password = currentPassword.trim()
      if (!password) {
        throw new Error('Current password is required to set up authenticator MFA.')
      }

      const setup = await fetchJson<AuthenticatorSetupResponse>('/api/v1/auth/2fa/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword: password }),
      })

      setQrCodeUrl(setup.qrCodeUrl)
      setManualSecret(setup.secret)
      setInfo('Scan the QR code in your authenticator app, then verify with a 6-digit code.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate authenticator secret.')
    } finally {
      setAuthenticatorGenerating(false)
    }
  }

  async function verifyAuthenticatorSetup(): Promise<void> {
    setError('')
    setInfo('')
    setAuthenticatorVerifying(true)

    try {
      const token = authenticatorToken.trim()
      if (!token) {
        throw new Error('Enter the authenticator app code to finish setup.')
      }

      await fetchJson<GenericSuccessResponse>('/api/v1/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      setInfo('Authenticator MFA is now enabled.')
      await refreshUserAndContinue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify authenticator code.')
    } finally {
      setAuthenticatorVerifying(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f8] px-3 py-5 sm:px-4 sm:py-8">
      <div className="w-full max-w-[36rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Security Setup Required
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Set up multi-factor authentication
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Before accessing your dashboard, choose a verification method for this account.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`rounded-xl border px-3 py-3 text-left transition ${
              method === 'otp'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => {
              setMethod('otp')
              setError('')
              setInfo('')
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Mail size={15} />
              OTP via Email / SMS
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Receive a one-time code each time you sign in.
            </p>
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-3 text-left transition ${
              method === 'authenticator'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => {
              setMethod('authenticator')
              setError('')
              setInfo('')
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Smartphone size={15} />
              Authenticator App
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Use your authenticator app for time-based verification codes.
            </p>
          </button>
        </div>

        {method === 'otp' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">OTP setup</div>

            <div className="mt-3">
              <label htmlFor="otp-channel" className="mb-1 block text-xs font-semibold text-slate-700">
                Delivery Channel
              </label>
              <select
                id="otp-channel"
                className="input"
                value={otpChannel}
                onChange={(event) => setOtpChannel(event.target.value as OtpChannel)}
                disabled={availableOtpChannels.length === 0}
              >
                <option value="email" disabled={!hasEmail}>Email</option>
                <option value="sms">SMS</option>
              </select>

              {otpChannel === 'sms' && (
                <div className="mt-3">
                  <label htmlFor="setup-phone" className="mb-1 block text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    id="setup-phone"
                    type="tel"
                    className="input"
                    value={setupPhone}
                    onChange={(event) => setSetupPhone(event.target.value)}
                    placeholder="+1234567890"
                  />
                  {!hasPhone && (
                    <p className="mt-1 text-xs text-slate-500">
                      Enter your phone number to receive the OTP via SMS.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  void sendOtpCode()
                }}
                disabled={otpSending || otpVerifying}
              >
                {otpSending ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>

            <div className="mt-3">
              <label htmlFor="setup-otp-code" className="mb-1 block text-xs font-semibold text-slate-700">
                OTP Code
              </label>
              <input
                id="setup-otp-code"
                type="text"
                className="input"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>

            <button
              type="button"
              className="btn primary mt-3"
              onClick={() => {
                void verifyOtpSetup()
              }}
              disabled={otpSending || otpVerifying}
            >
              {otpVerifying ? 'Verifying...' : 'Enable OTP MFA'}
            </button>
          </div>
        )}

        {method === 'authenticator' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Authenticator setup</div>

            <div className="mt-3">
              <label htmlFor="setup-current-password" className="mb-1 block text-xs font-semibold text-slate-700">
                Current Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="setup-current-password"
                  type="password"
                  className="input pl-10"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
            </div>

            <button
              type="button"
              className="btn secondary mt-3"
              onClick={() => {
                void generateAuthenticator()
              }}
              disabled={authenticatorGenerating || authenticatorVerifying}
            >
              {authenticatorGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>

            {qrCodeUrl && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <img
                  src={qrCodeUrl}
                  alt="Authenticator QR Code"
                  className="mx-auto h-40 w-40 rounded-md border border-slate-200 bg-white p-1"
                />
                <p className="mt-2 text-center text-xs text-slate-600">
                  Manual setup key: <span className="font-mono">{manualSecret}</span>
                </p>
              </div>
            )}

            <div className="mt-3">
              <label htmlFor="setup-authenticator-token" className="mb-1 block text-xs font-semibold text-slate-700">
                Authenticator Code
              </label>
              <input
                id="setup-authenticator-token"
                type="text"
                className="input"
                value={authenticatorToken}
                onChange={(event) => setAuthenticatorToken(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </div>

            <button
              type="button"
              className="btn primary mt-3"
              onClick={() => {
                void verifyAuthenticatorSetup()
              }}
              disabled={authenticatorGenerating || authenticatorVerifying}
            >
              {authenticatorVerifying ? 'Verifying...' : 'Enable Authenticator MFA'}
            </button>
          </div>
        )}

        {info && (
          <div className="alert success mt-4 text-sm">{info}</div>
        )}
        {error && (
          <div className="alert danger mt-4 text-sm">{error}</div>
        )}
      </div>
    </div>
  )
}
