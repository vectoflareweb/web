import { ArrowRight, Package, BadgeCheck, Hotel, Users } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { pick, serve } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

const ICONS = [Package, BadgeCheck, Hotel, Users]

/** Customer needs: four numbered entrance cards, each routing into its own solution page. */
export function WhoWeServe() {
  const { locale } = useTranslation()
  const c = pick(serve, locale)

  return (
    <section className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {c.segments.map((seg, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={seg.slug} delay={i * 80}>
                <a
                  href={localizePath(locale, seg.href)}
                  className="marine-card group flex h-full flex-col p-7 text-current"
                >
                  <div className="flex items-center justify-between">
                    <span className="icon-tile bg-aqua/10! text-primary!">
                      <Icon size={20} />
                    </span>
                    <span className="font-display text-[26px] font-extrabold text-fg-3/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[18px] font-bold">{seg.title}</h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{seg.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {seg.points.slice(0, 3).map((p) => (
                      <li key={p} className="pill">{p}</li>
                    ))}
                  </ul>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary">
                    {seg.cta}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
