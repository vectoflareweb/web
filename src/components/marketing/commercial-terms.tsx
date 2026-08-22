import { useTranslation } from '@/features/i18n/provider'
import { pick, commercial } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Home: "Commercial Terms, Stated Upfront" — MOQ / lead time / sampling / trade terms + certifications line. */
export function CommercialTerms() {
  const { locale, t } = useTranslation()
  const c = pick(commercial, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {c.cells.map((cell, i) => (
          <Reveal key={cell.label} delay={i * 70}>
            <div className="marine-card h-full p-7">
              <h3 className="font-display text-[17px] font-bold text-primary">{cell.label}</h3>
              <ul className="mt-4 space-y-2.5">
                {cell.lines.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-fg-2">
                    <span className="mt-0.5 text-primary" aria-hidden="true">✓</span> {line}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-8">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-soft/60">
                {[t('content.commercialTerms.orderStage'), t('content.commercialTerms.quantity'), t('content.commercialTerms.whatFor'), t('content.commercialTerms.notes')].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-display text-[12.5px] font-extrabold uppercase tracking-wide text-fg-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.moqTiers.map((t) => (
                <tr key={t.stage} className="align-top">
                  <th scope="row" className="px-4 py-3.5 font-semibold text-fg-1">{t.stage}</th>
                  <td className="px-4 py-3.5 font-bold text-primary">{t.quantity}</td>
                  <td className="px-4 py-3.5 text-fg-2">{t.purpose}</td>
                  <td className="px-4 py-3.5 text-fg-3">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
      <Reveal className="mt-8">
        <p className="rounded-2xl border border-primary/25 bg-bg-alt px-5 py-4 text-center text-[13.5px] font-semibold leading-relaxed text-fg-2">
          {c.certs}
        </p>
      </Reveal>
    </section>
  )
}