import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Clock, Download, History, Languages, UserRound } from 'lucide-react'
import type { KbDocument, KbSection } from '../types/knowledgeBase'
import { hasTranslation, localize } from '../data/localize'
import { formatDate } from '../data/format'
import StatusChip from './StatusChip'
import { useI18n } from '../i18n/context'

interface DocumentViewerProps {
  doc: KbDocument
  section: KbSection
  highlightedFragment: string | null
  onGoHome: () => void
  onOpenSection: (sectionId: string) => void
  onSave: () => void
}

// How far below the top of the scroll area a heading counts as "current".
const ACTIVE_HEADING_OFFSET = 120

type Block =
  | { kind: 'heading'; level: 2 | 3; text: string; headingIndex: number }
  | { kind: 'paragraph'; text: string }

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  let headingIndex = 0
  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    const heading = /^(##|###) (.+)$/.exec(line)
    if (heading) {
      const level = heading[1].length === 2 ? 2 : 3
      blocks.push({ kind: 'heading', level, text: heading[2], headingIndex: headingIndex++ })
    } else {
      blocks.push({ kind: 'paragraph', text: line })
    }
  }
  return blocks
}

function DocumentViewer({
  doc,
  section,
  highlightedFragment,
  onGoHome,
  onOpenSection,
  onSave
}: DocumentViewerProps): React.JSX.Element {
  const { t, language } = useI18n()
  const articleRef = useRef<HTMLElement>(null)
  const highlightRef = useRef<HTMLParagraphElement>(null)
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([])
  const tocRef = useRef<HTMLElement>(null)
  // While a TOC click scrolls the page, the spy is paused so it doesn't flicker through headings.
  const spyPausedRef = useRef(false)
  const [activeHeading, setActiveHeading] = useState(0)

  const blocks = parseBlocks(localize(doc.content, language))
  const headings = blocks.filter((block) => block.kind === 'heading')
  const headingCount = headings.length

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightedFragment])

  useEffect(() => {
    const container = articleRef.current?.closest('.content')
    if (!container) return
    headingRefs.current.length = headingCount

    const onScroll = (): void => {
      if (spyPausedRef.current) return
      const top = container.getBoundingClientRect().top
      let current = 0
      headingRefs.current.forEach((heading, index) => {
        if (heading && heading.getBoundingClientRect().top - top <= ACTIVE_HEADING_OFFSET) {
          current = index
        }
      })
      setActiveHeading(current)
    }
    // The spy resumes once the smooth scroll settles, or right away on manual wheel/keyboard input.
    const resumeSpy = (): void => {
      spyPausedRef.current = false
    }

    onScroll()
    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('scrollend', resumeSpy)
    container.addEventListener('wheel', resumeSpy, { passive: true })
    container.addEventListener('keydown', resumeSpy)
    return () => {
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('scrollend', resumeSpy)
      container.removeEventListener('wheel', resumeSpy)
      container.removeEventListener('keydown', resumeSpy)
    }
  }, [headingCount])

  // Keep the active entry visible when the table of contents is taller than the window.
  useEffect(() => {
    const toc = tocRef.current
    const item = toc?.querySelector<HTMLElement>('.toc__item.is-active')
    if (!toc || !item) return
    // The sticky TOC is the items' offsetParent, so offsetTop is already relative to it.
    const itemTop = item.offsetTop
    const margin = 48
    if (itemTop < toc.scrollTop + margin) {
      toc.scrollTo({ top: itemTop - margin, behavior: 'smooth' })
    } else if (itemTop + item.offsetHeight > toc.scrollTop + toc.clientHeight - margin) {
      toc.scrollTo({
        top: itemTop + item.offsetHeight - toc.clientHeight + margin,
        behavior: 'smooth'
      })
    }
  }, [activeHeading])

  const scrollToHeading = (index: number): void => {
    spyPausedRef.current = true
    setActiveHeading(index)
    headingRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="doc-layout">
      <article className="page page--doc" ref={articleRef}>
        <nav className="breadcrumb">
          <button type="button" onClick={onGoHome}>
            {t.sidebar.home}
          </button>
          <ChevronRight size={14} />
          <button type="button" onClick={() => onOpenSection(section.id)}>
            {localize(section.title, language)}
          </button>
          <button
            type="button"
            className="button button--secondary button--small doc__download"
            onClick={onSave}
          >
            <Download size={15} />
            {t.doc.download}
          </button>
        </nav>

        <h1 className="doc__title">{localize(doc.title, language)}</h1>

        <div className="doc__meta">
          <StatusChip status={doc.status} />
          <span className="chip">
            <History size={13} />
            {t.doc.version(doc.version)}
          </span>
          <span className="chip">
            <Clock size={13} />
            {formatDate(doc.updatedAt)}
          </span>
          <span className="chip" title={t.doc.owner}>
            <UserRound size={13} />
            {doc.owner}
          </span>
        </div>

        {!hasTranslation(doc.content, language) && (
          <div className="notice">
            <Languages size={16} />
            {t.doc.onlyInRussian}
          </div>
        )}

        <div className="prose">
          {blocks.map((block, index) => {
            if (block.kind === 'heading') {
              const Tag = block.level === 2 ? 'h2' : 'h3'
              return (
                <Tag
                  key={index}
                  ref={(element: HTMLHeadingElement | null) => {
                    headingRefs.current[block.headingIndex] = element
                  }}
                >
                  {block.text}
                </Tag>
              )
            }
            const isHighlighted = block.text === highlightedFragment
            return (
              <p
                key={index}
                ref={isHighlighted ? highlightRef : undefined}
                className={isHighlighted ? 'is-highlighted' : undefined}
              >
                {block.text}
              </p>
            )
          })}
        </div>
      </article>

      {headingCount > 0 && (
        <aside className="toc" ref={tocRef} aria-label={t.doc.onThisPage}>
          <div className="toc__label">{t.doc.onThisPage}</div>
          <ul>
            {headings.map((heading) => (
              <li key={heading.headingIndex}>
                <button
                  type="button"
                  className={
                    'toc__item' +
                    (heading.level === 3 ? ' toc__item--sub' : '') +
                    (heading.headingIndex === activeHeading ? ' is-active' : '')
                  }
                  onClick={() => scrollToHeading(heading.headingIndex)}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

export default DocumentViewer
