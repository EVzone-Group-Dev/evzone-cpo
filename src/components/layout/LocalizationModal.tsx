import { useState, useMemo } from 'react'
import { Globe2, Search, X, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTenant } from '@/core/hooks/useTenant'
import { useLocalization } from '@/core/i18n/useLocalization'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function LocalizationModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const { availableCountries } = useTenant()
  const { currentLanguage, changeLanguage, changeRegion, region } = useLocalization()
  
  const [selectedRegionCode, setSelectedRegionCode] = useState(region)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [regionSearchQuery, setRegionSearchQuery] = useState('')

  const selectedCountry = useMemo(() => 
    availableCountries?.find(c => c.code2 === selectedRegionCode) || availableCountries?.[0],
    [availableCountries, selectedRegionCode]
  )

  const filteredCountries = useMemo(() => {
    if (!availableCountries) return []
    return availableCountries.filter(c => 
      c.name.toLowerCase().includes(regionSearchQuery.toLowerCase()) || 
      c.code2.toLowerCase().includes(regionSearchQuery.toLowerCase())
    )
  }, [availableCountries, regionSearchQuery])

  const languagesForRegion = useMemo(() => {
    if (!selectedCountry) return ['English']
    const langs = selectedCountry.languages || []
    return langs.length > 0 ? langs : ['English']
  }, [selectedCountry])

  if (!isOpen) return null

  const handleApply = () => {
    changeLanguage(selectedLanguage)
    changeRegion(selectedRegionCode)
    onClose()
  }

  const handleRegionSelect = (code: string) => {
    setSelectedRegionCode(code)
    setIsRegionDropdownOpen(false)
    // Default to the first language of the new region if current one isn't available
    const newCountry = availableCountries?.find(c => c.code2 === code)
    if (newCountry && newCountry.languages && !newCountry.languages.includes(selectedLanguage)) {
      setSelectedLanguage(newCountry.languages[0])
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
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

        <div className="p-6 space-y-6">
          {/* Region Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-subtle uppercase tracking-wider">{t('settings.region')}</label>
            <div className="relative">
              <button
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-muted/35 px-4 py-3 hover:border-accent/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-subtle">{selectedCountry?.code2}</span>
                  <span className="font-medium">{selectedCountry?.name || 'Select Region'}</span>
                </div>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRegionDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-[110] mt-2 max-h-[300px] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-border bg-bg-muted/30">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={14} />
                      <input
                        type="text"
                        autoFocus
                        placeholder={t('common.search')}
                        className="input sm pl-9"
                        value={regionSearchQuery}
                        onChange={(e) => setRegionSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[200px] p-1 sidebar-scroll">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code2}
                        onClick={() => handleRegionSelect(country.code2)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedRegionCode === country.code2 
                            ? 'bg-accent/10 text-accent font-semibold' 
                            : 'hover:bg-bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-subtle w-6 text-left">{country.code2}</span>
                          <span>{country.name}</span>
                        </div>
                        {selectedRegionCode === country.code2 && <Check size={14} />}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="px-4 py-8 text-center text-subtle text-xs">
                        No regions found matching your search.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Language Selection Grid */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-subtle uppercase tracking-wider">{t('settings.language')}</label>
            <div className="grid grid-cols-1 gap-2">
              {languagesForRegion.map((lang) => (
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
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-bg-muted/30 px-6 py-4">
          <button onClick={onClose} className="btn secondary">{t('common.cancel')}</button>
          <button onClick={handleApply} className="btn primary px-8">{t('common.apply')}</button>
        </div>
      </div>
    </div>
  )
}
