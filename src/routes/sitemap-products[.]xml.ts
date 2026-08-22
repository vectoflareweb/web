import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { getContentProducts, getTechArticles, getCaseUses, getLocaleContentPaths } from '@/features/content/loader'

// Product / technology / case-study detail pages. Entries with a real Spanish
// sidecar ({slug}.es.*) emit the /es twin as an hreflang alternate.
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const es = new Set(getLocaleContentPaths('es'))
  const paths = [
    ...getContentProducts().map((p) => ({ loc: `/products/${p.slug}`, lastmod: '2026-06-01', es: es.has(`/products/${p.slug}`) })),
    ...getTechArticles().map((p) => ({ loc: `/technology/${p.slug}`, lastmod: '2026-06-01', es: es.has(`/technology/${p.slug}`) })),
    ...getCaseUses().map((p) => ({ loc: `/evidence/case-studies/${p.slug}`, lastmod: '2026-06-01', es: es.has(`/evidence/case-studies/${p.slug}`) })),
  ]
  return new Response(buildSitemap(origin, paths, { locale: 'none' }), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export const Route = createFileRoute('/sitemap-products.xml')({
  server: { handlers: { GET: handler } },
})
