#!/usr/bin/env node
/**
 * WebModel — Site Scaffolder
 *
 * Reads site.config.yaml and generates a complete website project from the
 * supsfactory template. All brand-specific values are replaced with the
 * config values. The generated project is ready to push to GitHub and
 * auto-deploy to Cloudflare Workers.
 *
 * Usage:
 *   node scaffold.mjs                       # generate from site.config.yaml
 *   node scaffold.mjs --config other.yaml    # use a different config file
 *   node scaffold.mjs --source ../myrepo     # use a different source repo
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, basename, extname } from 'node:path'

const args = process.argv.slice(2)
let configPath = 'site.config.yaml'
let sourceDir = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) configPath = args[++i]
  if (args[i] === '--source' && args[i + 1]) sourceDir = args[++i]
}

// ── Minimal YAML parser ─────────────────────────────────────────────────────

function stripComment(line) {
  let inQ = false, qChar = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) { if (c === qChar) inQ = false }
    else if (c === '"' || c === "'") { inQ = true; qChar = c }
    else if (c === '#') return line.slice(0, i)
  }
  return line
}

function parseYaml(text) {
  const result = {}
  const stack = [{ obj: result, indent: -1 }]
  let inMultiline = false, multilineKey = null, multilineIndent = 0, multilineLines = []

  for (const rawLine of text.split('\n')) {
    if (inMultiline) {
      const indent = rawLine.search(/\S/)
      if (indent > multilineIndent || rawLine.trim() === '') {
        multilineLines.push(rawLine.trim())
        continue
      }
      stack[stack.length - 1].obj[multilineKey] = multilineLines.join('\n')
      inMultiline = false
    }

    const line = stripComment(rawLine)
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const indent = rawLine.search(/\S/)

    // List item
    if (trimmed.startsWith('- ')) {
      const val = trimmed.slice(2).trim().replace(/^["']+|["']+$/g, '')
      let listHolder = stack[stack.length - 1]
      // If current scope was created by "key:" (has _listParentKey), the list
      // items belong to that key in the PARENT scope
      if (stack.length >= 2 && listHolder._listParentKey) {
        const parentScope = stack[stack.length - 2]
        const parentKey = listHolder._listParentKey
        // Convert the empty object to an array
        parentScope.obj[parentKey] = []
        stack.pop()
        listHolder = parentScope
      }
      const key2 = listHolder._lastKey
      if (key2) {
        if (!Array.isArray(listHolder.obj[key2])) listHolder.obj[key2] = []
        listHolder.obj[key2].push(val)
      }
      continue
    }

    // Key: value
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue
    const key = trimmed.slice(0, colonIdx).trim()
    let val = trimmed.slice(colonIdx + 1).trim()

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
    const parent = stack[stack.length - 1].obj

    if (val === '' || val === '|' || val === '>') {
      if (val === '|' || val === '>') {
        inMultiline = true; multilineKey = key; multilineIndent = indent; multilineLines = []
      } else {
        parent[key] = {}
        // Keep _lastKey on the parent scope so list items can find it
        stack[stack.length - 1]._lastKey = key
        stack.push({ obj: parent[key], indent, _listParentKey: key })
      }
    } else {
      val = val.replace(/^["']+|["']+$/g, '')
      if (val === 'true') parent[key] = true
      else if (val === 'false') parent[key] = false
      else if (val === '[]') parent[key] = []
      else if (val === '{}') parent[key] = {}
      else if (/^\d+$/.test(val)) parent[key] = parseInt(val)
      else if (/^\d+\.\d+$/.test(val)) parent[key] = parseFloat(val)
      else parent[key] = val
    }
    if (typeof parent[key] !== 'object') stack[stack.length - 1]._lastKey = null
    else stack[stack.length - 1]._lastKey = key
  }

  if (inMultiline && multilineKey) stack[stack.length - 1].obj[multilineKey] = multilineLines.join('\n')
  return result
}

// ── Load config ─────────────────────────────────────────────────────────────

const scriptDir = resolve(import.meta.dirname ?? '.')
const configFile = readFileSync(resolve(scriptDir, configPath), 'utf8')
const cfg = parseYaml(configFile)

const SRC = sourceDir ? resolve(sourceDir) : resolve(scriptDir, '../supsfactory')
const OUT = scriptDir

if (!existsSync(SRC)) {
  console.error('Source template not found at ' + SRC)
  console.error('Ensure the source repo is available, or use --source flag')
  process.exit(1)
}

const siteId = cfg.site_id || 'myproduct'
const siteName = cfg.site_name || 'MyProduct'
const siteDomain = cfg.site_domain || 'myproduct.com'

console.log('\nScaffolding site: ' + siteName + ' (' + siteDomain + ')\n')

// ── Step 1: Copy source tree ────────────────────────────────────────────────

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', '.wrangler', '.tanstack', '.source',
  'e2e', '.claude', 'drizzle',
])

const EXCLUDE_FILES = new Set([
  'CLAUDE.md', 'AGENTS.md', 'TECH.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
  'LICENSE', 'llms.md', 'sitemap.md', 'README.md',
  '.dev.vars', 'pnpm-lock.yaml', 'dev-server-opt.err', 'wrangler.jsonc',
])

function copyTree(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    if (KEEP.has(entry)) continue
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const stat2 = statSync(srcPath)
    if (stat2.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry)) copyTree(srcPath, destPath)
    } else {
      if (!EXCLUDE_FILES.has(entry)) cpSync(srcPath, destPath)
    }
  }
}

// Clean output (preserve template control files)
const KEEP = new Set(['site.config.yaml', 'scaffold.mjs', 'deploy.mjs', '.gitignore', 'templates'])
for (const entry of readdirSync(OUT)) {
  if (KEEP.has(entry)) continue
  const fullPath = join(OUT, entry)
  try {
    const s = statSync(fullPath)
    if (s.isDirectory()) rmSync(fullPath, { recursive: true, force: true })
    else rmSync(fullPath, { force: true })
  } catch { /* skip */ }
}

