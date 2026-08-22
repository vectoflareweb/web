/**
 * Two-way sync between ADMIN_EMAILS (the single source of truth for the admin
 * role) and the DB `role` column (a cache better-auth's own admin endpoints
 * check).
 *
 * - Promote: an email added to ADMIN_EMAILS after the account exists passes our
 *   gate but is rejected by better-auth (banUser/impersonateUser) until the DB
 *   role catches up — stamp it on first gated access.
 * - Demote: an email REMOVED from ADMIN_EMAILS must actually lose access; the
 *   stale DB role alone must not keep the gate open. Note this means a role set
 *   only via better-auth's setRole API (not in ADMIN_EMAILS) is reverted on the
 *   user's next admin access — by design, env is the source of truth.
 *
 * Plain async fn (no react-start import) so it is workers-testable.
 */
import { eq } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { user } from '@/features/auth/auth.schema'
import { isAdminEmail } from './is-admin'

export type AdminRoleSync = 'promoted' | 'demoted' | null

export async function syncAdminRole(
  db: DB,
  u: { id: string; email: string; role?: string | null },
  adminEmailsRaw: string | undefined,
): Promise<AdminRoleSync> {
  const granted = isAdminEmail(u.email, adminEmailsRaw)
  if (granted && u.role !== 'admin') {
    await db.update(user).set({ role: 'admin', updatedAt: new Date() }).where(eq(user.id, u.id))
    return 'promoted'
  }
  if (!granted && u.role === 'admin') {
    await db.update(user).set({ role: 'user', updatedAt: new Date() }).where(eq(user.id, u.id))
    return 'demoted'
  }
  return null
}
