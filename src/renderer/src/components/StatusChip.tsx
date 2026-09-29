import type { DocumentStatus } from '../types/knowledgeBase'
import { useI18n } from '../i18n/context'

function StatusChip({ status }: { status: DocumentStatus }): React.JSX.Element {
  const { t } = useI18n()
  return (
    <span className={`chip chip--${status}`}>
      <span className="chip__dot" />
      {t.doc.status[status]}
    </span>
  )
}

export default StatusChip