console.log('  Copying source tree...')
copyTree(SRC, OUT)

// ── Step 2: Replace brand constants ─────────────────────────────────────────

function replaceInFile(filePath, replacements) {
  if (!existsSync(filePath)) return
  let content = readFileSync(filePath, 'utf8')
  for (const [old, rep] of replacements) {
    content = content.replaceAll(old, rep)
  }
  writeFileSync(filePath, content)
}

console.log('  Applying brand constants...')

replaceInFile(join(OUT, 'src/config/site.ts'), [
  ["export const SITE_ID = 'supsfactory' as const", "export const SITE_ID = '" + siteId + "' as const"],
  ["export const SITE_NAME = 'SUPsfactory' as const", "export const SITE_NAME = '" + siteName + "' as const"],
  ["export const SITE_DOMAIN = 'supsfactory.com' as const", "export const SITE_DOMAIN = '" + siteDomain + "' as const"],
])

replaceInFile(join(OUT, 'src/product/brand-constants.ts'), [
  ['Engineering, tooling, sampling and production for SUP brands, distributors and sourcing teams. You bring the brand — we build the boards.', cfg.tagline || ''],
  ['Create your own SUP brand without building your own factory. Custom SUP manufacturing for startups, clubs, resorts and businesses — low MOQ — pilot runs from 20–50pcs — plus full customization and design support.', cfg.description || ''],
  ['SUPsfactory is the SUP product development and manufacturing division of Afarer (Qingdao Vatrad Group Co., Ltd.), a 12,500 m\u00b2 inflatable manufacturing plant in Qingdao, China.', cfg.boilerplate || ''],
  ['We build SUP boards to your specification — engineering, tooling, sampling, production and export. You own the brand, the market and the customer; we own the manufacturing.', cfg.build_line || ''],
  ['We do not sell to end consumers and we do not compete with our clients in any market.', cfg.not_rob || ''],
  ['afarer-og-default', cfg.og_image_filename || 'og-default'],
])

// Fix CSP img-src in security headers
replaceInFile(join(OUT, 'src/lib/security-headers.ts'), [
  ["https://assets.supsfactory.com https://assets.afarer.com", "https://assets." + siteDomain],
])

// Fix twitter:site in SEO
replaceInFile(join(OUT, 'src/features/seo/seo.ts'), [
  ["@SUPsfactory", cfg.twitter_handle || '@' + siteId],
])
replaceInFile(join(OUT, 'src/features/content/content-single-route.ts'), [
  ["@SUPsfactory", cfg.twitter_handle || '@' + siteId],
])
replaceInFile(join(OUT, 'src/routes/$.tsx'), [
  ["@SUPsfactory", cfg.twitter_handle || '@' + siteId],
])

// Fix logo.tsx wordmark
replaceInFile(join(OUT, 'src/components/brand/logo.tsx'), [
  ["SUP<span className=\"font-medium opacity-[0.62]\">sfactory</span>", "<span>" + siteName + "</span>"],
  ["SUPsfactory wordmark", siteName + " wordmark"],
])

// Fix deployment.ts comment
replaceInFile(join(OUT, 'src/config/deployment.ts'), [
  ['e.g., supsfactory.com', 'e.g., ' + siteDomain],
])

// Remove supfactory-entity route (SUP-specific)
const entityRoute = join(OUT, 'src/routes/{-$locale}/about/supsfactory-entity.tsx')
if (existsSync(entityRoute)) rmSync(entityRoute, { force: true })

