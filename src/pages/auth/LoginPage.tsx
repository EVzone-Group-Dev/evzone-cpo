import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/router/paths'
import { Zap } from 'lucide-react'
import type { CPOUser } from '@/core/types/domain'

// Demo credentials
const DEMO_USERS: (CPOUser & { password: string })[] = [
  { id: 'u1', name: 'Super Admin', email: 'admin@evzone.io', password: 'admin', role: 'SUPER_ADMIN', status: 'Active', mfaEnabled: false, createdAt: new Date().toISOString() },
  { id: 'u2', name: 'CPO Manager', email: 'manager@evzone.io', password: 'manager', role: 'CPO_ADMIN', status: 'Active', mfaEnabled: false, createdAt: new Date().toISOString() },
  { id: 'u3', name: 'Field Operator', email: 'operator@evzone.io', password: 'operator', role: 'OPERATOR', status: 'Active', mfaEnabled: false, createdAt: new Date().toISOString() },
]

export function LoginPage() {
  const [email, setEmail] = useState('admin@evzone.io')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const match = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (!match) { setError('Invalid credentials.'); setLoading(false); return }
    const { password: _pw, ...user } = match
    setUser(user, 'demo-token-' + user.id)
    navigate(PATHS.DASHBOARD, { replace: true })
    setLoading(false)
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
          {DEMO_USERS.map(u => (
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
        </div>
      </div>
    </div>
  )
}
