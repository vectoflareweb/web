import { test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { waitlist } from '@/db/tables/waitlist'
import { getWaitlist } from './getWaitlist'

// Workers pool doesn't auto-migrate — hand-create the table (mirror migration).
beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS "waitlist" (
      "id" TEXT PRIMARY KEY NOT NULL, "email" TEXT NOT NULL UNIQUE,
      "locale" TEXT NOT NULL, "source" TEXT NOT NULL DEFAULT 'waitlist',
      "created_at" INTEGER NOT NULL)`,
  ).run()
})

test('returns rows newest-first with total', async () => {
  const db = createDb(env.DB)
  await db.insert(waitlist).values([
    { id: '1', email: 'old@x.com', locale: 'en', source: 'waitlist', createdAt: new Date(1000) },
    { id: '2', email: 'new@x.com', locale: 'es', source: 'waitlist', createdAt: new Date(2000) },
  ])
  const res = await getWaitlist(db, { page: 0, pageSize: 10 })
  expect(res.total).toBe(2)
  expect(res.rows[0].email).toBe('new@x.com')
})