// Remove routeTree.gen.ts (will regenerate on build)
const routeTree = join(OUT, 'src/routeTree.gen.ts')
if (existsSync(routeTree)) rmSync(routeTree, { force: true })

// ── Step 3: Branding ────────────────────────────────────────────────────────

console.log('  Generating branding config...')
const imgPath = cfg.product_image_path || 'images/products'
writeFileSync(join(OUT, 'src/config/branding.ts'),
  "import { SITE_NAME, SITE_DOMAIN } from './site'\n" +
  "import { PRODUCT_BOILERPLATE, PRODUCT_BUILD_LINE, PRODUCT_NOT_ROB, PRODUCT_OG_IMAGE_FILENAME } from '@/product/brand-constants'\n\n" +
  "export const BRAND_LOGO_URL = '" + (cfg.logo_url || '/logo192.png') + "' as const\n\n" +
  "export const BRAND_FAVICON_ICO = '" + (cfg.favicon_ico || '/favicon.ico') + "' as const\n" +
  "export const BRAND_FAVICON_SVG = '" + (cfg.favicon_svg || '/favicon.svg') + "' as const\n\n" +
  "export const BRAND_OG_IMAGE = `https://assets.${SITE_DOMAIN}/" + imgPath + "/${PRODUCT_OG_IMAGE_FILENAME}.webp` as const\n" +
  "export const BRAND_HERO_IMAGE = `https://assets.${SITE_DOMAIN}/" + imgPath + "/${PRODUCT_OG_IMAGE_FILENAME}.avif` as const\n" +
  "export const BRAND_HERO_IMAGE_768 = `https://assets.${SITE_DOMAIN}/" + imgPath + "/${PRODUCT_OG_IMAGE_FILENAME}-768.avif` as const\n" +
  "export const BRAND_HERO_IMAGE_480 = `https://assets.${SITE_DOMAIN}/" + imgPath + "/${PRODUCT_OG_IMAGE_FILENAME}-480.avif` as const\n" +
  "export const BRAND_HERO_IMAGE_WEBP = `https://assets.${SITE_DOMAIN}/" + imgPath + "/${PRODUCT_OG_IMAGE_FILENAME}.webp` as const\n\n" +
  "export const BRAND_ASSETS_CDN = `https://assets.${SITE_DOMAIN}` as const\n\n" +
  "export const BRAND_SOCIAL = {\n" +
  "  facebook: '" + (cfg.social_facebook || `https://www.facebook.com/${siteId}`) + "',\n" +
  "  linkedin: '" + (cfg.social_linkedin || `https://www.linkedin.com/company/${siteId}`) + "',\n" +
  "  youtube: '" + (cfg.social_youtube || `https://www.youtube.com/@${siteId}`) + "',\n" +
  "} as const\n\n" +
  "export const BRAND_CONTACT = {\n" +
  "  email: '" + (cfg.contact_email || `info@${siteDomain}`) + "',\n" +
  "  whatsapp: '" + (cfg.whatsapp || '') + "',\n" +
  "  whatsappLink: '" + (cfg.whatsapp_link || '') + "',\n" +
  "  address: '" + (cfg.address || '') + "',\n" +
  "} as const\n\n" +
  "export const BRAND_BOILERPLATE = PRODUCT_BOILERPLATE as typeof PRODUCT_BOILERPLATE\n\n" +
  "export const BRAND_BUILD_LINE = PRODUCT_BUILD_LINE as typeof PRODUCT_BUILD_LINE\n\n" +
  "export const BRAND_NOT_ROB = PRODUCT_NOT_ROB as typeof PRODUCT_NOT_ROB\n\n" +
  "export const BRAND_COMPANY_NAME = '" + (cfg.company_name || '') + "' as const\n" +
  "export const BRAND_PARENT_BRAND = '" + (cfg.parent_brand || '') + "' as const\n" +
  "export const BRAND_PARENT_DOMAIN = '" + (cfg.parent_domain || '') + "' as const\n" +
  "export const BRAND_PARENT_URL = `https://${BRAND_PARENT_DOMAIN}` as const\n")

// ── Step 4: Feature flags ───────────────────────────────────────────────────

console.log('  Generating feature flags...')
const featureEntries = Object.entries(cfg.features || {})
  .map(([k, v]) => '  ' + k + ': ' + v + ',')
  .join('\n')
writeFileSync(join(OUT, 'src/config/features.ts'),
  '/**\n * Feature flags — toggle individual features on/off per product deployment.\n */\n\nexport const features = {\n' + featureEntries + '\n} as const\n\nexport type FeatureFlags = typeof features\n\nexport function isFeatureEnabled<K extends keyof FeatureFlags>(key: K): boolean {\n  return features[key]\n}\n')

// ── Step 5: Locales ─────────────────────────────────────────────────────────

