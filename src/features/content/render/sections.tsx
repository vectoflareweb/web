import { useState, useCallback, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, FileText } from 'lucide-react'
import { PageHero, SectionHead } from '@/components/marketing/section-head'
import { Markdown } from './markdown'
import { brandify } from '../brand'
import { SITE_NAME } from '@/config/site'
import { BRAND_PARENT_URL } from '@/config/branding'
import { ABOUT_BRAND_PATH } from '@/config/navigation'
import { CASE_STUDY_STATS } from '@/product/ai-content'
import { useAferIndex } from '../index-data'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { assetUrl } from '../assets'
import type { ContentPage, ContentSectionDef } from '../types'

/**
 * Generic content section renderer.
 *
 * Content pages are assembled from a registry of sections (key + type), each
 * backed by a value of arbitrary shape in the page YAML. Rendering resolves
 * in three passes: an exact key widget (for bespoke shapes like production
 * flow), the registered section type, then a shape-based fallback — so the
 * same widget set covers every page in the registry.
 */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function Container({ children, narrow = false, className = '' }: { children: ReactNode; narrow?: boolean; className?: string }) {
  return (
    <section className={`mx-auto ${narrow ? 'max-w-3xl' : 'max-w-6xl'} px-5 py-14 md:px-7 md:py-16 ${className}`}>
      {children}
    </section>
  )
}

/* ─────────────────────────── hero ─────────────────────────── */

function HeroWidget({ c }: { c: Record<string, unknown> }) {
  const actions = ctaActions(c)
  return (
    <PageHero kicker={str(c.tagline) || ''} title={brandify(str(c.title) || str(c.headline) || '')} sub={brandify(str(c.subtitle) || str(c.sub) || '')}>
      {actions.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {actions.map((a) => (
            <ActionButton key={a.text} action={a} />
          ))}
        </div>
      )}
    </PageHero>
  )
}

function HeroTextWidget({ c }: { c: Record<string, unknown> }) {
  const actions = ctaActions(c)
  return (
    <PageHero
      kicker={str(c.tagline) || ''}
      title={brandify(str(c.title) || '')}
      sub={brandify(str(c.subtitle) || str(c.sub) || '')}
    >
      {actions.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {actions.map((a) => (
            <ActionButton key={a.text} action={a} />
          ))}
        </div>
      )}
    </PageHero>
  )
}

/* ─────────────────────────── stats ─────────────────────────── */

interface StatItem {
  value?: unknown
  label?: unknown
  detail?: unknown
}

function statItems(c: Record<string, unknown>): StatItem[] {
  for (const key of ['stats', 'highlights', 'rd_numbers']) {
    const v = c[key]
    if (Array.isArray(v)) return v as StatItem[]
    if (isObj(v)) {
      const inner = v[key]
      if (Array.isArray(inner)) {
        return inner.map((it) => {
          const o = it as Record<string, unknown>
          return {
            value: o.amount ?? o.value ?? o.metric,
            label: o.label ?? o.title,
            detail: o.detail,
          }
        })
      }
    }
  }
  return arr(c.stats ?? c.highlights ?? c.rd_numbers).length ? (c.stats ?? c.highlights ?? c.rd_numbers) as StatItem[] : []
}

function StatGrid({ items, heading }: { items: StatItem[]; heading?: Record<string, unknown> }) {
  return (
    <Container>
      {heading && <SectionHead kicker={str(heading.tagline)} title={brandify(str(heading.title) || '')} sub={brandify(str(heading.subtitle) || str(heading.description) || '')} />}
      <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((s) => (
          <div key={String(s.label)} className="marine-card flex flex-col items-center px-4 py-6 text-center">
            <dt className="font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl">{str(s.value)}</dt>
            <dd className="mt-2 text-[13px] font-semibold text-fg-2">{str(s.label)}</dd>
            {s.detail !== undefined && str(s.detail) !== '' && (
              <dd className="mt-1 text-[11.5px] leading-snug text-fg-3">{str(s.detail)}</dd>
            )}
          </div>
        ))}
      </dl>
    </Container>
  )
}

/* ─────────────────────────── FAQ ─────────────────────────── */

interface FaqItem {
  q?: unknown
  a?: unknown
}

function faqItems(c: Record<string, unknown>): FaqItem[] {
  if (Array.isArray(c.questions)) return c.questions as FaqItem[]
  if (Array.isArray(c.faqs)) return c.faqs as FaqItem[]
  if (Array.isArray(c.__raw) && (c.__raw as Record<string, unknown>[]).every((it) => isObj(it) && ('q' in it || 'question' in it))) {
    return (c.__raw as Record<string, unknown>[]).map((it) => ({ q: it.q ?? it.question, a: it.a ?? it.answer }))
  }
  if (Array.isArray(c.items) && c.items.every((it) => isObj(it) && 'q' in it)) return c.items as FaqItem[]
  if (Array.isArray(c.items) && c.items.every((it) => isObj(it) && ('title' in it || 'question' in it))) {
    return (c.items as Record<string, unknown>[]).map((it) => ({ q: it.title ?? it.question, a: it.description ?? it.answer }))
  }
  return []
}

function FaqWidget({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const items = faqItems(c)
  if (items.length === 0) return null
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set([0]))
  const toggleFaq = useCallback((i: number) => {
    setOpenFaqs((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })
  }, [])
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || t('content.fallbackFaq'))} sub={brandify(str(c.subtitle) || str(c.sub) || '')} />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {items.map((f, i) => {
          const slug = String(f.q)
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80)
          const isOpen = openFaqs.has(i)
          return (
            <details key={String(f.q)} id={slug} className="marine-card group px-5 py-4" open={isOpen} onToggle={() => toggleFaq(i)}>
              <summary aria-expanded={isOpen} className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold marker:hidden">
                <span>{brandify(str(f.q))}</span>
                <span className="text-fg-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-fg-2">{brandify(str(f.a))}</p>
            </details>
          )
        })}
      </div>
    </Container>
  )
}

/* ─────────────────────────── CTA ─────────────────────────── */

/** Normalise legacy/redirected content hrefs to live targets ('' = render as a plain card, no link). */
const HREF_REMAP: Record<string, string> = {
  // P1-2: content hubs collapsed onto their keepers — remap so content links
  // never point at a 301'd hub index.
  '/learn': '/knowledge',
  '/academy': '/knowledge',
  '/guides': '/knowledge',
  '/research': '/knowledge',
  '/resources': '/knowledge',
  '/journal': '/news',
  '/media': '/products',
  '/community': '/knowledge',
  '/lifestyle': '/knowledge',
  '/evidence': '/projects',
  '/resources/download-catalog': '/products',
  '/oem-odm': '/oem-manufacturing',
  '/brand/vectoflare': ABOUT_BRAND_PATH,
  '/compare': '/inflatable-vs-hardboard',
  '/compare/inflatable-vs-hardboard': '/inflatable-vs-hardboard',
  '/v2/intermediate-techniques': '/knowledge',
  '/learn/sup': '/knowledge',
  '/learn/drop-stitch-core': '/research/drop-stitch-technology',
  '/learn/inflatable-technology': '/technology',
  '/learn/materials': '/research/pvc-vs-hypalon',
  '/learn/water-safety': '/quality',
  '/inflatable-sup-maintenance': '/knowledge',
  '/guides/paddling-techniques': '/knowledge',
  '/guides/sup-for-touring': '/knowledge',
  '/guides/sup-maintenance': '/knowledge',
  '/guides/sup-size-guide': '/research/sup-thickness-guide',
  '/use-cases/search-and-rescue': `${BRAND_PARENT_URL}/search-and-rescue`,
  // academy skill-path topics without a ported page
  '/sup-basics': '',
  '/paddle-techniques': '',
  '/safety-first': '',
  '/touring-essentials': '',
  '/weather-reading': '',
  '/navigation-basics': '',
  '/tidal-awareness': '',
  '/multi-day-trip-planning': '',
  '/rescue-techniques': '',
  '/night-paddling': '',
  '/cleaning-and-care': '',
  '/storage-guide': '',
  '/repair-basics': '',
  '/valve-maintenance': '',
}

