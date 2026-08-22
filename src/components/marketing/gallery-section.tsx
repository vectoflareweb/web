import { useTranslation } from '@/features/i18n/provider'
import { pick, gallery } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** Production case cards with hue-tinted stages. Shared by home and /gallery. */
export function GallerySection({ heading }: { heading?: React.ReactNode }) {
  const { locale } = useTranslation()
  const c = pick(gallery, locale)

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
      {heading ?? <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {c.projects.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <div className="marine-card flex h-full flex-col overflow-hidden p-0">
              <div className="zoom-img relative aspect-[4/3] overflow-hidden border-b border-border-2 bg-bg-alt">
                <img src={p.image} alt={p.title} width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <span className="pill self-start border-primary/25! bg-soft! text-primary!">{p.tag}</span>
                <h3 className="mt-3.5 font-display text-[19px] font-bold">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{p.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
