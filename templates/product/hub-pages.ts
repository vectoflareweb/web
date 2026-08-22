import type { Locale } from '@/features/i18n/locale'

export interface HubEntry {
  url: string
  title: string
  excerpt: string
  content?: string
}

export function buildHubEntries(locale: Locale): HubEntry[] {
  return []
}
