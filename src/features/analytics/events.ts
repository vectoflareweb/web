/**
 * GA4 conversion events — client-side only. Every tracker is a no-op when gtag
 * is absent (GA4_MEASUREMENT_ID not configured), preserving graceful
 * degradation: the marketing site behaves identically with or without GA4.
 */

type Gtag = {
  (command: 'config' | 'js' | 'event' | 'set' | 'get', ...args: unknown[]): void
  (command: 'event', eventName: string, params?: Record<string, unknown>): void
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

/** `generate_lead` — fires from inquiry and catalog form successes. */
export function trackLead(source: string) {
  if (!window.gtag) return
  window.gtag('event', 'generate_lead', { currency: 'USD', value: 0, lead_source: source, event_category: 'lead' })
}

/** SPA page_view — called on route changes; gtag('config') already fired the first view. */
export function trackPageView(pagePath: string) {
  if (!window.gtag) return
  window.gtag('event', 'page_view', { page_path: pagePath })
}