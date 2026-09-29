import { ArrowRight, Sparkles } from 'lucide-react'
import type { KbSection } from '../types/knowledgeBase'
import SectionIcon from './SectionIcon'
import { localize } from '../data/localize'
import { useI18n } from '../i18n/context'

interface HomeViewProps {
  sections: KbSection[]
  onOpenSection: (sectionId: string) => void
  onAskAi: () => void
}

function HomeView({ sections, onOpenSection, onAskAi }: HomeViewProps): React.JSX.Element {
  const { t, language } = useI18n()

  return (
    <div className="page">
      <section className="hero">
        <h1 className="hero__title">{t.home.title}</h1>
        <p className="hero__subtitle">{t.home.subtitle}</p>
        <p className="hero__text">{t.home.text}</p>
      </section>

      <button type="button" className="ai-banner" onClick={onAskAi}>
        <span className="ai-banner__icon">
          <Sparkles size={22} />
        </span>
        <span className="ai-banner__body">
          <span className="ai-banner__title">{t.home.aiBannerTitle}</span>
          <span className="ai-banner__text">{t.home.aiBannerText}</span>
        </span>
        <ArrowRight size={20} className="ai-banner__arrow" />
      </button>

      <h2 className="page__heading">{t.home.sectionsHeading}</h2>
      <div className="section-grid">
        {sections.map((section) => {
          return (
            <button
              type="button"
              key={section.id}
              className="section-card"
              onClick={() => onOpenSection(section.id)}
            >
              <SectionIcon
                sectionId={section.id}
                size={24}
                strokeWidth={1.6}
                className="section-card__icon"
              />
              <span className="section-card__title">{localize(section.title, language)}</span>
              <span className="section-card__meta">
                {t.home.documentCount(section.documents.length)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HomeView
