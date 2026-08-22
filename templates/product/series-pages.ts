import type { Locale } from '@/features/i18n/locale'

export interface SeriesPageData {
  slug: string
  title: string
  description: string
  products: string[]
}

export const seriesPages: Record<Locale, SeriesPageData[]> = {
  en: [],
  es: [],
}

export function getSeriesPage(locale: Locale, slug: string): SeriesPageData | undefined {
  return seriesPages[locale].find(p => p.slug === slug)
}
