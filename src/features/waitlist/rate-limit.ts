/**
 * Fixed-window rate limit on Workers KV. KV is eventually consistent, so this
 * is abuse damping (bounds unauthenticated write volume), not a precise quota —
 * the right trade-off for a public form. Counter keys expire with the window.
 */
export async function fixedWindowLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSec: number,
  nowMs: number,
): Promise<boolean> {
  const windowId = Math.floor(nowMs / 1000 / windowSec)
  const k = `rl:${key}:${windowId}`
  const n = Number((await kv.get(k)) ?? '0')
  if (n >= limit) return false
  await kv.put(k, String(n + 1), { expirationTtl: Math.max(60, windowSec * 2) })
  return true
}
