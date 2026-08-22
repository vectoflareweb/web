import type { Resend } from 'resend'

export type AddContactResult = 'added' | 'skipped' | 'failed'

/**
 * Upsert a contact into a Resend audience. Pure of env: pass a client + audience
 * id (null/null to skip). Reused by waitlist now and a future newsletter.
 */
export async function addContactTo(
  resend: Resend | null,
  audienceId: string | null,
  email: string,
): Promise<AddContactResult> {
  if (!resend || !audienceId) return 'skipped'
  try {
    const got = await resend.contacts.get({ email, audienceId })
    if (got.error) {
      const created = await resend.contacts.create({ email, audienceId, unsubscribed: false })
      return created.error ? 'failed' : 'added'
    }
    return 'added'
  } catch (err) {
    console.error('[audience] addContact failed', err)
    return 'failed'
  }
}

/** Env-bound wrapper: builds the client from env and upserts. Degrades to 'skipped'. */
export async function addContact(email: string): Promise<AddContactResult> {
  const { env } = await import('@/lib/env')
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) return 'skipped'
  const { Resend } = await import('resend')
  return addContactTo(new Resend(env.RESEND_API_KEY), env.RESEND_AUDIENCE_ID, email)
}
