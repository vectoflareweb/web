/**
 * Uploads site media to R2 under `site/*` (CDN: https://assets.vectoflare.com/site/*).
 *
 * Mirrors the layout the files used to have under public/, minus the now-migrated
 * public/ prefix, so every URL stays predictable:
 *
 *   public/assets/videos/*  -> site/videos/*
 *   public/downloads/*      -> site/downloads/*
 *   public/assets/quality/* -> site/quality/*
 *   public/assets/products/* -> site/products/*
 *
 * The files are intentionally NOT committed to Git anymore (see .gitignore);
 * this script is the only way they reach production. Content that references
 * them uses hardcoded CDN links (https://assets.vectoflare.com/site/...).
 *
 * Zero dependencies (SigV4 signing via node:crypto + fetch).
 *
 * Two auth modes:
 *
 *   --http   Cloudflare R2 HTTP API with a bearer token. Used by CI (GitHub
 *            Actions) where only CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
 *            are available. The token needs Account › R2 › Edit permission.
 *
 *   (default)  S3-compatible API with an R2 API token (dashboard → R2 → Manage
 *            R2 API Tokens, Object Read & Write for the bucket):
 *            $env:R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY.
 *
 * Bucket name defaults to ${SITE_ID}-files-prod (override via R2_BUCKET).
 *
 * Usage:
 *   node scripts/upload-site-assets.mjs                       # S3 mode
 *   node scripts/upload-site-assets.mjs --http                # HTTP API mode
 *   node scripts/upload-site-assets.mjs --dry-run             # list without upload
 *   node scripts/upload-site-assets.mjs --http --missing      # upload only missing keys
 *   node scripts/upload-site-assets.mjs --prefix <prefix>     # 自定义 R2 key 前缀（叠加在 TARGETS 的前缀之上）
 */

import { createHash, createHmac } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const args = process.argv.slice(2)
const flagValue = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const DRY_RUN = args.includes('--dry-run')
const HTTP_MODE = args.includes('--http')
const MISSING_ONLY = args.includes('--missing')
const PREFIX = flagValue('prefix', '') // 自定义 R2 key 前缀，如 'site/videos'；与 TARGETS 中 prefix 连用，形成 'site/videos' -> 'my-prefix/site/videos'
const CACHE_CONTROL = flagValue('cache', 'public, max-age=31536000, immutable')
const CONCURRENCY = 8

const BUCKET = process.env.R2_BUCKET ?? `${process.env.SITE_ID ?? 'vectoflare'}-files-prod`
const ACCOUNT_ID = process.env[HTTP_MODE ? 'CLOUDFLARE_ACCOUNT_ID' : 'R2_ACCOUNT_ID'] ?? ''
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? ''
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID ?? ''
const SECRET = process.env.R2_SECRET_ACCESS_KEY ?? ''

const SRC_DIR = resolveSrc(flagValue('src', 'public'))

function resolveSrc(src) {
  // Resolve relative to the repo root, not the script location.
  return src.startsWith('.') || src.startsWith('/') ? src : join(process.cwd(), src)
}

/** (source dir, R2 key prefix) pairs — keep in sync with content links. */
const TARGETS = [
  [join(SRC_DIR, 'assets/videos'), 'site/videos/'],
  [join(SRC_DIR, 'downloads'), 'site/downloads/'],
  [join(SRC_DIR, 'assets/quality'), 'site/quality/'],
  [join(SRC_DIR, 'assets/products'), 'site/products/'],
]

const CONTENT_TYPES = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
}

function contentType(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/* ───────────────────────────── SigV4 (S3 API) ───────────────────────────── */

function hmac(key, data) {
  return createHmac('sha256', key).update(data).digest()
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex')
}

function signingKey(secret, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secret}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

/** Signs a PUT request for the R2 S3 endpoint and returns the auth headers. */
function signPut({ method, url, body, accessKey, secret, region = 'auto', service = 's3' }) {
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '')
  const dateStamp = amzDate.slice(0, 8)
  const bodyHash = sha256Hex(body)
  const u = new URL(url)
  const canonicalQuery = [...u.searchParams.entries()]
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join('&')
  const canonicalHeaders = `host:${u.host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [method, u.pathname, canonicalQuery, canonicalHeaders, signedHeaders, bodyHash].join('\n')
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n')
  const signature = hmac(signingKey(secret, dateStamp, region, service), stringToSign).toString('hex')
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  return { authorization, amzDate, bodyHash }
}

/* ───────────────────────────────── walk ───────────────────────────────── */

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, out)
    } else {
      out.push(full)
    }
  }
  return out
}

/* ───────────────────────────────── upload ───────────────────────────────── */

async function uploadS3(key, body, localPath) {
  const url = `https://${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  const { authorization, amzDate, bodyHash } = signPut({
    method: 'PUT',
    url,
    body,
    accessKey: ACCESS_KEY,
    secret: SECRET,
  })
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': bodyHash,
      'content-type': contentType(localPath),
      'cache-control': CACHE_CONTROL,
    },
    body,
  })
  if (!res.ok) {
    throw new Error(`PUT ${key} -> ${res.status} ${await res.text()}`)
  }
}

