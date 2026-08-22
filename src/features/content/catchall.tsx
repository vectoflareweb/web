/**
 * Shared content catch-all logic.
 *
 * A single root splat route (`src/routes/$.tsx`) serves the ported content
 * content site for both prefix-less and locale-prefixed URLs (`/factory`,
 * `/es/factory`). It strips a leading locale segment before resolving the
 * path against the content registry.
 *
 * The heavy resolution (content corpus + YAML parsing) is server-only in
 * catchall.server.ts; this module keeps only the createServerFn handler, the
 * loader data shape and the client views, so the client bundle stays free of
 * the 900 KB+ content corpus.
 */

import * as React from 'react'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {  I18nProvider, useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { type Locale } from '@/features/i18n/locale'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero, SectionHead } from '@/components/marketing/section-head'
import { CtaBand } from '@/components/marketing/cta'
import { JsonLd, breadcrumbLd, faqLd, itemListLd, newsArticleLd, serviceLd, qcHowToLd } from '@/features/seo/jsonld'
import { brandify } from './brand'
import { AferIndexProvider, type AferIndexData } from './index-data'
import { getGuide } from './guide-content'
import { FACTS, MOQ_SHORT, CERTIFICATION_NAMES } from '@/product/facts'
import { SITE_NAME } from '@/config/site'
import { BRAND_PARENT_BRAND, BRAND_COMPANY_NAME } from '@/config/branding'
import { CUSTOMIZATION_OPTIONS, OEM_APPLICATIONS } from '@/product/ai-content'
import { JSONLD_KEYWORDS } from '@/product/ai-content'
import { ArrowRight } from 'lucide-react'
import { ContentSections, CaseStudiesIndex, ResearchIndex, collectPageFaqs } from './render/sections'
import { Markdown } from './render/markdown'
import { faqSlug } from '@/features/ai/rag'
import type { ContentArticle, ContentCaseUse, ContentPage, ContentPost, ContentProduct } from './types'

const BREADCRUMB_PARENTS: Record<string, { name: string; path: string }> = {
  '/factory': { name: 'Factory', path: '/factory' },
  '/randdcenter': { name: 'R&D Center', path: '/randdcenter' },
  '/research': { name: 'Knowledge', path: '/knowledge' },
  '/solutions': { name: 'Solutions', path: '/solutions' },
  '/oem': { name: 'OEM Manufacturing', path: '/oem-manufacturing' },
  '/about': { name: 'About', path: '/about' },
}

function FaqDetails({ q, a, anchor, className, defaultOpen = false, summaryClassName = '' }: {
  q: string; a: React.ReactNode; anchor: string; className?: string; defaultOpen?: boolean; summaryClassName?: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <details id={anchor} className={className} open={open} onToggle={() => setOpen((v) => !v)}>
      <summary aria-expanded={open} className={summaryClassName}>
        <span>{q}</span>
        <span className="text-fg-3 transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-[14px] leading-relaxed text-fg-2">{a}</p>
    </details>
  )
}

function breadcrumbEntries(origin: string, path: string, title: string, t: (k: string) => string) {
  const entries = [{ name: t('content.nav.home'), path: '/' }]
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 1) {
    const parentPath = '/' + segments[0]
    const parent = BREADCRUMB_PARENTS[parentPath]
    if (parent) entries.push(parent)
  }
  entries.push({ name: title, path })
  return breadcrumbLd(origin, entries)
}

