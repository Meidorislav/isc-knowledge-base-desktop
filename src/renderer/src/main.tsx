import '@fontsource-variable/golos-text'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import I18nProvider from './i18n/I18nProvider'

// Lets CSS leave room for the inset macOS traffic lights.
document.documentElement.dataset.platform = window.electron?.process.platform ?? 'web'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)
