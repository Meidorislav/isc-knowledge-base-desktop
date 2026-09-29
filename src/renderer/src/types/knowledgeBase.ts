// Domain types for the knowledge base tree and document viewer (spec: Ф-01, Ф-08).

export type ContentLanguage = 'ru' | 'en'

// Russian is the primary language; English values fall back to Russian when missing.
export interface LocalizedText {
  ru: string
  en?: string
}

export type DocumentStatus = 'uploaded' | 'processing' | 'indexed' | 'error'

export interface SourceFile {
  name: string
  blob: Blob
}

export interface KbDocument {
  id: string
  title: LocalizedText
  owner: string
  status: DocumentStatus
  version: number
  updatedAt: string
  content: LocalizedText
  sources?: Partial<Record<ContentLanguage, SourceFile>>
  sourceHashes?: string[]
}

export interface KbSection {
  id: string
  title: LocalizedText
  documents: KbDocument[]
}