const SERVICE_SCHEMA_PAGES: Record<string, { serviceType: string; description: string }> = {
  '/oem-manufacturing': { serviceType: 'OEM Manufacturing', description: 'Full OEM manufacturing for SUP and marine inflatable products — buyer-owned designs, custom tooling, and production under your brand.' },
  '/odm-development': { serviceType: 'ODM Development', description: 'ODM product development — factory engineering team designs from your brief, you approve every element before production.' },
  '/oem-odm-private-label-comparison': { serviceType: 'OEM / ODM / Private Label Comparison', description: 'Side-by-side comparison of OEM manufacturing, ODM development, and private-label co-branding collaboration models.' },
  '/factory/oem-capability': { serviceType: 'Factory OEM Capability', description: 'Factory OEM capabilities: production lines, CNC precision, RF welding, quality gates, and capacity for custom board manufacturing.' },
  '/oem-moq-guide': { serviceType: 'OEM MOQ Guide', description: 'Minimum order quantities for OEM manufacturing: per-configuration thresholds, pilot batch options, and material-roll considerations.' },
  '/oem-trust-assurance': { serviceType: 'OEM Trust Assurance', description: 'Trust assurance for OEM buyers: third-party inspections, quality control gates, certifications, and factory audit transparency.' },
  '/sup-oem-moq-lead-time': { serviceType: 'SUP OEM MOQ & Lead Time', description: 'SUP-specific OEM minimum order quantities and lead times — per-configuration MOQ, tooling timelines, and sample turnaround.' },
  '/oem-onboarding-guide': { serviceType: 'OEM Onboarding', description: 'Step-by-step OEM onboarding: 7-gate process from initial inquiry through first production run and ongoing partnership.' },
  '/sup-construction-comparison': { serviceType: 'SUP Construction Comparison', description: 'Technical comparison of single-layer, double-layer and drop-stitch SUP construction types — rigidity, weight, durability and use-case guidance.' },
  '/sup-compliance-by-market': { serviceType: 'SUP Compliance by Market', description: 'Market-by-market certification and compliance guide: CE, CPSIA, AS/NZS, ISO 9001, BSCI, REACH, RoHS requirements for inflatable SUP boards.' },
  '/factory-audit-checklist': { serviceType: 'Factory Audit Checklist', description: 'Eight-area factory audit checklist for SUP buyers: quality system, capacity, traceability, pressure testing, welding controls, social compliance, documentation, and post-delivery support.' },
  '/product-development': { serviceType: 'Product Development', description: 'Custom SUP product development service — from concept and design through prototyping, testing, and first production run.' },
  '/oem-paddle': { serviceType: 'OEM Paddle Manufacturing', description: 'OEM paddle manufacturing: adjustable and fixed-length SUP paddles in carbon fiber, fiberglass, and aluminum for brand partners.' },
  '/b2b-solutions-matrix': { serviceType: 'B2B Solutions Matrix', description: 'Structured overview of OEM, ODM, private-label, distributor, and resort-operator partnership models for SUP brands.' },
  '/solutions/rental-operators': { serviceType: 'Rental Operator Solutions', description: 'SUP equipment programs for rental operators: bulk fleet pricing, custom branding, and durable construction for high-use environments.' },
  '/solutions/retail-partners': { serviceType: 'Retail Partner Solutions', description: 'Retail partnership program for SUP dealers: wholesale pricing, display packages, and territory protection.' },
  '/solutions/distributors': { serviceType: 'Distributor Solutions', description: 'Global SUP distribution network: exclusive territories, complete product portfolio, and dedicated account management.' },
  '/oem/sup-oem-north-america': { serviceType: 'SUP OEM North America', description: 'OEM SUP manufacturing for North American brands: CPSIA compliance, USMCA logistics, and region-specific MOQ tiers.' },
  '/oem/sup-oem-europe': { serviceType: 'SUP OEM Europe', description: 'OEM SUP manufacturing for European brands: CE certification, REACH compliance, and EU-specific logistics.' },
  '/oem/sup-oem-australia': { serviceType: 'SUP OEM Australia', description: 'OEM SUP manufacturing for Australian brands: AS/NZS compliance, local standards, and Oceania logistics.' },
  '/oem/sup-oem-canada': { serviceType: 'SUP OEM Canada', description: 'OEM SUP manufacturing for Canadian brands: CPSIA/CCPSA compliance, NAFTA logistics, and cold-climate testing.' },
}

/** Minimal product card for the "related platforms" strip on product pages. */
export type RelatedProduct = { slug: string; title: string; image: string; amount?: string }

/** Minimal post card for the "related news" strip on article pages. */
export type RelatedPost = { slug: string; title: string; excerpt: string; date: string }

export type CatchAllData = {
  path: string
  origin: string
  /** Locale the page is served as (from the URL prefix, defaults to en). */
  locale: Locale
  /** True when a real Spanish variant is rendered (vs an English duplicate). */
  translated: boolean
  /** True when a real Spanish variant exists for this path. */
  esTranslated: boolean
  /** Server-resolved widget index payloads for the page's sections. */
  index: AferIndexData
} & (
  | { kind: 'page'; page: ContentPage; slug: string; title: string; description: string }
  | { kind: 'product'; product: ContentProduct; title: string; description: string; image: string; related: RelatedProduct[] }
  | { kind: 'post'; post: ContentPost; title: string; description: string; image: string; relatedPosts: RelatedPost[] }
  | { kind: 'article'; article: ContentArticle; slug: string; title: string; description: string }
  | { kind: 'case'; case: ContentCaseUse; slug: string; title: string; description: string }
  | { kind: 'guide'; slug: string; title: string; description: string }
  | { kind: 'cases-index'; title: string; description: string }
  | { kind: 'research-index'; title: string; description: string }
  | { kind: 'faq'; faqs: { q: string; a: string }[]; title: string; description: string }
)

