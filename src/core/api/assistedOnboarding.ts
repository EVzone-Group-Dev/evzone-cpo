import { fetchJson } from '@/core/api/fetchJson'
import type {
  AdminProxySession,
  AssistedSessionListResponse,
  CompleteAssistedSessionInput,
  CompleteAssistedSessionResponse,
  ConsentDispatchInput,
  ConsentDispatchReceipt,
  CreateAdminProxySessionInput,
  ExtendAssistedSessionInput,
  HandoverReport,
  ProxyAuditListResponse,
  RevokeAssistedSessionInput,
  StartAssistedSessionInput,
} from '@/core/types/assistedOnboarding'

export function createAssistedSession(input: CreateAdminProxySessionInput) {
  return fetchJson<AdminProxySession>('/api/v1/platform/assisted-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listAssistedSessions(filters?: {
  tenantId?: string
  status?: string
  applicationId?: string
}) {
  const query = new URLSearchParams()
  if (filters?.tenantId) {
    query.set('tenantId', filters.tenantId)
  }
  if (filters?.status) {
    query.set('status', filters.status)
  }
  if (filters?.applicationId) {
    query.set('applicationId', filters.applicationId)
  }
  const suffix = query.toString()
  return fetchJson<AssistedSessionListResponse>(
    `/api/v1/platform/assisted-sessions${suffix ? `?${suffix}` : ''}`,
  )
}

export function getAssistedSession(sessionId: string) {
  return fetchJson<AdminProxySession>(`/api/v1/platform/assisted-sessions/${sessionId}`)
}

export function requestAssistedSessionConsent(
  sessionId: string,
  input: ConsentDispatchInput = {},
) {
  return fetchJson<ConsentDispatchReceipt>(
    `/api/v1/platform/assisted-sessions/${sessionId}/request-consent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export function approveAssistedSessionConsent(sessionId: string, input?: { note?: string }) {
  return fetchJson<AdminProxySession>(
    `/api/v1/tenant/assisted-sessions/${sessionId}/consent/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input ?? {}),
    },
  )
}

export function rejectAssistedSessionConsent(
  sessionId: string,
  input?: { reason?: string },
) {
  return fetchJson<AdminProxySession>(
    `/api/v1/tenant/assisted-sessions/${sessionId}/consent/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input ?? {}),
    },
  )
}

export function startAssistedSession(sessionId: string, input: StartAssistedSessionInput = {}) {
  return fetchJson<AdminProxySession>(`/api/v1/platform/assisted-sessions/${sessionId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function extendAssistedSession(sessionId: string, input: ExtendAssistedSessionInput) {
  return fetchJson<AdminProxySession>(`/api/v1/platform/assisted-sessions/${sessionId}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function completeAssistedSession(
  sessionId: string,
  input: CompleteAssistedSessionInput = {},
) {
  return fetchJson<CompleteAssistedSessionResponse>(
    `/api/v1/platform/assisted-sessions/${sessionId}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
}

export function revokeAssistedSession(
  sessionId: string,
  input: RevokeAssistedSessionInput = {},
) {
  return fetchJson<AdminProxySession>(`/api/v1/platform/assisted-sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listAssistedSessionAuditEvents(sessionId: string) {
  return fetchJson<ProxyAuditListResponse>(
    `/api/v1/platform/assisted-sessions/${sessionId}/audit-events`,
  )
}

export function getAssistedSessionHandoverReport(sessionId: string) {
  return fetchJson<HandoverReport>(`/api/v1/tenant/assisted-sessions/${sessionId}/handover-report`)
}
