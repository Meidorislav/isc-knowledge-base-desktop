import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Search, Sparkles, X } from 'lucide-react'
import type { KbSection } from '../types/knowledgeBase'
import { searchTitles, type TitleMatch } from '../data/titleSearch'
import SectionIcon from './SectionIcon'
import { useI18n } from '../i18n/context'

interface SearchBoxProps {
  sections: KbSection[]
  onOpenSection: (sectionId: string) => void
  onOpenDocument: (documentId: string) => void
  onAskAi: (question: string) => void
}

function Highlighted({ match }: { match: TitleMatch }): React.JSX.Element {
  if (!match.highlight) return <>{match.title}</>
  const [start, end] = match.highlight
  return (
    <>
      {match.title.slice(0, start)}
      <mark>{match.title.slice(start, end)}</mark>
      {match.title.slice(end)}
    </>
  )
}

// Title search over sections and documents (Ф-04 entry point). Full-text answers go to the AI chat.
function SearchBox({
  sections,
  onOpenSection,
  onOpenDocument,
  onAskAi
}: SearchBoxProps): React.JSX.Element {
  const { t, language } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(
    () => searchTitles(query, sections, language),
    [query, sections, language]
  )
  const items = [...results.sections, ...results.documents]
  const trimmed = query.trim()
  const showDropdown = isOpen && trimmed.length > 0
  const hasResults = items.length > 0

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  const finish = (): void => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const choose = (match: TitleMatch): void => {
    if (match.kind === 'section') onOpenSection(match.id)
    else onOpenDocument(match.id)
    finish()
  }

  const askAi = (): void => {
    onAskAi(trimmed)
    finish()
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      finish()
      return
    }
    if (!showDropdown) return
    if (event.key === 'ArrowDown' && hasResults) {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % items.length)
    } else if (event.key === 'ArrowUp' && hasResults) {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (hasResults) choose(items[Math.min(activeIndex, items.length - 1)])
      else askAi()
    }
  }

  const renderItem = (match: TitleMatch, index: number): React.JSX.Element => {
    return (
      <li key={`${match.kind}-${match.id}`}>
        <button
          type="button"
          className={'search-result' + (index === activeIndex ? ' is-active' : '')}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(match)}
        >
          {match.kind === 'section' ? (
            <SectionIcon sectionId={match.sectionId} size={17} className="search-result__icon" />
          ) : (
            <FileText size={17} className="search-result__icon" />
          )}
          <span className="search-result__body">
            <span className="search-result__title">
              <Highlighted match={match} />
            </span>
            {match.kind === 'document' && (
              <span className="search-result__path">{match.sectionTitle}</span>
            )}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="search-box" ref={rootRef}>
      <label className={'search' + (showDropdown ? ' is-open' : '')}>
        <Search size={17} className="search__icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={t.search.placeholder}
          aria-label={t.search.aria}
          aria-expanded={showDropdown}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onInputKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear"
          >
            <X size={15} />
          </button>
        ) : (
          <kbd className="search__kbd">/</kbd>
        )}
      </label>

      {showDropdown && (
        <div className="search-dropdown">
          {hasResults ? (
            <>
              {results.sections.length > 0 && (
                <div className="search-group">
                  <div className="search-group__label">{t.search.sections}</div>
                  <ul>{results.sections.map((match, index) => renderItem(match, index))}</ul>
                </div>
              )}
              {results.documents.length > 0 && (
                <div className="search-group">
                  <div className="search-group__label">{t.search.documents}</div>
                  <ul>
                    {results.documents.map((match, index) =>
                      renderItem(match, index + results.sections.length)
                    )}
                  </ul>
                </div>
              )}
              <div className="search-dropdown__footer">{t.search.keyboardHint}</div>
            </>
          ) : (
            <div className="search-empty">
              <div className="search-empty__title">{t.search.noResults(trimmed)}</div>
              <div className="search-empty__hint">{t.search.noResultsHint}</div>
              <button type="button" className="search-empty__ask" onClick={askAi}>
                <Sparkles size={16} />
                <span>{t.search.askAi(trimmed)}</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBox
