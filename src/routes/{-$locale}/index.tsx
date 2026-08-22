import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { pick, homeFaq } from '@/product/content'
import { JsonLd, faqLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { SITE_NAME } from '@/config'
import { MarketingShell } from '@/components/marketing/shell'
import { Hero } from '@/components/marketing/hero'

const CollaborationSelector = lazy(() => import('@/components/marketing/collaboration-selector').then((m) => ({ default: m.CollaborationSelector })))
const PlantCapability = lazy(() => import('@/components/marketing/plant-capability').then((m) => ({ default: m.PlantCapability })))
const QualitySteps = lazy(() => import('@/components/marketing/quality-steps').then((m) => ({ default: m.QualitySteps })))
const CommercialTerms = lazy(() => import('@/components/marketing/commercial-terms').then((m) => ({ default: m.CommercialTerms })))
const HowItWorks = lazy(() => import('@/components/marketing/how-it-works').then((m) => ({ default: m.HowItWorks })))
const WhoWeServe = lazy(() => import('@/components/marketing/who-we-serve').then((m) => ({ default: m.WhoWeServe })))
const ProjectsShowcase = lazy(() => import('@/components/marketing/projects-showcase').then((m) => ({ default: m.ProjectsShowcase })))
const FaqSection = lazy(() => import('@/components/marketing/faq').then((m) => ({ default: m.FaqSection })))
const CtaBand = lazy(() => import('@/components/marketing/cta').then((m) => ({ default: m.CtaBand })))

export const Route = createFileRoute('/{-$locale}/')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/',
      title: translate(d, 'content.seo.homeTitle'),
      description: translate(d, 'content.seo.homeDesc', { siteName: SITE_NAME }),
      ogTitle: translate(d, 'content.seo.homeOgTitle', { siteName: SITE_NAME }),
    })
    return { meta, links }
  },
  component: Home,
})

function Home() {
  const { locale, t } = useTranslation()

  return (
    <MarketingShell>
      <Hero />
      <Suspense fallback={null}><CollaborationSelector /></Suspense>
      <Suspense fallback={null}><WhoWeServe /></Suspense>
      <Suspense fallback={null}><CommercialTerms /></Suspense>
      <Suspense fallback={null}><PlantCapability /></Suspense>
      <Suspense fallback={null}><QualitySteps /></Suspense>
      <Suspense fallback={null}><HowItWorks /></Suspense>
      <Suspense fallback={null}><ProjectsShowcase /></Suspense>
      <Suspense fallback={null}><FaqSection data={homeFaq} /></Suspense>
      <Suspense fallback={null}><CtaBand /></Suspense>
      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }])} />
      <JsonLd data={faqLd(pick(homeFaq, locale).items, locale)} />
    </MarketingShell>
  )
}