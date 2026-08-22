/**
 * Edge/CDN cache headers for public responses, applied in src/worker.ts.
 *
 * - Marketing HTML is immutable per deploy: cache 1h at the edge so repeat
 *   crawls of the SEO surface miss the worker. Authenticated/API responses
 *   are left untouched.
 * - Hashed build outputs under /assets/ (index-<hash>.js, app-<hash>.css) are
 *   immutable per deploy — cached for a year so repeat visits and back-forth
 *   navigation never re-validate them. The framework otherwise serves them
 *   with `max-age=0, must-revalidate` (a conditional request per asset).
 * - Fonts keep a shorter 7-day cache: their filenames carry no hash, so a
 *   future subset swap must not be masked from clients for a year.
 */

const HASHED_ASSET = /^\/assets\/[^/]+-[0-9A-Za-z_-]{8,}\.(?:js|mjs|css)$/
const FONT = /^\/fonts\/[^/]+\.woff2$/
// Un-hashed public images (e.g. /assets/products/2026/...). No fingerprint in
// the URL, so keep it short: cache 7 days, refresh sooner on release.
const STATIC_PUBLIC = /^\/assets\//
// Crawler files (robots.txt, sitemap*.xml, llms.txt): content changes only on
// release, so 1h at the edge stops every crawl from re-rendering the worker.
const SEO_TEXT = /^\/(?:robots\.txt|llms\.txt|sitemap(?:-[a-z]+)?\.xml|entity\.json|search-index\.json)$/

/** Path segments whose responses must never be cached (any method). */
const PRIVATE_SEGMENTS = new Set([
  'app',
  'admin',
  'api',
  'login',
  'register',
  'sign-in',
  'sign-up',
  'signout',
  'forgot-password',
  'reset-password',
  'auth',
  'oauth',
  'verify',
])

function isPrivatePathname(path: string): boolean {
  const segment = path.split('/')[1] ?? ''
  return PRIVATE_SEGMENTS.has(segment)
}

export function withMarketingCache(request: Request, response: Response): Response {
  const isUpgrade = response.status === 101 || (response as { webSocket?: unknown }).webSocket != null
  if (isUpgrade) return response
  const path = new URL(request.url).pathname
  // Private surfaces must never be cached — even the framework may stamp a
  // `Cache-Control: public` on its SSR responses, which would let browsers/CDN
  // serve one user's account page to another (or replay a stale session page
  // within the hour). Force no-store so this layer is immune to that, for
  // every method (auth POSTs carry Set-Cookie and must not be cacheable).
  // `Vary: Cookie` further splits any shared cache key by session so a CDN
  // rule that ignores origin Cache-Control cannot mix users' responses.
  if (isPrivatePathname(path)) {
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'private, no-store')
    headers.set('Vary', headers.get('Vary') ? `${headers.get('Vary')}, Cookie` : 'Cookie')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return response
  if (SEO_TEXT.test(path)) {
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return response
  const headers = new Headers(response.headers)
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export function withStaticCache(request: Request, response: Response): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') return response
  const path = new URL(request.url).pathname
  const headers = new Headers(response.headers)
  if (HASHED_ASSET.test(path)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (FONT.test(path)) {
    headers.set('Cache-Control', 'public, max-age=604800')
  } else if (STATIC_PUBLIC.test(path)) {
    headers.set('Cache-Control', 'public, max-age=604800')
  } else {
    return response
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

/** Paths that must never be served from a shared edge cache. */
export function isPrivatePath(path: string): boolean {
  return isPrivatePathname(path) || path.startsWith('/docs')
}

/**
 * Whether a response qualifies for the Cloudflare Cache API (used by
 * src/worker.ts). Marketing HTML, redirects and static assets all carry a
 * max-age, so the edge can absorb repeat requests without hitting the worker.
 * Cache-Control is also the TTL hint for the cache layer.
 */
export function isEdgeCacheable(request: Request, response: Response): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (isPrivatePath(new URL(request.url).pathname)) return false
  if (response.status !== 200 && response.status !== 301 && response.status !== 410) return false
  const m = /max-age=(\d+)/.exec(response.headers.get('Cache-Control') ?? '')
  return m != null && Number(m[1]) > 0
}