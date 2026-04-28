import { Navigate, useNavigate } from 'react-router-dom'
import { getRoleHomePath, requiresMfaSetup } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import { Mail, Smartphone, Lock, ShieldCheck } from 'lucide-react'

function browserSupportsPasskeys(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  )
}

export function MfaSelectionPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const passkeySupported = browserSupportsPasskeys()

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  if (!requiresMfaSetup(user)) {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  const handleSelectOtp = (): void => {
    navigate(PATHS.MFA_OTP_SETUP)
  }

  const handleSelectAuthenticator = (): void => {
    navigate(PATHS.MFA_AUTHENTICATOR_SETUP)
  }

  const handleSelectPasskey = (): void => {
    if (!passkeySupported) {
      alert('Passkeys are not supported in this browser. Please choose another method.')
      return
    }
    navigate(PATHS.MFA_PASSKEY_SETUP)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f8] px-3 py-5 sm:px-4 sm:py-8">
      <div className="w-full max-w-[36rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Security Setup Required
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Choose your verification method
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Select how you'd like to verify your identity when signing in. You can add additional methods later.
          </p>
        </div>

        <div className="space-y-3">
          {/* OTP Option */}
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            onClick={handleSelectOtp}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Email / SMS Code</div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Receive a one-time code via email or SMS
                </p>
              </div>
            </div>
          </button>

          {/* Authenticator App Option */}
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            onClick={handleSelectAuthenticator}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <Smartphone size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Authenticator App</div>
                <p className="mt-0.5 text-sm text-slate-600">
                  Time-based codes from your authenticator app
                </p>
              </div>
            </div>
          </button>

          {/* Passkey Option */}
          <button
            type="button"
            disabled={!passkeySupported}
            className={`w-full rounded-xl border px-4 py-4 text-left transition ${
              passkeySupported
                ? 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
            onClick={handleSelectPasskey}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${
                passkeySupported
                  ? 'bg-amber-100'
                  : 'bg-slate-200'
              }`}>
                <Lock size={20} className={passkeySupported ? 'text-amber-600' : 'text-slate-400'} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${passkeySupported ? 'text-slate-900' : 'text-slate-600'}`}>
                  Passkey
                </div>
                <p className={`mt-0.5 text-sm ${passkeySupported ? 'text-slate-600' : 'text-slate-500'}`}>
                  {passkeySupported
                    ? 'Biometric or device-based sign-in'
                    : 'Not supported in this browser'}
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          You can configure additional verification methods in your account settings later.
        </p>
      </div>
    </div>
  )
}
