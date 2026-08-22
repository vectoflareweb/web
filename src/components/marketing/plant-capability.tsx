import { useTranslation } from '@/features/i18n/provider'
import { pick, capability } from '@/product/content'
import { Scissors, Zap, Layers, Palette, Wrench, Package } from 'lucide-react'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

const ICONS = [Scissors, Zap, Layers, Palette, Wrench, Package]

/** Home: "Inside the Plant" — the six in-house manufacturing capabilities. */
export function PlantCapability() {
  const { locale } = useTranslation()
  const c = pick(capability, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {c.items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <Reveal key={item.name} delay={i * 70}>
              <div className="marine-card h-full p-7">
                <span className="icon-tile bg-aqua/10! text-primary!">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-bold text-primary">{item.name}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{item.body}</p>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}