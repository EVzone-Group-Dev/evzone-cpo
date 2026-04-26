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
      className="absolute right-0 top-full mt-2 z-[100] w-[300px] overflow-hidden rounded-2xl border border-border bg-bg-card shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-bg-muted/30">
        <div className="flex items-center gap-2">
          <Globe2 size={14} className="text-accent" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-subtle">{t('common.localization')}</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-bg-muted text-subtle transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Region Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-subtle uppercase tracking-wider">{t('settings.region')}</label>
            <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded uppercase">{selectedCountry?.code2}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-bg-muted/20 px-3 py-2.5 hover:border-accent/40 transition-all text-xs group"
            >
              <span className="font-medium truncate text-left">{selectedCountry?.name || 'Select Region'}</span>
              <ChevronDown size={14} className={`shrink-0 text-subtle group-hover:text-accent transition-transform duration-300 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRegionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-[110] mt-1.5 max-h-[220px] overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-2 border-b border-border bg-bg-muted/40">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" size={12} />
                    <input
                      type="text"
                      autoFocus
                      placeholder={t('common.search')}
                      className="w-full bg-transparent border-0 !text-[11px] pl-8 focus:ring-0 outline-none h-6"
                      value={regionSearchQuery}
                      onChange={(e) => setRegionSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[160px] p-1 sidebar-scroll bg-bg-card">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code2}
                      onClick={() => handleRegionSelect(country.code2)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] transition-all ${
                        selectedRegionCode === country.code2 
                          ? 'bg-accent/10 text-accent font-semibold' 
                          : 'hover:bg-bg-muted/60 text-subtle hover:text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono opacity-50 w-5 text-left">{country.code2}</span>
                        <span className="truncate max-w-[170px]">{country.name}</span>
                      </div>
                      {selectedRegionCode === country.code2 && <Check size={12} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-subtle uppercase tracking-wider">{t('settings.language')}</label>
          <div className="grid grid-cols-1 gap-1.5 max-h-[180px] overflow-y-auto pr-1 sidebar-scroll">
            {languagesForRegion.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-all duration-200 ${
                  selectedLanguage === lang 
                    ? 'border-accent/40 bg-accent/5 text-accent font-semibold shadow-[0_0_15px_rgba(63,185,80,0.05)]' 
                    : 'border-border/40 bg-bg-muted/10 hover:border-accent/30 hover:bg-bg-muted/20'
                }`}
              >
                <span>{lang}</span>
                {selectedLanguage === lang && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-bg-muted/40 px-4 py-3">
        <button onClick={onClose} className="text-[11px] font-medium text-subtle hover:text-text px-3 py-1.5 transition-colors">{t('common.cancel')}</button>
        <button onClick={handleApply} className="btn primary sm px-5 py-1.5 text-[11px] font-bold shadow-lg shadow-accent/20">{t('common.apply')}</button>
      </div>
    </div>
  )
}
