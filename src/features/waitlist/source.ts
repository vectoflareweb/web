export type WaitlistSource = 'waitlist' | 'catalog'

/** Server-side allowlist for the client-supplied attribution source. */
export function clampSource(s: string | undefined): WaitlistSource {
  return s === 'catalog' ? 'catalog' : 'waitlist'
}