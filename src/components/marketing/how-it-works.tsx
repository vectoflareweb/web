import { ArrowRight, PenTool, FileText } from 'lucide-react'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { pick, works } from '@/product/content'
import { BRAND_ASSETS_CDN } from '@/config/branding'
import { SectionHead } from './section-head'
import { Reveal } from './reveal'

/** How It Works: numbered timeline (01–05) with a design-support note. Shared by home and /how-it-works. */
export function HowItWorks() {
  const { t, locale } = useTranslation()
  const c = pick(works, locale)
  const fl = useLocalizePath()

  const deepLinks = [
    { label: t('sup.nav.manufacturingDropdown.quality'), href: '/quality' },
    { label: t('sup.nav.manufacturingDropdown.qualityInspection'), href: '/factory/quality-inspection' },
    { label: t('sup.nav.manufacturingDropdown.changeControl'), href: '/factory/quality-change-control' },
    { label: t('sup.nav.manufacturingDropdown.nonConformingControl'), href: '/factory/non-conforming-control' },
    { label: t('sup.footer.factoryCapacity'), href: '/factory/capacity' },
    { label: t('sup.nav.oemDropdown.trust'), href: '/oem-trust-assurance' },
    { label: t('sup.nav.caseStudiesDropdown.projects'), href: '/projects' },
  ]

  const pdfLinks = [
    { label: t('sup.nav.oemDropdown.trustPdf'), href: `${BRAND_ASSETS_CDN}/site/downloads/oem-buyer-trust-and-factory-assurance-guide.pdf` },
    { label: t('sup.nav.oemDropdown.moqPdf'), href: `${BRAND_ASSETS_CDN}/site/downloads/flexible-branding-and-moq-guide.pdf` },
  ]

  return (
    <section className="border-y border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-10 md:py-24">
        <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-5 lg:grid-cols-6">
          {/* connector line (desktop) */}
          <span
            className="absolute left-0 top-[22px] hidden h-[3px] w-full rounded-full bg-gradient-to-r from-primary/15 via-aqua/40 to-sun/40 md:block"
            aria-hidden="true"
          />
          {c.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 90} className="relative">
              <div className="relative z-10 flex items-center gap-3 md:block">
                <span className="step-tile h-[44px]! w-[44px]! border-2 border-white bg-white! text-primary shadow-[var(--shadow-md)] ring-4 ring-aqua/20">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < c.steps.length - 1 && (
                  <span className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent md:hidden" aria-hidden="true" />
                )}
              </div>
              <h3 className="mt-4 font-display text-[16.5px] font-bold">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-12">
          <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-primary/20 bg-card p-5 shadow-[var(--shadow-sm)]">
            <span className="icon-tile shrink-0 bg-aqua/10!">
              <PenTool size={18} />
            </span>
            <p className="text-[14px] leading-relaxed text-fg-2">{c.note}</p>
          </div>
        </Reveal>

        <Reveal className="mt-8">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3">
            {deepLinks.map((l) => (
              <a
                key={l.href}
                href={fl(l.href)}
                className="marine-card inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold text-primary"
              >
                {l.label} <ArrowRight size={14} />
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
            {pdfLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-fg-2 transition-colors hover:text-primary"
              >
                {l.label} <FileText size={14} />
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
