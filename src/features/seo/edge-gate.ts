/**
 * Edge URL policy — applied in worker.ts before the framework handler.
 *
 * P0-4: 301 merge of duplicate pages (canonical target must not redirect again).
 * P0-x: 301 legacy URLs (redirect data from src/product/edge-redirects.ts).
 * P0-2: 410 for removed pages (/docs, /waitlist, /changelog).
 * P0-6: trailing-slash normalisation (301 to the slash-less URL).
 * zh→es: every remaining /zh/* URL 301s to its /es mirror.
 */

import { EDGE_REDIRECTS, GONE_PATHS } from '@/product/edge-redirects'
import { LEGACY_REDIRECTS } from '@/features/seo/legacy-redirects'

export { EDGE_REDIRECTS }

export type EdgeGate =
  | { action: 'ok' }
  | { action: 'redirect'; to: string }
  | { action: 'gone' }
  | { action: 'slash'; to: string }

export function gatePath(pathname: string): EdgeGate {
  if (pathname.startsWith('/api') || pathname.startsWith('/app') || pathname.startsWith('/admin')) {
    return { action: 'ok' }
  }
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname
  if (path !== pathname) {
    const direct = EDGE_REDIRECTS[path] ?? LEGACY_REDIRECTS[path]
    if (direct) return { action: 'redirect', to: direct }
    return { action: 'slash', to: path }
  }
  const redirect = EDGE_REDIRECTS[path]
  if (redirect) return { action: 'redirect', to: redirect }
  const legacy = LEGACY_REDIRECTS[path]
  if (legacy) return { action: 'redirect', to: legacy }
  const gone =
    path === '/docs' ||
    path.startsWith('/docs/') ||
    path === '/es/docs' ||
    path.startsWith('/es/docs/') ||
    path === '/zh/docs' ||
    path.startsWith('/zh/docs/') ||
    GONE_PATHS.includes(path)
  if (gone) return { action: 'gone' }
  if (path === '/zh' || path.startsWith('/zh/')) {
    return { action: 'redirect', to: path === '/zh' ? '/es' : `/es${path.slice(3)}` }
  }
  return { action: 'ok' }
}
