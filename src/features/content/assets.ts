/**
 * Central asset URL rewrite.
 *
 * Migrated content may keep legacy asset hotlinks from a parent brand CDN.
 * At every render boundary we map those onto our own R2-backed CDN. Refs
 * that point at files missing from the source tree are remapped to a real
 * sibling image so the site never renders a broken asset.
 *
 * The prefix, subdir, and missing-image map come from src/product/asset-map
 * so that different products can supply their own asset structure.
 */

import { BRAND_ASSETS_CDN, BRAND_PARENT_DOMAIN } from '@/config/branding'
import { ASSET_CDN_PREFIX, ASSET_LEGACY_SUBDIR, MISSING_IMAGE_MAP } from '@/product/asset-map'

const CDN_BASE = BRAND_ASSETS_CDN
const LEGACY_PREFIX = `https://assets.${BRAND_PARENT_DOMAIN}/images/${ASSET_LEGACY_SUBDIR}`

export function assetUrl(url: string): string {
  if (!url || !url.startsWith(LEGACY_PREFIX)) return url
  const rel = url.slice(LEGACY_PREFIX.length)
  return `${CDN_BASE}/${ASSET_CDN_PREFIX}${MISSING_IMAGE_MAP[rel] ?? rel}`
}
