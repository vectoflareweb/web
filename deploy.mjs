#!/usr/bin/env node
/**
 * WebModel — Deploy Script
 *
 * Syncs the generated project to GitHub and deploys to Cloudflare Workers.
 *
 * Usage:
 *   node deploy.mjs                          # full deploy (sync + deploy)
 *   node deploy.mjs --sync-only              # only push to GitHub
 *   node deploy.mjs --deploy-only            # only deploy to Cloudflare
 *   node deploy.mjs --init-cloudflare        # create CF resources (D1, KV, R2)
 *   node deploy.mjs --set-secrets            # set Worker secrets from .dev.vars
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const syncOnly = args.includes('--sync-only')
const deployOnly = args.includes('--deploy-only')
const initCloudflare = args.includes('--init-cloudflare')
const setSecrets = args.includes('--set-secrets')

// ── Minimal YAML parser (same as scaffold.mjs) ─────────────────────────────

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

    if (trimmed.startsWith('- ')) {
      const val = trimmed.slice(2).trim().replace(/^["']+|["']+$/g, '')
      let listHolder = stack[stack.length - 1]
      if (stack.length >= 2 && listHolder._listParentKey) {
        const parentScope = stack[stack.length - 2]
        const parentKey = listHolder._listParentKey
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

const HERE = resolve(import.meta.dirname ?? '.')
const configPath = resolve(HERE, 'site.config.yaml')
if (!existsSync(configPath)) {
  console.error('site.config.yaml not found.')
  process.exit(1)
}

const cfg = parseYaml(readFileSync(configPath, 'utf8'))
const siteId = cfg.site_id || 'myproduct'
const siteDomain = cfg.site_domain || 'myproduct.com'
const siteName = cfg.site_name || 'MyProduct'

function run(cmd, opts = {}) {
  console.log('  $ ' + cmd)
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim()
  } catch (err) {
    console.error('  x Failed: ' + cmd)
    if (err.stderr) console.error('    ' + err.stderr.toString().split('\n')[0])
    if (opts.allowFail) return null
    process.exit(1)
  }
}

// ── Initialize Cloudflare Resources ────────────────────────────────────────

if (initCloudflare) {
  console.log('\nCreating Cloudflare resources for ' + siteId + '...\n')

  console.log('Creating D1 databases...')
  const d1Prod = run('wrangler d1 create ' + siteId + '-db-prod', { allowFail: true })
  const d1Staging = run('wrangler d1 create ' + siteId + '-db-staging', { allowFail: true })
  const d1Dev = run('wrangler d1 create ' + siteId + '-db', { allowFail: true })

  function extractId(output, pattern) {
    if (!output) return null
    const m = output.match(pattern)
    return m ? m[1] : null
  }

  const prodD1Id = extractId(d1Prod, /database_id\s*=\s*"?([0-9a-f-]+)"?/i)
  const stagingD1Id = extractId(d1Staging, /database_id\s*=\s*"?([0-9a-f-]+)"?/i)

  console.log('Creating KV namespaces...')
  const kvProd = run('wrangler kv namespace create CACHE --env production', { allowFail: true })
  const kvStaging = run('wrangler kv namespace create CACHE --env staging', { allowFail: true })

  const prodKVId = extractId(kvProd, /id\s*=\s*"?([0-9a-f]+)"?/i)
  const stagingKVId = extractId(kvStaging, /id\s*=\s*"?([0-9a-f]+)"?/i)

  console.log('Creating R2 buckets...')
  run('wrangler r2 bucket create ' + siteId + '-files', { allowFail: true })
  run('wrangler r2 bucket create ' + siteId + '-files-staging', { allowFail: true })
  run('wrangler r2 bucket create ' + siteId + '-files-prod', { allowFail: true })

  if (cfg.cf_plan === 'paid') {
    console.log('Creating Vectorize indexes...')
    run('wrangler vectorize create ' + siteId + '-knowledge --dimensions=1024 --metric=cosine', { allowFail: true })
    run('wrangler vectorize create ' + siteId + '-knowledge-staging --dimensions=1024 --metric=cosine', { allowFail: true })
    run('wrangler vectorize create ' + siteId + '-knowledge-prod --dimensions=1024 --metric=cosine', { allowFail: true })
  } else {
    console.log('Skipping Vectorize (free plan — AI uses keyword search).')
  }

  // Update site.config.yaml with resource IDs
  let configText = readFileSync(configPath, 'utf8')
  if (prodD1Id) configText = configText.replace(/cf_prod_d1_id: ".*"/, 'cf_prod_d1_id: "' + prodD1Id + '"')
  if (prodKVId) configText = configText.replace(/cf_prod_kv_id: ".*"/, 'cf_prod_kv_id: "' + prodKVId + '"')
  if (stagingD1Id) configText = configText.replace(/cf_staging_d1_id:.*/, 'cf_staging_d1_id: "' + stagingD1Id + '"')
  if (stagingKVId) configText = configText.replace(/cf_staging_kv_id:.*/, 'cf_staging_kv_id: "' + stagingKVId + '"')
  writeFileSync(configPath, configText)

  console.log('\nCloudflare resources created!')
  if (prodD1Id) console.log('  D1 production ID: ' + prodD1Id)
  if (prodKVId) console.log('  KV production ID: ' + prodKVId)
  console.log('\nRun `node scaffold.mjs` then `node deploy.mjs` to deploy.')
  process.exit(0)
}

// ── Set Worker Secrets ──────────────────────────────────────────────────────

