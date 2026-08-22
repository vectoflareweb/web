import { test, expect } from 'vitest'
import { gatePath, EDGE_REDIRECTS } from '@/features/seo/edge-gate'
import { LEGACY_REDIRECTS } from '@/features/seo/legacy-redirects'
import { getContentPages } from '@/features/content/loader'
import { GUIDES } from '@/features/content/guide-content'
import { PUBLIC_PATHS } from '@/features/seo/seo'

/** Dedicated/static routes not covered by getContentPages() or PUBLIC_PATHS. */
const TEMPLATE_ROUTES = [
  '/evidence/case-studies', '/faq', '/news', '/partners',
  '/terms', '/privacy',
]

/** Dynamic prefix routes ({-$locale}/knowledge/$slug.tsx etc.) — a legacy key under one of these shadows real pages. */
const DYNAMIC_PREFIXES = ['/knowledge', '/projects', '/evidence/case-studies']

/** Every legacy target must resolve to a live route (not another redirect). */
const LIVE_ROUTES = new Set([
  ...getContentPages().map((p) => p.path),
  ...GUIDES.map((g) => `/guides/${g.slug}`),
  ...PUBLIC_PATHS.map((e) => e.path),
  ...TEMPLATE_ROUTES,
])

test('301 merge of duplicate paths (P0-4)', () => {
  expect(gatePath('/oem-odm')).toEqual({ action: 'redirect', to: '/oem-manufacturing' })
  expect(gatePath('/zh/oem-odm')).toEqual({ action: 'redirect', to: '/es/oem-manufacturing' })
})

test('French-slug doorways 301 to closest English page (P1-5)', () => {
  expect(gatePath('/fabricant-sup-gonflable')).toEqual({ action: 'redirect', to: '/oem-manufacturing' })
  expect(gatePath('/bateau-gonflable-fabricant')).toEqual({ action: 'redirect', to: '/oem-manufacturing' })
  expect(gatePath('/fournisseur-nautique')).toEqual({ action: 'redirect', to: '/solutions/rental-operators' })
})

test('duplicate pages 301 onto their modern keepers (P1-#8)', () => {
  expect(gatePath('/custom')).toEqual({ action: 'redirect', to: '/product-development' })
  expect(gatePath('/es/custom')).toEqual({ action: 'redirect', to: '/es/product-development' })
  expect(gatePath('/quality-testing')).toEqual({ action: 'redirect', to: '/quality' })
  expect(gatePath('/es/quality-testing')).toEqual({ action: 'redirect', to: '/es/quality' })
  expect(gatePath('/quality-control')).toEqual({ action: 'redirect', to: '/factory/quality-inspection' })
  expect(gatePath('/es/quality-control')).toEqual({ action: 'redirect', to: '/es/factory/quality-inspection' })
  expect(gatePath('/safety')).toEqual({ action: 'redirect', to: '/quality' })
  expect(gatePath('/es/safety')).toEqual({ action: 'redirect', to: '/es/quality' })
  expect(gatePath('/trust')).toEqual({ action: 'redirect', to: '/quality' })
  expect(gatePath('/es/trust')).toEqual({ action: 'redirect', to: '/es/quality' })
  expect(gatePath('/solutions/resorts-hotels')).toEqual({ action: 'redirect', to: '/solutions/resort-sup' })
  expect(gatePath('/solutions/paddle-clubs')).toEqual({ action: 'redirect', to: '/solutions/club-sup' })
  expect(gatePath('/solutions/build-your-own-brand')).toEqual({ action: 'redirect', to: '/solutions/private-label-sup' })
})

test('brand pages collapse onto /about and /about/vectoflare (P1-3)', () => {
  expect(gatePath('/vectoflare')).toEqual({ action: 'redirect', to: '/about/vectoflare' })
  expect(gatePath('/es/vectoflare')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/zh/vectoflare')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/brand')).toEqual({ action: 'redirect', to: '/about' })
  expect(gatePath('/es/brand')).toEqual({ action: 'redirect', to: '/es/about' })
  expect(gatePath('/zh/brand')).toEqual({ action: 'redirect', to: '/es/about' })
  expect(gatePath('/brand/vectoflare')).toEqual({ action: 'redirect', to: '/about/vectoflare' })
  expect(gatePath('/es/brand/vectoflare')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/zh/brand/vectoflare')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/brand/story')).toEqual({ action: 'redirect', to: '/about/vectoflare' })
  expect(gatePath('/es/brand/story')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/zh/brand/story')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
  expect(gatePath('/brand/global-presence')).toEqual({ action: 'redirect', to: '/about' })
  expect(gatePath('/es/brand/global-presence')).toEqual({ action: 'redirect', to: '/es/about' })
  expect(gatePath('/brand/marine-expertise')).toEqual({ action: 'redirect', to: '/about' })
  expect(gatePath('/es/brand/marine-expertise')).toEqual({ action: 'redirect', to: '/es/about' })
  expect(gatePath('/brand/team')).toEqual({ action: 'redirect', to: '/about' })
  expect(gatePath('/es/brand/team')).toEqual({ action: 'redirect', to: '/es/about' })
  expect(gatePath('/brand/why-vectoflare')).toEqual({ action: 'redirect', to: '/about/vectoflare' })
  expect(gatePath('/es/brand/why-vectoflare')).toEqual({ action: 'redirect', to: '/es/about/vectoflare' })
})

