/** R2 + D1 persistence for project inquiries. Thin wrappers — validation lives in inquiry.shared.ts. */
import { and, count, desc, eq, or, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { inquiry, type Inquiry } from './inquiry.schema'
import type { InquiryStatus, InquiryTier, ProjectFileExtension } from './inquiry.shared'

export type InquiryRow = Inquiry

const FILE_PREFIX = 'inquiry-files/'
// Legacy key namespace of the former logo upload (kept readable for admins)
const LEGACY_LOGO_PREFIX = 'inquiry-logos/'
const KNOWN_EXTS: readonly string[] = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'pdf', 'ai', 'psd', 'dwg', 'dxf', 'zip']

export function fileObjectKey(id: string, ext: ProjectFileExtension): string {
  return `${FILE_PREFIX}${id}.${ext}`
}

/** Store a submitted project file. Returns the R2 object key. */
export async function putInquiryFile(
  bucket: R2Bucket,
  id: string,
  body: ArrayBuffer,
  ext: ProjectFileExtension,
): Promise<string> {
  // One object per inquiry: a re-submission with a different extension must
  // not leave the previous file behind (getInquiryFile would hit it first).
  await removeInquiryFile(bucket, id)
  const key = fileObjectKey(id, ext)
  await bucket.put(key, body, { httpMetadata: { contentType: mimeForExt(ext) } })
  return key
}

/** Delete every stored object for an inquiry id (both key namespaces). */
export async function removeInquiryFile(bucket: R2Bucket, id: string): Promise<void> {
  const keys: string[] = []
  for (const prefix of [FILE_PREFIX, LEGACY_LOGO_PREFIX]) {
    // Scope the prefix to the id itself (bare key + `.ext` keys), so a UUID
    // that is a strict prefix of another can never delete its neighbour's object.
    const listed = await bucket.list({ prefix: `${prefix}${id}` })
    for (const o of listed.objects) {
      if (o.key === `${prefix}${id}` || o.key.startsWith(`${prefix}${id}.`)) keys.push(o.key)
    }
  }
  if (keys.length === 0) return
  await bucket.delete(keys)
}

export function mimeForExt(ext: ProjectFileExtension): string {
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'svg':
      return 'image/svg+xml'
    case 'webp':
      return 'image/webp'
    case 'pdf':
      return 'application/pdf'
    case 'ai':
      return 'application/postscript'
    case 'psd':
      return 'image/vnd.adobe.photoshop'
    case 'dwg':
      return 'application/acad'
    case 'dxf':
      return 'application/dxf'
    case 'zip':
      return 'application/zip'
  }
}

export async function getInquiryFile(
  bucket: R2Bucket,
  id: string,
): Promise<R2ObjectBody | null> {
  // New keys live under inquiry-files/, legacy logo uploads under inquiry-logos/
  for (const prefix of [FILE_PREFIX, LEGACY_LOGO_PREFIX]) {
    const base = `${prefix}${id}`
    const direct = await bucket.get(base)
    if (direct) return direct
    for (const ext of KNOWN_EXTS) {
      const obj = await bucket.get(`${base}.${ext}`)
      if (obj) return obj
    }
  }
  return null
}

/** Paginated admin list, newest first. Optional tier filter + free-text search. */
export async function listInquiries(
  db: DB,
  input: { page: number; pageSize: number; tier?: InquiryTier | ''; q?: string },
): Promise<{ rows: InquiryRow[]; total: number }> {
  const { page, pageSize, tier, q } = input
  const pattern = q ? `%${q.replace(/[%_!]/g, '!$&')}%` : null
  const searchWhere = pattern
    ? or(
        sql`${inquiry.company} LIKE ${pattern} ESCAPE '!'`,
        sql`${inquiry.email} LIKE ${pattern} ESCAPE '!'`,
        sql`${inquiry.requirements} LIKE ${pattern} ESCAPE '!'`,
      )
    : undefined
  const where = tier && searchWhere ? and(eq(inquiry.tier, tier), searchWhere) : tier ? eq(inquiry.tier, tier) : searchWhere
  const [rows, countRows] = await Promise.all([
    db.select().from(inquiry).where(where).orderBy(desc(inquiry.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: count() }).from(inquiry).where(where),
  ])
  return { rows, total: countRows[0]?.n ?? 0 }
}

export async function setInquiryStatus(
  db: DB,
  id: string,
  status: InquiryStatus,
): Promise<void> {
  await db.update(inquiry).set({ status }).where(eq(inquiry.id, id))
}