console.log('  Generating locale config...')
const localesPath = join(OUT, 'src/config/locales.ts')
if (existsSync(localesPath)) {
  let l = readFileSync(localesPath, 'utf8')
  const activeLocales = (cfg.active_locales || ['en']).map(x => "'" + x + "'").join(', ')
  l = l.replace(/export const ACTIVE_LOCALES: readonly Locale\[\] = \[.*\]/,
    "export const ACTIVE_LOCALES: readonly Locale[] = [" + activeLocales + "]")
  if (cfg.default_locale) {
    l = l.replace(/export const DEFAULT_LOCALE: Locale = 'en'/,
      "export const DEFAULT_LOCALE: Locale = '" + cfg.default_locale + "'")
  }
  writeFileSync(localesPath, l)
}

// ── Step 6: Navigation ──────────────────────────────────────────────────────

console.log('  Generating navigation config...')
const navRedirects = Object.entries(cfg.legacy_redirects || {})
  .map(([k, v]) => "  '" + k + "': '" + v + "',")
  .join('\n')
const navGone = (cfg.gone_paths || []).map(p => "  '" + p + "'").join(',\n')
writeFileSync(join(OUT, 'src/config/navigation.ts'),
  "import { BRAND_PARENT_URL } from './branding'\n\n" +
  "export const ENTITY_PAGE_PATH = '/about/entity' as const\n\n" +
  "export const ABOUT_BRAND_PATH = '/about' as const\n\n" +
  "export const LEGACY_REDIRECTS: Record<string, string> = {\n" + navRedirects + "\n}\n\n" +
  "export const GONE_PATHS: string[] = [\n" + navGone + "\n]\n")

// ── Step 7: wrangler + CI configs ───────────────────────────────────────────

console.log('  Generating wrangler config...')
const wranglerPath = join(OUT, 'wrangler.example.jsonc')
if (existsSync(wranglerPath)) {
  let w = readFileSync(wranglerPath, 'utf8')
  w = w.replaceAll('supsfactory', siteId)
  writeFileSync(wranglerPath, w)
}

const genWranglerPath = join(OUT, '.github/scripts/gen-wrangler.mjs')
if (existsSync(genWranglerPath)) {
  let g = readFileSync(genWranglerPath, 'utf8')
  g = g.replace(/const DEFAULT_SITE_ID = 'supsfactory'/, "const DEFAULT_SITE_ID = '" + siteId + "'")
  writeFileSync(genWranglerPath, g)
}

const deployYmlPath = join(OUT, '.github/workflows/deploy.yml')
if (existsSync(deployYmlPath)) {
  let d = readFileSync(deployYmlPath, 'utf8')
  d = d.replaceAll('supsfactory', siteId)
  writeFileSync(deployYmlPath, d)
}

// ── Step 7b: Generate B2B product layer from templates ──────────────────────

console.log('  Generating B2B product layer...')
const TPL = resolve(scriptDir, 'templates')
const hasEs = (cfg.active_locales || ['en']).includes('es')

function esBlock(varName) {
  return hasEs ? 'es: ' + varName + ',' : ''
}

function fillTemplate(tplStr, vars) {
  let s = tplStr
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll('{{' + k + '}}', String(v || ''))
  }
  // Remove remaining {{...}} placeholders
  s = s.replaceAll(/\{\{[^}]+\}\}/g, "''")
  return s
}

// --- brand-constants.ts (already handled but ensure clean) ---
writeFileSync(join(OUT, 'src/product/brand-constants.ts'),
  "export const PRODUCT_TAGLINE =\n  '" + (cfg.tagline || '') + "'\n\n" +
  "export const PRODUCT_DESCRIPTION =\n  '" + (cfg.description || '') + "'\n\n" +
  "export const PRODUCT_BOILERPLATE =\n  '" + (cfg.boilerplate || '') + "'\n\n" +
  "export const PRODUCT_BUILD_LINE =\n  '" + (cfg.build_line || '') + "'\n\n" +
  "export const PRODUCT_NOT_ROB =\n  '" + (cfg.not_rob || '') + "'\n\n" +
  "export const PRODUCT_OG_IMAGE_FILENAME = '" + (cfg.og_image_filename || 'og-default') + "'\n")

