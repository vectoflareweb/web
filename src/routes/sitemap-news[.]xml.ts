import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { getNewsPosts, getLocaleContentPaths } from '@/features/content/loader'

// News posts with real lastmod (post date). Posts with a Spanish sidecar
// ({slug}.es.mdx) emit the /es twin as an hreflang alternate.
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const es = new Set(getLocaleContentPaths('es'))
  const paths = getNewsPosts().map((p) => ({
    loc: `/news/${p.slug}`,
    lastmod: p.date.slice(0, 10),
    es: es.has(`/news/${p.slug}`),
  }))
  return new Response(buildSitemap(origin, paths, { locale: 'none' }), {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export const Route = createFileRoute('/sitemap-news.xml')({
  server: { handlers: { GET: handler } },
})
