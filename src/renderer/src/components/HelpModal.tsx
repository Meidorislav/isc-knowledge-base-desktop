import { CircleHelp } from 'lucide-react'
import InfoModal from './InfoModal'
import { useI18n } from '../i18n/context'

function HelpModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useI18n()
  return (
    <InfoModal
      title={t.help.title}
      closeLabel={t.about.close}
      icon={<CircleHelp size={16} />}
      onClose={onClose}
    >
      <div className="help-list">
        {t.help.items.map((item) => (
          <section key={item.heading} className="help-item">
            <h3>{item.heading}</h3>
            <p>{item.text}</p>
          </section>
        ))}
      </div>
    </InfoModal>
  )
}

export default HelpModal
