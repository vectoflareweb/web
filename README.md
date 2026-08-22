# WebModel — B2B Website Template

> Configurable B2B website template with 5-layer architecture. Edit `site.config.yaml`, run `node scaffold.mjs`, deploy to Cloudflare Workers.

## Quick Start

```bash
pnpm install
cp .dev.vars.example .dev.vars       # fill in your secrets
pnpm db:migrate:local
pnpm dev
```

## Deploy to Cloudflare

```bash
node scaffold.mjs                    # generate from site.config.yaml
node deploy.mjs --init-cloudflare    # create D1, KV, R2, Vectorize (first time)
node deploy.mjs --set-secrets        # push .dev.vars secrets to Worker
node deploy.mjs                      # sync to GitHub + deploy to Cloudflare
node deploy.mjs --sync-only          # push to GitHub only
node deploy.mjs --deploy-only        # deploy to Cloudflare only
```

## Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| Product | `src/product/` | Brand data, content, AI prompts |
| Config | `src/config/` | SITE_ID, domain, locales, feature flags |
| Foundation | `src/features/` | Auth, search, AI, SEO, inquiry, admin |
| Platform | Cloudflare D1+KV+R2+Workers | Edge runtime + storage |
| Infra | GitHub Actions CI/CD | Build → Deploy → Cache warm |

## Customization

Edit `site.config.yaml` and run `node scaffold.mjs` to regenerate. Brand replacements are applied globally:

| Source | Config key | Example |
|--------|-----------|---------|
| `Afarer` / `afarer` | `factory_name` | `Vectoflare` |
| `SUPsfactory` | `site_name` | `Vectoflare` |
| `supsfactory` | `site_id` | `vectoflare` |

---

# Cloudflare Setup Guide

## 1. Create a Cloudflare API Token

Go to **[Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)** → Create Token.

### Recommended: Use the "Edit Cloudflare Workers" template

Click **"Edit Cloudflare Workers"** template, then add the following extra permissions:

| Permission | Resource | Access | Why |
|-----------|----------|--------|-----|
| Account → **D1** | Edit | Create/manage databases, apply migrations |
| Account → **Workers R2 Storage** | Edit | Upload site assets (images, PDFs) |
| Account → **Workers KV Storage** | Edit | Edge cache management |
| Account → **Vectorize** | Edit | AI knowledge index (paid plan) |
| Account → **Account Analytics** | Read | Performance monitoring |
| Zone → **Cache Purge** | Purge | Clear CDN cache after deploy |
| Zone → **Zone** | Read | Zone lookup for cache purge |

### Full permission list

| Category | Permission | Resource | Access |
|----------|-----------|----------|--------|
| Account | Cloudflare Pages | Edit | — |
| Account | D1 | Edit | — |
| Account | Workers R2 Storage | Edit | — |
| Account | Workers KV Storage | Edit | — |
| Account | Workers Scripts | Edit | — |
| Account | Workers Routes | Edit | — |
| Account | Vectorize | Edit | — |
| Account | Account Analytics | Read | — |
| Zone | Cache Purge | Purge | — |
| Zone | Zone | Read | — |

**Zone Resources**: Include → Specific zone → `yourdomain.com` (or All zones)

### Get your Account ID

Find it at: **Cloudflare Dashboard** → your domain → right sidebar → **Account ID**.

Or via API:
```bash
curl -sS https://api.cloudflare.com/client/v4/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.result[0].id'
```

---

## 2. Create Cloudflare Resources

Run once (auto-creates D1, KV, R2, Vectorize):

```bash
node deploy.mjs --init-cloudflare
```

Or manually:

```bash
# D1 databases
wrangler d1 create myproduct-db-prod
wrangler d1 create myproduct-db-staging
wrangler d1 create myproduct-db

# KV namespaces
wrangler kv namespace create CACHE --env production
wrangler kv namespace create CACHE --env staging

# R2 buckets
wrangler r2 bucket create myproduct-files
wrangler r2 bucket create myproduct-files-staging
wrangler r2 bucket create myproduct-files-prod

# Vectorize (paid plan only)
wrangler vectorize create myproduct-knowledge --dimensions=1024 --metric=cosine
wrangler vectorize create myproduct-knowledge-staging --dimensions=1024 --metric=cosine
wrangler vectorize create myproduct-knowledge-prod --dimensions=1024 --metric=cosine
```

