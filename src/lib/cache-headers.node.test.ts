import { describe, expect, it } from 'vitest'
import { isEdgeCacheable, withMarketingCache, withStaticCache } from './cache-headers'

const GET = (_path: string, type = 'text/html; charset=utf-8') =>
  new Response('<html></html>', { headers: { 'content-type': type } })

describe('withMarketingCache', () => {
  it('caches public marketing HTML for 1h with stale-while-revalidate', () => {
    const r = withMarketingCache(new Request('https://x.test/'), GET('/'))
    expect(r.headers.get('cache-control')).toBe('public, max-age=3600, stale-while-revalidate=86400')
  })

  it('respects an upstream Cache-Control (redirects)', () => {
    const r = withMarketingCache(
      new Request('https://x.test/legacy'),
      new Response(null, { status: 301, headers: { location: '/new', 'cache-control': 'max-age=3600' } }),
    )
    expect(r.headers.get('cache-control')).toBe('max-age=3600')
  })

  it('forces no-store on app/admin/api/auth paths and leaves non-GET public paths alone', () => {
    for (const path of ['/app', '/admin', '/api/x', '/app/dashboard', '/login', '/register', '/sign-in', '/forgot-password', '/auth/x', '/oauth/callback', '/verify/x']) {
      const r = withMarketingCache(new Request(`https://x.test${path}`), GET(path))
      expect(r.headers.get('cache-control')).toBe('private, no-store')
      expect(r.headers.get('vary')).toBe('Cookie')
    }
    const apiPost = withMarketingCache(new Request('https://x.test/api/auth/sign-in', { method: 'POST' }), GET('/api/auth/sign-in'))
    expect(apiPost.headers.get('cache-control')).toBe('private, no-store')
    const post = withMarketingCache(new Request('https://x.test/', { method: 'POST' }), GET('/'))
    expect(post.headers.has('cache-control')).toBe(false)
  })

  it('does not cache non-HTML responses', () => {
    const r = withMarketingCache(new Request('https://x.test/'), GET('/', 'application/json'))
    expect(r.headers.has('cache-control')).toBe(false)
  })

  it('caches crawler files (robots/sitemap/llms) for 1h with stale-while-revalidate', () => {
    for (const path of ['/robots.txt', '/llms.txt', '/sitemap.xml', '/sitemap-pages.xml', '/sitemap-products.xml']) {
      const r = withMarketingCache(new Request(`https://x.test${path}`), GET(path, 'application/xml'))
      expect(r.headers.get('cache-control')).toBe('public, max-age=3600, stale-while-revalidate=86400')
    }
  })
})

describe('withStaticCache', () => {
  it('caches hashed build assets as immutable for a year', () => {
    for (const path of [
      '/assets/index-DYsAOzxM.js',
      '/assets/app-BH3xOMGs.css',
      '/assets/_-_-locale_-OjHCjNFD.js',
      '/assets/chunk-aB3xK7mN9pQ.js',
    ]) {
      const r = withStaticCache(new Request(`https://x.test${path}`), GET(path, 'text/javascript'))
      expect(r.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    }
  })

  it('caches fonts for 7 days', () => {
    const r = withStaticCache(new Request('https://x.test/fonts/manrope-latin-700-normal.woff2'), GET('/fonts/x.woff2', 'font/woff2'))
    expect(r.headers.get('cache-control')).toBe('public, max-age=604800')
  })

  it('caches non-hashed public images for 7 days', () => {
    const r = withStaticCache(new Request('https://x.test/assets/products/2026/mini/mini-01.avif'), GET('/assets/products/2026/mini/mini-01.avif', 'image/avif'))
    expect(r.headers.get('cache-control')).toBe('public, max-age=604800')
    const qr = withStaticCache(new Request('https://x.test/assets/wechat-qr.jpg'), GET('/assets/wechat-qr.jpg', 'image/jpeg'))
    expect(qr.headers.get('cache-control')).toBe('public, max-age=604800')
  })

  it('leaves HTML and non-GET untouched', () => {
    const html = withStaticCache(new Request('https://x.test/'), GET('/'))
    expect(html.headers.has('cache-control')).toBe(false)
    const post = withStaticCache(new Request('https://x.test/assets/x-yyyyyyyy.js', { method: 'POST' }), GET('/x'))
    expect(post.headers.has('cache-control')).toBe(false)
  })
})

describe('isEdgeCacheable', () => {
  it('accepts marketing HTML, redirects and static assets', () => {
    const home = withMarketingCache(new Request('https://x.test/'), GET('/'))
    expect(isEdgeCacheable(new Request('https://x.test/'), home)).toBe(true)
    const redirect = new Response(null, { status: 301, headers: { location: '/new', 'cache-control': 'max-age=3600' } })
    expect(isEdgeCacheable(new Request('https://x.test/legacy'), redirect)).toBe(true)
    const img = withStaticCache(
      new Request('https://x.test/assets/products/2026/mini/mini-01.avif'),
      GET('/assets/products/2026/mini/mini-01.avif', 'image/avif'),
    )
    expect(isEdgeCacheable(new Request('https://x.test/assets/products/2026/mini/mini-01.avif'), img)).toBe(true)
  })

  it('rejects private paths, POST, error statuses and no-store responses', () => {
    const noCc = new Response('<html></html>', { status: 200 })
    for (const path of ['/app', '/app/dashboard', '/admin', '/api/me', '/docs/quickstart']) {
      expect(isEdgeCacheable(new Request(`https://x.test${path}`), noCc)).toBe(false)
    }
    expect(isEdgeCacheable(new Request('https://x.test/', { method: 'POST' }), GET('/'))).toBe(false)
    expect(isEdgeCacheable(new Request('https://x.test/'), new Response('nope', { status: 500, headers: { 'cache-control': 'max-age=3600' } }))).toBe(false)
    expect(isEdgeCacheable(new Request('https://x.test/'), new Response(null, { status: 302, headers: { 'cache-control': 'max-age=60' } }))).toBe(false)
  })
})