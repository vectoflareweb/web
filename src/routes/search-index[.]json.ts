import { createFileRoute } from '@tanstack/react-router'
import { buildFullIndex } from '@/features/site/search-index.server'

// `/search-index.json` — full-site search index for the header search dialog.
const handler = () => {
  const entries = buildFullIndex()
  return new Response(JSON.stringify(entries), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export const Route = createFileRoute('/search-index.json')({
  server: { handlers: { GET: handler } },
})
