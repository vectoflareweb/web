import { createServerFn } from '@tanstack/react-start'

/**
 * Cloudflare Web Analytics beacon token (public). Returns null when unset, so
 * the beacon is simply not injected — privacy-friendly, free, zero-config, and
 * degrades gracefully like every other optional integration.
 *
 * Get a token at: Cloudflare dashboard → Analytics & Logs → Web Analytics.
 */
export const getAnalyticsToken = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => {
    // Lazy env import (repo convention): keeps cloudflare:workers out of node test graphs.
    const { env } = await import('@/lib/env')
    return env.CF_ANALYTICS_TOKEN || null
  },
)

/**
 * GA4 measurement ID (public, e.g. G-XXXXXXXXXX). Returns null when unset, so
 * no gtag script is injected — same graceful degradation as every other
 * optional integration. Conversion events (generate_lead) only fire when gtag
 * is actually present, so the site works identically without GA4.
 */
export const getGa4MeasurementId = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => {
    const { env } = await import('@/lib/env')
    return env.GA4_MEASUREMENT_ID || null
  },
)
