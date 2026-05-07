import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  completeAssistedSession,
  createAssistedSession,
  listAssistedSessions,
  requestAssistedSessionConsent,
  revokeAssistedSession,
  startAssistedSession,
} from '@/core/api/assistedOnboarding'
import {
  activateOnboardingApplication,
  listOnboardingApplicationsForAdmin,
  listTenantScopedCanonicalRoles,
  reviewOnboardingApplication,
  type TenantOnboardingApplication,
  type TenantScopedCanonicalRole,
} from '@/core/api/onboarding'
import { useAuthStore } from '@/core/auth/authStore'
import type {
  AdminProxySession,
  AssistedSessionScope,
} from '@/core/types/assistedOnboarding'

type Notice = {
  kind: 'success' | 'error'
  text: string
} | null

type ReviewFormState = {
  notes: string
  rejectionReason: string
  confirmedSubdomain: string
  confirmedDomain: string
  canonicalRoleKey: string
}

type ActivationFormState = {
  confirmedSubdomain: string
  confirmedDomain: string
  canonicalRoleKey: string
}

type AssistedSetupDraftState = {
  reason: string
  expiresAt: string
  consentMode: 'TENANT_APPROVAL' | 'CONTRACT'
  scopes: AssistedSessionScope[]
}

const EMPTY_REVIEW: ReviewFormState = {
  notes: '',
  rejectionReason: '',
  confirmedSubdomain: '',
  confirmedDomain: '',
  canonicalRoleKey: '',
}

const EMPTY_ACTIVATION: ActivationFormState = {
  confirmedSubdomain: '',
  confirmedDomain: '',
  canonicalRoleKey: '',
}

const DEFAULT_ASSISTED_SCOPES: AssistedSessionScope[] = [
  'TEAM_SETUP',
  'STATION_SETUP',
  'CHARGE_POINT_SETUP',
]

const ASSISTED_SCOPE_OPTIONS: Array<{ scope: AssistedSessionScope; label: string }> = [
  { scope: 'TEAM_SETUP', label: 'Team Setup' },
  { scope: 'STATION_SETUP', label: 'Station Setup' },
  { scope: 'CHARGE_POINT_SETUP', label: 'Charge Point Setup' },
  { scope: 'SWAP_BAY_SETUP', label: 'Swap Bay Setup' },
  { scope: 'BRANDING_SETUP', label: 'Branding Setup' },
  { scope: 'TARIFF_SETUP', label: 'Tariff Setup' },
]