// --- facts.ts ---
const certsArray = (cfg.certifications || []).map(c =>
  '    { name: "' + (c.name || '') + '", scope: "' + (c.scope || '') + '", authority: "", appliesTo: "", verifiedSource: "certificate" as VerifiedSource }'
).join(',\n')
const inspectorsArray = JSON.stringify(cfg.third_party_inspectors || [])
if (existsSync(join(TPL, 'product/facts.ts'))) {
  let facts = readFileSync(join(TPL, 'product/facts.ts'), 'utf8')
  facts = fillTemplate(facts, {
    FACTS_VERIFIED: new Date().toISOString().slice(0, 10),
    factory_size: cfg.factory_size || '',
    workers_count: cfg.workers_count || '',
    annual_capacity: cfg.annual_capacity || '',
    moq_existing: cfg.moq_existing || '',
    moq_pilot: cfg.moq_pilot || '',
    moq_standard: cfg.moq_standard || '',
    moq_custom: cfg.moq_custom || '',
    moq_note: cfg.moq_note || 'MOQ is confirmed after specification review.',
    moq_note_es: cfg.moq_note || 'El MOQ se confirma tras la revisión de especificaciones.',
    lead_time: cfg.lead_time || '',
    sample_time: cfg.sample_time || '',
    certifications_array: '[' + (certsArray ? '\n' + certsArray + '\n  ' : '') + ']',
    export_countries: cfg.export_countries || '',
    workshops: cfg.workshops || '',
    production_lines: cfg.production_lines || '',
    monthly_capacity: cfg.monthly_capacity || '',
    nda_window: cfg.nda_window || '',
    quality_gates: cfg.quality_gates || '',
    inspectors_array: inspectorsArray,
    tagline: cfg.tagline || '',
    tagline_es: '',
  })
  writeFileSync(join(OUT, 'src/product/facts.ts'), facts)
}

// --- content.ts ---
const heroStats = (cfg.hero_stats || []).map(s =>
  '      { value: \'' + (s.value || '') + '\', label: \'' + (s.label || '') + '\' }'
).join(',\n')
const faqItems = (cfg.faqs || []).map(f =>
  "    { q: '" + (f.q || '').replace(/'/g, "\\'") + "', a: '" + (f.a || '').replace(/'/g, "\\'") + "' }"
).join(',\n')
const serveSegments = (cfg.solutions || []).map(s =>
  "      { icon: 'building-2', label: '" + (s.nav_label || '') + "', href: '/solutions/" + (s.slug || '') + "' }"
).join(',\n')
const productItems = (cfg.product_series || []).map(s =>
  "      { name: '" + (s.name || '') + "', tagline: '" + (s.tagline || '') + "', href: '/products/" + (s.slug || '') + "' }"
).join(',\n')

const locDefs = hasEs ? "  es: T\n" : ""
const esPlaceholder = hasEs ? "es: {}," : ""

if (existsSync(join(TPL, 'product/content.ts'))) {
  let content = readFileSync(join(TPL, 'product/content.ts'), 'utf8')
  content = fillTemplate(content, {
    localized_locales: locDefs,
    hero_kicker: cfg.hero_kicker || '',
    hero_title_pre: cfg.hero_title_pre || 'Custom',
    hero_title_accent: cfg.hero_title_accent || 'Product Manufacturing for Brands & Distributors',
    hero_title_post: cfg.hero_title_post || '',
    hero_sub: cfg.hero_sub || '',
    hero_cta_primary: cfg.hero_cta_primary || 'Start Your Project',
    hero_cta_secondary: cfg.hero_cta_secondary || 'View Factory & Quality Evidence',
    hero_stats_array: '[' + (heroStats ? '\n' + heroStats + '\n    ' : '') + ']',
    site_name: siteName,
    hero_es: esPlaceholder,
    why_es: esPlaceholder,
    trust_es: esPlaceholder,
    serve_segments: '[' + (serveSegments ? '\n' + serveSegments + '\n  ' : '') + ']',
    serve_es: esPlaceholder,
    capability_es: esPlaceholder,
    quality_es: esPlaceholder,
    commercial_es: esPlaceholder,
    products_items: '[' + (productItems ? '\n' + productItems + '\n  ' : '') + ']',
    products_es: esPlaceholder,
    faq_items: '[' + (faqItems ? '\n' + faqItems + '\n  ' : '') + ']',
    faq_es: esPlaceholder,
    cta_es: esPlaceholder,
    solve_es: esPlaceholder,
    studio_es: esPlaceholder,
    video_es: esPlaceholder,
    works_es: esPlaceholder,
    platforms_es: esPlaceholder,
    gallery_es: esPlaceholder,
    guides_es: esPlaceholder,
    mfguides_es: esPlaceholder,
    valueprop_es: esPlaceholder,
    boundary_es: esPlaceholder,
    about_es: esPlaceholder,
    customizer_es: esPlaceholder,
    productspage_es: esPlaceholder,
    catalog_es: esPlaceholder,
    gallerypage_es: esPlaceholder,
    servepage_es: esPlaceholder,
    workspage_es: esPlaceholder,
    series_es: esPlaceholder,
    product_type_plural: cfg.product_type_plural || 'products',
  })
  writeFileSync(join(OUT, 'src/product/content.ts'), content)
}

