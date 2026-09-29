import type { ContentLanguage, KbDocument, KbSection } from '../types/knowledgeBase'
import { localize } from './localize'

// Crude stand-in for the backend hybrid search (Ф-04): prefix-stem matching with a relevance threshold.

export interface RetrievedFragment {
  doc: KbDocument
  sectionId: string
  sectionTitle: string
  heading: string | null
  text: string
  score: number
}

const STOP_WORDS = new Set([
  'какие',
  'какой',
  'какая',
  'каких',
  'кто',
  'что',
  'как',
  'где',
  'когда',
  'the',
  'what',
  'which',
  'how',
  'are',
  'for',
  'does',
  'and'
])

function stems(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zа-яё0-9_]+/i)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .map((word) => word.slice(0, Math.max(3, Math.min(5, word.length - 1))))
}

function paragraphs(content: string): { heading: string | null; text: string }[] {
  const result: { heading: string | null; text: string }[] = []
  let heading: string | null = null
  for (const line of content.split('\n')) {
    const headingMatch = /^#{2,3} (.+)$/.exec(line)
    if (headingMatch) heading = headingMatch[1]
    else if (line.trim()) result.push({ heading, text: line })
  }
  return result
}

const MIN_MATCHED_STEMS = 2

export function retrieve(
  question: string,
  sections: KbSection[],
  language: ContentLanguage,
  limit = 2
): RetrievedFragment[] {
  const queryStems = [...new Set(stems(question))]
  if (queryStems.length === 0) return []

  const candidates: RetrievedFragment[] = []
  for (const section of sections) {
    for (const doc of section.documents) {
      if (doc.status !== 'indexed') continue
      const title = localize(doc.title, language)
      for (const paragraph of paragraphs(localize(doc.content, language))) {
        const heading = (paragraph.heading ?? '').toLowerCase()
        const haystack = `${title} ${heading} ${paragraph.text}`.toLowerCase()
        const matched = queryStems.filter((stem) => haystack.includes(stem)).length
        // Matches in the section heading act as a tie-breaker, like the contextual header in Ф-02.
        const headingBonus = queryStems.filter((stem) => heading.includes(stem)).length * 0.5
        if (matched >= Math.min(MIN_MATCHED_STEMS, queryStems.length)) {
          candidates.push({
            doc,
            sectionId: section.id,
            sectionTitle: localize(section.title, language),
            ...paragraph,
            score: matched + headingBonus
          })
        }
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const seenDocs = new Set<string>()
  return candidates
    .filter((fragment) => {
      if (seenDocs.has(fragment.doc.id)) return false
      seenDocs.add(fragment.doc.id)
      return true
    })
    .slice(0, limit)
}
