import type { ResolvedTheme, ThemeMode } from './theme'

const THEME_STORAGE_KEY = 'evzone-cpo-central.theme-mode'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedThemeMode = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(storedThemeMode) ? storedThemeMode : 'system'
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveThemeMode(themeMode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return themeMode === 'system' ? systemTheme : themeMode
}

export function applyThemeToDocument(resolvedTheme: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme
}

export function initializeTheme() {
  const themeMode = readStoredThemeMode()
  applyThemeToDocument(resolveThemeMode(themeMode, getSystemTheme()))
}
