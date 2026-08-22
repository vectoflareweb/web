/**
 * Cloudflare Worker entry (wrangler `main`). Wraps the framework's default
 * server entry so every deployed response goes through cross-cutting steps:
 *   1. validate required env once per isolate (fail fast on misconfig),
 *   2. serve repeat marketing content / static assets from the edge cache
 *      (Cloudflare does not cache Worker responses on its own),
 *   3. add baseline security headers, and
 *   4. report unhandled exceptions to Sentry (when SENTRY_DSN is set).
 *
 * Importing `@tanstack/react-start/server-entry` reuses the exact handler the
 * framework would otherwise run, so SSR/streaming behaviour is unchanged.
 */
import * as Sentry from '@sentry/cloudflare'
import entry from '@tanstack/react-start/server-entry'
import { withSecurityHeaders } from '@/lib/security-headers'
import { runWithNonce, getNonce } from '@/lib/csp'
import { assertEnvOnce } from '@/lib/env-validate'
import { withMarketingCache, withStaticCache, isEdgeCacheable } from '@/lib/cache-headers'
import { gatePath } from '@/features/seo/edge-gate'
import { SITE_URL } from '@/config/site'
import { createDb } from '@/db/client'
import { runCleanup } from '@/features/maintenance/cleanup'

const fetchHandler = (
  entry as { fetch: (request: Request, env: Cloudflare.Env, ctx: ExecutionContext) => Promise<Response> }
).fetch

const handler = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    await assertEnvOnce()
    // Edge cache first: Cloudflare does not cache Worker responses by itself,
    // so every request would otherwise hit the worker (cold TTFB 2-6s). The
    // Cache API keyed on URL absorbs repeat marketing content and static
    // assets; TTL follows the Cache-Control max-age set below.
    const cache = (caches as unknown as { default: Cache }).default
    const cached = await cache.match(request)
    // Cached responses already carry their own security headers (incl. the
    // CSP nonce used by their inline scripts) — return them verbatim.
    if (cached) return cached

    // Edge URL policy first: 301 merges, 410 for removed template pages, and
    // trailing-slash normalisation — before any route/API handler runs.
    // Cache-Control: max-age=3600 (not longer) so redirects stay easy to amend.
    const gate = gatePath(new URL(request.url).pathname)
    if (gate.action === 'redirect' || gate.action === 'slash') {
      return new Response(null, { status: 301, headers: { location: gate.to, 'cache-control': 'max-age=3600' } })
    }
    if (gate.action === 'gone') {
      return new Response('Gone', { status: 410, headers: { 'cache-control': 'max-age=3600' } })
    }
    // The nonce scope must wrap BOTH the SSR render (script tags read it) and
    // header construction (CSP references it) — ALS makes that request-scoped.
    return runWithNonce(async () => {
      const response = await fetchHandler(request, env, ctx)
      const final = withSecurityHeaders(withStaticCache(request, withMarketingCache(request, response)), getNonce())
      if (isEdgeCacheable(request, final)) {
        ctx.waitUntil(cache.put(request, final.clone()))
      }
      return final
    })
  },

  // Cron Triggers entry (schedule in wrangler.jsonc → triggers.crons). Runs the
  // maintenance cleanup (03:00 UTC), rebuilds the AI knowledge index (03:00 UTC,
  // idempotent — safe to run from both crons) and warms the edge cache for the
  // hottest marketing URLs, so real users hit the edge instead of a cold worker.
  async scheduled(_controller: ScheduledController, env: Cloudflare.Env, _ctx: ExecutionContext): Promise<void> {
    const now = Date.now()
    // Daily maintenance cleanup — the "0 3 * * *" cron fires at exactly 03:00
    // UTC; the hourly window keeps it idempotent across the two crons.
    if (new Date(now).getUTCHours() === 3) {
      const result = await runCleanup(createDb(env.DB), now)
      console.log('[cron] cleanup', result)
      // AI knowledge index rebuild (bge-m3 embeddings → Vectorize). Graceful:
      // without AI/Vectorize bindings the assistant simply serves FAQ answers.
      if (env.AI && env.VECTORIZE) {
        try {
          const { rebuildAiIndex } = await import('@/features/ai/ingest')
          const stats = await rebuildAiIndex({ AI: env.AI, VECTORIZE: env.VECTORIZE, CACHE: env.CACHE })
          console.log('[cron] ai index rebuilt', stats)
        } catch (err) {
          console.error('[cron] ai index rebuild failed', err instanceof Error ? err.message : err)
        }
      } else {
        console.log('[cron] ai index rebuild skipped (no AI/Vectorize bindings)')
      }
    }
    await warmEdgeCache(env, _ctx)
  },
}

/**
 * Prime the Cloudflare edge cache (Cache API) for the hottest public URLs by
 * replaying a normal GET through this same handler. After the first warm run
 * every visitor gets an edge hit (~tens of ms) instead of a cold worker
 * render. Non-production domains (staging/local) fail DNS and are skipped.
 *
 * The product list is derived from the content loader (dynamically imported so
 * the 1.6MB corpus stays out of the worker's startup dependency graph — it is
 * only loaded inside scheduled events, and module-level parse results are
 * cached per isolate).
 */
async function warmEdgeCache(env: Cloudflare.Env, ctx: ExecutionContext): Promise<void> {
  const paths = [
    '/', '/es',
    '/solutions', '/solutions/custom-sup', '/solutions/private-label-sup', '/solutions/resort-sup', '/solutions/club-sup', '/solutions/school-sup',
    '/factory', '/quality', '/oem-odm-manufacturer',
    '/oem-moq-guide', '/oem-trust-assurance', '/proof-center',
    '/sup-oem-moq-lead-time',
  ]
  try {
    const { getPublicPaths } = await import('@/features/content/loader')
    paths.push(...getPublicPaths().filter((p) => p.startsWith('/products/')))
  } catch (err) {
    console.log('[cron] warm fallback list', err instanceof Error ? err.message : String(err))
  }
  const cache = (caches as unknown as { default: Cache }).default
  for (const path of paths) {
    // Warm requests use a fresh cache-busting query so the replay misses the
    // Cache API, renders the latest SSR output and then overwrites the clean
    // URL entry — otherwise a stale cached page would keep refreshing itself
    // (e.g. after every deploy) until its TTL expires.
    const cleanUrl = `${SITE_URL}${path}`
    const warmUrl = `${cleanUrl}?warm=${Date.now()}`
    try {
      const res = await handler.fetch(new Request(warmUrl, { headers: { 'accept': 'text/html' } }), env, ctx)
      if (res.status === 200) {
        ctx.waitUntil(cache.put(new Request(cleanUrl), res.clone()))
      } else {
        console.log('[cron] warm', path, res.status)
      }
      res.body?.cancel()
    } catch (err) {
      console.log('[cron] warm skipped', path, err instanceof Error ? err.message : String(err))
    }
  }
}

// withSentry catches unhandled exceptions / promise rejections in the worker.
// Returning undefined when no DSN is set disables Sentry entirely (degrades
// gracefully). tracesSampleRate: 0 keeps it errors-only — cheap by default.
export default Sentry.withSentry(
  (env: Cloudflare.Env) =>
    env.SENTRY_DSN ? { dsn: env.SENTRY_DSN, tracesSampleRate: 0, sendDefaultPii: false } : undefined,
  handler,
)
