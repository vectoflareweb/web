import { test, expect } from 'vitest'
import { buildRobots, buildSitemap, buildLocaleSitemap, buildSitemapIndex, localeHead } from '@/features/seo/seo'
import { localizePath } from '@/features/i18n/locale'

const origin = 'https://app.example.com'

test('localizePath: en no prefix, es prefixed', () => {
  expect(localizePath('en', '/')).toBe('/')
  expect(localizePath('es', '/')).toBe('/es')
  expect(localizePath('en', '/products')).toBe('/products')
  expect(localizePath('es', '/products')).toBe('/es/products')
})

test('robots disallows app/admin/api/docs + allows AI crawlers explicitly', () => {
  const r = buildRobots(origin)
  expect(r).toContain('Disallow: /*/app')
  expect(r).toContain('Disallow: /app')
  expect(r).toContain('Disallow: /*/admin')
  expect(r).toContain('Disallow: /api')
  expect(r).toContain('Disallow: /docs')
  expect(r).toContain('Disallow: /waitlist')
  expect(r).toContain('Disallow: /changelog')
  expect(r).toContain(`Sitemap: ${origin}/sitemap.xml`)
  // GEO: explicit allow groups for AI crawlers (checklist P0-1)
  expect(r).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference')
  for (const agent of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']) {
    expect(r).toContain(`User-agent: ${agent}\nAllow: /`)
  }
  // exactly one wildcard group
  expect(r.match(/^User-agent: \*/gm)).toHaveLength(1)
})

test('locale sitemap: single locale + lastmod + hreflang', () => {
  const xml = buildLocaleSitemap(origin, 'en', [{ path: '/factory', lastmod: '2026-06-01' }])
  expect(xml).toContain(`<loc>${origin}/factory</loc>`)
  expect(xml).toContain('<lastmod>2026-06-01</lastmod>')
  expect(xml).toContain('hreflang="es-ES"')
  expect(xml).toContain(`href="${origin}/es/factory"`)
  expect(xml).not.toContain(`<loc>${origin}/es/factory</loc>`)
})

test('sitemap index aggregates per-section files', () => {
  const xml = buildSitemapIndex(origin, ['sitemap-pages.xml', 'sitemap-es.xml'])
  expect(xml).toContain('<sitemapindex')
  expect(xml).toContain(`<loc>${origin}/sitemap-pages.xml</loc>`)
  expect(xml).toContain(`<loc>${origin}/sitemap-es.xml</loc>`)
})

test('sitemap lists both locales of public pages with hreflang', () => {
  const xml = buildSitemap(origin)
  expect(xml).toContain('<urlset')
  expect(xml).toContain(`<loc>${origin}/</loc>`)
  expect(xml).toContain(`<loc>${origin}/es</loc>`)
  expect(xml).toContain(`<loc>${origin}/solutions</loc>`)
  expect(xml).toContain(`<loc>${origin}/es/solutions</loc>`)
  expect(xml).toContain(`<loc>${origin}/contact</loc>`)
  expect(xml).toContain(`<loc>${origin}/es/contact</loc>`)
  expect(xml).toContain(`<loc>${origin}/product-development</loc>`)
  expect(xml).toContain(`<loc>${origin}/es/product-development</loc>`)
  expect(xml).toContain('hreflang="en-US"')
  expect(xml).toContain('hreflang="es-ES"')
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain(`<loc>${origin}/products</loc>`)
  expect(xml).toContain(`<loc>${origin}/es/products</loc>`)
  expect(xml).toContain(`<loc>${origin}/solutions/school-sup</loc>`)
  expect(xml).toContain(`<loc>${origin}/es/solutions/school-sup</loc>`)
  expect(xml).not.toContain(`<loc>${origin}/custom-sup-manufacturing</loc>`)
  expect(xml).not.toContain(`<loc>${origin}/sup-for-resorts</loc>`)
  expect(xml).not.toContain(`<loc>${origin}/solutions/custom-sup</loc>`)
})

test('sitemap includes single-locale docs paths without hreflang alternates', () => {
  const xml = buildSitemap(origin, ['/docs', '/docs/install'])
  // exact <url> block match — alternates would sit between </loc> and </url>
  expect(xml).toContain(`<url><loc>${origin}/docs</loc></url>`)
  expect(xml).toContain(`<url><loc>${origin}/docs/install</loc></url>`)
  // no es-prefixed docs URL, and no alternate hreflang for docs
  expect(xml).not.toContain(`${origin}/es/docs`)
})

test('localeHead: canonical + hreflang alternates + og', () => {
  const head = localeHead({ origin, locale: 'es', path: '/products', title: 'T', description: 'D' })
  expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(`${origin}/es/products`)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hreflang === 'en-US' && l.href === `${origin}/products`)).toBe(true)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hreflang === 'es-ES' && l.href === `${origin}/es/products`)).toBe(true)
  expect(head.links.some((l) => l.hreflang === 'x-default')).toBe(true)
  expect(head.meta.some((m) => m.title === 'T')).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:url' && m.content === `${origin}/es/products`)).toBe(true)
})
