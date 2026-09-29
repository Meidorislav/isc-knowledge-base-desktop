import { describe, expect, it } from 'vitest'
import { retrieve } from './mockRetrieval'
import { mockKnowledgeBase } from './mockKnowledgeBase'
import type { KbSection } from '../types/knowledgeBase'

describe('retrieve', () => {
  it('finds the paragraph that answers the question, preferring a matching heading', () => {
    const [top] = retrieve(
      'Какие сроки первичной реакции на критичный инцидент?',
      mockKnowledgeBase,
      'ru'
    )
    expect(top.doc.id).toBe('doc-incident-response')
    expect(top.sectionId).toBe('regulations')
    expect(top.heading).toBe('2. Сроки первичной реакции')
    expect(top.text).toContain('15 минут')
  })

  it('searches the English content in the English interface', () => {
    const [top] = retrieve('How should Git branches be named?', mockKnowledgeBase, 'en')
    expect(top.doc.id).toBe('doc-git-branching')
    expect(top.heading).toBe('1. Branch naming')
  })

  it('returns nothing when the knowledge base has no answer', () => {
    expect(retrieve('Как оформить командировку?', mockKnowledgeBase, 'ru')).toEqual([])
  })

  it('returns at most one fragment per document and respects the limit', () => {
    const results = retrieve('Как сообщить об инциденте?', mockKnowledgeBase, 'ru', 2)
    expect(results.length).toBeLessThanOrEqual(2)
    expect(new Set(results.map((r) => r.doc.id)).size).toBe(results.length)
  })

  it('ignores documents that are not indexed yet', () => {
    const sections: KbSection[] = [
      {
        id: 'test',
        title: { ru: 'Тест' },
        documents: [
          {
            id: 'draft',
            title: { ru: 'Пропуск для гостя' },
            owner: 'Тест',
            status: 'processing',
            version: 1,
            updatedAt: '2026-09-01',
            content: { ru: '## Пропуск\nПропуск для гостя заказывается через Service Desk.' }
          }
        ]
      }
    ]
    expect(retrieve('Как заказать пропуск для гостя?', sections, 'ru')).toEqual([])
  })
})
