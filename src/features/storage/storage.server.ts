/**
 * R2 wrappers for avatar storage. Deliberately thin — all validation lives in
 * the pure `storage.ts`, so these just move bytes to/from the bucket.
 *
 * `BUCKET` is a Cloudflare binding (like DB/CACHE): declared in wrangler.jsonc,
 * always present in dev (miniflare), test, and deployed environments. There is
 * no API key to be absent, so — unlike Resend — there's nothing to
 * degrade gracefully here.
 */
import { avatarObjectKey } from './storage'

/** Store (overwrite) a user's avatar. Returns the object key written. */
export async function putAvatar(
  bucket: R2Bucket,
  userId: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const key = avatarObjectKey(userId)
  await bucket.put(key, body, { httpMetadata: { contentType } })
  return key
}

/** Fetch a user's avatar object (or null). Caller streams `.body` to the response. */
export function getAvatar(bucket: R2Bucket, userId: string): Promise<R2ObjectBody | null> {
  return bucket.get(avatarObjectKey(userId))
}
