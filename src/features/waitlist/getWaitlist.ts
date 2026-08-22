import { desc, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { waitlist } from '@/db/tables/waitlist'

export interface WaitlistRow {
  email: string
  locale: string
  source: string
  createdAt: Date | string
}

export async function getWaitlist(
  db: DB,
  params: { page: number; pageSize: number },
): Promise<{ rows: WaitlistRow[]; total: number }> {
  const rows = await db
    .select({
      email: waitlist.email,
      locale: waitlist.locale,
      source: waitlist.source,
      createdAt: waitlist.createdAt,
    })
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt))
    .limit(params.pageSize)
    .offset(params.page * params.pageSize)
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(waitlist)
  return { rows, total: Number(count) }
}
