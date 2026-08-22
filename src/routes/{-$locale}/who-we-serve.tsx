import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { pick, servePage } from '@/product/content'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { WhoWeServe } from '@/components/marketing/who-we-serve'
import { CtaBand } from '@/components/marketing/cta'
import { JsonLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { SITE_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/who-we-serve')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/who-we-serve',
      title: translate(d, 'content.seo.whoWeServeTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.whoWeServeDesc', { siteName: SITE_NAME }),
    })
    return { meta, links }
  },
  component: ServePage,
})

function ServePage() {
  const { locale, t } = useTranslation()
  const c = pick(servePage, locale)

  return (
    <MarketingShell>
      <PageHero kicker={c.kicker} title={c.title} sub={c.sub} />
      <WhoWeServe />
      <CtaBand />
      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }, { name: c.title, path: '/who-we-serve' }])} />
    </MarketingShell>
  )
}
