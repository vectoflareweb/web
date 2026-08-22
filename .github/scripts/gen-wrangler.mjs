/**
 * CI helper: generate `wrangler.jsonc` (git-ignored) from the committed
 * `wrangler.example.jsonc` template by:
 *   1. Replacing "vectoflare" resource names with the actual SITE_ID
 *   2. Injecting the real production resource ids
 *
 * Run in the Deploy workflow before `pnpm build`.
 *
 * wrangler.example.jsonc uses "vectoflare" as the default site ID (it must
 * be a valid Wrangler config at all times). When SITE_ID differs from the
 * default, all resource names are swapped in one pass.
 *
 * Values come from repo Variables (Settings → Secrets and variables → Actions →
 * Variables) — these are identifiers, not secrets:
 *   - SITE_ID           (optional)  site identifier, defaults to "vectoflare"
 *   - CF_PROD_D1_ID     (required)  production D1 database_id
 *   - CF_PROD_KV_ID     (required)  production KV namespace id
 *   - CF_PROD_R2_BUCKET (optional)  production R2 bucket name (if different from convention)
 *   - CF_PROD_VECTORIZE_INDEX (optional) production Vectorize index name (if different from convention)
 *   - CF_PROD_DOMAIN    (optional)  custom domain, e.g. vectoflare.com
 *
 * Only the production env block is patched (this workflow deploys production).
 */
import { readFileSync, writeFileSync } from 'node:fs'

const DEFAULT_SITE_ID = 'myproduct'

const {
  SITE_ID = DEFAULT_SITE_ID,
  CF_PROD_D1_ID,
  CF_PROD_KV_ID,
  CF_PROD_R2_BUCKET,
  CF_PROD_VECTORIZE_INDEX,
  CF_PROD_DOMAIN,
} = process.env

if (!CF_PROD_D1_ID || !CF_PROD_KV_ID) {
  console.error('::error::Set repo Variables CF_PROD_D1_ID and CF_PROD_KV_ID to enable deploy')
  process.exit(1)
}

let text = readFileSync('wrangler.example.jsonc', 'utf8')

if (SITE_ID !== DEFAULT_SITE_ID) {
  text = text.replaceAll(DEFAULT_SITE_ID, SITE_ID)
}

const at = text.indexOf('"production"')
if (at === -1) {
  console.error('::error::wrangler.example.jsonc has no "production" env block')
  process.exit(1)
}
const head = text.slice(0, at)
let prod = text.slice(at)

prod = prod
  .replace('00000000-0000-0000-0000-000000000000', CF_PROD_D1_ID)
  .replace('00000000000000000000000000000000', CF_PROD_KV_ID)

if (CF_PROD_R2_BUCKET) {
  prod = prod.replace(
    new RegExp(`"bucket_name": "${SITE_ID}-files-prod"`),
    `"bucket_name": "${CF_PROD_R2_BUCKET}"`,
  )
}

if (CF_PROD_VECTORIZE_INDEX) {
  prod = prod.replace(
    new RegExp(`"index_name": "${SITE_ID}-knowledge-prod"`),
    `"index_name": "${CF_PROD_VECTORIZE_INDEX}"`,
  )
}

if (CF_PROD_DOMAIN) {
  prod = prod.replace(
    new RegExp(`"name": "${SITE_ID}-production",`),
    `"name": "${SITE_ID}-production",\n\t\t\t"routes": [{ "pattern": "${CF_PROD_DOMAIN}", "custom_domain": true }],`,
  )
}

writeFileSync('wrangler.jsonc', head + prod)
console.log(`Generated wrangler.jsonc for ${SITE_ID} production${CF_PROD_DOMAIN ? ` (domain: ${CF_PROD_DOMAIN})` : ''}`)
