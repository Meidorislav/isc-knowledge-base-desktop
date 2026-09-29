import { useEffect, useState } from 'react'
import { FileDown, FileText, FileType, Hash, Type, X, type LucideIcon } from 'lucide-react'
import type { ContentLanguage, KbDocument } from '../types/knowledgeBase'
import type { ExportFormat } from '../data/export'
import { hasTranslation, localize } from '../data/localize'
import { useI18n } from '../i18n/context'

type TargetFormat = Exclude<ExportFormat, 'source'>

interface SaveAsModalProps {
  doc: KbDocument
  onClose: () => void
  onSave: (format: TargetFormat, language: ContentLanguage) => void
}

const FORMATS: { id: TargetFormat; icon: LucideIcon }[] = [
  { id: 'docx', icon: FileText },
  { id: 'pdf', icon: FileType },
  { id: 'md', icon: Hash },
  { id: 'txt', icon: Type }
]

function SaveAsModal({ doc, onClose, onSave }: SaveAsModalProps): React.JSX.Element {
  const { t, language: uiLanguage } = useI18n()
  const hasEnglish = hasTranslation(doc.content, 'en')
  const pdfAvailable = Boolean(window.api)
  const [format, setFormat] = useState<TargetFormat>('docx')
  const [language, setLanguage] = useState<ContentLanguage>(
    uiLanguage === 'en' && hasEnglish ? 'en' : 'ru'
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="dialog dialog--save-as"
        role="dialog"
        aria-modal="true"
        aria-label={t.saveAs.title}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onSave(format, language)
        }}
      >
        <header className="modal-header">
          <span className="modal-header__badge">
            <FileDown size={16} />
          </span>
          <div className="modal-header__text">
            <div className="modal-header__title">{t.saveAs.title}</div>
            <div className="modal-header__subtitle">{localize(doc.title, uiLanguage)}</div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t.saveAs.cancel}
          >
            <X size={18} />
          </button>
        </header>

        <div className="dialog__body">
          <div className="field__label">{t.saveAs.format}</div>
          <div className="format-grid" role="radiogroup">
            {FORMATS.map(({ id, icon: Icon }) => {
              const disabled = id === 'pdf' && !pdfAvailable
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={format === id}
                  disabled={disabled}
                  title={disabled ? t.saveAs.pdfUnavailable : undefined}
                  className={'format-option' + (format === id ? ' is-selected' : '')}
                  onClick={() => setFormat(id)}
                >
                  <Icon size={20} strokeWidth={1.6} />
                  <span className="format-option__name">{t.saveAs.formats[id].name}</span>
                  <span className="format-option__hint">{t.saveAs.formats[id].hint}</span>
                </button>
              )
            })}
          </div>

          <div className="field__label save-as__language-label">{t.saveAs.languageVersion}</div>
          <div className="toggle-group" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={language === 'ru'}
              className={'toggle-group__item' + (language === 'ru' ? ' is-active' : '')}
              onClick={() => setLanguage('ru')}
            >
              {t.saveAs.langRu}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={language === 'en'}
              disabled={!hasEnglish}
              title={hasEnglish ? undefined : t.saveAs.noEnglish}
              className={'toggle-group__item' + (language === 'en' ? ' is-active' : '')}
              onClick={() => setLanguage('en')}
            >
              {t.saveAs.langEn}
            </button>
          </div>
          {!hasEnglish && <p className="save-as__hint">{t.saveAs.noEnglish}</p>}
        </div>

        <footer className="dialog__footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            {t.saveAs.cancel}
          </button>
          <button type="submit" className="button button--primary">
            {t.saveAs.submit}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default SaveAsModal
