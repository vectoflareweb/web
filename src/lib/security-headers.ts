/**
 * Baseline security response headers, applied to every response by the custom
 * server entry (src/worker.ts).
 *
 * The five always-on headers are universally safe. CSP is the only one that can
 * break an app, so it's prod-only (Vite dev needs eval/ws) and relies on a
 * per-request nonce (see src/lib/csp.ts) for the hydration + theme-boot inline
 * scripts — no 'unsafe-inline' for script-src. Inline styles (React style
 * attributes) keep 'unsafe-inline' on style-src only, which is CSS — not a
 * script-execution vector.
 */

const BASE_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), fullscreen=(self), clipboard-write=(self), payment=(), sync-xhr=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com`, // Turnstile + Web Analytics beacon + GA4 gtag
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://assets.myproduct.com", // blob: for client-side avatar preview
    "font-src 'self' data:", // fonts are self-hosted under /fonts
    "connect-src 'self' https://cloudflareinsights.com https://www.google-analytics.com https://analytics.google.com https://api.whatsapp.com", // Web Analytics beacon + GA4 POSTs
    "frame-src https://challenges.cloudflare.com", // Turnstile widget iframe
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

/** Return a copy of `res` with security headers added. Leaves the body untouched (streams pass through). */
export function withSecurityHeaders(res: Response, nonce?: string): Response {
  // Never rewrap a protocol upgrade (e.g. dev HMR websockets).
  const isUpgrade = res.status === 101 || (res as { webSocket?: unknown }).webSocket != null
  if (isUpgrade) return res

  const headers = new Headers(res.headers)
  for (const [key, value] of Object.entries(BASE_HEADERS)) headers.set(key, value)
  // A nonce-less prod response (e.g. a non-HTML asset) skips CSP entirely:
  // sending a policy the inline scripts don't match would break the app.
  if (import.meta.env.PROD && !headers.has('Content-Security-Policy') && nonce) {
    headers.set('Content-Security-Policy', buildCsp(nonce))
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
