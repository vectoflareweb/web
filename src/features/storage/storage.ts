/**
 * Pure, runtime-agnostic storage helpers — no R2/Workers imports — so they're
 * unit-testable in the node pool and safe to import from the client bundle.
 *
 * Validation lives here (not in storage.server.ts) so the same rules guard the
 * browser-side picker and the server handler without duplication.
 */

/** Max avatar size. R2 is cheap, but an avatar has no business being huge. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
export type AvatarType = (typeof ALLOWED_AVATAR_TYPES)[number]

/** `accept` attribute for the file <input>, derived from the allow-list. */
export const AVATAR_ACCEPT = ALLOWED_AVATAR_TYPES.join(',')

/**
 * R2 object key for a user's avatar. One key per user — re-upload overwrites,
 * so we never accumulate orphaned objects and never need to track old keys.
 */
export function avatarObjectKey(userId: string): string {
  return `avatars/${userId}`
}

export type AvatarReason = 'empty' | 'type' | 'size' | 'mismatch'
export type AvatarValidation = { ok: true } | { ok: false; reason: AvatarReason }

/** Validate an avatar candidate by MIME type and byte size. Pure. */
export function validateAvatar(input: { type: string; size: number }): AvatarValidation {
  if (input.size === 0) return { ok: false, reason: 'empty' }
  if (!ALLOWED_AVATAR_TYPES.includes(input.type as AvatarType)) return { ok: false, reason: 'type' }
  if (input.size > MAX_AVATAR_BYTES) return { ok: false, reason: 'size' }
  return { ok: true }
}

const IMAGE_MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  'image/png': (b) =>
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) =>
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  'image/gif': (b) =>
    b.length >= 6 &&
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61,
  'image/svg+xml': (b) => {
    let i = 0
    if (b.length > 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) i = 3
    while (i < b.length && (b[i] === 0x20 || b[i] === 0x09 || b[i] === 0x0a || b[i] === 0x0d)) i++
    if (i + 5 <= b.length && b[i] === 0x3c && b[i + 1] === 0x73 && b[i + 2] === 0x76 && b[i + 3] === 0x67) return true
    return (
      i + 6 <= b.length &&
      b[i] === 0x3c && b[i + 1] === 0x3f && b[i + 2] === 0x78 && b[i + 3] === 0x6d && b[i + 4] === 0x6c
    )
  },
}

/**
 * Confirm the file's leading bytes match the declared MIME type (magic-number
 * sniffing). The client-declared `type` is trivially spoofable; serving a
 * mislabeled file (e.g. an HTML page renamed to .png) would let its content
 * leak into <img>/download contexts. SVG needs a text-header check (BOM +
 * whitespace tolerated), the others byte magic.
 */
export function sniffImage(bytes: Uint8Array, type: string): boolean {
  const sniff = IMAGE_MAGIC[type]
  if (!sniff) return false
  return sniff(bytes)
}
