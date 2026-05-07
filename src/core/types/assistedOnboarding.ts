export type AssistedSessionScope =
  | 'TEAM_SETUP'
  | 'STATION_SETUP'
  | 'CHARGE_POINT_SETUP'
  | 'SWAP_BAY_SETUP'
  | 'BRANDING_SETUP'
  | 'TARIFF_SETUP'

export type AssistedSessionStatus =
  | 'PENDING_CONSENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'COMPLETED'

export type AssistedConsentMode = 'TENANT_APPROVAL' | 'CONTRACT'

export interface AdminProxySession {
  id: string
  tenantId: string
  tenantName: string
  applicationId: string | null
  adminUserId: string
  approvedByTenantUserId: string | null
  reason: string
  scopes: AssistedSessionScope[]
  consentMode: AssistedConsentMode
  consentTextVersion: string
  status: AssistedSessionStatus
  expiresAt: string
  createdAt: string
  startedAt: string | null
  endedAt: string | null
}

export interface ProxyAuditEvent {
  id: string
  proxySessionId: string
  tenantId: string
  actorAdminUserId: string | null
  actorType: 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'SYSTEM'
  action: string
  resourceType: string
  resourceId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  eventHash: string
  previousEventHash: string | null
  createdAt: string
}

export interface HandoverChecklistItem {
  key:
    | 'FIRST_TENANT_ADMIN_INVITED'
    | 'FIRST_STATION_CREATED'
    | 'FIRST_CONNECTOR_OR_SWAP_BAY_CREATED'
    | 'TARIFF_BASELINE_CONFIGURED'
    | 'BRANDING_BASELINE_CONFIGURED'
    | 'TENANT_HANDOVER_CONFIRMED'
  status: 'PENDING' | 'DONE'
  completedAt: string | null
  notes: string | null
}

export interface HandoverReport {
  id: string
  sessionId: string
  tenantId: string
  startedAt: string | null
  endedAt: string | null
  checklist: HandoverChecklistItem[]
  actionsSummary: Record<string, number>
  pendingItems: string[]
  tenantAcknowledgedAt: string | null
  createdAt: string
}

export interface CreateAdminProxySessionInput {
  tenantId: string
  applicationId?: string
  reason: string
  scopes: AssistedSessionScope[]
  consentMode: AssistedConsentMode
  consentTextVersion: string
  expiresAt: string
}

export interface ConsentDispatchInput {
  channel?: 'EMAIL' | 'IN_APP'
  recipientUserId?: string
  note?: string
}

export interface ConsentDispatchReceipt {
  sessionId: string
  status: 'DISPATCHED'
  dispatchedAt: string
}

export interface StartAssistedSessionInput {
  contractEvidenceRef?: string
  note?: string
}

export interface ExtendAssistedSessionInput {
  expiresAt: string
  reason: string
}

export interface CompleteAssistedSessionInput {
  handoverNotes?: string
}

export interface CompleteAssistedSessionResponse {
  session: AdminProxySession
  handoverReportId: string
}

export interface RevokeAssistedSessionInput {
  reason?: string
}

export interface AssistedSessionListResponse {
  items: AdminProxySession[]
}

export interface ProxyAuditListResponse {
  items: ProxyAuditEvent[]
}
