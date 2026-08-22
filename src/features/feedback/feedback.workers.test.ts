import { describe, test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { scopeFromUser } from '@/db/scope'
import { applyAuthSchema } from '@/features/auth/test-helpers'
import { user } from '@/features/auth/auth.schema'
import { createFeedback, listMyFeedback, deleteMyFeedback, listFeedbackForAdmin, setFeedbackStatus, OPEN_LIMIT } from './feedback.server'

beforeAll(async () => {
  await applyAuthSchema(env.DB)
  await env.DB.exec(
    `CREATE TABLE IF NOT EXISTS feedback (` +
    `id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, title TEXT NOT NULL, ` +
    `body TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', admin_note TEXT, ` +
    `created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  )
  const db = createDb(env.DB)
  await db.insert(user).values([
    { id: 'fb-a', name: 'FB A', email: 'fb-a@example.com', emailVerified: true, createdAt: new Date(1000), updatedAt: new Date(1000), role: 'user' },
    { id: 'fb-b', name: 'FB B', email: 'fb-b@example.com', emailVerified: true, createdAt: new Date(1000), updatedAt: new Date(1000), role: 'admin' },
  ]).onConflictDoNothing()
})

const A = scopeFromUser('fb-a')
const B = scopeFromUser('fb-b')

describe('createFeedback', () => {
  test('合法输入 → 落库且归属正确', async () => {
    const db = createDb(env.DB)
    const r = await createFeedback(db, A, { title: '  Dark mode for docs  ', body: 'please' }, 1000)
    expect(r.ok).toBe(true)
    const mine = await listMyFeedback(db, A)
    expect(mine.some((f) => f.title === 'Dark mode for docs')).toBe(true) // trim 生效
  })
  test('空标题 / 超长 body → 校验失败', async () => {
    const db = createDb(env.DB)
    expect(await createFeedback(db, A, { title: '   ', body: '' }, 1000)).toEqual({ ok: false, reason: 'title' })
    expect(await createFeedback(db, A, { title: 'x', body: 'y'.repeat(2001) }, 1000)).toEqual({ ok: false, reason: 'body' })
  })
  test('open 存量达上限 → limit', async () => {
    const db = createDb(env.DB)
    for (let i = 0; i < OPEN_LIMIT + 2; i++) await createFeedback(db, B, { title: `spam ${i}`, body: '' }, 2000 + i)
    const r = await createFeedback(db, B, { title: 'one more', body: '' }, 9000)
    expect(r).toEqual({ ok: false, reason: 'limit' })
    // 非 open 状态不占额度：关闭一条后可再提
    const mine = await listMyFeedback(db, B)
    await setFeedbackStatus(db, mine[0].id, 'closed', null, 9100)
    expect((await createFeedback(db, B, { title: 'after close', body: '' }, 9200)).ok).toBe(true)
    // 测试间共享同一 D1（无逐用例存储回滚）：这条用例刻意把 B 打到 open 上限做边界断言，
    // 结尾必须把 B 的 open 存量清零，否则会把"已在上限"状态泄漏给下面依赖 B 还能再提交的用例。
    for (const f of (await listMyFeedback(db, B)).filter((x) => x.status === 'open')) {
      await setFeedbackStatus(db, f.id, 'closed', null, 9300)
    }
  })
})

describe('归属隔离与删除守卫', () => {
  test('A 看不到 B 的反馈', async () => {
    const db = createDb(env.DB)
    const mineA = await listMyFeedback(db, A)
    expect(mineA.every((f) => f.userId === 'fb-a')).toBe(true)
  })
  test('B 删不动 A 的；A 删不动自己已 planned 的；A 删得动自己 open 的', async () => {
    const db = createDb(env.DB)
    const r1 = await createFeedback(db, A, { title: 'to-plan', body: '' }, 3000)
    const r2 = await createFeedback(db, A, { title: 'to-delete', body: '' }, 3001)
    if (!r1.ok || !r2.ok) throw new Error('setup failed')
    expect(await deleteMyFeedback(db, B, r2.id)).toBe(false)          // 他人
    await setFeedbackStatus(db, r1.id, 'planned', null, 3100)
    expect(await deleteMyFeedback(db, A, r1.id)).toBe(false)          // 非 open
    expect(await deleteMyFeedback(db, A, r2.id)).toBe(true)           // own + open
  })
})

describe('admin 列表与状态流转', () => {
  test('JOIN 提交人 + adminNote 写读', async () => {
    const db = createDb(env.DB)
    const r = await createFeedback(db, B, { title: 'note check', body: '' }, 4000)
    if (!r.ok) throw new Error('setup failed')
    await setFeedbackStatus(db, r.id, 'shipped', '  已在 v1.2 上线  ', 4100)
    const { rows, total } = await listFeedbackForAdmin(db, { page: 0, pageSize: 100 })
    expect(total).toBeGreaterThan(0)
    const row = rows.find((x) => x.id === r.id)!
    expect(row.email).toBe('fb-b@example.com')
    expect(row.status).toBe('shipped')
    expect(row.adminNote).toBe('已在 v1.2 上线')     // trim
  })
})
