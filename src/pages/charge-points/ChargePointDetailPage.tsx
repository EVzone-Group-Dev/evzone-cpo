import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fetchJson } from '@/core/api/fetchJson'
import { canAccessPolicy, getTemporaryAccessState } from '@/core/auth/access'
import { useAuthStore } from '@/core/auth/authStore'
import {
  useChargePoint,
  useChargePointPublication,
  useConfirmChargePointIdentity,
  useSetChargePointPublication,
  useSessions,
} from '@/core/hooks/usePlatformData'
import { PATHS } from '@/router/paths'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Copy, Cpu, Play, RotateCcw, Square, Unlock, Upload, Wifi, WifiOff } from 'lucide-react'

type SupportedRemoteCommand =
  | 'Remote Start Session'
  | 'Remote Stop Session'
  | 'Soft Reset'
  | 'Hard Reboot'
  | 'Unlock Connector'
  | 'Update Firmware'

const SUPPORTED_REMOTE_COMMANDS: SupportedRemoteCommand[] = [
  'Remote Start Session',
  'Remote Stop Session',
  'Soft Reset',
  'Hard Reboot',
  'Unlock Connector',
  'Update Firmware',
]

const SUPPORTED_REMOTE_COMMAND_SET = new Set<SupportedRemoteCommand>(SUPPORTED_REMOTE_COMMANDS)

const COMMAND_ICONS: Record<SupportedRemoteCommand, ReactNode> = {
  'Remote Start Session': <Play size={14} />,
  'Remote Stop Session': <Square size={14} />,
  'Soft Reset': <RotateCcw size={14} />,
  'Hard Reboot': <RotateCcw size={14} />,
  'Unlock Connector': <Unlock size={14} />,
  'Update Firmware': <Upload size={14} />,
}

const BOOT_WAIT_TIMEOUT_MS = 5 * 60 * 1000
const BOOT_POLL_INTERVAL_MS = 10 * 1000

type SetupNavigationState = {
  returnTo?: string
  setupStartedAt?: string
  setupCredentials?: {
    username?: string
    password?: string
    wsUrl?: string
    subprotocol?: string
    authProfile?: 'basic' | 'mtls_bootstrap' | 'mtls'
    bootstrapExpiresAt?: string
    requiresClientCertificate?: boolean
    mtlsInstructions?: string
  } | null
}

type IdentityDraft = {
  firmwareVersion: string
  manufacturer: string
  model: string
}

function parseIsoToMillis(value: string | undefined) {
  if (!value) {
    return Date.now()
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toOptionalInt(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Please enter a whole number greater than zero.')
  }

  return parsed
}

function toOptionalNonNegativeInt(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Please enter a whole number of zero or more.')
  }

  return parsed
}

