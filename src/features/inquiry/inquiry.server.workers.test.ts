/**
 * D1 + R2 coverage for the inquiry server module.
 *  - D1: pagination, tier filter and the free-text LIKE search (with %/_-
 *    escape) against a hand-created table — the workers pool does not
 *    auto-apply drizzle migrations (repo convention).
 *  - R2: putInquiryFile → getInquiryFile round-trip (bytes + contentType),
 *    legacy inquiry-logos/ key resolution and unknown-id nulls.
 */
import { test, expect, beforeAll, describe } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import { inquiry } from '@/features/inquiry/inquiry.schema'
import { fileObjectKey, getInquiryFile, listInquiries, mimeForExt, putInquiryFile } from '@/features/inquiry/inquiry.server'

beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS "inquiry" (
      "id" TEXT PRIMARY KEY NOT NULL, "name" TEXT NOT NULL, "company" TEXT NOT NULL DEFAULT '',
      "website" TEXT NOT NULL DEFAULT '', "country" TEXT NOT NULL DEFAULT '',
      "email" TEXT NOT NULL, "whatsapp" TEXT NOT NULL DEFAULT '',
      "business_type" TEXT NOT NULL DEFAULT 'other', "quantity" TEXT NOT NULL DEFAULT 'unsure',
      "product_type" TEXT NOT NULL DEFAULT 'unsure', "model" TEXT NOT NULL DEFAULT 'unsure',
      "timeline" TEXT NOT NULL DEFAULT 'now', "target_market" TEXT NOT NULL DEFAULT '',
      "project_stage" TEXT NOT NULL DEFAULT '', "role" TEXT NOT NULL DEFAULT '',
      "board_platform" TEXT NOT NULL DEFAULT '', "construction" TEXT NOT NULL DEFAULT '',
      "customization" TEXT NOT NULL DEFAULT '', "packaging" TEXT NOT NULL DEFAULT '',
      "compliance" TEXT NOT NULL DEFAULT '', "docs" TEXT NOT NULL DEFAULT '',
      "annual_volume" TEXT NOT NULL DEFAULT '', "budget" TEXT NOT NULL DEFAULT '',
      "nda" TEXT NOT NULL DEFAULT 'no', "consent" TEXT NOT NULL DEFAULT '',
      "score" INTEGER NOT NULL DEFAULT 0, "tier" TEXT NOT NULL DEFAULT 'C',
      "requirements" TEXT NOT NULL DEFAULT '', "logo_key" TEXT,
      "status" TEXT NOT NULL DEFAULT 'new', "locale" TEXT NOT NULL,
      "created_at" INTEGER NOT NULL)`,
  ).run()
  const db = createDb(env.DB)
  await db.insert(inquiry).values([
    { id: 'i1', name: 'x', company: 'Acme Boards', email: 'a@acme.com', locale: 'en', tier: 'A', score: 80, requirements: 'Need 500 race boards', createdAt: new Date('2026-08-01T00:00:00Z') },
    { id: 'i2', name: 'x', company: 'BlueWave', email: 'b@bluewave.com', locale: 'en', tier: 'B', score: 55, requirements: 'Cotton tote bags', createdAt: new Date('2026-08-02T00:00:00Z') },
    { id: 'i3', name: 'x', company: 'Acme Retail GmbH', email: 'c@gmail.com', locale: 'de', tier: 'C', score: 20, requirements: 'price?', createdAt: new Date('2026-08-03T00:00:00Z') },
  ])
})

test('paginates newest first', async () => {
  const { rows, total } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 2 })
  expect(total).toBe(3)
  expect(rows.map((r) => r.id)).toEqual(['i3', 'i2'])
})

test('tier filter narrows rows and total', async () => {
  const all = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, tier: 'A' })
  expect(all.total).toBe(1)
  expect(all.rows[0].id).toBe('i1')
})

test('free-text search matches company, email and requirements', async () => {
  const byCompany = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, q: 'acme' })
  expect(byCompany.total).toBe(2)
  expect(byCompany.rows.map((r) => r.id).sort()).toEqual(['i1', 'i3'])

  const byEmail = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, q: 'bluewave.com' })
  expect(byEmail.total).toBe(1)

  const byReq = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, q: 'price' })
  expect(byReq.total).toBe(1)
  expect(byReq.rows[0].id).toBe('i3')
})

test('LIKE metacharacters in the query are escaped, not wildcards', async () => {
  const { total } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, q: '%' })
  expect(total).toBe(0)
  const { total: under } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, q: '_' })
  expect(under).toBe(0)
})

test('tier + search combine with AND', async () => {
  const { rows } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, tier: 'A', q: 'acme' })
  expect(rows.map((r) => r.id)).toEqual(['i1'])
  const { total } = await listInquiries(createDb(env.DB), { page: 1, pageSize: 20, tier: 'C', q: 'acme' })
  expect(total).toBe(1)
})

describe('R2 project file', () => {
  const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a])

  test('putInquiryFile stores under inquiry-files/<id>.<ext> and round-trips', async () => {
    const key = await putInquiryFile(env.BUCKET, 'f-1', PDF.buffer, 'pdf')
    expect(key).toBe(fileObjectKey('f-1', 'pdf'))

    const got = await getInquiryFile(env.BUCKET, 'f-1')
    expect(got).not.toBeNull()
    expect(got!.key).toBe(key)
    expect(got!.httpMetadata?.contentType).toBe(mimeForExt('pdf'))
    expect(new Uint8Array(await got!.arrayBuffer())).toEqual(PDF)
  })

  test('re-upload overwrites the same key (no parallel objects)', async () => {
    const a = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    await putInquiryFile(env.BUCKET, 'f-2', a.buffer, 'png')
    const b = new Uint8Array([0x37, 0x5a, 0xbc, 0xaf]) // 7z magic — just bytes here
    await putInquiryFile(env.BUCKET, 'f-2', b.buffer, 'zip')

    const got = await getInquiryFile(env.BUCKET, 'f-2')
    expect(got).not.toBeNull()
    expect(new Uint8Array(await got!.arrayBuffer())).toEqual(b)
    expect((await env.BUCKET.list({ prefix: 'inquiry-files/f-2' })).objects).toHaveLength(1)
  })

  test('prefix-scoped cleanup never touches a neighbour id', async () => {
    await putInquiryFile(env.BUCKET, 'f-id', new Uint8Array([0x89, 0x50]).buffer, 'png')
    await putInquiryFile(env.BUCKET, 'f-id-longer', new Uint8Array([1, 2]).buffer, 'pdf')

    await putInquiryFile(env.BUCKET, 'f-id', new Uint8Array([3, 4]).buffer, 'zip')

    expect((await env.BUCKET.list({ prefix: 'inquiry-files/f-id-longer' })).objects).toHaveLength(1)
    expect((await env.BUCKET.get('inquiry-files/f-id-longer.pdf'))).not.toBeNull()
  })

  test('legacy inquiry-logos/<id>.png keys still resolve', async () => {
    await env.BUCKET.put('inquiry-logos/f-3.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer, {
      httpMetadata: { contentType: 'image/png' },
    })

    const got = await getInquiryFile(env.BUCKET, 'f-3')
    expect(got).not.toBeNull()
    expect(got!.key).toBe('inquiry-logos/f-3.png')
    expect(got!.httpMetadata?.contentType).toBe('image/png')
  })

  test('re-upload also clears the legacy logo object for the same id', async () => {
    await env.BUCKET.put('inquiry-logos/f-4.png', new Uint8Array([0x89, 0x50]).buffer, {
      httpMetadata: { contentType: 'image/png' },
    })
    await putInquiryFile(env.BUCKET, 'f-4', PDF.buffer, 'pdf')

    expect(await getInquiryFile(env.BUCKET, 'f-4')).not.toBeNull()
    expect(await env.BUCKET.get('inquiry-logos/f-4.png')).toBeNull()
  })

  test('unknown id returns null', async () => {
    expect(await getInquiryFile(env.BUCKET, 'nobody')).toBeNull()
  })
})