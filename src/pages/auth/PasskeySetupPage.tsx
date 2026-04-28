import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { startRegistration } from '@simplewebauthn/browser'
import { fetchJson } from '@/core/api/fetchJson'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import type { AuthenticatedApiUser } from '@/core/types/mockApi'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'

type PasskeyRegistrationOptionsResponse = {
  options: unknown
  challengeId: string
  expiresAt: string
}

type PasskeyRegistrationVerifyRequest = {
  challengeId: string
  response: unknown
}

type GenericSuccessResponse = {
  success: boolean
  message?: string
}

export function PasskeySetupPage() {
  const user = useAuthStore((state) => state.user)
  const replaceUser = useAuthStore((state) => state.replaceUser)
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)

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

  async function startPasskeySetup(): Promise<void> {
    setError('')
    setInfo('')
    setIsRegistering(true)

    try {
      const options = await fetchJson<PasskeyRegistrationOptionsResponse>(
        '/api/v1/auth/mfa/passkeys/registration/options',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const credentialResponse = await startRegistration({
        optionsJSON: options.options as any,
      })

      const verifyPayload: PasskeyRegistrationVerifyRequest = {
        challengeId: options.challengeId,
        response: credentialResponse,
      }

      await fetchJson<GenericSuccessResponse>(
        '/api/v1/auth/mfa/passkeys/registration/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        },
      )

      setIsSetupComplete(true)
      setInfo('Passkey has been registered successfully!')
      setTimeout(() => {
        void refreshUserAndContinue()
      }, 1500)
    } catch (err) {
      let errorMessage = 'Unable to register passkey.'
      if (err instanceof Error) {
        if (err.message.includes('NotAllowedError')) {
          errorMessage = 'Passkey registration was cancelled or timed out.'
        } else if (err.message.includes('InvalidStateError')) {
          errorMessage = 'A passkey action is already in progress. Try again.'
        } else if (err.message.includes('AbortError')) {
          errorMessage = 'Passkey registration was interrupted. Please try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f8] px-3 py-5 sm:px-4 sm:py-8">
      <div className="w-full max-w-[36rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => navigate(PATHS.MFA_SELECTION)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          disabled={isRegistering || isSetupComplete}
        >
          <ArrowLeft size={16} />
          Back to options
        </button>

        <div className="mb-6">
          <div className={`flex items-center gap-2 ${isSetupComplete ? 'text-green-600' : 'text-amber-600'}`}>
            {isSetupComplete ? <CheckCircle size={16} /> : <Lock size={16} />}
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              {isSetupComplete ? 'Setup Complete' : 'Passkey Setup'}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            {isSetupComplete ? 'Passkey registered' : 'Register a passkey'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSetupComplete
              ? 'You can now use your passkey to sign in securely.'
              : 'Use your device\'s built-in biometric or security key for fast and secure sign-in.'}
          </p>
        </div>

        {!isSetupComplete && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Follow the prompts to register your biometric or security key. This will be used
                for passwordless sign-in.
              </p>
            </div>

            <button
              type="button"
              className="btn primary w-full"
              onClick={() => {
                void startPasskeySetup()
              }}
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering passkey...' : 'Register passkey'}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Supported methods include fingerprint, face recognition, or security key.
            </p>
          </div>
        )}

        {isSetupComplete && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="mb-4 text-center">
              <CheckCircle size={48} className="mx-auto text-green-600" />
            </div>
            <p className="text-center text-sm font-medium text-green-900">
              Your passkey has been successfully registered. You'll be redirected to the dashboard shortly.
            </p>
          </div>
        )}

        {info && <div className="alert success mt-4 text-sm">{info}</div>}
        {error && <div className="alert danger mt-4 text-sm">{error}</div>}
      </div>
    </div>
  )
}