// --- solution-pages.ts ---
const solutionsEn = (cfg.solutions || []).map(s => {
  const ctaLevel = s.cta_level || 'warm'
  return "    {\n" +
    "      slug: '" + s.slug + "',\n" +
    "      navLabel: '" + (s.nav_label || '') + "',\n" +
    "      metaTitle: '" + (s.title || '') + "',\n" +
    "      metaDescription: '" + (s.description || '') + "',\n" +
    "      kicker: '" + (s.nav_label || '') + "',\n" +
    "      h1: '" + (s.title || '') + "',\n" +
    "      serviceType: '" + (s.title || '') + "',\n" +
    "      answer: '" + (s.description || '') + "',\n" +
    "      intro: ['" + (s.description || '') + "'],\n" +
    "      scenario: { title: 'Your challenge', body: '' },\n" +
    "      pairs: [],\n" +
    "      steps: [],\n" +
    "      caseStudy: { title: '', body: '', tags: [] },\n" +
    "      faqs: [],\n" +
    "      ctaLevel: '" + ctaLevel + "' as CtaLevel,\n" +
    "    }"
}).join(',\n')

if (existsSync(join(TPL, 'product/solution-pages.ts'))) {
  let sol = readFileSync(join(TPL, 'product/solution-pages.ts'), 'utf8')
  sol = fillTemplate(sol, {
    solutions_en: '[' + (solutionsEn ? '\n' + solutionsEn + '\n' : '') + ']',
    solutions_es: hasEs ? 'es: [],' : '',
  })
  writeFileSync(join(OUT, 'src/product/solution-pages.ts'), sol)
}

// --- series-pages.ts ---
const seriesEn = (cfg.product_series || []).map(s =>
  "    {\n" +
    "      slug: '" + s.slug + "',\n" +
    "      name: '" + (s.name || '') + "',\n" +
    "      tagline: '" + (s.tagline || '') + "',\n" +
    "      metaTitle: '" + (s.name || '') + "',\n" +
    "      metaDescription: '" + (s.tagline || '') + "',\n" +
    "      heroKicker: '" + (s.name || '') + "',\n" +
    "      heroH1: '" + (s.name || '') + "',\n" +
    "      intro: '" + (s.tagline || '') + "',\n" +
    "      features: [],\n" +
    "      specs: [],\n" +
    "      faqs: [],\n" +
    "    }"
).join(',\n')

if (existsSync(join(TPL, 'product/series-pages.ts'))) {
  let ser = readFileSync(join(TPL, 'product/series-pages.ts'), 'utf8')
  ser = fillTemplate(ser, {
    series_en: '[' + (seriesEn ? '\n' + seriesEn + '\n' : '') + ']',
    series_es: hasEs ? 'es: [],' : '',
  })
  writeFileSync(join(OUT, 'src/product/series-pages.ts'), ser)
}

// --- index.ts + dictionary ---
if (existsSync(join(TPL, 'product/index.ts'))) {
  writeFileSync(join(OUT, 'src/product/index.ts'), readFileSync(join(TPL, 'product/index.ts'), 'utf8'))
}
if (existsSync(join(TPL, 'dictionary/index.ts'))) {
  mkdirSync(join(OUT, 'src/product/dictionary'), { recursive: true })
  writeFileSync(join(OUT, 'src/product/dictionary/index.ts'), readFileSync(join(TPL, 'dictionary/index.ts'), 'utf8'))
}
if (existsSync(join(TPL, 'dictionary/merge.ts'))) {
  mkdirSync(join(OUT, 'src/product/dictionary'), { recursive: true })
  writeFileSync(join(OUT, 'src/product/dictionary/merge.ts'), readFileSync(join(TPL, 'dictionary/merge.ts'), 'utf8'))
}

// --- Other template files (simple fill) ---
const simpleTemplates = [
  'product/knowledge.ts', 'product/projects.ts', 'product/procurement.ts',
  'product/ai-content.ts', 'product/llms-content.ts', 'product/edge-redirects.ts',
  'product/route-registry.ts', 'product/asset-map.ts', 'product/product-jsonld.ts',
  'product/entity-data.ts', 'product/glossary.ts', 'product/site-config.ts',
  'product/guide-content.ts', 'product/hub-pages.ts',
]

const templateVars = {
  site_name: siteName,
  site_domain: siteDomain,
  tagline: cfg.tagline || '',
  description: cfg.description || '',
  llm_site_description: cfg.llm_site_description || '',
  llm_faq_description: cfg.llm_faq_description || '',
  ai_system_role: cfg.ai_system_role || '',
  product_image_path: cfg.product_image_path || 'images/products',
  industry: cfg.industry || 'manufacturing',
  industry_adjective: cfg.industry_adjective || 'industrial',
  product_type: cfg.product_type || 'product',
  product_type_plural: cfg.product_type_plural || 'products',
  product_slug: cfg.product_slug || 'products',
  knowledge_es: hasEs ? 'es: [],' : '',
  projects_es: hasEs ? 'es: [],' : '',
  procurement_es: hasEs ? 'es: [],' : '',
  commercial_rows_es: hasEs ? 'es: [],' : '',
  guides_locale: hasEs ? 'es: [],' : '',
  guides_es_locale: hasEs ? 'es: [],' : '',
  guidecards_locale: hasEs ? 'es: [],' : '',
}

