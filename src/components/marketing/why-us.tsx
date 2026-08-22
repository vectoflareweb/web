import { useTranslation } from '@/features/i18n/provider'
import { pick, why } from '@/product/content'
import { Reveal } from './reveal'
import { Settings2, Factory, Layers, Globe } from 'lucide-react'

const ICONS = [Settings2, Factory, Layers, Globe]

/** Home: "Powered by Vectoflare" — factory photo with four capability bullets. */
export function WhyUs() {
  const { locale } = useTranslation()
  const c = pick(why, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-border-2 shadow-[var(--shadow-lg)]">
            <img src={c.image} alt={c.imageCaption} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-[#063a5c]/85 to-transparent px-6 pb-5 pt-12 text-[13px] font-bold uppercase tracking-[0.14em] text-white">
              {c.imageCaption}
            </span>
          </div>
        </Reveal>
        <div>
          <p className="kicker">{c.kicker}</p>
          <h2 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.12] tracking-tight md:text-[2.6rem]">
            {c.title}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg-2">{c.sub}</p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {c.bullets.map((b, i) => {
              const Icon = ICONS[i % ICONS.length]
              return (
                <Reveal as="li" key={b.title} delay={i * 80}>
                  <span className="icon-tile bg-aqua/10! text-primary!">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-3 font-display text-[15.5px] font-bold">{b.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{b.body}</p>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
