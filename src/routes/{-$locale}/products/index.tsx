import { createFileRoute } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getTurnstileSiteKey } from '@/features/auth/middleware'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate, localizePath } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SECONDARY_PILL } from '@/components/marketing/cta-styles'
import { pick, products, productsPage } from '@/product/content'
import { seriesPages } from '@/product/series-pages'
import { JsonLd, itemListLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { ProductsSection } from '@/components/marketing/products-section'
import { CatalogDownload } from '@/components/marketing/catalog-download'
import { CtaBand } from '@/components/marketing/cta'
import { SITE_NAME } from '@/config'

export const Route = createFileRoute('/{-$locale}/products/')({
  validateSearch: (s: Record<string, unknown>): { platform?: string } => ({
    platform: typeof s.platform === 'string' ? s.platform : undefined,
  }),
  loader: async () => {
    const [origin, turnstileSiteKey] = await Promise.all([getOrigin(), getTurnstileSiteKey()])
    return { origin, turnstileSiteKey }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/products',
      title: translate(d, 'content.seo.productsTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.productsDesc'),
    })
    return { meta, links }
  },
  component: ProductsPage,
})

function ProductsPage() {
  const { locale, t } = useTranslation()
  const c = pick(productsPage, locale)
  const { turnstileSiteKey } = Route.useLoaderData()
  const { platform } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <MarketingShell>
      <PageHero kicker={c.kicker} title={c.title} sub={c.sub} />

      {/* series hub: one SEO page per platform category */}
      <nav className="border-b border-border bg-bg-alt/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-4 md:px-7">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
            {t('content.series')}
          </span>
          {seriesPages[locale].map((s) => (
            <a
              key={s.slug}
              href={localizePath(locale, `/products/${s.slug}`)}
              className={SECONDARY_PILL}
            >
              {s.navLabel.replace(t('content.platforms'), '').trim()}
            </a>
          ))}
        </div>
      </nav>

      <ProductsSection
        heading={null}
        active={platform}
        onActiveChange={(key) =>
          navigate({
            search: (prev) => ({ ...prev, platform: key === 'all' ? undefined : key }),
            replace: true,
          })
        }
      />
      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }, { name: t('sup.nav.products'), path: '/products' }])} />
      <JsonLd
        data={itemListLd(pick(products, locale).items.map((p) => ({ name: p.name, path: `/products/${p.slug}` })))}
      />

      {/* everything is customizable */}
      <section className="border-t border-border bg-bg-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
          <h2 className="text-center font-display text-2xl font-extrabold tracking-tight md:text-3xl">{c.customTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[14.5px] leading-relaxed text-fg-2">{c.customBody}</p>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {c.customPoints.map((p) => (
              <li key={p} className="marine-card flex items-center gap-3 px-5 py-3.5">
                <Check size={16} className="shrink-0 text-primary" />
                <span className="text-[14px] font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CatalogDownload turnstileSiteKey={turnstileSiteKey} />

      <CtaBand />
    </MarketingShell>
  )
}
