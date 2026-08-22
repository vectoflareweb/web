import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, PaintBucket, Upload, ImageIcon, Sparkles } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate } from '@/features/i18n/locale'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, customizer } from '@/product/content'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { BoardArt } from '@/components/marketing/board-art'
import { JsonLd, siteBreadcrumbLd } from '@/features/seo/jsonld'

const STEP_ICONS = [PaintBucket, Upload, ImageIcon, Sparkles]
const SWATCHES = [195, 28, 260, 210, 330, 8]

export const Route = createFileRoute('/{-$locale}/customizer')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/customizer',
      title: translate(d, 'content.seo.customizerTitle'),
      description: translate(d, 'content.seo.customizerDesc'),
    })
    return { meta, links }
  },
  component: CustomizerPage,
})

/** SUP Design Studio: clean white configurator layout with a live color-picking preview. */
function CustomizerPage() {
  const { locale, t } = useTranslation()
  const fl = useLocalizePath()
  const c = pick(customizer, locale)
  const [hue, setHue] = React.useState(195)

  return (
    <MarketingShell>
      <PageHero kicker={c.kicker} title={c.title} sub={c.sub}>
        <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-white">
          <Sparkles size={14} className="text-[#7fd6f0]" />
          {c.status}
        </span>
      </PageHero>

      {/* studio workspace */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* preview stage */}
          <div className="marine-card flex flex-col p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-fg-3">{c.mockupLabel}</span>
              <span className="pill bg-aqua/10! border-aqua/30! text-aqua!">{c.mockupBrand}</span>
            </div>
            <div
              className="relative mt-6 flex flex-1 items-center overflow-hidden rounded-[24px] border border-border-2 bg-bg-alt px-4 py-10"
              style={{ background: `radial-gradient(120% 90% at 50% 10%, hsl(${hue} 62% 85% / 0.55) 0%, var(--bg-alt) 68%)` }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-70 blur-2xl"
                style={{ background: `radial-gradient(circle, hsl(${hue} 72% 55% / 0.5) 0%, transparent 70%)` }}
                aria-hidden="true"
              />
              <BoardArt className="relative w-full" hue={hue} label={c.boardLabel} />
            </div>

            {/* palette */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {SWATCHES.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={t('marketing.hueAria', { value: h })}
                  onClick={() => setHue(h)}
                  className={`h-9 w-9 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    hue === h ? 'scale-110 border-white shadow-[0_0_0_3px_var(--primary)]' : 'border-border-strong'
                  }`}
                  style={{ background: `hsl(${h} 72% 52%)` }}
                />
              ))}
            </div>
            <p className="mt-5 text-center text-[13.5px] text-fg-3">{c.statusBody}</p>
          </div>

          {/* upcoming steps */}
          <div className="flex flex-col gap-4">
            {c.steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length]
              return (
                <div key={step.title} className="marine-card flex items-start gap-4 p-5">
                  <span className="icon-tile bg-aqua/10!">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-fg-3">
                      {c.stepLabel} {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-1 font-display text-[15.5px] font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{step.body}</p>
                  </div>
                </div>
              )
            })}
            <a
              href={fl('/contact')}
              className="sun-grad mt-2 inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-8 text-[15px] font-bold shadow-[0_14px_34px_-10px_rgba(255,138,61,0.7)] transition-transform hover:-translate-y-0.5"
            >
              {c.cta} <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }, { name: t('sup.nav.customizer'), path: '/customizer' }])} />
    </MarketingShell>
  )
}
