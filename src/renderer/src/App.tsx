import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import HomeView from './components/HomeView'
import SectionView from './components/SectionView'
import DocumentViewer from './components/DocumentViewer'
import ChatModal from './components/ChatModal'
import UploadModal from './components/UploadModal'
import SectionModal from './components/SectionModal'
import HelpModal from './components/HelpModal'
import AboutModal from './components/AboutModal'
import Toasts, { type Toast } from './components/Toasts'
import { mockKnowledgeBase } from './data/mockKnowledgeBase'
import { localize } from './data/localize'
import type { ContentLanguage, KbDocument, KbSection, LocalizedText } from './types/knowledgeBase'
import { saveDocument, type ExportFormat } from './data/export'
import SaveAsModal from './components/SaveAsModal'
import { useI18n } from './i18n/context'
import { useChatSession } from './chat/useChatSession'
import { useQueryLog } from './analytics/useQueryLog'
import { buildGaps, inPeriod } from './analytics/gaps'
import DashboardView from './components/DashboardView'

type ModalKind = 'chat' | 'upload' | 'create-section' | 'save-as' | 'help' | 'about'

type View =
  | { kind: 'home' }
  | { kind: 'dashboard' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'document'; documentId: string; fragment: string | null }

const MENU_ACTIONS: Record<string, ModalKind> = {
  'create-section': 'create-section',
  help: 'help',
  about: 'about'
}

const SIMULATED_INDEXING_MS = 4000
const TOAST_LIFETIME_MS = 4500

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
}

function findContent(
  sections: KbSection[],
  view: View
):
  | { kind: 'section'; section: KbSection }
  | { kind: 'document'; section: KbSection; doc: KbDocument; fragment: string | null }
  | null {
  if (view.kind === 'section') {
    const section = sections.find((item) => item.id === view.sectionId)
    return section ? { kind: 'section', section } : null
  }
  if (view.kind === 'document') {
    for (const section of sections) {
      const doc = section.documents.find((item) => item.id === view.documentId)
      if (doc) return { kind: 'document', section, doc, fragment: view.fragment }
    }
  }
  return null
}

