import type { ContentLanguage } from '../types/knowledgeBase'
import { useI18n } from '../i18n/context'

interface LanguageTabsProps {
  value: ContentLanguage
  onChange: (language: ContentLanguage) => void
  filled: Record<ContentLanguage, boolean>
}

const TABS: ContentLanguage[] = ['ru', 'en']

// Russian is always required, English is optional (spec: Russian is the primary interface language).
function LanguageTabs({ value, onChange, filled }: LanguageTabsProps): React.JSX.Element {
  const { t } = useI18n()
  return (
    <div className="lang-tabs" role="tablist">
      {TABS.map((language) => (
        <button
          key={language}
          type="button"
          role="tab"
          aria-selected={value === language}
          className={'lang-tabs__tab' + (value === language ? ' is-active' : '')}
          onClick={() => onChange(language)}
        >
          <span className="lang-tabs__code">{language.toUpperCase()}</span>
          {t.languageTabs[language]}
          <span className="lang-tabs__note">
            {language === 'ru' ? t.languageTabs.required : t.languageTabs.optional}
          </span>
          {filled[language] && <span className="lang-tabs__dot" />}
        </button>
      ))}
    </div>
  )
}

export default LanguageTabs
