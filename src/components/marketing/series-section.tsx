import { MoveRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { pick, series } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Signature themed editions: two product cards linking to their detail pages. */
export function SeriesSection() {
  const { locale, t } = useTranslation()
  const c = pick(series, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {c.items.map((s, i) => (
          <Reveal key={s.sku} delay={i * 90}>
            <a href={s.href} className="marine-card group block h-full overflow-hidden p-0">
              <div className="zoom-img relative aspect-[4/3] overflow-hidden border-b border-border-2 bg-bg-alt">
                <img src={s.image} alt={s.title} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-fg-3 backdrop-blur">
                  {s.sku}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-[19px] font-bold transition-colors group-hover:text-primary">{s.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{s.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                  {t('content.viewSeries')}
                  <MoveRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}