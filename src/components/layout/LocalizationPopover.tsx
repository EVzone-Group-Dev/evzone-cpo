import { useState, useMemo, useRef, useEffect } from 'react'
import { Globe2, Search, X, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTenant } from '@/core/hooks/useTenant'
import { useLocalization } from '@/core/i18n/useLocalization'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function LocalizationPopover({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const { availableCountries } = useTenant()
  const { currentLanguage, changeLanguage, changeRegion, region } = useLocalization()
  
  const [selectedRegionCode, setSelectedRegionCode] = useState(region)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [regionSearchQuery, setRegionSearchQuery] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (isOpen && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('mousedown', handlePointerDown)
    }
    
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleApply = () => {
    changeLanguage(selectedLanguage)
    changeRegion(selectedRegionCode)
    onClose()
  }

  const handleRegionSelect = (code: string) => {
    setSelectedRegionCode(code)
    setIsRegionDropdownOpen(false)
    const newCountry = availableCountries?.find(c => c.code2 === code)
    if (newCountry && newCountry.languages && !newCountry.languages.includes(selectedLanguage)) {
      setSelectedLanguage(newCountry.languages[0])
    }
  }

  return (
    <div 
      ref={popoverRef}
      className="absolute right-0 top-12 z-[100] w-[320px] overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Globe2 size={14} />
          </div>
          <h2 className="text-sm font-bold">{t('common.localization')}</h2>
        </div>
        <button onClick={onClose} className="text-subtle hover:text-text transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Region Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider">{t('settings.region')}</label>
          <div className="relative">
            <button
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-muted/35 px-3 py-2 hover:border-accent/50 transition-all text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-subtle">{selectedCountry?.code2}</span>
                <span className="font-medium truncate max-w-[180px]">{selectedCountry?.name || 'Select Region'}</span>
              </div>
              <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRegionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-[110] mt-1 max-h-[200px] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl animate-in fade-in slide-in-from-top-1">
                <div className="p-1.5 border-b border-border bg-bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-subtle" size={12} />
                    <input
                      type="text"
                      autoFocus
                      placeholder={t('common.search')}
                      className="input !h-7 !text-[11px] pl-7"
                      value={regionSearchQuery}
                      onChange={(e) => setRegionSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[140px] p-1 sidebar-scroll">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code2}
                      onClick={() => handleRegionSelect(country.code2)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
                        selectedRegionCode === country.code2 
                          ? 'bg-accent/10 text-accent font-semibold' 
                          : 'hover:bg-bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-subtle w-5 text-left">{country.code2}</span>
                        <span className="truncate max-w-[160px]">{country.name}</span>
                      </div>
                      {selectedRegionCode === country.code2 && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider">{t('settings.language')}</label>
          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 sidebar-scroll">
            {languagesForRegion.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                  selectedLanguage === lang 
                    ? 'border-accent bg-accent/5 text-accent font-semibold' 
                    : 'border-border bg-bg-muted/35 hover:border-accent/50'
                }`}
              >
                <span>{lang}</span>
                {selectedLanguage === lang && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-bg-muted/30 px-4 py-3">
        <button onClick={onClose} className="btn secondary sm text-[11px]">{t('common.cancel')}</button>
        <button onClick={handleApply} className="btn primary sm px-4 text-[11px]">{t('common.apply')}</button>
      </div>
    </div>
  )
}
