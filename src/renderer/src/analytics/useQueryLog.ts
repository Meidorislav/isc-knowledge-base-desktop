import { useRef, useState } from 'react'
import type { AnswerRating, QueryRecord } from '../types/analytics'
import { createMockQueryLog } from '../data/mockAnalytics'

export interface QueryLog {
  records: QueryRecord[]
  resolvedAt: Record<string, string>
  log: (record: Omit<QueryRecord, 'id' | 'askedAt' | 'rating' | 'comment'>) => string
  rate: (recordId: string, rating: AnswerRating) => void
  comment: (recordId: string, comment: string) => void
  setResolved: (gapKey: string, resolved: boolean) => void
}

// In-memory stand-in for the backend query history and ratings (Ф-06).
export function useQueryLog(): QueryLog {
  const [initial] = useState(() => createMockQueryLog(new Date()))
  const [records, setRecords] = useState<QueryRecord[]>(initial.records)
  const [resolvedAt, setResolvedAt] = useState<Record<string, string>>(initial.resolvedAt)
  const nextIdRef = useRef(0)

  const update = (recordId: string, patch: Partial<QueryRecord>): void =>
    setRecords((prev) =>
      prev.map((record) => (record.id === recordId ? { ...record, ...patch } : record))
    )

  const log: QueryLog['log'] = (record) => {
    const id = `query-${nextIdRef.current++}`
    const entry: QueryRecord = {
      ...record,
      id,
      askedAt: new Date().toISOString(),
      rating: null,
      comment: null
    }
    setRecords((prev) => [...prev, entry])
    return id
  }

  // A repeated rating by the same user replaces the previous one (Ф-06).
  const rate: QueryLog['rate'] = (recordId, rating) =>
    update(recordId, rating === 'up' ? { rating, comment: null } : { rating })

  const comment: QueryLog['comment'] = (recordId, text) =>
    update(recordId, { comment: text.trim() || null })

  const setResolved: QueryLog['setResolved'] = (key, resolved) =>
    setResolvedAt((prev) => {
      const next = { ...prev }
      if (resolved) next[key] = new Date().toISOString()
      else delete next[key]
      return next
    })

  return { records, resolvedAt, log, rate, comment, setResolved }
}
