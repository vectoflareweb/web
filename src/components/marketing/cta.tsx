import { ArrowRight } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, cta } from '@/product/content'

const DECO_AQUA: React.CSSProperties = { background: 'radial-gradient(circle, rgba(53,194,201,0.6) 0%, transparent 70%)' }
const DECO_SUN: React.CSSProperties = { background: 'radial-gradient(circle, rgba(255,138,61,0.6) 0%, transparent 70%)' }

/** Shared conversion band (ocean gradient, drifting waves + sunset CTA). */
export function CtaBand({ productSlug }: { productSlug?: string }) {
  const { locale } = useTranslation()
  const c = pick(cta, locale)
  const fl = useLocalizePath()

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 lg:px-10 md:pb-24">
      <div className="ocean-grad relative overflow-hidden rounded-[32px] px-6 py-16 text-center shadow-[var(--shadow-lg)] md:px-12 md:py-20">
        {/* deco */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={DECO_AQUA}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={DECO_SUN}
          aria-hidden="true"
        />
        {/* water layers */}
        <div className="wave-layer slow absolute left-0 top-0 opacity-40" aria-hidden="true">
          <svg className="h-16 w-full" viewBox="0 0 1600 64" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 24c200-14 400-14 600 0s400 14 600 0 400-14 600 0v40H0Z" fill="rgba(255,255,255,0.18)" />
          </svg>
        </div>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white md:text-4xl">
            {c.title}
          </h2>
          <p className="fg-dim mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed">{c.body}</p>
          <a
            href={fl(productSlug ? `/contact?product=${encodeURIComponent(productSlug)}` : '/start-sup-project')}
            className="sun-grad mx-auto mt-8 inline-flex h-[50px] items-center gap-2 rounded-full px-9 text-[15.5px] font-bold shadow-[0_14px_34px_-10px_rgba(255,138,61,0.8)] transition-transform hover:-translate-y-0.5"
          >
            {c.button} <ArrowRight size={17} />
          </a>
          <p className="mt-5 text-[12.5px] font-medium text-white/70">{c.note}</p>
        </div>
      </div>
    </section>
  )
}
