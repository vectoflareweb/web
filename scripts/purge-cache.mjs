/**
 * Purge the Cloudflare CDN cache after a deploy so the new version is
 * immediately visible (the edge otherwise keeps serving the previous
 * response until its TTL expires).
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=<zone:cache:purge token> CLOUDFLARE_ZONE_ID=<zone> node scripts/purge-cache.mjs
 *
 * `npm run deploy:purge` (package.json) passes the vars through. When the
 * token/zone are missing the script skips with a hint — never fails silently.
 */
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID
const TOKEN = process.env.CLOUDFLARE_API_TOKEN

if (!ZONE_ID || !TOKEN) {
  console.log('[purge] skipped — set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (zone:cache:purge permission) to automate purging after deploy:prod')
  process.exit(0)
}

const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ purge_everything: true }),
})

const body = await res.json()
if (res.ok && body.success) {
  console.log('[purge] cache purged — visitors now hit the freshly deployed version')
} else {
  console.error('[purge] FAILED —', body.errors?.[0]?.message ?? `HTTP ${res.status}`)
  process.exit(1)
}