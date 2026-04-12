import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Globe2,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Save,
  Send,
  Type,
  Undo2,
  UploadCloud,
} from 'lucide-react'
import {
  fetchTenantBrandingState,
  listPlatformTenants,
  publishTenantBrandingDraft,
  rollbackTenantBranding,
  saveTenantBrandingDraft,
  uploadTenantBrandingAsset,
} from '@/core/api/tenantBranding'
import {
  type BrandingDraftResponse,
  type PlatformTenantSummary,
  type WhiteLabelConfigV1,
} from '@/core/types/branding'
import { useAuthStore } from '@/core/auth/authStore'
import { useTenant } from '@/core/hooks/useTenant'
import { useBranding } from '@/core/branding/useBranding'

const ASSET_FIELD_BY_KIND = {
  logo: 'logoUrl',
  logoIcon: 'logoIconUrl',
  favicon: 'faviconUrl',
} as const

type AssetKind = keyof typeof ASSET_FIELD_BY_KIND

function isHttpUrl(value: string): boolean {
  if (!value.trim()) {
    return false
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

function toAllowedOrigins(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function validateBrandingConfig(config: WhiteLabelConfigV1): string[] {
  const issues: string[] = []

  if (!config.branding.appName.trim()) {
    issues.push('App name is required.')
  }

  if (!config.branding.shortName.trim()) {
    issues.push('Short name is required.')
  }

  if (!isHexColor(config.theme.primaryColor)) {
    issues.push('Primary color must use 6-digit hex format (example: #14C78B).')
  }

  if (config.theme.accentColor && !isHexColor(config.theme.accentColor)) {
    issues.push('Accent color must use 6-digit hex format when provided.')
  }

  if (!Number.isInteger(config.theme.borderRadiusPx) || config.theme.borderRadiusPx < 0 || config.theme.borderRadiusPx > 32) {
    issues.push('Border radius must be an integer between 0 and 32.')
  }

  if (config.domain.primaryDomain && /:\/\//.test(config.domain.primaryDomain)) {
    issues.push('Primary domain should not include a protocol (use host only).')
  }

  for (const origin of config.domain.allowedOrigins) {
    if (!isHttpUrl(origin)) {
      issues.push(`Allowed origin is invalid: ${origin}`)
      break
    }
  }

  const optionalUrls = [
    config.branding.logoUrl,
    config.branding.logoIconUrl,
    config.branding.faviconUrl,
    config.legal.termsUrl,
    config.legal.privacyUrl,
    config.legal.supportUrl,
  ]

  for (const value of optionalUrls) {
    if (value && !isHttpUrl(value)) {
      issues.push(`URL is invalid: ${value}`)
      break
    }
  }

  return issues
}

export function WhiteLabelPage() {
  const { user } = useAuthStore()
  const { activeTenant } = useTenant()
  const { refreshBranding, branding: runtimeBranding } = useBranding()

  const permissionSet = useMemo(
    () => new Set(user?.accessProfile?.permissions ?? []),
    [user?.accessProfile?.permissions],
  )

  const canManageCrossTenant =
    permissionSet.has('platform.tenants.read') ||
    permissionSet.has('platform.tenants.write')

  const [platformTenants, setPlatformTenants] = useState<PlatformTenantSummary[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [brandingState, setBrandingState] = useState<BrandingDraftResponse | null>(null)
  const [draftConfig, setDraftConfig] = useState<WhiteLabelConfigV1 | null>(null)
  const [baselineConfig, setBaselineConfig] = useState<WhiteLabelConfigV1 | null>(null)
  const [allowedOriginsInput, setAllowedOriginsInput] = useState('')
  const [assetUrlDrafts, setAssetUrlDrafts] = useState<Record<AssetKind, string>>({
    logo: '',
    logoIcon: '',
    favicon: '',
  })
  const [selectedRollbackVersion, setSelectedRollbackVersion] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [uploadingAssetKind, setUploadingAssetKind] = useState<AssetKind | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!canManageCrossTenant || selectedTenantId || !activeTenant?.id) {
      return
    }

    setSelectedTenantId(activeTenant.id)
  }, [activeTenant?.id, canManageCrossTenant, selectedTenantId])

  useEffect(() => {
    if (!canManageCrossTenant) {
      setPlatformTenants([])
      return
    }

    void (async () => {
      try {
        const tenants = await listPlatformTenants()
        setPlatformTenants(tenants)
      } catch {
        setPlatformTenants([])
      }
    })()
  }, [canManageCrossTenant])

  const targetTenantId = canManageCrossTenant ? selectedTenantId : null

  const loadBrandingState = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const state = await fetchTenantBrandingState({ tenantId: targetTenantId })
      setBrandingState(state)

      const initialConfig = state.draft?.config ?? state.activeConfig
      setDraftConfig(initialConfig)
      setBaselineConfig(initialConfig)
      setAllowedOriginsInput(initialConfig.domain.allowedOrigins.join('\n'))
      setAssetUrlDrafts({
        logo: initialConfig.branding.logoUrl ?? '',
        logoIcon: initialConfig.branding.logoIconUrl ?? '',
        favicon: initialConfig.branding.faviconUrl ?? '',
      })

      if (state.revisions.length > 0) {
        setSelectedRollbackVersion(state.revisions[0].version)
      } else {
        setSelectedRollbackVersion(null)
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [targetTenantId])

  useEffect(() => {
    void loadBrandingState()
  }, [loadBrandingState])

  const hasUnsavedChanges = useMemo(() => {
    if (!draftConfig || !baselineConfig) {
      return false
    }

    return JSON.stringify(draftConfig) !== JSON.stringify(baselineConfig)
  }, [baselineConfig, draftConfig])

  const setBrandingField = useCallback(
    (field: keyof WhiteLabelConfigV1['branding'], value: string | null) => {
      setDraftConfig((current) => {
        if (!current) return current
        return {
          ...current,
          branding: {
            ...current.branding,
            [field]: value,
          },
        }
      })
    },
    [],
  )

  const applyLoadedState = useCallback((state: BrandingDraftResponse) => {
    setBrandingState(state)
    const nextConfig = state.draft?.config ?? state.activeConfig
    setDraftConfig(nextConfig)
    setBaselineConfig(nextConfig)
    setAllowedOriginsInput(nextConfig.domain.allowedOrigins.join('\n'))
    setAssetUrlDrafts({
      logo: nextConfig.branding.logoUrl ?? '',
      logoIcon: nextConfig.branding.logoIconUrl ?? '',
      favicon: nextConfig.branding.faviconUrl ?? '',
    })
    setSuccessMessage(null)
    setErrorMessage(null)
  }, [])

  const handleSaveDraft = useCallback(async () => {
    if (!draftConfig) {
      return
    }

    const issues = validateBrandingConfig(draftConfig)
    if (issues.length > 0) {
      setErrorMessage(issues[0])
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const savedState = await saveTenantBrandingDraft(draftConfig, {
        tenantId: targetTenantId,
      })
      applyLoadedState(savedState)
      setSuccessMessage('Draft saved successfully.')
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }, [applyLoadedState, draftConfig, targetTenantId])

  const handlePublish = useCallback(async () => {
    if (!draftConfig) {
      return
    }

    const issues = validateBrandingConfig(draftConfig)
    if (issues.length > 0) {
      setErrorMessage(issues[0])
      return
    }

    setIsPublishing(true)
    setErrorMessage(null)

    try {
      const publishedState = await publishTenantBrandingDraft({
        tenantId: targetTenantId,
      })
      applyLoadedState(publishedState)
      setSuccessMessage('Branding published successfully.')
      await refreshBranding()
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setIsPublishing(false)
    }
  }, [applyLoadedState, draftConfig, refreshBranding, targetTenantId])

  const handleRollback = useCallback(async () => {
    if (!selectedRollbackVersion) {
      setErrorMessage('Select a revision version to rollback.')
      return
    }

    setIsRollingBack(true)
    setErrorMessage(null)

    try {
      const rolledBackState = await rollbackTenantBranding(selectedRollbackVersion, {
        tenantId: targetTenantId,
      })
      applyLoadedState(rolledBackState)
      setSuccessMessage(`Rolled back to version ${selectedRollbackVersion}.`)
      await refreshBranding()
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    } finally {
      setIsRollingBack(false)
    }
  }, [applyLoadedState, refreshBranding, selectedRollbackVersion, targetTenantId])

  const handleUploadFile = useCallback(
    async (assetKind: AssetKind, file: File) => {
      setUploadingAssetKind(assetKind)
      setErrorMessage(null)

      try {
        const uploaded = await uploadTenantBrandingAsset(
          { assetKind, file },
          { tenantId: targetTenantId },
        )

        const brandingField = ASSET_FIELD_BY_KIND[assetKind]
        setBrandingField(brandingField, uploaded.assetUrl)
        setAssetUrlDrafts((current) => ({ ...current, [assetKind]: uploaded.assetUrl }))
        setSuccessMessage(`${assetKind} uploaded.`)
      } catch (error) {
        setErrorMessage(extractErrorMessage(error))
      } finally {
        setUploadingAssetKind(null)
      }
    },
    [setBrandingField, targetTenantId],
  )

  const handleApplyAssetUrl = useCallback(
    async (assetKind: AssetKind) => {
      const assetUrl = assetUrlDrafts[assetKind]?.trim()
      if (!assetUrl) {
        setErrorMessage('Enter an asset URL first.')
        return
      }

      if (!isHttpUrl(assetUrl)) {
        setErrorMessage('Asset URL must use http or https.')
        return
      }

      setUploadingAssetKind(assetKind)
      setErrorMessage(null)

      try {
        const uploaded = await uploadTenantBrandingAsset(
          { assetKind, assetUrl },
          { tenantId: targetTenantId },
        )

        const brandingField = ASSET_FIELD_BY_KIND[assetKind]
        setBrandingField(brandingField, uploaded.assetUrl)
        setAssetUrlDrafts((current) => ({ ...current, [assetKind]: uploaded.assetUrl }))
        setSuccessMessage(`${assetKind} URL applied.`)
      } catch (error) {
        setErrorMessage(extractErrorMessage(error))
      } finally {
        setUploadingAssetKind(null)
      }
    },
    [assetUrlDrafts, setBrandingField, targetTenantId],
  )

  return (
    <DashboardLayout pageTitle="White-label Config">
      <div className="space-y-4">
        {canManageCrossTenant && (
          <div className="card flex flex-col gap-2">
            <label className="form-label">Tenant Selector</label>
            <select
              className="input"
              value={selectedTenantId ?? ''}
              onChange={(event) => setSelectedTenantId(event.target.value || null)}
            >
              {platformTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {errorMessage && <div className="alert danger">{errorMessage}</div>}
        {successMessage && <div className="alert success">{successMessage}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <div className="section-title flex items-center gap-2"><Type size={16} className="text-accent" /> Brand Identity</div>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="form-label">Application Name</label>
                  <input
                    className="input"
                    value={draftConfig?.branding.appName ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      branding: { ...current.branding, appName: event.target.value },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Short Name</label>
                  <input
                    className="input"
                    value={draftConfig?.branding.shortName ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      branding: { ...current.branding, shortName: event.target.value },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Primary Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={draftConfig?.theme.primaryColor ?? '#14C78B'}
                      onChange={(event) => setDraftConfig((current) => current ? ({
                        ...current,
                        theme: { ...current.theme, primaryColor: event.target.value.toUpperCase() },
                      }) : current)}
                      className="w-12 h-10 rounded border border-[var(--border)]"
                    />
                    <input
                      className="input font-mono"
                      value={draftConfig?.theme.primaryColor ?? ''}
                      onChange={(event) => setDraftConfig((current) => current ? ({
                        ...current,
                        theme: { ...current.theme, primaryColor: event.target.value },
                      }) : current)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Accent Color</label>
                  <input
                    className="input font-mono"
                    value={draftConfig?.theme.accentColor ?? ''}
                    placeholder="#0EA672"
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      theme: { ...current.theme, accentColor: event.target.value || null },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Border Radius (px)</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    max={32}
                    value={draftConfig?.theme.borderRadiusPx ?? 8}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      theme: { ...current.theme, borderRadiusPx: Number.parseInt(event.target.value || '0', 10) },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Font Family</label>
                  <select
                    className="input"
                    value={draftConfig?.theme.fontFamily ?? 'Inter'}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      theme: { ...current.theme, fontFamily: event.target.value as WhiteLabelConfigV1['theme']['fontFamily'] },
                    }) : current)}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title flex items-center gap-2"><Globe2 size={16} className="text-accent" /> Domain & Legal</div>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="form-label">Primary Custom Domain</label>
                  <input
                    className="input"
                    placeholder="portal.acme.com"
                    value={draftConfig?.domain.primaryDomain ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      domain: { ...current.domain, primaryDomain: event.target.value || null },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Allowed Origins (one per line)</label>
                  <textarea
                    className="input min-h-[100px]"
                    value={allowedOriginsInput}
                    onChange={(event) => {
                      const nextInput = event.target.value
                      setAllowedOriginsInput(nextInput)
                      setDraftConfig((current) => current ? ({
                        ...current,
                        domain: {
                          ...current.domain,
                          allowedOrigins: toAllowedOrigins(nextInput),
                        },
                      }) : current)
                    }}
                  />
                </div>

                <div>
                  <label className="form-label">Support Email</label>
                  <input
                    className="input"
                    value={draftConfig?.support.email ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      support: { ...current.support, email: event.target.value || null },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Terms URL</label>
                  <input
                    className="input"
                    value={draftConfig?.legal.termsUrl ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      legal: { ...current.legal, termsUrl: event.target.value || null },
                    }) : current)}
                  />
                </div>

                <div>
                  <label className="form-label">Privacy URL</label>
                  <input
                    className="input"
                    value={draftConfig?.legal.privacyUrl ?? ''}
                    onChange={(event) => setDraftConfig((current) => current ? ({
                      ...current,
                      legal: { ...current.legal, privacyUrl: event.target.value || null },
                    }) : current)}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title flex items-center gap-2"><ImageIcon size={16} className="text-accent" /> Brand Assets</div>
              <div className="space-y-4 mt-4">
                {(['logo', 'logoIcon', 'favicon'] as AssetKind[]).map((assetKind) => (
                  <div key={assetKind} className="p-3 border border-[var(--border)] rounded-lg space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide">{assetKind}</div>
                    <input
                      className="input"
                      placeholder="https://cdn.example.com/logo.png"
                      value={assetUrlDrafts[assetKind]}
                      onChange={(event) => setAssetUrlDrafts((current) => ({ ...current, [assetKind]: event.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn secondary"
                        onClick={() => void handleApplyAssetUrl(assetKind)}
                        disabled={uploadingAssetKind === assetKind}
                      >
                        <UploadCloud size={14} /> Apply URL
                      </button>
                      <label className="btn ghost cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                              void handleUploadFile(assetKind, file)
                            }
                          }}
                        />
                        <UploadCloud size={14} /> Upload
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn primary" onClick={() => void handleSaveDraft()} disabled={!draftConfig || isSaving || isLoading}>
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
              </button>
              <button className="btn secondary" onClick={() => void handlePublish()} disabled={!draftConfig || isPublishing || isLoading}>
                {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Publish
              </button>
              <button className="btn ghost" onClick={() => void loadBrandingState()} disabled={isLoading}>
                <RefreshCw size={14} /> Reload
              </button>
            </div>

            <div className="text-xs" style={{ color: hasUnsavedChanges ? 'var(--warning)' : 'var(--text-subtle)' }}>
              {hasUnsavedChanges ? 'You have unsaved branding changes.' : 'Draft is synced with latest saved state.'}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="section-title flex items-center gap-2"><Palette size={16} className="text-accent" /> Live Preview</div>
              <div className="mt-4 p-4 border border-[var(--border)] rounded-xl" style={{
                borderRadius: `${draftConfig?.theme.borderRadiusPx ?? runtimeBranding.theme.borderRadiusPx}px`,
                fontFamily: `'${draftConfig?.theme.fontFamily ?? runtimeBranding.theme.fontFamily}', 'Segoe UI', system-ui, sans-serif`,
              }}>
                <div className="flex items-center gap-3 mb-4">
                  {(draftConfig?.branding.logoUrl ?? runtimeBranding.branding.logoUrl) ? (
                    <img src={(draftConfig?.branding.logoUrl ?? runtimeBranding.branding.logoUrl) || ''} alt="Brand" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded flex items-center justify-center text-white" style={{ background: draftConfig?.theme.primaryColor ?? runtimeBranding.theme.primaryColor }}>
                      <Type size={16} />
                    </div>
                  )}
                  <div>
                    <div className="font-bold" style={{ color: 'var(--text)' }}>{draftConfig?.branding.appName ?? runtimeBranding.branding.appName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>{brandingState?.tenantName ?? activeTenant?.name ?? 'Tenant'}</div>
                  </div>
                </div>
                <button className="btn primary">Primary Action</button>
              </div>
            </div>

            <div className="card">
              <div className="section-title flex items-center gap-2"><Undo2 size={16} className="text-accent" /> Publish History</div>
              <div className="space-y-2 mt-4">
                <select
                  className="input"
                  value={selectedRollbackVersion ?? ''}
                  onChange={(event) => setSelectedRollbackVersion(Number.parseInt(event.target.value, 10))}
                >
                  {brandingState?.revisions.map((revision) => (
                    <option key={revision.id} value={revision.version}>
                      v{revision.version} - {revision.status} ({revision.publishedAt ?? revision.updatedAt})
                    </option>
                  ))}
                </select>
                <button className="btn secondary" onClick={() => void handleRollback()} disabled={isRollingBack || !selectedRollbackVersion}>
                  {isRollingBack ? <RefreshCw size={14} className="animate-spin" /> : <Undo2 size={14} />} Rollback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