export const contentServerLoader = createServerFn({ method: 'GET' })
  .validator((input: { path: string; locale: string }) => input)
  .handler(async ({ data }) => {
    const { resolveCatchAll } = await import('./catchall.server')
    const { env } = await import('@/lib/env')
    const origin = new URL(env.BETTER_AUTH_URL).origin
    const resolved = resolveCatchAll(data.path, data.locale as Locale)
    if (!resolved) throw notFound()
    const d = { ...resolved, origin } as CatchAllData
    if (d.kind === 'product' || d.kind === 'post') {
      d.image = d.image.startsWith('http') ? d.image : `${origin}${d.image}`
    }
    return d
  })

/**
 * Product-detail resolver for the /products/$series route: when the segment is
 * a content product slug (not a series), resolve it here — the same layering
 * as the root catch-all, so the 900 KB+ corpus stays server-only.
 */
export const contentProductLoader = createServerFn({ method: 'GET' })
  .validator((input: { slug: string; locale: string }) => input)
  .handler(async ({ data }) => {
    const { resolveCatchAll } = await import('./catchall.server')
    const { env } = await import('@/lib/env')
    const origin = new URL(env.BETTER_AUTH_URL).origin
    const resolved = resolveCatchAll(`/products/${data.slug}`, data.locale as Locale)
    if (!resolved || resolved.kind !== 'product') throw notFound()
    resolved.origin = origin
    resolved.image = resolved.image.startsWith('http') ? resolved.image : `${origin}${resolved.image}`
    return resolved
  })

/* ─────────────────────────── JSON-LD helpers ─────────────────────────── */

function articleLd(url: string, title: string, description: string, locale: Locale, dateModified?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    dateModified,
    ...(locale !== 'en' ? { inLanguage: locale } : {}),
    publisher: { '@type': 'Organization', name: BRAND_PARENT_BRAND },
  }
}

/** TechArticle JSON-LD for the /research/* long-form articles (P2-1). */
function researchArticleLd(origin: string, path: string, title: string, description: string, page: ContentPage): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: `${origin}${path}`,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    datePublished: page.meta?.datePublished,
    dateModified: page.meta?.dateModified,
  }
}

/** TechArticle JSON-LD for factory standard pages (QMS procedures). */
function vatradTechArticleLd(
  origin: string,
  path: string,
  title: string,
  description: string,
  page: ContentPage,
  locale: Locale,
  about: string[],
  alternativeHeadline?: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    alternativeHeadline,
    description,
    url: `${origin}${path}`,
    author: { '@type': 'Organization', name: BRAND_COMPANY_NAME.toUpperCase() },
    publisher: { '@type': 'Organization', name: BRAND_COMPANY_NAME.toUpperCase() },
    dateModified: page.meta?.dateModified,
    inLanguage: locale,
    about,
  }
}

function productLd(origin: string, product: ContentProduct, locale: Locale, t: (key: string, params?: Record<string, string | number>) => string): Record<string, unknown> {
  const abs = (u?: string) => (u ? (u.startsWith('http') ? u : `${origin}${u}`) : undefined)
  const isDefault = locale === 'en'
  const b2bProps = [
    {
      '@type': 'PropertyValue',
      name: t('content.jsonld.moq'),
      value: `${MOQ_SHORT.trialStandard} pilot · ${MOQ_SHORT.standardRun} standard volume · ${MOQ_SHORT.customMould} custom mould`,
    },
    { '@type': 'PropertyValue', name: t('content.jsonld.sampleLeadTime'), value: FACTS.sampleTime },
    {
      '@type': 'PropertyValue',
      name: t('content.jsonld.productionLeadTime'),
      value: `${FACTS.leadTime} after confirmed PO and deposit`,
    },
    { '@type': 'PropertyValue', name: t('content.jsonld.certifications'), value: CERTIFICATION_NAMES.join(', ') },
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    sku: product.sku,
    description: brandify(product.description ?? product.summary ?? ''),
    image: abs(product.image) ? [abs(product.image)!] : undefined,
    brand: { '@type': 'Brand', name: BRAND_PARENT_BRAND },
    manufacturer: {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: BRAND_COMPANY_NAME,
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: t('content.jsonld.audience'),
    },
    ...(!isDefault ? { inLanguage: locale } : {}),
    additionalProperty: [
      ...b2bProps,
      ...(product.specs ?? []).map((s) => ({
        '@type': 'PropertyValue',
        name: s.label,
        value: s.value,
      })),
      { '@type': 'PropertyValue', name: 'MOQ pilot', value: String(MOQ_SHORT.trialStandard) },
      { '@type': 'PropertyValue', name: 'MOQ standard', value: String(MOQ_SHORT.standardRun) },
      { '@type': 'PropertyValue', name: 'Pricing', value: 'Quote-based per project specification' },
    ],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: 'Quote-based',
        priceCurrency: 'USD',
        description: 'B2B OEM/ODM custom manufacturing — pricing determined per project specification, volume, and customization scope.',
      },
    },
  }
}