async function uploadHttp(key, body, localPath) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${API_TOKEN}`,
      'content-type': contentType(localPath),
      'cache-control': CACHE_CONTROL,
    },
    body,
  })
  const data = await res.json()
  if (!data.success) {
    throw new Error(`PUT ${key} -> ${res.status} ${JSON.stringify(data.errors)}`)
  }
}

async function upload(key, localPath) {
  const body = await readFile(localPath)
  return HTTP_MODE ? uploadHttp(key, body, localPath) : uploadS3(key, body, localPath)
}

/** HEAD-probe a key via the HTTP API; true when the object is missing (404). */
async function isMissingHttp(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { authorization: `Bearer ${API_TOKEN}` },
  })
  if (res.status === 404) return true
  if (res.ok) return false
  return true
}

async function collect(prefix = '') {
  const jobs = []
  for (const [dir, tprefix] of TARGETS) {
    try {
      const files = await walk(dir)
      for (const f of files) {
        // 若提供了 --prefix，则在 TARGETS 自带的 prefix 前额外加一层
        const fullPrefix = prefix ? `${prefix}/${tprefix}` : tprefix
        jobs.push({ localPath: f, key: `${fullPrefix}${relative(dir, f).split(sep).join('/')}` })
      }
    } catch {
      /* source dir absent (e.g. files already removed locally) — skip */
    }
  }
  return jobs
}

async function run() {
  if (DRY_RUN) {
    /* fall through, no credentials needed */
  } else if (HTTP_MODE) {
    if (!ACCOUNT_ID || !API_TOKEN) {
      console.error('Missing credentials. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID (--http mode).')
      process.exit(1)
    }
  } else if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET) {
    console.error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.')
    console.error('(Use --dry-run to list files without credentials.)')
    process.exit(1)
  }

  const jobs = await collect(PREFIX)
  if (jobs.length === 0) {
    console.error('No files found under public/assets/videos, public/downloads, public/assets/quality')
    process.exit(1)
  }
  const totalBytes = (await Promise.all(jobs.map((j) => stat(j.localPath)))).reduce((n, s) => n + s.size, 0)

  if (DRY_RUN) {
    console.log(`[dry-run] ${jobs.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB -> ${BUCKET}`)
    for (const j of jobs) console.log(`  ${j.key}`)
    return
  }

  if (MISSING_ONLY && !HTTP_MODE) {
    console.error('--missing requires --http (the S3 API has no cheap per-object HEAD via an API token).')
    process.exit(1)
  }
  if (MISSING_ONLY && !DRY_RUN) {
    console.log(`Checking ${jobs.length} keys for existing objects (--missing)...`)
    const present = new Set()
    const probeQueue = [...jobs]
    let checked = 0
    async function probeWorker() {
      while (probeQueue.length > 0) {
        const job = probeQueue.shift()
        if (!(await isMissingHttp(job.key))) present.add(job.key)
        checked++
        if (checked % 50 === 0) console.log(`  probed ${checked}/${jobs.length}`)
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, probeWorker))
    const missing = jobs.filter((j) => !present.has(j.key))
    console.log(`  ${missing.length} missing (${jobs.length - missing.length} already present, skipped)`)
    if (missing.length === 0) {
      console.log('Nothing to upload.')
      return
    }
    jobs.splice(0, jobs.length, ...missing)
  }

  console.log(`Uploading ${jobs.length} files (${(totalBytes / 1024 / 1024).toFixed(1)} MiB) to ${BUCKET}`)
  let done = 0
  let failed = 0
  let queue = [...jobs]

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift()
      try {
        await upload(job.key, job.localPath)
        done++
        console.log(`  [${done}/${jobs.length}] ok ${job.key}`)
      } catch (err) {
        failed++
        console.error(`  FAILED ${job.key}: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`Done: ${done} uploaded, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
