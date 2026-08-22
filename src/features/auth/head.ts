import { dictionaries, isLocale, defaultLocale, type Locale } from '@/features/i18n/locale'
import { SITE_NAME } from '@/config/site'

export function authPageHead(
  params: unknown,
  key: 'loginTitle' | 'registerTitle' | 'forgotTitle' | 'resetTitle' | 'verifyTitle',
) {
  const rawLocale = (params as { locale?: string })?.locale
  const locale: Locale = rawLocale && isLocale(rawLocale) ? rawLocale : defaultLocale
  return {
    meta: [
      { title: `${dictionaries[locale].auth[key]} — ${SITE_NAME}` },
      { name: 'robots', content: 'noindex' },
    ],
  }
}
