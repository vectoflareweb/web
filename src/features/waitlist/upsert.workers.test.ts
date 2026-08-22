import { test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db/client'
import { waitlist } from '@/db/tables/waitlist'
import { upsertWaitlist } from './upsert'

// Workers pool does NOT auto-apply drizzle migrations — hand-create the table (mirror the migration), as getAdminUsers.workers.test.ts does.
beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS "waitlist" (
      "id" TEXT PRIMARY KEY NOT NULL, "email" TEXT NOT NULL UNIQUE,
      "locale" TEXT NOT NULL, "source" TEXT NOT NULL DEFAULT 'waitlist',
      "created_at" INTEGER NOT NULL)`,
  ).run()
})

test('concurrent double-submit: one added / one already, no 500 from the unique constraint', async () => {
  const db = createDb(env.DB)
  const base = { email: 'race@example.com', locale: 'en', source: 'waitlist' as const, now: new Date() }
  // both requests pass any pre-check before either insert lands (double-click / two tabs)
  const results = await Promise.all([
    upsertWaitlist(db, { id: crypto.randomUUID(), ...base }),
    upsertWaitlist(db, { id: crypto.randomUUID(), ...base }),
  ])
  expect([...results].sort()).toEqual(['added', 'already'])
  const rows = await db.select().from(waitlist).where(eq(waitlist.email, 'race@example.com'))
  expect(rows).toHaveLength(1)
})

test('inserts a new email then reports already on repeat; persists source', async () => {
  const db = createDb(env.DB)
  const base = { email: 'src@example.com', locale: 'en', source: 'waitlist' as const, now: new Date() }
  const first = await upsertWaitlist(db, { id: crypto.randomUUID(), ...base })
  expect(first).toBe('added')
  const second = await upsertWaitlist(db, { id: crypto.randomUUID(), ...base })
  expect(second).toBe('already')
  const row = await db.select().from(waitlist).where(eq(waitlist.email, 'src@example.com')).limit(1)
  expect(row[0].source).toBe('waitlist')
})
