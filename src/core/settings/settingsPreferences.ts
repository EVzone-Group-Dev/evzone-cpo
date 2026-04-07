export type ScreenDensity = 'Comfortable' | 'Compact'
export type SessionTimeout = '15 minutes' | '30 minutes' | '1 hour'

export interface SettingsDraft {
  currency: string
  dailyDigest: boolean
  email: string
  language: string
  mfaEnabled: boolean
  name: string
  recentAccessAlerts: boolean
  screenDensity: ScreenDensity
  sessionTimeout: SessionTimeout
  tenantCity: string
  tenantCountryCode: string
  tenantStateCode: string
  weeklyOpsReport: boolean
}

const STORAGE_PREFIX = 'evzone-cpo-central.settings'
const inMemoryStorage = new Map<string, string>()
type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorageKey(userId: string | null | undefined) {
  return userId ? `${STORAGE_PREFIX}.${userId}` : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getBrowserStorage(): StorageBackend | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storage = window.localStorage as Partial<Storage> | undefined
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
    return null
  }

  return storage as StorageBackend
}

export function loadSettingsDraft(userId: string | null | undefined): Partial<SettingsDraft> | null {
  const key = getStorageKey(userId)
  if (!key) {
    return null
  }

  const browserStorage = getBrowserStorage()
  const rawValue = browserStorage?.getItem(key) ?? inMemoryStorage.get(key) ?? null
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)
    return isRecord(parsed) ? (parsed as Partial<SettingsDraft>) : null
  } catch {
    return null
  }
}

export function saveSettingsDraft(userId: string | null | undefined, draft: SettingsDraft) {
  const key = getStorageKey(userId)
  if (!key) {
    return
  }

  const serializedDraft = JSON.stringify(draft)
  const browserStorage = getBrowserStorage()

  if (browserStorage) {
    browserStorage.setItem(key, serializedDraft)
    return
  }

  inMemoryStorage.set(key, serializedDraft)
}

export function applySavedSettings(baseDraft: SettingsDraft, savedDraft: Partial<SettingsDraft> | null) {
  return savedDraft ? { ...baseDraft, ...savedDraft } : baseDraft
}

export function clearSettingsDraft(userId: string | null | undefined) {
  const key = getStorageKey(userId)
  if (!key) {
    return
  }

  const browserStorage = getBrowserStorage()
  if (browserStorage) {
    browserStorage.removeItem(key)
  }

  inMemoryStorage.delete(key)
}
