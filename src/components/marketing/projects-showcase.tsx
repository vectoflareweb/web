import { ArrowRight } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { projects } from '@/product/projects'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Home: proof-of-work strip — featured project cases linking into /projects,
 *  each card carrying customer type, headline and requirement so buyers can
 *  self-qualify before clicking through. */
const FEATURED = ['coastal-rental-fleet', 'eu-distributor-private-label', 'resort-sup-fleet', 'touring-sup-range']

export function ProjectsShowcase() {
  const { locale, t } = useTranslation()
  const fl = useLocalizePath()
  const items = FEATURED.map((slug) => projects[locale].find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  )

  return (
    <section className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead
          kicker={t('sup.projects.showcaseKicker')}
          title={t('sup.projects.showcaseTitle')}
          sub={t('sup.projects.showcaseBody')}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <a
                href={fl(`/projects/${p.slug}`)}
                className="marine-card group flex h-full flex-col justify-between gap-5 p-6 md:p-7"
              >
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">{p.industry}</p>
                  <h3 className="mt-3 font-display text-[19px] font-bold leading-snug">{p.h1}</h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">{p.requirement}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary group-hover:underline">
                  {t('sup.projects.viewCase')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center">
          <a href={fl('/projects')} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline">
            {t('sup.projects.seeAll')} <ArrowRight size={14} />
          </a>
        </p>
      </div>
    </section>
  )
}
