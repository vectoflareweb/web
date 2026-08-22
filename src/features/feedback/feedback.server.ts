/**
 * Feedback 纯函数层 —— 本仓库「垂直切片」的教学范本。
 * 归属过滤一律走 @/db/scope（ownedBy/withOwner）：商业版切多租户只改 scope.ts。
 * 无 react-start import，workers 池可直接测。
 */
import { and, desc, eq, count } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { ownedBy, withOwner, type Scope } from '@/db/scope'
import { user } from '@/features/auth/auth.schema'
import { feedback, type Feedback } from './feedback.schema'
import { FEEDBACK_STATUSES, TITLE_MAX, BODY_MAX, OPEN_LIMIT, type FeedbackStatus } from './feedback.shared'
export { TITLE_MAX, BODY_MAX, OPEN_LIMIT }

export type CreateFeedbackResult = { ok: true; id: string } | { ok: false; reason: 'title' | 'body' | 'limit' }

export async function createFeedback(db: DB, scope: Scope, input: { title: string; body: string }, now: number): Promise<CreateFeedbackResult> {
  const title = input.title.trim()
  const body = (input.body ?? '').trim()
  if (!title || title.length > TITLE_MAX) return { ok: false, reason: 'title' }
  if (body.length > BODY_MAX) return { ok: false, reason: 'body' }
  // COUNT→INSERT 非原子：并发提交可短暂超限。这是软闸（真正的治理是 admin ban），
  // 为它上事务/唯一约束不值得——教学示例保持诚实的简单。
  const [{ c }] = await db.select({ c: count() }).from(feedback)
    .where(and(ownedBy(feedback, scope), eq(feedback.status, 'open')))
  if (Number(c) >= OPEN_LIMIT) return { ok: false, reason: 'limit' }
  const id = crypto.randomUUID()
  await db.insert(feedback).values(withOwner(scope, {
    id, title, body, status: 'open', createdAt: new Date(now), updatedAt: new Date(now),
  }))
  return { ok: true, id }
}

export async function listMyFeedback(db: DB, scope: Scope): Promise<Feedback[]> {
  return db.select().from(feedback).where(ownedBy(feedback, scope)).orderBy(desc(feedback.createdAt))
}

/** 归属 + 状态双守卫在同一条 SQL 里：漏掉前者是越权删除，漏掉后者会抹掉治理记录。 */
export async function deleteMyFeedback(db: DB, scope: Scope, id: string): Promise<boolean> {
  const res = await db.delete(feedback)
    .where(and(ownedBy(feedback, scope), eq(feedback.id, id), eq(feedback.status, 'open')))
    .returning({ id: feedback.id })
  return res.length > 0
}

export interface AdminFeedbackRow {
  id: string; title: string; body: string; status: string; adminNote: string | null
  createdAt: Date | string; name: string | null; email: string | null
}

export async function listFeedbackForAdmin(db: DB, p: { page: number; pageSize: number }): Promise<{ rows: AdminFeedbackRow[]; total: number }> {
  const listed = await db
    .select({
      id: feedback.id, title: feedback.title, body: feedback.body, status: feedback.status,
      adminNote: feedback.adminNote, createdAt: feedback.createdAt,
      name: user.name, email: user.email,
    })
    .from(feedback)
    .leftJoin(user, eq(feedback.userId, user.id))
    .orderBy(desc(feedback.createdAt))
    .limit(p.pageSize)
    .offset(p.page * p.pageSize)
  const [{ c }] = await db.select({ c: count() }).from(feedback)
  const rows: AdminFeedbackRow[] = listed.map((r) => ({
    id: r.id, title: r.title, body: r.body, status: r.status, adminNote: r.adminNote,
    createdAt: r.createdAt, name: r.name, email: r.email,
  }))
  return { rows, total: Number(c) }
}

export async function setFeedbackStatus(db: DB, id: string, status: FeedbackStatus, adminNote: string | null, now: number): Promise<void> {
  if (!FEEDBACK_STATUSES.includes(status)) throw new Error(`invalid status: ${status}`)
  await db.update(feedback)
    .set({ status, adminNote: adminNote?.trim() || null, updatedAt: new Date(now) })
    .where(eq(feedback.id, id))
}