test('non-SUP business lines 301 to vectoflare.com (P1-7)', () => {
  expect(gatePath('/commercial-workboats')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/commercial-workboats',
  })
  expect(gatePath('/es/commercial-workboats')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/es/commercial-workboats',
  })
  expect(gatePath('/zh/commercial-workboats')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/es/commercial-workboats',
  })
  expect(gatePath('/maritime-safety-defense')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/maritime-safety-defense',
  })
  expect(gatePath('/search-and-rescue')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/search-and-rescue',
  })
  expect(gatePath('/disaster-relief-humanitarian-aid')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/disaster-relief-humanitarian-aid',
  })
  expect(gatePath('/products/life-vest-classic')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/products/life-vest-classic',
  })
  expect(gatePath('/products/life-vest-pro')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/products/life-vest-pro',
  })
  expect(gatePath('/products/oars-pump-set')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/products/oars-pump-set',
  })
})

test('legacy thevectoflare URLs 301 to live pages (spot checks)', () => {
  expect(gatePath('/odm-sup-board')).toEqual({ action: 'redirect', to: '/odm-development' })
  expect(gatePath('/sup-manufacturer')).toEqual({ action: 'redirect', to: '/oem-manufacturing' })
  expect(gatePath('/guides/sup-yoga')).toEqual({ action: 'redirect', to: '/knowledge' })
  expect(gatePath('/research/sup-valve-types')).toEqual({ action: 'redirect', to: '/knowledge' })
  expect(gatePath('/solutions-fishing-boat-solutions')).toEqual({ action: 'redirect', to: '/fishing' })
  expect(gatePath('/use-cases/disaster-relief')).toEqual({
    action: 'redirect',
    to: 'https://vectoflare.com/disaster-relief-humanitarian-aid',
  })
  expect(gatePath('/resources/download-catalog')).toEqual({ action: 'redirect', to: '/products' })
  expect(gatePath('/es/resources/download-catalog')).toEqual({ action: 'redirect', to: '/es/products' })
  expect(gatePath('/whitepaper/oem-sup-manufacturing-guide')).toEqual({ action: 'redirect', to: '/oem-manufacturing' })
  expect(gatePath('/es/whitepaper/oem-sup-manufacturing-guide')).toEqual({ action: 'redirect', to: '/es/oem-manufacturing' })
  // consolidated news articles 301 to their successor guides
  expect(gatePath('/news/sup-oem-shipping-logistics')).toEqual({
    action: 'redirect',
    to: '/news/private-label-sup-oem-guide',
  })
  expect(gatePath('/es/news/sup-oem-shipping-logistics')).toEqual({
    action: 'redirect',
    to: '/es/news/private-label-sup-oem-guide',
  })
  expect(gatePath('/news/importing-sup-from-china-guide')).toEqual({
    action: 'redirect',
    to: '/news/private-label-sup-guide',
  })
  expect(gatePath('/es/news/importing-sup-from-china-guide')).toEqual({
    action: 'redirect',
    to: '/es/news/private-label-sup-guide',
  })
  expect(gatePath('/touring-sup')).toEqual({ action: 'redirect', to: '/products' })
  // /search is now a live search results page (not a legacy redirect)
  expect(gatePath('/search')).toEqual({ action: 'ok' })
  expect(gatePath('/es/search')).toEqual({ action: 'ok' })
  // trailing slash single-hops straight to the final target
  expect(gatePath('/guides/sup-yoga/')).toEqual({ action: 'redirect', to: '/knowledge' })
})

test('every legacy URL resolves to a live route', () => {
  for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
    expect(from, `legacy key must differ from its target`).not.toBe(to)
    if (to.startsWith('https://')) continue // cross-domain handoff to vectoflare.com (P1-7)
    expect(LIVE_ROUTES.has(to), `${from} → ${to} is not a live route`).toBe(true)
  }
})

test('no legacy key shadows a live page (P0-5)', () => {
  for (const from of Object.keys(LEGACY_REDIRECTS)) {
    expect(LIVE_ROUTES.has(from), `${from} shadows a live page and must be removed from LEGACY_REDIRECTS`).toBe(false)
    for (const prefix of DYNAMIC_PREFIXES) {
      expect(from.startsWith(`${prefix}/`), `${from} shadows dynamic ${prefix}/* routes`).toBe(false)
    }
  }
})

