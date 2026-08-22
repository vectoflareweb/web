/**
 * Bundle-size gate for the client entry chunks.
 *
 * Vite fully code-splits third-party libs (better-auth, fumadocs, orama,
 * sonner, ...) into lazy/route chunks, so the main `index-*.js` (framework:
 * react-dom + TanStack) and `app-*.css` are the stable proxies for first-load
 * weight. Fail the build when either grows beyond its threshold.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs           # defaults (index 750KB, css 120KB)
 *   INDEX_MAX_KB=800 node scripts/check-bundle-size.mjs
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS = join(process.cwd(), 'dist', 'client', 'assets')
const LIMITS = [
  { pattern: /^index-.*\.js$/, kind: 'main JS', maxKb: Number(process.env.INDEX_MAX_KB ?? 750) },
  { pattern: /^app-.*\.css$/, kind: 'main CSS', maxKb: Number(process.env.CSS_MAX_KB ?? 120) },
]

const files = readdirSync(ASSETS)
let failed = false

for (const { pattern, kind, maxKb } of LIMITS) {
  const match = files.find((f) => pattern.test(f))
  if (!match) {
    console.error(`[bundle] MISSING ${kind} chunk — run \`pnpm build\` first?`)
    failed = true
    continue
  }
  const kb = statSync(join(ASSETS, match)).size / 1024
  const ok = kb <= maxKb
  console.log(`[bundle] ${kind}: ${match} = ${kb.toFixed(0)}KB (limit ${maxKb}KB) ${ok ? 'OK' : 'OVER LIMIT'}`)
  if (!ok) failed = true
}

if (failed) {
  console.error('[bundle] gate failed — first-load weight regressed, trim the bundle before merging.')
  process.exit(1)
}
console.log('[bundle] gate passed.')
