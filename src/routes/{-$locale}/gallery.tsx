import { createFileRoute } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { pick, galleryPage } from '@/product/content'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { GallerySection } from '@/components/marketing/gallery-section'
import { CtaBand } from '@/components/marketing/cta'
import { JsonLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { SITE_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/gallery')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/gallery',
      title: translate(d, 'content.seo.galleryTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.galleryDesc', { siteName: SITE_NAME }),
    })
    return { meta, links }
  },
  component: GalleryPage,
})

function GalleryPage() {
  const { locale, t } = useTranslation()
  const c = pick(galleryPage, locale)

  return (
    <MarketingShell>
      <PageHero kicker={c.kicker} title={c.title} sub={c.sub} />
      <GallerySection heading={null} />

      <section className="mx-auto max-w-3xl px-5 pb-20 text-center md:px-7">
        <p className="text-[15px] font-medium text-fg-2">{c.note}</p>
      </section>

      <CtaBand />
      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }, { name: c.title, path: '/gallery' }])} />
    </MarketingShell>
  )
}
