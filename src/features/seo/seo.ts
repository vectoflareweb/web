import { locales, defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'
import { SITE_NAME, SITE_TAGLINE } from '@/config/site'
import { BRAND_OG_IMAGE, BRAND_HERO_IMAGE, BRAND_HERO_IMAGE_768, BRAND_HERO_IMAGE_480, BRAND_HERO_IMAGE_WEBP } from '@/config/branding'
import { OG_LOCALE, HREFLANG } from '@/config/locales'
import { ENTITY_PAGE_PATH } from '@/config/navigation'

interface PublicPathEntry {
  path: string
  lastmod: string
}

/** Marketing pages in the sitemap (bilingual, hreflang-linked). */
export const PUBLIC_PATHS: PublicPathEntry[] = [
  { path: '/', lastmod: '2026-08-11' },
  { path: '/solutions', lastmod: '2026-06-20' },
  { path: '/products', lastmod: '2026-06-20' },
  { path: '/who-we-serve', lastmod: '2026-06-20' },
  { path: '/how-it-works', lastmod: '2026-08-07' },
  { path: '/gallery', lastmod: '2026-08-15' },
  { path: '/about', lastmod: '2026-08-07' },
  { path: '/contact', lastmod: '2026-08-07' },
  { path: '/customizer', lastmod: '2026-08-07' },
  { path: '/product-development', lastmod: '2026-08-11' },
  { path: '/solutions/private-label-sup', lastmod: '2026-06-01' },
  { path: '/solutions/resort-sup', lastmod: '2026-06-01' },
  { path: '/solutions/club-sup', lastmod: '2026-06-01' },
  { path: '/solutions/school-sup', lastmod: '2026-06-01' },
  { path: '/projects', lastmod: '2026-08-15' },
  { path: '/knowledge', lastmod: '2026-06-25' },
  { path: '/oem-moq-guide', lastmod: '2026-08-20' },
  { path: '/oem-sup-moq', lastmod: '2026-08-20' },
  { path: '/inflatable-sup-certification', lastmod: '2026-08-20' },
  { path: '/oem-trust-assurance', lastmod: '2026-08-20' },
  { path: '/proof-center', lastmod: '2026-08-20' },
  { path: '/sup-oem-moq-lead-time', lastmod: '2026-08-20' },
  { path: '/oem-odm-private-label-comparison', lastmod: '2026-08-20' },
  { path: '/start-sup-project', lastmod: '2026-08-20' },
  { path: '/oem-onboarding-guide', lastmod: '2026-08-20' },
  { path: '/sup-construction-comparison', lastmod: '2026-08-21' },
  { path: '/sup-compliance-by-market', lastmod: '2026-08-21' },
  { path: '/factory-audit-checklist', lastmod: '2026-08-21' },
  { path: '/about/identity', lastmod: '2026-08-21' },
  { path: '/about/vectoflare', lastmod: '2026-08-20' },
  { path: '/factory', lastmod: '2026-08-20' },
  { path: '/factory/capacity', lastmod: '2026-08-20' },
  { path: '/factory/equipment', lastmod: '2026-08-20' },
  { path: '/factory/oem-capability', lastmod: '2026-08-20' },
  { path: '/factory/process', lastmod: '2026-08-20' },
  { path: '/factory/quality-lab', lastmod: '2026-08-20' },
  { path: '/factory/quality-inspection', lastmod: '2026-08-20' },
  { path: '/factory/quality-change-control', lastmod: '2026-08-20' },
  { path: '/factory/non-conforming-control', lastmod: '2026-08-20' },
  { path: '/oem-manufacturing', lastmod: '2026-08-20' },
  { path: '/odm-development', lastmod: '2026-08-20' },
  { path: '/oem-paddle', lastmod: '2026-08-20' },
  { path: '/b2b-solutions-matrix', lastmod: '2026-08-20' },
  { path: '/solutions/rental-operators', lastmod: '2026-08-20' },
  { path: '/solutions/retail-partners', lastmod: '2026-08-20' },
  { path: '/solutions/distributors', lastmod: '2026-08-20' },
  { path: '/randdcenter', lastmod: '2026-08-20' },
  { path: '/randdcenter/hull-engineering', lastmod: '2026-08-20' },
  { path: '/randdcenter/hydrodynamic-test-tank', lastmod: '2026-08-20' },
  { path: '/randdcenter/prototype-workshop', lastmod: '2026-08-20' },
  { path: '/randdcenter/pvc-fabric-lab', lastmod: '2026-08-20' },
  { path: '/randdcenter/quality-inspection-lab', lastmod: '2026-08-20' },
  { path: '/randdcenter/rf-welding', lastmod: '2026-08-20' },
  { path: '/research/drop-stitch-technology', lastmod: '2026-08-20' },
  { path: '/research/pvc-vs-hypalon', lastmod: '2026-08-20' },
  { path: '/research/ce-certification-guide', lastmod: '2026-08-20' },
  { path: '/research/sup-thickness-guide', lastmod: '2026-08-20' },
  { path: '/research/oem-buyer-guide', lastmod: '2026-08-20' },
  { path: '/oem/sup-oem-north-america', lastmod: '2026-08-20' },
  { path: '/oem/sup-oem-europe', lastmod: '2026-08-20' },
  { path: '/oem/sup-oem-australia', lastmod: '2026-08-20' },
  { path: '/oem/sup-oem-canada', lastmod: '2026-08-20' },
  { path: '/quality', lastmod: '2026-08-20' },
  { path: '/partners', lastmod: '2026-08-20' },
  { path: '/news', lastmod: '2026-08-20' },
  { path: '/technology', lastmod: '2026-08-20' },
  { path: '/size-guide', lastmod: '2026-08-20' },
  { path: '/fishing', lastmod: '2026-08-20' },
  { path: '/inflatable-vs-hardboard', lastmod: '2026-08-20' },
  { path: '/tourism-recreation', lastmod: '2026-08-20' },
  { path: '/warranty', lastmod: '2026-08-20' },
  { path: '/what-is-sup', lastmod: '2026-08-20' },
  { path: '/new-brand-trial-order', lastmod: '2026-08-20' },
  { path: ENTITY_PAGE_PATH, lastmod: '2026-06-30' },
]

export const OG_IMAGE = BRAND_OG_IMAGE

export const HERO_IMAGE = BRAND_HERO_IMAGE
export const HERO_IMAGE_768 = BRAND_HERO_IMAGE_768
export const HERO_IMAGE_480 = BRAND_HERO_IMAGE_480
export const HERO_IMAGE_WEBP = BRAND_HERO_IMAGE_WEBP

export function buildRobots(origin: string): string {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot',
    'Applebot-Extended',
    'Amazonbot',
    'meta-externalagent',
    'Bytespider',
    'cohere-ai',
    'CCBot',
    'YouBot',
  ]
  const aiGroups = aiAgents.map((agent) => `User-agent: ${agent}\nAllow: /`).join('\n\n')
  return [
    `# ${origin}/robots.txt`,
    '# Last updated: 2026-08-07',
    '',
    '# ---------------------------------------------------------------',
    '# Content signals',
    '# search   = yes  (allow search indexing)',
    '# ai-input = yes  (allow grounding / RAG for AI answers — required for GEO)',
    '# ai-train = no   (do not use for model training)',
    '# ---------------------------------------------------------------',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference',
    '',
    // Single wildcard group — private app surfaces and removed template pages
    // only; the whole marketing site is crawlable (incl. AI agents, each
    // allowed explicitly below so no edge/anti-bot rule can blanket-block
    // LLM crawlers).
    'User-agent: *',
    'Allow: /',
    'Disallow: /api',
    'Disallow: /admin',
    'Disallow: /*/admin',
    'Disallow: /app',
    'Disallow: /*/app',
    'Disallow: /docs',
    'Disallow: /docs/',
    'Disallow: /waitlist',
    'Disallow: /changelog',
    'Disallow: /*?*sort=',
    'Disallow: /*?*utm_',
    '',
    '# --- AI search & answer engines: explicitly allowed (GEO) ---',
    aiGroups,
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
}

function alternates(origin: string, path: string): string {
  const links = locales.map(
    (l) => `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${origin}${localizePath(l, path)}"/>`,
  )
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localizePath(defaultLocale, path)}"/>`,
  )
  return links.join('')
}

