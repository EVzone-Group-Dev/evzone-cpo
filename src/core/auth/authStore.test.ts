import { describe, expect, it } from 'vitest'
import type { AccessProfile, CPOUser } from '@/core/types/domain'
import {
  mergeAuthUser,
  resolveTenantIdFromUser,
  sanitizePersistedUser,
} from '@/core/auth/authStore'

function buildAccessProfile(scopeType: AccessProfile['scope']['type']): AccessProfile {
  return {
    version: '2026-04-v1',
    legacyRole: scopeType === 'platform' ? 'SUPER_ADMIN' : 'TENANT_ADMIN',
    canonicalRole:
      scopeType === 'platform' ? 'PLATFORM_SUPER_ADMIN' : 'TENANT_ADMIN',
    roleFamily: scopeType === 'platform' ? 'platform' : 'tenant',
    permissions:
      scopeType === 'platform'
        ? ['platform.tenants.read']
        : ['tenant.users.read'],
    scope: {
      type: scopeType,
      tenantId: scopeType === 'platform' ? null : 'org-tenant-1',
      stationId: null,
      stationIds: [],
      providerId: null,
      isTemporary: false,
    },
  }
}

function buildUser(overrides: Partial<CPOUser> = {}): CPOUser {
  return {
    id: 'user-1',
    name: 'User One',
    email: 'user1@evzone.io',
    role: 'SUPER_ADMIN',
    status: 'Active',
    createdAt: '2026-04-22T00:00:00.000Z',
    accessProfile: buildAccessProfile('platform'),
    ...overrides,
  }
}

describe('authStore tenant scope helpers', () => {
  it('resolves no active tenant for explicit platform sessions', () => {
    const platformUser = buildUser({
      sessionScopeType: 'platform',
      actingAsTenant: false,
      selectedTenantId: 'org-stale',
      activeTenantId: 'org-stale',
      tenantId: 'org-stale',
      orgId: 'org-stale',
    })

    expect(resolveTenantIdFromUser(platformUser)).toBeNull()
  })

  it('does not resurrect tenant ids when platform context replaces tenant context', () => {
    const currentTenantUser = buildUser({
      sessionScopeType: 'tenant',
      actingAsTenant: true,
      selectedTenantId: 'org-tenant-1',
      selectedTenantName: 'Tenant One',
      activeTenantId: 'org-tenant-1',
      tenantId: 'org-tenant-1',
      orgId: 'org-tenant-1',
      accessProfile: buildAccessProfile('tenant'),
    })

    const incomingPlatformUser = buildUser({
      sessionScopeType: 'platform',
      actingAsTenant: false,
      selectedTenantId: 'org-tenant-1',
      selectedTenantName: 'Tenant One',
      activeTenantId: 'org-tenant-1',
      tenantId: 'org-tenant-1',
      orgId: 'org-tenant-1',
      accessProfile: buildAccessProfile('platform'),
    })

    const merged = mergeAuthUser(currentTenantUser, incomingPlatformUser)

    expect(merged.activeTenantId).toBeNull()
    expect(merged.tenantId).toBeUndefined()
    expect(merged.orgId).toBeNull()
    expect(merged.selectedTenantId).toBeNull()
    expect(merged.selectedTenantName).toBeNull()
  })

  it('sanitizes persisted platform sessions to remove tenant selection', () => {
    const sanitized = sanitizePersistedUser(
      buildUser({
        sessionScopeType: 'platform',
        actingAsTenant: false,
        selectedTenantId: 'org-stale',
        selectedTenantName: 'Tenant Stale',
        activeTenantId: 'org-stale',
        tenantId: 'org-stale',
        orgId: 'org-stale',
      }),
    )

    expect(sanitized?.activeTenantId).toBeNull()
    expect(sanitized?.tenantId).toBeUndefined()
    expect(sanitized?.orgId).toBeNull()
    expect(sanitized?.selectedTenantId).toBeNull()
    expect(sanitized?.selectedTenantName).toBeNull()
    expect(sanitized?.sessionScopeType).toBe('platform')
    expect(sanitized?.actingAsTenant).toBe(false)
  })

  it('keeps selected tenant for active tenant sessions when persisting', () => {
    const sanitized = sanitizePersistedUser(
      buildUser({
        sessionScopeType: 'tenant',
        actingAsTenant: true,
        selectedTenantId: 'org-tenant-1',
        selectedTenantName: 'Tenant One',
        activeTenantId: 'org-tenant-1',
        tenantId: 'org-tenant-1',
        orgId: 'org-tenant-1',
        accessProfile: buildAccessProfile('tenant'),
      }),
    )

    expect(sanitized?.selectedTenantId).toBe('org-tenant-1')
    expect(sanitized?.selectedTenantName).toBe('Tenant One')
  })
})

