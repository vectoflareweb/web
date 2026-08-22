import { parse } from 'yaml'
import { assetUrl } from './assets'
import { brandify as configBrandify } from './brand'
import { defaultLocale, type Locale } from '@/features/i18n/locale'
import { SHADOWED_PATHS, EXTRA_PATHS } from '@/product/route-registry'
import type {
  ContentArticle,
  ContentCaseUse,
  ContentPage,
  ContentPost,
  ContentProduct,
  ContentResearchTopic,
  ContentSectionDef,
} from './types'

/**
 * Content loader.
 *
 * All sources live in src/content/site/ and are bundled at build time as
 * raw strings (Vite glob + `?raw`), so this works on Cloudflare Workers where
 * there is no filesystem at runtime. Parsing is cached at module level.
 *
 * NOTE: Vite requires import.meta.glob() paths to be static string literals.
 * The content directory path cannot be parameterized at runtime; changing
 * the content directory requires updating all glob paths below.
 */

const siteGlob = import.meta.glob('../../content/site/site/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const pageGlob = import.meta.glob('../../content/site/pages/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const siteLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/site/*.es.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const pageLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/pages/*.es.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const productGlob = import.meta.glob('../../content/site/products/*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const newsGlob = import.meta.glob('../../content/site/news/*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const newsLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/news/*.es.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const techGlob = import.meta.glob('../../content/site/technology/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const caseGlob = import.meta.glob('../../content/site/case-use/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const productLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/products/*.es.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const techLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/technology/*.es.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const caseLocaleGlobs: Record<string, Record<string, string>> = {
  es: import.meta.glob('../../content/site/case-use/*.es.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
}
const geoGlob = import.meta.glob('../../product/geo/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const stripBom = (s: string) => s.replace(/^\uFEFF/, '')

function suffixMatch(glob: Record<string, string>, suffix: string): string | undefined {
  const key = Object.keys(glob).find((k) => k.endsWith(suffix))
  return key ? glob[key] : undefined
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? ''
}

function parseYamlMap(glob: Record<string, string>, stripEs = false): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(glob)) {
    let name = basename(key).replace(/\.(yaml|yml)$/i, '')
    if (stripEs) name = name.replace(/\.es$/i, '')
    out[name] = parse(stripBom(raw))
  }
  return out
}

/** Splits `---\n<yaml>\n---\n<body>` MDX/MD frontmatter. */
function parseFrontmatter<T>(raw: string): { data: T; body: string } {
  const clean = stripBom(raw)
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(clean)
  if (!m) return { data: {} as T, body: clean }
  return { data: parse(m[1]) as T, body: clean.slice(m[0].length) }
}

const normalizePath = (p: string): string => `/${p.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') || '/'

/* ───────────────────────── registry pages ───────────────────────── */

interface RegistryEntry {
  slug: string
  label?: string
  path?: string
  permalink?: string
  sections?: { key: string; type: string; label?: string }[]
}

const REGISTRY_RAW = suffixMatch(siteGlob, 'pages.yaml') ?? ''
const REGISTRY = (parse(stripBom(REGISTRY_RAW)) as RegistryEntry[]) ?? []
const PAGES_YAML = parseYamlMap(pageGlob)
const PAGE_LOCALE_MAP: Record<string, Record<string, unknown>> = {}
for (const [loc, glob] of Object.entries(pageLocaleGlobs)) {
  PAGE_LOCALE_MAP[loc] = parseYamlMap(glob, true)
}

/** Global market regions the product serves, sourced from the distributor coverage list. */
const REGION_COUNT = (() => {
  const dist = (PAGES_YAML['solutions-distributors'] ?? {}) as { coverage?: { regions?: unknown[] } }
  const regions = dist.coverage?.regions
  if (Array.isArray(regions) && regions.length > 0) return regions.length
  return 6
})()

/** Type inference for pages that ship no registry entry (dedicated-route pages). */
function inferSectionType(value: unknown, key: string): string {
  if (key === 'hero' || key.includes('hero')) return 'hero'
  if (key === 'hero_text') return 'hero_text'
  if (key === 'stats' || key.includes('stats') || key.includes('numbers')) return 'stats'
  if (key === 'cta' || key.includes('cta')) return 'cta'
  if (key.includes('faq')) return 'faqs'
  if (key === 'content_html' || key.includes('html')) return 'html'
  if (key === 'answer' || key === 'direct_answer') return 'answer'
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object' && 'value' in first) return 'stats'
    if (first && typeof first === 'object' && ('q' in first || 'question' in first)) return 'faqs'
    return 'features'
  }
  return 'content'
}

function deriveSections(content: Record<string, unknown>): ContentSectionDef[] {
  const keys = Object.keys(content).filter((k) => !['meta', 'back_text', 'backText', 'home_label', 'homeLabel'].includes(k))
  // hero first, cta last, everything else in source order
  const ordered = [...keys].sort((a, b) => {
    const rank = (k: string) => (k === 'hero' || k.includes('hero') ? 0 : k.includes('cta') ? 2 : 1)
    return rank(a) - rank(b)
  })
  return ordered.map((k) => ({ key: k, type: inferSectionType(content[k], k) }))
}

const REGISTERED_PAGES: ContentPage[] = REGISTRY.flatMap((entry) => {
  const path = normalizePath(entry.permalink || entry.path || `/${entry.slug}`)
  if (SHADOWED_PATHS.has(path)) return []
  const content = (PAGES_YAML[entry.slug] ?? {}) as Record<string, unknown>
  return [
    {
      slug: entry.slug,
      label: entry.label ?? entry.slug,
      path,
      meta: content.meta as ContentPage['meta'],
      sections: entry.sections ?? deriveSections(content),
      content,
    },
  ]
})

const EXTRA_PAGES: ContentPage[] = Object.entries(EXTRA_PATHS).map(([path, slug]) => {
  const content = (PAGES_YAML[slug] ?? {}) as Record<string, unknown>
  return {
    slug,
    label: slug,
    path: normalizePath(path),
    meta: content.meta as ContentPage['meta'],
    sections: deriveSections(content),
    content,
  }
})

const ALL_PAGES = [...REGISTERED_PAGES, ...EXTRA_PAGES]

const PAGE_BY_PATH = new Map(ALL_PAGES.map((p) => [p.path, p]))

/* ───────────────────────── articles (MDX) ───────────────────────── */

function parseMdxFiles<T>(glob: Record<string, string>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [key, raw] of Object.entries(glob)) {
    const slug = basename(key).replace(/\.mdx?$/i, '')
    out[slug] = parseFrontmatter<T>(raw).data
  }
  return out
}

function postFrom(slug: string, d: Record<string, unknown>, en?: ContentPost, body = mdxBodyOf(newsGlob, slug)): ContentPost {
  const rec = d as Record<string, unknown>
  return {
    slug,
    title: rec.title ? String(rec.title) : (en?.title ?? slug),
    date: rec.publishDate ? String(rec.publishDate) : (en?.date ?? ''),
    excerpt: rec.excerpt ? String(rec.excerpt) : en?.excerpt,
    image: en?.image ?? (rec.image ? assetUrl(String(rec.image)) : undefined),
    category: rec.category ? String(rec.category) : en?.category,
    author: rec.author ? String(rec.author) : en?.author,
    tags: Array.isArray(rec.tags) ? rec.tags.map(String) : (en?.tags ?? []),
    metadata: (rec.metadata as ContentPost['metadata']) ?? en?.metadata,
    body,
  }
}

const PRODUCT_DATA = parseMdxFiles<Record<string, unknown>>(productGlob)
const NEWS_DATA = parseMdxFiles<Record<string, unknown>>(newsGlob)
const TECH_DATA = parseMdxFiles<Record<string, unknown>>(techGlob)
const CASE_DATA = parseMdxFiles<Record<string, unknown>>(caseGlob)

function mdxBodyOf(glob: Record<string, string>, slug: string): string {
  const key = Object.keys(glob).find((k) => basename(k).replace(/\.mdx?$/i, '') === slug)
  return key ? parseFrontmatter(glob[key]).body : ''
}

function productOf(slug: string, d: Record<string, unknown>, body: string): ContentProduct {
  const rec = { ...(d as object) } as Record<string, unknown>
  if (typeof rec.image === 'string') rec.image = assetUrl(rec.image)
  if (Array.isArray(rec.gallery)) {
    rec.gallery = (rec.gallery as { url?: unknown; alt?: unknown }[]).map((g) => ({
      ...g,
      url: typeof g.url === 'string' ? assetUrl(g.url) : g.url,
    }))
  }
  return { slug, body, ...rec } as unknown as ContentProduct
}

const PRODUCTS: ContentProduct[] = Object.entries(PRODUCT_DATA)
  .filter(([slug]) => !slug.endsWith('.es'))
  .map(([slug, d]) => productOf(slug, d as Record<string, unknown>, mdxBodyOf(productGlob, slug)))
  .sort((a, b) => a.title.localeCompare(b.title))

const NEWS: ContentPost[] = Object.entries(NEWS_DATA)
  .filter(([slug]) => !slug.endsWith('.es'))
  .map(([slug, d]) => postFrom(slug, d as Record<string, unknown>))
  .sort((a, b) => (a.date < b.date ? 1 : -1))

/** Locale overlays keyed by locale code, then canonical slug. */
const NEWS_LOCALE: Record<string, Record<string, ContentPost>> = {}
for (const [loc, glob] of Object.entries(newsLocaleGlobs)) {
  const data = parseMdxFiles<Record<string, unknown>>(glob)
  const map: Record<string, ContentPost> = {}
  for (const [slug, d] of Object.entries(data)) {
    const base = slug.replace(/\.es$/, '')
    const en = NEWS.find((p) => p.slug === base)
    if (en) map[base] = postFrom(base, d as Record<string, unknown>, en, mdxBodyOf(glob, slug))
  }
  NEWS_LOCALE[loc] = map
}

const PRODUCTS_LOCALE: Record<string, Record<string, ContentProduct>> = {}
for (const [loc, glob] of Object.entries(productLocaleGlobs)) {
  const data = parseMdxFiles<Record<string, unknown>>(glob)
  const map: Record<string, ContentProduct> = {}
  for (const [slug, d] of Object.entries(data)) {
    const base = slug.replace(/\.es$/, '')
    if (PRODUCTS.some((p) => p.slug === base)) map[base] = productOf(base, d as Record<string, unknown>, mdxBodyOf(glob, slug))
  }
  PRODUCTS_LOCALE[loc] = map
}

function articleOf(slug: string, d: Record<string, unknown>, body: string): ContentArticle {
  const rec = d as Record<string, unknown>
  return {
    slug,
    title: String(rec.title ?? slug),
    summary: rec.summary ? String(rec.summary) : undefined,
    description: rec.description ? String(rec.description) : undefined,
    category: rec.category ? String(rec.category) : undefined,
    tags: Array.isArray(rec.tags) ? rec.tags.map(String) : [],
    dateModified: rec.dateModified ? String(rec.dateModified) : rec.publishDate ? String(rec.publishDate) : undefined,
    body,
  }
}

const TECH: ContentArticle[] = Object.entries(TECH_DATA)
  .filter(([slug]) => !slug.endsWith('.es'))
  .map(([slug, d]) => articleOf(slug, d as Record<string, unknown>, mdxBodyOf(techGlob, slug)))

const TECH_LOCALE: Record<string, Record<string, ContentArticle>> = {}
for (const [loc, glob] of Object.entries(techLocaleGlobs)) {
  const data = parseMdxFiles<Record<string, unknown>>(glob)
  const map: Record<string, ContentArticle> = {}
  for (const [slug, d] of Object.entries(data)) {
    const base = slug.replace(/\.es$/, '')
    if (TECH.some((t) => t.slug === base)) map[base] = articleOf(base, d as Record<string, unknown>, mdxBodyOf(glob, slug))
  }
  TECH_LOCALE[loc] = map
}

function caseOf(slug: string, d: Record<string, unknown>, body: string): ContentCaseUse {
  const rec = d as Record<string, unknown>
  return {
    slug,
    title: String(rec.title ?? slug),
    summary: rec.summary ? String(rec.summary) : undefined,
    description: rec.description ? String(rec.description) : undefined,
    category: rec.category ? String(rec.category) : undefined,
    environment: rec.environment ? String(rec.environment) : undefined,
    skill: rec.skill ? String(rec.skill) : undefined,
    products: Array.isArray(rec.products) ? rec.products.map(String) : [],
    tags: Array.isArray(rec.tags) ? rec.tags.map(String) : [],
    body,
  }
}

const CASE_USES: ContentCaseUse[] = Object.entries(CASE_DATA)
  .filter(([slug]) => !slug.endsWith('.es'))
  .map(([slug, d]) => caseOf(slug, d as Record<string, unknown>, mdxBodyOf(caseGlob, slug)))

const CASE_LOCALE: Record<string, Record<string, ContentCaseUse>> = {}
for (const [loc, glob] of Object.entries(caseLocaleGlobs)) {
  const data = parseMdxFiles<Record<string, unknown>>(glob)
  const map: Record<string, ContentCaseUse> = {}
  for (const [slug, d] of Object.entries(data)) {
    const base = slug.replace(/\.es$/, '')
    if (CASE_USES.some((c) => c.slug === base)) map[base] = caseOf(base, d as Record<string, unknown>, mdxBodyOf(glob, slug))
  }
  CASE_LOCALE[loc] = map
}

/* ───────────────────────── research topics ───────────────────────── */

const RESEARCH_RAW = suffixMatch(siteGlob, 'research.yaml') ?? ''
const RESEARCH_TOPICS = ((parse(stripBom(RESEARCH_RAW)) as { topics?: ContentResearchTopic[] }).topics ?? []).map((t) => ({
  ...t,
  slug: String(t.slug),
}))

/* ───────────────────────── geo ───────────────────────── */

function geoJson(name: string): Record<string, unknown> | undefined {
  const raw = suffixMatch(geoGlob, `${name}.json`)
  // source data allows duplicate keys (e.g., sameAs in entity.json), yaml strict mode rejects → disable unique-key check
  return raw ? (parse(stripBom(raw), { uniqueKeys: false }) as Record<string, unknown>) : undefined
}

/* ───────────────────────── locale overlay helper ───────────────────────── */

function localeOverlay<T>(map: Record<string, Record<string, T>>, locale: string, slug: string): T | undefined {
  return map[locale]?.[slug]
}

function localeOverlayList<T extends { slug: string }>(map: Record<string, Record<string, T>>, locale: string, base: T[]): T[] {
  const overlays = map[locale]
  if (!overlays) return base
  return base.map((item) => overlays[item.slug] ?? item)
}

/* ───────────────────────── public API ───────────────────────── */

export function getContentPage(path: string, locale: Locale = defaultLocale): ContentPage | undefined {
  const page = PAGE_BY_PATH.get(normalizePath(path))
  if (!page) return undefined
  if (locale === defaultLocale) return page
  const overlay = PAGE_LOCALE_MAP[locale]
  if (!overlay) return page
  const localized = overlay[page.slug]
  if (!localized) return page
  const localizedContent = localized as Record<string, unknown>
  return { ...page, content: localizedContent, meta: (localizedContent.meta as ContentPage['meta']) ?? page.meta }
}

/** True when a locale variant exists for the page at `path`. */
export function isContentPageTranslated(path: string, locale: Locale): boolean {
  if (locale === defaultLocale) return false
  return hasLocaleVariant(path, locale)
}

/**
 * True when a locale variant exists for any content at `path` —
 * registry pages, /faq, or the sidecar overlays (news, products, technology,
 * case-use). Guides live in guide-content.ts and are checked by the caller.
 */
export function hasLocaleVariant(path: string, locale: string): boolean {
  const p = normalizePath(path)
  const page = PAGE_BY_PATH.get(p)
  if (page) return !!PAGE_LOCALE_MAP[locale]?.[page.slug]
  if (p === '/faq') return !!suffixMatch(siteLocaleGlobs[locale] ?? {}, `faqs.${locale}.yaml`)
  const slug = p.split('/').filter(Boolean).pop() ?? ''
  if (p.startsWith('/products/')) return !!localeOverlay(PRODUCTS_LOCALE, locale, slug)
  if (p.startsWith('/news/')) return !!localeOverlay(NEWS_LOCALE, locale, slug)
  if (p.startsWith('/technology/')) return !!localeOverlay(TECH_LOCALE, locale, slug)
  if (p.startsWith('/evidence/case-studies/')) return !!localeOverlay(CASE_LOCALE, locale, slug)
  return false
}

/** @deprecated Use hasLocaleVariant instead. */
export const hasSpanishVariant = hasLocaleVariant

/** Live page paths that have a locale variant (for sitemap generation). */
export function getLocalePaths(locale: string): string[] {
  const overlay = PAGE_LOCALE_MAP[locale]
  const pages = overlay ? ALL_PAGES.filter((p) => overlay[p.slug]).map((p) => p.path) : []
  if (suffixMatch(siteLocaleGlobs[locale] ?? {}, `faqs.${locale}.yaml`)) pages.push('/faq')
  return pages
}

/** @deprecated Use getLocalePaths instead. */
export const getEsPaths = () => getLocalePaths('es')

/** Detail paths (news/products/technology/case-use) that have a locale sidecar. */
export function getLocaleContentPaths(locale: string): string[] {
  const paths: string[] = []
  for (const slug of Object.keys(NEWS_LOCALE[locale] ?? {})) paths.push(`/news/${slug}`)
  for (const slug of Object.keys(PRODUCTS_LOCALE[locale] ?? {})) paths.push(`/products/${slug}`)
  for (const slug of Object.keys(TECH_LOCALE[locale] ?? {})) paths.push(`/technology/${slug}`)
  for (const slug of Object.keys(CASE_LOCALE[locale] ?? {})) paths.push(`/evidence/case-studies/${slug}`)
  return paths
}

/** @deprecated Use getLocaleContentPaths instead. */
export const getEsContentPaths = () => getLocaleContentPaths('es')

export function getContentPages(): ContentPage[] {
  return ALL_PAGES
}

/** Pages that are actually renderable (registry + extra), for sitemap/llms. */
export function getPublicPaths(): string[] {
  return ALL_PAGES.map((p) => p.path)
}

export function getContentProducts(locale?: string): ContentProduct[] {
  return locale && locale !== defaultLocale ? localeOverlayList(PRODUCTS_LOCALE, locale, PRODUCTS) : PRODUCTS
}

export function getContentProduct(slug: string, locale?: string): ContentProduct | undefined {
  const base = slug.endsWith('.es') ? slug.replace(/\.es$/, '') : slug
  const p = PRODUCTS.find((x) => x.slug === base)
  if (!p) return undefined
  return locale && locale !== defaultLocale ? (localeOverlay(PRODUCTS_LOCALE, locale, base) ?? p) : p
}

export function getNewsPosts(locale?: string): ContentPost[] {
  return locale && locale !== defaultLocale ? localeOverlayList(NEWS_LOCALE, locale, NEWS) : NEWS
}

export function getNewsPost(slug: string, locale?: string): ContentPost | undefined {
  const base = slug.endsWith('.es') ? slug.replace(/\.es$/, '') : slug
  const p = NEWS.find((x) => x.slug === base)
  if (!p) return undefined
  return locale && locale !== defaultLocale ? (localeOverlay(NEWS_LOCALE, locale, base) ?? p) : p
}

export function getTechArticles(locale?: string): ContentArticle[] {
  return locale && locale !== defaultLocale ? localeOverlayList(TECH_LOCALE, locale, TECH) : TECH
}

export function getTechArticle(slug: string, locale?: string): ContentArticle | undefined {
  const base = slug.endsWith('.es') ? slug.replace(/\.es$/, '') : slug
  const t = TECH.find((x) => x.slug === base)
  if (!t) return undefined
  return locale && locale !== defaultLocale ? (localeOverlay(TECH_LOCALE, locale, base) ?? t) : t
}

export function getCaseUses(locale?: string): ContentCaseUse[] {
  return locale && locale !== defaultLocale ? localeOverlayList(CASE_LOCALE, locale, CASE_USES) : CASE_USES
}

export function getCaseUse(slug: string, locale?: string): ContentCaseUse | undefined {
  const base = slug.endsWith('.es') ? slug.replace(/\.es$/, '') : slug
  const c = CASE_USES.find((x) => x.slug === base)
  if (!c) return undefined
  return locale && locale !== defaultLocale ? (localeOverlay(CASE_LOCALE, locale, base) ?? c) : c
}

export function getResearchTopics(locale?: string): ContentResearchTopic[] {
  if (locale && locale !== defaultLocale) {
    const raw = suffixMatch(siteLocaleGlobs[locale] ?? {}, `research.${locale}.yaml`)
    if (raw) {
      const localized = (parse(stripBom(raw)) as { topics?: ContentResearchTopic[] }).topics ?? []
      if (localized.length > 0) return localized.map((t) => ({ ...t, slug: String(t.slug) }))
    }
  }
  return RESEARCH_TOPICS
}

export function getGeoEntity(): Record<string, unknown> | undefined {
  return geoJson('entity')
}

/** Structured company / certification / manufacturing facts for GEO exposure. */
export function getGeoFacts(): {
  company?: Record<string, unknown>
  certifications?: Record<string, unknown>
  manufacturing?: Record<string, unknown>
} {
  return {
    company: geoJson('company-facts'),
    certifications: geoJson('certification-facts'),
    manufacturing: geoJson('manufacturing-facts'),
  }
}

/** Site-wide FAQ Q&A (src/content/site/site/faqs.yaml), for the /faq page. */
export function getSiteFaqs(locale: Locale = defaultLocale): { q: string; a: string }[] {
  let source = ''
  if (locale !== defaultLocale) {
    source = suffixMatch(siteLocaleGlobs[locale] ?? {}, `faqs.${locale}.yaml`) ?? ''
  }
  source = source || suffixMatch(siteGlob, 'faqs.yaml') || ''
  if (!source) return []
  const parsed = parse(stripBom(source)) as { faqs?: { q: string; a: string }[] }
  return Array.isArray(parsed.faqs) ? parsed.faqs : []
}

export function brandify(text: string): string {
  return configBrandify(text)
}

/** Number of global market regions served (brand `{count}` value). */
export function getRegionCount(): number {
  return REGION_COUNT
}