/* ─────────────────────────── shell + views ─────────────────────────── */

export function ContentCatchAll({ data }: { data: CatchAllData }) {
  return (
    <I18nProvider locale={data.locale}>
      <AferIndexProvider value={data.index}>
        <MarketingShell>
          <CatchAllContent data={data} />
        </MarketingShell>
      </AferIndexProvider>
    </I18nProvider>
  )
}

function CatchAllContent({ data }: { data: CatchAllData }) {
  const { t } = useTranslation()
  return renderContent(data, t)
}

function renderContent(data: CatchAllData, t: (key: string, params?: Record<string, string | number>) => string): React.ReactNode {
  switch (data.kind) {
    case 'page': {
      const page = data.page
      const faqs = collectPageFaqs(page)
      return (
        <>
          <ContentSections page={page} />
          {!page.sections.some((s) => s.type === 'cta') && <CtaBand />}
          <JsonLd
            data={breadcrumbEntries(data.origin, data.path, data.title, t)}
          />
          {data.path.startsWith('/research/') && (
            <JsonLd data={researchArticleLd(data.origin, data.path, data.title, data.description, page)} />
          )}
          {JSONLD_KEYWORDS[data.path] && (
            <JsonLd
              data={vatradTechArticleLd(data.origin, data.path, data.title, data.description, page, data.locale, JSONLD_KEYWORDS[data.path].keywords, JSONLD_KEYWORDS[data.path].articleTitle)}
            />
          )}
          {page.meta?.dateModified && (
            <JsonLd
              data={{
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                url: `${data.origin}${data.path}`,
                dateModified: page.meta.dateModified,
              }}
            />
          )}
          {faqs.length > 0 && <JsonLd data={faqLd(faqs, data.locale)} />}
          {SERVICE_SCHEMA_PAGES[data.path] && (
            <JsonLd data={serviceLd({ ...SERVICE_SCHEMA_PAGES[data.path], path: data.path })} />
          )}
          {data.path === '/quality' && <JsonLd data={qcHowToLd()} />}
        </>
      )
    }
    case 'product':
      return (
        <>
          <ProductView product={data.product} related={data.related} origin={data.origin} locale={data.locale} />
          <CtaBand productSlug={data.product.slug} />
        </>
      )
    case 'post':
      return (
        <>
          <PostView post={data.post} relatedPosts={data.relatedPosts} origin={data.origin} path={data.path} locale={data.locale} />
          <CtaBand />
        </>
      )
    case 'article':
      return <ArticleView article={data.article} origin={data.origin} title={data.title} path={data.path} locale={data.locale} />
    case 'case':
      return <CaseView c={data.case} origin={data.origin} title={data.title} path={data.path} locale={data.locale} />
    case 'guide':
      return <GuideView slug={data.slug} origin={data.origin} path={data.path} locale={data.locale} />
    case 'faq':
      return <FaqView faqs={data.faqs} origin={data.origin} path={data.path} translated={data.translated} locale={data.locale} />
    case 'cases-index':
      return (
        <>
          <PageHero
            kicker={t('content.cases.kicker')}
            title={t('content.cases.title', { brand: BRAND_PARENT_BRAND })}
            sub={t('content.cases.sub')}
          />
          <CaseStudiesIndex />
          <JsonLd
            data={breadcrumbEntries(data.origin, data.path, t('content.cases.title', { brand: BRAND_PARENT_BRAND }), t)}
          />
          {data.index.cases && data.index.cases.length > 0 && (
            <JsonLd
              data={itemListLd(data.index.cases.map((c) => ({ name: c.title, path: `/evidence/case-studies/${c.slug}` })))}
            />
          )}
        </>
      )
    case 'research-index':
      return (
        <>
          <PageHero
            kicker={t('content.research.kicker')}
            title={t('content.research.title')}
            sub={t('content.research.sub')}
          />
          <ResearchIndex />
          <JsonLd
            data={breadcrumbEntries(data.origin, data.path, t('content.research.title'), t)}
          />
          {data.index.topics && data.index.topics.length > 0 && (
            <JsonLd
              data={itemListLd(data.index.topics.map((t) => ({ name: t.slug.replace(/-/g, ' '), path: `/research/${t.slug}` })))}
            />
          )}
        </>
      )
  }
}

