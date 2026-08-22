const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Server-side Turnstile check. No secret → skip (returns true), matching the
 * project's graceful-degradation convention. */
export async function verifyTurnstile(token: string, secret: string | undefined): Promise<boolean> {
  if (!secret) return true
  if (!token) return false
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('[waitlist] turnstile verify failed', err)
    return false
  }
}
