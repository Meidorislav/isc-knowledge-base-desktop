import { createElement } from 'react'
import type { LucideProps } from 'lucide-react'
import { getSectionIcon } from '../data/sectionIcons'

function SectionIcon({
  sectionId,
  ...props
}: LucideProps & { sectionId: string }): React.JSX.Element {
  return createElement(getSectionIcon(sectionId), props)
}

export default SectionIcon
