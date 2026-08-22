import { Lightbulb, Layers, ShieldCheck, FlaskConical } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, solve } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

const ICONS = [Lightbulb, Layers, ShieldCheck, FlaskConical]

/** Home: "Manufacturing Scope" — OEM / ODM / Private Label / Volume Supply cards. */
export function SolveSection() {
  const { locale } = useTranslation()
  const c = pick(solve, locale)
  const fl = useLocalizePath()

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {c.items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <Reveal key={item.title} delay={i * 80}>
              <div className="marine-card flex h-full flex-col p-7">
                <div className="flex items-start gap-4">
                  <span className="icon-tile shrink-0 bg-aqua/10! text-primary!">
                    <Icon size={20} />
                  </span>
                  <h3 className="font-display text-[17px] font-bold leading-snug text-primary">{item.title}</h3>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-fg-2">{item.body}</p>
              </div>
            </Reveal>
          )
        })}
      </div>
      <div className="mt-10 text-center">
        <a
          href={fl('/start-sup-project')}
          className="sun-grad inline-flex h-[48px] items-center gap-2 rounded-full px-8 text-[15px] font-bold shadow-[0_14px_34px_-10px_rgba(255,138,61,0.75)] transition-transform hover:-translate-y-0.5"
        >
          {c.cta}
        </a>
      </div>
    </section>
  )
}