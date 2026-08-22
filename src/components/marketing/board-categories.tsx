import { useTranslation } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, boardCategories } from '@/product/content'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

export function BoardCategories() {
  const { locale } = useTranslation()
  const c = pick(boardCategories, locale)
  const fl = useLocalizePath()

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10 md:py-20">
      <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {c.items.map((item, i) => (
          <Reveal key={item.id} delay={i * 60}>
            <a
              href={fl(item.href)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.label}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-5">
                <h3 className="text-[17px] font-bold">{item.label}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fg-2">{item.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-medium text-primary transition-all group-hover:gap-2">
                  {c.viewLabel} <span aria-hidden="true">→</span>
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
