import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchJson } from '@/core/api/fetchJson'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import { Mail, Smartphone, Lock, Plus, Trash2 } from 'lucide-react'

type MfaMethodResponse = {
  mfaType: 'otp' | 'authenticator' | 'passkey' | null
  methods: Array<{
    type: 'otp' | 'authenticator' | 'passkey'
    label: string
    enabled: boolean
  }>
}

export function MfaManagementSection() {
  const user = useAuthStore((state) => state.user)
  const reloadUser = useAuthStore((state) => state.replaceUser)
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentMfaType = user?.mfaType

  const mfaMethods = [
    { type: 'otp' as const, label: 'Email / SMS Code', icon: Mail, color: 'blue' },
    { type: 'authenticator' as const, label: 'Authenticator App', icon: Smartphone, color: 'purple' },
    { type: 'passkey' as const, label: 'Passkey', icon: Lock, color: 'amber' },
  ]

  async function removeMfaMethod(methodType: string): Promise<void> {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetchJson<MfaMethodResponse>(
        `/api/v1/users/${user?.id}/mfa/${methodType}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      setSuccess(`${methodType} MFA has been removed.`)
      // Reload user to get updated MFA info
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove MFA method.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMfa = (): void => {
    navigate(PATHS.MFA_SELECTION)
  }

  if (!user?.mfaEnabled) {
    return null
  }

  return (
    <div className="rounded-3xl border border-[var(--border)]/60 bg-[var(--bg-card)] p-6 shadow-xl shadow-black/5">
      <div className="mb-6">
        <h4 className="text-sm font-bold text-[var(--text)] mb-1">Verification Methods</h4>
        <p className="text-[11px] text-[var(--text-subtle)] font-medium">
          {currentMfaType
            ? `Currently using: ${currentMfaType === 'otp' ? 'Email / SMS Code' : currentMfaType === 'authenticator' ? 'Authenticator App' : 'Passkey'}`
            : 'No MFA method configured'}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {mfaMethods.map((method) => {
          const Icon = method.icon
          const isActive = currentMfaType === method.type
          return (
            <div
              key={method.type}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-accent/10 to-transparent border-accent/50'
                  : 'bg-[var(--bg-muted)]/30 border-[var(--border)]/40 hover:border-[var(--border)]/60'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`flex-shrink-0 p-2 rounded-lg ${
                    method.color === 'blue'
                      ? 'bg-blue-100'
                      : method.color === 'purple'
                        ? 'bg-purple-100'
                        : 'bg-amber-100'
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      method.color === 'blue'
                        ? 'text-blue-600'
                        : method.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-amber-600'
                    }
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">{method.label}</div>
                  {isActive && <div className="text-[10px] text-accent font-bold">Active</div>}
                </div>
              </div>
              {isActive && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    void removeMfaMethod(method.type)
                  }}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                  title={`Remove ${method.label}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleAddMfa}
        disabled={isLoading}
        className="btn secondary w-full text-xs py-2"
      >
        <Plus size={14} />
        Add another verification method
      </button>

      {error && <div className="alert danger mt-3 text-xs">{error}</div>}
      {success && <div className="alert success mt-3 text-xs">{success}</div>}
    </div>
  )
}
