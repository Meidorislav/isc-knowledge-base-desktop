import { Info } from 'lucide-react'
import InfoModal from './InfoModal'
import BrandMark from './BrandMark'
import { useI18n } from '../i18n/context'

function AboutModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useI18n()
  const rows = [
    [t.about.version, window.api?.appVersion ?? 'dev'],
    [t.about.customer, t.about.customerValue],
    [t.about.developer, t.about.developerValue]
  ]

  return (
    <InfoModal
      title={t.about.title}
      closeLabel={t.about.close}
      icon={<Info size={16} />}
      onClose={onClose}
    >
      <div className="about">
        <BrandMark size={56} />
        <div className="about__product">{t.about.product}</div>
        <p className="about__description">{t.about.description}</p>
        <dl className="about__rows">
          {rows.map(([label, value]) => (
            <div key={label} className="about__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </InfoModal>
  )
}

export default AboutModal
