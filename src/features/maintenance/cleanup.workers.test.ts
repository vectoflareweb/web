/**
 * Maintenance cleanup integration tests — real Cloudflare D1 (miniflare).
 *
 * Verifies the scheduled cleanup deletes only rows that are safely expired:
 *  - sessions past expiresAt
 *  - verification tokens past expiresAt
 *  - stale better-auth rateLimit rows (older than the limiter window)
 * …and leaves live rows untouched.
 */
import { describe, test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db/client'
import { session, verification, rateLimit, user } from '@/features/auth/auth.schema'
import { applyAuthSchema } from '@/features/auth/test-helpers'
import { runCleanup, RATE_LIMIT_STALE_MS } from './cleanup'

beforeAll(async () => {
  await applyAuthSchema(env.DB)
  // rateLimit table lives in migration 0005 (not in applyAuthSchema) — mirror it here.
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS "rateLimit" ("id" TEXT PRIMARY KEY NOT NULL, "key" TEXT, "count" INTEGER, "last_request" INTEGER)',
  ).run()
})

const HOUR = 60 * 60 * 1000

async function seedUser(db: ReturnType<typeof createDb>, now: number): Promise<string> {
  const uid = `cu-${crypto.randomUUID()}`
  await db.insert(user).values({ id: uid, name: uid, email: `${uid}@t.io`, emailVerified: false, createdAt: new Date(now), updatedAt: new Date(now) })
  return uid
}

describe('runCleanup', () => {
  test('deletes expired sessions, keeps live ones', async () => {
    const db = createDb(env.DB)
    const now = Date.now()
    const uid = await seedUser(db, now)
    await db.insert(session).values([
      { id: `s-exp-${uid}`, token: `tok-exp-${uid}`, userId: uid, expiresAt: new Date(now - HOUR), createdAt: new Date(now), updatedAt: new Date(now) },
      { id: `s-live-${uid}`, token: `tok-live-${uid}`, userId: uid, expiresAt: new Date(now + HOUR), createdAt: new Date(now), updatedAt: new Date(now) },
    ])
    const res = await runCleanup(db, now)
    expect(res.sessions).toBeGreaterThanOrEqual(1)
    const remaining = await db.select().from(session).where(eq(session.userId, uid))
    expect(remaining.map((r) => r.id)).toEqual([`s-live-${uid}`])
  })

  test('deletes expired verification tokens, keeps live ones', async () => {
    const db = createDb(env.DB)
    const now = Date.now()
    const tag = crypto.randomUUID()
    await db.insert(verification).values([
      { id: `v-exp-${tag}`, identifier: `id-exp-${tag}`, value: 'x', expiresAt: new Date(now - HOUR), createdAt: new Date(now), updatedAt: new Date(now) },
      { id: `v-live-${tag}`, identifier: `id-live-${tag}`, value: 'x', expiresAt: new Date(now + HOUR), createdAt: new Date(now), updatedAt: new Date(now) },
    ])
    await runCleanup(db, now)
    expect((await db.select().from(verification).where(eq(verification.id, `v-exp-${tag}`))).length).toBe(0)
    expect((await db.select().from(verification).where(eq(verification.id, `v-live-${tag}`))).length).toBe(1)
  })

  test('deletes stale rateLimit rows, keeps recent ones', async () => {
    const db = createDb(env.DB)
    const now = Date.now()
    const tag = crypto.randomUUID()
    await db.insert(rateLimit).values([
      { id: `rl-stale-${tag}`, key: `k-stale-${tag}`, count: 9, lastRequest: now - RATE_LIMIT_STALE_MS - HOUR },
      { id: `rl-fresh-${tag}`, key: `k-fresh-${tag}`, count: 1, lastRequest: now - 1000 },
    ])
    await runCleanup(db, now)
    expect((await db.select().from(rateLimit).where(eq(rateLimit.id, `rl-stale-${tag}`))).length).toBe(0)
    expect((await db.select().from(rateLimit).where(eq(rateLimit.id, `rl-fresh-${tag}`))).length).toBe(1)
  })
})
