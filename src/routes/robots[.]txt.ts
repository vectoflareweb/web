import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildRobots } from '@/features/seo/seo'

const handler = () =>
  new Response(buildRobots(new URL(env.BETTER_AUTH_URL).origin), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })

export const Route = createFileRoute('/robots.txt')({
  server: { handlers: { GET: handler } },
})
