import { useCallback } from 'react'
import { localizePath } from './locale'
import { useTranslation } from './provider'

export function useLocalizePath() {
  const { locale } = useTranslation()
  return useCallback((path: string) => localizePath(locale, path), [locale])
}
