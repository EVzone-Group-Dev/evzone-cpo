import { useState, useMemo } from 'react'
import { Globe2, Search, X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTenant } from '@/core/hooks/useTenant'
import { useLocalization } from '@/core/i18n/useLocalization'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function LocalizationModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const { availableCountries, availableLanguages } = useTenant()
  const { currentLanguage, changeLanguage, changeRegion, region } = useLocalization()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  const [selectedRegion, setSelectedRegion] = useState(region)

  const filteredCountries = useMemo(() => {
    if (!availableCountries) return []
    return availableCountries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code2.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [availableCountries, searchQuery])

  if (!isOpen) return null

  const handleApply = () => {
    changeLanguage(selectedLanguage)
    changeRegion(selectedRegion)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Globe2 size={18} />
            </div>
            <h2 className="text-lg font-bold">{t('common.localization')}</h2>
          </div>
          <button onClick={onClose} className="btn ghost icon sm">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Language Selection */}
          <div className="border-b border-border p-6 md:border-b-0 md:border-r">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle">{t('settings.language')}</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 sidebar-scroll">
              {availableLanguages?.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    selectedLanguage === lang 
                      ? 'border-accent bg-accent/5 text-accent font-semibold' 
                      : 'border-border bg-bg-muted/35 hover:border-accent/50'
                  }`}
                >
                  <span>{lang}</span>
                  {selectedLanguage === lang && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Region Selection */}
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle">{t('settings.region')}</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={14} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  className="input pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-2 sidebar-scroll">
              {filteredCountries.map((country) => (
                <button
                  key={country.code2}
                  onClick={() => setSelectedRegion(country.code2)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                    selectedRegion === country.code2 
                      ? 'border-accent bg-accent/5 text-accent font-semibold' 
                      : 'border-border bg-bg-muted/35 hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-subtle">{country.code2}</span>
                    <span>{country.name}</span>
                  </div>
                  {selectedRegion === country.code2 && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-bg-muted/30 px-6 py-4">
          <button onClick={onClose} className="btn secondary">{t('common.cancel')}</button>
          <button onClick={handleApply} className="btn primary px-8">{t('common.apply')}</button>
        </div>
      </div>
    </div>
  )
}
