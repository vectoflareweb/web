import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, Package } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, products, productsPage } from '@/product/content'
import { seriesPages } from '@/product/series-pages'
import { procurementProfiles, commercialRows } from '@/product/procurement'
import { FACTS, MOQ_SHORT } from '@/product/facts'
import { SECONDARY_PILL } from '@/components/marketing/cta-styles'
import { JsonLd, breadcrumbLd, faqLd, itemListLd } from '@/features/seo/jsonld'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { CtaBand } from '@/components/marketing/cta'
import { InquiryForm } from '@/features/inquiry/components/inquiry-form'
import { ProductView } from '@/features/content/catchall'

export const Route = createLazyFileRoute('/{-$locale}/products/$series')({ component: SeriesPage })

function SeriesPage() {
  const { locale, t } = useTranslation()
  const { origin, turnstileSiteKey, page, product } = Route.useLoaderData()

  if (product) {
    return (
      <MarketingShell>
        <ProductView product={product.product} related={product.related} origin={origin} locale={locale} />
        <CtaBand productSlug={product.product.slug} />
      </MarketingShell>
    )
  }

  if (!page) return null
  const fl = useLocalizePath()
  const items = pick(products, locale).items.filter((p) => p.series === page.slug)
  const c = pick(productsPage, locale)
  const others = seriesPages[locale].filter((s) => s.slug !== page.slug)
  const profile = procurementProfiles[locale][page.slug]
  const snap = profile
    ? [
        { label: t('sup.procurement.bestFor'), value: profile.bestFor },
        { label: t('sup.procurement.sizes'), value: profile.sizes },
        { label: t('sup.procurement.construction'), value: profile.construction },
        { label: t('sup.procurement.customization'), value: profile.customization },
        { label: t('sup.procurement.moq'), value: profile.moq },
        { label: t('sup.procurement.leadTime'), value: profile.leadTime },
      ]
    : []
  const first = items[0]

  return (
    <MarketingShell>
      <PageHero kicker={page.kicker} title={page.h1} sub={page.intro[0]} />

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-7 md:py-16">
        <div className="mx-auto mb-10 max-w-3xl">
          <p className="text-[15px] leading-relaxed text-fg-2">{page.intro[1]}</p>
        </div>

        {profile && (
          <div>
            <h2 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary">{t('sup.procurement.snapshotTitle')}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snap.map((s) => (
                <div key={s.label} className="marine-card p-4">
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">{s.label}</p>
                  <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="marine-card p-4">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">{t('content.product.minimumOrderShort')}</p>
            <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
              {t('inquiry.moqSummary', { standardRun: MOQ_SHORT.standardRun, trialStandard: MOQ_SHORT.trialStandard, customMould: MOQ_SHORT.customMould })}
            </p>
          </div>
          <div className="marine-card p-4">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">{t('content.product.timeline')}</p>
            <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
              {t('inquiry.timelineSummary', { sampleTime: FACTS.sampleTime, leadTime: FACTS.leadTime })}
            </p>
          </div>
          <div className="marine-card p-4">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">{t('content.product.qualityControl')}</p>
            <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">
              {t('inquiry.qcSummary', { assemblyChecklist: FACTS.assemblyChecklist, pressureTest: FACTS.pressureTest })}
            </p>
          </div>
        </div>

        {profile && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">{t('sup.procurement.title')}</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-bg-alt/50 p-7">
                <h3 className="font-display text-lg font-bold tracking-tight">{t('sup.procurement.baseSpecsTitle')}</h3>
                <table className="mt-4 w-full border-collapse text-[13.5px]">
                  <tbody>
                    {profile.specRows.map((row) => (
                      <tr key={row.label} className="border-b border-border/60 last:border-0">
                        <th scope="row" className="py-2 pr-4 align-top font-bold text-fg-3">{row.label}</th>
                        <td className="py-2 align-top text-fg-2">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 text-[13px] leading-relaxed text-fg-2">
                  {t('sup.procurement.constructionBody')}
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-border bg-bg-alt/50 p-7">
                  <h3 className="font-display text-lg font-bold tracking-tight">{t('sup.procurement.commercialTitle')}</h3>
                  <table className="mt-4 w-full border-collapse text-[13.5px]">
                    <tbody>
                      {commercialRows[locale].map((row) => (
                        <tr key={row.label} className="border-b border-border/60 last:border-0">
                        <th scope="row" className="py-2 pr-4 align-top font-bold text-fg-3">{row.label}</th>
                          <td className="py-2 align-top text-fg-2">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {profile.keyQuestions.length > 0 && (
                  <div className="rounded-3xl border border-border bg-bg-alt/50 p-7">
                    <h3 className="font-display text-lg font-bold tracking-tight">{t('sup.procurement.keyQuestionsTitle')}</h3>
                    <ul className="mt-3 flex flex-col gap-2">
                      {profile.keyQuestions.map((q) => (
                        <li key={q} className="flex items-center gap-2.5 text-[13.5px] font-medium text-fg-2">
                          <CheckCircle2 size={15} className="shrink-0 text-primary" /> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-border bg-bg-alt/50 p-7">
              <h3 className="font-display text-lg font-bold tracking-tight">{t('sup.procurement.docsTitle')}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{t('sup.procurement.docsBody')}</p>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            {t('inquiry.modelsHeading', { navLabel: page.navLabel })}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <a key={p.slug} href={fl(`/products/${p.slug}`)} className="marine-card group flex flex-col gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <img src={p.image} alt={p.name} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full rounded-xl border border-border-2 object-cover" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-[17px] font-bold leading-snug">{p.name}</h3>
                    <Package size={16} className="shrink-0 text-primary" />
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{p.tagline}</p>
                  <p className="mt-2 text-[12.5px] font-medium text-fg-3">{p.specs}</p>
                  <p className="mt-1.5 text-[12px] font-semibold text-primary">
                    {t('inquiry.moqShort', { standardRun: MOQ_SHORT.standardRun, trialStandard: MOQ_SHORT.trialStandard })}
                  </p>
                </div>
                <p className="mt-auto flex items-center gap-1.5 text-[13.5px] font-bold text-primary group-hover:underline">
                  {t('content.product.viewPlatform')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-bg-alt/50 p-7">
            <h2 className="font-display text-xl font-extrabold tracking-tight">{t('content.product.whatCustomize')}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {c.customPoints.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14px] font-medium text-fg-2">
                  <CheckCircle2 size={15} className="shrink-0 text-primary" /> {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14px] leading-relaxed text-fg-2">{c.customBody}</p>
          </div>
          <div className="rounded-3xl border border-border bg-bg-alt/50 p-7">
            <h2 className="font-display text-xl font-extrabold tracking-tight">{t('content.product.seriesFaq')}</h2>
            <div className="mt-4 flex flex-col gap-3">
              {page.faqs.map((f) => (
                <SeriesFaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-bg-alt p-8 text-center md:p-12">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
            {t('content.product.readySeries')}
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            {t('sup.procurement.cta')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-fg-2">{t('sup.procurement.ctaSub')}</p>
          <a
            href={fl(`/contact?product=${encodeURIComponent(items[0]?.slug ?? page.slug)}&category=${page.slug}`)}
            className="sun-grad mt-7 inline-flex h-[46px] items-center gap-2 rounded-full px-7 text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(255,107,53,0.65)] transition-transform hover:-translate-y-px"
          >
            {t('sup.procurement.cta')} <ArrowRight size={17} />
          </a>
        </div>

        {profile && turnstileSiteKey && (
          <div id="rfq" className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">{t('sup.contact.formTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[13.5px] leading-relaxed text-fg-2">{t('sup.contact.formSubtitle')}</p>
            <div className="marine-card mt-6 p-6 md:p-8">
              <InquiryForm
                turnstileSiteKey={turnstileSiteKey}
                prefill={{ name: first?.name, sku: first?.sku, category: page.slug }}
              />
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
              {t('content.product.otherSeries')}
            </span>
            {others.map((s) => (
              <a key={s.slug} href={fl(`/products/${s.slug}`)} className={SECONDARY_PILL}>
                {s.navLabel}
              </a>
            ))}
          </div>
        )}

        <JsonLd
          data={breadcrumbLd(origin, [
            { name: t('content.nav.home'), path: '/' },
            { name: t('content.nav.products'), path: '/products' },
            { name: page.h1, path: `/products/${page.slug}` },
          ])}
        />
        <JsonLd data={itemListLd(items.map((p) => ({ name: p.name, path: `/products/${p.slug}` })))} />
        <JsonLd data={faqLd(page.faqs, locale)} />
      </section>

    </MarketingShell>
  )
}

function SeriesFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details className="group rounded-xl border border-border bg-background px-4 py-3" open={open} onToggle={() => setOpen((v) => !v)}>
      <summary aria-expanded={open} className="cursor-pointer list-none text-[14px] font-bold leading-snug">{q}</summary>
      <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{a}</p>
    </details>
  )
}
