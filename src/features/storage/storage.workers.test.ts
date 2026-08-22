/**
 * Storage workers integration tests — real R2 (miniflare BUCKET binding).
 *
 * Test intents:
 *  1. putAvatar writes under the per-user key and round-trips the bytes
 *  2. contentType survives via httpMetadata (the GET route relies on it)
 *  3. re-upload overwrites the same key (no orphaned objects)
 *  4. getAvatar returns null for an unknown user
 */
import { test, expect } from 'vitest'
import { env } from 'cloudflare:test'
import { putAvatar, getAvatar } from './storage.server'
import { avatarObjectKey } from './storage'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer

test('putAvatar round-trips bytes and contentType under the user key', async () => {
  const key = await putAvatar(env.BUCKET, 'user-1', PNG, 'image/png')
  expect(key).toBe(avatarObjectKey('user-1'))

  const got = await getAvatar(env.BUCKET, 'user-1')
  expect(got).not.toBeNull()
  expect(got!.httpMetadata?.contentType).toBe('image/png')
  expect(new Uint8Array(await got!.arrayBuffer())).toEqual(new Uint8Array(PNG))
})

test('re-upload overwrites the same key', async () => {
  await putAvatar(env.BUCKET, 'user-2', PNG, 'image/png')
  const next = new Uint8Array([1, 2, 3, 4, 5]).buffer
  await putAvatar(env.BUCKET, 'user-2', next, 'image/webp')

  const got = await getAvatar(env.BUCKET, 'user-2')
  expect(got!.httpMetadata?.contentType).toBe('image/webp')
  expect(new Uint8Array(await got!.arrayBuffer())).toEqual(new Uint8Array(next))

  // Still exactly one object for this user.
  const listed = await env.BUCKET.list({ prefix: 'avatars/user-2' })
  expect(listed.objects).toHaveLength(1)
})

test('getAvatar returns null for an unknown user', async () => {
  expect(await getAvatar(env.BUCKET, 'nobody')).toBeNull()
})
