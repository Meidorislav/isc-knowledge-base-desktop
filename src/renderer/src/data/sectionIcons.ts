import { Database, Folder, GitBranch, Monitor, ScrollText, type LucideIcon } from 'lucide-react'

const sectionIcons: Record<string, LucideIcon> = {
  regulations: ScrollText,
  workstation: Monitor,
  'sql-kb': Database,
  git: GitBranch
}

export function getSectionIcon(sectionId: string): LucideIcon {
  return sectionIcons[sectionId] ?? Folder
}
