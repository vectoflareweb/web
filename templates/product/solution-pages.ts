import type { Locale } from '@/features/i18n/locale'
import type { Localized } from './content'

export type CtaLevel = 'cold' | 'warm' | 'hot'

export interface SolutionPageData {
  slug: string
  navLabel: string
  metaTitle: string
  metaDescription: string
  kicker: string
  h1: string
  serviceType: string
  answer: string
  intro: string[]
  scenario: { title: string; body: string }
  pairs: { problem: string; solution: string }[]
  steps: { title: string; body: string }[]
  caseStudy: { title: string; body: string; tags: string[] }
  faqs: { q: string; a: string }[]
  ctaLevel: CtaLevel
  ctaLabel?: string
}

export const SOLUTION_PATHS: string[] = []

export function solutionPath(slug: string): string {
  return '/solutions/' + slug
}

export const solutionPages: Localized<SolutionPageData[]> = {
  en: [],
  es: [],
}

export function getSolutionPage(locale: Locale, slug: string): SolutionPageData | undefined {
  return solutionPages[locale].find(p => p.slug === slug)
}
