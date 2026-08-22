import type { DB } from '@/db/client'
import { waitlist } from '@/db/tables/waitlist'
import type { WaitlistSource } from './source'

/** D1 upsert keyed on email. Returns whether the row was new or already present.
 *  Single INSERT .. ON CONFLICT DO NOTHING — a select-then-insert would race on
 *  concurrent double-submits and surface the unique constraint as a 500. */
export async function upsertWaitlist(
  db: DB,
  input: { id: string; email: string; locale: string; source: WaitlistSource; now: Date },
): Promise<'added' | 'already'> {
  const inserted = await db
    .insert(waitlist)
    .values({
      id: input.id,
      email: input.email,
      locale: input.locale,
      source: input.source,
      createdAt: input.now,
    })
    .onConflictDoNothing({ target: waitlist.email })
    .returning({ id: waitlist.id })
  return inserted.length > 0 ? 'added' : 'already'
}
