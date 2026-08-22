import { MoveRight, Ruler, Palette, Layers, Wrench, Package } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { pick, studio } from '@/product/content'
import { SectionHead } from './section-head'

const ICONS = [Ruler, Palette, Layers, Wrench, Package]

/** Custom SUP Studio: horizontal snap-scroll strip of the five build layers. */
export function StudioSection() {
  const { locale } = useTranslation()
  const c = pick(studio, locale)

  return (
    <section className="overflow-hidden border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} className="mx-0! text-left!" />
          <p className="hidden items-center gap-2 pb-2 text-[13px] font-bold uppercase tracking-[0.14em] text-fg-3 lg:flex">
            {c.scrollHint} <MoveRight size={16} className="text-aqua" />
          </p>
        </div>

        <div className="scroll-smooth -mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:thin] md:-mx-7 md:px-7">
          {c.steps.map((step, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div
                key={step.title}
                className="marine-card flex w-[280px] shrink-0 snap-start flex-col p-7 md:w-[300px]"
              >
                <div className="flex items-center justify-between">
                  <span className="icon-tile bg-aqua/10!">
                    <Icon size={20} />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-border-strong">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[18px] font-bold">{step.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
