// Query log and answer ratings behind the gaps dashboard (spec: Ф-06).

export type AnswerRating = 'up' | 'down'

export interface QueryRecord {
  id: string
  question: string
  askedAt: string
  outcome: 'answered' | 'not-found'
  sectionId: string | null
  documentId: string | null
  rating: AnswerRating | null
  comment: string | null
}

export type GapReason = 'not-found' | 'negative'

export interface Gap {
  key: string
  reason: GapReason
  question: string
  count: number
  lastAskedAt: string
  sectionId: string | null
  documentId: string | null
  comments: string[]
  resolved: boolean
}
