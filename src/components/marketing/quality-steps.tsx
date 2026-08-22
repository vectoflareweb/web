import { useTranslation } from '@/features/i18n/provider'
import { pick, quality } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Home: "How Every Board Is Verified" — the six-step documented QC flow. */
export function QualitySteps() {
  const { locale } = useTranslation()
  const c = pick(quality, locale)

  return (
    <section className="border-t border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
        <ol className="mt-12 grid gap-6 md:grid-cols-2">
          {c.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 70}>
              <div className="marine-card h-full p-7">
                <div className="flex items-center gap-4">
                  <span className="step-tile h-[44px]! w-[44px]! border-2 border-white bg-white! text-primary shadow-[var(--shadow-md)] ring-4 ring-aqua/20">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-[17px] font-bold">{step.title}</h3>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}