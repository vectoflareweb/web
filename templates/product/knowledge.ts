import type { Locale } from '@/features/i18n/locale'
import type { Localized } from './content'

export interface KnowledgeArticle {
  slug: string
  navLabel: string
  metaTitle: string
  metaDescription: string
  kicker: string
  h1: string
  intro: string
  sections: { title: string; body: string[] }[]
}

export interface KnowledgeMeta {
  slug: string
  navLabel: string
  metaTitle: string
  metaDescription: string
  kicker: string
}

export const knowledge: Localized<KnowledgeArticle[]> = {
  en: [],
  es: [],
}

export function getArticle(locale: Locale, slug: string): KnowledgeArticle | undefined {
  return knowledge[locale].find(a => a.slug === slug)
}

export const knowledgeMeta: Localized<KnowledgeMeta[]> = {
  en: [],
  es: [],
}
