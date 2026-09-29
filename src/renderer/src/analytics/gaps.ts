import type { Gap, GapReason, QueryRecord } from '../types/analytics'
import type { KbSection } from '../types/knowledgeBase'

// Aggregations for the gaps dashboard (Ф-06): problem queries grouped by question, per-day
// dynamics, and breakdowns by section and owner.

export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function gapKey(reason: GapReason, question: string): string {
  return `${reason}:${normalizeQuestion(question)}`
}

export function gapReason(record: QueryRecord): GapReason | null {
  if (record.outcome === 'not-found') return 'not-found'
  if (record.rating === 'down') return 'negative'
  return null
}

export function inPeriod(records: QueryRecord[], days: number, now: Date): QueryRecord[] {
  const since = new Date(now)
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))
  return records.filter((record) => new Date(record.askedAt) >= since)
}

// A gap counts as resolved only if nobody has run into it again since it was marked resolved.
export function buildGaps(records: QueryRecord[], resolvedAt: Record<string, string>): Gap[] {
  const groups = new Map<string, QueryRecord[]>()
  for (const record of records) {
    const reason = gapReason(record)
    if (!reason) continue
    const key = gapKey(reason, record.question)
    groups.set(key, [...(groups.get(key) ?? []), record])
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = [...items].sort((a, b) => b.askedAt.localeCompare(a.askedAt))
      const latest = sorted[0]
      const resolvedTime = resolvedAt[key]
      return {
        key,
        reason: gapReason(latest)!,
        question: latest.question,
        count: items.length,
        lastAskedAt: latest.askedAt,
        sectionId: latest.sectionId,
        documentId: latest.documentId,
        comments: sorted.map((item) => item.comment).filter((c): c is string => Boolean(c)),
        resolved: Boolean(resolvedTime && resolvedTime >= latest.askedAt)
      }
    })
    .sort((a, b) => b.count - a.count || b.lastAskedAt.localeCompare(a.lastAskedAt))
}

export interface DayPoint {
  date: Date
  answered: number
  notFound: number
  negative: number
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function dailySeries(records: QueryRecord[], days: number, now: Date): DayPoint[] {
  const points: DayPoint[] = []
  const byKey = new Map<string, DayPoint>()
  for (let daysAgo = days - 1; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - daysAgo)
    const point = { date, answered: 0, notFound: 0, negative: 0 }
    points.push(point)
    byKey.set(dayKey(date), point)
  }
  for (const record of records) {
    const point = byKey.get(dayKey(new Date(record.askedAt)))
    if (!point) continue
    const reason = gapReason(record)
    if (reason === 'not-found') point.notFound += 1
    else if (reason === 'negative') point.negative += 1
    else point.answered += 1
  }
  return points
}

export interface BreakdownRow {
  id: string | null
  label: string | null
  questions: number
  notFound: number
  negative: number
  openGaps: number
}

export function sectionBreakdown(
  records: QueryRecord[],
  gaps: Gap[],
  sections: KbSection[]
): BreakdownRow[] {
  const rows: BreakdownRow[] = sections.map((section) => ({
    id: section.id,
    label: null,
    questions: 0,
    notFound: 0,
    negative: 0,
    openGaps: 0
  }))
  const undetermined: BreakdownRow = {
    id: null,
    label: null,
    questions: 0,
    notFound: 0,
    negative: 0,
    openGaps: 0
  }
  const rowFor = (sectionId: string | null): BreakdownRow =>
    rows.find((row) => row.id === sectionId) ?? undetermined

  for (const record of records) {
    const row = rowFor(record.sectionId)
    row.questions += 1
    if (record.outcome === 'not-found') row.notFound += 1
    else if (record.rating === 'down') row.negative += 1
  }
  for (const gap of gaps) if (!gap.resolved) rowFor(gap.sectionId).openGaps += 1

  return [...rows, undetermined].filter((row) => row.questions > 0 || row.id !== null)
}

export function ownerBreakdown(
  records: QueryRecord[],
  gaps: Gap[],
  sections: KbSection[]
): BreakdownRow[] {
  const ownerOf = (documentId: string | null): string | null => {
    for (const section of sections) {
      const doc = section.documents.find((item) => item.id === documentId)
      if (doc) return doc.owner
    }
    return null
  }
  const rows = new Map<string | null, BreakdownRow>()
  const rowFor = (owner: string | null): BreakdownRow => {
    let row = rows.get(owner)
    if (!row) {
      row = { id: owner, label: owner, questions: 0, notFound: 0, negative: 0, openGaps: 0 }
      rows.set(owner, row)
    }
    return row
  }
  for (const record of records) {
    const row = rowFor(ownerOf(record.documentId))
    row.questions += 1
    if (record.outcome === 'not-found') row.notFound += 1
    else if (record.rating === 'down') row.negative += 1
  }
  for (const gap of gaps) if (!gap.resolved) rowFor(ownerOf(gap.documentId)).openGaps += 1

  return [...rows.values()].sort(
    (a, b) => b.openGaps - a.openGaps || (a.id === null ? 1 : b.id === null ? -1 : 0)
  )
}