test('revived pages are served, not 301d (P0-5)', () => {
  expect(gatePath('/about/vectoflare').action).toBe('ok')
  expect(gatePath('/oem-paddle').action).toBe('ok')
  expect(gatePath('/factory/oem-capability').action).toBe('ok')
  expect(gatePath('/factory/capacity').action).toBe('ok')
  expect(gatePath('/randdcenter/hull-engineering').action).toBe('ok')
  expect(gatePath('/research/drop-stitch-technology').action).toBe('ok')
  expect(gatePath('/solutions/club-sup').action).toBe('ok')
  expect(gatePath('/private-label-sup').action).toBe('ok')
  expect(gatePath('/guides/beginner-guide').action).toBe('ok')
  expect(gatePath('/guides/inflatable-vs-hard').action).toBe('ok')
  expect(gatePath('/evidence/case-studies').action).toBe('ok')
})

test('content hubs 301 onto their keepers, sub-pages stay live (P1-2)', () => {
  // 10 hub indexes collapse onto the 4 keepers (en + es).
  const hubs: [string, string][] = [
    ['/learn', '/knowledge'], ['/academy', '/knowledge'], ['/guides', '/knowledge'],
    ['/research', '/knowledge'], ['/resources', '/knowledge'], ['/community', '/knowledge'],
    ['/lifestyle', '/knowledge'], ['/journal', '/news'], ['/media', '/products'], ['/evidence', '/projects'],
    ['/case-studies', '/projects'],
  ]
  for (const [from, to] of hubs) {
    expect(gatePath(from)).toEqual({ action: 'redirect', to })
    expect(gatePath(`/es${from}`)).toEqual({ action: 'redirect', to: `/es${to}` })
  }
  // Real content under the merged hubs remains live.
  expect(gatePath('/guides/how-to-choose-your-sup').action).toBe('ok')
  expect(gatePath('/research/ce-certification-guide').action).toBe('ok')
  expect(gatePath('/evidence/case-studies/beginner-sup-training').action).toBe('ok')
  expect(gatePath('/knowledge').action).toBe('ok')
  expect(gatePath('/projects').action).toBe('ok')
  expect(gatePath('/news').action).toBe('ok')
  expect(gatePath('/technology').action).toBe('ok')
  expect(gatePath('/es/knowledge').action).toBe('ok')
})

test('retired zh locale: every /zh/* URL 301s to its /es mirror', () => {
  expect(gatePath('/zh')).toEqual({ action: 'redirect', to: '/es' })
  expect(gatePath('/zh/solutions')).toEqual({ action: 'redirect', to: '/es/solutions' })
  expect(gatePath('/zh/what-is-sup')).toEqual({ action: 'redirect', to: '/es/what-is-sup' })
  expect(gatePath('/zh/products/sup-explorer-11')).toEqual({ action: 'redirect', to: '/es/products/sup-explorer-11' })
})

test('410 for removed template pages (P0-2)', () => {
  expect(gatePath('/docs')).toEqual({ action: 'gone' })
  expect(gatePath('/docs/features/auth')).toEqual({ action: 'gone' })
  expect(gatePath('/es/docs')).toEqual({ action: 'gone' })
  expect(gatePath('/es/docs/features/auth')).toEqual({ action: 'gone' })
  expect(gatePath('/zh/docs')).toEqual({ action: 'gone' })
  expect(gatePath('/waitlist')).toEqual({ action: 'gone' })
  expect(gatePath('/es/waitlist')).toEqual({ action: 'gone' })
  expect(gatePath('/zh/waitlist')).toEqual({ action: 'gone' })
  expect(gatePath('/changelog')).toEqual({ action: 'gone' })
  expect(gatePath('/es/changelog')).toEqual({ action: 'gone' })
  expect(gatePath('/zh/changelog')).toEqual({ action: 'gone' })
  // RIB case study removed (Vectoflare is SUP-only)
  expect(gatePath('/evidence/case-studies/marine-professional-operations')).toEqual({ action: 'gone' })
  expect(gatePath('/es/evidence/case-studies/marine-professional-operations')).toEqual({ action: 'gone' })
  // '/docs/' is normalised to '/docs' first (301), then 410 on the next hop
  expect(gatePath('/docs/')).toEqual({ action: 'slash', to: '/docs' })
})

test('trailing slash normalised (P0-6)', () => {
  expect(gatePath('/factory/')).toEqual({ action: 'slash', to: '/factory' })
  expect(gatePath('/es/solutions/')).toEqual({ action: 'slash', to: '/es/solutions' })
})

test('api/app/admin and plain paths untouched', () => {
  expect(gatePath('/factory').action).toBe('ok')
  expect(gatePath('/oem-manufacturing').action).toBe('ok')
  expect(gatePath('/odm-development').action).toBe('ok')
  expect(gatePath('/oem-odm-manufacturer').action).toBe('redirect')
  expect(gatePath('/api/v1/waitlist').action).toBe('ok')
  expect(gatePath('/app/dashboard').action).toBe('ok')
  expect(gatePath('/admin/users').action).toBe('ok')
})

test('redirect targets never redirect again', () => {
  for (const to of [...Object.values(EDGE_REDIRECTS), ...Object.values(LEGACY_REDIRECTS)]) {
    expect(gatePath(to).action).toBe('ok')
  }
})
