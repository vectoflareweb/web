import { ArrowRight } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, platforms } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Home: "SUP Platforms Available For Customization" — four platform cards, each with a request CTA. */
export function PlatformsSection() {
  const { locale } = useTranslation()
  const c = pick(platforms, locale)
  const fl = useLocalizePath()

  return (
    <section className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {c.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="marine-card flex h-full flex-col p-7">
                <h3 className="font-display text-[18px] font-bold">{item.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{item.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.uses.map((u) => (
                    <span key={u} className="pill">{u}</span>
                  ))}
                </div>
                <a
                  href={fl('/contact')}
                  className="mt-6 inline-flex h-[42px] items-center justify-center gap-2 rounded-full border border-primary/30 bg-card px-6 text-[13.5px] font-bold text-primary transition-colors hover:border-primary/60"
                >
                  {item.cta} <ArrowRight size={15} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
