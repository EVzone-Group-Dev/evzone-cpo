import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/core/auth/authStore'
import { loadSettingsDraft, saveSettingsDraft, type SettingsDraft } from '@/core/settings/settingsPreferences'

export function useLocalization() {
  const { i18n, t } = useTranslation()
  const { user } = useAuthStore()

  const currentLanguage = i18n.language
  const settings = loadSettingsDraft(user?.id)

  const changeLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang)
    
    if (user?.id) {
      const currentSettings = loadSettingsDraft(user.id) as SettingsDraft | null
      if (currentSettings) {
        saveSettingsDraft(user.id, {
          ...currentSettings,
          language: lang,
        })
      }
    }
  }, [i18n, user?.id])

  const changeRegion = useCallback((countryCode: string) => {
    if (user?.id) {
      const currentSettings = loadSettingsDraft(user.id) as SettingsDraft | null
      if (currentSettings) {
        saveSettingsDraft(user.id, {
          ...currentSettings,
          tenantCountryCode: countryCode,
        })
      }
    }
  }, [user?.id])

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    changeRegion,
    region: settings?.tenantCountryCode || 'US',
  }
}
