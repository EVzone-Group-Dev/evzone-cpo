import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeContextValue } from './themeContext'
import { applyThemeToDocument, getSystemTheme, resolveThemeMode } from './themeUtils'
import { theme, type ThemeMode, type ResolvedTheme } from './theme'

const THEME_STORAGE_KEY = 'evzone-cpo-central.theme-mode'

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedThemeMode = window.localStorage.getItem('evzone-cpo-central.theme-mode')
  return storedThemeMode === 'system' || storedThemeMode === 'light' || storedThemeMode === 'dark'
    ? storedThemeMode
    : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => readStoredThemeMode())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const resolvedTheme = resolveThemeMode(themeMode, systemTheme)

  useEffect(() => {
    applyThemeToDocument(resolvedTheme)
  }, [resolvedTheme])

  const setThemeMode = useCallback((nextThemeMode: ThemeMode) => {
    setThemeModeState(nextThemeMode)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeModeState((current) => {
      if (current === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark'
      }

      return current === 'dark' ? 'light' : 'dark'
    })
  }, [systemTheme])

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    themeMode,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    setThemeMode,
    toggleTheme,
  }), [resolvedTheme, setThemeMode, themeMode, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
