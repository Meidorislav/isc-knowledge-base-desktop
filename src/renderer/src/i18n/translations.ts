export type Language = 'ru' | 'en'

function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const ru = {
  languageName: 'Русский',
  brand: { line1: 'Информационно-', line2: 'сервисный центр' },
  topbar: {
    or: 'или',
    askAi: 'Спросить ИИ',
    language: 'Язык интерфейса'
  },
  search: {
    placeholder: 'Поиск по разделам и документам',
    aria: 'Поиск по базе знаний',
    sections: 'Разделы',
    documents: 'Документы',
    noResults: (query: string) => `По запросу «${query}» ничего не нашлось`,
    noResultsHint: 'Попробуйте спросить ИИ-ассистента — он поищет ответ в тексте документов.',
    askAi: (query: string) => `Спросить ИИ: «${query}»`,
    keyboardHint: '↑↓ — выбор · Enter — открыть · Esc — закрыть'
  },
  sidebar: {
    treeAria: 'Дерево базы знаний',
    home: 'Главная',
    sections: 'Разделы',
    noDocuments: 'Документов пока нет',
    toggleSection: 'Свернуть или развернуть раздел',
    dashboard: 'Дашборд пробелов'
  },
  home: {
    title: 'Корпоративная база знаний',
    subtitle: 'Регламенты, инструкции и описания процессов ООО «ИСЦ» в одном месте',
    text: 'Найдите нужный документ в разделах ниже или задайте вопрос обычными словами — ИИ-ассистент ответит строго по документам компании и приложит ссылки на источники.',
    aiBannerTitle: 'Спросите ИИ-ассистента',
    aiBannerText: 'Например: «Какие сроки первичной реакции на критичный инцидент?»',
    sectionsHeading: 'Разделы',
    documentCount: (n: number) => `${n} ${pluralRu(n, 'документ', 'документа', 'документов')}`
  },
  section: {
    emptyTitle: 'В разделе пока нет документов',
    emptyText:
      'Загрузите первый регламент или инструкцию — после индексации он станет доступен в поиске.',
    upload: 'Загрузить документ'
  },
  doc: {
    status: {
      uploaded: 'Загружен',
      processing: 'Обрабатывается',
      indexed: 'Проиндексирован',
      error: 'Ошибка индексации'
    },
    version: (n: number) => `Версия ${n}`,
    owner: 'Ответственный',
    download: 'Скачать исходник',
    onThisPage: 'На этой странице',
    onlyInRussian: 'Документ доступен только на русском языке.'
  },
  chat: {
    title: 'ИИ-ассистент',
    subtitle: 'Отвечает только по документам базы знаний',
    close: 'Закрыть',
    newChat: 'Новый диалог',
    emptyTitle: 'Чем помочь?',
    suggestions: [
      'Какие сроки первичной реакции на критичный инцидент?',
      'Как настроить новое рабочее место?',
      'Как называть ветки в Git?'
    ],
    placeholder: 'Задайте вопрос по базе знаний…',
    send: 'Отправить',
    hint: 'Enter — отправить · Shift+Enter — новая строка · Esc — закрыть',
    stages: [
      'Анализирую вопрос',
      'Ищу в базе знаний',
      'Ранжирую найденные фрагменты',
      'Проверяю источники',
      'Формирую ответ'
    ],
    foundFragments: (n: number) =>
      `Найдено ${n} ${pluralRu(n, 'фрагмент', 'фрагмента', 'фрагментов')}`,
    notFound: 'Информация в базе знаний отсутствует.',
    notFoundHint: 'Вопрос сохранён — ответственные за разделы увидят его в дашборде пробелов.',
    answerIntro: (title: string) => `Согласно документу «${title}»:`,
    seeAlso: (title: string) => `Связанные сведения есть также в документе «${title}»`,
    sources: 'Источники',
    helpful: 'Полезно',
    notHelpful: 'Не полезно',
    thanks: 'Спасибо за оценку',
    commentPrompt: 'Что было не так? Комментарий увидят ответственные за раздел.',
    commentPlaceholder: 'Например: нет инструкции для Linux',
    commentSend: 'Отправить',
    commentSkip: 'Пропустить'
  },
  languageTabs: {
    ru: 'Русский',
    en: 'English',
    required: 'обязательно',
    optional: 'необязательно'
  },
  upload: {
    title: 'Загрузка документа',
    subtitle: 'Новый регламент или инструкция попадёт в поиск после индексации',
    dropTitle: 'Перетащите файл сюда',
    dropOr: 'или',
    browse: 'выберите на компьютере',
    formats: 'DOCX, Markdown или TXT (UTF-8), до 20 МБ',
    replace: 'Заменить',
    remove: 'Убрать',
    fieldTitle: 'Название',
    fieldSection: 'Раздел',
    fieldOwner: 'Ответственный',
    fieldOwnerPlaceholder: 'ФИО ответственного',
    englishHint:
      'Английская версия необязательна. Если её нет, в английском интерфейсе покажется русская.',
    cancel: 'Отмена',
    submit: 'Загрузить',
    errorFormat: 'Неподдерживаемый формат. Допустимы DOCX, Markdown и TXT.',
    errorSize: 'Файл больше 20 МБ. Уменьшите размер документа или разбейте его на части.',
    errorDuplicate: (title: string) => `Такой файл уже загружен — документ «${title}».`,
    errorRussianRequired: 'Добавьте файл и название на вкладке «Русский».',
    errorEnglishTitle: 'Укажите название английской версии.',
    errorOwner: 'Укажите ответственного.',
    errorNoSections: 'Сначала создайте раздел: Файл → Создать раздел…',
    docxPending: (name: string) =>
      `Исходный файл ${name} принят. Текст документа появится после обработки на сервере.`,
    toastUploaded: (title: string) => `«${title}» загружен и поставлен в очередь на индексацию`,
    toastIndexed: (title: string) => `«${title}» проиндексирован и доступен в поиске`
  },
  newSection: {
    title: 'Новый раздел',
    subtitle: 'Раздел появится в дереве базы знаний',
    fieldTitle: 'Название раздела',
    placeholderRu: 'Например: Бизнес-процессы',
    placeholderEn: 'For example: Business processes',
    englishHint: 'Если английское название не указано, в английском интерфейсе покажется русское.',
    cancel: 'Отмена',
    submit: 'Создать',
    errorRequired: 'Укажите название раздела на русском.',
    errorExists: 'Раздел с таким названием уже есть.',
    toastCreated: (title: string) => `Раздел «${title}» создан`
  },
  saveAs: {
    title: 'Сохранить как',
    subtitle: 'Экспорт открытого документа в другой формат',
    format: 'Формат',
    formats: {
      docx: { name: 'Word (DOCX)', hint: 'Для редактирования и печати' },
      pdf: { name: 'PDF', hint: 'Для отправки и печати, без редактирования' },
      md: { name: 'Markdown', hint: 'Текст с разметкой — для вики и Git' },
      txt: { name: 'Текст (TXT)', hint: 'Без оформления' }
    },
    languageVersion: 'Версия документа',
    langRu: 'Русская',
    langEn: 'Английская',
    noEnglish: 'Английской версии у документа нет',
    cancel: 'Отмена',
    submit: 'Сохранить…',
    toastSaved: (name: string) => `Сохранено: ${name}`,
    error: 'Не удалось сохранить файл. Проверьте, что папка доступна для записи.',
    pdfUnavailable: 'PDF сохраняется только в настольном приложении'
  },
  dashboard: {
    title: 'Дашборд пробелов',
    subtitle:
      'Вопросы без ответа и ответы с оценкой «не полезно» — что стоит дописать или исправить в базе знаний',
    period7: '7 дней',
    period30: '30 дней',
    updated: (time: string) => `Обновлено в ${time}`,
    kpiQuestions: 'Вопросов',
    kpiNotFound: 'Без ответа',
    kpiNegative: 'Оценка «не полезно»',
    kpiOpenGaps: 'Открытых пробелов',
    kpiPerDay: (n: string) => `${n} в среднем в день`,
    kpiShareOfQuestions: (p: number) => `${p}% всех вопросов`,
    kpiShareOfRated: (p: number) => `${p}% оценённых ответов`,
    kpiResolved: (n: number) => `устранено: ${n}`,
    chartTitle: 'Динамика по дням',
    seriesAnswered: 'С ответом',
    seriesNotFound: 'Без ответа',
    seriesNegative: 'Не полезно',
    viewChart: 'График',
    viewTable: 'Таблица',
    colDate: 'Дата',
    colTotal: 'Всего',
    bySection: 'По разделам',
    byOwner: 'По ответственным',
    colSection: 'Раздел',
    colOwner: 'Ответственный',
    colQuestions: 'Вопросов',
    colNotFound: 'Без ответа',
    colNegative: 'Не полезно',
    colOpenGaps: 'Открытых',
    undeterminedSection: 'Раздел не определён',
    unassignedOwner: 'Не назначен',
    gapsTitle: 'Проблемные запросы',
    tabOpen: 'Открытые',
    tabResolved: 'Устранённые',
    filterAll: 'Все причины',
    reasonNotFound: 'Нет ответа',
    reasonNegative: 'Не полезно',
    timesAsked: (n: number) => `${n} ${pluralRu(n, 'раз', 'раза', 'раз')}`,
    lastAsked: (date: string) => `последний раз ${date}`,
    openDocument: 'Открыть документ',
    uploadDocument: 'Загрузить документ',
    markResolved: 'Устранён',
    reopen: 'Вернуть в работу',
    emptyOpenTitle: 'Открытых пробелов нет',
    emptyOpenText:
      'За период все вопросы получили ответ, и никто не отметил ответ как бесполезный.',
    emptyResolvedTitle: 'Пока ничего не устранено',
    emptyResolvedText: 'Когда дополните документ, отметьте пробел кнопкой «Устранён».',
    toastResolved: 'Пробел отмечен как устранённый',
    toastReopened: 'Пробел возвращён в работу'
  },
  help: {
    title: 'Справка',
    items: [
      {
        heading: 'Поиск',
        text: 'Нажмите «/», чтобы перейти к строке поиска: она ищет по названиям разделов и документов. Если подходящего нет, можно сразу спросить ИИ-ассистента.'
      },
      {
        heading: 'ИИ-ассистент',
        text: '⌘K / Ctrl+K открывает чат. Ассистент отвечает только по документам базы знаний и приводит ссылки на источники; если ответа нет — честно сообщает об этом.'
      },
      {
        heading: 'Разделы и документы',
        text: 'Файл → Создать раздел… (⇧⌘N / Ctrl+Shift+N) и Файл → Загрузить документ… (⌘U / Ctrl+U). Названия и файлы можно указать на русском и английском. Поддерживаются DOCX, Markdown и TXT до 20 МБ.'
      },
      {
        heading: 'Оценка ответов',
        text: 'Отмечайте ответы как полезные или нет — вопросы без ответа и с отрицательной оценкой попадают в дашборд пробелов для ответственных за разделы.'
      }
    ]
  },
  about: {
    title: 'О программе',
    product: 'База знаний ИСЦ',
    description:
      'Интеллектуальный поиск и генерация ответов по корпоративной базе знаний с антигаллюцинационным контуром. Все данные обрабатываются локально, в инфраструктуре компании.',
    version: 'Версия',
    customer: 'Заказчик',
    customerValue: 'ООО «Информационно-сервисный центр»',
    developer: 'Разработчик',
    developerValue: 'Бакин В. А., ПНИПУ',
    close: 'Закрыть'
  }
}