function remapHref(href: string): string {
  const key = href.startsWith('/') ? href : `/${href}`
  return key in HREF_REMAP ? HREF_REMAP[key] : href
}

/** Prefix an internal path with the active locale (client/SSR-safe plain anchors). */
const localize = (path: string, locale: string): string =>
  !path || locale === 'en' || path.startsWith(`/${locale}`) ? path : `/${locale}${path}`

interface CtaAction {
  variant: string
  text: string
  href: string
}

function ctaActions(c: Record<string, unknown>): CtaAction[] {
  return (Array.isArray(c.actions) ? c.actions : [])
    .filter((a): a is R => a !== null && typeof a === 'object')
    .map((a) => ({
      variant: str(a.variant) || 'primary',
      text: str(a.text) || str(a.label) || '',
      href: remapHref(str(a.href) || str(a.link) || ''),
    }))
    .filter((a) => a.text)
}

function ActionButton({ action }: { action: CtaAction }) {
  const { locale } = useTranslation()
  const primary = action.variant === 'primary'
  const cls = `inline-flex h-[48px] items-center gap-2 rounded-full px-8 text-[15px] font-bold transition-transform hover:-translate-y-0.5 ${
    primary ? 'sun-grad shadow-[0_14px_34px_-10px_rgba(255,138,61,0.8)]' : 'border border-white/30 bg-white/10 text-white'
  }`
  const inner = (
    <>
      {action.text} {primary && <ArrowRight size={17} />}
    </>
  )
  if (!action.href) return <a href={localize('/contact', locale)} className={cls}>{inner}</a>
  if (action.href.startsWith('http')) return <a href={action.href} className={cls} target="_blank" rel="noopener noreferrer">{inner}</a>
  if (action.href.includes('?') || action.href.startsWith('#')) return <a href={action.href} className={cls}>{inner}</a>
  return (
    <a href={localize(action.href, locale)} className={`${cls} text-current`}>
      {inner}
    </a>
  )
}

function CtaWidget({ c }: { c: Record<string, unknown> }) {
  const { t, locale } = useTranslation()
  const title = brandify(str(c.title) || str(c.heading) || '')
  const body = brandify(str(c.desc) || str(c.description) || str(c.subtitle) || str(c.sub) || '')
  const label = str(c.label) || str(c.button_text) || str(c.button) || t('content.ctaDefault')
  const actions = ctaActions(c)
  return (
    <Container className="pb-20">
      <div className="ocean-grad relative overflow-hidden rounded-[32px] px-6 py-14 text-center shadow-[var(--shadow-lg)] md:px-12">
        <h2 className="mx-auto max-w-2xl font-display text-2xl font-extrabold leading-[1.15] tracking-tight text-white md:text-3xl">{title}</h2>
        {body && <p className="fg-dim mx-auto mt-4 max-w-xl text-[15px] leading-relaxed">{body}</p>}
        {actions.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions.map((a) => (
              <ActionButton key={a.text} action={a} />
            ))}
          </div>
        ) : (
          <a
            href={localize('/contact', locale)}
            className="sun-grad mx-auto mt-8 inline-flex h-[48px] items-center gap-2 rounded-full px-8 text-[15px] font-bold shadow-[0_14px_34px_-10px_rgba(255,138,61,0.8)] transition-transform hover:-translate-y-0.5"
          >
            {label} <ArrowRight size={17} />
          </a>
        )}
      </div>
    </Container>
  )
}

/* ─────────────────────────── feature cards ─────────────────────────── */

interface CardItem {
  title?: unknown
  desc?: unknown
  description?: unknown
  body?: unknown
  subtitle?: unknown
  image?: unknown
  alt?: unknown
  icon?: unknown
  icon_bg?: unknown
  href?: unknown
  link?: unknown
  link_label?: unknown
}

function cardItems(c: Record<string, unknown>): CardItem[] {
  if (Array.isArray(c.items)) return c.items as CardItem[]
  if (Array.isArray(c.cards)) return c.cards as CardItem[]
  if (Array.isArray(c.features)) return c.features as CardItem[]
  if (Array.isArray(c.workshops)) return c.workshops as CardItem[]
  if (Array.isArray(c.values)) return c.values as CardItem[]
  if (Array.isArray(c.projects)) return c.projects as CardItem[]
  if (Array.isArray(c.services)) return c.services as CardItem[]
  if (Array.isArray(c.labs)) return c.labs as CardItem[]
  return []
}

const ICON_HUE: Record<string, string> = {
  blue: 'bg-sky-500/15 text-sky-600',
  green: 'bg-emerald-500/15 text-emerald-600',
  purple: 'bg-violet-500/15 text-violet-600',
  orange: 'bg-orange-500/15 text-orange-600',
}

