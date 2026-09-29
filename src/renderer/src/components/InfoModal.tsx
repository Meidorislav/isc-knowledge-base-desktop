import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface InfoModalProps {
  title: string
  closeLabel: string
  icon: ReactNode
  onClose: () => void
  children: ReactNode
}

function InfoModal({
  title,
  closeLabel,
  icon,
  onClose,
  children
}: InfoModalProps): React.JSX.Element {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--info"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <span className="modal-header__badge">{icon}</span>
          <div className="modal-header__text">
            <div className="modal-header__title">{title}</div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </header>
        <div className="dialog__body">{children}</div>
      </div>
    </div>
  )
}

export default InfoModal
