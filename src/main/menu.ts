import { app, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'

export type Language = 'ru' | 'en'
export type MenuAction =
  'upload' | 'create-section' | 'save' | 'save-as' | 'dashboard' | 'help' | 'about'

export interface MenuState {
  language: Language
  documentOpen: boolean
}

const labels = {
  ru: {
    file: 'Файл',
    createSection: 'Создать раздел…',
    upload: 'Загрузить документ…',
    save: 'Сохранить',
    saveAs: 'Сохранить как…',
    quit: 'Выход',
    edit: 'Правка',
    undo: 'Отменить',
    redo: 'Повторить',
    cut: 'Вырезать',
    copy: 'Копировать',
    paste: 'Вставить',
    selectAll: 'Выделить всё',
    view: 'Вид',
    dashboard: 'Дашборд пробелов',
    reload: 'Перезагрузить',
    devTools: 'Инструменты разработчика',
    resetZoom: 'Фактический размер',
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',
    fullscreen: 'Полноэкранный режим',
    help: 'Справка',
    helpContents: 'Справка',
    about: 'О программе',
    hide: 'Скрыть',
    hideOthers: 'Скрыть остальные',
    window: 'Окно',
    minimize: 'Свернуть'
  },
  en: {
    file: 'File',
    createSection: 'New section…',
    upload: 'Upload document…',
    save: 'Save',
    saveAs: 'Save As…',
    quit: 'Quit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    dashboard: 'Gaps dashboard',
    reload: 'Reload',
    devTools: 'Developer Tools',
    resetZoom: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fullscreen: 'Toggle Full Screen',
    help: 'Help',
    helpContents: 'Help',
    about: 'About',
    hide: 'Hide',
    hideOthers: 'Hide Others',
    window: 'Window',
    minimize: 'Minimize'
  }
} satisfies Record<Language, Record<string, string>>

function send(action: MenuAction): void {
  BrowserWindow.getFocusedWindow()?.webContents.send('menu-action', action)
}

export function buildMenu({ language, documentOpen }: MenuState): void {
  const t = labels[language]
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: t.about, click: () => send('about') },
              { type: 'separator' },
              { role: 'hide', label: t.hide },
              { role: 'hideOthers', label: t.hideOthers },
              { type: 'separator' },
              { role: 'quit', label: t.quit }
            ]
          } satisfies MenuItemConstructorOptions
        ]
      : []),
    {
      label: t.file,
      submenu: [
        {
          label: t.createSection,
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => send('create-section')
        },
        { label: t.upload, accelerator: 'CmdOrCtrl+U', click: () => send('upload') },
        { type: 'separator' },
        {
          label: t.save,
          accelerator: 'CmdOrCtrl+S',
          enabled: documentOpen,
          click: () => send('save')
        },
        {
          label: t.saveAs,
          accelerator: 'CmdOrCtrl+Shift+S',
          enabled: documentOpen,
          click: () => send('save-as')
        },
        { type: 'separator' },
        { role: 'quit', label: t.quit }
      ]
    },
    {
      label: t.edit,
      submenu: [
        { role: 'undo', label: t.undo },
        { role: 'redo', label: t.redo },
        { type: 'separator' },
        { role: 'cut', label: t.cut },
        { role: 'copy', label: t.copy },
        { role: 'paste', label: t.paste },
        { role: 'selectAll', label: t.selectAll }
      ]
    },
    {
      label: t.view,
      submenu: [
        { label: t.dashboard, accelerator: 'CmdOrCtrl+Shift+D', click: () => send('dashboard') },
        { type: 'separator' },
        { role: 'reload', label: t.reload },
        { role: 'toggleDevTools', label: t.devTools },
        { type: 'separator' },
        { role: 'resetZoom', label: t.resetZoom },
        { role: 'zoomIn', label: t.zoomIn },
        { role: 'zoomOut', label: t.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t.fullscreen }
      ]
    },
    ...(isMac
      ? [
          {
            label: t.window,
            submenu: [{ role: 'minimize', label: t.minimize }]
          } satisfies MenuItemConstructorOptions
        ]
      : []),
    {
      label: t.help,
      role: 'help',
      submenu: [
        { label: t.helpContents, accelerator: 'F1', click: () => send('help') },
        { type: 'separator' },
        { label: t.about, click: () => send('about') }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