function App(): React.JSX.Element {
  const { t, language } = useI18n()
  const [sections, setSections] = useState<KbSection[]>(mockKnowledgeBase)
  const [view, setView] = useState<View>({ kind: 'home' })
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [uploadSectionId, setUploadSectionId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastIdRef = useRef(0)
  const queryLog = useQueryLog()
  const chat = useChatSession(sections, queryLog)
  const [now] = useState(() => new Date())
  const openGapCount = buildGaps(inPeriod(queryLog.records, 30, now), queryLog.resolvedAt).filter(
    (gap) => !gap.resolved
  ).length

  const closeModal = useCallback(() => setModal(null), [])
  const goHome = useCallback(() => setView({ kind: 'home' }), [])
  const openDashboard = useCallback(() => setView({ kind: 'dashboard' }), [])
  const openSection = useCallback(
    (sectionId: string) => setView({ kind: 'section', sectionId }),
    []
  )
  const openDocument = useCallback(
    (documentId: string) => setView({ kind: 'document', documentId, fragment: null }),
    []
  )

  // A question from the search box continues the current dialog; if an answer is still being
  // generated, it waits in the input field instead of being dropped.
  const openChat = (question?: string): void => {
    if (question) {
      if (chat.busy) chat.setDraft(question)
      else chat.send(question)
    }
    setModal('chat')
  }

  const openUpload = useCallback((sectionId: string | null) => {
    setUploadSectionId(sectionId)
    setModal('upload')
  }, [])

  const showToast = useCallback((kind: Toast['kind'], text: string) => {
    const id = nextToastIdRef.current++
    setToasts((prev) => [...prev, { id, kind, text }])
    setTimeout(
      () => setToasts((prev) => prev.filter((toast) => toast.id !== id)),
      TOAST_LIFETIME_MS
    )
  }, [])

  const currentSectionId =
    view.kind === 'section'
      ? view.sectionId
      : view.kind === 'document'
        ? (sections.find((section) => section.documents.some((d) => d.id === view.documentId))
            ?.id ?? null)
        : null

  const content = findContent(sections, view)
  const openDoc = content?.kind === 'document' ? content.doc : null

  useEffect(() => {
    window.api?.setDocumentOpen(openDoc !== null)
  }, [openDoc])

  const saveOpenDocument = async (
    format: ExportFormat,
    contentLanguage: ContentLanguage = language
  ): Promise<void> => {
    if (!openDoc) return
    setModal(null)
    try {
      const savedName = await saveDocument(openDoc, contentLanguage, format, {
        filterNames: {
          docx: t.saveAs.formats.docx.name,
          pdf: t.saveAs.formats.pdf.name,
          md: t.saveAs.formats.md.name,
          txt: t.saveAs.formats.txt.name
        },
        owner: t.doc.owner,
        version: t.doc.version
      })
      if (savedName) showToast('success', t.saveAs.toastSaved(savedName))
    } catch {
      showToast('error', t.saveAs.error)
    }
  }

  const handleMenuAction = useEffectEvent((action: string) => {
    if (action === 'dashboard') openDashboard()
    else if (action === 'upload') openUpload(currentSectionId)
    else if (action === 'save') void saveOpenDocument('source')
    else if (action === 'save-as') {
      if (openDoc) setModal('save-as')
    } else if (MENU_ACTIONS[action]) setModal(MENU_ACTIONS[action])
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setModal('chat')
      }
    }
    // Native menu clicks arrive from the preload script as window messages.
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== window || event.data?.type !== 'menu-action') return
      handleMenuAction(String(event.data.action))
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const handleUpload = (sectionId: string, doc: KbDocument): void => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, documents: [...section.documents, doc] } : section
      )
    )
    setModal(null)
    openDocument(doc.id)
    const title = localize(doc.title, language)
    showToast('progress', t.upload.toastUploaded(title))

    setTimeout(() => {
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          documents: section.documents.map((item) =>
            item.id === doc.id ? { ...item, status: 'indexed' } : item
          )
        }))
      )
      showToast('success', t.upload.toastIndexed(title))
    }, SIMULATED_INDEXING_MS)
  }

  const handleCreateSection = (title: LocalizedText): void => {
    const id = `section-${slugify(title.en || title.ru)}-${Date.now().toString(36)}`
    setSections((prev) => [...prev, { id, title, documents: [] }])
    setModal(null)
    openSection(id)
    showToast('success', t.newSection.toastCreated(localize(title, language)))
  }

  const openFromChat = useCallback((documentId: string, fragment: string) => {
    setModal(null)
    setView({ kind: 'document', documentId, fragment })
  }, [])

  return (
    <div className="app-shell">
      <TopBar
        sections={sections}
        onAskAi={openChat}
        onGoHome={goHome}
        onOpenSection={openSection}
        onOpenDocument={openDocument}
      />
      <div className="app-shell__body">
        <Sidebar
          sections={sections}
          activeSectionId={currentSectionId}
          activeDocumentId={view.kind === 'document' ? view.documentId : null}
          isHome={view.kind === 'home'}
          isDashboard={view.kind === 'dashboard'}
          openGapCount={openGapCount}
          onGoHome={goHome}
          onOpenDashboard={openDashboard}
          onOpenSection={openSection}
          onOpenDocument={openDocument}
        />
        <main className="content">
          {content?.kind === 'document' ? (
            <DocumentViewer
              key={content.doc.id}
              doc={content.doc}
              section={content.section}
              highlightedFragment={content.fragment}
              onGoHome={goHome}
              onOpenSection={openSection}
              onSave={() => void saveOpenDocument('source')}
            />
          ) : content?.kind === 'section' ? (
            <SectionView
              key={content.section.id}
              section={content.section}
              onGoHome={goHome}
              onOpenDocument={openDocument}
              onUpload={() => openUpload(content.section.id)}
            />
          ) : view.kind === 'dashboard' ? (
            <DashboardView
              sections={sections}
              queryLog={queryLog}
              onOpenDocument={openDocument}
              onUpload={openUpload}
              onToast={(text) => showToast('success', text)}
            />
          ) : (
            <HomeView sections={sections} onOpenSection={openSection} onAskAi={() => openChat()} />
          )}
        </main>
      </div>

      {modal === 'chat' && (
        <ChatModal session={chat} onClose={closeModal} onOpenDocument={openFromChat} />
      )}
      {modal === 'upload' && (
        <UploadModal
          sections={sections}
          initialSectionId={uploadSectionId}
          onClose={closeModal}
          onUpload={handleUpload}
        />
      )}
      {modal === 'create-section' && (
        <SectionModal sections={sections} onClose={closeModal} onCreate={handleCreateSection} />
      )}
      {modal === 'help' && <HelpModal onClose={closeModal} />}
      {modal === 'about' && <AboutModal onClose={closeModal} />}
      {modal === 'save-as' && openDoc && (
        <SaveAsModal
          doc={openDoc}
          onClose={closeModal}
          onSave={(format, contentLanguage) => void saveOpenDocument(format, contentLanguage)}
        />
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}

export default App
