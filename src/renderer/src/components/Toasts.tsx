import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react'

export interface Toast {
  id: number
  kind: 'progress' | 'success' | 'error'
  text: string
}

function Toasts({ toasts }: { toasts: Toast[] }): React.JSX.Element {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          {toast.kind === 'progress' ? (
            <Loader2 size={16} className="spin" />
          ) : toast.kind === 'error' ? (
            <CircleAlert size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {toast.text}
        </div>
      ))}
    </div>
  )
}

export default Toasts
