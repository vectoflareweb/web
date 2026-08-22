import { createFileRoute } from '@tanstack/react-router'
import { isLocale } from '@/features/i18n/locale'

/**
 * AI sales assistant (POST /api/ask) — public RAG endpoint. The entire AI
 * stack is imported lazily inside the handler so routeTree preload never
 * drags it into the client bundle. Rate-limited per IP (fail-open on KV
 * errors) plus a daily global cap of 500 AI queries (≈7,000 neurons, staying
 * under the 10,000 free-tier daily neuron budget with margin for reindex);
 * hot answers are KV-cached server-side.
 */

const MAX_HISTORY = 6

interface AskBody {
  question?: unknown
  history?: unknown
  locale?: unknown
}

export const Route = createFileRoute('/api/ask')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: AskBody
        try {
          body = (await request.json()) as AskBody
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 })
        }
        const question = typeof body.question === 'string' ? body.question.trim() : ''
        if (!question || question.length > 1000) {
          return Response.json({ error: 'question required (max 1000 chars)' }, { status: 400 })
        }
        const history = Array.isArray(body.history)
          ? body.history
              .slice(-MAX_HISTORY)
              .filter(
                (m): m is { role: 'user' | 'assistant'; content: string } =>
                  !!m &&
                  typeof m === 'object' &&
                  ('role' in m) && (m.role === 'user' || m.role === 'assistant') &&
                  typeof m.content === 'string',
              )
              .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
          : []
        const locale = typeof body.locale === 'string' && isLocale(body.locale) ? body.locale : 'en'

        const { getRequestHeader } = await import('@tanstack/react-start/server')
        const { fixedWindowLimit } = await import('@/features/waitlist/rate-limit')
        const { env } = await import('@/lib/env')
        const ip = getRequestHeader('cf-connecting-ip') ?? 'unknown'

        // Per-IP rate limit + daily global cap — both fail-open (damping, not a
        // security boundary) so a KV hiccup never breaks the widget.
        try {
          const allowed = await fixedWindowLimit(env.CACHE, `ask:${ip}`, 10, 600, Date.now())
          if (!allowed) return new Response('Too Many Requests', { status: 429 })
          const day = new Date().toISOString().slice(0, 10)
          const count = await env.CACHE.get<number>(`aiq:${day}`, 'json').catch(() => null)
          if (count !== null && count >= 500) {
            return new Response('Rate limit exceeded', { status: 429 })
          }
          await env.CACHE.put(`aiq:${day}`, JSON.stringify((count ?? 0) + 1), {
            expirationTtl: 86400,
          }).catch(() => {})
        } catch (err) {
          console.error('[ask] quota check failed (allowing)', err)
        }

        const { ask } = await import('@/features/ai/ask.server')
        const result = await ask(env, { question, history, locale })
        return Response.json({ ...result, ok: result.mode !== 'none' })
      },
    },
  },
})
