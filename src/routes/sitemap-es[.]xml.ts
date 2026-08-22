import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildLocaleSitemap, PUBLIC_PATHS } from '@/features/seo/seo'
import { EDGE_REDIRECTS } from '@/features/seo/edge-gate'
import { LEGACY_REDIRECTS } from '@/features/seo/legacy-redirects'
import { getLocalePaths, getLocaleContentPaths } from '@/features/content/loader'
import { GUIDES_ES } from '@/features/content/guide-content'
import { projects } from '@/product/projects'
import { knowledge } from '@/product/knowledge'
import { seriesPages } from '@/product/series-pages'

// Spanish marketing pages (hreflang-linked to the English pages file) plus the
// vectoflare pages and detail content (news/products/technology/case-use/guides)
// that ship a real Spanish variant.
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const vectoflareEs = getLocalePaths('es')
    .filter((p) => !(p in EDGE_REDIRECTS) && !(p in LEGACY_REDIRECTS))
    .map((p) => ({ path: p }))
  const detailEs = [
    { path: '/evidence/case-studies' },
    { path: '/terms' },
    { path: '/privacy' },
    ...getLocaleContentPaths('es').map((p) => ({ path: p })),
    ...GUIDES_ES.map((g) => ({ path: `/guides/${g.slug}` })),
    ...projects.es.map((p) => ({ path: `/projects/${p.slug}` })),
    ...knowledge.es.map((a) => ({ path: `/knowledge/${a.slug}` })),
    ...seriesPages.es.map((s) => ({ path: `/products/${s.slug}` })),
  ]
  return new Response(buildLocaleSitemap(origin, 'es', [...PUBLIC_PATHS, ...detailEs, ...vectoflareEs]), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export const Route = createFileRoute('/sitemap-es.xml')({
  server: { handlers: { GET: handler } },
})
