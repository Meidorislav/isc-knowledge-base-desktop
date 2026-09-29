import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import BrandMark from './BrandMark'
import SearchBox from './SearchBox'
import type { KbSection } from '../types/knowledgeBase'
import { useI18n } from '../i18n/context'
import { translations, type Language } from '../i18n/translations'

interface TopBarProps {
  sections: KbSection[]
  onAskAi: (question?: string) => void
  onGoHome: () => void
  onOpenSection: (sectionId: string) => void
  onOpenDocument: (documentId: string) => void
}

const LANGUAGES: Language[] = ['ru', 'en']

function TopBar({
  sections,
  onAskAi,
  onGoHome,
  onOpenSection,
  onOpenDocument
}: TopBarProps): React.JSX.Element {
  const { t, language, setLanguage } = useI18n()
  const languageRef = useRef<HTMLDivElement>(null)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)

  useEffect(() => {
    if (!isLanguageOpen) return
    const onPointerDown = (event: PointerEvent): void => {
      if (!languageRef.current?.contains(event.target as Node)) setIsLanguageOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [isLanguageOpen])

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={onGoHome}>
        <BrandMark />
        <span className="brand__name">
          <span>{t.brand.line1}</span>
          <span>{t.brand.line2}</span>
        </span>
      </button>

      <div className="topbar__center">
        <SearchBox
          sections={sections}
          onOpenSection={onOpenSection}
          onOpenDocument={onOpenDocument}
          onAskAi={onAskAi}
        />
        <span className="topbar__or">{t.topbar.or}</span>
        <button type="button" className="ask-ai-button" onClick={() => onAskAi()}>
          <Sparkles size={17} />
          {t.topbar.askAi}
        </button>
      </div>

      <div className="topbar__right">
        <div className="language" ref={languageRef}>
          <button
            type="button"
            className="language__toggle"
            onClick={() => setIsLanguageOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={isLanguageOpen}
            aria-label={t.topbar.language}
          >
            {language.toUpperCase()}
            <ChevronDown size={15} className={isLanguageOpen ? 'is-open' : undefined} />
          </button>
          {isLanguageOpen && (
            <ul className="language__menu" role="listbox">
              {LANGUAGES.map((code) => (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={code === language}
                    className="language__option"
                    onClick={() => {
                      setLanguage(code)
                      setIsLanguageOpen(false)
                    }}
                  >
                    <span className="language__code">{code.toUpperCase()}</span>
                    {translations[code].languageName}
                    {code === language && <Check size={15} className="language__check" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
