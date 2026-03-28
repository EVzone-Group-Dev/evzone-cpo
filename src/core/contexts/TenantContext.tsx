import { createContext, useState, type ReactNode } from 'react'

type UserRole = 'SYSTEM_ADMIN' | 'SITE_OWNER'

interface TenantContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  tenantName: string
  isSystemAdmin: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('SYSTEM_ADMIN')

  const value = {
    role,
    setRole,
    tenantName: role === 'SYSTEM_ADMIN' ? 'EVzone Global' : 'Westlands Mall Group',
    isSystemAdmin: role === 'SYSTEM_ADMIN',
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
