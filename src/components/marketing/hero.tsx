import { ArrowRight } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, hero } from '@/product/content'
import { HERO_IMAGE, HERO_IMAGE_480, HERO_IMAGE_768, HERO_IMAGE_WEBP } from '@/features/seo/seo'
import { PictureImg } from '@/components/ui/picture-img'

const DECO_AQUA: React.CSSProperties = { background: 'radial-gradient(circle, rgba(53,194,201,0.55) 0%, transparent 70%)' }
const DECO_SUN: React.CSSProperties = { background: 'radial-gradient(circle, rgba(255,138,61,0.5) 0%, transparent 70%)' }
const STAGE_AQUA: React.CSSProperties = { background: 'radial-gradient(circle, rgba(53,194,201,0.6) 0%, transparent 70%)' }
const STAGE_NAVY: React.CSSProperties = { background: 'radial-gradient(circle, rgba(0,119,182,0.35) 0%, transparent 70%)' }

const HERO_SWATCHES = [195, 28, 260, 210, 330]

/** Home hero: 100svh ocean scene — headline left, brand mockup card on a water stage right, drifting waves below. */
export function Hero() {
  const { locale } = useTranslation()
  const c = pick(hero, locale)
  const fl = useLocalizePath()

  return (
    <section className="ocean-grad relative flex min-h-[100svh] items-center overflow-hidden">
      {/* ambient deco */}
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={DECO_AQUA}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-56 -left-40 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl"
        style={DECO_SUN}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-36 pt-24 md:px-7 md:pb-40 md:pt-28 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <p className="kicker text-[#aee3f7]!">{c.kicker}</p>
          <h1 className="mt-4 font-display text-[1.75rem] font-extrabold leading-[1.06] tracking-tight text-white md:text-[2.7rem]">
            {c.titlePre} <span className="text-[#7fd6f0]">{c.titleAccent}</span>
            {c.titlePost ? (
              <span className="mt-1 block text-[1.1rem] font-bold leading-[1.15] text-white/85 md:text-[1.6rem]">
                {c.titlePost}
              </span>
            ) : null}
          </h1>
          <p className="fg-dim mt-6 max-w-xl text-[16.5px] leading-relaxed md:text-lg">{c.sub}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={fl('/start-sup-project')}
              className="sun-grad inline-flex h-[48px] items-center gap-2 rounded-full px-8 text-[15px] font-bold shadow-[0_14px_34px_-10px_rgba(255,138,61,0.75)] transition-transform hover:-translate-y-0.5"
            >
              {c.ctaPrimary} <ArrowRight size={17} />
            </a>
            <a
              href={fl('/proof-center')}
              className="glass-btn inline-flex h-[48px] items-center px-8 text-[15px] font-semibold"
            >
              {c.ctaSecondary}
            </a>
          </div>
          <p className="mt-3 text-[12px] font-medium tracking-wide text-white/75">{c.ctaMicro}</p>

          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm sm:grid-cols-4">
            {c.stats.map((s) => (
              <div key={s.label} className="bg-black/20 px-4 py-3.5">
                <dt className="font-display text-[1.35rem] font-extrabold leading-none text-white">{s.value}</dt>
                <dd className="mt-1.5 text-[11.5px] font-semibold leading-snug text-white/75">{s.label}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 max-w-xl text-[13px] font-medium leading-relaxed text-white/85">{c.heroNote}</p>
        </div>

        {/* board mockup on a water stage */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="feature-card rounded-[32px]! overflow-hidden p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-fg-3">{c.mockupLabel}</span>
              <span className="pill border-aqua/30! bg-aqua/10! text-aqua!">{c.mockupBrand}</span>
            </div>

            {/* water stage */}
            <div className="relative mt-6 overflow-hidden rounded-[20px] border border-border-2 bg-bg-alt">
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-60 blur-2xl"
                style={STAGE_AQUA}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -left-10 bottom-4 h-32 w-40 rounded-full opacity-50 blur-2xl"
                style={STAGE_NAVY}
                aria-hidden="true"
              />
              <PictureImg
                avifSrcSet={`${HERO_IMAGE} 1200w, ${HERO_IMAGE_768} 768w, ${HERO_IMAGE_480} 480w`}
                webp={HERO_IMAGE_WEBP}
                sizes="(min-width: 768px) 512px, calc(100vw - 2.5rem)"
                alt={c.mockupBrand}
                width={1200}
                height={630}
                loading="eager"
                fetchPriority="high"
                decoding="auto"
                className="relative h-[280px] w-full object-cover md:h-[320px]"
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              {HERO_SWATCHES.map((hue) => (
                <span
                  key={hue}
                  className="h-6 w-6 cursor-pointer rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                  style={{ background: `hsl(${hue} 72% 52%)` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="mt-4 text-center text-[12.5px] font-medium text-fg-3">{c.mockupHint}</p>
          </div>

          {/* floating stat chips */}
          <div className="float-y absolute -right-2 -top-5 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-lg)] md:-right-7">
            <p className="font-display text-xl font-extrabold text-primary">{c.float1.value}</p>
            <p className="text-[11.5px] font-semibold text-fg-3">{c.float1.label}</p>
          </div>
          <div className="float-y delay absolute -bottom-6 -left-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-lg)] md:-left-7">
            <p className="font-display text-xl font-extrabold text-sun">{c.float2.value}</p>
            <p className="text-[11.5px] font-semibold text-fg-3">{c.float2.label}</p>
          </div>
        </div>
      </div>

      {/* drifting water layers */}
      <div className="absolute bottom-0 left-0 h-28 w-full overflow-hidden opacity-90" aria-hidden="true">
        <div className="wave-layer bottom-0">
          <svg className="h-24 w-full" viewBox="0 0 1600 96" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 40c160 24 320 24 480 0s320-24 480 0 320 24 480 0 320-24 480 0v56H0Z"
              fill="rgba(255,255,255,0.14)"
            />
            <path
              d="M0 52c180-18 360-18 540 0s360 18 540 0 360-18 540 0v44H0Z"
              fill="rgba(255,255,255,0.22)"
            />
          </svg>
        </div>
        <div className="wave-layer slow bottom-0">
          <svg className="h-16 w-full" viewBox="0 0 1600 64" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 24c200-14 400-14 600 0s400 14 600 0 400-14 600 0v40H0Z"
              fill="rgba(53,194,201,0.28)"
            />
          </svg>
        </div>
      </div>

      {/* wave divider */}
      <svg
        className="absolute -bottom-px left-0 w-full text-[var(--background)]"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 48h1440V24c-180 18-360 18-540 0S540 6 720 6s360 12 540 24v18H0Z" fill="currentColor" />
      </svg>
    </section>
  )
}
