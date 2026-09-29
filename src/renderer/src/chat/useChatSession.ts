import { useCallback, useRef, useState } from 'react'
import type { KbSection } from '../types/knowledgeBase'
import { retrieve, type RetrievedFragment } from '../data/mockRetrieval'
import { localize } from '../data/localize'
import { useI18n } from '../i18n/context'
import type { QueryLog } from '../analytics/useQueryLog'

export interface UserMessage {
  id: number
  role: 'user'
  text: string
}

export interface AssistantMessage {
  id: number
  role: 'assistant'
  phase: 'thinking' | 'streaming' | 'done'
  stage: number
  fragmentsFound: number | null
  text: string
  shownLength: number
  sources: RetrievedFragment[]
  notFound: boolean
  feedback: 'up' | 'down' | null
  commentSent: boolean
  recordId: string | null
}

export type ChatMessage = UserMessage | AssistantMessage

export interface ChatSession {
  messages: ChatMessage[]
  busy: boolean
  draft: string
  setDraft: (draft: string) => void
  send: (question: string) => void
  reset: () => void
  rate: (messageId: number, feedback: 'up' | 'down') => void
  sendComment: (messageId: number, comment: string) => void
}

export const SEARCH_STAGE = 1
const STAGE_DURATIONS_MS = [650, 950, 750, 650, 550]
const STREAM_CHUNK = 3
const STREAM_TICK_MS = 18

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// RAG chat session (Ф-05). Lives above the chat modal so the dialog survives closing it and
// only "New chat" clears it. The pipeline stages and answers are simulated until the backend exists.
export function useChatSession(sections: KbSection[], queryLog: QueryLog): ChatSession {
  const { t, language } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const runIdRef = useRef(0)
  const nextIdRef = useRef(0)

  const updateAssistant = useCallback(
    (id: number, patch: Partial<AssistantMessage>): void =>
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id && message.role === 'assistant' ? { ...message, ...patch } : message
        )
      ),
    []
  )

  const run = async (question: string, assistantId: number, runId: number): Promise<void> => {
    const isCancelled = (): boolean => runIdRef.current !== runId
    const results = retrieve(question, sections, language)

    for (let stage = 0; stage < STAGE_DURATIONS_MS.length; stage += 1) {
      updateAssistant(assistantId, { stage })
      await sleep(STAGE_DURATIONS_MS[stage])
      if (isCancelled()) return
      if (stage === SEARCH_STAGE) {
        updateAssistant(assistantId, { fragmentsFound: results.length })
        // Nothing relevant: refuse right away without calling the LLM (anti-hallucination rule).
        if (results.length === 0) break
      }
    }

    const text =
      results.length === 0
        ? t.chat.notFound
        : [
            `${t.chat.answerIntro(localize(results[0].doc.title, language))} ${results[0].text} [1]`,
            ...(results[1]
              ? [`${t.chat.seeAlso(localize(results[1].doc.title, language))} [2].`]
              : [])
          ].join('\n\n')

    // Every answered or refused question lands in the query log for the gaps dashboard (Ф-06).
    const recordId = queryLog.log({
      question,
      outcome: results.length === 0 ? 'not-found' : 'answered',
      sectionId: results[0]?.sectionId ?? null,
      documentId: results[0]?.doc.id ?? null
    })

    updateAssistant(assistantId, {
      phase: 'streaming',
      text,
      sources: results,
      notFound: results.length === 0,
      recordId
    })

    for (let shown = 0; shown < text.length; shown += STREAM_CHUNK) {
      updateAssistant(assistantId, { shownLength: shown })
      await sleep(STREAM_TICK_MS)
      if (isCancelled()) return
    }
    updateAssistant(assistantId, { phase: 'done', shownLength: text.length })
    setBusy(false)
  }

  const send = (text: string): void => {
    const question = text.trim()
    if (!question || busy) return
    const userId = nextIdRef.current++
    const assistantId = nextIdRef.current++
    const runId = ++runIdRef.current
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', text: question },
      {
        id: assistantId,
        role: 'assistant',
        phase: 'thinking',
        stage: 0,
        fragmentsFound: null,
        text: '',
        shownLength: 0,
        sources: [],
        notFound: false,
        feedback: null,
        commentSent: false,
        recordId: null
      }
    ])
    setDraft('')
    setBusy(true)
    void run(question, assistantId, runId)
  }

  const reset = (): void => {
    runIdRef.current += 1
    setMessages([])
    setDraft('')
    setBusy(false)
  }

  const recordIdOf = (messageId: number): string | null => {
    const message = messages.find((item) => item.id === messageId)
    return message?.role === 'assistant' ? message.recordId : null
  }

  const rate = (messageId: number, feedback: 'up' | 'down'): void => {
    updateAssistant(messageId, { feedback, commentSent: false })
    const recordId = recordIdOf(messageId)
    if (recordId) queryLog.rate(recordId, feedback)
  }

  const sendComment = (messageId: number, comment: string): void => {
    updateAssistant(messageId, { commentSent: true })
    const recordId = recordIdOf(messageId)
    if (recordId) queryLog.comment(recordId, comment)
  }

  return { messages, busy, draft, setDraft, send, reset, rate, sendComment }
}
