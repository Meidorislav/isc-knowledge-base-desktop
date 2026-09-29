import type { AnswerRating, QueryRecord } from '../types/analytics'
import { gapKey } from '../analytics/gaps'

// Generates a month of plausible query history so the dashboard has something to show.

interface AnsweredQuestion {
  question: string
  sectionId: string
  documentId: string
  comment?: string
}

const ANSWERED: AnsweredQuestion[] = [
  {
    question: 'Какие сроки первичной реакции на критичный инцидент?',
    sectionId: 'regulations',
    documentId: 'doc-incident-response'
  },
  {
    question: 'Как настроить новое рабочее место?',
    sectionId: 'workstation',
    documentId: 'doc-workstation-setup'
  },
  { question: 'Как называть ветки в Git?', sectionId: 'git', documentId: 'doc-git-branching' },
  {
    question: 'Какие требования к паролю?',
    sectionId: 'regulations',
    documentId: 'doc-security-policy'
  },
  {
    question: 'Как восстановить удалённый файл?',
    sectionId: 'regulations',
    documentId: 'doc-security-policy'
  },
  { question: 'Как именовать внешние ключи?', sectionId: 'sql-kb', documentId: 'doc-sql-naming' },
  {
    question: 'Сколько длится согласование регламента?',
    sectionId: 'regulations',
    documentId: 'doc-document-flow'
  },
  {
    question: 'Что делать с подозрительным письмом?',
    sectionId: 'regulations',
    documentId: 'doc-security-policy'
  }
]

// Answered, but users tend to rate these answers as not helpful.
const POORLY_ANSWERED: AnsweredQuestion[] = [
  {
    question: 'Как подключиться к VPN с Linux?',
    sectionId: 'workstation',
    documentId: 'doc-workstation-setup',
    comment: 'Нет инструкции для Linux, только общая настройка рабочего места'
  },
  {
    question: 'Как найти медленные запросы в MySQL?',
    sectionId: 'sql-kb',
    documentId: 'doc-sql-queries',
    comment: 'Ответ только про PostgreSQL'
  },
  {
    question: 'Кому эскалировать инцидент ночью?',
    sectionId: 'regulations',
    documentId: 'doc-incident-response',
    comment: 'Не сказано, кто дежурит ночью и в выходные'
  },
  {
    question: 'Как оформить коммит с breaking change?',
    sectionId: 'git',
    documentId: 'doc-git-branching'
  }
]

const NOT_FOUND: { question: string; weight: number }[] = [
  { question: 'Как оформить командировку?', weight: 5 },
  { question: 'Где взять шаблон договора с подрядчиком?', weight: 3 },
  { question: 'Как заказать пропуск для гостя?', weight: 3 },
  { question: 'Какой график работы в праздничные дни?', weight: 2 },
  { question: 'Как получить доступ к 1С?', weight: 2 },
  { question: 'Как оформить отпуск за свой счёт?', weight: 1 }
]

const RESOLVED_QUESTION = 'Какой график работы в праздничные дни?'
const DAYS = 30

function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function createMockQueryLog(now: Date): {
  records: QueryRecord[]
  resolvedAt: Record<string, string>
} {
  const random = createRandom(20260929)
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)]
  const weightedNotFound = NOT_FOUND.flatMap((item) => Array(item.weight).fill(item.question))
  const records: QueryRecord[] = []

  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date(now)
    day.setDate(day.getDate() - daysAgo)
    const isWeekend = day.getDay() === 0 || day.getDay() === 6
    const count = isWeekend ? Math.floor(random() * 2) : 3 + Math.floor(random() * 7)

    for (let i = 0; i < count; i += 1) {
      const askedAt = new Date(day)
      askedAt.setHours(9 + Math.floor(random() * 9), Math.floor(random() * 60), 0, 0)
      if (askedAt > now) askedAt.setTime(now.getTime() - 60_000 * (i + 1))

      const roll = random()
      let record: Omit<QueryRecord, 'id' | 'askedAt'>
      if (roll < 0.58) {
        const item = pick(ANSWERED)
        const rateRoll = random()
        const rating: AnswerRating | null = rateRoll < 0.55 ? 'up' : rateRoll < 0.93 ? null : 'down'
        record = { ...item, outcome: 'answered', rating, comment: null }
      } else if (roll < 0.78) {
        const item = pick(POORLY_ANSWERED)
        const rating: AnswerRating | null = random() < 0.75 ? 'down' : null
        record = {
          question: item.question,
          sectionId: item.sectionId,
          documentId: item.documentId,
          outcome: 'answered',
          rating,
          comment: rating === 'down' && item.comment && random() < 0.6 ? item.comment : null
        }
      } else {
        record = {
          question: pick(weightedNotFound),
          sectionId: null,
          documentId: null,
          outcome: 'not-found',
          rating: null,
          comment: null
        }
      }
      records.push({ ...record, id: `seed-${records.length}`, askedAt: askedAt.toISOString() })
    }
  }

  return {
    records,
    resolvedAt: { [gapKey('not-found', RESOLVED_QUESTION)]: now.toISOString() }
  }
}
