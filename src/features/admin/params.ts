/**
 * Clamps for admin list-endpoint params. The server fns are live RPC endpoints —
 * a hand-crafted call bypasses the routes' validateSearch, and an unclamped
 * pageSize:-1 becomes SQLite `LIMIT -1` (an unbounded full-table dump).
 */
export function clampPage(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0
  return Math.max(0, n)
}

export function clampPageSize(v: unknown, fallback = 20, max = 100): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : fallback
  return Math.min(max, Math.max(1, n))
}

export function clampSortDir(v: unknown): 'asc' | 'desc' {
  return v === 'asc' ? 'asc' : 'desc'
}
