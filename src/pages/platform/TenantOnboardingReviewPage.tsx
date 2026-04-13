import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  activateOnboardingApplication,
  listOnboardingApplicationsForAdmin,
  listTenantScopedCanonicalRoles,
  reviewOnboardingApplication,
  type TenantOnboardingApplication,
  type TenantScopedCanonicalRole,
} from '@/core/api/onboarding'

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

export function TenantOnboardingReviewPage() {
  const [applications, setApplications] = useState<TenantOnboardingApplication[]>([])
  const [roles, setRoles] = useState<TenantScopedCanonicalRole[]>([])
  const [reviewState, setReviewState] = useState<Record<string, ReviewFormState>>({})
  const [activationState, setActivationState] = useState<Record<string, ActivationFormState>>({})
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
      const [apps, canonicalRoles] = await Promise.all([
        listOnboardingApplicationsForAdmin(),
        listTenantScopedCanonicalRoles(),
      ])
      const fallbackRoleKey = canonicalRoles[0]?.key || ''
      setApplications(apps)
      setRoles(canonicalRoles)
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
      </div>
    </DashboardLayout>
  )
}
