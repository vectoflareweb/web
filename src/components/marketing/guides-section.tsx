import { ArrowRight } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, guides } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Home: buyer-education cards linking into the news guides, pitched at the
 *  sourcing questions every SUP brand asks before ordering. */
export function GuidesSection() {
  const { locale, t } = useTranslation()
  const c = pick(guides, locale)
  const fl = useLocalizePath()

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {c.guides.map((g, i) => (
          <Reveal key={g.href} delay={i * 80}>
            <a
              href={fl(g.href)}
              className="marine-card group flex h-full flex-col justify-between gap-6 p-6"
            >
              <div>
                <h3 className="font-display text-[17px] font-bold leading-snug">{g.title}</h3>
                <p className="mt-2 text-[13px] leading-snug text-fg-2">{g.body}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                {t('content.readTheGuide')}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
      <p className="mt-10 text-center text-[14px] text-fg-2">
        <a
          href={fl('/product-development')}
          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
        >
          {t('content.browseSourcingLibrary')}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </p>
    </section>
  )
}