for (const rel of simpleTemplates) {
  const tplPath = join(TPL, rel)
  const outPath = join(OUT, 'src', rel)
  if (existsSync(tplPath)) {
    let content = readFileSync(tplPath, 'utf8')
    content = fillTemplate(content, templateVars)
    mkdirSync(resolve(outPath, '..'), { recursive: true })
    writeFileSync(outPath, content)
  }
}

// --- Dictionary files ---
const dictTemplates = ['dictionary/en-ui.ts', 'dictionary/es-ui.ts', 'dictionary/en-product.ts', 'dictionary/es-product.ts']
for (const rel of dictTemplates) {
  const tplPath = join(TPL, rel)
  const outPath = join(OUT, 'src/product', rel)
  if (existsSync(tplPath)) {
    let content = readFileSync(tplPath, 'utf8')
    content = fillTemplate(content, templateVars)
    mkdirSync(resolve(outPath, '..'), { recursive: true })
    writeFileSync(outPath, content)
  }
}

// --- Content YAML files ---
const contentTemplates = ['content/pages.yaml', 'content/faqs.yaml', 'content/research.yaml']
for (const rel of contentTemplates) {
  const tplPath = join(TPL, rel)
  const outPath = join(OUT, 'src/content/site/site', rel.split('/').pop())
  if (existsSync(tplPath)) {
    let content = readFileSync(tplPath, 'utf8')
    content = fillTemplate(content, templateVars)
    mkdirSync(resolve(outPath, '..'), { recursive: true })
    writeFileSync(outPath, content)
  }
}

// --- Remove SUP-specific content files ---
console.log('  Removing SUP-specific content...')
const supPaths = [
  'src/content/site/products', 'src/content/site/news', 'src/content/site/case-use',
  'src/content/site/technology', 'src/product/geo',
]
for (const rel of supPaths) {
  const p = join(OUT, rel)
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true })
  }
}

// Create empty content dirs (Vite globs need them to exist)
for (const rel of ['src/content/site/products', 'src/content/site/news', 'src/content/site/technology', 'src/content/site/case-use']) {
  const p = join(OUT, rel)
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
  const gitkeep = join(p, '.gitkeep')
  if (!existsSync(gitkeep)) writeFileSync(gitkeep, '')
}

// Remove SUP-named page YAML files
const sitePagesDir = join(OUT, 'src/content/site/pages')
if (existsSync(sitePagesDir)) {
  for (const f of readdirSync(sitePagesDir)) {
    if (f.match(/sup|paddle|inflatable.*board|drop.stitch/i)) {
      rmSync(join(sitePagesDir, f), { force: true })
    }
  }
}

// Remove SUP-named route files
const routesDir = join(OUT, 'src/routes')
if (existsSync(routesDir)) {
  for (const f of readdirSync(routesDir)) {
    if (f.match(/sup|paddle/i)) {
      rmSync(join(routesDir, f), { force: true })
    }
  }
}

// ── Step 8: .dev.vars.example ───────────────────────────────────────────────

writeFileSync(join(OUT, '.dev.vars.example'),
  '# -- Required --\n' +
  'BETTER_AUTH_SECRET=replace-with-32+char-random-string\n' +
  'BETTER_AUTH_URL=http://localhost:3000\n\n' +
  '# -- Email (Resend) --\n' +
  'RESEND_API_KEY=\n' +
  'EMAIL_FROM=' + siteName + ' <onboarding@resend.dev>\n' +
  'RESEND_AUDIENCE_ID=\n\n' +
  '# -- Social OAuth --\n' +
  'GOOGLE_CLIENT_ID=\n' +
  'GOOGLE_CLIENT_SECRET=\n' +
  'GITHUB_CLIENT_ID=\n' +
  'GITHUB_CLIENT_SECRET=\n\n' +
  '# -- Admin --\n' +
  'ADMIN_EMAILS=\n\n' +
  '# -- Optional --\n' +
  'TURNSTILE_SITE_KEY=\n' +
  'TURNSTILE_SECRET_KEY=\n' +
  'CF_ANALYTICS_TOKEN=\n' +
  '# GA4_MEASUREMENT_ID=G-XXXXXXXXXX\n' +
  'SENTRY_DSN=\n' +
  'REINDEX_TOKEN=\n')

// ── Step 9: package.json ────────────────────────────────────────────────────

