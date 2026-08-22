/**
 * Locale configuration — BCP 47 locale list and routing conventions.
 *
 * This module replaces the hardcoded `locales` array in
 * `src/features/i18n/locale.ts`. All locale-aware code should import from
 * here instead of defining locale lists inline.
 *
 * The current project supports en + es; the template architecture supports
 * 22+ locales. Adding a new locale requires:
 *   1. Add the BCP 47 code to SUPPORTED_LOCALES below
 *   2. Create a dictionary file in src/features/i18n/dictionaries/{locale}.ts
 *   3. Add locale-specific content in src/content/locales/{locale}/
 *   4. No route changes needed — the routing engine is locale-agnostic
 *
 * BCP 47 conventions:
 *   - Use two-letter codes for macro-languages: en, es, de, fr, it, pt
 *   - Use four-letter codes for specific variants: zh-CN, zh-TW, pt-BR
 *   - Never use non-standard codes: zh, cn, chs, cht
 */

export const SUPPORTED_LOCALES = [
  'en',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'nl',
  'pl',
  'cs',
  'sv',
  'da',
  'fi',
  'no',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
  'vi',
  'th',
  'id',
  'tr',
  'ar',
] as const

export const ACTIVE_LOCALES: readonly Locale[] = ['en']

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export type ActiveLocale = typeof ACTIVE_LOCALES[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<string, { native: string; short: string }> = {
  en: { native: 'English', short: 'EN' },
  es: { native: 'Español', short: 'ES' },
  de: { native: 'Deutsch', short: 'DE' },
  fr: { native: 'Français', short: 'FR' },
  it: { native: 'Italiano', short: 'IT' },
  pt: { native: 'Português', short: 'PT' },
  nl: { native: 'Nederlands', short: 'NL' },
  pl: { native: 'Polski', short: 'PL' },
  cs: { native: 'Čeština', short: 'CS' },
  sv: { native: 'Svenska', short: 'SV' },
  da: { native: 'Dansk', short: 'DA' },
  fi: { native: 'Suomi', short: 'FI' },
  no: { native: 'Norsk', short: 'NO' },
  ja: { native: '日本語', short: 'JA' },
  ko: { native: '한국어', short: 'KO' },
  'zh-CN': { native: '简体中文', short: '中' },
  'zh-TW': { native: '繁體中文', short: '繁' },
  vi: { native: 'Tiếng Việt', short: 'VI' },
  th: { native: 'ไทย', short: 'TH' },
  id: { native: 'Bahasa Indonesia', short: 'ID' },
  tr: { native: 'Türkçe', short: 'TR' },
  ar: { native: 'العربية', short: 'AR' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function localizePath(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path
  if (locale === DEFAULT_LOCALE) return clean || '/'
  return `/${locale}${clean}` || `/${locale}`
}

export function stripDefaultLocalePrefix(href: string): string {
  const stripped = href.replace(/^\/en(?=[/?#]|$)/, '')
  if (stripped === '') return '/'
  if (stripped.startsWith('?') || stripped.startsWith('#')) return `/${stripped}`
  return stripped
}

export const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  es: 'es_ES',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
  pt: 'pt_PT',
  nl: 'nl_NL',
  pl: 'pl_PL',
  cs: 'cs_CZ',
  sv: 'sv_SE',
  da: 'da_DK',
  fi: 'fi_FI',
  no: 'no_NO',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  vi: 'vi_VN',
  th: 'th_TH',
  id: 'id_ID',
  tr: 'tr_TR',
  ar: 'ar_SA',
}

export const HREFLANG: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  sv: 'sv-SE',
  da: 'da-DK',
  fi: 'fi-FI',
  no: 'no-NO',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  tr: 'tr-TR',
  ar: 'ar-SA',
}

export function negotiateLocale(
  cookieLocale: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase()
      const base = tag.split('-')[0]
      if (isLocale(base)) return base
      if (isLocale(tag)) return tag
    }
  }
  return DEFAULT_LOCALE
}
