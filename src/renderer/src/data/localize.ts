import type { ContentLanguage, LocalizedText } from '../types/knowledgeBase'

export function localize(text: LocalizedText, language: ContentLanguage): string {
  return (language === 'en' ? text.en : undefined) || text.ru
}

export function hasTranslation(text: LocalizedText, language: ContentLanguage): boolean {
  return language === 'ru' || Boolean(text.en)
}