export type Messages = typeof ru

const en: Messages = {
  languageName: 'English',
  brand: { line1: 'Information', line2: 'Service Center' },
  topbar: {
    or: 'or',
    askAi: 'Ask AI',
    language: 'Interface language'
  },
  search: {
    placeholder: 'Search sections and documents',
    aria: 'Search the knowledge base',
    sections: 'Sections',
    documents: 'Documents',
    noResults: (query: string) => `Nothing found for “${query}”`,
    noResultsHint: 'Try asking the AI assistant — it will look for the answer inside documents.',
    askAi: (query: string) => `Ask AI: “${query}”`,
    keyboardHint: '↑↓ — select · Enter — open · Esc — close'
  },
  sidebar: {
    treeAria: 'Knowledge base tree',
    home: 'Home',
    sections: 'Sections',
    noDocuments: 'No documents yet',
    toggleSection: 'Collapse or expand section',
    dashboard: 'Gaps dashboard'
  },
  home: {
    title: 'Corporate knowledge base',
    subtitle: 'ISC regulations, guides and process descriptions in one place',
    text: 'Find a document in the sections below or ask a question in plain words — the AI assistant answers strictly from company documents and cites its sources.',
    aiBannerTitle: 'Ask the AI assistant',
    aiBannerText: 'For example: “What is the first response time for a critical incident?”',
    sectionsHeading: 'Sections',
    documentCount: (n: number) => `${n} ${n === 1 ? 'document' : 'documents'}`
  },
  section: {
    emptyTitle: 'No documents in this section yet',
    emptyText: 'Upload the first regulation or guide — it becomes searchable after indexing.',
    upload: 'Upload document'
  },
  doc: {
    status: {
      uploaded: 'Uploaded',
      processing: 'Processing',
      indexed: 'Indexed',
      error: 'Indexing error'
    },
    version: (n: number) => `Version ${n}`,
    owner: 'Owner',
    download: 'Download source',
    onThisPage: 'On this page',
    onlyInRussian: 'This document is only available in Russian.'
  },
  chat: {
    title: 'AI assistant',
    subtitle: 'Answers only from knowledge base documents',
    close: 'Close',
    newChat: 'New chat',
    emptyTitle: 'How can I help?',
    suggestions: [
      'What is the first response time for a critical incident?',
      'How do I set up a new workstation?',
      'How should Git branches be named?'
    ],
    placeholder: 'Ask about the knowledge base…',
    send: 'Send',
    hint: 'Enter — send · Shift+Enter — new line · Esc — close',
    stages: [
      'Analyzing the question',
      'Searching the knowledge base',
      'Ranking fragments',
      'Checking sources',
      'Writing the answer'
    ],
    foundFragments: (n: number) => `Found ${n} ${n === 1 ? 'fragment' : 'fragments'}`,
    notFound: 'No information found in the knowledge base.',
    notFoundHint: 'The question was saved — section owners will see it on the gaps dashboard.',
    answerIntro: (title: string) => `According to “${title}”:`,
    seeAlso: (title: string) => `Related information is also in “${title}”`,
    sources: 'Sources',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    thanks: 'Thanks for the feedback',
    commentPrompt: 'What went wrong? Section owners will see your comment.',
    commentPlaceholder: 'For example: no instructions for Linux',
    commentSend: 'Send',
    commentSkip: 'Skip'
  },
  languageTabs: {
    ru: 'Русский',
    en: 'English',
    required: 'required',
    optional: 'optional'
  },
  upload: {
    title: 'Upload document',
    subtitle: 'A new regulation or guide becomes searchable after indexing',
    dropTitle: 'Drop a file here',
    dropOr: 'or',
    browse: 'browse your computer',
    formats: 'DOCX, Markdown or TXT (UTF-8), up to 20 MB',
    replace: 'Replace',
    remove: 'Remove',
    fieldTitle: 'Title',
    fieldSection: 'Section',
    fieldOwner: 'Owner',
    fieldOwnerPlaceholder: 'Full name of the owner',
    englishHint:
      'The English version is optional. Without it, the English interface shows the Russian one.',
    cancel: 'Cancel',
    submit: 'Upload',
    errorFormat: 'Unsupported format. Use DOCX, Markdown or TXT.',
    errorSize: 'The file is larger than 20 MB. Reduce it or split it into parts.',
    errorDuplicate: (title: string) => `This file is already uploaded as “${title}”.`,
    errorRussianRequired: 'Add a file and a title on the “Русский” tab.',
    errorEnglishTitle: 'Enter a title for the English version.',
    errorOwner: 'Enter the owner.',
    errorNoSections: 'Create a section first: File → New section…',
    docxPending: (name: string) =>
      `Source file ${name} accepted. Its text will appear after server-side processing.`,
    toastUploaded: (title: string) => `“${title}” uploaded and queued for indexing`,
    toastIndexed: (title: string) => `“${title}” is indexed and searchable`
  },
  newSection: {
    title: 'New section',
    subtitle: 'The section appears in the knowledge base tree',
    fieldTitle: 'Section title',
    placeholderRu: 'Например: Бизнес-процессы',
    placeholderEn: 'For example: Business processes',
    englishHint: 'Without an English title, the English interface shows the Russian one.',
    cancel: 'Cancel',
    submit: 'Create',
    errorRequired: 'Enter the section title in Russian.',
    errorExists: 'A section with this title already exists.',
    toastCreated: (title: string) => `Section “${title}” created`
  },
  saveAs: {
    title: 'Save as',
    subtitle: 'Export the open document to another format',
    format: 'Format',
    formats: {
      docx: { name: 'Word (DOCX)', hint: 'For editing and printing' },
      pdf: { name: 'PDF', hint: 'For sharing and printing, not editable' },
      md: { name: 'Markdown', hint: 'Marked-up text for wikis and Git' },
      txt: { name: 'Plain text (TXT)', hint: 'No formatting' }
    },
    languageVersion: 'Document version',
    langRu: 'Russian',
    langEn: 'English',
    noEnglish: 'This document has no English version',
    cancel: 'Cancel',
    submit: 'Save…',
    toastSaved: (name: string) => `Saved: ${name}`,
    error: 'Could not save the file. Check that the folder is writable.',
    pdfUnavailable: 'PDF export is only available in the desktop app'
  },
  dashboard: {
    title: 'Gaps dashboard',
    subtitle:
      'Unanswered questions and answers rated “not helpful” — what to add or fix in the knowledge base',
    period7: '7 days',
    period30: '30 days',
    updated: (time: string) => `Updated at ${time}`,
    kpiQuestions: 'Questions',
    kpiNotFound: 'Unanswered',
    kpiNegative: 'Rated “not helpful”',
    kpiOpenGaps: 'Open gaps',
    kpiPerDay: (n: string) => `${n} per day on average`,
    kpiShareOfQuestions: (p: number) => `${p}% of all questions`,
    kpiShareOfRated: (p: number) => `${p}% of rated answers`,
    kpiResolved: (n: number) => `resolved: ${n}`,
    chartTitle: 'Daily dynamics',
    seriesAnswered: 'Answered',
    seriesNotFound: 'Unanswered',
    seriesNegative: 'Not helpful',
    viewChart: 'Chart',
    viewTable: 'Table',
    colDate: 'Date',
    colTotal: 'Total',
    bySection: 'By section',
    byOwner: 'By owner',
    colSection: 'Section',
    colOwner: 'Owner',
    colQuestions: 'Questions',
    colNotFound: 'Unanswered',
    colNegative: 'Not helpful',
    colOpenGaps: 'Open',
    undeterminedSection: 'Section unknown',
    unassignedOwner: 'Unassigned',
    gapsTitle: 'Problem queries',
    tabOpen: 'Open',
    tabResolved: 'Resolved',
    filterAll: 'All reasons',
    reasonNotFound: 'No answer',
    reasonNegative: 'Not helpful',
    timesAsked: (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`,
    lastAsked: (date: string) => `last asked ${date}`,
    openDocument: 'Open document',
    uploadDocument: 'Upload document',
    markResolved: 'Resolved',
    reopen: 'Reopen',
    emptyOpenTitle: 'No open gaps',
    emptyOpenText:
      'Every question in this period got an answer, and nobody rated one as not helpful.',
    emptyResolvedTitle: 'Nothing resolved yet',
    emptyResolvedText: 'Once you update a document, mark the gap with “Resolved”.',
    toastResolved: 'Gap marked as resolved',
    toastReopened: 'Gap reopened'
  },
  help: {
    title: 'Help',
    items: [
      {
        heading: 'Search',
        text: 'Press “/” to jump to the search box: it searches section and document titles. If nothing fits, you can ask the AI assistant right away.'
      },
      {
        heading: 'AI assistant',
        text: '⌘K / Ctrl+K opens the chat. It answers only from knowledge base documents and cites sources; if there is no answer, it says so.'
      },
      {
        heading: 'Sections and documents',
        text: 'File → New section… (⇧⌘N / Ctrl+Shift+N) and File → Upload document… (⌘U / Ctrl+U). Titles and files can be provided in Russian and English. DOCX, Markdown and TXT up to 20 MB are supported.'
      },
      {
        heading: 'Rating answers',
        text: 'Mark answers as helpful or not — unanswered and poorly rated questions go to the gaps dashboard for section owners.'
      }
    ]
  },
  about: {
    title: 'About',
    product: 'ISC Knowledge Base',
    description:
      'Intelligent search and answer generation over the corporate knowledge base with an anti-hallucination pipeline. All data is processed locally, inside company infrastructure.',
    version: 'Version',
    customer: 'Customer',
    customerValue: 'Information Service Center LLC',
    developer: 'Developer',
    developerValue: 'V. A. Bakin, PNRPU',
    close: 'Close'
  }
}

export const translations: Record<Language, Messages> = { ru, en }