After creation, update `site.config.yaml` with the returned resource IDs:
- `cf_prod_d1_id` → D1 production database ID
- `cf_prod_kv_id` → KV production namespace ID
- `cf_prod_d1_name` → D1 production database name (e.g. `myproduct-db-prod`)

---

# GitHub Configuration Guide

## GitHub Secrets (encrypted, not visible in logs)

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

### Required (deployment will not work without these)

| Secret | Description | How to get |
|--------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (see above) | CF Dashboard → Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | CF Dashboard → domain → sidebar |

### Required (Worker runtime — auth will fail without these)

| Secret | Description | Example |
|--------|-------------|---------|
| `BETTER_AUTH_SECRET` | Random 32+ char string for session signing | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Production auth callback URL | `https://yourdomain.com` |

### Email (Resend)

| Secret | Description | How to get |
|--------|-------------|------------|
| `RESEND_API_KEY` | Resend API key for transactional email | [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | Sender address | `MyProduct <onboarding@resend.dev>` |
| `RESEND_AUDIENCE_ID` | Resend audience for waitlist | Resend Dashboard → Audiences |

### Social OAuth (optional — skip to disable social login)

| Secret | Description | How to get |
|--------|-------------|------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same as above |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | [GitHub Settings](https://github.com/settings/developers) → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Same as above |

### Security & Monitoring (optional)

| Secret | Description | How to get |
|--------|-------------|------------|
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (bot protection) | CF Dashboard → Turnstile |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | Same as above |
| `ADMIN_EMAILS` | Comma-separated admin email list | `admin@example.com,owner@example.com` |
| `CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics token | CF Dashboard → Web Analytics |
| `SENTRY_DSN` | Sentry error tracking DSN | [sentry.io](https://sentry.io) → Project → DSN |
| `REINDEX_TOKEN` | Bearer token for /api/reindex endpoint | Any random string |

---

## GitHub Variables (non-secret, readable in workflows)

Go to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → **New repository variable**.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CF_PROD_D1_ID` | Yes | D1 production database UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `CF_PROD_KV_ID` | Yes | KV production namespace ID | `a1b2c3d4e5f67890abcdef1234567890` |
| `CF_PROD_D1_NAME` | Yes | D1 production database name | `myproduct-db-prod` |
| `CF_PROD_DOMAIN` | Yes | Production domain | `yourdomain.com` |
| `CF_VECTORIZE_INDEX` | Paid plan | Vectorize index name prefix | `myproduct-knowledge` |

---

## Quick Setup Summary

```bash
# 1. Generate secrets
openssl rand -hex 32    # → BETTER_AUTH_SECRET

# 2. Set GitHub secrets (one command each)
gh secret set CLOUDFLARE_API_TOKEN -b "your-token"
gh secret set CLOUDFLARE_ACCOUNT_ID -b "your-account-id"
gh secret set BETTER_AUTH_SECRET -b "generated-secret"
gh secret set BETTER_AUTH_URL -b "https://yourdomain.com"

# 3. Set GitHub variables
gh variable set CF_PROD_D1_ID -b "d1-uuid-from-wrangler"
gh variable set CF_PROD_KV_ID -b "kv-id-from-wrangler"
gh variable set CF_PROD_D1_NAME -b "myproduct-db-prod"
gh variable set CF_PROD_DOMAIN -b "yourdomain.com"

# 4. Push to main — GitHub Actions auto-deploys
git push origin main
```

---

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to `main` | Build → Migrate D1 → Deploy Worker → Sync secrets → Purge cache → Warm cache |
| `ci.yml` | PR to `main` | Type check + lint |
| `ai-index.yml` | Manual / cron | Reindex Vectorize knowledge base |
| `cf-inspect.yml` | Manual | Inspect Worker deployment status |
| `website-performance.yml` | Manual | Lighthouse performance audit |

All workflows gracefully skip if `CLOUDFLARE_API_TOKEN` is not configured — no red crosses on forks or unconfigured repos.
