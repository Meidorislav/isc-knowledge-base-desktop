import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron?: ElectronAPI
    api?: {
      appVersion: string | null
      setLanguage: (language: 'ru' | 'en') => void
      setDocumentOpen: (open: boolean) => void
      showSaveDialog: (
        defaultName: string,
        filter: { name: string; extensions: string[] }
      ) => Promise<string | null>
      writeFile: (filePath: string, data: Uint8Array) => Promise<void>
      writePdf: (filePath: string, html: string) => Promise<void>
    }
  }
}
