import { Sparkles, Layers, DraftingCompass, Factory, BadgeCheck, Globe } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { pick, valueProp } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

const ICONS = [Sparkles, Layers, DraftingCompass, Factory, BadgeCheck, Globe]

/** Core value proposition: "More Than a SUP Factory" — product development & manufacturing partner positioning. */
export function ValueProp() {
  const { locale } = useTranslation()
  const c = pick(valueProp, locale)

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.cards.map((card, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={card.title} delay={(i % 3) * 80}>
                <div className="marine-card flex h-full flex-col p-7">
                  <span className="icon-tile bg-aqua/10! text-primary!">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 font-display text-[17px] font-bold">{card.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{card.body}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
