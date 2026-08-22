/**
 * Feature flags — toggle individual features on/off per product deployment.
 */

export const features = {
  auth: true,
  search: true,
  ai: true,
  inquiry: true,
  waitlist: true,
  feedback: true,
  changelog: true,
  docs: true,
  analytics: true,
  audience: true,
  storage: true,
  email: true,
  maintenance: true,
  theme: true,
  seo: true,
} as const

export type FeatureFlags = typeof features

export function isFeatureEnabled<K extends keyof FeatureFlags>(key: K): boolean {
  return features[key]
}
