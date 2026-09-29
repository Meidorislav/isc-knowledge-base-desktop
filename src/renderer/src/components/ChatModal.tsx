import { Fragment, useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X
} from 'lucide-react'
import { localize } from '../data/localize'
import { SEARCH_STAGE, type AssistantMessage, type ChatSession } from '../chat/useChatSession'
import { useI18n } from '../i18n/context'

interface ChatModalProps {
  session: ChatSession
  onClose: () => void
  onOpenDocument: (documentId: string, fragment: string) => void
}

function renderWithCitations(text: string): React.ReactNode {
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const match = /^\[(\d+)\]$/.exec(part)
    return match ? (
      <sup key={index} className="cite">
        {match[1]}
      </sup>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  })
}

// RAG chat window (Ф-05). The dialog itself lives in the session, so closing the window keeps it.
function ChatModal({ session, onClose, onOpenDocument }: ChatModalProps): React.JSX.Element {
  const { t } = useI18n()
  const { messages, busy, draft, setDraft, send, reset, rate, sendComment } = session
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!busy) inputRef.current?.focus()
  }, [busy])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const resetChat = (): void => {
    reset()
    inputRef.current?.focus()
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(draft)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.chat.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <span className="modal-header__badge">
            <Sparkles size={16} />
          </span>
          <div className="modal-header__text">
            <div className="modal-header__title">{t.chat.title}</div>
            <div className="modal-header__subtitle">{t.chat.subtitle}</div>
          </div>
          {messages.length > 0 && (
            <button type="button" className="text-button" onClick={resetChat}>
              <RotateCcw size={14} />
              {t.chat.newChat}
            </button>
          )}
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.chat.close}>
            <X size={18} />
          </button>
        </header>

        <div className="chat-modal__body">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty__title">{t.chat.emptyTitle}</div>
              <div className="chat-empty__suggestions">
                {t.chat.suggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="suggestion"
                    onClick={() => send(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="message message--user">
                  {message.text}
                </div>
              ) : (
                <AssistantBubble
                  key={message.id}
                  message={message}
                  onOpenDocument={onOpenDocument}
                  onFeedback={(feedback) => rate(message.id, feedback)}
                  onComment={(comment) => sendComment(message.id, comment)}
                />
              )
            )
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-modal__footer">
          <div className="composer">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              placeholder={t.chat.placeholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onInputKeyDown}
            />
            <button
              type="button"
              className="composer__send"
              onClick={() => send(draft)}
              disabled={!draft.trim() || busy}
              aria-label={t.chat.send}
            >
              {busy ? <Loader2 size={18} className="spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
          <div className="chat-modal__hint">{t.chat.hint}</div>
        </footer>
      </div>
    </div>
  )
}

interface AssistantBubbleProps {
  message: AssistantMessage
  onOpenDocument: (documentId: string, fragment: string) => void
  onFeedback: (feedback: 'up' | 'down') => void
  onComment: (comment: string) => void
}

function AssistantBubble({
  message,
  onOpenDocument,
  onFeedback,
  onComment
}: AssistantBubbleProps): React.JSX.Element {
  const { t, language } = useI18n()
  const [comment, setComment] = useState('')

  if (message.phase === 'thinking') {
    return (
      <div className="thinking" aria-live="polite">
        {t.chat.stages.slice(0, message.stage + 1).map((label, index) => {
          const isCurrent = index === message.stage
          return (
            <div key={label} className={'thinking__step' + (isCurrent ? ' is-current' : '')}>
              {isCurrent ? (
                <span className="thinking__pulse" />
              ) : (
                <Check size={13} className="thinking__check" />
              )}
              <span className={isCurrent ? 'shimmer' : undefined}>
                {label}
                {index === SEARCH_STAGE && message.fragmentsFound !== null && !isCurrent
                  ? ` — ${t.chat.foundFragments(message.fragmentsFound).toLowerCase()}`
                  : ''}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const visibleText = message.text.slice(0, message.shownLength)

  return (
    <div className="message message--assistant">
      <div className={'answer' + (message.notFound ? ' answer--not-found' : '')}>
        {renderWithCitations(visibleText)}
        {message.phase === 'streaming' && <span className="caret" />}
      </div>

      {message.phase === 'done' && message.notFound && (
        <div className="answer__hint">{t.chat.notFoundHint}</div>
      )}

      {message.phase === 'done' && message.sources.length > 0 && (
        <div className="sources">
          <div className="sources__label">{t.chat.sources}</div>
          {message.sources.map((source, index) => (
            <button
              type="button"
              key={source.doc.id}
              className="source"
              onClick={() => onOpenDocument(source.doc.id, source.text)}
            >
              <span className="source__index">{index + 1}</span>
              <FileText size={15} className="source__icon" />
              <span className="source__body">
                <span className="source__title">{localize(source.doc.title, language)}</span>
                <span className="source__path">
                  {source.sectionTitle}
                  {source.heading ? ` › ${source.heading}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {message.phase === 'done' && (
        <div className="feedback">
          <button
            type="button"
            className={'feedback__button' + (message.feedback === 'up' ? ' is-selected' : '')}
            onClick={() => onFeedback('up')}
            aria-label={t.chat.helpful}
            title={t.chat.helpful}
          >
            <ThumbsUp size={14} />
          </button>
          <button
            type="button"
            className={'feedback__button' + (message.feedback === 'down' ? ' is-selected' : '')}
            onClick={() => onFeedback('down')}
            aria-label={t.chat.notHelpful}
            title={t.chat.notHelpful}
          >
            <ThumbsDown size={14} />
          </button>
          {(message.feedback === 'up' || message.commentSent) && (
            <span className="feedback__thanks">{t.chat.thanks}</span>
          )}
        </div>
      )}

      {message.phase === 'done' && message.feedback === 'down' && !message.commentSent && (
        <form
          className="feedback-comment"
          onSubmit={(event) => {
            event.preventDefault()
            onComment(comment)
          }}
        >
          <label className="feedback-comment__label" htmlFor={`comment-${message.id}`}>
            {t.chat.commentPrompt}
          </label>
          <div className="feedback-comment__row">
            <input
              id={`comment-${message.id}`}
              value={comment}
              placeholder={t.chat.commentPlaceholder}
              onChange={(event) => setComment(event.target.value)}
              autoFocus
            />
            <button type="submit" className="button button--primary button--small">
              {t.chat.commentSend}
            </button>
            <button type="button" className="text-button" onClick={() => onComment('')}>
              {t.chat.commentSkip}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ChatModal
