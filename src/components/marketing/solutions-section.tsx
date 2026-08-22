import { Check } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { pick, solutions } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'
import { SlidersHorizontal, Palette, Package, Settings2 } from 'lucide-react'

const ICONS = [SlidersHorizontal, Palette, Package, Settings2]

/** Customization Capability: four modules. Shared by home and /solutions. */
export function SolutionsSection({ heading }: { heading?: React.ReactNode }) {
  const { locale } = useTranslation()
  const c = pick(solutions, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      {heading !== undefined ? heading : <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {c.pillars.map((p, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <Reveal key={p.title} delay={i * 90}>
              <div className="marine-card flex h-full flex-col p-7">
                <span className="icon-tile bg-aqua/10!">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-[18px] font-bold">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{p.body}</p>
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
                  {p.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13.5px] font-medium">
                      <span className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-soft">
                        <Check size={12} className="text-primary" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
