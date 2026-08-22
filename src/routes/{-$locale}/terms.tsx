import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries } from '@/features/i18n/locale'
import { LegalPage } from '@/components/marketing/legal-page'
import { SITE_NAME, BRAND_COMPANY_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/terms')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/terms',
      title: translate(d, 'content.seo.termsTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.termsDesc', { siteName: SITE_NAME, companyName: BRAND_COMPANY_NAME }),
    })
    return { meta, links }
  },
  component: Terms,
})

function Terms() {
  const { t, locale } = useTranslation()
  return (
    <LegalPage
      title={t('legal.termsTitle')}
      sections={dictionaries[locale].legal.termsSections}
    />
  )
}
