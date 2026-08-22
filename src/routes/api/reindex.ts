import { createFileRoute } from '@tanstack/react-router'

/**
 * Guarded AI index rebuild (POST /api/reindex) — invoked by the CI pipeline
 * (`.github/workflows/ai-index.yml`) right after each production deploy, so
 * the Vectorize index reflects the freshly deployed corpus instead of waiting
 * for the 03:00 cron (which stays as the daily safety net). Gated by a bearer
 * token: 404 when REINDEX_TOKEN is unset, 401 on mismatch — invisible to the
 * public (robots.txt already disallows /api/*).
 */

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const Route = createFileRoute('/api/reindex')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { env } = await import('@/lib/env')
        if (!env.REINDEX_TOKEN) return new Response('Not Found', { status: 404 })
        const auth = request.headers.get('authorization') ?? ''
        if (!auth.startsWith('Bearer ') || !safeEqual(auth.slice(7), env.REINDEX_TOKEN)) {
          return new Response('Unauthorized', { status: 401 })
        }
        if (!env.AI || !env.VECTORIZE) {
          return Response.json({ ok: false, error: 'AI/Vectorize bindings unavailable' }, { status: 503 })
        }
        const { rebuildAiIndex } = await import('@/features/ai/ingest')
        try {
          const stats = await rebuildAiIndex({ AI: env.AI, VECTORIZE: env.VECTORIZE, CACHE: env.CACHE })
          return Response.json({ ok: true, stats })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('[reindex] failed', err instanceof Error ? err.stack ?? err.message : err)
          return Response.json({ ok: false, error: msg }, { status: 500 })
        }
      },
    },
  },
})
