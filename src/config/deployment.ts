/**
 * Deployment configuration — Cloudflare resource naming and GitHub CI/CD.
 *
 * All Cloudflare resource names (D1, KV, R2, Vectorize, Worker) are derived
 * from SITE_ID so that each product deployment has isolated resources.
 *
 * gen-wrangler.mjs reads GitHub repository variables for actual resource IDs;
 * the naming conventions below define the expected patterns.
 *
 * To deploy a new product: change SITE_ID in site.ts; the resource names
 * below update automatically. Then create the actual Cloudflare resources
 * matching these names and set their IDs as GitHub repository variables.
 */

import { SITE_ID } from './site'

export const CF_WORKER_NAME = SITE_ID
export const CF_WORKER_NAME_STAGING = `${SITE_ID}-staging`
export const CF_WORKER_NAME_PRODUCTION = `${SITE_ID}-production`

export const CF_D1_NAME = `${SITE_ID}-db`
export const CF_D1_NAME_STAGING = `${SITE_ID}-db-staging`
export const CF_D1_NAME_PRODUCTION = `${SITE_ID}-db-prod`

export const CF_R2_BUCKET = `${SITE_ID}-files`
export const CF_R2_BUCKET_STAGING = `${SITE_ID}-files-staging`
export const CF_R2_BUCKET_PRODUCTION = `${SITE_ID}-files-prod`

export const CF_KV_NAME = `${SITE_ID}-cache`

export const CF_VECTORIZE_INDEX = `${SITE_ID}-knowledge`
export const CF_VECTORIZE_INDEX_STAGING = `${SITE_ID}-knowledge-staging`
export const CF_VECTORIZE_INDEX_PRODUCTION = `${SITE_ID}-knowledge-prod`

export const CF_ASSETS_BUCKET = `${SITE_ID}-assets`

export interface DeploymentConfig {
  workerName: string
  workerNameStaging: string
  workerNameProduction: string
  d1Name: string
  d1NameStaging: string
  d1NameProduction: string
  r2Bucket: string
  r2BucketStaging: string
  r2BucketProduction: string
  kvName: string
  vectorizeIndex: string
  vectorizeIndexStaging: string
  vectorizeIndexProduction: string
  assetsBucket: string
}

export const deploymentConfig: DeploymentConfig = {
  workerName: CF_WORKER_NAME,
  workerNameStaging: CF_WORKER_NAME_STAGING,
  workerNameProduction: CF_WORKER_NAME_PRODUCTION,
  d1Name: CF_D1_NAME,
  d1NameStaging: CF_D1_NAME_STAGING,
  d1NameProduction: CF_D1_NAME_PRODUCTION,
  r2Bucket: CF_R2_BUCKET,
  r2BucketStaging: CF_R2_BUCKET_STAGING,
  r2BucketProduction: CF_R2_BUCKET_PRODUCTION,
  kvName: CF_KV_NAME,
  vectorizeIndex: CF_VECTORIZE_INDEX,
  vectorizeIndexStaging: CF_VECTORIZE_INDEX_STAGING,
  vectorizeIndexProduction: CF_VECTORIZE_INDEX_PRODUCTION,
  assetsBucket: CF_ASSETS_BUCKET,
} as const

/**
 * GitHub repository variable names used by gen-wrangler.mjs and deploy.yml.
 * These are identifiers (not secrets) stored in Settings → Variables.
 *
 * Required variables:
 * - CF_PROD_D1_ID: Cloudflare D1 database ID for production
 * - CF_PROD_KV_ID: Cloudflare KV namespace ID for production
 * - CF_PROD_DOMAIN: Production domain (e.g., myproduct.com)
 *
 * Optional variables (defaults derived from SITE_ID if not set):
 * - CF_PROD_D1_NAME: D1 database name for migrations (default: ${SITE_ID}-db-prod)
 * - CF_PROD_R2_BUCKET: R2 bucket name for files
 * - CF_PROD_VECTORIZE_INDEX: Vectorize index base name (default: ${SITE_ID}-knowledge)
 * - CF_STAGING_D1_ID: D1 database ID for staging
 * - CF_STAGING_KV_ID: KV namespace ID for staging
 * - CF_STAGING_DOMAIN: Staging domain
 */
export const CF_REPO_VARS = {
  prodD1Id: 'CF_PROD_D1_ID',
  prodD1Name: 'CF_PROD_D1_NAME',
  prodKVId: 'CF_PROD_KV_ID',
  prodDomain: 'CF_PROD_DOMAIN',
  prodR2Bucket: 'CF_PROD_R2_BUCKET',
  prodVectorizeIndex: 'CF_PROD_VECTORIZE_INDEX',
  stagingD1Id: 'CF_STAGING_D1_ID',
  stagingKVId: 'CF_STAGING_KV_ID',
  stagingDomain: 'CF_STAGING_DOMAIN',
} as const

/**
 * GitHub repository secret names.
 * These are sensitive values stored in Settings → Secrets.
 */
export const CF_REPO_SECRETS = [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'RESEND_AUDIENCE_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'ADMIN_EMAILS',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'CF_ANALYTICS_TOKEN',
  'SENTRY_DSN',
  'REINDEX_TOKEN',
] as const

/**
 * Secrets that should be synced to the Worker via `wrangler secret put`.
 * CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are CI-only credentials
 * and must NEVER be synced into the Worker runtime.
 */
export const ALLOWED_WORKER_SECRETS = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'RESEND_AUDIENCE_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'ADMIN_EMAILS',
  'TURNSTILE_SITE_KEY',
  'TURNSTILE_SECRET_KEY',
  'CF_ANALYTICS_TOKEN',
  'SENTRY_DSN',
  'REINDEX_TOKEN',
] as const
