import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemapIndex } from '@/features/seo/seo'

const handler = () =>
  new Response(
    buildSitemapIndex(new URL(env.BETTER_AUTH_URL).origin, [
      'sitemap-pages.xml',
      'sitemap-es.xml',
      'sitemap-products.xml',
      'sitemap-news.xml',
    ]),
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } },
  )

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: handler } },
})
