import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { getGeoEntity } from '@/features/content/loader'
import { SITE_NAME } from '@/config/site'
import { BRAND_PARENT_BRAND, BRAND_COMPANY_NAME, BRAND_BOILERPLATE, BRAND_PARENT_URL } from '@/config/branding'
import { ENTITY_KNOWS_ABOUT, ENTITY_SUBJECT_OF } from '@/product/entity-data'
import { PARENT_ORG_DESCRIPTION } from '@/product/ai-content'
import {
  brandHeritageLd,
  enhancedFaqLd,
  factoryCapabilitiesLd,
  shippingLogisticsLd,
  warrantyReturnsLd,
} from '@/features/seo/jsonld'

/**
 * `/entity.json` — schema.org Organization entity that describes the factory
 * and brand behind Vectoflare (ported from the vectoflare GEO dataset). Served as
 * structured JSON for AI answer engines and knowledge graphs. The canonical
 * `@id`/`url` are rewritten to this site's origin.
 */
const handler = () => {
  const entity = getGeoEntity()
  if (!entity) {
    return new Response('{"error":"entity unavailable"}', {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const out = JSON.parse(JSON.stringify(entity)) as Record<string, unknown>
  if (typeof out['@id'] === 'string') out['@id'] = `${origin}/#organization`
  if (typeof out.url === 'string') out.url = origin
  out.name = SITE_NAME
  out.description = BRAND_BOILERPLATE
  out.parentOrganization = {
    '@type': 'Organization',
    name: BRAND_COMPANY_NAME,
    sameAs: BRAND_PARENT_URL,
  }
  out.department = {
    '@type': 'Organization',
    name: BRAND_PARENT_BRAND,
    description: PARENT_ORG_DESCRIPTION,
    sameAs: BRAND_PARENT_URL,
  }
  out.knowsAbout = ENTITY_KNOWS_ABOUT
  out.subjectOf = ENTITY_SUBJECT_OF.map((s) => ({
    '@type': s.type,
    name: s.name,
    url: `${origin}${s.path}`,
  }))
  // GEO 扩展实体（与 jsonld.tsx 的每页 JSON-LD 同源，口径与 /factory、/quality、/warranty 页面一致）
  out.brandHeritage = brandHeritageLd()
  out.factoryCapabilities = factoryCapabilitiesLd()
  out.enhancedFaq = enhancedFaqLd()
  out.warranty = warrantyReturnsLd()
  out.shippingLogistics = shippingLogisticsLd()
  return new Response(JSON.stringify(out, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}

export const Route = createFileRoute('/entity.json')({
  server: { handlers: { GET: handler } },
})