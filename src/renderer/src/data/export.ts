import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { ContentLanguage, KbDocument } from '../types/knowledgeBase'
import { localize } from './localize'
import { formatDate } from './format'

// Saving and exporting the open document (File → Save / Save As…).

export type ExportFormat = 'source' | 'docx' | 'pdf' | 'md' | 'txt'

export interface ExportLabels {
  filterNames: Record<Exclude<ExportFormat, 'source'>, string>
  owner: string
  version: (n: number) => string
}

type Block = { kind: 'h2' | 'h3' | 'p'; text: string }

function parseBlocks(content: string): Block[] {
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      if (line.startsWith('### ')) return { kind: 'h3', text: line.slice(4) }
      if (line.startsWith('## ')) return { kind: 'h2', text: line.slice(3) }
      return { kind: 'p', text: line }
    })
}

function safeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'document'
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"]/g,
    (char) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[char]};`
  )
}

function metaLine(doc: KbDocument, labels: ExportLabels): string {
  return `${labels.owner}: ${doc.owner} · ${labels.version(doc.version)} · ${formatDate(doc.updatedAt)}`
}

function toMarkdown(title: string, blocks: Block[]): string {
  const body = blocks
    .map((block) =>
      block.kind === 'h2'
        ? `## ${block.text}`
        : block.kind === 'h3'
          ? `### ${block.text}`
          : block.text
    )
    .join('\n\n')
  return `# ${title}\n\n${body}\n`
}

function toPlainText(title: string, meta: string, blocks: Block[]): string {
  const body = blocks
    .map((block) =>
      block.kind === 'p' ? block.text : `\n${block.text}\n${'-'.repeat(block.text.length)}`
    )
    .join('\n\n')
  return `${title}\n${'='.repeat(title.length)}\n${meta}\n\n${body.trim()}\n`
}

function toHtml(title: string, meta: string, blocks: Block[], language: ContentLanguage): string {
  const body = blocks
    .map((block) => {
      const tag = block.kind === 'p' ? 'p' : block.kind
      return `<${tag}>${escapeHtml(block.text)}</${tag}>`
    })
    .join('\n')
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #111; font-size: 11.5pt; line-height: 1.6; }
  h1 { font-size: 22pt; margin: 0 0 4pt; line-height: 1.2; }
  .meta { color: #666; font-size: 9.5pt; padding-bottom: 12pt; border-bottom: 1px solid #ddd; margin-bottom: 16pt; }
  h2 { font-size: 15pt; margin: 18pt 0 6pt; page-break-after: avoid; }
  h3 { font-size: 12.5pt; margin: 12pt 0 4pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${escapeHtml(meta)}</div>
${body}
</body></html>`
}

async function toDocx(
  title: string,
  meta: string,
  blocks: Block[],
  owner: string
): Promise<Uint8Array> {
  const document = new Document({
    creator: owner,
    title,
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [new TextRun({ text: meta, color: '666666', size: 18 })],
            spacing: { after: 240 }
          }),
          ...blocks.map((block) =>
            block.kind === 'p'
              ? new Paragraph({ text: block.text, spacing: { after: 120 } })
              : new Paragraph({
                  text: block.text,
                  heading: block.kind === 'h2' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2
                })
          )
        ]
      }
    ]
  })
  return new Uint8Array(await (await Packer.toBlob(document)).arrayBuffer())
}

function downloadInBrowser(data: Uint8Array | string, fileName: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  pdf: 'application/pdf'
}

// Returns the saved file name, or null if the user cancelled the save dialog.
export async function saveDocument(
  doc: KbDocument,
  language: ContentLanguage,
  format: ExportFormat,
  labels: ExportLabels
): Promise<string | null> {
  const title = localize(doc.title, language)
  const meta = metaLine(doc, labels)
  const blocks = parseBlocks(localize(doc.content, language))
  const baseName = safeFileName(title)

  const source = doc.sources?.[language] ?? doc.sources?.ru
  const effective = format === 'source' ? (source ? 'original' : 'md') : format
  const extension =
    effective === 'original' ? (source!.name.split('.').pop() ?? '').toLowerCase() : effective
  const fileName = effective === 'original' ? source!.name : `${baseName}.${extension}`
  const filter = {
    name: effective === 'original' ? extension.toUpperCase() : labels.filterNames[effective],
    extensions: [extension]
  }

  const build = async (): Promise<Uint8Array | string> => {
    switch (effective) {
      case 'original':
        return new Uint8Array(await source!.blob.arrayBuffer())
      case 'docx':
        return toDocx(title, meta, blocks, doc.owner)
      case 'txt':
        return toPlainText(title, meta, blocks)
      case 'pdf':
        return toHtml(title, meta, blocks, language)
      default:
        return toMarkdown(title, blocks)
    }
  }

  const api = window.api
  if (!api) {
    if (effective === 'pdf') throw new Error('PDF export needs the desktop app')
    downloadInBrowser(await build(), fileName, MIME[extension] ?? 'application/octet-stream')
    return fileName
  }

  const filePath = await api.showSaveDialog(fileName, filter)
  if (!filePath) return null
  const data = await build()
  if (effective === 'pdf') await api.writePdf(filePath, data as string)
  else
    await api.writeFile(filePath, typeof data === 'string' ? new TextEncoder().encode(data) : data)
  return filePath.split(/[\\/]/).pop() ?? fileName
}