export interface SitemapEntry {
  loc: string
  lastmod?: string
  /** Emit the Spanish sibling as an hreflang alternate (must have a real es variant). */
  es?: boolean
}

type SingleLocalePath = string | SitemapEntry

/** Which locale variants of PUBLIC_PATHS a sitemap file should carry: every
 *  bilingual pair (default), only the given locale, or none (detail-only files
 *  like products/news — they must not repeat the template URLs). */
export function buildSitemap(
  origin: string,
  singleLocalePaths: SingleLocalePath[] = [],
  opts: { locale?: Locale | 'all' | 'none' } = {},
): string {
  const include = opts.locale ?? 'all'
  const bilingual =
    include === 'none'
      ? []
      : locales
          .filter((l) => include === 'all' || l === include)
          .flatMap((l) =>
            PUBLIC_PATHS.map(
              (e) =>
                `<url><loc>${origin}${localizePath(l, e.path)}</loc><lastmod>${e.lastmod}</lastmod>${alternates(origin, e.path)}</url>`,
            ),
          )
  const single = singleLocalePaths.map((p) => {
    const entry = typeof p === 'string' ? { loc: p } : p
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
    const links = entry.es
      ? `<xhtml:link rel="alternate" hreflang="${HREFLANG.en}" href="${origin}${entry.loc}"/><xhtml:link rel="alternate" hreflang="${HREFLANG.es}" href="${origin}${localizePath('es', entry.loc)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${origin}${entry.loc}"/>`
      : ''
    return `<url><loc>${origin}${entry.loc}</loc>${lastmod}${links}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${[...bilingual, ...single].join('')}</urlset>`
}

/** One locale's marketing pages (hreflang alternates to the sibling locale files). */
export function buildLocaleSitemap(
  origin: string,
  locale: Locale,
  entries: { path: string; lastmod?: string }[],
): string {
  const urls = entries.map(
    (e) =>
      `<url><loc>${origin}${localizePath(locale, e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}${alternates(origin, e.path)}</url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
}

/** sitemap index aggregating the per-section sitemap files. */
export function buildSitemapIndex(origin: string, files: string[]): string {
  const items = files.map((f) => `<sitemap><loc>${origin}/${f}</loc></sitemap>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items.join('')}</sitemapindex>`
}

export interface HeadLink {
  rel: string
  href: string
  hreflang?: string // lowercase HTML attr — TanStack serializes head attrs verbatim
  as?: string
  type?: string
  fetchpriority?: string
}

export interface HeadMeta {
  title?: string
  name?: string
  property?: string
  content?: string
}

export function localeHead(input: {
  origin: string
  locale: Locale
  path: string
  title: string
  description: string
  ogTitle?: string
  ogType?: string
  image?: string
}): { meta: HeadMeta[]; links: HeadLink[] } {
  const { origin, locale, path, title, description, ogTitle } = input
  const image = input.image ?? OG_IMAGE
  const canonical = `${origin}${localizePath(locale, path)}`
  const links: HeadLink[] = [{ rel: 'canonical', href: canonical }]
  for (const l of locales) {
    links.push({ rel: 'alternate', hreflang: HREFLANG[l], href: `${origin}${localizePath(l, path)}` })
  }
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${origin}${localizePath(defaultLocale, path)}`,
  })
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: input.ogType ?? 'website' },
    { property: 'og:title', content: ogTitle ?? title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    ...locales.filter((l) => l !== locale).map((l) => ({ property: 'og:locale:alternate', content: OG_LOCALE[l] })),
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:type', content: image.endsWith('.webp') ? 'image/webp' : 'image/jpeg' },
    {
      property: 'og:image:alt',
      content: `${SITE_NAME} — ${SITE_TAGLINE}`,
    },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@myproduct' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    {
      name: 'twitter:image:alt',
      content: `${SITE_NAME} — ${SITE_TAGLINE}`,
    },
  ]
  return { meta, links }
}
