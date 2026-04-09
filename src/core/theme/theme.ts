export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const theme = {
  colors: {
    // Brand Colors from Logo
    primary: '#14C78B',
    secondary: '#F0810F',

    // UI Neutrals
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',

    // Status Colors
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',

    // Dark Mode Variants
    dark: {
      background: '#0F172A',
      surface: '#1E293B',
      textPrimary: '#F8FAFC',
    },
  },
  spacing: (factor: number) => `${factor * 8}px`,
  borderRadius: '8px',
  shadows: {
    soft: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
}

export type Theme = typeof theme
