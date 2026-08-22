/**
 * Config layer — re-exports from individual config modules.
 *
 * This is the single import point for all configuration.
 * Code should import from '@/config' instead of individual modules
 * or hardcoded values.
 */

export { siteConfig, SITE_ID, SITE_NAME, SITE_DOMAIN, SITE_URL, SITE_TAGLINE, SITE_DESCRIPTION, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './site'
export type { SiteConfig, SiteLocale } from './site'

export { BRAND_LOGO_URL, BRAND_FAVICON_ICO, BRAND_FAVICON_SVG, BRAND_OG_IMAGE, BRAND_HERO_IMAGE, BRAND_HERO_IMAGE_768, BRAND_HERO_IMAGE_480, BRAND_HERO_IMAGE_WEBP, BRAND_ASSETS_CDN, BRAND_SOCIAL, BRAND_CONTACT, BRAND_BOILERPLATE, BRAND_BUILD_LINE, BRAND_NOT_ROB, BRAND_COMPANY_NAME, BRAND_PARENT_BRAND } from './branding'

export { features, isFeatureEnabled } from './features'
export type { FeatureFlags } from './features'

export { deploymentConfig, CF_WORKER_NAME, CF_WORKER_NAME_STAGING, CF_WORKER_NAME_PRODUCTION, CF_D1_NAME, CF_D1_NAME_STAGING, CF_D1_NAME_PRODUCTION, CF_R2_BUCKET, CF_R2_BUCKET_STAGING, CF_R2_BUCKET_PRODUCTION, CF_KV_NAME, CF_VECTORIZE_INDEX, CF_VECTORIZE_INDEX_STAGING, CF_VECTORIZE_INDEX_PRODUCTION, CF_ASSETS_BUCKET, CF_REPO_VARS, CF_REPO_SECRETS, ALLOWED_WORKER_SECRETS } from './deployment'
export type { DeploymentConfig } from './deployment'

export { SUPPORTED_LOCALES as LOCALES, DEFAULT_LOCALE as CONFIG_DEFAULT_LOCALE, ACTIVE_LOCALES, OG_LOCALE, HREFLANG, isLocale, localizePath, stripDefaultLocalePrefix, negotiateLocale } from './locales'
export type { Locale } from './locales'

export { LEGACY_REDIRECTS, GONE_PATHS } from './navigation'
