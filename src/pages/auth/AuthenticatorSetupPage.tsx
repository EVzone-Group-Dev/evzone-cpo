import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { fetchJson } from '@/core/api/fetchJson'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { ArrowLeft, Lock, Smartphone } from 'lucide-react'

type AuthenticatorSetupResponse = {
  qrCodeUrl: string
  secret: string
}

type GenericSuccessResponse = {
  success: boolean
  message?: string
}

export function AuthenticatorSetupPage() {
  const user = useAuthStore((state) => state.user)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [authenticatorToken, setAuthenticatorToken] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [manualSecret, setManualSecret] = useState('')
  const [authenticatorGenerating, setAuthenticatorGenerating] = useState(false)
  const [authenticatorVerifying, setAuthenticatorVerifying] = useState(false)

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

  async function generateAuthenticator(): Promise<void> {
    setError('')
    setInfo('')
    setAuthenticatorGenerating(true)

    try {
      const password = currentPassword.trim()
      if (!password) {
        throw new Error('Current password is required to set up authenticator MFA.')
      }

      const setup = await fetchJson<AuthenticatorSetupResponse>(
        '/api/v1/auth/2fa/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentPassword: password }),
        },
      )

      setQrCodeUrl(setup.qrCodeUrl)
      setManualSecret(setup.secret)
      setInfo('Scan the QR code in your authenticator app, then enter the 6-digit code to verify.')
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
        <button
          type="button"
          onClick={() => navigate(PATHS.MFA_SELECTION)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to options
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-purple-600">
            <Smartphone size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Authenticator App Setup
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Set up authenticator
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy for time-based verification codes.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {!qrCodeUrl ? (
            <>
              <div>
                <label
                  htmlFor="setup-current-password"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
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
                className="btn secondary w-full"
                onClick={() => {
                  void generateAuthenticator()
                }}
                disabled={authenticatorGenerating || authenticatorVerifying}
              >
                {authenticatorGenerating ? 'Generating code...' : 'Generate QR Code'}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-3 text-center text-xs font-semibold text-slate-700">
                  Scan this code with your authenticator app
                </p>
                <img
                  src={qrCodeUrl}
                  alt="Authenticator QR Code"
                  className="mx-auto h-52 w-52 rounded-md border border-slate-200 bg-white p-2"
                />
                <div className="mt-4 rounded-lg bg-slate-100 p-3">
                  <p className="text-center text-xs font-semibold text-slate-600">
                    Manual setup key:
                  </p>
                  <p className="mt-1 text-center font-mono text-sm font-bold text-slate-900">
                    {manualSecret}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="setup-authenticator-token"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Enter the 6-digit code from your app
                </label>
                <input
                  id="setup-authenticator-token"
                  type="text"
                  className="input text-center tracking-widest"
                  value={authenticatorToken}
                  onChange={(event) => setAuthenticatorToken(event.target.value)}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>

              <button
                type="button"
                className="btn primary w-full"
                onClick={() => {
                  void verifyAuthenticatorSetup()
                }}
                disabled={authenticatorGenerating || authenticatorVerifying}
              >
                {authenticatorVerifying ? 'Verifying...' : 'Verify and enable MFA'}
              </button>

              <button
                type="button"
                className="btn secondary w-full"
                onClick={() => {
                  setQrCodeUrl('')
                  setManualSecret('')
                  setAuthenticatorToken('')
                  setCurrentPassword('')
                  setError('')
                  setInfo('')
                }}
              >
                Try again
              </button>
            </>
          )}
        </div>

        {info && <div className="alert success mt-4 text-sm">{info}</div>}
        {error && <div className="alert danger mt-4 text-sm">{error}</div>}
      </div>
    </div>
  )
}
