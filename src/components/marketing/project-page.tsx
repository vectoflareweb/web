import { ArrowRight, Building2, CheckCircle2, ClipboardList, Globe2, Layers, Package, ShieldCheck, TrendingUp, Truck } from 'lucide-react'
import type { ProjectData } from '@/product/projects'
import { projects } from '@/product/projects'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { PageHero, SectionHead } from './section-head'
import { JsonLd, projectLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { MarketingShell } from './shell'
import { PRIMARY_CTA } from './cta-styles'

/**
 * Case-study page renderer for /projects/{slug}: industry → requirement →
 * challenge → solution → product → process → result, plus CaseStudy JSON-LD.
 * Flagship cases (with `metrics` / `takeaways`) additionally get a numbers
 * strip, a mid-page CTA, key takeaways and related-case links.
 */
export function ProjectPage({ page }: { page: ProjectData }) {
  const { t, locale } = useTranslation()
  const fl = useLocalizePath()

  const related = projects[locale]
    .filter((p) => p.slug !== page.slug)
    .map((p) => ({
      p,
      score:
        (p.industry === page.industry ? 2 : 0) +
        (p.productCategory === page.productCategory ? 1 : 0) +
        (p.tags.some((tag) => page.tags.includes(tag)) ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p)

  const snapshot = [
    { icon: Building2, label: t('sup.projects.snapshot.customerType'), value: page.customerType },
    { icon: Globe2, label: t('sup.projects.snapshot.region'), value: page.region },
    { icon: Package, label: t('sup.projects.snapshot.productCategory'), value: page.productCategory },
    { icon: Layers, label: t('sup.projects.snapshot.projectStage'), value: page.projectStage },
    { icon: ClipboardList, label: t('sup.projects.snapshot.manufacturingScope'), value: page.manufacturingScope },
    { icon: CheckCircle2, label: t('sup.projects.snapshot.keyRequirements'), value: page.keyRequirements },
    { icon: ShieldCheck, label: t('sup.projects.snapshot.qualityFocus'), value: page.qualityFocus },
    { icon: Truck, label: t('sup.projects.snapshot.outcome'), value: page.outcome },
  ]

  return (
    <MarketingShell>
      <PageHero kicker={page.kicker} title={page.h1}>
        <div className="mt-7 flex max-w-2xl flex-col gap-4">
          {page.intro.map((p, i) => (
            <p key={i} className="fg-dim text-[15.5px] leading-relaxed">{p}</p>
          ))}
        </div>
        <a
          href={fl('/contact')}
          className={PRIMARY_CTA}
        >
          {t('sup.projects.discuss')} <ArrowRight size={17} />
        </a>
      </PageHero>

      {/* project snapshot — standardized fields for side-by-side comparison */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-7">
        <SectionHead kicker={t('sup.projects.snapshot.kicker')} title={t('sup.projects.snapshot.title')} />
        <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.map((s) => (
            <div key={s.label} className="marine-card p-5">
              <dt className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">
                <s.icon size={14} className="text-primary" /> {s.label}
              </dt>
              <dd className="mt-2 text-[14px] font-semibold leading-snug">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* headline numbers — flagship cases only */}
      {page.metrics && (
        <section className="border-y border-border bg-bg-alt">
          <div className="mx-auto max-w-6xl px-5 py-12 md:px-7">
            <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {page.metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <dt className="font-display text-[34px] font-extrabold leading-none text-primary">{m.value}</dt>
                  <dd className="mx-auto mt-2 max-w-[230px] text-[12.5px] font-semibold leading-snug text-fg-2">{m.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* at-a-glance facts */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-7">
          <dl className="grid gap-5 md:grid-cols-3">
            <div className="marine-card p-6">
              <dt className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
                <Building2 size={15} className="text-primary" /> {t('sup.projects.industry')}
              </dt>
              <dd className="mt-2 text-[15px] font-semibold">{page.industry}</dd>
            </div>
            <div className="marine-card p-6">
              <dt className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
                <ClipboardList size={15} className="text-primary" /> {t('sup.projects.requirement')}
              </dt>
              <dd className="mt-2 text-[15px] font-semibold">{page.requirement}</dd>
            </div>
            <div className="marine-card p-6">
              <dt className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
                <Package size={15} className="text-primary" /> {t('sup.projects.product')}
              </dt>
              <dd className="mt-2 text-[15px] font-semibold">{page.product}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* challenge → solution */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
          <SectionHead kicker={t('sup.projects.storyKicker')} title={t('sup.projects.storyTitle')} />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="marine-card p-6">
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-sun">{t('sup.projects.challenge')}</p>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-fg-2">{page.challenge}</p>
            </div>
            <div className="marine-card p-6">
              <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.1em] text-primary">
                <CheckCircle2 size={15} /> {t('sup.projects.solution')}
              </p>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-fg-2">{page.solution}</p>
            </div>
          </div>
          {(page.metrics || page.takeaways) && (
            <p className="mt-8 text-center text-[14px] text-fg-2">
              {t('sup.projects.midCtaText')}{' '}
              <a href={fl('/contact')} className="font-bold text-primary hover:underline">
                {t('sup.projects.midCtaLink')}
              </a>
              <ArrowRight size={14} className="ml-1 inline -translate-y-px text-primary" />
            </p>
          )}
        </div>
      </section>

      {/* quality & delivery control lines */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <SectionHead kicker={t('sup.projects.controlsKicker')} title={t('sup.projects.controlsTitle')} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="marine-card p-7">
            <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-primary">
              <ShieldCheck size={16} /> {t('sup.projects.qualityLineTitle')}
            </p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.qualityBasisLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.qualityBasis')}</p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.inspectionFocusLabel')}</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {page.inspectionFocus.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14px] leading-relaxed text-fg-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.issueControlLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.issueControl')}</p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.evidenceLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.evidence')}</p>
          </div>
          <div className="marine-card p-7">
            <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em] text-aqua">
              <Truck size={16} /> {t('sup.projects.deliveryLineTitle')}
            </p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.planningInputsLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.planningInputs')}</p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.milestonesLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.milestones')}</p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.deliveryReadinessLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{t('sup.projects.deliveryReadiness')}</p>
            <p className="mt-4 text-[14.5px] font-bold">{t('sup.projects.outcomeLabel')}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{page.outcome}</p>
          </div>
        </div>
      </section>

      {/* customized configuration — buyer-verifiable scope of what changed */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <SectionHead kicker={t('sup.projects.customKicker')} title={t('sup.projects.customTitle')} />
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-fg-2">{t('sup.projects.customNote')}</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {page.customizations.map((item) => (
            <li key={item} className="marine-card flex items-start gap-2.5 p-4 text-[14px] font-medium leading-snug">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* process */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <SectionHead kicker={t('sup.projects.processKicker')} title={t('sup.projects.processTitle')} />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {page.process.map((step, i) => (
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

      {/* result */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-7 md:py-20">
          <p className="kicker">{t('sup.projects.result')}</p>
          <p className="mt-4 text-[16px] leading-relaxed text-fg-2">{page.result}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {page.tags.map((tag) => (
              <span key={tag} className="pill">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* customer feedback & confidentiality */}
      <section className="border-y border-border bg-bg-alt">
        <div className="mx-auto max-w-3xl px-5 py-14 md:px-7">
          <SectionHead kicker={t('sup.projects.quoteKicker')} title={t('sup.projects.quoteTitle')} />
          <blockquote className="mt-8 border-l-2 border-primary pl-5 text-[15px] italic leading-relaxed text-fg-2">
            {page.confidentiality}
          </blockquote>
        </div>
      </section>

      {/* strong CTA right after the result */}
      <section className="ocean-grad">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 py-16 text-center md:px-7 md:py-20">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#aee3f7]">{t('sup.projects.ctaKicker')}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.12] text-white md:text-4xl">{t('sup.projects.ctaTitle')}</h2>
          <a
            href={fl('/contact')}
            className={PRIMARY_CTA}
          >
            {t('sup.projects.discuss')} <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* key takeaways + scenario CTA — flagship cases only */}
      {page.takeaways && (
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
          <SectionHead kicker={t('sup.projects.takeawaysKicker')} title={t('sup.projects.takeawaysTitle')} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {page.takeaways.map((item) => (
              <li key={item} className="marine-card flex items-start gap-3 p-5">
                <TrendingUp size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-[14px] font-medium leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center md:p-10">
            <h3 className="font-display text-xl font-extrabold">{t('sup.projects.scenarioCtaTitle')}</h3>
            <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-fg-2">{t('sup.projects.scenarioCtaBody')}</p>
            <a
              href={fl('/contact')}
              className="sun-grad mt-6 inline-flex h-[44px] items-center gap-2 rounded-full px-6 text-[14.5px] font-bold shadow-[0_10px_30px_-8px_rgba(255,107,53,0.65)] transition-transform hover:-translate-y-px"
            >
              {t('sup.projects.discuss')} <ArrowRight size={16} />
            </a>
          </div>
        </section>
      )}

      {/* related cases */}
      {related.length > 0 && (
        <section className="border-y border-border bg-bg-alt">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-7">
            <SectionHead kicker={t('sup.projects.similarKicker')} title={t('sup.projects.similarTitle')} />
            <div className="mt-10 flex flex-wrap justify-center gap-5">
              {related.map((p) => (
                <a
                  key={p.slug}
                  href={fl(`/projects/${p.slug}`)}
                  className="marine-card group flex w-full flex-col justify-between gap-4 p-5 sm:w-[46%] lg:w-[31%]"
                >
                  <div>
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-primary">{p.industry}</p>
                    <h3 className="mt-2 font-display text-[16px] font-bold leading-snug">{p.h1}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary group-hover:underline">
                    {t('sup.projects.viewCase')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={projectLd({
          title: page.h1,
          description: page.metaDescription,
          path: `/projects/${page.slug}`,
          industry: page.industry,
          outcome: page.outcome,
        })}
      />
      <JsonLd
        data={siteBreadcrumbLd([
          { name: t('sup.breadcrumb.home'), path: '/' },
          { name: t('sup.breadcrumb.projects'), path: '/projects' },
          { name: page.h1, path: `/projects/${page.slug}` },
        ])}
      />

      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 py-12 md:px-7">
        <a href={fl('/projects')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.projects.seeAll')}</a>
        <span className="text-fg-3">·</span>
        <a href={fl('/solutions')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.nav.solutions')}</a>
        <span className="text-fg-3">·</span>
        <a href={fl('/contact')} className="text-[13px] font-medium text-primary hover:underline">{t('sup.nav.contact')}</a>
      </nav>
    </MarketingShell>
  )
}