export function ProductView({ product, related, origin, locale }: { product: ContentProduct; related: RelatedProduct[]; origin: string; locale: Locale }) {
  const { t } = useTranslation()
  const specs = product.specs ?? []
  const gallery = product.gallery?.length ? product.gallery : product.image ? [{ url: product.image, alt: product.title }] : []
  const fl = useLocalizePath()
  return (
    <>
      <PageHero kicker={product.category ?? t('content.kickers.product')} title={product.title} sub={brandify(product.summary ?? '')} />
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-7 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="grid gap-3">
            {gallery.map((img, i) => (
              <img key={img.url} src={img.url} alt={img.alt ?? product.title} width={1200} height={630} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} decoding={i === 0 ? 'auto' : 'async'} className="w-full rounded-2xl border border-border-2 object-cover" />
            ))}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="pill border-primary/25! bg-soft! text-primary!">{product.sku}</span>
            </div>
            {product.description && <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{brandify(product.description)}</p>}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <span key={t} className="pill">{t}</span>
                ))}
              </div>
            )}
            {specs.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left text-[13.5px]">
                  <tbody className="divide-y divide-border">
                    {specs.map((s) => (
                      <tr key={s.label} className="odd:bg-bg-alt/60">
                        <th scope="row" className="w-2/5 px-4 py-3 font-semibold">{brandify(s.label)}</th>
                        <td className="px-4 py-3 text-fg-2">{brandify(s.value)}</td>
                      </tr>
                    ))}
                    <tr className="odd:bg-bg-alt/60">
                      <th scope="row" className="w-2/5 px-4 py-3 font-semibold">{t('content.product.factoryTestPressure')}</th>
                      <td className="px-4 py-3 text-fg-2">{FACTS.pressureTest} · {FACTS.pressureReject}</td>
                    </tr>
                    <tr className="odd:bg-bg-alt/60">
                      <th scope="row" className="w-2/5 px-4 py-3 font-semibold">{t('content.product.minimumOrder')}</th>
                       <td className="px-4 py-3 text-fg-2">{t('content.product.moqVolume', { standardRun: MOQ_SHORT.standardRun, trialStandard: MOQ_SHORT.trialStandard })}</td>
                    </tr>
                    <tr className="odd:bg-bg-alt/60">
                      <th scope="row" className="w-2/5 px-4 py-3 font-semibold">{t('content.product.productionLeadTime')}</th>
                      <td className="px-4 py-3 text-fg-2">{t('content.product.leadTimeFacts', { leadTime: FACTS.leadTime, sampleTime: FACTS.sampleTime })}</td>
                    </tr>
                    <tr className="odd:bg-bg-alt/60">
                      <th scope="row" className="w-2/5 px-4 py-3 font-semibold">{t('content.product.certifications')}</th>
                       <td className="px-4 py-3 text-fg-2">{CERTIFICATION_NAMES.join(' · ')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <JsonLd
              data={breadcrumbLd(origin, [
                { name: t('content.nav.home'), path: '/' },
                { name: t('content.nav.products'), path: '/products' },
                { name: product.title, path: `/products/${product.slug}` },
              ])}
            />
            <JsonLd data={productLd(origin, product, locale, t)} />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="marine-card p-4">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">
                  {t('content.product.minimumOrderShort')}
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
                  {t('content.product.moqShort', { standardRun: MOQ_SHORT.standardRun, trialStandard: MOQ_SHORT.trialStandard, customMould: MOQ_SHORT.customMould })}
                </p>
              </div>
              <div className="marine-card p-4">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">
                  {t('content.product.timeline')}
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
                  {t('content.product.timelineShort', { sampleTime: FACTS.sampleTime, leadTime: FACTS.leadTime })}
                </p>
              </div>
              <div className="marine-card p-4">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">
                  {t('content.product.qualityControl')}
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
                  {t('content.product.qualityShort', { assemblyChecklist: FACTS.assemblyChecklist, pressureTest: FACTS.pressureTest })}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border-2 bg-bg-alt/60 px-5 py-4">
              <p className="flex-1 text-[13.5px] leading-snug text-fg-2">
                {t('content.product.readyToManufacture')}
              </p>
              <a
                href={fl(`/contact?product=${encodeURIComponent(product.slug)}`)}
                className="sun-grad inline-flex h-[40px] items-center gap-1.5 rounded-full px-6 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5"
              >
                {t('content.product.startProject')} <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-3xl">
          <Markdown text={brandify(product.body)} />
        </div>

        {/* customization options — every platform is customizable under your brand */}
        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {t('content.product.customizationOptions')}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">
            {t('content.product.customizationIntro')}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {customizationOptions(locale).map((o) => (
              <div key={o.title} className="marine-card p-5">
                <p className="text-[14px] font-bold">{o.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-fg-2">{o.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OEM applications — who manufactures this platform with us */}
        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {t('content.product.oemApplications')}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">
            {t('content.product.oemIntro', { siteName: SITE_NAME })}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {oemApplications(locale).map((a) => (
              <div key={a.title} className="marine-card p-5">
                <p className="text-[14px] font-bold">{a.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-fg-2">{a.body}</p>
              </div>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {t('content.product.relatedPlatforms')}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={fl(`/products/${r.slug}`)}
                  className="marine-card group flex flex-col overflow-hidden p-0"
                >
                  {r.image && (
                    <img src={r.image} alt={r.title} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="text-[13.5px] font-bold leading-snug">{r.title}</p>
                    {r.amount && <p className="text-[12.5px] font-semibold text-primary">${r.amount}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        {productFaqs(product, locale).length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {t('content.product.faq')}
            </h2>
            <div className="mt-6 flex flex-col gap-3">
              {productFaqs(product, locale).map((f) => {
                const anchor = faqSlug(f.q)
                return (
                  <FaqDetails key={f.q} q={f.q} a={f.a} anchor={anchor} className="marine-card group px-5 py-4 scroll-mt-24" summaryClassName="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold marker:hidden" />
                )
              })}
            </div>
            <JsonLd data={faqLd(productFaqs(product, locale), locale)} />
          </div>
        )}

        {/* related services — product pages must link into the OEM/ODM funnel */}
        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {t('content.product.produceUnderBrand')}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a href={fl('/oem-manufacturing')} className="marine-card p-5">
              <p className="text-[14px] font-bold">{t('content.product.oemOdmTitle')}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-fg-3">
                {t('content.product.oemOdmDesc')}
              </p>
            </a>
            <a href={fl('/product-development')} className="marine-card p-5">
              <p className="text-[14px] font-bold">{t('content.product.supDevTitle')}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-fg-3">
                {t('content.product.supDevDesc')}
              </p>
            </a>
            <a href={fl('/solutions/private-label-sup')} className="marine-card p-5">
              <p className="text-[14px] font-bold">{t('content.product.privateLabelTitle')}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-fg-3">
                {t('content.product.privateLabelDesc')}
              </p>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

/** Product FAQ pool: product-specific entries + shared fallbacks (≥5 total). */
function productFaqs(product: ContentProduct, locale: Locale): { q: string; a: string }[] {
  const specific = product.faqs ?? []
  const pool: { q: string; a: string }[] = locale !== 'en'
    ? [
        {
          q: '¿Cuál es el pedido mínimo para personalizar esta tabla?',
          a: `El MOQ de volumen es de ${MOQ_SHORT.standardRun} por rollo de 150 m para la producción estándar, con pilotos desde ${MOQ_SHORT.trialStandard} y ${MOQ_SHORT.customMould} para un molde a medida.`,
        },
        {
          q: '¿Cuánto tardan las muestras y la producción?',
          a: `Las muestras tardan ${FACTS.sampleTime}; la producción en serie se completa en ${FACTS.leadTime} tras confirmar el pedido y el depósito.`,
        },
        {
          q: '¿Puedo cambiar los colores, el arte y el logo?',
          a: 'Sí — gráficos, colores, EVA, logotipo, embalaje y accesorios se personalizan en cada plataforma. Comparte tu logo y te haremos una prueba visual antes de la producción.',
        },
        {
          q: '¿Cómo se controla la calidad antes del envío?',
          a: `Cada tabla pasa por una lista de verificación de ${FACTS.assemblyChecklist} y una prueba de presión de ${FACTS.pressureTest} antes de empaquetar; las piezas que superen una caída de presión mayor al 5% se rechazan automáticamente.`,
        },
      ]
    : [
        {
          q: 'What is the minimum order to customize this board?',
          a: `MOQ is ${MOQ_SHORT.standardRun} per 150 m roll for standard volume production, with pilot runs from ${MOQ_SHORT.trialStandard} and ${MOQ_SHORT.customMould} for a custom mould.`,
        },
        {
          q: 'How long do samples and production take?',
          a: `Samples are ready in ${FACTS.sampleTime}; batch production completes in ${FACTS.leadTime} after confirmed PO and deposit.`,
        },
        {
          q: 'Can I change colors, artwork and the logo?',
          a: 'Yes — graphics, colors, EVA traction, logo, packaging and accessories are all customizable on every platform. Share your logo and we produce a visual proof before production.',
        },
        {
          q: 'How is quality controlled before shipment?',
          a: `Every board passes a ${FACTS.assemblyChecklist} assembly checklist and a ${FACTS.pressureTest} pressure test before packing; units exceeding a 5% pressure drop are auto-rejected.`,
        },
      ]
  return [...specific, ...pool]
}

/** Customization points available on every OEM platform (product detail pages). */
function customizationOptions(locale: Locale): { title: string; body: string }[] {
  return CUSTOMIZATION_OPTIONS[locale] ?? CUSTOMIZATION_OPTIONS.en
}

/** Who manufactures this platform with us (product detail pages). */
function oemApplications(locale: Locale): { title: string; body: string }[] {
  return OEM_APPLICATIONS[locale] ?? OEM_APPLICATIONS.en
}

function PostView({ post, relatedPosts, origin, path, locale }: { post: ContentPost; relatedPosts: RelatedPost[]; origin: string; path: string; locale: Locale }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHero kicker={post.category ?? t('content.kickers.news')} title={post.title} sub={post.excerpt ?? ''} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-7">
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] font-semibold text-fg-3">
          <span>{post.date.slice(0, 10)}</span>
          {post.author && <span>· {post.author}</span>}
          {post.tags && post.tags.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="pill">{t}</span>
              ))}
            </span>
          )}
        </div>
        {post.image && <img src={post.image} alt={post.title} width={1200} height={630} loading="lazy" decoding="async" className="mt-6 w-full rounded-2xl border border-border-2 object-cover" />}
        <Markdown text={brandify(post.body)} className="mt-4" />
        <JsonLd
          data={breadcrumbLd(origin, [
            { name: t('content.nav.home'), path: '/' },
            { name: t('content.nav.news'), path: '/news' },
            { name: post.title, path },
          ])}
        />
        <JsonLd
          data={newsArticleLd({
            origin,
            title: post.title,
            description: post.excerpt ?? '',
            image: post.image,
            url: `${origin}${path}`,
            datePublished: post.date,
            author: post.author,
            inLanguage: locale,
          })}
        />
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              {t('content.post.relatedReading')}
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {relatedPosts.map((r) => (
                <a
                  key={r.slug}
                  href={`${locale !== 'en' ? `/${locale}` : ''}/news/${r.slug}`}
                  className="marine-card p-5"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-fg-3">{r.date}</p>
                  <p className="mt-1 text-[15px] font-bold leading-snug">{r.title}</p>
                  {r.excerpt && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-fg-2">{r.excerpt}</p>}
                </a>
              ))}
            </div>
          </div>
        )}
        <ContentCta />
      </article>
    </>
  )
}

function ArticleView({ article, origin, title, path, locale }: { article: ContentArticle; origin: string; title: string; path: string; locale: Locale }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHero kicker={t('content.kickers.technology')} title={title} sub={brandify(article.summary ?? '')} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-7">
        {article.description && <p className="text-[15px] leading-relaxed text-fg-2">{brandify(article.description)}</p>}
        {article.dateModified && (
          <p className="mt-4 text-[12.5px] font-medium tracking-wide text-fg-3">{t('content.verifiedOn')} {article.dateModified}</p>
        )}
        <Markdown text={brandify(article.body)} className="mt-4" />
        <JsonLd
          data={breadcrumbLd(origin, [
            { name: t('content.nav.home'), path: '/' },
            { name: t('content.nav.technology'), path: '/technology' },
            { name: title, path },
          ])}
        />
        <JsonLd data={articleLd(`${origin}/technology/${article.slug}`, title, article.description ?? article.summary ?? '', locale, article.dateModified)} />
        <ContentCta />
      </article>
    </>
  )
}

function CaseView({ c, origin, title, path, locale }: { c: ContentCaseUse; origin: string; title: string; path: string; locale: Locale }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHero kicker={c.category ?? t('content.kickers.caseStudy')} title={title} sub={brandify(c.summary ?? '')} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-7">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-fg-3">
          {c.environment && <span className="pill">{c.environment}</span>}
          {c.skill && <span className="pill">{c.skill}</span>}
          {c.products && c.products.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {c.products.map((p) => (
                <span key={p} className="pill">{p}</span>
              ))}
            </span>
          )}
        </div>
        {c.description && <p className="mt-5 text-[15px] leading-relaxed text-fg-2">{brandify(c.description)}</p>}
        <Markdown text={brandify(c.body)} className="mt-4" />
        <JsonLd
          data={breadcrumbLd(origin, [
            { name: t('content.nav.home'), path: '/' },
            { name: t('content.nav.caseStudies'), path: '/evidence/case-studies' },
            { name: title, path },
          ])}
        />
        <JsonLd data={articleLd(`${origin}${path}`, title, c.summary ?? '', locale)} />
        <ContentCta />
      </article>
    </>
  )
}

function GuideView({ slug, origin, path, locale }: { slug: string; origin: string; path: string; locale: Locale }) {
  const { t } = useTranslation()
  const guide = getGuide(`/guides/${slug}`, locale)
  if (!guide) return null
  const fl = useLocalizePath()
  return (
    <>
      <PageHero kicker={t('content.kickers.guide')} title={guide.title} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-7">
        {guide.intro.map((p, i) => (
          <p key={i} className="mt-4 text-[15px] leading-relaxed text-fg-2">{brandify(p)}</p>
        ))}
        {guide.sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="mt-10 flex items-center gap-3 font-display text-xl font-extrabold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 font-display text-[14px] font-extrabold text-primary">{i + 1}</span>
              {s.title}
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">{brandify(s.body)}</p>
          </section>
        ))}
        {guide.faqs.length > 0 && (
          <section className="mt-12">
            <SectionHead kicker={t('content.fallbackFaq')} title={t('content.guide.quickAnswers')} />
            <div className="mt-6 space-y-3">
              {guide.faqs.map((f) => {
                const anchor = faqSlug(f.q)
                return (
                  <FaqDetails key={f.q} q={f.q} a={brandify(f.a)} anchor={anchor} className="marine-card group px-5 py-4 scroll-mt-24" summaryClassName="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-semibold marker:hidden" />
                )
              })}
            </div>
          </section>
        )}
        {guide.related && guide.related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              {t('content.guide.nextSteps')}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {guide.related.map((r) => (
                <a
                  key={r.href}
                  href={fl(r.href)}
                  className="marine-card flex items-center justify-between gap-3 p-5"
                >
                  <span className="text-[14px] font-semibold leading-snug">{brandify(r.label)}</span>
                  <ArrowRight size={15} className="shrink-0 text-primary" />
                </a>
              ))}
            </div>
          </section>
        )}
        <JsonLd
          data={breadcrumbLd(origin, [
            { name: t('content.nav.home'), path: '/' },
            { name: t('content.nav.guides'), path: '/knowledge' },
            { name: guide.title, path },
          ])}
        />
        <JsonLd data={articleLd(`${origin}/guides/${guide.slug}`, guide.title, guide.intro[0] ?? '', locale)} />
        {guide.faqs.length > 0 && <JsonLd data={faqLd(guide.faqs, locale)} />}
        <ContentCta />
      </article>
    </>
  )
}

