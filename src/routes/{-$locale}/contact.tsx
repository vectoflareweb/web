import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Mail, MessageCircle, Clock3, ShieldCheck, FileText, Plus } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getTurnstileSiteKey } from '@/features/auth/middleware'
import type { Locale } from '@/features/i18n/locale'
import { getDictionary, translate, localizePath } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { MarketingShell } from '@/components/marketing/shell'
import { PageHero } from '@/components/marketing/section-head'
import { InquiryForm } from '@/features/inquiry/components/inquiry-form'
import { pick, products } from '@/product/content'
import { dictionaries } from '@/features/i18n/locale'
import { JsonLd, contactPageLd, faqLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { SITE_NAME, BRAND_CONTACT, BRAND_ASSETS_CDN, SITE_URL } from '@/config'

export const Route = createFileRoute('/{-$locale}/contact')({
  validateSearch: (s: Record<string, unknown>) => ({
    product: typeof s.product === 'string' && s.product ? s.product : undefined,
    category: typeof s.category === 'string' && s.category ? s.category : undefined,
  }),
  loader: async () => {
    const [origin, turnstileSiteKey] = await Promise.all([getOrigin(), getTurnstileSiteKey()])
    return { origin, turnstileSiteKey }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const d = getDictionary(locale)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/contact',
      title: translate(d, 'content.seo.contactTitle', { siteName: SITE_NAME }),
      description: translate(d, 'content.seo.contactDesc'),
    })
    return { meta, links }
  },
  component: ContactPage,
})

/** Semantic CTAs across the site deep-link to the contact form via #anchor. */
const INTENT_ANCHORS = ['custom-oem', 'cobranding', 'moq-guide', 'production-availability', 'project-brief'] as const

function ContactPage() {
  const { t, locale } = useTranslation()
  const { turnstileSiteKey } = Route.useLoaderData()
  const { product, category } = Route.useSearch()
  const matched = product ? pick(products, locale).items.find((p) => p.slug === product) : undefined
  const [intent, setIntent] = useState<string | null>(null)

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '')
    const labels = (dictionaries[locale].sup.contact.intentLabels ?? {}) as Record<string, string>
    const anchor = INTENT_ANCHORS.find((a) => a === raw)
    if (anchor && labels[anchor]) {
      setIntent(labels[anchor])
      document.getElementById('quality-inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (raw === 'quality-inquiry' || raw === 'trust-verification') {
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [locale])

  return (
    <MarketingShell>
      <PageHero kicker={t('sup.nav.contact')} title={t('sup.contact.title')} sub={t('sup.contact.subtitle')} />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-7 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        {/* contact info */}
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight">{t('sup.contact.infoTitle')}</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-fg-2">{t('sup.contact.infoBody')}</p>
          <div className="mt-7 flex flex-col gap-4">
            <a
              href={`mailto:${BRAND_CONTACT.email}`}
              className="marine-card flex items-center gap-4 p-5"
            >
              <span className="icon-tile"><Mail size={19} /></span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-fg-3">{t('sup.contact.emailLabel')}</p>
                <p className="mt-0.5 text-[15px] font-semibold">{BRAND_CONTACT.email}</p>
              </div>
            </a>
            <a
              href={BRAND_CONTACT.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="marine-card flex items-center gap-4 p-5"
            >
              <span className="icon-tile"><MessageCircle size={19} /></span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-fg-3">{t('sup.contact.whatsappLabel')}</p>
                <p className="mt-0.5 text-[15px] font-semibold">{BRAND_CONTACT.whatsapp}</p>
              </div>
            </a>
          </div>
          <div className="mt-7 flex flex-col gap-3 rounded-xl border border-border bg-bg-alt p-5 text-[13.5px] text-fg-2">
            <p className="flex items-center gap-2.5">
              <Clock3 size={16} className="shrink-0 text-primary" /> {t('sup.contact.replyPromise')}
            </p>
            <p className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="shrink-0 text-primary" /> {t('sup.contact.ndaNote')}
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-fg-3">{t('sup.contact.afterSubmit')}</p>
            <ul className="mt-3 space-y-2">
              {dictionaries[locale].sup.contact.afterSubmitLines.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-fg-2">
                  <span className="mt-0.5">✓</span> {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* form */}
        <div id="quality-inquiry" className="marine-card h-fit p-6 md:p-8">
          <h2 className="font-display text-xl font-extrabold tracking-tight">{t('sup.contact.formTitle')}</h2>
          <p className="mt-1.5 text-[13px] text-fg-3">{t('sup.contact.formSubtitle')}</p>
          <div className="mt-6">
            <InquiryForm
              turnstileSiteKey={turnstileSiteKey}
              prefill={{
                ...(matched || category ? { name: matched?.name, sku: matched?.sku, category: category ?? matched?.series } : {}),
                ...(intent ? { intent } : {}),
              }}
            />
          </div>
        </div>
      </section>

      <section id="trust-verification" className="mx-auto max-w-6xl px-5 py-16 md:px-7 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">{t('sup.contact.trustTitle')}</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-fg-2">{t('sup.contact.trustSubtitle')}</p>
            <div className="mt-7">
              <a
                href={`${BRAND_ASSETS_CDN}/site/downloads/oem-buyer-trust-and-factory-assurance-guide.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="marine-card flex items-center gap-4 p-5"
              >
                <span className="icon-tile"><FileText size={19} /></span>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-fg-3">{t('sup.contact.trustPdfLink')}</p>
                  <p className="mt-0.5 text-[15px] font-semibold">{t('sup.contact.trustPdfTitle')}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{t('sup.contact.trustPdfDesc')}</p>
                </div>
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-extrabold tracking-tight">{t('sup.contact.trustFaqTitle')}</h3>
            <div className="mt-6 flex flex-col gap-3">
              {dictionaries[locale].sup.contact.trustFaqs.map((item) => (
                <ContactFaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={siteBreadcrumbLd([{ name: t('content.nav.home'), path: '/' }, { name: t('sup.nav.contact'), path: '/contact' }])} />
      <JsonLd data={contactPageLd(SITE_URL, localizePath(locale, '/contact'))} />
      <JsonLd data={faqLd([...dictionaries[locale].sup.contact.trustFaqs], locale)} />

    </MarketingShell>
  )
}

function ContactFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details className="faq-row" open={open} onToggle={() => setOpen((v) => !v)}>
      <summary aria-expanded={open}>
        {q}
        <Plus size={17} className="faq-icon" />
      </summary>
      <div className="faq-body">{a}</div>
    </details>
  )
}