function toIsoDateTime(value: string, fieldLabel: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldLabel} must be a valid date and time.`)
  }

  return parsed.toISOString()
}

function makeHttpsUrl(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error('Firmware URL is required.')
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Firmware URL must be a valid URL.')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Firmware URL must use https.')
  }

  return trimmed
}

async function postJson<T>(path: string, payload?: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: 'POST',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  })
}

type StartDraft = {
  connectorId: string
  evseId: string
  idTag: string
}

type FirmwareDraft = {
  installAt: string
  location: string
  requestId: string
  retries: string
  retryIntervalSec: string
  retrieveAt: string
  signature: string
  signingCertificate: string
}

export function ChargePointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigationState = (location.state || {}) as SetupNavigationState
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const {
    data: chargePoint,
    isLoading,
    error,
    refetch: refetchChargePoint,
  } = useChargePoint(id)
  const { data: sessions, isLoading: isSessionsLoading } = useSessions()
  const publicationQuery = useChargePointPublication(id)
  const setPublicationMutation = useSetChargePointPublication(id)
  const confirmIdentityMutation = useConfirmChargePointIdentity(id)
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null)
  const [setupFeedback, setSetupFeedback] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [sessionConnectorFilter, setSessionConnectorFilter] = useState('All')
  const [stopReason, setStopReason] = useState('')
  const [identityDraft, setIdentityDraft] = useState<IdentityDraft>({
    model: '',
    manufacturer: '',
    firmwareVersion: '',
  })
  const [isIdentityDraftTouched, setIsIdentityDraftTouched] = useState(false)
  const [bootWaitDismissed, setBootWaitDismissed] = useState(false)
  const [bootWaitTimedOut, setBootWaitTimedOut] = useState(false)
  const [showProvisioningCredentials, setShowProvisioningCredentials] = useState(
    Boolean(navigationState.setupCredentials),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDraft, setStartDraft] = useState<StartDraft>({
    idTag: 'EVZONE_REMOTE',
    connectorId: '1',
    evseId: '',
  })
  const [firmwareDraft, setFirmwareDraft] = useState<FirmwareDraft>({
    location: '',
    retrieveAt: toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000)),
    installAt: '',
    retries: '',
    retryIntervalSec: '',
    requestId: '',
    signingCertificate: '',
    signature: '',
  })
  const setupStartedAtMsRef = useRef<number>(
    parseIsoToMillis(navigationState.setupStartedAt),
  )
  const canRunSessionCommands = canAccessPolicy(user, 'remoteCommandStart')
  const canRunDeviceCommands = canAccessPolicy(user, 'chargePointCommands')
  const canWriteChargePoints = canAccessPolicy(user, 'chargePointsWrite')
  const temporaryAccessState = getTemporaryAccessState(user)
  const hasRestrictedAccess = !canRunDeviceCommands || !canRunSessionCommands || temporaryAccessState === 'expired'
  const hasBootNotification = Boolean(chargePoint?.bootNotificationAt)
  const identityConfirmed = Boolean(chargePoint?.identityConfirmedAt)
  const roamingPublished =
    publicationQuery.data?.published ?? chargePoint?.roamingPublished ?? false
  const provisioningCredentials = navigationState.setupCredentials ?? null

  const setupStep = useMemo(() => {
    if (roamingPublished) {
      return 'published'
    }
    if (!hasBootNotification) {
      return 'waiting_for_boot'
    }
    if (!identityConfirmed) {
      return 'confirm_identity'
    }
    return 'ready_to_publish'
  }, [roamingPublished, hasBootNotification, identityConfirmed])

  const shouldPollBootNotification =
    Boolean(id) &&
    !hasBootNotification &&
    !bootWaitDismissed &&
    !bootWaitTimedOut

  useEffect(() => {
    if (!chargePoint || isIdentityDraftTouched) {
      return
    }

    setIdentityDraft({
      model: chargePoint.model || '',
      manufacturer: chargePoint.manufacturer || '',
      firmwareVersion: chargePoint.firmwareVersion || '',
    })
  }, [chargePoint, isIdentityDraftTouched])

  useEffect(() => {
    if (!shouldPollBootNotification) {
      return
    }

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - setupStartedAtMsRef.current
      if (elapsedMs >= BOOT_WAIT_TIMEOUT_MS) {
        setBootWaitTimedOut(true)
        window.clearInterval(interval)
        return
      }
      void refetchChargePoint()
    }, BOOT_POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [refetchChargePoint, shouldPollBootNotification])

  useEffect(() => {
    if (!copiedField) {
      return
    }

    const timeout = window.setTimeout(() => setCopiedField(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [copiedField])

  const chargePointSessions = useMemo(() => {
    if (!chargePoint) {
      return []
    }

    return (sessions || []).filter((session) => session.chargePointId === chargePoint.id || session.cp === chargePoint.ocppId)
  }, [chargePoint, sessions])

  const recentSessions = useMemo(
    () => [...chargePointSessions]
      .sort((a, b) => b.started.localeCompare(a.started))
      .slice(0, 5),
    [chargePointSessions],
  )

  const activeSession = useMemo(
    () => chargePointSessions.find((session) => session.status === 'Active') ?? null,
    [chargePointSessions],
  )

  const connectorFilterOptions = useMemo(
    () => ['All', ...Array.from(new Set(recentSessions.map((session) => session.connectorType))).sort((a, b) => a.localeCompare(b))],
    [recentSessions],
  )

  const effectiveSessionConnectorFilter = connectorFilterOptions.includes(sessionConnectorFilter) ? sessionConnectorFilter : 'All'

  const visibleRecentSessions = recentSessions.filter(
    (session) => effectiveSessionConnectorFilter === 'All' || session.connectorType === effectiveSessionConnectorFilter,
  )

  const remoteCommands = useMemo<SupportedRemoteCommand[]>(() => {
    const provided = Array.isArray(chargePoint?.remoteCommands) ? chargePoint.remoteCommands : []
    return Array.from(new Set([...provided, ...SUPPORTED_REMOTE_COMMANDS]))
      .filter((command): command is SupportedRemoteCommand => SUPPORTED_REMOTE_COMMAND_SET.has(command as SupportedRemoteCommand))
  }, [chargePoint?.remoteCommands])

  const commandIsPending = isSubmitting

  const invalidateQueryData = async (refreshSessions = false) => {
    const invalidations = [queryClient.invalidateQueries({ queryKey: ['charge-points'] })]
    if (refreshSessions) {
      invalidations.push(queryClient.invalidateQueries({ queryKey: ['sessions'] }))
    }
    await Promise.all(invalidations)
  }

  const runCommand = async (
    label: string,
    action: () => Promise<{ message?: string }>,
    options?: { refreshSessions?: boolean },
  ): Promise<boolean> => {
    if (!id) {
      return false
    }

    setCmdFeedback(`${label} sent - awaiting response...`)
    setIsSubmitting(true)

    try {
      const response = await action()
      setCmdFeedback(`✓ ${response.message ?? `${label} queued successfully.`}`)
      await invalidateQueryData(Boolean(options?.refreshSessions))
      return true
    } catch (err) {
      setCmdFeedback(err instanceof Error ? err.message : `${label} failed.`)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoteStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) {
      return
    }

    try {
      const connectorId = toOptionalInt(startDraft.connectorId)
      if (connectorId === undefined) {
        throw new Error('Connector ID is required.')
      }

      const payload: Record<string, unknown> = {
        idTag: startDraft.idTag.trim(),
        connectorId,
      }

      const evseId = toOptionalInt(startDraft.evseId)
      if (evseId !== undefined) {
        payload.evseId = evseId
      }

      if (startDraft.idTag.trim().length === 0) {
        throw new Error('Id tag is required.')
      }

      const started = await runCommand(
        'Remote start session',
        () => postJson<{ message?: string }>(`/api/v1/charge-points/${id}/commands/remote-start`, payload),
        { refreshSessions: true },
      )
      if (!started) {
        return
      }
    } catch (err) {
      setCmdFeedback(err instanceof Error ? err.message : 'Remote start session failed.')
      return
    }

    setStartDraft({
      idTag: 'EVZONE_REMOTE',
      connectorId: '1',
      evseId: '',
    })
  }

  const handleStopSession = async () => {
    if (!id || !activeSession) {
      return
    }

    const reason = stopReason.trim()

    const stopped = await runCommand(
      'Remote stop session',
      () => postJson<{ message?: string }>(
        `/api/v1/sessions/${activeSession.id}/stop`,
        reason ? { reason } : undefined,
      ),
      { refreshSessions: true },
    )

    if (stopped) {
      setStopReason('')
    }
  }

  const handleQuickCommand = async (label: string, path: string, payload?: unknown) => {
    await runCommand(label, () => postJson<{ message?: string }>(path, payload))
  }

  const handleFirmwareSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) {
      return
    }

    try {
      const location = makeHttpsUrl(firmwareDraft.location)
      const retrieveAt = toIsoDateTime(firmwareDraft.retrieveAt, 'Retrieve time')
      const installAt = firmwareDraft.installAt.trim().length > 0
        ? toIsoDateTime(firmwareDraft.installAt, 'Install time')
        : undefined
      const retries = toOptionalNonNegativeInt(firmwareDraft.retries)
      const retryIntervalSec = toOptionalNonNegativeInt(firmwareDraft.retryIntervalSec)
      const requestId = toOptionalInt(firmwareDraft.requestId)

      if (installAt && new Date(installAt).getTime() < new Date(retrieveAt).getTime()) {
        throw new Error('Install time must be after retrieve time.')
      }

      const payload: Record<string, unknown> = {
        location,
        retrieveAt,
      }

      if (installAt) {
        payload.installAt = installAt
      }
      if (retries !== undefined) {
        payload.retries = retries
      }
      if (retryIntervalSec !== undefined) {
        payload.retryIntervalSec = retryIntervalSec
      }
      if (requestId !== undefined) {
        payload.requestId = requestId
      }
      if (firmwareDraft.signingCertificate.trim().length > 0) {
        payload.signingCertificate = firmwareDraft.signingCertificate.trim()
      }
      if (firmwareDraft.signature.trim().length > 0) {
        payload.signature = firmwareDraft.signature.trim()
      }

      await runCommand(
        'Firmware update',
        () => postJson<{ message?: string }>(`/api/v1/charge-points/${id}/commands/update-firmware`, payload),
      )
    } catch (err) {
      setCmdFeedback(err instanceof Error ? err.message : 'Firmware update failed.')
    }
  }

  const handleCopyCredential = async (field: string, value: string | undefined) => {
    if (!value) {
      return
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser context.')
      }
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
    } catch (errorCopy) {
      setSetupFeedback(
        errorCopy instanceof Error
          ? errorCopy.message
          : 'Unable to copy credential value.',
      )
    }
  }

  const handleConfirmIdentity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id || !chargePoint) {
      return
    }

    if (!canWriteChargePoints) {
      setSetupFeedback('Your access scope does not allow identity confirmation.')
      return
    }

    const model = identityDraft.model.trim()
    const manufacturer = identityDraft.manufacturer.trim()
    const firmwareVersion = identityDraft.firmwareVersion.trim()
    if (!model || !manufacturer || !firmwareVersion) {
      setSetupFeedback('Model, manufacturer, and firmware version are required.')
      return
    }

    try {
      setSetupFeedback(null)
      await confirmIdentityMutation.mutateAsync({
        model,
        manufacturer,
        firmwareVersion,
      })
      setIsIdentityDraftTouched(false)
      setSetupFeedback('Identity confirmed. You can now publish this charge point.')
      await refetchChargePoint()
    } catch (confirmError) {
      setSetupFeedback(
        confirmError instanceof Error
          ? confirmError.message
          : 'Failed to confirm identity.',
      )
    }
  }

  const handleSetPublication = async (published: boolean) => {
    if (!id) {
      return
    }

    if (!canWriteChargePoints) {
      setSetupFeedback('Your access scope does not allow publication changes.')
      return
    }

    try {
      setSetupFeedback(null)
      await setPublicationMutation.mutateAsync(published)
      await Promise.all([
        publicationQuery.refetch(),
        refetchChargePoint(),
      ])
      setSetupFeedback(
        published
          ? 'Charge point published to roaming.'
          : 'Charge point unpublished from roaming.',
      )
    } catch (publishError) {
      setSetupFeedback(
        publishError instanceof Error
          ? publishError.message
          : 'Failed to update publication state.',
      )
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Loading...">
        <div className="card text-center py-12 text-muted">Loading charge point details...</div>
      </DashboardLayout>
    )
  }

  if (error || !chargePoint) {
    return (
      <DashboardLayout pageTitle="Not Found">
        <div className="card text-center py-12 text-muted">Charge point not found.</div>
      </DashboardLayout>
    )
  }

  const backPath = navigationState.returnTo || PATHS.CHARGE_POINTS
  const isConfirmingIdentity = confirmIdentityMutation.isPending
  const isUpdatingPublication = setPublicationMutation.isPending || publicationQuery.isFetching
  const connectorTypes = chargePoint.connectorTypes?.length
    ? chargePoint.connectorTypes
    : (chargePoint.connectorType ? [chargePoint.connectorType] : ['N/A'])
  const unitHealth = chargePoint.unitHealth ?? {
    ocppConnection: chargePoint.status === 'Online' ? 'Connected' : 'Disconnected',
    lastHeartbeat: chargePoint.lastHeartbeatLabel ?? 'No heartbeat',
    errorCode: 'None',
  }

  return (
    <DashboardLayout pageTitle={`${chargePoint.model} - ${chargePoint.ocppId}`}>
      <div className="mb-4">
        <Link to={backPath} className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">
          <ArrowLeft size={14} />
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="section-title">Setup Progress</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              {[
                { id: 'provisioned', label: '1. Provisioned', active: true, complete: true },
                { id: 'boot', label: '2. Boot', active: setupStep === 'waiting_for_boot', complete: hasBootNotification },
                { id: 'identity', label: '3. Confirm Identity', active: setupStep === 'confirm_identity', complete: identityConfirmed },
                { id: 'publish', label: '4. Publish', active: setupStep === 'ready_to_publish', complete: roamingPublished },
              ].map((step) => (
                <div
                  key={step.id}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    step.complete
                      ? 'border-ok/50 bg-ok/10 text-ok'
                      : step.active
                        ? 'border-accent/60 bg-accent/10 text-accent'
                        : 'border-border bg-bg-muted/30 text-subtle'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {setupFeedback && (
              <div className={`alert ${setupFeedback.startsWith('Charge point') || setupFeedback.startsWith('Identity confirmed') ? 'success' : 'info'} text-xs mb-3`}>
                {setupFeedback}
              </div>
            )}

            {showProvisioningCredentials && provisioningCredentials && (
              <div className="rounded-xl border border-border bg-bg-muted/30 p-4 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-ok" />
                      Provisioned Credentials
                    </div>
                    <div className="text-[11px] text-subtle">These credentials are shown once after provisioning.</div>
                  </div>
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={() => setShowProvisioningCredentials(false)}
                  >
                    Hide
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Username', value: provisioningCredentials.username, key: 'username' },
                    { label: 'Password', value: provisioningCredentials.password, key: 'password' },
                    { label: 'WebSocket URL', value: provisioningCredentials.wsUrl, key: 'wsUrl' },
                    { label: 'Subprotocol', value: provisioningCredentials.subprotocol, key: 'subprotocol' },
                  ].map(({ label, value, key }) => (
                    <div key={key} className="rounded-lg border border-border bg-bg-base px-3 py-2">
                      <div className="text-[11px] uppercase text-subtle">{label}</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-xs font-mono break-all">{value || 'N/A'}</div>
                        <button
                          type="button"
                          className="btn secondary sm"
                          onClick={() => handleCopyCredential(key, value)}
                          disabled={!value}
                        >
                          <Copy size={12} />
                          {copiedField === key ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {(provisioningCredentials.bootstrapExpiresAt || provisioningCredentials.mtlsInstructions) && (
                  <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    {provisioningCredentials.bootstrapExpiresAt && (
                      <div>
                        Bootstrap expires at {new Date(provisioningCredentials.bootstrapExpiresAt).toLocaleString()}.
                      </div>
                    )}
                    {provisioningCredentials.mtlsInstructions && (
                      <div className="mt-1">{provisioningCredentials.mtlsInstructions}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!hasBootNotification && (
              <div className="rounded-xl border border-border bg-bg-muted/30 p-4 mb-4">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Clock3 size={14} />
                  Waiting for first BootNotification
                </div>
                <div className="text-[11px] text-subtle mt-1">
                  We are polling every 10 seconds for charger identity data from boot.
                </div>
                {bootWaitTimedOut ? (
                  <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    Boot wait timed out after 5 minutes. You can continue later and resume once the charger boots.
                  </div>
                ) : bootWaitDismissed ? (
                  <div className="mt-3 rounded-lg border border-border bg-bg-base px-3 py-2 text-xs text-subtle">
                    Boot wait paused for now. Refresh this page later to continue setup.
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="btn secondary sm"
                      onClick={() => setBootWaitDismissed(true)}
                    >
                      Continue Later
                    </button>
                  </div>
                )}
              </div>
            )}

            {hasBootNotification && !identityConfirmed && (
              <form className="rounded-xl border border-border bg-bg-muted/30 p-4 mb-4 space-y-3" onSubmit={handleConfirmIdentity}>
                <div>
                  <div className="text-sm font-semibold">Confirm Device Identity</div>
                  <div className="text-[11px] text-subtle">
                    BootNotification details are editable before publication. OCPP ID remains read-only.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">OCPP ID</label>
                    <input value={chargePoint.ocppId} className="input" disabled readOnly />
                  </div>
                  <div>
                    <label className="form-label">Model</label>
                    <input
                      value={identityDraft.model}
                      onChange={(event) => {
                        setIsIdentityDraftTouched(true)
                        setIdentityDraft((draft) => ({ ...draft, model: event.target.value }))
                      }}
                      className="input"
                      disabled={!canWriteChargePoints || isConfirmingIdentity || roamingPublished}
                      placeholder="e.g. ABB Terra 184"
                    />
                  </div>
                  <div>
                    <label className="form-label">Manufacturer</label>
                    <input
                      value={identityDraft.manufacturer}
                      onChange={(event) => {
                        setIsIdentityDraftTouched(true)
                        setIdentityDraft((draft) => ({ ...draft, manufacturer: event.target.value }))
                      }}
                      className="input"
                      disabled={!canWriteChargePoints || isConfirmingIdentity || roamingPublished}
                      placeholder="e.g. ABB"
                    />
                  </div>
                  <div>
                    <label className="form-label">Firmware Version</label>
                    <input
                      value={identityDraft.firmwareVersion}
                      onChange={(event) => {
                        setIsIdentityDraftTouched(true)
                        setIdentityDraft((draft) => ({ ...draft, firmwareVersion: event.target.value }))
                      }}
                      className="input"
                      disabled={!canWriteChargePoints || isConfirmingIdentity || roamingPublished}
                      placeholder="e.g. 1.4.2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    className="btn primary sm"
                    disabled={!canWriteChargePoints || isConfirmingIdentity || roamingPublished}
                  >
                    {isConfirmingIdentity ? 'Confirming...' : 'Confirm Identity'}
                  </button>
                </div>
              </form>
            )}

            {hasBootNotification && identityConfirmed && (
              <div className="rounded-xl border border-border bg-bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Publish to Roaming</div>
                    <div className="text-[11px] text-subtle">
                      Publishing is unlocked after boot and identity confirmation.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn sm ${roamingPublished ? 'secondary' : 'primary'}`}
                    onClick={() => handleSetPublication(!roamingPublished)}
                    disabled={!canWriteChargePoints || isUpdatingPublication}
                  >
                    {isUpdatingPublication
                      ? 'Saving...'
                      : roamingPublished
                        ? 'Unpublish'
                        : 'Publish'}
                  </button>
                </div>
              </div>
            )}

            {!canWriteChargePoints && (
              <div className="mt-3 rounded-lg border border-border bg-bg-muted/40 px-3 py-2 text-xs text-subtle flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5" />
                Confirm and publish actions require `chargePointsWrite` permissions.
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">
              <Cpu size={16} style={{ color: 'var(--accent)' }} />
              Device Information
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Model', chargePoint.model],
                ['Manufacturer', chargePoint.manufacturer],
                ['Serial Number', chargePoint.serialNumber],
                ['Firmware', chargePoint.firmwareVersion],
                ['Connector Types', connectorTypes.join(', ')],
                ['OCPP ID', chargePoint.ocppId],
                ['OCPP Version', chargePoint.ocppVersion],
                ['Max Power', `${chargePoint.maxCapacityKw} kW`],
                ['Status', chargePoint.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">OCPI Roaming Publication</div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${roamingPublished ? 'text-ok' : 'text-muted'}`}>
                {roamingPublished ? <Wifi size={14} /> : <WifiOff size={14} />}
                {roamingPublished ? 'Published to roaming network' : 'Not published'}
              </span>
              <button
                className={`btn sm ${roamingPublished ? 'secondary' : 'primary'}`}
                onClick={() => handleSetPublication(!roamingPublished)}
                disabled={!canWriteChargePoints || isUpdatingPublication}
              >
                {isUpdatingPublication
                  ? 'Saving...'
                  : roamingPublished
                    ? 'Disable Roaming'
                    : 'Enable Roaming'}
              </button>
            </div>
            {!identityConfirmed && (
              <div className="mt-3 text-xs text-subtle">
                Publication is gated until BootNotification and identity confirmation are complete.
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="section-title">Recent Sessions</div>
              <select
                className="input !h-9 !py-0 w-[180px]"
                value={effectiveSessionConnectorFilter}
                onChange={(event) => setSessionConnectorFilter(event.target.value)}
              >
                {connectorFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Connector Types' : option}
                  </option>
                ))}
              </select>
            </div>

            {isSessionsLoading ? (
              <div className="mt-4 text-sm text-subtle">Loading recent sessions...</div>
            ) : visibleRecentSessions.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 px-4 py-5 text-sm text-subtle">
                No recent sessions found for this connector selection.
              </div>
            ) : (
              <div className="table-wrap mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Started</th>
                      <th>Connector Type</th>
                      <th>Energy</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="font-mono text-xs">{session.id}</td>
                        <td className="text-xs">{session.started}</td>
                        <td className="text-xs">{session.connectorType}</td>
                        <td className="text-sm">{session.energy}</td>
                        <td className="text-sm">{session.amount}</td>
                        <td>
                          <span className={`pill ${session.status === 'Active' ? 'active' : session.status === 'Completed' ? 'online' : 'faulted'}`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="section-title">Remote Commands</div>
            {cmdFeedback && (
              <div className={`alert ${cmdFeedback.startsWith('✓') ? 'success' : 'info'} text-xs mb-3`}>
                {cmdFeedback}
              </div>
            )}
            {hasRestrictedAccess && (
              <div className="rounded-lg border border-border bg-bg-muted/40 px-3 py-3 text-xs text-subtle mb-3">
                Remote control actions respect your current backend scope and temporary access window.
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {remoteCommands.map((command) => (
                <span
                  key={command}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-muted px-2.5 py-1 text-[11px] font-semibold text-subtle"
                >
                  {COMMAND_ICONS[command]}
                  {command}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Session Control</div>
                    <div className="text-[11px] text-subtle">
                      Start a session or stop the current one from this charge point.
                    </div>
                  </div>
                  <span className={`pill ${activeSession ? 'active' : 'faulted'}`}>
                    {activeSession ? activeSession.status : 'No Active Session'}
                  </span>
                </div>

                <form className="mt-4 space-y-3" onSubmit={handleRemoteStart}>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="form-label">Id Tag</label>
                      <input
                        value={startDraft.idTag}
                        onChange={(event) => setStartDraft((draft) => ({ ...draft, idTag: event.target.value }))}
                        className="input"
                        disabled={!canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                        placeholder="EVZONE_REMOTE"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Connector ID</label>
                        <input
                          type="number"
                          min={1}
                          value={startDraft.connectorId}
                          onChange={(event) => setStartDraft((draft) => ({ ...draft, connectorId: event.target.value }))}
                          className="input"
                          disabled={!canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                        />
                      </div>

                      <div>
                        <label className="form-label">EVSE ID</label>
                        <input
                          type="number"
                          min={1}
                          value={startDraft.evseId}
                          onChange={(event) => setStartDraft((draft) => ({ ...draft, evseId: event.target.value }))}
                          className="input"
                          disabled={!canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn primary sm"
                      disabled={!canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                    >
                      {commandIsPending ? 'Sending...' : 'Start Session'}
                    </button>
                  </div>
                </form>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Remote Stop Session</div>
                      <div className="text-[11px] text-subtle">
                        Stops the active session on this charge point.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn secondary sm"
                      onClick={handleStopSession}
                      disabled={!activeSession || !canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                    >
                      Stop Session
                    </button>
                  </div>

                  {activeSession ? (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg border border-border bg-bg-base px-3 py-2 text-xs text-subtle">
                        Active session <span className="font-mono text-text">{activeSession.id}</span> started at {activeSession.started}
                      </div>
                      <div>
                        <label className="form-label">Stop Reason</label>
                        <input
                          className="input"
                          value={stopReason}
                          onChange={(event) => setStopReason(event.target.value)}
                          disabled={!canRunSessionCommands || temporaryAccessState === 'expired' || commandIsPending}
                          placeholder="Optional reason for stopping the session"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-subtle">
                      No active session is currently running on this charge point.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg-muted/30 p-4">
                <div className="text-sm font-semibold">Hardware Commands</div>
                <div className="text-[11px] text-subtle mb-3">
                  Power-cycle or release the connector without affecting the session record.
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    className="btn secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleQuickCommand('Soft Reset', `/api/v1/charge-points/${id}/commands/soft-reset`)}
                    disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                  >
                    <RotateCcw size={14} />
                    Soft Reset
                  </button>
                  <button
                    type="button"
                    className="btn secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleQuickCommand('Hard Reboot', `/api/v1/charge-points/${id}/reboot`)}
                    disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                  >
                    <RotateCcw size={14} />
                    Hard Reboot
                  </button>
                  <button
                    type="button"
                    className="btn secondary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleQuickCommand('Unlock Connector', `/api/v1/charge-points/${id}/commands/unlock`, { connectorId: 1, evseId: 1 })}
                    disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                  >
                    <Unlock size={14} />
                    Unlock Connector
                  </button>
                </div>
              </div>

              <form className="rounded-xl border border-border bg-bg-muted/30 p-4 space-y-4" onSubmit={handleFirmwareSubmit}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Firmware Update</div>
                    <div className="text-[11px] text-subtle">
                      Provide a secure firmware location and the retrieval schedule for the update.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn primary sm"
                    disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                  >
                    {commandIsPending ? 'Sending...' : 'Queue Update'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="form-label">Firmware URL</label>
                    <input
                      value={firmwareDraft.location}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, location: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="https://firmware.example.com/device.bin"
                    />
                  </div>

                  <div>
                    <label className="form-label">Retrieve At</label>
                    <input
                      type="datetime-local"
                      value={firmwareDraft.retrieveAt}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, retrieveAt: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                    />
                  </div>

                  <div>
                    <label className="form-label">Install At</label>
                    <input
                      type="datetime-local"
                      value={firmwareDraft.installAt}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, installAt: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                    />
                  </div>

                  <div>
                    <label className="form-label">Retries</label>
                    <input
                      type="number"
                      min={0}
                      value={firmwareDraft.retries}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, retries: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="form-label">Retry Interval (sec)</label>
                    <input
                      type="number"
                      min={0}
                      value={firmwareDraft.retryIntervalSec}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, retryIntervalSec: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="form-label">Request ID</label>
                    <input
                      type="number"
                      min={1}
                      value={firmwareDraft.requestId}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, requestId: event.target.value }))}
                      className="input"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Signing Certificate</label>
                    <textarea
                      value={firmwareDraft.signingCertificate}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, signingCertificate: event.target.value }))}
                      className="input min-h-[88px]"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="Optional certificate or public key chain"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Signature</label>
                    <textarea
                      value={firmwareDraft.signature}
                      onChange={(event) => setFirmwareDraft((draft) => ({ ...draft, signature: event.target.value }))}
                      className="input min-h-[88px]"
                      disabled={!canRunDeviceCommands || temporaryAccessState === 'expired' || commandIsPending}
                      placeholder="Optional digital signature for the firmware package"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Unit Health</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>OCPP Connection</span>
                <span style={{ color: 'var(--ok)' }}>{unitHealth.ocppConnection}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Last Heartbeat</span>
                <span>{unitHealth.lastHeartbeat}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Error Code</span>
                <span>{unitHealth.errorCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
