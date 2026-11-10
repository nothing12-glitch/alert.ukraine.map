import { createContext, useContext } from 'react'
import type { Language, MessageKey } from './i18n'

export type I18nContextValue = {
  lang: Language
  setLang: (next: Language) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
export const languageStorageKey = 'alert-map-language'

export function readLanguage(): Language {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'en' || fromUrl === 'pl' || fromUrl === 'uk') return fromUrl
  } catch {
    // URL недоступний у нестандартному середовищі — далі пробуємо localStorage.
  }
  try {
    const stored = window.localStorage.getItem(languageStorageKey)
    return stored === 'en' || stored === 'pl' || stored === 'uk' ? stored : 'uk'
  } catch {
    return 'uk'
  }
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
