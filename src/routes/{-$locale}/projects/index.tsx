import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Package } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { projects, projectsMeta } from '@/product/projects'
import { PageHero } from '@/components/marketing/section-head'
import { JsonLd, itemListLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { MarketingShell } from '@/components/marketing/shell'
import type { Locale } from '@/features/i18n/locale'

export const Route = createFileRoute('/{-$locale}/projects/')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/projects',
      title: projectsMeta[locale].metaTitle,
      description: projectsMeta[locale].metaDescription,
    })
    return { meta, links }
  },
  component: ProjectsIndex,
})

function ProjectsIndex() {
  const { locale, t } = useTranslation()
  const items = projects[locale]
  const meta = projectsMeta[locale]
  const fl = useLocalizePath()
  const [customer, setCustomer] = useState('')
  const [category, setCategory] = useState('')
  const customers = Array.from(new Set(items.map((p) => p.industry)))
  const categories = Array.from(new Set(items.map((p) => p.productCategory)))
  const filtered = items.filter(
    (p) => (!customer || p.industry === customer) && (!category || p.productCategory === category),
  )
  const chip = (active: boolean): string =>
    `rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
      active ? 'bg-primary text-white' : 'border border-border bg-bg-alt text-fg-2 hover:border-primary/40'
    }`

  return (
    <MarketingShell>
      <PageHero kicker={t('sup.projects.hubKicker')} title={meta.h1}>
        <div className="mt-7 flex max-w-2xl flex-col gap-4">
          <p className="fg-dim text-[15.5px] leading-relaxed">{t('sup.projects.hubIntro')}</p>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-7 md:py-16">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
              {t('sup.projects.filterCustomerType')}
            </span>
            <button type="button" aria-label={t('sup.projects.filterAllAria')} onClick={() => setCustomer('')} className={chip(!customer)}>
              {t('sup.projects.filterAll')}
            </button>
            {customers.map((c) => (
              <button key={c} type="button" aria-label={t('sup.projects.filterTypeAria', { type: c })} onClick={() => setCustomer(customer === c ? '' : c)} className={chip(customer === c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
              {t('sup.projects.filterProductCategory')}
            </span>
            <button type="button" aria-label={t('sup.projects.filterAllCategoriesAria')} onClick={() => setCategory('')} className={chip(!category)}>
              {t('sup.projects.filterAll')}
            </button>
            {categories.map((c) => (
              <button key={c} type="button" aria-label={t('sup.projects.filterCategoryAria', { type: c })} onClick={() => setCategory(category === c ? '' : c)} className={chip(category === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filtered.map((p) => (
            <a
              key={p.slug}
              href={fl(`/projects/${p.slug}`)}
              className="marine-card group flex flex-col justify-between gap-5 p-6 transition-transform hover:-translate-y-0.5 md:p-7"
            >
              <div>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-primary">
                  <Package size={14} /> {p.industry}
                </p>
                <h2 className="mt-3 font-display text-[21px] font-bold leading-snug md:text-[23px]">{p.h1}</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-fg-2">{p.requirement}</p>
              </div>
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-primary group-hover:underline">
                {t('sup.projects.viewCase')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-center text-[14px] text-fg-2">{t('sup.projects.filterEmpty')}</p>
        )}

        <div className="mt-14 rounded-3xl border border-border bg-bg-alt p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-extrabold">{t('sup.projects.yourCaseTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-fg-2">{t('sup.projects.yourCaseBody')}</p>
          <a
            href={fl('/contact')}
            className="sun-grad mt-7 inline-flex h-[46px] items-center gap-2 rounded-full px-7 text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(255,107,53,0.65)] transition-transform hover:-translate-y-px"
          >
            {t('sup.projects.discuss')} <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <JsonLd
        data={siteBreadcrumbLd([
          { name: t('sup.breadcrumb.home'), path: '/' },
          { name: t('sup.breadcrumb.projects'), path: '/projects' },
        ])}
      />
      <JsonLd
        data={itemListLd(items.map((p) => ({ name: p.h1, path: `/projects/${p.slug}` })))}
      />
    </MarketingShell>
  )
}
