import type { Locale } from '@/features/i18n/locale'
import type { Localized } from './content'

export interface ProjectData {
  slug: string
  navLabel: string
  metaTitle: string
  metaDescription: string
  kicker: string
  h1: string
  intro: string[]
  customerType: string
  region: string
  productCategory: string
  projectStage: string
  manufacturingScope: string
  keyRequirements: string
  qualityFocus: string
  industry: string
  requirement: string
  challenge: string
  solution: string
  product: string
  process: { title: string; body: string }[]
  result: string
  outcome: string
  customizations: string[]
  inspectionFocus: string[]
  confidentiality: string
  tags: string[]
  metrics?: { value: string; label: string }[]
  takeaways?: string[]
}

export interface ProjectsMeta {
  slug: string
  navLabel: string
  metaTitle: string
  metaDescription: string
  h1: string
  image: string
}

export const projects: Localized<ProjectData[]> = {
  en: [],
  es: [],
}

export function getProject(locale: Locale, slug: string): ProjectData | undefined {
  return projects[locale].find(p => p.slug === slug)
}

export const projectsMeta: Localized<ProjectsMeta[]> = {
  en: [],
  es: [],
}
