import * as React from 'react'
import { dictionaries, translate, type Locale } from './locale'

type TFn = (key: string, params?: Record<string, string | number>) => string

const I18nContext = React.createContext<{ locale: Locale; t: TFn } | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = React.useMemo(() => {
    const dict = dictionaries[locale]
    const t: TFn = (key, params) => translate(dict, key, params)
    return { locale, t }
  }, [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation 必须在 I18nProvider 内使用')
  return ctx
}
