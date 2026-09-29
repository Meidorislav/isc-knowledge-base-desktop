import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveDocument, type ExportLabels } from './export'
import { securityPolicy } from './mockSecurityPolicy'
import type { KbDocument } from '../types/knowledgeBase'

const labels: ExportLabels = {
  filterNames: { docx: 'Word (DOCX)', pdf: 'PDF', md: 'Markdown', txt: 'Текст (TXT)' },
  owner: 'Ответственный',
  version: (n) => `Версия ${n}`
}

const decode = (data: Uint8Array): string => new TextDecoder().decode(data)

// Stands in for the preload bridge; the chosen path is whatever the dialog is asked to suggest.
function stubDesktopApi(dialogResult: 'accept' | 'cancel' = 'accept'): {
  showSaveDialog: ReturnType<typeof vi.fn>
  writeFile: ReturnType<typeof vi.fn>
  writePdf: ReturnType<typeof vi.fn>
} {
  const api = {
    showSaveDialog: vi.fn(async (name: string) =>
      dialogResult === 'accept' ? `/tmp/${name}` : null
    ),
    writeFile: vi.fn(async () => {}),
    writePdf: vi.fn(async () => {})
  }
  vi.stubGlobal('window', { api })
  return api
}

describe('saveDocument', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports a real DOCX (zip) with a Word filter in the dialog', async () => {
    const api = stubDesktopApi()
    const name = await saveDocument(securityPolicy, 'ru', 'docx', labels)

    expect(name).toBe('Регламент информационной безопасности.docx')
    expect(api.showSaveDialog).toHaveBeenCalledWith('Регламент информационной безопасности.docx', {
      name: 'Word (DOCX)',
      extensions: ['docx']
    })
    const bytes: Uint8Array = api.writeFile.mock.calls[0][1]
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK')
  })

  it('uses the requested language version for title and content', async () => {
    const api = stubDesktopApi()
    await saveDocument(securityPolicy, 'en', 'md', labels)

    const [path, bytes] = api.writeFile.mock.calls[0]
    expect(path).toBe('/tmp/Information security regulation.md')
    const markdown = decode(bytes)
    expect(markdown.startsWith('# Information security regulation\n')).toBe(true)
    expect(markdown).toContain('## 1. General provisions')
    expect(markdown).toContain('### 1.1. Scope')
  })

  it('writes plain text with the metadata line', async () => {
    const api = stubDesktopApi()
    await saveDocument(securityPolicy, 'ru', 'txt', labels)

    const text = decode(api.writeFile.mock.calls[0][1])
    expect(text).toContain('Ответственный: Кулаков В. А. · Версия 5 · 15.09.2026')
    expect(text).not.toContain('##')
  })

  it('sends escaped HTML to the PDF renderer instead of writing bytes', async () => {
    const api = stubDesktopApi()
    const doc: KbDocument = {
      ...securityPolicy,
      title: { ru: 'Проверка <b>экранирования</b>' },
      content: { ru: '## Раздел\nТекст & ещё текст' }
    }
    await saveDocument(doc, 'ru', 'pdf', labels)

    expect(api.writeFile).not.toHaveBeenCalled()
    const html: string = api.writePdf.mock.calls[0][1]
    expect(html).toContain('<h1>Проверка &lt;b&gt;экранирования&lt;/b&gt;</h1>')
    expect(html).toContain('<p>Текст &amp; ещё текст</p>')
  })

  it('saves the original uploaded file byte for byte', async () => {
    const api = stubDesktopApi()
    const original = new Uint8Array([1, 2, 3, 4])
    const doc: KbDocument = {
      ...securityPolicy,
      sources: { ru: { name: 'Политика ИБ.docx', blob: new Blob([original]) } }
    }
    const name = await saveDocument(doc, 'ru', 'source', labels)

    expect(name).toBe('Политика ИБ.docx')
    expect(api.showSaveDialog.mock.calls[0][1]).toEqual({ name: 'DOCX', extensions: ['docx'] })
    expect(Array.from(api.writeFile.mock.calls[0][1] as Uint8Array)).toEqual([1, 2, 3, 4])
  })

  it('writes nothing when the save dialog is cancelled', async () => {
    const api = stubDesktopApi('cancel')
    expect(await saveDocument(securityPolicy, 'ru', 'docx', labels)).toBeNull()
    expect(api.writeFile).not.toHaveBeenCalled()
    expect(api.writePdf).not.toHaveBeenCalled()
  })
})
