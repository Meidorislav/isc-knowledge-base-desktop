import { useEffect, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import type { ContentLanguage, KbDocument, KbSection, SourceFile } from '../types/knowledgeBase'
import { localize } from '../data/localize'
import LanguageTabs from './LanguageTabs'
import { useI18n } from '../i18n/context'

interface UploadModalProps {
  sections: KbSection[]
  initialSectionId: string | null
  onClose: () => void
  onUpload: (sectionId: string, doc: KbDocument) => void
}

type PerLanguage<T> = Record<ContentLanguage, T>

const ALLOWED_EXTENSIONS = ['docx', 'md', 'markdown', 'txt']
const MAX_SIZE_BYTES = 20 * 1024 * 1024

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Normalizes Markdown/plain text into the viewer's "## heading" + paragraph format.
// A top-level "# " heading is the document title, which the viewer already shows.
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^#\s/.test(line))
    .map((line) => line.replace(/^##\s+/, '## ').replace(/^#{3,6}\s+/, '### '))
    .join('\n')
}

// Document upload form (Ф-01). Indexing is simulated by the parent until the backend is wired up.
function UploadModal({
  sections,
  initialSectionId,
  onClose,
  onUpload
}: UploadModalProps): React.JSX.Element {
  const { t, language: uiLanguage } = useI18n()
  const [tab, setTab] = useState<ContentLanguage>('ru')
  const [files, setFiles] = useState<PerLanguage<File | null>>({ ru: null, en: null })
  const [titles, setTitles] = useState<PerLanguage<string>>({ ru: '', en: '' })
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [owner, setOwner] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const pickFile = (language: ContentLanguage, candidate: File | undefined): void => {
    if (!candidate) return
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(candidate.name))) {
      setError(t.upload.errorFormat)
      return
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setError(t.upload.errorSize)
      return
    }
    setError(null)
    setFiles((prev) => ({ ...prev, [language]: candidate }))
    setTitles((prev) =>
      prev[language] ? prev : { ...prev, [language]: stripExtension(candidate.name) }
    )
  }

  const removeFile = (language: ContentLanguage): void =>
    setFiles((prev) => ({ ...prev, [language]: null }))

  const readContent = async (file: File, title: string): Promise<string> =>
    extensionOf(file.name) === 'docx'
      ? `## ${title}\n${t.upload.docxPending(file.name)}`
      : normalizeText(await file.text())

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (sections.length === 0) return setError(t.upload.errorNoSections)
    if (!files.ru || !titles.ru.trim()) {
      setTab('ru')
      return setError(t.upload.errorRussianRequired)
    }
    if (files.en && !titles.en.trim()) {
      setTab('en')
      return setError(t.upload.errorEnglishTitle)
    }
    if (!owner.trim()) return setError(t.upload.errorOwner)

    setSubmitting(true)
    const englishFile = files.en
    const hashes = await Promise.all([files.ru, ...(englishFile ? [englishFile] : [])].map(sha256))
    const duplicate = sections
      .flatMap((section) => section.documents)
      .find((doc) => doc.sourceHashes?.some((hash) => hashes.includes(hash)))
    if (duplicate) {
      setError(t.upload.errorDuplicate(localize(duplicate.title, uiLanguage)))
      setSubmitting(false)
      return
    }

    const sources: Partial<Record<ContentLanguage, SourceFile>> = {
      ru: { name: files.ru.name, blob: files.ru }
    }
    if (englishFile) sources.en = { name: englishFile.name, blob: englishFile }

    onUpload(sectionId, {
      id: `doc-${hashes[0].slice(0, 12)}`,
      title: { ru: titles.ru.trim(), en: titles.en.trim() || undefined },
      owner: owner.trim(),
      status: 'processing',
      version: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      content: {
        ru: await readContent(files.ru, titles.ru.trim()),
        en: englishFile ? await readContent(englishFile, titles.en.trim()) : undefined
      },
      sources,
      sourceHashes: hashes
    })
  }

  const file = files[tab]

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="dialog dialog--upload"
        role="dialog"
        aria-modal="true"
        aria-label={t.upload.title}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <header className="modal-header">
          <span className="modal-header__badge">
            <Upload size={16} />
          </span>
          <div className="modal-header__text">
            <div className="modal-header__title">{t.upload.title}</div>
            <div className="modal-header__subtitle">{t.upload.subtitle}</div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t.upload.cancel}
          >
            <X size={18} />
          </button>
        </header>

        <div className="dialog__body">
          <LanguageTabs
            value={tab}
            onChange={setTab}
            filled={{ ru: Boolean(files.ru), en: Boolean(files.en) }}
          />

          <div className="lang-panel">
            {tab === 'en' && <p className="lang-panel__hint">{t.upload.englishHint}</p>}

            <FilePicker
              key={tab}
              file={file}
              onPick={(candidate) => pickFile(tab, candidate)}
              onRemove={() => removeFile(tab)}
            />

            <label className="field">
              <span className="field__label">
                {t.upload.fieldTitle} ({tab.toUpperCase()}){tab === 'ru' ? ' *' : ''}
              </span>
              <input
                value={titles[tab]}
                onChange={(event) => setTitles((prev) => ({ ...prev, [tab]: event.target.value }))}
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field__label">{t.upload.fieldSection} *</span>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {localize(section.title, uiLanguage)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">{t.upload.fieldOwner} *</span>
              <input
                value={owner}
                placeholder={t.upload.fieldOwnerPlaceholder}
                onChange={(event) => setOwner(event.target.value)}
              />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        <footer className="dialog__footer">
          <button type="button" className="button button--secondary" onClick={onClose}>
            {t.upload.cancel}
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {t.upload.submit}
          </button>
        </footer>
      </form>
    </div>
  )
}

interface FilePickerProps {
  file: File | null
  onPick: (file: File | undefined) => void
  onRemove: () => void
}

function FilePicker({ file, onPick, onRemove }: FilePickerProps): React.JSX.Element {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.md,.markdown,.txt"
        hidden
        onChange={(event) => {
          onPick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {file ? (
        <div className="file-row">
          <FileText size={20} className="file-row__icon" />
          <div className="file-row__body">
            <div className="file-row__name">{file.name}</div>
            <div className="file-row__size">{formatSize(file.size)}</div>
          </div>
          <button type="button" className="text-button" onClick={() => inputRef.current?.click()}>
            {t.upload.replace}
          </button>
          <button type="button" className="text-button" onClick={onRemove}>
            {t.upload.remove}
          </button>
        </div>
      ) : (
        <div
          className={'dropzone' + (isDragging ? ' is-dragging' : '')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            onPick(event.dataTransfer.files[0])
          }}
        >
          <Upload size={22} />
          <div className="dropzone__title">
            {t.upload.dropTitle} {t.upload.dropOr} <span className="link">{t.upload.browse}</span>
          </div>
          <div className="dropzone__hint">{t.upload.formats}</div>
        </div>
      )}
    </>
  )
}

export default UploadModal
