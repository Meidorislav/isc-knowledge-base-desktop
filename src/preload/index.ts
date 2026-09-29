import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const versionArg = process.argv.find((arg) => arg.startsWith('--app-version='))

const api = {
  appVersion: versionArg?.split('=')[1] ?? null,
  setLanguage: (language: 'ru' | 'en'): void => ipcRenderer.send('set-language', language),
  setDocumentOpen: (open: boolean): void => ipcRenderer.send('set-document-open', open),
  showSaveDialog: (
    defaultName: string,
    filter: { name: string; extensions: string[] }
  ): Promise<string | null> => ipcRenderer.invoke('files:save-dialog', defaultName, filter),
  writeFile: (filePath: string, data: Uint8Array): Promise<void> =>
    ipcRenderer.invoke('files:write', filePath, data),
  writePdf: (filePath: string, html: string): Promise<void> =>
    ipcRenderer.invoke('files:write-pdf', filePath, html)
}

// Menu clicks are relayed as window messages so the renderer has a single entry point for them.
ipcRenderer.on('menu-action', (_, action: string) => {
  window.postMessage({ type: 'menu-action', action }, '*')
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
