import { useTranslation } from '@/features/i18n/provider'
import { pick, boundary } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/**
 * Role boundary section — "Where We Stop, You Start".
 * A two-column table of exactly what the factory handles vs. what the client
 * keeps, plus the IP-protection closing promise that matters to Western buyers.
 */
export function RoleBoundary() {
  const { locale } = useTranslation()
  const c = pick(boundary, locale)

  return (
    <section className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />

        <Reveal className="mt-10">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-bg-alt">
                  <th scope="col" className="px-5 py-3.5 font-display font-bold text-primary">{c.oursTitle}</th>
                  <th scope="col" className="px-5 py-3.5 font-display font-bold">{c.theirsTitle}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.ours} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3.5 align-top text-fg-2">{r.ours}</td>
                    <td className="px-5 py-3.5 align-top font-semibold text-fg-2">{r.theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <p className="mt-8 rounded-2xl border border-primary/25 bg-card px-5 py-4 text-center text-[14px] font-semibold leading-relaxed text-primary-foreground sm:mx-auto sm:max-w-3xl">
            {c.footer}
          </p>
        </Reveal>
      </div>
    </section>
  )
}