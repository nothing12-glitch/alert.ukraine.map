import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translate, type Language } from './i18n'
import { I18nContext, languageStorageKey, readLanguage, type I18nContextValue } from './i18n-context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      window.localStorage.setItem(languageStorageKey, next)
    } catch {
      // Приватний режим браузера може блокувати localStorage.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang,
    t: (key, params) => translate(lang, key, params),
  }), [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
