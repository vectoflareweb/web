import { useTranslation } from '@/features/i18n/provider'
import { pick, trustBar } from '@/product/content'

/** Home: proof bar right under the hero — verifiable ordering facts (MOQ, samples, lead time, capacity, plant, certs), all sourced from FACTS. */
export function TrustBar() {
  const { locale } = useTranslation()
  const c = pick(trustBar, locale)

  return (
    <section className="border-b border-border bg-bg-alt">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-7 gap-y-8 px-5 py-10 md:grid-cols-4 md:px-8 lg:px-10 md:py-12">
        {c.stats.map((s) => (
          <div key={s.value} className="text-center md:text-left">
            <p className="font-display text-[20px] font-extrabold leading-tight tracking-tight text-primary md:text-[24px]">
              {s.value}
            </p>
            <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-fg-2">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}