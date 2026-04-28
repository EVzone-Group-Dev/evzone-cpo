import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { fetchJson } from '@/core/api/fetchJson'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { ArrowLeft, Mail, Phone } from 'lucide-react'

type OtpChannel = 'email' | 'sms'

type OtpSetupSendResponse = {
  success: boolean
  channel: OtpChannel
  destination: string
  expiresAt: string
}

type GenericSuccessResponse = {
  success: boolean
  message?: string
}

export function OtpSetupPage() {
  const user = useAuthStore((state) => state.user)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('email')
  const [setupPhone, setSetupPhone] = useState(user?.phone || '')
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const hasEmail = Boolean(user?.email?.trim())
  const hasPhone = Boolean(user?.phone?.trim())

  const availableOtpChannels = useMemo(() => {
    const channels: OtpChannel[] = []
    if (hasEmail) {
      channels.push('email')
    }
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
            phone: resolvedChannel === 'sms' ? setupPhone : undefined,
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f8] px-3 py-5 sm:px-4 sm:py-8">
      <div className="w-full max-w-[36rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => navigate(PATHS.MFA_SELECTION)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to options
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-blue-600">
            <Mail size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Email / SMS Verification
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Set up one-time codes
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Receive verification codes via email or SMS when you sign in.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label htmlFor="otp-channel" className="mb-2 block text-xs font-semibold text-slate-700">
              Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                  otpChannel === 'email'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setOtpChannel('email')}
                disabled={!hasEmail}
              >
                <Mail size={14} className="mb-1 inline-block mr-1" />
                Email
              </button>
              <button
                type="button"
                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                  otpChannel === 'sms'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setOtpChannel('sms')}
              >
                <Phone size={14} className="mb-1 inline-block mr-1" />
                SMS
              </button>
            </div>
          </div>

          {otpChannel === 'sms' && (
            <div>
              <label htmlFor="setup-phone" className="mb-2 block text-xs font-semibold text-slate-700">
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
                  Enter your phone number to receive verification codes via SMS.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn secondary w-full"
            onClick={() => {
              void sendOtpCode()
            }}
            disabled={otpSending || otpVerifying}
          >
            {otpSending ? 'Sending code...' : 'Send verification code'}
          </button>

          <div>
            <label htmlFor="setup-otp-code" className="mb-2 block text-xs font-semibold text-slate-700">
              Enter the code you received
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
            className="btn primary w-full"
            onClick={() => {
              void verifyOtpSetup()
            }}
            disabled={otpSending || otpVerifying}
          >
            {otpVerifying ? 'Verifying...' : 'Verify and enable MFA'}
          </button>
        </div>

        {info && <div className="alert success mt-4 text-sm">{info}</div>}
        {error && <div className="alert danger mt-4 text-sm">{error}</div>}
      </div>
    </div>
  )
}