function buildDefaultAssistedDraft(): AssistedSetupDraftState {
  const next = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const local = new Date(next.getTime() - next.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return {
    reason: 'Initial tenant setup',
    expiresAt: local,
    consentMode: 'TENANT_APPROVAL',
    scopes: DEFAULT_ASSISTED_SCOPES,
  }
}

export function TenantOnboardingReviewPage() {
  const setAssistedProxySession = useAuthStore((state) => state.setAssistedProxySession)
  const clearAssistedProxySession = useAuthStore((state) => state.clearAssistedProxySession)
  const [applications, setApplications] = useState<TenantOnboardingApplication[]>([])
  const [roles, setRoles] = useState<TenantScopedCanonicalRole[]>([])
  const [reviewState, setReviewState] = useState<Record<string, ReviewFormState>>({})
  const [activationState, setActivationState] = useState<Record<string, ActivationFormState>>({})
  const [assistedDraftState, setAssistedDraftState] = useState<Record<string, AssistedSetupDraftState>>({})
  const [assistedSessionsByApplicationId, setAssistedSessionsByApplicationId] = useState<Record<string, AdminProxySession>>({})
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const queue = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.onboardingStage !== 'COMPLETED' &&
          application.onboardingStage !== 'REJECTED',
      ),
    [applications],
  )

  const completedApplications = useMemo(
    () =>
      applications.filter((application) => application.onboardingStage === 'COMPLETED'),
    [applications],
  )

  function withReviewDefaults(
    application: TenantOnboardingApplication,
    fallbackRoleKey: string,
  ): ReviewFormState {
    return {
      notes: '',
      rejectionReason: '',
      confirmedSubdomain: application.confirmedSubdomain || application.applicantPreferredSubdomain || '',
      confirmedDomain: application.confirmedDomain || application.applicantPreferredDomain || '',
      canonicalRoleKey: application.reviewerCanonicalRoleKey || fallbackRoleKey,
    }
  }

  function withActivationDefaults(
    application: TenantOnboardingApplication,
    fallbackRoleKey: string,
  ): ActivationFormState {
    return {
      confirmedSubdomain: application.confirmedSubdomain || application.applicantPreferredSubdomain || '',
      confirmedDomain: application.confirmedDomain || application.applicantPreferredDomain || '',
      canonicalRoleKey: application.reviewerCanonicalRoleKey || fallbackRoleKey,
    }
  }

  const reload = useCallback(async () => {
    setLoading(true)
    setNotice(null)
    try {
      const [apps, canonicalRoles, assistedSessionsResponse] = await Promise.all([
        listOnboardingApplicationsForAdmin(),
        listTenantScopedCanonicalRoles(),
        listAssistedSessions(),
      ])
      const fallbackRoleKey = canonicalRoles[0]?.key || ''
      setApplications(apps)
      setRoles(canonicalRoles)
      setAssistedSessionsByApplicationId(() => {
        const next: Record<string, AdminProxySession> = {}
        for (const session of assistedSessionsResponse.items) {
          if (!session.applicationId) {
            continue
          }

          const current = next[session.applicationId]
          if (!current || Date.parse(session.createdAt) > Date.parse(current.createdAt)) {
            next[session.applicationId] = session
          }
        }

        return next
      })
      setReviewState((current) => {
        const next = { ...current }
        for (const app of apps) {
          if (!next[app.id]) {
            next[app.id] = withReviewDefaults(app, fallbackRoleKey)
          }
        }
        return next
      })
      setActivationState((current) => {
        const next = { ...current }
        for (const app of apps) {
          if (!next[app.id]) {
            next[app.id] = withActivationDefaults(app, fallbackRoleKey)
          }
        }
        return next
      })
      setAssistedDraftState((current) => {
        const next = { ...current }
        for (const app of apps) {
          if (!next[app.id]) {
            next[app.id] = buildDefaultAssistedDraft()
          }
        }
        return next
      })
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to load onboarding review queue.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  function updateReviewForm(id: string, patch: Partial<ReviewFormState>) {
    setReviewState((current) => ({
      ...current,
      [id]: {
        ...(current[id] || EMPTY_REVIEW),
        ...patch,
      },
    }))
  }

  function updateActivationForm(id: string, patch: Partial<ActivationFormState>) {
    setActivationState((current) => ({
      ...current,
      [id]: {
        ...(current[id] || EMPTY_ACTIVATION),
        ...patch,
      },
    }))
  }

  function updateAssistedDraft(id: string, patch: Partial<AssistedSetupDraftState>) {
    setAssistedDraftState((current) => ({
      ...current,
      [id]: {
        ...(current[id] || buildDefaultAssistedDraft()),
        ...patch,
      },
    }))
  }

  function toggleAssistedScope(applicationId: string, scope: AssistedSessionScope) {
    const current = assistedDraftState[applicationId] || buildDefaultAssistedDraft()
    const hasScope = current.scopes.includes(scope)
    const nextScopes = hasScope
      ? current.scopes.filter((item) => item !== scope)
      : [...current.scopes, scope]

    updateAssistedDraft(applicationId, { scopes: nextScopes })
  }

  async function handleReviewAction(id: string, action: 'UNDER_REVIEW' | 'APPROVE' | 'REJECT') {
    const payload = reviewState[id] || EMPTY_REVIEW
    if (action === 'REJECT' && !payload.rejectionReason.trim()) {
      setNotice({ kind: 'error', text: 'Rejection reason is required.' })
      return
    }

    setWorkingId(id)
    setNotice(null)
    try {
      await reviewOnboardingApplication(id, {
        action,
        notes: payload.notes.trim() || undefined,
        rejectionReason: payload.rejectionReason.trim() || undefined,
        confirmedSubdomain: payload.confirmedSubdomain.trim() || undefined,
        confirmedDomain: payload.confirmedDomain.trim() || undefined,
        canonicalRoleKey: payload.canonicalRoleKey.trim() || undefined,
      })
      setNotice({
        kind: 'success',
        text:
          action === 'APPROVE'
            ? 'Application approved and moved to tier selection.'
            : action === 'REJECT'
              ? 'Application rejected.'
              : 'Application moved to review.',
      })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to update application review.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleActivation(id: string) {
    const payload = activationState[id] || EMPTY_ACTIVATION
    setWorkingId(id)
    setNotice(null)
    try {
      await activateOnboardingApplication(id, {
        canonicalRoleKey: payload.canonicalRoleKey.trim() || undefined,
        confirmedSubdomain: payload.confirmedSubdomain.trim() || undefined,
        confirmedDomain: payload.confirmedDomain.trim() || undefined,
      })
      setNotice({ kind: 'success', text: 'Tenant activated and provisioned successfully.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to activate tenant application.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleCreateAssistedSetup(application: TenantOnboardingApplication) {
    const draft = assistedDraftState[application.id] || buildDefaultAssistedDraft()
    const provisionedTenantId = application.provisionedOrganizationId?.trim() || ''
    if (!provisionedTenantId) {
      setNotice({ kind: 'error', text: 'Tenant is not fully provisioned yet. Activate before assisted setup.' })
      return
    }

    if (!draft.reason.trim()) {
      setNotice({ kind: 'error', text: 'Assisted setup reason is required.' })
      return
    }

    if (draft.scopes.length === 0) {
      setNotice({ kind: 'error', text: 'Select at least one assisted setup scope.' })
      return
    }

    setWorkingId(`${application.id}-assisted-create`)
    setNotice(null)
    try {
      await createAssistedSession({
        tenantId: provisionedTenantId,
        applicationId: application.id,
        reason: draft.reason.trim(),
        scopes: draft.scopes,
        consentMode: draft.consentMode,
        consentTextVersion: 'v1.0',
        expiresAt: new Date(draft.expiresAt).toISOString(),
      })
      setNotice({ kind: 'success', text: 'Assisted setup session created.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to create assisted setup session.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleRequestAssistedConsent(session: AdminProxySession) {
    setWorkingId(`${session.id}-request-consent`)
    setNotice(null)
    try {
      await requestAssistedSessionConsent(session.id, {})
      setNotice({ kind: 'success', text: 'Consent request dispatched.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to request consent.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleStartAssistedContract(session: AdminProxySession) {
    setWorkingId(`${session.id}-start`)
    setNotice(null)
    try {
      await startAssistedSession(session.id, {
        contractEvidenceRef: `contract-${session.id}`,
      })
      setNotice({ kind: 'success', text: 'Contract-backed assisted session started.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to start assisted session.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleCompleteAssistedSetup(session: AdminProxySession) {
    setWorkingId(`${session.id}-complete`)
    setNotice(null)
    try {
      await completeAssistedSession(session.id, {})
      clearAssistedProxySession()
      setNotice({ kind: 'success', text: 'Assisted setup completed and handed over.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to complete assisted setup.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleRevokeAssistedSetup(session: AdminProxySession) {
    setWorkingId(`${session.id}-revoke`)
    setNotice(null)
    try {
      await revokeAssistedSession(session.id, { reason: 'Session revoked by platform admin.' })
      clearAssistedProxySession()
      setNotice({ kind: 'success', text: 'Assisted setup session revoked.' })
      await reload()
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to revoke assisted session.',
      })
    } finally {
      setWorkingId(null)
    }
  }

  function handleEnterAssistedWorkspace(session: AdminProxySession) {
    setAssistedProxySession({
      sessionId: session.id,
      tenantId: session.tenantId,
      scopes: session.scopes,
      status: session.status,
    })
    setNotice({ kind: 'success', text: `Assisted onboarding mode is active for ${session.tenantName}.` })
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Tenant Onboarding Review">
        <div className="p-8 text-center text-subtle">Loading onboarding queue...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Tenant Onboarding Review">
      <div className="space-y-4">
        <div className="card">
          <div className="section-title">Super Admin Onboarding Workspace</div>
          <p className="mt-2 text-sm text-subtle">
            Canonical queue for review, approval, role assignment, domain confirmation, and activation provisioning.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill pending">Open Queue: {queue.length}</span>
            <span className="pill online">Roles Loaded: {roles.length}</span>
          </div>
        </div>

        {notice && (
          <div className={`alert ${notice.kind === 'error' ? 'danger' : 'success'}`}>
            {notice.text}
          </div>
        )}

        {queue.length === 0 && (
          <div className="card text-sm text-subtle">No pending onboarding applications in the queue.</div>
        )}

        {queue.map((application) => {
          const fallbackRoleKey = roles[0]?.key || ''
          const review = reviewState[application.id] || withReviewDefaults(application, fallbackRoleKey)
          const activation =
            activationState[application.id] ||
            withActivationDefaults(application, fallbackRoleKey)
          const canReview =
            application.onboardingStage === 'SUBMITTED' ||
            application.onboardingStage === 'UNDER_REVIEW'
          const canActivate =
            application.onboardingStage === 'PAYMENT_CONFIRMED_PENDING_ACTIVATION' ||
            application.onboardingStage === 'QUOTE_ACCEPTED_PENDING_ACTIVATION'

          return (
            <div key={application.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="section-title">{application.organizationName}</div>
                  <div className="text-xs text-subtle">
                    Stage: {application.onboardingStage} • Applicant: {application.contactPersonName} ({application.contactEmail})
                  </div>
                </div>
                <span className={`pill ${canActivate ? 'active' : 'pending'}`}>
                  {application.onboardingStage}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Confirmed Subdomain</label>
                  <input
                    className="input"
                    value={review.confirmedSubdomain}
                    onChange={(event) =>
                      updateReviewForm(application.id, { confirmedSubdomain: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="form-label">Confirmed Domain</label>
                  <input
                    className="input"
                    value={review.confirmedDomain}
                    onChange={(event) =>
                      updateReviewForm(application.id, { confirmedDomain: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Initial Canonical Role</label>
                  <select
                    className="input"
                    value={review.canonicalRoleKey}
                    onChange={(event) =>
                      updateReviewForm(application.id, { canonicalRoleKey: event.target.value })
                    }
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.key} - {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reviewer Notes</label>
                  <input
                    className="input"
                    value={review.notes}
                    onChange={(event) => updateReviewForm(application.id, { notes: event.target.value })}
                  />
                </div>
              </div>

              {canReview && (
                <>
                  <div>
                    <label className="form-label">Rejection Reason (if rejecting)</label>
                    <input
                      className="input"
                      value={review.rejectionReason}
                      onChange={(event) =>
                        updateReviewForm(application.id, { rejectionReason: event.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn"
                      disabled={workingId === application.id}
                      onClick={() => void handleReviewAction(application.id, 'UNDER_REVIEW')}
                    >
                      Move to Under Review
                    </button>
                    <button
                      className="btn primary"
                      disabled={workingId === application.id}
                      onClick={() => void handleReviewAction(application.id, 'APPROVE')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn"
                      disabled={workingId === application.id}
                      onClick={() => void handleReviewAction(application.id, 'REJECT')}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}

              {canActivate && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">Activation Canonical Role</label>
                      <select
                        className="input"
                        value={activation.canonicalRoleKey || review.canonicalRoleKey}
                        onChange={(event) =>
                          updateActivationForm(application.id, {
                            canonicalRoleKey: event.target.value,
                          })
                        }
                      >
                        <option value="">Use reviewer-selected role</option>
                        {roles.map((role) => (
                          <option key={role.key} value={role.key}>
                            {role.key}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Activation Subdomain</label>
                      <input
                        className="input"
                        value={activation.confirmedSubdomain}
                        onChange={(event) =>
                          updateActivationForm(application.id, {
                            confirmedSubdomain: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Activation Domain</label>
                      <input
                        className="input"
                        value={activation.confirmedDomain}
                        onChange={(event) =>
                          updateActivationForm(application.id, {
                            confirmedDomain: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="btn primary"
                    disabled={workingId === application.id}
                    onClick={() => void handleActivation(application.id)}
                  >
                    {workingId === application.id ? 'Activating...' : 'Activate & Provision Tenant'}
                  </button>
                </>
              )}
            </div>
          )
        })}

        {completedApplications.length > 0 && (
          <div className="card space-y-4">
            <div className="section-title">Post-Activation Assisted Setup</div>
            <p className="text-sm text-subtle">
              Create time-bound assisted sessions for newly activated tenants. Admin identity is preserved and scoped actions are audited.
            </p>

            {completedApplications.map((application) => {
              const assistedSession = assistedSessionsByApplicationId[application.id] || null
              const draft = assistedDraftState[application.id] || buildDefaultAssistedDraft()
              const canCreateSession = !assistedSession || assistedSession.status === 'REVOKED' || assistedSession.status === 'EXPIRED' || assistedSession.status === 'COMPLETED'
              const canRequestConsent = assistedSession?.status === 'PENDING_CONSENT' && assistedSession.consentMode === 'TENANT_APPROVAL'
              const canStartContract = assistedSession?.status === 'PENDING_CONSENT' && assistedSession.consentMode === 'CONTRACT'
              const canOperate = assistedSession?.status === 'ACTIVE'

              return (
                <div key={application.id} className="rounded border border-[var(--border)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[var(--text)]">{application.organizationName}</div>
                      <div className="text-xs text-subtle">
                        Application: {application.id} · Tenant: {application.provisionedOrganizationId || 'Not provisioned'}
                      </div>
                    </div>
                    {assistedSession ? (
                      <span className={`pill ${assistedSession.status === 'ACTIVE' ? 'active' : assistedSession.status === 'COMPLETED' ? 'online' : 'pending'}`}>
                        Assisted Session: {assistedSession.status}
                      </span>
                    ) : (
                      <span className="pill pending">No assisted session</span>
                    )}
                  </div>

                  {assistedSession && (
                    <div className="text-xs text-subtle">
                      Session {assistedSession.id} · Scope: {assistedSession.scopes.join(', ')} · Expires: {new Date(assistedSession.expiresAt).toLocaleString()}
                    </div>
                  )}

                  {canCreateSession && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Reason</label>
                        <input
                          className="input"
                          value={draft.reason}
                          onChange={(event) => updateAssistedDraft(application.id, { reason: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Consent Mode</label>
                        <select
                          className="input"
                          value={draft.consentMode}
                          onChange={(event) => updateAssistedDraft(application.id, {
                            consentMode: event.target.value as AssistedSetupDraftState['consentMode'],
                          })}
                        >
                          <option value="TENANT_APPROVAL">Tenant Approval</option>
                          <option value="CONTRACT">Contract-Based</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Expires At</label>
                        <input
                          type="datetime-local"
                          className="input"
                          value={draft.expiresAt}
                          onChange={(event) => updateAssistedDraft(application.id, { expiresAt: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Scopes</label>
                        <div className="flex flex-wrap gap-2">
                          {ASSISTED_SCOPE_OPTIONS.map((option) => (
                            <label key={option.scope} className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={draft.scopes.includes(option.scope)}
                                onChange={() => toggleAssistedScope(application.id, option.scope)}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <button
                          className="btn primary"
                          disabled={workingId === `${application.id}-assisted-create`}
                          onClick={() => void handleCreateAssistedSetup(application)}
                        >
                          {workingId === `${application.id}-assisted-create` ? 'Creating...' : 'Start Assisted Setup'}
                        </button>
                      </div>
                    </div>
                  )}

                  {assistedSession && (
                    <div className="flex flex-wrap gap-2">
                      {canRequestConsent && (
                        <button
                          className="btn"
                          disabled={workingId === `${assistedSession.id}-request-consent`}
                          onClick={() => void handleRequestAssistedConsent(assistedSession)}
                        >
                          {workingId === `${assistedSession.id}-request-consent` ? 'Requesting...' : 'Request Tenant Consent'}
                        </button>
                      )}
                      {canStartContract && (
                        <button
                          className="btn"
                          disabled={workingId === `${assistedSession.id}-start`}
                          onClick={() => void handleStartAssistedContract(assistedSession)}
                        >
                          {workingId === `${assistedSession.id}-start` ? 'Starting...' : 'Start Contract Session'}
                        </button>
                      )}
                      {canOperate && (
                        <>
                          <button
                            className="btn primary"
                            onClick={() => handleEnterAssistedWorkspace(assistedSession)}
                          >
                            Enter Assisted Workspace
                          </button>
                          <button
                            className="btn"
                            disabled={workingId === `${assistedSession.id}-complete`}
                            onClick={() => void handleCompleteAssistedSetup(assistedSession)}
                          >
                            {workingId === `${assistedSession.id}-complete` ? 'Completing...' : 'Complete & Handover'}
                          </button>
                        </>
                      )}
                      {(assistedSession.status === 'PENDING_CONSENT' || assistedSession.status === 'ACTIVE') && (
                        <button
                          className="btn"
                          disabled={workingId === `${assistedSession.id}-revoke`}
                          onClick={() => void handleRevokeAssistedSetup(assistedSession)}
                        >
                          {workingId === `${assistedSession.id}-revoke` ? 'Revoking...' : 'Revoke Session'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
