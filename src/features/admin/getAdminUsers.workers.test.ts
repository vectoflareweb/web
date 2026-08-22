import { describe, test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { applyAuthSchema } from '@/features/auth/test-helpers'
import { user } from '@/features/auth/auth.schema'
import { getAdminUsers } from './getAdminUsers'
import { syncAdminRole } from './ensure-admin'

beforeAll(async () => {
  await applyAuthSchema(env.DB)

  const db = createDb(env.DB)
  const at = (ms: number) => new Date(ms)
  await db.insert(user).values([
    { id: 'u-alice', name: 'Alice Chen', email: 'alice@corp.com', emailVerified: true, createdAt: at(3000), updatedAt: at(3000), role: 'admin' },
    { id: 'u-bob', name: 'Bob Li', email: 'bob@corp.com', emailVerified: true, createdAt: at(2000), updatedAt: at(2000), role: 'user' },
    { id: 'u-carol', name: 'Carol 王', email: 'carol@other.io', emailVerified: true, createdAt: at(1000), updatedAt: at(1000), role: 'user' },
  ])
})

const BASE = { page: 0, pageSize: 50, sortBy: 'createdAt', sortDir: 'desc' as const }

describe('getAdminUsers', () => {
  test('lists all users', async () => {
    const db = createDb(env.DB)
    const { rows, total } = await getAdminUsers(db, BASE)
    expect(total).toBe(3)
    expect(rows.map((r) => r.id)).toEqual(['u-alice', 'u-bob', 'u-carol'])
  })

  test('searches by email AND by name', async () => {
    const db = createDb(env.DB)
    const byEmail = await getAdminUsers(db, { ...BASE, q: 'other.io' })
    expect(byEmail.rows.map((r) => r.id)).toEqual(['u-carol'])
    expect(byEmail.total).toBe(1)
    const byName = await getAdminUsers(db, { ...BASE, q: 'Bob' })
    expect(byName.rows.map((r) => r.id)).toEqual(['u-bob'])
  })

  test('LIKE wildcards in the query are treated literally', async () => {
    const db = createDb(env.DB)
    const { rows } = await getAdminUsers(db, { ...BASE, q: '%' })
    expect(rows).toEqual([])
  })

  test('sorts by whitelisted column; unknown sortBy falls back to createdAt', async () => {
    const db = createDb(env.DB)
    const asc = await getAdminUsers(db, { ...BASE, sortBy: 'name', sortDir: 'asc' })
    expect(asc.rows.map((r) => r.id)).toEqual(['u-alice', 'u-bob', 'u-carol'])
    const evil = await getAdminUsers(db, { ...BASE, sortBy: 'banned; DROP TABLE user', sortDir: 'desc' })
    expect(evil.rows.map((r) => r.id)).toEqual(['u-alice', 'u-bob', 'u-carol']) // createdAt desc
  })

  test('paginates', async () => {
    const db = createDb(env.DB)
    const p2 = await getAdminUsers(db, { ...BASE, pageSize: 2, page: 1 })
    expect(p2.rows).toHaveLength(1)
    expect(p2.total).toBe(3)
  })
})

describe('syncAdminRole', () => {
  test('promotes an env-granted admin whose DB role is stale, once', async () => {
    const db = createDb(env.DB)
    expect(await syncAdminRole(db, { id: 'u-bob', email: 'bob@corp.com', role: 'user' }, 'bob@corp.com')).toBe('promoted')
    const { rows } = await getAdminUsers(db, { ...BASE, q: 'bob@corp.com' })
    expect(rows[0].role).toBe('admin')
    // already admin → no-op
    expect(await syncAdminRole(db, { id: 'u-bob', email: 'bob@corp.com', role: 'admin' }, 'bob@corp.com')).toBe(null)
  })

  test('does not promote when the email is not in ADMIN_EMAILS', async () => {
    const db = createDb(env.DB)
    expect(await syncAdminRole(db, { id: 'u-carol', email: 'carol@other.io', role: 'user' }, 'bob@corp.com')).toBe(null)
    const { rows } = await getAdminUsers(db, { ...BASE, q: 'carol@other.io' })
    expect(rows[0].role).toBe('user')
  })

  test('demotes a DB admin whose email was removed from ADMIN_EMAILS (revocation actually revokes)', async () => {
    const db = createDb(env.DB)
    // bob is admin from the previous test; the operator has since removed him from the env list
    expect(await syncAdminRole(db, { id: 'u-bob', email: 'bob@corp.com', role: 'admin' }, 'someoneelse@corp.com')).toBe('demoted')
    const { rows } = await getAdminUsers(db, { ...BASE, q: 'bob@corp.com' })
    expect(rows[0].role).toBe('user') // 撤权即时生效，不再需要手改 DB
  })
})
