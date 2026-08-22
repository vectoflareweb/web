/**
 * Server-side admin user list: queries the user table directly with Drizzle
 * (search by email OR name, whitelisted sort, pagination).
 *
 * Deliberately NOT `auth.api.listUsers`: that endpoint re-checks the session's
 * DB role, which breaks for admins granted via ADMIN_EMAILS after signup, and
 * it can only search one field at a time. Authorization is the caller's job —
 * every server-fn entry point gates with assertAdmin() (see ./middleware).
 * Plain async fn (no react-start import) so it is workers-testable.
 */
import { count, desc, asc, or, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { user } from '@/features/auth/auth.schema'

export interface AdminUserRow {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AdminUsersParams {
  q?: string
  page: number
  pageSize: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

const SORT_COLUMNS = { name: user.name, email: user.email, createdAt: user.createdAt } as const

export async function getAdminUsers(
  db: DB,
  params: AdminUsersParams,
): Promise<{ rows: AdminUserRow[]; total: number }> {
  const pattern = params.q ? `%${params.q.replace(/[%_!]/g, '!$&')}%` : null
  const where = pattern
    ? or(
        sql`${user.email} LIKE ${pattern} ESCAPE '!'`,
        sql`${user.name} LIKE ${pattern} ESCAPE '!'`,
      )
    : undefined
  const sortCol = SORT_COLUMNS[params.sortBy as keyof typeof SORT_COLUMNS] ?? user.createdAt
  const orderBy = params.sortDir === 'asc' ? asc(sortCol) : desc(sortCol)

  const [listed, [{ c: total }]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(where)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset(params.page * params.pageSize),
    db.select({ c: count() }).from(user).where(where),
  ])

  return { rows: listed, total: Number(total) }
}
