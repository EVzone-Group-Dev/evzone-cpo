import { createContext, useContext, useState, type ReactNode } from 'react'

export type UserRole = 'SYSTEM_ADMIN' | 'SITE_OWNER'

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
    isSystemAdmin: role === 'SYSTEM_ADMIN'
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
