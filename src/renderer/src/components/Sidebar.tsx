import { useState } from 'react'
import { ChartColumn, ChevronDown, House } from 'lucide-react'
import type { KbSection } from '../types/knowledgeBase'
import SectionIcon from './SectionIcon'
import { localize } from '../data/localize'
import { useI18n } from '../i18n/context'

interface SidebarProps {
  sections: KbSection[]
  activeSectionId: string | null
  activeDocumentId: string | null
  isHome: boolean
  isDashboard: boolean
  openGapCount: number
  onGoHome: () => void
  onOpenDashboard: () => void
  onOpenSection: (sectionId: string) => void
  onOpenDocument: (documentId: string) => void
}

function Sidebar({
  sections,
  activeSectionId,
  activeDocumentId,
  isHome,
  isDashboard,
  openGapCount,
  onGoHome,
  onOpenDashboard,
  onOpenSection,
  onOpenDocument
}: SidebarProps): React.JSX.Element {
  const { t, language } = useI18n()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (sectionId: string): void =>
    setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))

  return (
    <nav className="sidebar" aria-label={t.sidebar.treeAria}>
      <button
        type="button"
        className={'nav-item nav-item--home' + (isHome ? ' is-active' : '')}
        onClick={onGoHome}
      >
        <House size={17} />
        {t.sidebar.home}
      </button>
      <button
        type="button"
        className={'nav-item nav-item--home' + (isDashboard ? ' is-active' : '')}
        onClick={onOpenDashboard}
      >
        <ChartColumn size={17} />
        <span className="nav-item__text">{t.sidebar.dashboard}</span>
        {openGapCount > 0 && <span className="nav-item__badge">{openGapCount}</span>}
      </button>

      <div className="sidebar__label">{t.sidebar.sections}</div>

      {sections.map((section) => {
        const isCollapsed = collapsed[section.id] ?? false
        const isActive = section.id === activeSectionId && activeDocumentId === null
        return (
          <div className="sidebar__group" key={section.id}>
            <div className={'nav-row' + (isActive ? ' is-active' : '')}>
              <button
                type="button"
                className="nav-item nav-item--section"
                onClick={() => {
                  onOpenSection(section.id)
                  setCollapsed((prev) => ({ ...prev, [section.id]: false }))
                }}
              >
                <SectionIcon sectionId={section.id} size={17} />
                <span className="nav-item__text">{localize(section.title, language)}</span>
              </button>
              <button
                type="button"
                className="nav-row__toggle"
                onClick={() => toggle(section.id)}
                aria-expanded={!isCollapsed}
                aria-label={t.sidebar.toggleSection}
              >
                <ChevronDown
                  size={16}
                  className={'nav-item__chevron' + (isCollapsed ? ' is-collapsed' : '')}
                />
              </button>
            </div>

            {!isCollapsed && (
              <ul className="sidebar__docs">
                {section.documents.length === 0 && (
                  <li className="sidebar__empty">{t.sidebar.noDocuments}</li>
                )}
                {section.documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className={
                        'nav-item nav-item--doc' + (doc.id === activeDocumentId ? ' is-active' : '')
                      }
                      onClick={() => onOpenDocument(doc.id)}
                    >
                      <span className="nav-item__text">{localize(doc.title, language)}</span>
                      {doc.status === 'processing' && <span className="nav-item__pending" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Sidebar
