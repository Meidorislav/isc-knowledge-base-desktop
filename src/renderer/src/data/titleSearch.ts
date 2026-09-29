import type { ContentLanguage, KbSection, LocalizedText } from '../types/knowledgeBase'
import { localize } from './localize'

export interface TitleMatch {
  kind: 'section' | 'document'
  id: string
  sectionId: string
  title: string
  sectionTitle: string
  // Character range of the match within `title`, when the match is in the displayed language.
  highlight: [number, number] | null
  rank: number
}

// Lower rank is better: whole-title prefix, then word prefix, then any substring.
function rankMatch(title: string, query: string): number | null {
  const index = title.toLowerCase().indexOf(query)
  if (index === -1) return null
  if (index === 0) return 0
  return /[\s«"(-]/.test(title[index - 1]) ? 1 : 2
}

function matchLocalized(
  text: LocalizedText,
  query: string,
  language: ContentLanguage
): Pick<TitleMatch, 'title' | 'highlight' | 'rank'> | null {
  const title = localize(text, language)
  const displayedRank = rankMatch(title, query)
  if (displayedRank !== null) {
    const start = title.toLowerCase().indexOf(query)
    return { title, highlight: [start, start + query.length], rank: displayedRank }
  }
  // Also match the other language so e.g. English queries work in the Russian UI.
  const other = language === 'ru' ? text.en : text.ru
  const otherRank = other ? rankMatch(other, query) : null
  return otherRank === null ? null : { title, highlight: null, rank: otherRank + 0.5 }
}

export function searchTitles(
  rawQuery: string,
  sections: KbSection[],
  language: ContentLanguage
): { sections: TitleMatch[]; documents: TitleMatch[] } {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return { sections: [], documents: [] }

  const sectionMatches: TitleMatch[] = []
  const documentMatches: TitleMatch[] = []

  for (const section of sections) {
    const sectionTitle = localize(section.title, language)
    const sectionMatch = matchLocalized(section.title, query, language)
    if (sectionMatch) {
      sectionMatches.push({
        kind: 'section',
        id: section.id,
        sectionId: section.id,
        sectionTitle,
        ...sectionMatch
      })
    }
    for (const doc of section.documents) {
      const docMatch = matchLocalized(doc.title, query, language)
      if (docMatch) {
        documentMatches.push({
          kind: 'document',
          id: doc.id,
          sectionId: section.id,
          sectionTitle,
          ...docMatch
        })
      }
    }
  }

  const byRank = (a: TitleMatch, b: TitleMatch): number => a.rank - b.rank
  return {
    sections: sectionMatches.sort(byRank).slice(0, 4),
    documents: documentMatches.sort(byRank).slice(0, 8)
  }
}
