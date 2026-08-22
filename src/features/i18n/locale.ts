import { en, type Dict } from './dictionaries/en'
import { es } from './dictionaries/es'
import { ACTIVE_LOCALES, DEFAULT_LOCALE as CONFIG_DEFAULT_LOCALE, isLocale as configIsLocale, localizePath as configLocalizePath, stripDefaultLocalePrefix as configStripDefaultLocalePrefix, negotiateLocale as configNegotiateLocale, type Locale as ConfigLocale } from '@/config/locales'

export const locales = ACTIVE_LOCALES
export type Locale = ConfigLocale
export const defaultLocale: Locale = CONFIG_DEFAULT_LOCALE

const allDictionaries: Record<string, Dict> = { en, es }

export function getDictionary(locale: Locale): Dict {
  return allDictionaries[locale] ?? allDictionaries[defaultLocale] ?? en
}

export const dictionaries: Record<string, Dict> = allDictionaries

export function isLocale(value: unknown): value is Locale {
  return configIsLocale(value)
}

export function isLocalePrefixedPath(path: string): boolean {
  const segment = path.split('/')[1]
  return segment !== undefined && isLocale(segment)
}

export function getLocaleFromPath(path: string): Locale {
  const segment = path.split('/')[1]
  if (segment && isLocale(segment)) return segment as Locale
  return defaultLocale
}

type Params = Record<string, string | number>

export function translate(dict: Dict, key: string, params?: Params): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return (acc as Record<string, unknown>)[part]
    return undefined
  }, dict)
  if (typeof value !== 'string') return key
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

export function stripDefaultLocalePrefix(href: string): string {
  return configStripDefaultLocalePrefix(href)
}

export function localizePath(locale: Locale, path: string): string {
  return configLocalizePath(locale, path)
}

export function negotiateLocale(
  cookieLocale: string | undefined,
  acceptLanguage: string | null,
): Locale {
  return configNegotiateLocale(cookieLocale, acceptLanguage)
}
