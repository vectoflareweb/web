import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries } from '@/features/i18n/locale'
import { LegalPage } from '@/components/marketing/legal-page'
import { SITE_NAME, BRAND_COMPANY_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/privacy')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/privacy',
      title: translate(d, 'content.seo.privacyTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.privacyDesc', { siteName: SITE_NAME, companyName: BRAND_COMPANY_NAME }),
    })
    return { meta, links }
  },
  component: Privacy,
})

function Privacy() {
  const { t, locale } = useTranslation()
  return (
    <LegalPage
      title={t('legal.privacyTitle')}
      sections={dictionaries[locale].legal.privacySections}
    />
  )
}
