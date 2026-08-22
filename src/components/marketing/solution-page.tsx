import { useState } from 'react'
import { ArrowRight, CheckCircle2, Target, AlertCircle } from 'lucide-react'
import type { SolutionPageData } from '@/product/solution-pages'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { PageHero, SectionHead } from './section-head'
import { JsonLd, faqLd, serviceLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { solutionPath } from '@/product/solution-pages'
import { PRIMARY_CTA } from './cta-styles'

/**
 * Shared renderer for the Solutions system pages (src/features/site/solution-pages.ts).
 * Uniform logic: scenario → problems → solution → process → case study → FAQ → CTA.
 * CTA temperature: cold → Learn More, warm → Discuss Your Project, hot → Request Manufacturing Proposal.
 */
export function SolutionPage({ page }: { page: SolutionPageData }) {
  const { t, locale } = useTranslation()
  const fl = useLocalizePath()
  const ctaLabel =
    page.ctaLabel ??
    {
      cold: t('sup.solutions.ctaCold'),
      warm: t('sup.solutions.ctaWarm'),
      hot: t('sup.solutions.ctaHot'),
    }[page.ctaLevel]
  const ctaHref = page.ctaLevel === 'cold' ? '/solutions' : '/contact'
  const path = solutionPath(page.slug)

  return (
    <>
      <PageHero kicker={page.kicker} title={page.h1}>
        <div className="mt-7 flex max-w-2xl flex-col gap-4">
          {page.intro.map((p, i) => (
            <p key={i} className="fg-dim text-[15.5px] leading-relaxed">{p}</p>
          ))}
        </div>
        <a
          href={fl('/contact')}
          className="sun-grad mt-8 inline-flex h-[46px] items-center gap-2 rounded-full px-7 text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(255,107,53,0.65)] transition-transform hover:-translate-y-px"
        >
          {ctaLabel} <ArrowRight size={17} />
        </a>
      </PageHero>

      {/* straight answer (AEO — first 40–70 words a crawler/AI can quote) */}
      <div className="mx-auto max-w-6xl px-5 md:px-7">
        <p className="kicker" lang={locale}>{t('sup.solutions.straightAnswer')}</p>
        <p className="mt-2 max-w-3xl rounded-2xl border border-primary/25 bg-soft px-6 py-5 text-[15px] font-medium leading-relaxed text-foreground">
          {page.answer}
        </p>
      </div>

      {/* scenario */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <div className="marine-card mx-auto max-w-3xl px-6 py-7 md:px-8">
          <div className="flex items-start gap-4">
            <span className="icon-tile shrink-0">
              <Target size={20} />
            </span>
            <div>
              <p className="kicker">{t('sup.solutions.scenario')}</p>
              <h2 className="mt-1.5 font-display text-xl font-bold">{page.scenario.title}</h2>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-fg-2">{page.scenario.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* problems → solutions */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
          <SectionHead kicker={t('sup.solutions.pairsKicker')} title={t('sup.solutions.pairsTitle')} />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {page.pairs.map((pair) => (
              <div key={pair.problem} className="marine-card flex flex-col gap-3.5 p-6">
                <p className="flex items-start gap-2.5 text-[13.5px] font-semibold text-fg-2">
                  <AlertCircle size={17} className="mt-0.5 shrink-0 text-sun" />
                  {pair.problem}
                </p>
                <p className="flex items-start gap-2.5 text-[14px] leading-relaxed">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
                  {pair.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* process */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <SectionHead kicker={t('sup.solutions.stepsKicker')} title={t('sup.solutions.stepsTitle')} />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {page.steps.map((step, i) => (
            <li key={step.title} className="marine-card p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-aqua font-display text-[13px] font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3.5 font-display text-[15.5px] font-bold">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* case study */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
          <SectionHead kicker={t('sup.solutions.caseKicker')} title={t('sup.solutions.caseTitle')} />
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="sun-grad rounded-2xl p-[1px]">
              <div className="rounded-2xl bg-background p-7 md:p-9">
                <h3 className="font-display text-lg font-bold">{page.caseStudy.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">{page.caseStudy.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {page.caseStudy.tags.map((tag) => (
                    <span key={tag} className="pill">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:px-7 md:py-20">
        <SectionHead kicker={t('content.fallbackFaq')} title={t('sup.solutions.faqTitle')} />
        <div className="mt-10 flex flex-col gap-3">
          {page.faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>
      <JsonLd data={faqLd(page.faqs, locale)} />
      <JsonLd
        data={serviceLd({
          serviceType: page.serviceType,
          description: page.metaDescription,
          path,
        })}
      />
      <JsonLd
        data={siteBreadcrumbLd([
          { name: t('sup.breadcrumb.home'), path: '/' },
          { name: t('sup.breadcrumb.solutions'), path: '/solutions' },
          { name: page.h1, path },
        ])}
      />

      {/* CTA + related paths */}
      <section className="ocean-grad">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-16 text-center md:px-7 md:py-20">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#aee3f7]">{t('sup.solutions.nextKicker')}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.12] text-white md:text-4xl">{t('sup.solutions.nextTitle')}</h2>
          <p className="fg-dim mt-4 max-w-xl text-[15.5px] leading-relaxed">{t('sup.solutions.nextBody')}</p>
          <a
            href={fl(ctaHref)}
            className={PRIMARY_CTA}
          >
            {ctaLabel} <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-12 md:px-7">
        <span className="mr-2 text-[13px] font-semibold text-fg-3">{t('sup.nav.solutions')} ·</span>
        <a href={fl('/solutions')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.solutions.seeAll')}</a>
        <span className="text-fg-3">·</span>
        <a href={fl('/products')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.nav.products')}</a>
        <span className="text-fg-3">·</span>
        <a href={fl('/how-it-works')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.nav.process')}</a>
        <span className="text-fg-3">·</span>
        <a href={fl('/contact')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.nav.contact')}</a>
      </nav>
    </>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details className="faq-row" open={open} onToggle={() => setOpen((v) => !v)}>
      <summary aria-expanded={open}>{q}</summary>
      <div className="faq-body">{a}</div>
    </details>
  )
}
