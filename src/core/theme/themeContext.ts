import { createContext, useContext } from 'react'
import type { Theme, ThemeMode, ResolvedTheme } from './theme'

export interface ThemeContextValue {
  theme: Theme
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  isDark: boolean
  isLight: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
