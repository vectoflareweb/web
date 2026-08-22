# MyProduct

> Your brand tagline — one compelling sentence.

## Quick Start

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm db:seed:framework:local
pnpm dev
```

## Deploy to Cloudflare

1. Create Cloudflare resources:
   ```bash
   wrangler d1 create myproduct-db
   wrangler kv namespace create CACHE
   wrangler r2 bucket create myproduct-files
   ```

2. Set GitHub repo secrets + variables, then push to main.

3. Or use: `node deploy.mjs`

## Architecture

5-layer decoupling - swap `src/product/` and `src/config/` to launch a new site.

| Layer | Location | Purpose |
|-------|----------|--------|
| Product | `src/product/` | Brand data, content, AI prompts |
| Config | `src/config/` | SITE_ID, domain, locales, feature flags |
| Foundation | `src/features/` | Auth, search, AI, SEO, inquiry, admin |
| Platform | Cloudflare D1+KV+R2+Workers | Edge runtime + storage |
| Infra | GitHub Actions CI/CD | Build > Deploy > Cache warm |

## Customization

Edit `site.config.yaml` and run `node scaffold.mjs` to regenerate.
