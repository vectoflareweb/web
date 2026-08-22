/**
 * Site configuration — single source of truth for all site-wide constants.
 *
 * This module defines the SITE_ID, domain, name, and other identifiers that
 * vary per product deployment. Code must import from here instead of
 * hardcoding brand names, domains, or Cloudflare resource names.
 *
 * Values are set at build time; runtime code reads them via the exported
 * constants. To deploy a new product, change these values (and the
 * corresponding Cloudflare/GitHub resources).
 */

import { PRODUCT_TAGLINE, PRODUCT_DESCRIPTION } from '@/product/brand-constants'

export const SITE_ID = 'myproduct' as const

export const SITE_NAME = 'MyProduct' as const

export const SITE_DOMAIN = 'myproduct.com' as const

export const SITE_URL = `https://${SITE_DOMAIN}` as const

export const SITE_TAGLINE = PRODUCT_TAGLINE as typeof PRODUCT_TAGLINE

export const SITE_DESCRIPTION = PRODUCT_DESCRIPTION as typeof PRODUCT_DESCRIPTION

export const DEFAULT_LOCALE = 'en' as const

export const SUPPORTED_LOCALES = [
  'en',
  'es',
] as const

export type SiteLocale = (typeof SUPPORTED_LOCALES)[number]

export interface SiteConfig {
  id: typeof SITE_ID
  name: typeof SITE_NAME
  domain: typeof SITE_DOMAIN
  url: typeof SITE_URL
  tagline: typeof SITE_TAGLINE
  description: typeof SITE_DESCRIPTION
  defaultLocale: typeof DEFAULT_LOCALE
  locales: readonly SiteLocale[]
}

export const siteConfig: SiteConfig = {
  id: SITE_ID,
  name: SITE_NAME,
  domain: SITE_DOMAIN,
  url: SITE_URL,
  tagline: SITE_TAGLINE,
  description: SITE_DESCRIPTION,
  defaultLocale: DEFAULT_LOCALE,
  locales: SUPPORTED_LOCALES,
} as const
