import { describe, expect, it } from 'vitest'
import { buildGaps, dailySeries, gapKey, inPeriod, sectionBreakdown } from './gaps'
import { mockKnowledgeBase } from '../data/mockKnowledgeBase'
import type { QueryRecord } from '../types/analytics'

const NOW = new Date('2026-09-29T15:00:00')

let nextId = 0
function record(overrides: Partial<QueryRecord>): QueryRecord {
  return {
    id: `r${nextId++}`,
    question: 'Как настроить новое рабочее место?',
    askedAt: '2026-09-28T10:00:00.000Z',
    outcome: 'answered',
    sectionId: 'workstation',
    documentId: 'doc-workstation-setup',
    rating: null,
    comment: null,
    ...overrides
  }
}

const notFound = (question: string, askedAt: string): QueryRecord =>
  record({ question, askedAt, outcome: 'not-found', sectionId: null, documentId: null })

describe('buildGaps', () => {
  it('groups repeated questions regardless of case and punctuation', () => {
    const gaps = buildGaps(
      [
        notFound('Как оформить командировку?', '2026-09-20T10:00:00.000Z'),
        notFound('как оформить  командировку', '2026-09-25T10:00:00.000Z')
      ],
      {}
    )
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ reason: 'not-found', count: 2, resolved: false })
    expect(gaps[0].lastAskedAt).toBe('2026-09-25T10:00:00.000Z')
  })

  it('treats only unanswered and negatively rated questions as gaps', () => {
    const gaps = buildGaps(
      [
        record({ rating: 'up' }),
        record({ rating: null }),
        record({ rating: 'down', comment: 'Нет про второй монитор' })
      ],
      {}
    )
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ reason: 'negative', count: 1 })
    expect(gaps[0].comments).toEqual(['Нет про второй монитор'])
  })

  it('reopens a resolved gap when someone asks again after it was resolved', () => {
    const key = gapKey('not-found', 'Как оформить командировку?')
    const first = notFound('Как оформить командировку?', '2026-09-20T10:00:00.000Z')
    const resolvedAt = { [key]: '2026-09-21T10:00:00.000Z' }

    expect(buildGaps([first], resolvedAt)[0].resolved).toBe(true)

    const again = notFound('Как оформить командировку?', '2026-09-22T10:00:00.000Z')
    expect(buildGaps([first, again], resolvedAt)[0].resolved).toBe(false)
  })

  it('sorts gaps by how often they were asked', () => {
    const gaps = buildGaps(
      [
        notFound('Редкий вопрос', '2026-09-20T10:00:00.000Z'),
        notFound('Частый вопрос', '2026-09-20T10:00:00.000Z'),
        notFound('Частый вопрос', '2026-09-21T10:00:00.000Z')
      ],
      {}
    )
    expect(gaps.map((gap) => gap.question)).toEqual(['Частый вопрос', 'Редкий вопрос'])
  })
})

describe('period and daily series', () => {
  const records = [
    record({ askedAt: new Date('2026-09-29T09:00:00').toISOString(), rating: 'up' }),
    record({ askedAt: new Date('2026-09-29T11:00:00').toISOString(), rating: 'down' }),
    notFound('Вопрос', new Date('2026-09-27T12:00:00').toISOString()),
    notFound('Старый вопрос', new Date('2026-09-01T12:00:00').toISOString())
  ]

  it('keeps only records inside the period, counting today as a full day', () => {
    expect(inPeriod(records, 7, NOW)).toHaveLength(3)
    expect(inPeriod(records, 30, NOW)).toHaveLength(4)
  })

  it('splits each day into answered, unanswered and not helpful', () => {
    const series = dailySeries(inPeriod(records, 7, NOW), 7, NOW)
    expect(series).toHaveLength(7)
    expect(series[6]).toMatchObject({ answered: 1, negative: 1, notFound: 0 })
    expect(series[4]).toMatchObject({ answered: 0, negative: 0, notFound: 1 })
    expect(series[0]).toMatchObject({ answered: 0, negative: 0, notFound: 0 })
  })
})

describe('sectionBreakdown', () => {
  it('puts unanswered questions into the unknown-section row', () => {
    const records = [
      record({ rating: 'down' }),
      notFound('Как оформить командировку?', '2026-09-28T10:00:00.000Z')
    ]
    const rows = sectionBreakdown(records, buildGaps(records, {}), mockKnowledgeBase)

    expect(rows.find((row) => row.id === 'workstation')).toMatchObject({
      questions: 1,
      negative: 1,
      openGaps: 1
    })
    expect(rows.find((row) => row.id === null)).toMatchObject({
      questions: 1,
      notFound: 1,
      openGaps: 1
    })
  })
})
