import { BrowserWindow, dialog, ipcMain } from 'electron'
import { writeFile } from 'fs/promises'

export interface SaveFilter {
  name: string
  extensions: string[]
}

// The renderer may only write to paths the user picked in a native save dialog.
const approvedPaths = new Set<string>()

async function renderPdf(html: string): Promise<Buffer> {
  const window = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  try {
    await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    return await window.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.8, bottom: 0.8, left: 0.8, right: 0.8 }
    })
  } finally {
    window.destroy()
  }
}

function takeApproved(filePath: string): void {
  if (!approvedPaths.has(filePath)) throw new Error('Path was not chosen in a save dialog')
  approvedPaths.delete(filePath)
}

export function registerFileHandlers(): void {
  ipcMain.handle(
    'files:save-dialog',
    async (event, defaultName: string, filter: SaveFilter): Promise<string | null> => {
      const window = BrowserWindow.fromWebContents(event.sender)
      const options = { defaultPath: defaultName, filters: [filter] }
      const result = window
        ? await dialog.showSaveDialog(window, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return null
      approvedPaths.add(result.filePath)
      return result.filePath
    }
  )

  ipcMain.handle('files:write', async (_, filePath: string, data: Uint8Array): Promise<void> => {
    takeApproved(filePath)
    await writeFile(filePath, data)
  })

  ipcMain.handle('files:write-pdf', async (_, filePath: string, html: string): Promise<void> => {
    takeApproved(filePath)
    await writeFile(filePath, await renderPdf(html))
  })
}