function FeatureGrid({ c, grid: gridProp = 'sm:grid-cols-2 lg:grid-cols-3' }: { c: Record<string, unknown>; grid?: string }) {
  const { locale } = useTranslation()
  const items = cardItems(c)
  const grid = str(c.grid) || gridProp
  if (items.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || str(c.description) || str(c.sub) || '')} />
      <div className={`mt-10 grid gap-5 ${grid}`}>
        {items.map((it) => {
          const body = brandify(str(it.desc) || str(it.description) || str(it.body) || str(it.subtitle) || '')
          const href = remapHref(str(it.href) || str(it.link) || '')
          const fragment =
            href.startsWith('#') || href.includes('?') || href.startsWith('http') || href.startsWith('/downloads/') || href.startsWith('/assets/')
          const image = assetUrl(str(it.image))
          const icon = str(it.icon)
          const card = (
            <div className="marine-card flex h-full flex-col p-6">
              {image && (
                <img src={image} alt={str(it.alt) || str(it.title)} width={800} height={600} loading="lazy" decoding="async" className="mb-4 aspect-[4/3] w-full rounded-xl border border-border-2 object-cover" />
              )}
              {icon && (
                <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl font-display text-lg font-extrabold ${ICON_HUE[str(it.icon_bg)] ?? (icon.length === 1 ? (ICON_HUE[icon.toLowerCase()] ?? 'bg-soft text-primary') : 'bg-soft text-primary')}`}>
                  {icon.length === 1 ? icon : <Check size={18} />}
                </span>
              )}
              <h3 className="font-display text-[17px] font-bold">{brandify(str(it.title) || '')}</h3>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
              {it.link_label !== undefined && href && (
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                  {str(it.link_label)} <ArrowRight size={14} />
                </span>
              )}
            </div>
          )
          return href ? (
            href.startsWith('http') ? (
              <a key={String(it.title)} href={href} className="group text-current" target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            ) : fragment ? (
              <a key={String(it.title)} href={href} className="group text-current">
                {card}
              </a>
            ) : (
              <a key={String(it.title)} href={localize(href, locale)} className="group text-current">
                {card}
              </a>
            )
          ) : (
            <div key={String(it.title)}>{card}</div>
          )
        })}
      </div>
    </Container>
  )
}

/* ─────────────────────────── steps ─────────────────────────── */

interface StepItem {
  step?: unknown
  num?: unknown
  stage?: unknown
  title?: unknown
  desc?: unknown
  description?: unknown
  subtitle?: unknown
}

function StepsWidget({ c }: { c: Record<string, unknown> }) {
  const raw = Array.isArray(c.steps) ? c.steps : Array.isArray(c.stages) ? c.stages : []
  if (raw.length === 0) return null
  const steps = raw as StepItem[]
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || str(c.description) || '')} />
      <ol className="mx-auto mt-10 max-w-3xl space-y-6">
        {steps.map((s, i) => (
          <li key={String(s.stage || s.title)} className="marine-card flex gap-4 px-5 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-[15px] font-extrabold text-primary">
              {str(s.step) || str(s.num) || str(s.stage) || String(i + 1)}
            </span>
            <div>
              <h3 className="font-display text-[16px] font-bold">{brandify(str(s.title) || '')}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(s.desc) || str(s.description) || str(s.subtitle) || '')}</p>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  )
}

/* ─────────────────────────── bespoke widgets ─────────────────────────── */

function ProductionFlow({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const stages = arr(c.stages) as Record<string, unknown>[]
  if (stages.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mx-auto mt-10 max-w-4xl space-y-5">
        {stages.map((s) => (
          <div key={String(s.stage)} className="marine-card p-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-extrabold text-primary/40">{str(s.stage)}</span>
              <h3 className="font-display text-[17px] font-bold">{brandify(str(s.title))}</h3>
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">{brandify(str(s.description))}</p>
            <dl className="mt-4 grid gap-2 text-[12.5px] leading-relaxed md:grid-cols-3">
              <div className="rounded-lg bg-bg-alt p-3">
                <dt className="font-bold uppercase tracking-wide text-fg-3">{t('content.qcCheck')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(s.qc_check))}</dd>
              </div>
              <div className="rounded-lg bg-bg-alt p-3">
                <dt className="font-bold uppercase tracking-wide text-fg-3">{t('content.threshold')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(s.qc_threshold))}</dd>
              </div>
              <div className="rounded-lg bg-bg-alt p-3">
                <dt className="font-bold uppercase tracking-wide text-fg-3">{t('content.responsibility')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(s.responsibility))}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Container>
  )
}

/* ─────────────────────── 7-stage QC flow ─────────────────────── */

/**
 * Seven-stage quality control flow (per-project inspection plan). Each stage
 * card pairs a factory photo with the four blocks a buyer audits — inspection
 * object, method, acceptance criteria and record output — plus a download
 * link to the bilingual report dossier. `/downloads/*` and `/assets/*` hrefs
 * are static files and must not be locale-prefixed.
 */
function QcFlowWidget({ c }: { c: Record<string, unknown> }) {
  const { locale, t } = useTranslation()
  const stages = arr(c.stages) as Record<string, unknown>[]
  if (stages.length === 0) return null
  const objLabel = str(c.obj_label) || 'Inspection object'
  const methodLabel = str(c.method_label) || 'Inspection method'
  const criteriaLabel = str(c.criteria_label) || 'Acceptance criteria'
  const recordLabel = str(c.record_label) || 'Record output'
  const linkHref = (href: string): string =>
    href.startsWith('http') || href.startsWith('#') || href.includes('?') || href.startsWith('/downloads/') || href.startsWith('/assets/')
      ? href
      : localize(href, locale)
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mx-auto mt-10 max-w-4xl space-y-6">
        {stages.map((s) => {
          const image = assetUrl(str(s.image))
          const href = str(s.link)
          const external = href.startsWith('http')
          return (
            <div key={String(s.stage)} className="marine-card overflow-hidden p-0">
              <div className="grid md:grid-cols-[260px_1fr]">
                {image && (
                  <img
                    src={image}
                    alt={str(s.alt) || str(s.title) || ''}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-52 w-full border-b border-border-2 object-cover md:h-full md:border-b-0 md:border-r"
                  />
                )}
                <div className="flex flex-col p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="pill border-primary/25! bg-soft! text-primary!">{str(s.stage)}</span>
                    <h3 className="font-display text-[17px] font-bold">{brandify(str(s.title) || '')}</h3>
                  </div>
                  {str(s.summary) && <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(s.summary))}</p>}
                  {arr(s.checks).length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-[12.5px] leading-relaxed text-fg-2">
                      {arr(s.checks).map((chk) => (
                        <li key={String(chk)} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                          <span>{brandify(str(chk))}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <dl className="mt-4 grid gap-2.5 text-[12.5px] leading-relaxed sm:grid-cols-2">
                    {[
                      [objLabel, str(s.object)],
                      [methodLabel, str(s.method)],
                      [criteriaLabel, str(s.criteria)],
                      [recordLabel, str(s.record)],
                    ].map(
                      ([label, value]) =>
                        value && (
                          <div key={label} className="rounded-lg bg-bg-alt p-3">
                            <dt className="font-bold uppercase tracking-wide text-fg-3">{label}</dt>
                            <dd className="mt-1 text-fg-2">{brandify(value)}</dd>
                          </div>
                        ),
                    )}
                  </dl>
                  {href && (
                    <a
                      href={linkHref(href)}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2 text-[13px] font-bold text-primary transition-colors hover:bg-primary/10"
                    >
                      <FileText size={15} />
                      {str(s.link_label) || t('content.downloadReport')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

function OemCases({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const cases = arr(c.cases) as Record<string, unknown>[]
  if (cases.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {cases.map((cs) => (
          <div key={String(cs.challenge)} className="marine-card flex flex-col p-6">
            <dl className="flex-1 space-y-4 text-[13px] leading-relaxed">
              <div>
                <dt className="font-bold uppercase tracking-wide text-primary">{t('content.challenge')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(cs.challenge))}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-primary">{t('content.solution')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(cs.solution))}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-primary">{t('content.result')}</dt>
                <dd className="mt-1 text-fg-2">{brandify(str(cs.result))}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Container>
  )
}

function WorkforceWidget({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const departments = arr(c.departments) as Record<string, unknown>[]
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} />
      <div className="mx-auto mt-8 max-w-3xl space-y-3 text-[14px] leading-relaxed text-fg-2">
        {str(c.engineers_detail) && <p>{brandify(str(c.engineers_detail))}</p>}
        {str(c.shift_pattern) && <p>{brandify(str(c.shift_pattern))}</p>}
        {str(c.training) && <p>{brandify(str(c.training))}</p>}
      </div>
      {departments.length > 0 && (
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-bg-alt text-[12px] uppercase tracking-wide text-fg-3">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">{t('content.department')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('content.people')}</th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">{t('content.role')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((d) => (
                <tr key={String(d.name)}>
                  <td className="px-4 py-3 font-semibold">{brandify(str(d.name))}</td>
                  <td className="px-4 py-3 text-fg-2">{str(d.count)}</td>
                  <td className="hidden px-4 py-3 text-fg-2 md:table-cell">{brandify(str(d.role))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

function TraceabilityWidget({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const suppliers = arr(c.suppliers) as Record<string, unknown>[]
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.description) || '')} />
      <div className="mx-auto mt-8 max-w-3xl space-y-3 text-[14px] leading-relaxed text-fg-2">
        {str(c.system) && <p><span className="font-semibold text-foreground">{t('content.system')}:</span> {brandify(str(c.system))}</p>}
        {str(c.coverage) && <p><span className="font-semibold text-foreground">{t('content.coverage')}:</span> {brandify(str(c.coverage))}</p>}
        {str(c.records_retained) && <p><span className="font-semibold text-foreground">{t('content.recordsRetained')}:</span> {brandify(str(c.records_retained))}</p>}
      </div>
      {suppliers.length > 0 && (
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-bg-alt text-[12px] uppercase tracking-wide text-fg-3">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">{t('content.material')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('content.source')}</th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">{t('content.certified')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((s) => (
                <tr key={String(s.material)}>
                  <td className="px-4 py-3 font-semibold">{brandify(str(s.material))}</td>
                  <td className="px-4 py-3 text-fg-2">{brandify(str(s.source))}</td>
                  <td className="hidden px-4 py-3 text-fg-2 md:table-cell">{brandify(str(s.certified))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

function EquipmentWidget({ c }: { c: Record<string, unknown> }) {
  const items = Array.isArray(c.__raw) ? (c.__raw as Record<string, unknown>[]) : (arr(c.items) as Record<string, unknown>[])
  if (items.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} />
      <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-[13.5px]">
          <tbody className="divide-y divide-border">
            {items.map((it) => (
              <tr key={String(it.name)}>
                <td className="px-4 py-3.5 font-semibold">{brandify(str(it.name))}</td>
                <td className="px-4 py-3.5 text-fg-2">{brandify(str(it.spec))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}

function IntelligenceCards({ c }: { c: Record<string, unknown> }) {
  const { locale, t } = useTranslation()
  // Accept both shapes: an object with a `cards` array (e.g. the /quality
  // documentation section) and a bare card array (factory page), which the
  // dispatcher wraps as `{ __raw: [...] }`.
  const cards = (Array.isArray(c.__raw) ? (c.__raw as Record<string, unknown>[]) : arr(c.cards)) as Record<string, unknown>[]
  if (cards.length === 0) return null
  const title = str(c.title)
  return (
    <Container>
      {title && <SectionHead kicker={str(c.tagline)} title={brandify(title)} sub={brandify(str(c.subtitle) || '')} />}
      <div className={`grid gap-5 md:grid-cols-3 ${title ? 'mt-10' : ''}`}>
        {cards.map((card) => (
          <div key={String(card.title)} className="marine-card flex flex-col p-6">
            <span className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl font-display text-lg font-extrabold ${ICON_HUE[str(card.icon_bg)] ?? 'bg-soft text-primary'}`}>
              {str(card.icon) || '✦'}
            </span>
            <h3 className="font-display text-[17px] font-bold">{brandify(str(card.title))}</h3>
            <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(card.desc))}</p>
            {Array.isArray(card.metrics) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(card.metrics as Record<string, unknown>[]).map((m) => (
                  <span key={String(m.label)} className="rounded-md bg-soft px-2 py-1 text-[11.5px] font-bold text-primary">
                    {str(m.label)}: {str(m.value)}
                  </span>
                ))}
              </div>
            )}
            {str(card.link) && (
              str(card.link).startsWith('http')
                ? <a href={str(card.link)} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary" target="_blank" rel="noopener noreferrer">
                    {str(card.link_label) || t('content.learnMore')} <ArrowRight size={14} />
                   </a>
                : (str(card.link).startsWith('#') || str(card.link).includes('?') || str(card.link).startsWith('/downloads/') || str(card.link).startsWith('/assets/'))
                  ? <a href={str(card.link)} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                      {str(card.link_label) || t('content.learnMore')} <ArrowRight size={14} />
                     </a>
                  : <a href={localize(str(card.link), locale)} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                      {str(card.link_label) || t('content.learnMore')} <ArrowRight size={14} />
                    </a>
            )}
          </div>
        ))}
      </div>
    </Container>
  )
}

function TestimonialsWidget({ c }: { c: Record<string, unknown> }) {
  const items = arr(c.testimonials ?? c.stories ?? c.items) as Record<string, unknown>[]
  if (items.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure key={String(t.quote || t.author)} className="marine-card flex flex-col p-6">
            <blockquote className="flex-1 text-[14px] leading-relaxed text-fg-2">
              “{brandify(str(t.quote) || str(t.body) || str(t.text) || '')}”
            </blockquote>
            <figcaption className="mt-4 border-t border-border pt-3">
              <div className="text-[14px] font-bold">{brandify(str(t.author) || str(t.name) || '')}</div>
              <div className="text-[12.5px] text-fg-3">{brandify(str(t.role) || str(t.company) || str(t.title) || '')}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  )
}

function BlogLatest({ c }: { c: Record<string, unknown> }) {
  const limit = typeof c.limit === 'number' && c.limit > 0 ? c.limit : 6
  const { t, locale } = useTranslation()
  const { news = [] } = useAferIndex()
  const posts = news.slice(0, limit)
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || t('content.fallbackLatestNews'))} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <a key={p.slug} href={localize(`/news/${p.slug}`, locale)} className="marine-card group flex h-full flex-col overflow-hidden p-0">
            {p.image && (
              <img src={p.image} alt={p.title} width={1600} height={900} loading="lazy" decoding="async" className="aspect-[16/9] w-full border-b border-border-2 object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-fg-3">
                {p.category && <span className="pill border-primary/25! bg-soft! text-primary!">{p.category}</span>}
                <span>{p.date.slice(0, 10)}</span>
              </div>
              <h3 className="mt-2.5 font-display text-[16px] font-bold leading-snug">{p.title}</h3>
              {p.excerpt && <p className="mt-2 flex-1 text-[13px] leading-relaxed text-fg-2">{p.excerpt}</p>}
            </div>
          </a>
        ))}
      </div>
    </Container>
  )
}

function FeaturedProducts({ c }: { c: Record<string, unknown> }) {
  const { t, locale } = useTranslation()
  const { products = [] } = useAferIndex()
  const items = products.slice(0, 8)
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || t('content.fallbackFeaturedProducts'))} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <a key={p.slug} href={localize(`/products/${p.slug}`, locale)} className="marine-card group flex h-full flex-col overflow-hidden p-0">
            {p.image && (
              <img src={p.image} alt={p.title} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full border-b border-border-2 object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <span className="pill self-start border-primary/25! bg-soft! text-primary!">{p.sku}</span>
              <h3 className="mt-2.5 font-display text-[16px] font-bold">{p.title}</h3>
              {p.summary && <p className="mt-2 flex-1 text-[13px] leading-relaxed text-fg-2">{p.summary}</p>}
            </div>
          </a>
        ))}
      </div>
    </Container>
  )
}

function TopicList({ c }: { c: Record<string, unknown> }) {
  const { locale } = useTranslation()
  const { topics = [] } = useAferIndex()
  const heading = c.heading || c.title
  return (
    <Container>
      {str(c.badge) && <SectionHead kicker={str(c.badge)} title={brandify(str(heading) || '')} sub={brandify(str(c.description) || '')} />}
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {topics.map((t) => (
          <a key={t.slug} href={localize(`/research/${t.slug}`, locale)} className="marine-card flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <h3 className="font-display text-[15px] font-bold">{t.slug.replace(/-/g, ' ')}</h3>
              <p className="mt-1 text-[12px] font-semibold text-fg-3">{t.category} · {t.readTime}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-primary" />
          </a>
        ))}
      </div>
    </Container>
  )
}

function CaseList() {
  const { locale, t } = useTranslation()
  const { cases = [] } = useAferIndex()
  return (
    <Container>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        {cases.map((c) => (
          <a key={c.slug} href={localize(`/evidence/case-studies/${c.slug}`, locale)} className="marine-card group flex h-full flex-col p-6">
            <span className="pill self-start border-primary/25! bg-soft! text-primary!">{c.category}</span>
            <h3 className="mt-3 font-display text-[17px] font-bold">{c.title}</h3>
            {c.summary && <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{c.summary}</p>}
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-primary">
              {t('content.readCaseStudy')} <ArrowRight size={14} />
            </span>
          </a>
        ))}
      </div>
    </Container>
  )
}

/* ─────────────────────── cases (features3_cases) ─────────────────────── */

function CaseCardsWidget({ c }: { c: Record<string, unknown> }) {
  const items = arr(c.items) as Record<string, unknown>[]
  if (items.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={String(it.title)} className="marine-card flex h-full flex-col p-6">
            {str(it.image) && <img src={assetUrl(str(it.image))} alt={str(it.alt) || str(it.title)} width={1600} height={900} loading="lazy" decoding="async" className="mb-4 aspect-[16/9] w-full rounded-xl border border-border-2 object-cover" />}
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-fg-3">
              {str(it.industry) && <span className="pill border-primary/25! bg-soft! text-primary!">{str(it.industry)}</span>}
              {str(it.country) && <span>{str(it.country)}</span>}
            </div>
            <h3 className="mt-3 font-display text-[17px] font-bold">{brandify(str(it.title))}</h3>
            {str(it.customer) && <p className="mt-1 text-[12.5px] font-semibold text-fg-3">{brandify(str(it.customer))}</p>}
            {str(it.challenge) && <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(it.challenge))}</p>}
            {str(it.quote) && <blockquote className="mt-4 border-t border-border pt-3 text-[12.5px] italic leading-relaxed text-fg-3">“{brandify(str(it.quote))}”</blockquote>}
          </div>
        ))}
      </div>
    </Container>
  )
}

/* ─────────────────────── academy categories + knowledge ─────────────────────── */

/**
 * Dispatches the `categories` section key by shape:
 * - factory-equipment: array of { title, items: [{ name, spec, desc }] }
 * - size-guide: object map of category → description (inflatable / sup / accessory)
 * - academy/knowledge: array of { level, guides } (legacy AcademyCategories)
 */
function CategoriesWidget({ c }: { c: Record<string, unknown> }) {
  const raw = (arr(c.__raw).length ? arr(c.__raw) : arr(c.categories ?? c.items)) as Record<string, unknown>[]
  if (raw.length > 0) {
    const first = raw[0]
    if (first && typeof first === 'object' && Array.isArray(first.guides)) return <AcademyCategories c={c} />
    if (first && typeof first === 'object' && Array.isArray(first.items)) return <EquipmentCategories c={{ categories: raw }} />
  }
  const map = Object.entries(c).filter(([, v]) => typeof v === 'string')
  if (map.length > 0) return <CategoryBlurbs c={{ items: map.map(([title, description]) => ({ title, description })) }} />
  return null
}

function EquipmentCategories({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const cats = arr(c.categories) as Record<string, unknown>[]
  if (cats.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || t('content.fallbackEquipment'))} />
      <div className="mt-10 space-y-10">
        {cats.map((cat) => {
          const items = arr(cat.items) as Record<string, unknown>[]
          return (
            <div key={String(cat.title)}>
              <h3 className="font-display text-lg font-extrabold">{brandify(str(cat.title) || '')}</h3>
              <div className="mt-4 space-y-4">
                {items.map((it) => (
                  <div key={String(it.name)} className="marine-card p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="font-display text-[15px] font-bold">{brandify(str(it.name) || '')}</h4>
                      {str(it.spec) && <span className="text-[12px] font-semibold uppercase tracking-wide text-primary">{brandify(str(it.spec))}</span>}
                    </div>
                    {str(it.desc) && <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(it.desc))}</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

function CategoryBlurbs({ c }: { c: Record<string, unknown> }) {
  const items = arr(c.items) as Record<string, unknown>[]
  if (items.length === 0) return null
  return (
    <Container>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <div key={String(it.title)} className="marine-card p-6">
            <h3 className="font-display text-[17px] font-bold capitalize">{brandify(str(it.title) || '')}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(it.description) || '')}</p>
          </div>
        ))}
      </div>
    </Container>
  )
}

function SizeTableWidget({ c }: { c: Record<string, unknown> }) {
  const headers = (isObj(c.headers) ? c.headers : {}) as Record<string, unknown>
  const rows = arr(c.rows) as Record<string, unknown>[]
  const keys = (isObj(c.headers) ? Object.keys(c.headers) : []) as string[]
  if (keys.length === 0 || rows.length === 0) return null
  return (
    <Container>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-soft/60">
              {keys.map((k) => (
                <th key={k} scope="col" className="px-4 py-3 font-display text-[12.5px] font-extrabold uppercase tracking-wide text-fg-2">
                  {brandify(str(headers[k]))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={String(row[keys[0]]) || i} className="align-top">
                {keys.map((k) => (
                  <td key={k} className="px-4 py-3.5 font-semibold text-fg-2">
                    {brandify(str(row[k]))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}

/* ─────────────────────── rework decision flow ─────────────────────── */

const FLOW_STYLES: Record<string, string> = {
  start: 'bg-sky-500/15 text-sky-600',
  step: 'bg-primary/12 text-primary',
  decision: 'bg-amber-500/15 text-amber-600',
  release: 'bg-emerald-500/15 text-emerald-600',
  escalate: 'bg-rose-500/15 text-rose-600',
}

const FLOW_TAG: Record<string, string> = {
  start: 'Start',
  step: 'Controlled step',
  decision: 'Decision',
  release: 'Release',
  escalate: 'Escalate',
}

const FLOW_BADGE: Record<string, string> = {
  start: '!',
  decision: '?',
  release: '\u2713',
  escalate: '\u2715',
}

/**
 * Interactive rework decision flowchart: each node expands its control
 * requirements on click; decision nodes show the yes/no routing against the
 * following steps. Backed by `nodes: [{ id, type, label, detail, yes?, no? }]`.
 */
function ReworkDecisionWidget({ c }: { c: Record<string, unknown> }) {
  const [open, setOpen] = useState(0)
  const raw = arr(c.nodes) as Record<string, unknown>[]
  if (raw.length === 0) return null
  const labels = new Map(raw.map((n, i) => [str(n.id) || String(i), str(n.label)]))
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mx-auto mt-10 max-w-3xl">
        {raw.map((n, i) => {
          const type = FLOW_STYLES[str(n.type)] ? str(n.type) : 'step'
          const expanded = open === i
          const decision = type === 'decision'
          const yesLabel = labels.get(str(n.yes))
          const noLabel = labels.get(str(n.no))
          return (
            <div key={String(n.id || n.label)}>
              {i > 0 && (
                <div className="flex justify-center py-1.5">
                  <ChevronDown size={16} className="text-fg-3" />
                </div>
              )}
              <div className="marine-card overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? -1 : i)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-extrabold ${FLOW_STYLES[type] ?? FLOW_STYLES.step}`}>
                    {type === 'step' ? String(i + 1) : (FLOW_BADGE[type] ?? '•')}
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-[15.5px] font-bold">{brandify(str(n.label) || '')}</span>
                    <span className={`mt-0.5 block text-[11px] font-bold uppercase tracking-[0.12em] ${type === 'step' ? 'text-fg-3' : 'text-inherit'}`}>
                      {FLOW_TAG[type] ?? 'Step'}
                    </span>
                  </span>
                  <ChevronDown size={17} className={`shrink-0 text-fg-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                  <div className="border-t border-border px-5 py-4">
                    <p className="text-[13.5px] leading-relaxed text-fg-2">{brandify(str(n.detail) || '')}</p>
                    {decision && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
                          Yes → {brandify(yesLabel ?? '')}
                        </span>
                        <span className="rounded-md bg-rose-500/15 px-2.5 py-1 text-[12px] font-bold text-rose-600">
                          No → {brandify(noLabel ?? '')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

function AcademyCategories({ c }: { c: Record<string, unknown> }) {
  const { locale, t } = useTranslation()
  const cats = (arr(c.__raw).length ? arr(c.__raw) : arr(c.categories ?? c.items)) as Record<string, unknown>[]
  if (cats.length === 0) return null
  return (
    <Container>
      <SectionHead
        kicker={str(c.tagline) || t('content.learningPaths')}
        title={t('content.skillPaths')}
        sub={t('inquiry.skillPathsSub')}
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {cats.map((cat) => {
          const guides = arr(cat.guides) as Record<string, unknown>[]
          return (
            <div key={String(cat.level)} className="marine-card flex h-full flex-col p-6">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-soft font-display text-sm font-extrabold text-primary`}>
                  {String(str(cat.level).charAt(0)) || '?'}
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-bold">{brandify(str(cat.level) || '')} {t('content.nav.guides')}</h3>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {guides.map((g) => {
                  const href = remapHref(str(g.href || g.slug))
                  const card = (
                    <div className="rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/40">
                      <div className="text-[14px] font-bold">{brandify(str(g.title))}</div>
                      {str(g.desc) && <p className="mt-1 text-[12.5px] leading-relaxed text-fg-3">{brandify(str(g.desc))}</p>}
                    </div>
                  )
                  return href ? (
                    <a key={String(g.title)} href={localize(href, locale)} className="group block rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/40">
                      <div className="text-[14px] font-bold">{brandify(str(g.title))}</div>
                      {str(g.desc) && <p className="mt-1 text-[12.5px] leading-relaxed text-fg-3">{brandify(str(g.desc))}</p>}
                    </a>
                  ) : (
                    <div key={String(g.title)}>{card}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

function AcademyKnowledge({ c }: { c: Record<string, unknown> }) {
  const { locale, t } = useTranslation()
  const sections = (arr(c.__raw).length ? arr(c.__raw) : arr(c.sections ?? c.items)) as Record<string, unknown>[]
  if (sections.length === 0) return null
  return (
    <Container>
      <SectionHead
        kicker={t('content.knowledgeCenter')}
        title={t('content.knowledgeCenter')}
        sub={t('inquiry.knowledgeCenterSub')}
      />
      <div className="mt-10 space-y-10">
        {sections.map((sec) => {
          const guides = arr(sec.guides) as Record<string, unknown>[]
          return (
            <div key={String(sec.title)}>
              <h3 className="font-display text-xl font-extrabold">{brandify(str(sec.title) || '')}</h3>
              {str(sec.desc) && <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-fg-3">{brandify(str(sec.desc))}</p>}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {guides.map((g) => {
                  const href = remapHref(str(g.href))
                  const card = (
                    <div className="marine-card flex h-full flex-col p-5">
                      <h4 className="font-display text-[14px] font-bold">{brandify(str(g.title))}</h4>
                      {str(g.desc) && <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-fg-3">{brandify(str(g.desc))}</p>}
                      <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-primary">
                        {t('content.readGuide')} <ArrowRight size={13} />
                      </span>
                    </div>
                  )
                  return href ? (
                    <a key={String(g.title)} href={localize(href, locale)} className="marine-card group flex h-full flex-col p-5">
                      <h4 className="font-display text-[14px] font-bold">{brandify(str(g.title))}</h4>
                      {str(g.desc) && <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-fg-3">{brandify(str(g.desc))}</p>}
                      <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-primary">
                        {t('content.readGuide')} <ArrowRight size={13} />
                      </span>
                    </a>
                  ) : (
                    <div key={String(g.title)}>{card}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

/* ─────────────────────────── html + prose ─────────────────────────── */function HtmlWidget({ html }: { html: string }) {
  return (
    <Container narrow>
      <div
        className="prose prose-neutral max-w-none dark:prose-invert [&_h2]:mt-10 [&_h3]:mt-8 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_th]:border [&_th]:p-3 [&_td]:border [&_td]:p-3 [&_ol]:list-decimal [&_ul]:list-disc [&_li]:pl-1"
        dangerouslySetInnerHTML={{ __html: brandify(html) }}
      />
    </Container>
  )
}

function ProseWidget({ text }: { text: string }) {
  return (
    <Container narrow>
      <Markdown text={brandify(text)} />
    </Container>
  )
}

/* ─────────────────────────── dispatcher ─────────────────────────── */

/**
 * Adapters for the ported content solution / OEM pages. Those YAML files keep
 * content's section shapes (packages, roi_section, benefits, ...), which differ
 * from the supported widget schemas — these adapters normalise them onto the
 * existing FeatureGrid / StatGrid / StepsWidget / TestimonialsWidget primitives.
 */

type R = Record<string, unknown>

const itemsOf = (c: R): R[] => (Array.isArray(c.items) ? c.items : [])

function portedFeatureCards(c: R): CardItem[] {
  return itemsOf(c)
    .filter((it): it is R => it !== null && typeof it === 'object')
    .map((it) => {
      const discount = str(it.discount) ? `${str(it.discount)} wholesale` : ''
      const moq = str(it.moq) ? `MOQ ${str(it.moq)}` : ''
      const rawHref = str(it.link) || str(it.href) || ''
      const href = remapHref(rawHref)
      return {
        title: str(it.title) || str(it.name) || str(it.tier) || '',
        desc: [
          str(it.description) || str(it.desc) || '',
          str(it.tagline) || '',
          ...arr(it.features).map(str),
          str(it.revenue) || '',
          discount,
          moq,
          str(it.margin_note) || '',
        ]
          .filter(Boolean)
          .join(' · '),
        href,
        icon: str(it.icon),
      }
    })
}

function PortedFeatureGrid({ c, grid }: { c: R; grid?: string }) {
  return <FeatureGrid c={{ ...c, items: portedFeatureCards(c) }} grid={grid} />
}

function PortedRoiSection({ c }: { c: R }) {
  return (
    <StatGrid
      items={(arr(c.metrics) as R[]).map((m) => ({ value: m.metric, label: m.label, detail: m.detail }))}
      heading={c}
    />
  )
}

function PortedBenefits({ c }: { c: R }) {
  const items = itemsOf(c)
  if (items.length === 0 || typeof items[0] !== 'object') return <ContentWidget c={c} />
  if (items.some((it) => it.metric !== undefined)) {
    return <StatGrid items={items.map((m) => ({ value: m.metric, label: m.label, detail: m.detail }))} heading={c} />
  }
  return <PortedFeatureGrid c={c} />
}

function PortedCaseStudy({ c }: { c: R }) {
  const { t } = useTranslation()
  return (
    <TestimonialsWidget
      c={{
        title: str(c.title) || t('content.fallbackClientResult'),
        subtitle: c.subtitle,
        items: [{ quote: c.quote, author: c.author, role: c.location }],
      }}
    />
  )
}

function PortedProcess({ c }: { c: R }) {
  const steps = (Array.isArray(c.steps) ? c.steps : []).map((s) => ({
    step: str((s as R).phase) || str((s as R).step),
    title: str((s as R).title) || '',
    desc: [str((s as R).period), ...arr((s as R).items).map(str)].filter(Boolean).join(' · '),
  }))
  return <StepsWidget c={{ title: c.title, subtitle: c.subtitle, steps }} />
}

function PortedFleetGuide({ c }: { c: R }) {
  const steps = (Array.isArray(c.tiers) ? c.tiers : []).map((t) => ({
    step: '',
    title: str((t as R).label) || '',
    desc: [str((t as R).boards) && `${str((t as R).boards)} boards`, str((t as R).note)].filter(Boolean).join(' · '),
  }))
  return <StepsWidget c={{ title: c.title, subtitle: c.subtitle, steps }} />
}

function PortedCoverage({ c }: { c: R }) {
  const items = (Array.isArray(c.regions) ? c.regions : []).map((r) => ({
    title: str((r as R).name) || '',
    desc: str((r as R).countries) || '',
  }))
  return <FeatureGrid c={{ ...c, items }} />
}

function PortedSolutionsMatrix({ c }: { c: R }) {
  const items = itemsOf(c).map((it) => ({
    title: str(it.clientType) || '',
    desc: [str(it.need), str(it.solutionPage)].filter(Boolean).join(' — '),
  }))
  return <FeatureGrid c={{ ...c, items }} />
}

function GeoWidget({ c }: { c: R }) {
  const { t } = useTranslation()
  const audiences = arr(c.audiences).map(str).filter(Boolean)
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={str(c.title) || t('content.fallbackB2bPositioning')} sub={str(c.sentence) || str(c.subtitle) || ''} />
      {audiences.length > 0 && (
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {audiences.map((a) => (
            <span key={a} className="pill border-primary/25! bg-soft! text-primary!">
              {a}
            </span>
          ))}
        </div>
      )}
    </Container>
  )
}

function BuyerGuidesWidget({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const items = arr(c.items)
  if (items.length === 0) return null
  const fl = useLocalizePath()
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={str(c.title) || t('content.fallbackBuyersGuides')} sub={str(c.subtitle)} />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => {
          const o = it as Record<string, unknown>
          const href = str(o.href)
          if (!href) return null
          return (
            <a
              key={href}
              href={fl(href)}
              className="marine-card group flex h-full flex-col justify-between gap-6 p-6"
            >
              <div>
                <h3 className="font-display text-[17px] font-bold leading-snug">{str(o.title)}</h3>
                <p className="mt-2 text-[13px] leading-snug text-fg-2">{str(o.body)}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                {t('content.readTheGuide')}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          )
        })}
      </div>
    </Container>
  )
}

/* ─────────────────────── facts (key-value pairs) ─────────────────────── */

const FACTS_LABELS: Record<string, Record<string, string>> = {
  moq: { en: 'MOQ', es: 'Cantidad mínima de pedido' },
  lead_time: { en: 'Lead time', es: 'Plazo de entrega' },
  payment: { en: 'Payment terms', es: 'Condiciones de pago' },
  capacity: { en: 'Annual capacity', es: 'Capacidad anual' },
  shipping: { en: 'Shipping', es: 'Envío' },
}

function FactsWidget({ c }: { c: Record<string, unknown> }) {
  const { locale } = useTranslation()
  const entries = Object.entries(c).filter(([k]) => FACTS_LABELS[k] && c[k])
  if (entries.length === 0) return null
  return (
    <Container>
      {(str(c.tagline) || str(c.title)) && <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />}
      <dl className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        {entries.map(([k, v]) => (
          <div key={k} className="marine-card p-4">
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-3">{FACTS_LABELS[k][locale] ?? FACTS_LABELS[k].en}</dt>
            <dd className="mt-1 text-[13.5px] font-semibold leading-snug text-foreground">{brandify(str(v))}</dd>
          </div>
        ))}
      </dl>
    </Container>
  )
}

/* ─────────────────────── grouped bullet lists ─────────────────────── */

function CapabilityGroups({ c }: { c: Record<string, unknown> }) {
  const groups = arr(c.groups) as Record<string, unknown>[]
  if (groups.length === 0) return null
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {groups.map((g) => (
          <div key={String(g.title)} className="marine-card p-6">
            <h3 className="font-display text-[16px] font-bold">{brandify(str(g.title) || '')}</h3>
            <ul className="mt-3 space-y-2.5">
              {(arr(g.items) as unknown[]).map((it) => (
                <li key={String(it)} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-fg-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                  {brandify(String(it))}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Container>
  )
}

/* ─────────────────────── services + CTA ─────────────────────── */

function ServicesWidget({ c }: { c: Record<string, unknown> }) {
  const { locale } = useTranslation()
  const services = arr(c.services) as Record<string, unknown>[]
  if (services.length === 0) return null
  const href = str(c.cta_link) || ''
  return (
    <Container>
      <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={String(s.title)} className="marine-card flex flex-col p-6">
            <h3 className="font-display text-[16px] font-bold">{brandify(str(s.title) || '')}</h3>
            <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg-2">{brandify(str(s.desc) || str(s.description) || '')}</p>
          </div>
        ))}
      </div>
      {str(c.cta) && (
        <p className="mt-8 text-center">
          {href ? (
            <a href={href.startsWith('http') ? href : localize(href, locale)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90" {...href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {} }>
              {brandify(str(c.cta))} <ArrowRight size={16} />
            </a>
          ) : (
            <span className="font-semibold text-foreground">{brandify(str(c.cta))}</span>
          )}
        </p>
      )}
    </Container>
  )
}

const KEY_WIDGETS: Record<string, (c: Record<string, unknown>) => ReactNode | null> = {
  intelligence_cards: (c) => <IntelligenceCards c={c} />,
  oem_section: (c) => <OemCases c={c} />,
  production_flow: (c) => <ProductionFlow c={c} />,
  qc_stages: (c) => <QcFlowWidget c={c} />,
  qc_flow: (c) => <QcFlowWidget c={c} />,
  workforce: (c) => <WorkforceWidget c={c} />,
  material_traceability: (c) => <TraceabilityWidget c={c} />,
  qc_dashboard: (c) => <StatGrid items={statItems(c)} heading={c} />,
  equipment_section: (c) => <EquipmentWidget c={c} />,
  equipment: (c) => <EquipmentWidget c={c} />,
  oem_capacity: (c) => <FactsWidget c={c} />,
  capabilities: (c) => <CapabilityGroups c={c} />,
  rd_services: (c) => <ServicesWidget c={c} />,
  features3_cases: (c) => <CaseCardsWidget c={c} />,
  categories: (c) => <CategoriesWidget c={c} />,
  table: (c) => <SizeTableWidget c={c} />,
  defect_matrix: (c) => <SizeTableWidget c={c} />,
  method_cards: (c) => <SizeTableWidget c={c} />,
  rework_decision: (c) => <ReworkDecisionWidget c={c} />,
  knowledge_sections: (c) => <AcademyKnowledge c={c} />,
  buyer_guides: (c) => <BuyerGuidesWidget c={c} />,
  // ported content solution / OEM page sections
  roi_section: (c) => <PortedRoiSection c={c} />,
  packages: (c) => <PortedFeatureGrid c={c} />,
  case_study: (c) => <PortedCaseStudy c={c} />,
  benefits: (c) => <PortedBenefits c={c} />,
  training: (c) => <PortedFeatureGrid c={c} />,
  fleet_guide: (c) => <PortedFleetGuide c={c} />,
  margin_section: (c) => <PortedFeatureGrid c={c} />,
  product_line: (c) => <PortedFeatureGrid c={c} />,
  catalog: (c) => <PortedFeatureGrid c={c} />,
  coverage: (c) => <PortedCoverage c={c} />,
  process: (c) => <PortedProcess c={c} />,
  solutions: (c) => <PortedSolutionsMatrix c={c} />,
  geo: (c) => <GeoWidget c={c} />,
}

const TYPE_WIDGETS: Record<string, (c: Record<string, unknown>) => ReactNode | null> = {
  hero: (c) => <HeroWidget c={c} />,
  hero_text: (c) => <HeroTextWidget c={c} />,
  hero_carousel: (c) => <HeroWidget c={c} />,
  stats: (c) => <StatGrid items={statItems(c)} heading={c} />,
  faqs: (c) => <FaqWidget c={c} />,
  cta: (c) => <CtaWidget c={c} />,
  steps: (c) => <StepsWidget c={c} />,
  steps2: (c) => <StepsWidget c={c} />,
  features: (c) => <FeatureGrid c={c} />,
  features2: (c) => <FeatureGrid c={c} />,
  features3: (c) => <FeatureGrid c={c} />,
  testimonials: (c) => <TestimonialsWidget c={c} />,
  blog_latest: (c) => <BlogLatest c={c} />,
  featured_products: (c) => <FeaturedProducts c={c} />,
  html: (c) => <HtmlWidget html={str(c)} />,
  answer: (c) => <DirectAnswerWidget c={c} />,
  content: (c) => <ContentWidget c={c} />,
}

/* ─────────────────────── generic object-array table ─────────────────────── */

function ObjectTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return null
  const keys = Object.keys(rows[0])
  if (keys.length === 0) return null
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border bg-soft/60">
            {keys.map((k) => (
              <th key={k} scope="col" className="px-4 py-3 font-display text-[12.5px] font-extrabold uppercase tracking-wide text-fg-2">
                {brandify(k.replace(/_/g, ' '))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={String(row[keys[0]]) || i} className="align-top">
              <th scope="row" className="px-4 py-3.5 font-semibold text-fg-2">{brandify(str(row[keys[0]]))}</th>
              {keys.slice(1).map((k) => (
                <td key={k} className="px-4 py-3.5 text-fg-2">{brandify(str(row[k]))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContentWidget({ c }: { c: unknown }) {
  if (c == null) return null
  if (typeof c === 'string') {
    return c.trim().startsWith('<') ? <HtmlWidget html={c} /> : <ProseWidget text={c} />
  }
  if (Array.isArray(c)) {
    if (c.length === 0) return null
    if (c.every((it) => isObj(it) && 'value' in it)) return <StatGrid items={c as never} />
    if (c.every((it) => isObj(it) && ('q' in it || 'question' in it))) return <FaqWidget c={{ items: c }} />
    if (c.every((it) => typeof it === 'string')) {
      return (
        <Container narrow>
          <ul className="space-y-3">
            {c.map((s) => (
              <li key={String(s)} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-fg-2">
                <Check size={17} className="mt-0.5 shrink-0 text-primary" />
                {brandify(String(s))}
              </li>
            ))}
          </ul>
        </Container>
      )
    }
    if (c.every((it) => isObj(it) && 'title' in it)) return <FeatureGrid c={{ items: c }} />
    if (c.every((it) => isObj(it) && Object.keys(it).length > 0)) return <ObjectTable rows={c as Record<string, unknown>[]} />
    return null
  }
  if (isObj(c)) {
    if (c.content_html) return <HtmlWidget html={str(c.content_html)} />
    if (typeof c.body === 'string') {
      return (
        <Container>
          {(str(c.tagline) || str(c.title)) && <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />}
          <ProseWidget text={c.body} />
        </Container>
      )
    }
    if (Array.isArray(c.steps) || Array.isArray(c.stages)) return <StepsWidget c={c} />
    if (Array.isArray(c.questions) || Array.isArray(c.faqs)) return <FaqWidget c={c} />
    if (Array.isArray(c.testimonials) || Array.isArray(c.stories)) return <TestimonialsWidget c={c} />
    if (Array.isArray(c.stats) || Array.isArray(c.highlights) || Array.isArray(c.rd_numbers)) return <StatGrid items={statItems(c)} heading={c} />
    if (Array.isArray(c.topics)) return <TopicList c={c} />
    if (Array.isArray(c.items) && c.items.every((it) => typeof it === 'string')) {
      return (
        <Container narrow>
          {(str(c.tagline) || str(c.title)) && <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || '')} sub={brandify(str(c.subtitle) || '')} />}
          <ul className="mx-auto mt-8 max-w-3xl space-y-3">
            {c.items.map((s) => (
              <li key={String(s)} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-fg-2">
                <Check size={17} className="mt-0.5 shrink-0 text-primary" />
                {brandify(String(s))}
              </li>
            ))}
          </ul>
        </Container>
      )
    }
    if (cardItems(c).length > 0) return <FeatureGrid c={c} />
    if (Array.isArray(c.cases)) return <OemCases c={c} />
    if (c.title || c.tagline || c.headline) {
      const body = str(c.desc) || str(c.description) || str(c.subtitle) || str(c.intro)
      return (
        <Container narrow>
          {(str(c.tagline) || str(c.title) || str(c.headline)) && (
            <SectionHead kicker={str(c.tagline)} title={brandify(str(c.title) || str(c.headline) || '')} sub={brandify(str(c.subtitle) || '')} />
          )}
          {body && <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-fg-2">{brandify(body)}</p>}
        </Container>
      )
    }
    return null
  }
  return null
}

/* ─────────────────────────── direct answer (AEO) ─────────────────────────── */

/** Compact, quotable "straight answer" block for AI/GEO visibility (audit §6-2).
 * Question → numbers → units → conditions in one short paragraph, rendered as a
 * highlighted callout with a visible verification timestamp. */
function DirectAnswerWidget({ c }: { c: Record<string, unknown> }) {
  const { t } = useTranslation()
  const text = str(c.text) || str(c.body) || ''
  const verified = str(c.verified) || ''
  if (!text) return null
  return (
    <Container narrow>
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 px-6 py-5">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          {str(c.label) || t('content.straightAnswer')}
        </span>
        <p className="text-[15px] leading-relaxed text-foreground">{brandify(text)}</p>
        {verified && (
          <span className="mt-2.5 block text-[11.5px] text-fg-3">{t('content.verifiedOn')} {verified}</span>
        )}
      </div>
    </Container>
  )
}

export function ContentSection({ def, content }: { def: ContentSectionDef; content: unknown }) {
  const c = content
  if (def.type === 'blog_latest' && c == null) return <BlogLatest c={{} as Record<string, unknown>} />
  if (c == null) return null
  if (typeof c === 'string' && c.trim() === '') return null
  const obj = isObj(c) ? c : { __raw: c }
  const keyWidget = KEY_WIDGETS[def.key]
  if (keyWidget) return keyWidget(obj)
  if (def.type === 'content') return <ContentWidget c={c} />
  const typeWidget = TYPE_WIDGETS[def.type]
  if (typeWidget && isObj(c)) return typeWidget(obj)
  return <ContentWidget c={c} />
}

/** Section keys rendered as the fallback hero — never output twice. */
const HEADLINE_KEYS = new Set(['label', 'headline', 'subtitle', 'seo'])

export function ContentSections({ page }: { page: ContentPage }) {
  const hasHero = page.sections.some((def) => def.type === 'hero' || def.type === 'hero_text' || def.type === 'hero_carousel')
  // Long-article template pages (label/headline/subtitle/seo/body) have no hero
  // section, so their headline renders as plain content and the page ships no
  // <h1>. Render the headline as a proper PageHero instead (template-level fix).
  const sections = hasHero ? page.sections : page.sections.filter((def) => !HEADLINE_KEYS.has(def.key))
  const hero = !hasHero
    ? (() => {
        const c = page.content
        const headline = str(c.headline) || (isObj(c.seo) ? str((c.seo as Record<string, unknown>).headline) : '')
        if (!headline) return null
        return <PageHero kicker={str(c.label) || ''} title={brandify(headline)} sub={str(c.subtitle) || str(c.sub) || ''} />
      })()
    : null
  return (
    <>
      {hero}
      {sections.map((def, i) => (
        <ContentSection key={`${def.key}-${i}`} def={def} content={page.content[def.key]} />
      ))}
    </>
  )
}

/** Collect all FAQ entries across a page's `faqs` sections (for FAQPage JSON-LD). */
export function collectPageFaqs(page: ContentPage): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = []
  for (const def of page.sections) {
    if (def.type !== 'faqs') continue
    const content = (page.content[def.key] ?? {}) as Record<string, unknown>
    for (const f of faqItems(content)) {
      if (typeof f.q === 'string' && f.q.trim() && typeof f.a === 'string' && f.a.trim()) {
        out.push({ q: brandify(f.q), a: brandify(f.a) })
      }
    }
  }
  return out
}

/** Synthetic "case studies" index rendered by the catch-all route. */
export function CaseStudiesIndex() {
  return (
    <>
      <StatsBand />
      <CaseList />
    </>
  )
}

/** Intro + real-world stats for the case studies index. */
function StatsBand() {
  const { t } = useTranslation()
  const { regionCount = 6, cases = [] } = useAferIndex()
  const studyLabel = t('content.cases.published')
  const regionLabel = t('content.cases.regionsServed')
  const widthLabel = t('content.cases.boardWidth')
  const testedLabel = t('content.cases.factoryTested')
  const intro = t('content.cases.intro', { siteName: SITE_NAME })
  const stats = [
    { value: String(cases.length), label: studyLabel },
    { value: String(regionCount), label: regionLabel },
    { value: CASE_STUDY_STATS.boardWidth, label: widthLabel },
    { value: CASE_STUDY_STATS.factoryTested, label: testedLabel },
  ]
  return (
    <Container>
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-[15px] leading-relaxed text-fg-2">{intro}</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="marine-card flex flex-col items-center px-4 py-6 text-center">
            <span className="font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl">{brandify(s.value)}</span>
            <span className="mt-2 text-[13px] font-semibold text-fg-2">{s.label}</span>
          </div>
        ))}
      </div>
    </Container>
  )
}

/** Synthetic "/research" index from the research.yaml topic registry. */
export function ResearchIndex() {
  const { locale: _locale, t } = useTranslation()
  return (
    <TopicList
      c={{
        badge: t('content.research.kicker'),
        heading: t('content.research.title'),
      }}
    />
  )
}
