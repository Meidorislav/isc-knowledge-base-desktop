import { useEffect, useRef, useState } from 'react'
import { FolderPlus, X } from 'lucide-react'
import type { ContentLanguage, KbSection, LocalizedText } from '../types/knowledgeBase'
import LanguageTabs from './LanguageTabs'
import { useI18n } from '../i18n/context'

interface SectionModalProps {
  sections: KbSection[]
  onClose: () => void
  onCreate: (title: LocalizedText) => void
}

function SectionModal({ sections, onClose, onCreate }: SectionModalProps): React.JSX.Element {
  const { t } = useI18n()
  const [tab, setTab] = useState<ContentLanguage>('ru')
  const [titles, setTitles] = useState<Record<ContentLanguage, string>>({ ru: '', en: '' })
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [tab])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event: React.FormEvent): void => {
    event.preventDefault()
    const ru = titles.ru.trim()
    const en = titles.en.trim()
    if (!ru) {
      setTab('ru')
      setError(t.newSection.errorRequired)
      return
    }
    const exists = sections.some(
      (section) =>
        section.title.ru.toLowerCase() === ru.toLowerCase() ||
        (en && section.title.en?.toLowerCase() === en.toLowerCase())
    )
    if (exists) {
      setError(t.newSection.errorExists)
      return
    }
    onCreate({ ru, en: en || undefined })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="dialog dialog--section"
        role="dialog"
        aria-modal="true"
        aria-label={t.newSection.title}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <header className="modal-header">
          <span className="modal-header__badge">
            <FolderPlus size={16} />
          </span>
          <div className="modal-header__text">
            <div className="modal-header__title">{t.newSection.title}</div>
            <div className="modal-header__subtitle">{t.newSection.subtitle}</div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t.newSection.cancel}
          >
            <X size={18} />
          </button>
        </header>

        <div className="dialog__body">
          <LanguageTabs
            value={tab}
            onChange={setTab}
            filled={{ ru: Boolean(titles.ru.trim()), en: Boolean(titles.en.trim()) }}
          />
          <div className="lang-panel">
            {tab === 'en' && <p className="lang-panel__hint">{t.newSection.englishHint}</p>}
            <label className="field">
              <span className="field__label">
                {t.newSection.fieldTitle} ({tab.toUpperCase()}){tab === 'ru' ? ' *' : ''}
              </span>
              <input
                ref={inputRef}
                value={titles[tab]}
                placeholder={tab === 'ru' ? t.newSection.placeholderRu : t.newSection.placeholderEn}
                onChange={(event) => setTitles((prev) => ({ ...prev, [tab]: event.target.value }))}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>

        <footer className="dialog__footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            {t.newSection.cancel}
          </button>
          <button type="submit" className="button button--primary">
            {t.newSection.submit}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default SectionModal
