import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext } from './context'
import { translations, type Language } from './translations'

const STORAGE_KEY = 'isc-kb.language'

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' ? 'en' : 'ru'
  } catch {
    return 'ru'
  }
}

function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguage] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translations[language].about.product
    window.api?.setLanguage(language)
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Storage can be unavailable; the choice then lasts for this session only.
    }
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t: translations[language] }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export default I18nProvider
