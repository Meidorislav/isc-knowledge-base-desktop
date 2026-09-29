import { describe, expect, it } from 'vitest'
import { searchTitles } from './titleSearch'
import { localize } from './localize'
import { mockKnowledgeBase } from './mockKnowledgeBase'

describe('localize', () => {
  it('falls back to Russian when the English value is missing', () => {
    expect(localize({ ru: 'Регламент' }, 'en')).toBe('Регламент')
    expect(localize({ ru: 'Регламент', en: 'Regulation' }, 'en')).toBe('Regulation')
    expect(localize({ ru: 'Регламент', en: '' }, 'en')).toBe('Регламент')
  })
})

describe('searchTitles', () => {
  it('returns nothing for a blank query', () => {
    expect(searchTitles('   ', mockKnowledgeBase, 'ru')).toEqual({ sections: [], documents: [] })
  })

  it('finds sections and documents and highlights the match', () => {
    const result = searchTitles('регл', mockKnowledgeBase, 'ru')
    expect(result.sections.map((match) => match.id)).toEqual(['regulations'])
    expect(result.documents.length).toBeGreaterThanOrEqual(3)
    const first = result.documents[0]
    expect(first.title.slice(...first.highlight!)).toBe('Регл')
  })

  it('ranks a title prefix above a match in the middle of a word', () => {
    const titles = searchTitles('инц', mockKnowledgeBase, 'ru').documents.map((m) => m.title)
    expect(titles[0]).toBe('Регламент реагирования на инциденты')
  })

  it('matches the other language but shows the title in the interface language', () => {
    const [match] = searchTitles('naming', mockKnowledgeBase, 'ru').documents
    expect(match.title).toBe('Соглашения по именованию')
    expect(match.highlight).toBeNull()
  })

  it('reports no results for an unknown title', () => {
    const result = searchTitles('командировка', mockKnowledgeBase, 'ru')
    expect(result.sections).toHaveLength(0)
    expect(result.documents).toHaveLength(0)
  })
})