if (setSecrets) {
  console.log('\nSetting Worker secrets for ' + siteId + '-production...\n')

  const devVarsPath = resolve(HERE, '.dev.vars')
  if (!existsSync(devVarsPath)) {
    console.error('.dev.vars not found. Create it from .dev.vars.example first.')
    process.exit(1)
  }

  const devVars = readFileSync(devVarsPath, 'utf8')
  const secrets = {}
  for (const line of devVars.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (val) secrets[key] = val
  }

  const tmpSecrets = resolve(HERE, '.tmp-secrets.json')
  writeFileSync(tmpSecrets, JSON.stringify(secrets, null, 2))
  run('npx wrangler secret bulk ' + tmpSecrets + ' --env production')
  run('rm ' + tmpSecrets)

  console.log('\nWorker secrets set!')
  process.exit(0)
}

// ── Sync to GitHub ──────────────────────────────────────────────────────────

if (!deployOnly) {
  console.log('\nSyncing to GitHub...\n')

  const gitDir = join(HERE, '.git')
  if (!existsSync(gitDir)) {
    run('git init')
    run('git add -A')
    run('git commit -m "Initial commit: ' + siteName + ' website"')
  } else {
    run('git add -A')
    const status = run('git status --porcelain')
    if (status) {
      run('git commit -m "Update ' + siteName + ' site"')
    } else {
      console.log('  No changes to commit.')
    }
  }

  const githubRepo = cfg.github_repo || siteId + '/' + siteId
  const remoteCheck = run('git remote get-url origin', { allowFail: true })

  if (!remoteCheck) {
    console.log('Creating GitHub repo: ' + githubRepo)
    const visibility = cfg.cf_plan === 'paid' ? 'private' : 'public'
    run('gh repo create ' + githubRepo + ' --' + visibility + ' --source=. --push')
  } else {
    run('git push origin ' + (cfg.github_branch || 'main'))
  }

  // Set GitHub repo variables
  console.log('Setting GitHub repo variables...')
  const repoFlag = '-R ' + githubRepo
  if (cfg.cf_prod_d1_id) run('gh variable set CF_PROD_D1_ID --body "' + cfg.cf_prod_d1_id + '" ' + repoFlag, { allowFail: true })
  if (cfg.cf_prod_kv_id) run('gh variable set CF_PROD_KV_ID --body "' + cfg.cf_prod_kv_id + '" ' + repoFlag, { allowFail: true })
  run('gh variable set CF_PROD_DOMAIN --body "' + (cfg.cf_prod_domain || siteDomain) + '" ' + repoFlag, { allowFail: true })
  if (cfg.cf_prod_d1_name) run('gh variable set CF_PROD_D1_NAME --body "' + cfg.cf_prod_d1_name + '" ' + repoFlag, { allowFail: true })

  console.log('Synced to GitHub!')
}

// ── Deploy to Cloudflare ────────────────────────────────────────────────────

if (!syncOnly) {
  console.log('\nDeploying to Cloudflare...\n')

  // Generate wrangler.jsonc
  const wranglerExample = join(HERE, 'wrangler.example.jsonc')
  const wranglerOut = join(HERE, 'wrangler.jsonc')

  if (existsSync(wranglerExample)) {
    let text = readFileSync(wranglerExample, 'utf8')
    const cfD1Id = cfg.cf_prod_d1_id || process.env.CF_PROD_D1_ID
    const cfKVId = cfg.cf_prod_kv_id || process.env.CF_PROD_KV_ID
    const cfDomain = cfg.cf_prod_domain || siteDomain

    if (cfD1Id) {
      const prodIdx = text.indexOf('"production"')
      if (prodIdx !== -1) {
        const head = text.slice(0, prodIdx)
        let prod = text.slice(prodIdx)
        prod = prod.replace('00000000-0000-0000-0000-000000000000', cfD1Id)
        if (cfKVId) prod = prod.replace('00000000000000000000000000000000', cfKVId)
        if (cfDomain) {
          prod = prod.replace(
            new RegExp('"name": "' + siteId + '-production",'),
            '"name": "' + siteId + '-production",\n\t\t\t"routes": [{ "pattern": "' + cfDomain + '", "custom_domain": true }],'
          )
        }
        text = head + prod
      }
    }
    writeFileSync(wranglerOut, text)
    console.log('  Generated wrangler.jsonc')
  }

  // Install dependencies
  if (!existsSync(join(HERE, 'node_modules'))) {
    console.log('  Installing dependencies...')
    run('pnpm install')
  }

  // Build
  console.log('  Building...')
  run('pnpm build', { env: { ...process.env, CLOUDFLARE_ENV: 'production' } })

  // D1 migrations
  console.log('  Applying D1 migrations...')
  const d1Name = cfg.cf_prod_d1_name || siteId + '-db-prod'
  run('npx wrangler d1 migrations apply "' + d1Name + '" --env production --remote', { allowFail: true })

  // Deploy
  console.log('  Deploying Worker...')
  run('npx wrangler deploy')

  // Warm edge cache
  console.log('  Warming edge cache...')
  const domain = cfg.cf_prod_domain || siteDomain
  const nonDefaultLocales = (cfg.active_locales || []).filter(l => l !== (cfg.default_locale || 'en'))
  for (const path of ['/', ...nonDefaultLocales.map(l => '/' + l)]) {
    const url = 'https://' + domain + path
    run('curl -sS -o /dev/null -w "%{http_code}" "' + url + '"', { allowFail: true })
  }

  console.log('\nDeployed to Cloudflare!')
  console.log('  Production URL: https://' + domain)
}

if (!syncOnly && !deployOnly) {
  console.log('\n' + siteName + ' is live!\n')
}
