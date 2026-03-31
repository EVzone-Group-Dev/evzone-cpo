import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleHomePath } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import { fetchJson } from '@/core/api/fetchJson'
import { useDemoUsers } from '@/core/hooks/usePlatformData'
import type { LoginResponse } from '@/core/types/mockApi'
import { Zap } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('admin@evzone.io')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const { data: demoUsers = [] } = useDemoUsers()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const auth = await fetchJson<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const bearerToken = auth.accessToken ?? auth.token
      if (!bearerToken) {
        throw new Error('Login response missing access token.')
      }

      setUser(auth.user, bearerToken)
      navigate(getRoleHomePath(auth.user.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, var(--info), transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--accent)' }}>
            <Zap size={28} color="#0d1117" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>EVzone CPO Central</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Charge Point Operator Platform</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div className="alert danger text-sm">{error}</div>}

          <button type="submit" className="btn primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-4 card-glass text-[11px]" style={{ padding: '0.75rem 1rem', borderRadius: 10 }}>
          <p className="font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Demo Accounts</p>
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              className="block w-full text-left hover:underline"
              style={{ color: 'var(--accent)', lineHeight: 1.8 }}
              onClick={() => { setEmail(u.email); setPassword(u.password) }}
            >
              {u.name} — {u.email}
            </button>
          ))}
          {demoUsers.length === 0 && (
            <p style={{ color: 'var(--text-subtle)' }}>Loading demo accounts...</p>
          )}
        </div>
      </div>
    </div>
  )
}