/** Content → inquiry conversion block appended to news, tech articles, case studies and guides. */
function ContentCta() {
  const { t } = useTranslation()
  const fl = useLocalizePath()
  return (
    <div className="mt-12 rounded-2xl border border-border-2 bg-bg-alt p-7 text-center">
      <p className="font-display text-xl font-extrabold">
        {t('content.contentCta.title')}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-fg-2">
        {t('content.contentCta.body')}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href={fl('/contact')}
          className="sun-grad inline-flex h-[40px] items-center gap-1.5 rounded-full px-6 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5"
        >
          {t('content.contentCta.startProject')} <ArrowRight size={15} />
        </a>
        <a
          href={fl('/products')}
          className="inline-flex h-[40px] items-center rounded-full border border-border-2 px-6 text-[13.5px] font-bold transition-colors hover:border-primary/40 hover:text-primary"
        >
          {t('content.contentCta.browsePlatforms')}
        </a>
      </div>
    </div>
  )
}

function FaqView({ faqs, origin, path, locale }: { faqs: { q: string; a: string }[]; origin: string; path: string; translated: boolean; locale: Locale }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHero
        kicker={t('content.fallbackFaq')}
        title={t('content.faq.title')}
        sub={t('content.faq.sub')}
      />
      <section className="mx-auto max-w-3xl px-5 py-14 md:px-7">
        <div className="flex flex-col gap-3">
          {faqs.map((f, i) => {
            const anchor = faqSlug(f.q)
            return (
              <FaqDetails key={f.q} q={f.q} a={f.a} anchor={anchor} className="marine-card group px-5 py-4 scroll-mt-24" defaultOpen={i === 0} summaryClassName="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold marker:hidden" />
            )
          })}
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 pb-4">
        <ContentCta />
      </div>
      <JsonLd data={breadcrumbLd(origin, [{ name: t('content.nav.home'), path: '/' }, { name: 'FAQ', path }])} />
      <JsonLd data={faqLd(faqs, locale)} />
    </>
  )
}