console.log('  Generating package.json...')
writeFileSync(join(OUT, 'package.json'), JSON.stringify({
  name: siteId,
  private: true,
  type: 'module',
  packageManager: 'pnpm@10.33.1',
  scripts: {
    dev: 'vite dev --port 3000',
    build: 'vite build',
    preview: 'pnpm build && vite preview',
    test: 'vitest run',
    'test:watch': 'vitest',
    e2e: 'playwright test',
    typecheck: 'fumadocs-mdx && tsc --noEmit',
    postinstall: 'fumadocs-mdx',
    'deploy:staging': 'CLOUDFLARE_ENV=staging pnpm build && wrangler deploy',
    'deploy:prod': 'CLOUDFLARE_ENV=production pnpm build && wrangler deploy',
    'deploy:purge': 'node scripts/purge-cache.mjs',
    'deploy:prod:all': 'pnpm deploy:prod && pnpm deploy:purge',
    'cf-typegen': 'wrangler types',
    lint: 'eslint .',
    'db:generate': 'drizzle-kit generate',
    'db:migrate:local': 'wrangler d1 migrations apply ${npm_config_site_id:-' + siteId + '}-db --local',
    'db:migrate:staging': 'wrangler d1 migrations apply ${npm_config_site_id:-' + siteId + '}-db-staging --env staging --remote',
    'db:migrate:prod': 'wrangler d1 migrations apply ${npm_config_site_id:-' + siteId + '}-db-prod --env production --remote',
    'upload:site-assets': 'node scripts/upload-site-assets.mjs',
  },
}, null, 2))

// ── Step 9b: Global brand replacement pass ─────────────────────────────────
// After all files are in place, do a global replace of Afarer→factoryName
// and supsfactory→siteId / SUPsfactory→siteName across all source files.
// This catches references in YAML content, framework code, comments, etc.

console.log('  Running global brand replacement pass...')
const factoryName = cfg.factory_name || siteName
const brandReplacements = [
  ['Afarer', factoryName],
  ['vectoflare', factoryName.toLowerCase()],
  ['SUPsfactory', siteName],
  ['supsfactory', siteId],
]
const brandSkipExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.avif', '.webp', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.zip', '.tar', '.gz', '.lock'])
const brandSkipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.hvigor'])

function applyBrandReplacements(dir) {
  if (brandSkipDirs.has(basename(dir))) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      applyBrandReplacements(full)
      continue
    }
    const ext = extname(entry.name)
    if (brandSkipExts.has(ext)) continue
    try {
      let content = readFileSync(full, 'utf8')
      let changed = false
      for (const [old, rep] of brandReplacements) {
        if (content.includes(old)) {
          content = content.replaceAll(old, rep)
          changed = true
        }
      }
      if (changed) writeFileSync(full, content)
    } catch { /* binary or unreadable — skip */ }
  }
}
applyBrandReplacements(OUT)

// ── Step 10: README ─────────────────────────────────────────────────────────

console.log('  Generating README...')
writeFileSync(join(OUT, 'README.md'),
  '# ' + siteName + '\n\n> ' + (cfg.tagline || '') + '\n\n## Quick Start\n\n```bash\npnpm install\ncp .dev.vars.example .dev.vars\npnpm db:migrate:local\npnpm db:seed:framework:local\npnpm dev\n```\n\n## Deploy to Cloudflare\n\n1. Create Cloudflare resources:\n   ```bash\n   wrangler d1 create ' + siteId + '-db\n   wrangler kv namespace create CACHE\n   wrangler r2 bucket create ' + siteId + '-files\n   ```\n\n2. Set GitHub repo secrets + variables, then push to main.\n\n3. Or use: `node deploy.mjs`\n\n## Architecture\n\n5-layer decoupling - swap `src/product/` and `src/config/` to launch a new site.\n\n| Layer | Location | Purpose |\n|-------|----------|--------|\n| Product | `src/product/` | Brand data, content, AI prompts |\n| Config | `src/config/` | SITE_ID, domain, locales, feature flags |\n| Foundation | `src/features/` | Auth, search, AI, SEO, inquiry, admin |\n| Platform | Cloudflare D1+KV+R2+Workers | Edge runtime + storage |\n| Infra | GitHub Actions CI/CD | Build > Deploy > Cache warm |\n\n## Customization\n\nEdit `site.config.yaml` and run `node scaffold.mjs` to regenerate.\n')

console.log('\nScaffold complete!\n')
console.log('Next steps:')
console.log('  1. pnpm install')
console.log('  2. cp .dev.vars.example .dev.vars  # fill in your secrets')
console.log('  3. pnpm db:migrate:local')
console.log('  4. pnpm dev                        # start dev server on :3000')
console.log('')
console.log('To deploy to production:')
console.log('  node deploy.mjs                    # GitHub sync + Cloudflare deploy')
console.log('  node deploy.mjs --init-cloudflare  # create CF resources first')
