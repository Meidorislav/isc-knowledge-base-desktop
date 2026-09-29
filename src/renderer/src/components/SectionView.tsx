import { ChevronRight, FileText, Upload } from 'lucide-react'
import type { KbSection } from '../types/knowledgeBase'
import SectionIcon from './SectionIcon'
import { localize } from '../data/localize'
import { formatDate } from '../data/format'
import StatusChip from './StatusChip'
import { useI18n } from '../i18n/context'

interface SectionViewProps {
  section: KbSection
  onGoHome: () => void
  onOpenDocument: (documentId: string) => void
  onUpload: () => void
}

function SectionView({
  section,
  onGoHome,
  onOpenDocument,
  onUpload
}: SectionViewProps): React.JSX.Element {
  const { t, language } = useI18n()

  return (
    <div className="page">
      <nav className="breadcrumb">
        <button type="button" onClick={onGoHome}>
          {t.sidebar.home}
        </button>
        <ChevronRight size={14} />
        <span>{localize(section.title, language)}</span>
      </nav>

      <div className="section-header">
        <span className="section-header__icon">
          <SectionIcon sectionId={section.id} size={26} strokeWidth={1.6} />
        </span>
        <div className="section-header__text">
          <h1 className="doc__title">{localize(section.title, language)}</h1>
          <div className="section-header__meta">
            {t.home.documentCount(section.documents.length)}
          </div>
        </div>
        <button type="button" className="button button--secondary button--small" onClick={onUpload}>
          <Upload size={15} />
          {t.section.upload}
        </button>
      </div>

      {section.documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={28} strokeWidth={1.5} />
          <div className="empty-state__title">{t.section.emptyTitle}</div>
          <p className="empty-state__text">{t.section.emptyText}</p>
          <button type="button" className="button button--primary" onClick={onUpload}>
            <Upload size={16} />
            {t.section.upload}
          </button>
        </div>
      ) : (
        <ul className="doc-list">
          {section.documents.map((doc) => (
            <li key={doc.id}>
              <button type="button" className="doc-row" onClick={() => onOpenDocument(doc.id)}>
                <FileText size={18} className="doc-row__icon" />
                <span className="doc-row__title">{localize(doc.title, language)}</span>
                <StatusChip status={doc.status} />
                <span className="doc-row__meta">{doc.owner}</span>
                <span className="doc-row__meta">{formatDate(doc.updatedAt)}</span>
                <ChevronRight size={16} className="doc-row__arrow" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SectionView
