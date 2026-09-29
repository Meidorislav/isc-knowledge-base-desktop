import { createContext, useContext } from 'react'
import { translations, type Language, type Messages } from './translations'

interface I18nValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Messages
}

export const I18nContext = createContext<I18nValue>({
  language: 'ru',
  setLanguage: () => {},
  t: translations.ru
})

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}
